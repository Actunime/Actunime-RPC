import * as DiscordRPC from 'discord-rpc';
import { Low } from '@commonify/lowdb';
import * as log from 'electron-log';

interface RPCActivity {
    details?: string;
    state?: string;
    startTimestamp?: number;
    endTimestamp?: number;
    largeImageKey?: string;
    largeImageText?: string;
    smallImageKey?: string;
    smallImageText?: string;
    instance?: boolean;
    buttons?: { label: string; url: string }[];
}

interface RPCStatusData {
    details?: string;
    state?: string;
    startTimestamp?: number;
    buttons?: { label: string; url: string }[];
}

class RPC {
    public app: Electron.App;
    public client: DiscordRPC.Client;
    public db: Low<{ [key: string]: any }>;
    private timeout = 5000;
    private retryCount = 0;
    private retryTimeout?: NodeJS.Timeout;
    private reloadTimeout?: NodeJS.Timeout;

    constructor(app: Electron.App, db: Low<{ [key: string]: any }>) {
        this.app = app;
        this.db = db;

        const config = db.data;
        if (!config || !config['set-rpc-id']) {
            log.warn('Aucun client ID Discord RPC configuré.');
            return;
        }

        this.client = new DiscordRPC.Client({ transport: 'ipc' });

        this.client.on('ready', () => {
            log.log('Client Discord RPC prêt.');
            this.setStatus().catch((err) => log.error('Erreur lors de la mise à jour du statut au démarrage', err));
        });

        this.login().catch((err) => {
            log.error('Échec de la connexion initiale:', err);
            this.reload();
        });
    }

    public async reload(): Promise<void> {
        try {
            log.log('Rechargement du client Discord RPC...');
            clearTimeout(this.reloadTimeout);
            clearTimeout(this.retryTimeout);
            await this.db.read();
            const config = this.db.data;
            if (!config || !config['set-rpc-id']) {
                await this.client.destroy().catch(() => {});
                return;
            }
            await this.client.destroy().catch(() => {});

            this.reloadTimeout = setTimeout(async () => {
                this.client = new DiscordRPC.Client({ transport: 'ipc' });
                this.client.on('ready', () => {
                    log.log('Client Discord RPC prêt après reload.');
                    this.setStatus().catch((err) => log.error('Erreur lors de la mise à jour du statut après reload', err));
                });
                await this.login();
            }, 10000);
        } catch (err) {
            log.error('Erreur pendant le reload:', err);
        }
    }

    public async login(): Promise<void> {
        try {
            const config = this.db.data;
            if (!config || !config['set-rpc-id']) {
                log.warn('Client ID Discord RPC manquant lors de la connexion.');
                return;
            }
            await this.client.login({ clientId: config['set-rpc-id'] });
            log.log('Client Discord RPC connecté.');
            this.retryCount = 0;
            this.timeout = 5000;
        } catch (err) {
            this.retryCount++;
            log.error(`Tentative ${this.retryCount} de connexion échouée:`, err);
            if (!this.client.user) {
                await this.reload();
                return;
            }
            if (this.retryCount < 6) {
                this.timeout *= 2;
                this.retryTimeout = setTimeout(() => {
                    this.login().catch((error) => log.error('Nouvelle tentative de connexion échouée:', error));
                }, this.timeout);
            } else {
                log.error('Nombre maximal de tentatives de connexion atteint.');
            }
        }
    }

    public async setStatus(data?: RPCStatusData): Promise<void> {
        try {
            if (!this.client) {
                log.warn('Aucun client Discord RPC disponible pour mettre à jour le statut.');
                return;
            }
            await this.db.read();
            const config = this.db.data;
            if (!config) {
                log.warn('Aucune configuration disponible.');
                return;
            }

            const buttons = [
                ...(data?.buttons?.[0]
                    ? [{ ...data.buttons[0] }]
                    : config['set-rpc-btn1']
                        ? [{ label: config['set-rpc-btn1'], url: config['set-rpc-btn-link1'] }]
                        : []),
                ...(data?.buttons?.[1]
                    ? [{ ...data.buttons[1] }]
                    : config['set-rpc-btn2']
                        ? [{ label: config['set-rpc-btn2'], url: config['set-rpc-btn-link2'] }]
                        : []),
            ];

            const activity: RPCActivity = {
                details: data?.details || config['set-rpc-desc1'],
                state: data?.state || config['set-rpc-desc2'],
                ...(config['set-rpc-img1'] ? { largeImageKey: config['set-rpc-img1'] } : {}),
                ...(config['set-rpc-img-text1'] ? { largeImageText: config['set-rpc-img-text1'] } : {}),
                ...(config['set-rpc-img2'] ? { smallImageKey: config['set-rpc-img2'] } : {}),
                ...(config['set-rpc-img-text2'] ? { smallImageText: config['set-rpc-img-text2'] } : {}),
                ...(buttons.length ? { buttons } : {}),
                ...(data?.startTimestamp ? { startTimestamp: data.startTimestamp } : {}),
            };

            await this.client.setActivity(activity as any);
            log.log('Statut Discord RPC mis à jour.');
        } catch (err) {
            log.error('Erreur lors de la mise à jour du statut Discord RPC:', err);
        }
    }
}

export default RPC;