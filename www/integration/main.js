// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    '/common/sframe-common-outer.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/components/tweetnacl/nacl-fast.min.js'
], function (Config, SCO, Hash, Util) {

    var getTxid = function () {
        return Math.random().toString(16).replace('0.', '');
    };
    var init = function () {
        console.warn('INIT');
        var p = window.parent;
        var txid = getTxid();
        p.postMessage({ q: 'INTEGRATION_READY', txid: txid }, '*');

        var makeChan = function () {
            var handlers = {};
            var commands = {};

            var _sendCb = function (txid, args) {
                p.postMessage({ ack: txid, args: args}, '*');
            };
            var onMsg = function (ev) {
                if (ev.source !== p) { return; }
                var data = ev.data;

                // On ack
                if (data.ack) {
                    if (handlers[data.ack]) {
                        handlers[data.ack](data.args);
                        delete handlers[data.ack];
                    }
                    return;
                }

                // On new command
                var msg = data.msg;
                if (!msg) { return; }
                var txid = data.txid;
                if (commands[msg.q]) {
                    commands[msg.q](msg.data, function (args) {
                        _sendCb(txid, args);
                    });
                    return;
                }

            };
            window.addEventListener('message', onMsg);

            var send = function (q, data, cb) {
                var txid = getTxid();
                if (cb) { handlers[txid] = cb; }
                p.postMessage({ msg: {
                    q: q,
                    data: data,
                }, txid: txid}, '*');
                setTimeout(function () {
                    delete handlers[txid];
                }, 60000);
            };
            var on = function (q, handler) {
                if (typeof(handler) !== "function") { return; }
                commands[q] = handler;
            };

            return {
                send: send,
                on: on
            };
        };
        var chan = makeChan();

        //var isNew = false;
        var checkSession = function (oldKey, cb) {
            var channel = Hash.hrefToHexChannelId(Hash.hashToHref(oldKey));
            var prefix = channel.slice(0,2);
            var url = `/datastore/${prefix}/${channel}.ndjson`;

            var http = new XMLHttpRequest();
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState === this.DONE) {
                    console.error(this.status);
                    if (this.status === 200) {
                        return cb({state: true});
                    }
                    if (this.status === 404) {
                        return cb({state: false});
                    }
                    cb({error: 'Internal server error'});
                }
            };
            http.send();
        };
        let sanitizeKey = key => {
            try {
                Util.decodeBase64(key);
                return key;
            } catch (e) {
                return Util.encodeBase64(Util.decodeUTF8(key)).replaceAll('=', '');
            }
        };
        chan.on('GET_SESSION', function (data, cb) {
            if (data.keepOld) { // they provide their own key, we must turn it into a hash
                var key = sanitizeKey(data.key) + "000000000000000000000000000000000";
                console.warn('KEY', key);
                return void cb({
                    key: `/2/integration/edit/${key.slice(0,24)}/`
                });
            }
            var getHash = function () {
                //isNew = true;
                return Hash.createRandomHash('integration');
            };
            var oldKey = data.key;
            if (!oldKey) { return void cb({ key: getHash() }); }

            checkSession(oldKey, function (obj) {
                if (!obj || obj.error) { return cb(obj); }
                cb({
                    key: obj.state ? oldKey : getHash()
                });
            });
        });

        var reload = function (data) {
            chan.send('RELOAD', data);
        };
        var onHasUnsavedChanges = function (unsavedChanges, cb) {
            chan.send('HAS_UNSAVED_CHANGES', unsavedChanges, cb);
        };
        var onInsertImage = function (data, cb) {
            chan.send('ON_INSERT_IMAGE', data, cb);
        };
        var onReady = function () {
            chan.send('DOCUMENT_READY', {});
        };

        let downloadAs;
        chan.on('DOWNLOAD_AS', function (format) {
            if (typeof(downloadAs) !== "function") {
                console.error('UNSUPPORTED COMMAND', 'downloadAs');
                return;
            }
            downloadAs(format);
        });
        let setDownloadAs = f => {
            downloadAs = f;
        };
        let onDownloadAs = function (blob) { // DownloadAs callback
            chan.send('ON_DOWNLOADAS', blob);
        };


        let getInstanceURL = function () {
            return Config.httpUnsafeOrigin;
        };
        let getBlobServer = function (documentURL, cb) {
            let xhr = new XMLHttpRequest();
            let data = encodeURIComponent(documentURL);
            let url = getInstanceURL() + '/ooapidl?url=' + data;
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            //xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                if (this.status === 200) {
                    var blob = this.response;
                    // myBlob is now the blob that the object URL pointed to.
                    cb(null, blob);
                } else {
                    cb(this.status);
                }
            };
            xhr.onerror = function (e) {
                cb(e.message);
            };
            xhr.send();
        };
        let saveBlobServer = function (cfg, blob, cb) {
            let {callbackUrl, name, key} = cfg;
            let xhr = new XMLHttpRequest();
            name = encodeURIComponent(name);
            callbackUrl = encodeURIComponent(callbackUrl);
            key = encodeURIComponent(key);
            let query = `name=${name}&cb=${callbackUrl}&key=${key}`;
            let url = getInstanceURL() + `/oosave?${query}`;
            xhr.open('POST', url, true);
            xhr.responseType = 'blob';
            //xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () {
                console.error(this.status);
                if (this.status === 200) {
                    cb();
                } else {
                    cb(this.status);
                }
            };
            xhr.onerror = function (e) {
                cb(e.message);
            };
            xhr.send(blob);
        };
        chan.on('START', function (data, cb) {
            console.warn('INNER START', data);
            // data.key is a hash
            var href = Hash.hashToHref(data.key, data.application);
            if (data.editorConfig.lang) {
                var LS_LANG = "CRYPTPAD_LANG";
                localStorage.setItem(LS_LANG, data.editorConfig.lang);
            }

            let fileName = data.name || `document.${data.ext}`;
            var save = function (obj, cb) {
                let cbUrl = data.editorConfig.callbackUrl;
                if (!data.autosave && cbUrl) {
                    saveBlobServer({
                        callbackUrl: cbUrl,
                        name: fileName,
                        key: data.documentKey
                    }, obj.blob, cb);
                    return;
                }
                chan.send('SAVE', obj.blob, function (err) {
                    if (err) { return cb({error: err}); }
                    cb();
                });
            };

            console.error(Hash.hrefToHexChannelId(href));
            let startApp = function (blob) {
                window.CP_integration_outer = {
                    pathname: `/${data.application}/`,
                    hash: data.key,
                    href: href,
                    initialState: blob,
                    config: {
                        readOnly: data.readOnly,
                        fileName: data.name,
                        fileType: data.ext,
                        autosave: data.autosave,
                        user: data.editorConfig.user,
                        _: data._config
                    },
                    utils: {
                        onReady: onReady,
                        onDownloadAs,
                        setDownloadAs,
                        save: save,
                        reload: reload,
                        onHasUnsavedChanges: onHasUnsavedChanges,
                        onInsertImage: onInsertImage
                    }
                };
                let path = "/common/sframe-app-outer.js";
                if (['sheet', 'doc', 'presentation'].includes(data.application)) {
                    path = '/common/onlyoffice/main.js';
                }
                require([path], function () {
                    console.warn('SAO REQUIRED');
                    delete window.CP_integration_outer;
                    cb();
                });
            };

            if (data.document) { return void startApp(data.document); }
            getBlobServer(data.url, (err, blob) => {
                if (err) {
                    return void cb({error: err});
                }
                startApp(blob);
            });
        });

    };
    init();
    /*
    nThen(function (waitFor) {
    }).nThen(function () {
    });
    */

});
