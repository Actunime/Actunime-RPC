import * as DiscordRPC from 'discord-rpc';
import { LocalStorage } from 'node-localstorage';
const db = new LocalStorage('./db');
import { Notification } from "electron";

class RPC {
    public app: Electron.App;
    public client: DiscordRPC.Client;
    public config = db.getItem('conf') ? JSON.parse(db.getItem('conf')) : {};
    constructor(app: Electron.App) {
        this.app = app;
        this.client = new DiscordRPC.Client({ transport: 'ipc' });
        this.login();
        this.client.on('ready', () => {
            if (Object.keys(this.config).length) {
                this.setStatus();
            }
        })
    }
    public async reload() {
        let config = db.getItem('conf') ? JSON.parse(db.getItem('conf')) : {};
        await this.client.destroy()
        this.client = new DiscordRPC.Client({ transport: 'ipc' });
        this.login();
        this.client.on('ready', () => {
            if (Object.keys(config).length) {
                this.setStatus();
            }
        })
    }
    public timeout = 5000;
    public retryCount = 0;
    public async login() {
        try {
            let config = db.getItem('conf') ? JSON.parse(db.getItem('conf')) : {};
            await this.client.login({ clientId: config['set-rpc-id'] });
        } catch (err) {
            // retry
            setTimeout(() => {
                this.timeout = this.timeout + this.timeout;
                this.retryCount++;
                if (this.retryCount === 6) {
                    new Notification({ title: "Actunime", body: "L'application s'est fermé après 5 tantative de connexion avec Discord qui ont échoué." }).show();
                    this.app.quit();
                }
                this.login();
            }, this.timeout)
        }
    }
    setStatus() {
        let config = db.getItem('conf') ? JSON.parse(db.getItem('conf')) : {};
        let buttons = [
            ...config['set-rpc-btn1'] ? [{ label: config['set-rpc-btn1'], url: config['set-rpc-btn-link1'] }] : [],
            ...config['set-rpc-btn2'] ? [{ label: config['set-rpc-btn2'], url: config['set-rpc-btn-link2'] }] : []
        ]
        this.client.setActivity({
            details: config['set-rpc-desc1'],
            state: config['set-rpc-desc2'],
            ...config['set-rpc-img1'] ? { largeImageKey: config['set-rpc-img1'] } : {},
            ...config['set-rpc-img-text1'] ? { largeImageText: config['set-rpc-img-text1'] } : {},
            ...config['set-rpc-img2'] ? { smallImageKey: config['set-rpc-img2'] } : {},
            ...config['set-rpc-img-text2'] ? { smallImageText: config['set-rpc-img-text2'] } : {},
            ...buttons.length ? { buttons } : {}
        });
    }
}

export default RPC;