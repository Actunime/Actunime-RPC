import { Low, JSONFile } from "@commonify/lowdb";
import Twitch, { streamInfo } from "./twitch";
import unhandled from "electron-unhandled";
import appConfig from "./config.json";
import * as log from "electron-log";
import path, { join } from "path";
import RPC from "./discord";
import {
  app,
  Menu,
  Tray,
  BrowserWindow,
  ipcMain,
  Notification,
  dialog,
  shell,
} from "electron";

app.disableHardwareAcceleration();

log.transports.file.resolvePath = () => join("logs.log");
log.log("Démarrage du processus", process.pid);

unhandled({
  showDialog: true,
  logger: (err) => log.error(err),
});

if (!app.requestSingleInstanceLock()) {
  log.log("Une instance supplémentaire a été détectée. Fermeture...", process.pid);
  app.quit();
}

const showNotifBg = () =>
    new Notification({
      title: appConfig.name,
      body: `${appConfig.name} est ouvert en arrière-plan.`,
      icon: path.join(__dirname, "../assets/iconx256.ico"),
      urgency: "low",
      silent: true,
    }).show();

const createWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    height: 900,
    width: 600,
    icon: path.join(__dirname, "../assets/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    autoHideMenuBar: !appConfig.dev,
    resizable: !!appConfig.dev,
  });

  mainWindow.loadFile(path.join(__dirname, "../index.html"));

  mainWindow.on("close", (event) => {
    if (mainWindow.isVisible()) {
      event.preventDefault();
      mainWindow.hide();
      showNotifBg();
    }
  });

  mainWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  log.log("Fenêtre principale créée.");
  return mainWindow;
};

app.on("ready", async () => {
  log.log("Application prête");
  log.log("Basepath :", app.getPath("exe"));

  const dbFile = join("db.json");
  const adapter = new JSONFile<{ [key: string]: any }>(dbFile);
  const db = new Low<{ [key: string]: any }>(adapter);
  await db.read();
  if (!db.data) {
    db.data = {};
    await db.write();
  }

  const settings = app.getLoginItemSettings();
  const startAtLogin = db.data!["set-auto-start"] || false;
  app.setLoginItemSettings({
    openAtLogin: startAtLogin,
    ...(process.platform === "win32"
        ? {
          args: [
            "--processStart",
            `"${path.basename(process.execPath)}"`,
            "--process-start-args",
            `"--hidden"`,
          ],
        }
        : {}),
  });

  let mainWindow: BrowserWindow | null = null;
  if (!db.data!["set-auto-bg"]) {
    log.log("Création d'une fenêtre...");
    mainWindow = createWindow();
  } else {
    log.log("Lancement en arrière-plan...");
    showNotifBg();
  }

  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  const rpc = new RPC(app, db);
  const twitch = new Twitch(db.data!["set-stream-user"]);
  // eslint-disable-next-line @typescript-eslint/ban-types
  const statutStreamConf: { [key: string]: string | number | (object | undefined)[] } = {};
  let streamTwitchLastCache: streamInfo;

  const setStatusConf = (data?: streamInfo) => {
    if (db.data!["set-stream-auto"]) {
      statutStreamConf["details"] = db.data!["set-stream-desc1"]
          ? data?.title || streamTwitchLastCache?.title
          : undefined;
      statutStreamConf["state"] =
          db.data!["set-stream-desc2"] &&
          (data?.game_name || streamTwitchLastCache?.game_name) &&
          (data?.viewer_count || streamTwitchLastCache?.viewer_count)
              ? `${data?.game_name || streamTwitchLastCache?.game_name} - ${
                  data?.viewer_count || streamTwitchLastCache?.viewer_count
              } spectateurs`
              : undefined;
      statutStreamConf["startTimestamp"] =
          db.data!["set-stream-cooldown"] &&
          (data?.started_at || streamTwitchLastCache?.started_at)
              ? new Date(data?.started_at || streamTwitchLastCache?.started_at).getTime()
              : undefined;
      statutStreamConf["buttons"] =
          db.data!["set-stream-btn2"] &&
          (data?.user_name || streamTwitchLastCache?.user_name)
              ? [
                undefined,
                { label: "Regarder", url: `https://www.twitch.tv/${data?.user_name || streamTwitchLastCache?.user_name}` },
              ]
              : undefined;
      rpc.setStatus(statutStreamConf);
    }
  };

  const inputsCheckbox = [
    "set-auto-start",
    "set-auto-bg",
    "set-stream-auto",
    "set-stream-desc1",
    "set-stream-desc2",
    "set-stream-cooldown",
    "set-stream-btn2",
  ];
  const exeName = path.basename(process.execPath);

  inputsCheckbox.forEach((id) => {
    ipcMain.on(id, async (event, to) => {
      console.log(`${id} modifié en`, to);
      db.data![id] = Boolean(to);
      await db.write();

      if (id === "set-auto-start") {
        app.setLoginItemSettings({
          openAtLogin: Boolean(db.data![id]),
          ...(process.platform === "win32"
              ? {
                args: [
                  "--processStart",
                  `"${exeName}"`,
                  "--process-start-args",
                  `"--hidden"`,
                ],
              }
              : {}),
        });
      } else if (id === "set-stream-auto") {
        if (!to) {
          rpc.setStatus();
          clearInterval(twitch.interval as unknown as number);
        } else {
          setStatusConf();
          twitch.autoCheckStream();
        }
      } else if (id !== "set-auto-bg") {
        setStatusConf();
      }
    });

    ipcMain.handle(id.replace("set", "get"), () => {
      console.log(`${id} =`, id === "set-auto-start" ? startAtLogin : db.data![id] || false);
      return id === "set-auto-start" ? startAtLogin : db.data![id] || false;
    });
  });

  const inputs = [
    "set-rpc-id",
    "set-rpc-desc1",
    "set-rpc-desc2",
    "set-rpc-img1",
    "set-rpc-img2",
    "set-rpc-img-text1",
    "set-rpc-img-text2",
    "set-rpc-btn1",
    "set-rpc-btn2",
    "set-rpc-btn-link1",
    "set-rpc-btn-link2",
    "set-stream-user",
  ];

  inputs.forEach((id) => {
    ipcMain.on(id, async (_, value) => {
      console.log(`${id} modifié en`, value);
      db.data![id] = value?.length ? value : undefined;
      await db.write();

      if (id === "set-rpc-id") rpc.reload();
      else rpc.setStatus(statutStreamConf);

      if (id === "set-stream-user") {
        const data = await twitch.verifyValidUser(value);
        if (!data) {
          dialog.showErrorBox("Streamer introuvable", `La chaîne Twitch "${value}" est introuvable.`);
          return;
        }
        twitch.changeStreamer(value).catch((err) => {
          dialog.showErrorBox("Une erreur s'est produite", err.toString());
        });
      }
    });
    ipcMain.handle(id.replace("set", "get"), () => db.data![id] || "");
  });

  twitch.on("streaming", async (data) => {
    streamTwitchLastCache = data;
    await db.read();
    setStatusConf(data);
  });
  twitch.on("streamStop", () => {
    if (db.data!["set-stream-auto"]) rpc.setStatus();
  });

  let tray: Tray;
  if (process.platform === "darwin") {
    tray = new Tray(path.join(__dirname, "../assets/icon22.png"));
  } else {
    tray = new Tray(path.join(__dirname, "../assets/icon.ico"));
  }
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Fermer",
      type: "normal",
      click: () => {
        if (mainWindow && mainWindow.isVisible()) mainWindow.hide();
        app.quit();
      },
    },
    {
      label: "Relancer le statut",
      type: "normal",
      click: () => rpc.reload(),
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.setToolTip(appConfig.name);
  tray.setTitle(process.platform === "darwin" ? "Actunime RPC" : appConfig.name);

  tray.on("click", () => {
    if (mainWindow) mainWindow.show();
    else mainWindow = createWindow();
  });
});

if (process.platform === "win32") app.setAppUserModelId(app.name);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});