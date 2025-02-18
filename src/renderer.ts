const checkboxInputs = [
    'set-auto-bg',
    'set-auto-start',
    'set-stream-auto',
    'set-stream-desc1',
    'set-stream-desc2',
    'set-stream-cooldown',
    'set-stream-btn2'
];

checkboxInputs.forEach((id) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) {
        el.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            (window as any)[id].send(target.checked.toString());
        };
    }
});

const textInputs = [
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
];

textInputs.forEach((id) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) {
        el.onchange = (event) => {
            const target = event.target as HTMLInputElement;
            (window as any)[id].send(target.value);
        };
    }
});