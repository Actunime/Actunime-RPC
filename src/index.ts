import Electron, { app, Menu, Tray, BrowserWindow, ipcMain, Notification, dialog } from "electron";
import * as path from "path";
import RPC from "./discord";
import appConfig from './config.json';
import Twitch, { streamInfo } from "./twitch";
import unhandled from 'electron-unhandled';
import { Low, JSONFile } from '@commonify/lowdb';
import { join } from 'path';

app.disableHardwareAcceleration();

unhandled({
  showDialog: false,
  logger: (err) => {
    console.log(err)
  }
})

process.on('uncaughtException', function (error) {
  if (appConfig.dev) console.log(error);
})

process.on('unhandledRejection', function (error) {
  if (appConfig.dev) console.log(error);
})

process.on('uncaughtExceptionMonitor', () => { })

const showNofifBg = () => new Notification({
  title: appConfig.name,
  body: `${appConfig.name} est ouvert en arrière plan.`,
  icon: __dirname + "/iconx256.ico",
  urgency: 'low',
  silent: true
}).show();

const createWindow = () => {

  const mainWindow = new BrowserWindow({
    height: 900,
    width: 600,
    icon: __dirname + "/icon.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: appConfig.dev ? false : true,
    resizable: appConfig.dev ? true : false
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', async (event) => {
    if (mainWindow.isVisible()) {
      event.preventDefault();
      mainWindow.hide();
      showNofifBg();
    }
  })

  mainWindow.webContents.addListener('new-window', (event, url) => {
    event.preventDefault();
    Electron.shell.openExternal(url);
  })

  return mainWindow;
}

app.on("ready", async () => {

  try {

    const file = join('db.json')
    const adapter = new JSONFile<{ [key: string]: any }>(file);
    const db = new Low<{ [key: string]: any }>(adapter);
    await db.read();

    if (db.data === null) {
      db.data = {};
      db.data = db.data;
      await db.write();
    }

    let settings = app.getLoginItemSettings();
    let startAtLogin = settings.executableWillLaunchAtLogin;
    let mainWindow: Electron.BrowserWindow | null = null;

    if (!db.data["set-auto-bg"]) {
      mainWindow = createWindow();
    } else {
      showNofifBg();
    }

    ipcMain.handle('get-auto-start', () => {
      return startAtLogin;
    });

    const exeName = path.basename(process.execPath);

    ipcMain.on('set-auto-start', (event, to) => {
      if (to) {
        app.setLoginItemSettings({
          openAsHidden: true,
          openAtLogin: true,
          args: [
            '--processStart', `"${exeName}"`,
            '--process-start-args', `"--hidden"`
          ]
        })
      } else {
        app.setLoginItemSettings({
          openAsHidden: true,
          openAtLogin: false,
        })
      }
    })

    const rpc = new RPC(app, db);
    const twitch = new Twitch(db.data['set-stream-user']);
    let statutStreamConf: { [key: string]: string | number | (object | undefined)[] } = {};
    let streamTwitchLastCache: streamInfo;

    let setStatusConf = (data?: streamInfo) => {
      if (db.data['set-stream-auto']) {
        if (db.data['set-stream-desc1'])
          if (data?.title || streamTwitchLastCache.title) statutStreamConf["details"] = data?.title || streamTwitchLastCache.title;
          else statutStreamConf["details"] = undefined;
        else statutStreamConf["details"] = undefined;
        if (db.data['set-stream-desc2'])
          if ((data?.game_name || streamTwitchLastCache.game_name) && (data?.viewer_count || streamTwitchLastCache.viewer_count))
            statutStreamConf['state'] = `${data?.game_name || streamTwitchLastCache.game_name} - ${data?.viewer_count || streamTwitchLastCache.viewer_count} spectateurs`;
          else statutStreamConf['state'] = undefined;
        else statutStreamConf['state'] = undefined;
        if (db.data['set-stream-cooldown'])
          if (data?.started_at || streamTwitchLastCache.started_at)
            statutStreamConf['startTimestamp'] = new Date(data?.started_at || streamTwitchLastCache.started_at).getTime();
          else statutStreamConf['startTimestamp'] = undefined;
        else statutStreamConf['startTimestamp'] = undefined;
        if (db.data['set-stream-btn2'])
          if (data?.user_name || streamTwitchLastCache.user_name)
            statutStreamConf['buttons'] = [undefined, { label: "Regarder", url: `https://www.twitch.tv/${data?.user_name || streamTwitchLastCache.user_name}` }]
          else statutStreamConf['buttons'] = undefined;
        else statutStreamConf['buttons'] = undefined;
        rpc.setStatus(statutStreamConf);
      }
    }

    var inputsCheckbox = [
      'set-auto-bg',
      'set-stream-auto',
      'set-stream-desc1',
      'set-stream-desc2',
      'set-stream-cooldown',
      'set-stream-btn2'
    ]

    for (let i = 0; i < inputsCheckbox.length; i++) {
      const id = inputsCheckbox[i];
      ipcMain.on(id, async (event, to) => {
        console.log(id, "a été modifié en", to);
        db.data[id] = to ? true : false;
        await db.write();
        if (id === 'set-stream-auto') {
          if (to === false) {
            rpc.setStatus();
            clearInterval(twitch.interval);
          }
          else {
            setStatusConf()
            twitch.autoCheckStream();
          }
        } else
          if (id !== 'set-auto-bg') setStatusConf();
      })

      ipcMain.handle(id.replace('set', 'get'), () => {
        return db.data?.[id] || false;
      });
    }

    var inputs = [
      'set-rpc-id',
      'set-rpc-desc1',
      'set-rpc-desc2',
      'set-rpc-img1',
      'set-rpc-img2',
      'set-rpc-img-text1',
      'set-rpc-img-text2',
      'set-rpc-btn1',
      'set-rpc-btn2',
      'set-rpc-btn-link1',
      'set-rpc-btn-link2',
      'set-stream-user'
    ]


    for (let i = 0; i < inputs.length; i++) {
      const id = inputs[i];
      ipcMain.on(id, async (_, value) => {
        console.log(id, "a été modifié en", value);
        db.data[id] = value?.length ? value : undefined;
        await db.write();
        if (id === 'set-rpc-id') {
          rpc.reload();
        } else {
          rpc.setStatus(statutStreamConf);
        }

        if (id === 'set-stream-user') {
          let data = await twitch.verifyValidUser(value);
          if (!data) {
            dialog.showErrorBox("Streamer introuvable", `la chaine twitch ${value} est introuvable.`);
            return;
          }
          twitch.changeStreamer(value).catch((err) => {
            dialog.showErrorBox("Une erreur s'est produite", err.toString());
          });
        }
      })

      ipcMain.handle(id.replace('set', 'get'), () => {
        return db.data?.[id] || "";
      });
    }

    twitch.on('streaming', async (data) => {
      streamTwitchLastCache = data;
      await db.read();
      setStatusConf(data);
    })

    twitch.on('streamStop', () => {
      if (db.data['set-stream-auto']) {
        rpc.setStatus();
      }
    })

    const tray = new Tray(__dirname + "/icon.ico");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Fermer', type: 'normal', click: () => {
          if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
          app.quit();
        }
      },
      {
        label: 'Relancer le statut', type: "normal", click: () => {
          rpc.reload();
        }
      }
    ])

    tray.setContextMenu(contextMenu);
    tray.setToolTip(appConfig.name);
    tray.setTitle(appConfig.name);

    tray.on('click', (event) => {

      if (mainWindow) mainWindow.show();
      else mainWindow = createWindow();

    });

  } catch (err) {
    console.log(err);
  }
});

if (process.platform === 'win32') {
  app.setAppUserModelId(app.name)
}

app.on("window-all-closed", () => {

  if (process.platform !== "darwin") {
    app.quit();
  }

});