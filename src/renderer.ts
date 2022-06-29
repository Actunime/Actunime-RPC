// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features

document.getElementById('set-auto-start').onchange = ((event) => {
    console.log((event.target as any).checked);
    (window as any).test.send((event.target as any).checked);
})