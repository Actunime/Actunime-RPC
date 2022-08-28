var inputsCheckbox = [
    'set-auto-bg',
    'set-auto-start',
    'set-stream-auto',
    'set-stream-desc1',
    'set-stream-desc2',
    'set-stream-cooldown',
    'set-stream-btn2'
]

for (let i = 0; i < inputsCheckbox.length; i++) {
    const id = inputsCheckbox[i];
    document.getElementById(id).onchange = ((event) => {
        console.log(id, (window as any)[id]);
        (window as any)[id].send((event.target as any).checked);
    });
}

var inputs2 = [
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

for (let i = 0; i < inputs2.length; i++) {
    const id = inputs2[i];
    document.getElementById(id).onchange = ((event) => {
        (window as any)[id].send((event.target as any).value);
    })
}