// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { contextBridge, ipcRenderer, ipcMain } = require('electron');

window.addEventListener("DOMContentLoaded", async () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions]);
  }



  const result = await ipcRenderer.invoke('check-auto-start');
  let check = document.getElementById('set-auto-start');

  if (check) {
    (check as any).checked = result;
  }

});

contextBridge.exposeInMainWorld('test', {
  send: (arg: string) => {
    ipcRenderer.send('set-auto-start', arg)
  }
});