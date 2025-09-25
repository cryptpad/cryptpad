// This file originates from
// https://github.com/webxdc/vite-plugins/blob/main/src/webxdc.js
// It's a stub `webxdc.js` that adds a webxdc API stub for easy testing in
// browsers. In an actual webxdc environment (e.g. Delta Chat messenger) this
// file is not used and will automatically be replaced with a real one.
// See https://docs.webxdc.org/spec.html#webxdc-api

window.webxdc = (() => {
    // XXX: get the updates from CryptPad
    let getUpdates = () => {
        console.log('[webxdc]: getUpdates not implemented');
        return [];
    };

    let updateListener = () => { };

    return {
        sendUpdateInterval: 1000,
        sendUpdateMaxSize: 999999,
        selfAddr: "device0@local.host",
        selfName: "device0",
        setUpdateListener: (cb, serial = 0) => {
            // const updates = getUpdates();
            // const maxSerial = updates.length;
            // updates.forEach((update) => {
            //     if (update.serial > serial) {
            //         update.max_serial = maxSerial;
            //         cb(update);
            //     }
            // });
            window.cp_updateListener = cb;
            if (window.cp_pendingUpdates) {
                console.log('pending', window.cp_pendingUpdates);
                const a = window.cp_pendingUpdates;
                const maxSerial = a[a.length-1].serial;
                window.cp_pendingUpdates.forEach(update => {
                    update.max_serial = maxSerial;
                    cb(update);
                });
            }
            return Promise.resolve();
        },
        joinRealtimeChannel: (cb) => {
            cb();
            console.log('[webxdc]: joinRealtimeChannel not implemented');
        },
        getAllUpdates: () => {
            console.log("[Webxdc] WARNING: getAllUpdates() is deprecated.");
            return Promise.resolve([]);
        },
        sendUpdate: (update) => {
            const updates = getUpdates();
            const serial = updates.length + 1;
            const _update = {
                payload: update.payload,
                summary: update.summary,
                info: update.info,
                notify: update.notify,
                href: update.href,
                document: update.document,
                serial: serial,
            };
            console.log(`[Webxdc] sending ${JSON.stringify(_update)}`);
            // XXX: send to cryptpad somehow
            updateListener(_update);
        },
        sendToChat: async (content) => {
            return void console.log('[webxdc]: sendToChat Not Implemented', content);
        },
        importFiles: (filters) => {
            return void console.log('[webxdc]: importFiles Not Implemented', filters);
        }
    };
})();
