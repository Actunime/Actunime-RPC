import { app, Menu, Tray, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import * as path from "path";
import * as DiscordRPC from 'discord-rpc';
import { LocalStorage } from 'node-localstorage';
import RPC from "./discord";

const db = new LocalStorage('./db');

let config = db.getItem('conf') ? JSON.parse(db.getItem('conf')) : {};

console.log('test', config)

const rpc = new RPC(app);

let tray = null;
let mainWindow: BrowserWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 450,
    icon: __dirname + "/iconx256.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
    resizable: false
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', async (event) => {
    if (mainWindow.isVisible()) {
      event.preventDefault();
      mainWindow.hide();
      new Notification({ title: "Actunime", body: "L'application est toujours ouvert en arrière plan." }).show();
    }
  })

  mainWindow.webContents.on('new-window', function (e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });
}

app.on("ready", () => {
  let settings = app.getLoginItemSettings();
  let startAtLogin = settings.executableWillLaunchAtLogin;

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

  ipcMain.on('set-auto-bg', (event, to) => {
    console.log(to)
    config['set-auto-bg'] = to ? true : false;
    console.log(config)
    db.setItem('conf', JSON.stringify(config));
  })

  ipcMain.handle('get-auto-bg', () => {
    return config?.['set-auto-bg'] || false;
  });

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
  ]

  for (let i = 0; i < inputs.length; i++) {
    const id = inputs[i];
    ipcMain.on(id, (_, value) => {
      config[id] = value.length ? value : undefined;
      db.setItem('conf', JSON.stringify(config));
      rpc.reload();
    })

    ipcMain.handle(id.replace('set', 'get'), () => {
      return config?.[id] || "";
    });
  }

  tray = new Tray(__dirname + "/iconx256.ico");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Fermer', type: 'normal', click: () => {
        mainWindow.hide();
        app.quit();
      }
    },
    {
      label: 'Recharger', type: "normal", click: () => {
        app.relaunch();
      }
    }
  ])

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Actunime RPC BETA');
  tray.setTitle('Actunime RPC BETA');

  tray.on('click', (event) => {

    if (mainWindow) mainWindow.show();
    else createWindow();

  });

  if (config["set-auto-bg"]) {
    new Notification({ title: "Actunime", body: "Actunime RPC s'est ouvert en arrière plan." }).show();
  } else {
    createWindow();
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
