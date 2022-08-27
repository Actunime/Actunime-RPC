import axios from 'axios';
import { EventEmitter } from 'events'


export interface streamInfo {
    user_login: string,
    user_name: string,
    game_name: string,
    type: string,
    title: string,
    viewer_count: number,
    started_at: Date,
    thumbnail_url: string
}

declare interface Twitch {
    on(event: 'streaming', listener: (data: streamInfo) => void): this;
    on(event: 'streamStop', listener: () => void): this;
    emit(event: 'streaming', arg: streamInfo): boolean;
    emit(event: 'streamStop'): boolean;
    // on(event: string, listener: Function): this;
}


class Twitch extends EventEmitter {
    public clientID = "3x68mems6suc5g0u1s1uctdhv9vdlk";
    public clientSecret = "ng9hizfpy634gyy6ffg2jdhd1ebyhx"
    public user: string;
    public streamOn: boolean = false;
    constructor(user?: string) {
        super()
        this.user = user;
        if (user) {
            this.getStream().then((data) => {
                if (data) {
                    this.streamOn = true;
                    this.emit('streaming', data);
                    this.autoCheckStream();
                }
            })
        }
    }

    public async changeStreamer(user: string) {
        try {
            console.log("changement d'utilisateur")
            clearInterval(this.interval);
            this.emit('streamStop');
            this.user = user;
            let data = await this.getStream()
            if (data) {
                this.streamOn = true;
                this.emit('streaming', data);
                this.autoCheckStream();
            }
        } catch (err) {
            console.log(err);
            throw "Le streamer spécifié, il n'existe peut être pas !?"
        }
    }

    public async getAccesToken() {
        try {
            let res = await axios({
                method: 'POST',
                url: `https://id.twitch.tv/oauth2/token?client_id=${this.clientID}&client_secret=${this.clientSecret}&grant_type=client_credentials`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return res.data;
        } catch (err) {
            throw err;
        }
    }

    public async verifyValidUser(user?: string) {
        let generateToken = await this.getAccesToken();
        try {
            let res = await axios({
                method: 'GET',
                url: `https://api.twitch.tv/helix/users?login=${(user || this.user)}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${generateToken.access_token}`,
                    "Client-Id": this.clientID
                },
            });

            return res?.data?.data[0];
        } catch (err) {
            throw err;
        }
    }

    public async getStream(user?: string): Promise<streamInfo | undefined | null> {
        let generateToken = await this.getAccesToken();
        try {
            let res = await axios({
                method: 'GET',
                url: `https://api.twitch.tv/helix/streams?user_login=${(user || this.user)}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${generateToken.access_token}`,
                    "Client-Id": this.clientID
                },
            });

            return res?.data?.data[0];
        } catch (err) {
            throw err;
        }
    }

    public interval?: NodeJS.Timer;

    public async autoCheckStream() {
        clearInterval(this.interval);
        this.interval = setInterval(async () => {
            let data = await this.getStream();
            if (data) {
                this.streamOn = true;
                this.emit('streaming', data);
            } else if (this.streamOn) {
                this.streamOn = false;
                this.emit('streamStop');
            }
        }, 1000 * 60);
    }
}

export default Twitch;