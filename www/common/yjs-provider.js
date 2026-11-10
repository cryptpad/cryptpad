define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/yjs-bundle.js',
    '/file/file-crypto.js',
    '/common/inner/rtchannel.js',
], (Util, Hash, YBundle, FileCrypto, RtChannel) => {
    const YProvider = {};
    const { YJS:Y } = YBundle;

    const debug = (x, type) => {
        if (!window.CP_DEV_MODE) { return; }
        console.error(x, type);
    };

    YProvider.create = cfg => {
        const { APP, framework, common, myId, yOpts } = cfg;
        let { ydoc } = cfg;

APP.ydoc = ydoc;
APP.Y = Y;

        APP.onLocal ||= framework?.localChange;
        APP.realtime ||= framework?._.cpNfInner.chainpad;

        const metadataMgr = common.getMetadataMgr();
        const privateData = metadataMgr.getPrivateData();

        const rtcTools = RtChannel.init(APP, common);
        const {
            setContent,
            getLastCp,
            rtChannel,
            onRTCMessage,
            openRtChannel,
            checkCheckpoint,
            makeCheckpoint,
            uploadCheckpoint,
            setIds
        } = rtcTools;
        const provider = {
            synced: false
        };

        const CHECKPOINT_INTERVAL = 10;

        // Yjs/BlockNote
        const onSynced = Util.mkEvent(true);

        // Yjs/CryptPad
        const onRemote = Util.mkEvent();
        const onLockChange = Util.mkEvent();
        const onResetUI = Util.mkEvent();

        const current = {
            channel: '',
            index: 0,
            lastTime: 0
        };
        let oldContent;

        // On chainpad change, check new saveLock and update "content"
        const chainpadContentUpdate = (content) => {
            // Prevent infinite saveLock
            let wasLocked = oldContent?.saveLock;
            if (content.saveLock && wasLocked !== content.saveLock) {
                // if there is a saveLock and it doesn't complete in 20-40s
                // then make a checkpoint ourselves
                checkCheckpoint();
            }
            oldContent = content;

            // Update rtChannel content
            setContent(content);

            // Make sure we're read-only during a saveLock
            if (content.saveLock) {
                onLockChange.fire(true);
            }

            // Check if new checkpoint available
            const cpData = getLastCp();
            const channel = cpData.rtChannel || oldContent?.channel;
            if (current.channel && current.channel !== channel) {
                debug('Reset UI on new remote checkpoint');
                onLockChange.fire(true);
                onResetUI.fire(cpData);
            }
        };

        const getCloneBlob = () => {
            const clone = new Y.Doc(yOpts); // XXX options
            ydoc.share.forEach((value, key) => {
                let clonedValue = value.clone();
                clonedValue._integrate(clone, null);
                clone.share.set(key, clonedValue);
            });

            // console.error('before', Y.encodeStateAsUpdate(ydoc));
            // console.error('after', Y.encodeStateAsUpdate(clone));

            const state = Y.encodeStateAsUpdate(clone);
            const blob = new Blob([state], {});
            return { state, blob };
        };

        const canCheckpoint = () => {
            // Not enough messages? no cp
            if (current.index < CHECKPOINT_INTERVAL) { return false; }

            // Document has been modified too recently? no cp but timeout
            const lastLimit = Date.now() - 3000; // 3s ago
            if (current.lastTime && current.lastTime > lastLimit) {
                // add 100ms to guard against round errors with timeout
                return current.lastTime - lastLimit + 100;
            }

            return true; // allow cp
        };
        const checkNewCheckpoint = () => {
            let canCp = canCheckpoint();
            if (canCp === false) { return; } // not enough messages
            if (typeof(canCp) === "number") { // timeout before cp allowed
                clearTimeout(current.cpTo);
                current.cpTo = setTimeout(checkNewCheckpoint, canCp);
                return;
            }

            // We should make a checkpoint, get the saveLock
            onLockChange.fire(true);
            makeCheckpoint(false, proceed => {
                // If someone else has locked th document, abort
                if (!proceed) { return; }
                // We've taken the saveLock

                // XXX "saveToServer"
                const { blob, state } = getCloneBlob();
                blob.noThumb = true;
                blob.name = metadataMgr.getMetadataLazy().title || 'doc';
                const data = {
                    time: Date.now(),
                    callback: (cpData) => {
                        debug('Reset UI on new local checkpoint');
                        onResetUI.fire(cpData, state);
                    }
                };
                uploadCheckpoint(blob, data, true);
            });
        };

        // New incoming remote message
        onRTCMessage.reg(data => {
            debug("Receiving update", data.msg);
            const update = Util.decodeBase64(data.msg);
            Y.applyUpdate(ydoc, update);
            clearTimeout(current.cpTo);
            current.index++;
            current.lastTime = Date.now();
            onRemote.fire();
        });

        // On local ydoc update: send message
        const onUpdate = (update, origin) => {
            if (origin !== myId) { return; }
            const msg = Util.encodeBase64(update);
            current.lastTime = Date.now();
            rtChannel.sendMsg(msg, false, () => {
                current.index++;
                checkNewCheckpoint();
                debug('Send message', msg);
            });
        };
        const onDestroy = () => {
            ydoc.off('update', onUpdate);
            ydoc.off('destroy', onDestroy);
        };

        const initYDoc = () => {
            ydoc.on('update', onUpdate);
            ydoc.on('destroy', onDestroy);
        };
        initYDoc();

        // resetFromCp: load a checkpoint (or empty doc) into a fresh Yjs document
        // NOTE: we assume ydoc is already a new empty instance
        const resetFromCp = (buffer, cpData, cb) => {
            const chan = cpData?.rtChannel || oldContent?.channel;
            if (chan !== current.channel) {
                debug(`Reset with new channel: ${chan}`);
                current.index = 0;
                current.channel = chan;
            }

            if (cpData?.file && buffer) {
                let u8 = new Uint8Array(buffer);
                Y.applyUpdate(ydoc, u8);
                onRemote.fire();
            }


            openRtChannel(cpData, () => {
                debug('rtchannel ready');
                provider.synced = true;
                onSynced.fire(true);
                onLockChange.fire(false);
            });
        };

        // Load a checkpoint from its blob url
        const loadCp = (cpData, cb) => {
            if (!cpData?.file) { return void cb(); }

            let parsed = Hash.parsePadUrl(cpData.file);
            let secret = Hash.getSecrets('file', parsed.hash);
            if (!secret?.channel) { return void cb('EINVAL'); }
            let hexFileName = secret.channel;
            let fileHost = privateData.fileHost || privateData.origin;
            let src = fileHost + Hash.getBlobPathFromHex(hexFileName);
            let key = secret?.keys?.cryptKey;

            let xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            if (window.sendCredentials) { xhr.withCredentials = true; }
            xhr.responseType = 'arraybuffer';
            xhr.onload = function () {
                if (/^[45]/.test('' + this.status)) {
                    console.error('XHR error', this.status);
                    return void cb('ENETWORK');
                }
                let arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    let u8 = new Uint8Array(arrayBuffer);
                    FileCrypto.decrypt(u8, key, (err, decrypted) => {
                        if (err) {
                            console.warn(err);
                            return void cb(err);
                        }
                        decrypted.content.arrayBuffer().then(buffer => {
                            cb(void 0, buffer);
                        }).catch(e => {
                            cb(e);
                        });
                    });
                }
            };
            xhr.onerror = function () {
                cb('ENETWORK');
            };
            xhr.send(null);
        };

        // Initialize ydoc with latest content
        const initDoc = () => {
            const cpData = getLastCp();

            loadCp(cpData, (err, buffer) => {
                resetFromCp(buffer, cpData, () => {
                    // XXX ?
                });
            });
        };

        const updateUI = (cpData, data, _ydoc) => {
            ydoc.destroy();
            ydoc = APP.ydoc = _ydoc;

            initYDoc();

            let next = (err, buffer) => {
                return void resetFromCp(buffer, cpData, () => {

                });
            };

            if (data) { return void next(void 0, data); }
            loadCp(cpData, next);
        };

        // Yjs provider API (https://github.com/yjs/y-indexeddb)
        // only "synced" event currently used by blocknote
        provider.on = (ev, handler) => {
            if (ev === "synced") {
                return void onSynced.reg(handler);
            }
        };
        provider.off = (ev, handler) => {
            if (ev === "synced") {
                return void onSynced.unreg(handler);
            }
        };

        return {
            initDoc,
            onRemote: onRemote.reg,
            onLockChange: onLockChange.reg,
            onResetUI: onResetUI.reg,
            updateUI,
            setContent,
            setIds,
            chainpadContentUpdate,
            provider
        };
    };

    return YProvider;
});
