import { contextBridge, ipcRenderer } from 'electron';

window.addEventListener('DOMContentLoaded', async () => {
  const replaceText = (selector: string, text: string) => {
    const el = document.getElementById(selector);
    if (el) el.innerText = text;
  };

  ['chrome', 'node', 'electron'].forEach((type) =>
      replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions] || '')
  );

  const inputsCheckbox = [
    'set-auto-start',
    'set-auto-bg',
    'set-stream-auto',
    'set-stream-desc1',
    'set-stream-desc2',
    'set-stream-cooldown',
    'set-stream-btn2'
  ];

  await Promise.all(
      inputsCheckbox.map(async (id) => {
        const res = await ipcRenderer.invoke(id.replace('set', 'get'));
        const el = document.getElementById(id) as HTMLInputElement | null;
        if (el) el.checked = res;
      })
  );

  const inputs = [
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
  ];

  await Promise.all(
      inputs.map(async (id) => {
        const res = await ipcRenderer.invoke(id);
        console.log(`${id} =`, res);
        const el = document.getElementById(id.replace('get', 'set')) as HTMLInputElement | null;
        if (el) el.defaultValue = res;
      })
  );
});

const exposedInputs = [
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
];

exposedInputs.forEach((id) => {
  contextBridge.exposeInMainWorld(id, {
    send: (arg: string) => ipcRenderer.send(id, arg)
  });
});