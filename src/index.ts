import { app, Menu, Tray, BrowserWindow, ipcMain, dialog, Notification } from "electron";
import * as path from "path";
import * as DiscordRPC from 'discord-rpc';



let tray = null

let mainWindow: BrowserWindow = null

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 200,
    width: 300,
    icon: __dirname + "/icon.ico",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
  mainWindow.on('close', async (event) => {
    if ((app as any).quitting) {
      return;
    }
    event.preventDefault();

    let response = await dialog.showMessageBox(mainWindow, {
      noLink: true,
      type: 'question',
      buttons: ["Oui", "Oui mais laisser en arrière plan", "Non"],
      title: "Actunime confirmation",
      message: "Voulez vous vraiment quitter cette page ?"
    })

    if (response.response === 0) {
      (app as any).quitting = true
      app.quit();
    } else if (response.response === 1) {
      new Notification({ title: "Actunime", body: "L'application est ouvert en arrière plan." }).show();
      return mainWindow.hide();
    }
  })
}

app.on("ready", () => {
  let settings = app.getLoginItemSettings();

  ipcMain.handle('check-auto-start', () => {
    return settings.executableWillLaunchAtLogin;
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

  tray = new Tray(__dirname + "/icon.ico");

  const contextMenu = Menu.buildFromTemplate([
    { role: "quit", label: 'Fermer', type: 'normal' },
    { role: "reload", label: 'Recharger', type: "normal" }
  ])

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Actunime RPC BETA');
  tray.setTitle('Actunime RPC BETA');

  tray.on('click', (event) => {

    mainWindow.show();

  });

  createWindow();

  app.on('activate', () => {
    if (settings.executableWillLaunchAtLogin) {
      mainWindow.hide();
      new Notification({ title: "Actunime", body: "L'application est ouvert en arrière plan." }).show();
    } else {
      mainWindow.show();
    }
  });

});

app.on("window-all-closed", () => {

  if (process.platform !== "darwin") {
    app.quit();
  }

});


const clientId = '957417842867851324';
DiscordRPC.register(clientId);

let timeInterval = 5000;

let checkTimeout = () => {

  const rpc = new DiscordRPC.Client({ transport: 'ipc' });

  rpc.on('ready', () => {

    rpc.setActivity({
      details: `Anime / Manga / Actu`,
      state: 'Rejoignez-nous et découvez notre univers !',
      largeImageKey: 'large_logo',
      largeImageText: 'Actunime',
      buttons: [{ label: "Rejoindre", url: "https://discord.gg/uQzXRbvMKq" }]
    });

  });

  setTimeout(() => {
    rpc.login({ clientId }).catch(() => {
      timeInterval = timeInterval + timeInterval;
      checkTimeout();
    });
  }, timeInterval);

}

checkTimeout();
