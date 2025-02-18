import { EventEmitter } from 'events';
import axios from 'axios';

export interface streamInfo {
    user_login: string;
    user_name: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: Date;
    thumbnail_url: string;
}

class Twitch extends EventEmitter {
    public clientID = "3x68mems6suc5g0u1s1uctdhv9vdlk";
    public clientSecret = "ng9hizfpy634gyy6ffg2jdhd1ebyhx";
    public user?: string;
    public streamOn = false;
    public interval?: NodeJS.Timer;

    constructor(user?: string) {
        super();
        if (user) {
            this.user = user;
            this.getStream()
                .then((data) => {
                    if (data) {
                        this.streamOn = true;
                        this.emit('streaming', data);
                        this.autoCheckStream();
                    }
                })
                .catch((err) =>
                    console.error("Erreur initiale lors de la récupération du stream:", err)
                );
        }
    }

    public async changeStreamer(user: string): Promise<void> {
        try {
            console.log("Changement de streamer...");
            if (this.interval) clearInterval(this.interval);
            this.emit('streamStop');
            this.user = user;
            const data = await this.getStream();
            if (data) {
                this.streamOn = true;
                this.emit('streaming', data);
                this.autoCheckStream();
            }
        } catch (err) {
            console.error("Erreur lors du changement de streamer:", err);
            throw new Error("Le streamer spécifié n'existe peut-être pas.");
        }
    }

    private async getAccessToken() {
        // eslint-disable-next-line no-useless-catch
        try {
            const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: this.clientID,
                    client_secret: this.clientSecret,
                    grant_type: 'client_credentials'
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return res.data;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public async verifyValidUser(user?: string) {
        const tokenData = await this.getAccessToken();
        // eslint-disable-next-line no-useless-catch
        try {
            const res = await axios.get('https://api.twitch.tv/helix/users', {
                params: { login: user || this.user },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "Client-Id": this.clientID
                }
            });
            return res.data.data[0];
        } catch (err) {
            throw err;
        }
    }

    public async getStream(user?: string): Promise<streamInfo | null> {
        const tokenData = await this.getAccessToken();
        // eslint-disable-next-line no-useless-catch
        try {
            const res = await axios.get('https://api.twitch.tv/helix/streams', {
                params: { user_login: user || this.user },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${tokenData.access_token}`,
                    "Client-Id": this.clientID
                }
            });
            return res.data.data[0] || null;
        } catch (err) {
            throw err;
        }
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    public autoCheckStream() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(async () => {
            try {
                const data = await this.getStream();
                if (data) {
                    if (!this.streamOn) {
                        this.streamOn = true;
                        this.emit('streaming', data);
                    } else {
                        this.emit('streaming', data);
                    }
                } else if (this.streamOn) {
                    this.streamOn = false;
                    this.emit('streamStop');
                }
            } catch (err) {
                console.error("Erreur lors de la vérification du stream:", err);
            }
        }, 60000);
    }
}

export default Twitch;