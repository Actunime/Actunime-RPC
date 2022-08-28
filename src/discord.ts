import * as DiscordRPC from 'discord-rpc';
import { Low } from '@commonify/lowdb';
import * as log from 'electron-log';

class RPC {
    public app: Electron.App;
    public client: DiscordRPC.Client;
    public db: Low<{ [key: string]: any; }>
    constructor(app: Electron.App, db: Low<{ [key: string]: any; }>) {
        try {
            this.app = app;
            this.db = db;
            const config = db.data;
            if (!config['set-rpc-id']) return;
            this.client = new DiscordRPC.Client({ transport: 'ipc' });
            this.login();
            this.client.on('ready', () => {
                log.log('client RPC prêt');
                if (Object.keys(config).length) {
                    this.setStatus();
                }
            })
        } catch (err) {
            log.error("ipc", err.toString());
            this.reload();
        }
    }

    public reloadTimeout?: NodeJS.Timeout;

    public async reload() {
        try {
            console.log('reload')
            clearTimeout(this.reloadTimeout);
            clearTimeout(this.retryTimeout);
            await this.db.read();
            const config = this.db.data;
            if (!config['set-rpc-id']) {
                if (this.client) this.client?.destroy()?.catch(() => { });
                return;
            }
            if (this.client) this.client?.destroy()?.catch(() => { });
            this.reloadTimeout = setTimeout(async () => {
                this.client = new DiscordRPC.Client({ transport: 'ipc' });
                this.client.on('ready', () => {
                    log.log('client RPC prêt');
                    if (Object.keys(config).length) {
                        this.setStatus();
                    }
                })
                await this.login();
            }, 10000);
        } catch (err) {
            log.error(err);
        }
    }
    public timeout = 5000;
    public retryCount = 0;
    public retryTimeout?: NodeJS.Timeout;
    public async login() {
        try {
            const config = this.db.data;
            if (!config['set-rpc-id']) return;
            await this.client.login({ clientId: config['set-rpc-id'] });
            log.log('client RPC connecté');
            console.log('connecté');
        } catch (err) {
            this.retryCount++;
            console.log("connexion impossible", `tantative ${this.retryCount}`, err.toString());
            log.error("connexion a discord impossible", `tantative ${this.retryCount}`, err);
            if (!this.client.user) return this.reload();
            this.retryTimeout = setTimeout(() => {
                this.timeout = this.timeout + this.timeout;
                if (this.retryCount === 6) {
                    clearTimeout(this.retryTimeout);
                    return;
                }
                this.login();
            }, this.timeout)
        }
    }
    public async setStatus(data?: { details?: string, state?: string, startTimestamp?: number, buttons?: { label: string, url: string }[] }) {
        try {
            if (!this.client) return;
            await this.db.read();
            const config = this.db.data;
            let buttons = [
                ...(data?.buttons?.[0] ? [{ ...data?.buttons[0] }] : config['set-rpc-btn1'] ? [{ label: config['set-rpc-btn1'], url: config['set-rpc-btn-link1'] }] : []),
                ...(data?.buttons?.[1] ? [{ ...data?.buttons[1] }] : config['set-rpc-btn2'] ? [{ label: config['set-rpc-btn2'], url: config['set-rpc-btn-link2'] }] : [])
            ]

            await this.client.setActivity({
                details: data?.details || config['set-rpc-desc1'],
                state: data?.state || config['set-rpc-desc2'],
                ...config['set-rpc-img1'] ? { largeImageKey: config['set-rpc-img1'] } : {},
                ...config['set-rpc-img-text1'] ? { largeImageText: config['set-rpc-img-text1'] } : {},
                ...config['set-rpc-img2'] ? { smallImageKey: config['set-rpc-img2'] } : {},
                ...config['set-rpc-img-text2'] ? { smallImageText: config['set-rpc-img-text2'] } : {},
                ...buttons.length ? { buttons } : {},
                ...data?.startTimestamp ? { startTimestamp: data?.startTimestamp } : {}
            });

            log.log('client RPC le statut a été mise a jour.');
        } catch (err) {
            log.error("Erreur lors de la mise a jour du statut", err);
        }
    }
}

export default RPC;