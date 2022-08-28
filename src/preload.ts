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


  var inputsCheckbox = [
    'set-auto-start',
    'set-auto-bg',
    'set-stream-auto',
    'set-stream-desc1',
    'set-stream-desc2',
    'set-stream-cooldown',
    'set-stream-btn2'
  ]

  for (let o = 0; o < inputsCheckbox.length; o++) {
    const id = inputsCheckbox[o];
    const res = await ipcRenderer.invoke(id.replace('set', 'get'));
    let element = document.getElementById(id);
    if (element) {
      (element as any).checked = res;
    }
  }

  let inputs = [
    'get-rpc-id',
    'get-rpc-desc1',
    'get-rpc-desc2',
    'get-rpc-img1',
    'get-rpc-img2',
    'get-rpc-img-text1',
    'get-rpc-img-text2',
    'get-rpc-btn1',
    'get-rpc-btn2',
    'get-rpc-btn-link1',
    'get-rpc-btn-link2',
    'get-stream-user',
    'get-stream-auto',
    'get-stream-desc1',
    'get-stream-desc2',
    'get-stream-cooldown',
    'get-stream-btn2'
  ]

  for (let i = 0; i < inputs.length; i++) {
    const id = inputs[i];
    let docRes = await ipcRenderer.invoke(id);
    console.log(docRes)
    let doc = document.getElementById(id.replace('get', 'set'));
    (doc as any).defaultValue = docRes;
  }

});

let inputs = [
  'set-auto-start',
  'set-auto-bg',
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
  'set-stream-user',
  'set-stream-auto',
  'set-stream-desc1',
  'set-stream-desc2',
  'set-stream-cooldown',
  'set-stream-btn2'
]

for (let i = 0; i < inputs.length; i++) {
  const id = inputs[i];
  contextBridge.exposeInMainWorld(id, {
    send: (arg: string) => {
      ipcRenderer.send(id, arg)
    }
  });
}