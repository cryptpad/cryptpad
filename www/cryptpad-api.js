// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: MIT

(function () {
    'use strict';
    var factory = function (/*Hash*/) {

        // This API is used to load a CryptPad editor for a provided document in
        // an external platform.
        // The external platform needs to store a session key and make it
        // available to all users who needs to access the realtime editor.

        var getTxid = function () {
            return Math.random().toString(16).replace('0.', '');
        };
        var getInstanceURL = () => {
            var scripts = document.getElementsByTagName('script');
            for (var i = scripts.length - 1; i >= 0; i--) {
                var match = scripts[i].src.match(/(.*)web-apps\/apps\/api\/documents\/api.js/i);
                var match2 = scripts[i].src.match(/(.*)\/cryptpad-api.js/i);
                if (match) { return match[1]; }
                else if (match2) { return match2[1]; }
            }
        };

        var makeChan = function (iframe, iOrigin) {
            var handlers = {};
            var commands = {};

            var iWindow = iframe.contentWindow;
            var _sendCb = function (txid, args) {
                iWindow.postMessage({ ack: txid, args: args}, iOrigin);
            };
            var onMsg = function (ev) {
                if (ev.source !== iWindow) { return; }
                var data = ev.data;

                // On ack
                if (data.ack) {
                    if (handlers[data.ack]) {
                        handlers[data.ack](data.args);
                    }
                    return;
                }

                // On new command
                var msg = data.msg;
                var txid = data.txid;
                if (commands[msg.q]) {
                    console.warn('OUTER RECEIVED QUERY', msg.q, msg.data);
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

                console.warn('OUTER SENT QUERY', q, data);
                iWindow.postMessage({ msg: {
                    q: q,
                    data: data,
                }, txid: txid}, iOrigin);
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

        var makeIframe = function () {}; // placeholder

        let onDocumentReady = [];
        var start = function (config, chan) {
            return new Promise(function (resolve, reject) {
            setTimeout(function () {
                var docID = config.document.key;
                var key = config.document.key;
                var blob;

                var getBlob = function (cb) {
                    var xhr = new XMLHttpRequest();
                    let url = config.document.url;
                    xhr.open('GET', url, true);
                    xhr.responseType = 'blob';
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

                let serializedConfig = () => {
                    let _config = {};
                     _config.editorConfig = config.editorConfig;
                     _config.document = {
                         permissions: config.document?.permissions,
                         title: config.document?.title,
                         info: config.document?.info,
                         referenceData: config.document?.referenceData
                    };
                    return _config;
                };

                var start = function () {
                    //config.document.key = key;
                    chan.send('START', {
                        key: key,
                        application: config.documentType,
                        name: config.document.title,
                        url: config.document.url,
                        documentKey: docID,
                        document: blob,
                        ext: config.document.fileType,
                        autosave: config.events.onSave && (config.autosave || 10),
                        readOnly: config.mode === 'view',
                        editorConfig: config.editorConfig || {},
                        _config: serializedConfig()
                    }, function (obj) {
                        if (obj && obj.error) { reject(obj.error); return console.error(obj.error); }
                        resolve({});
                        resolve = function () {};
                        reject = function () {};
                    });
                };

                var onKeyValidated = function () {
                    if (config.document.blob) { // This is a reload
                        blob = config.document.blob;
                        return start();
                    }
                    // NOTE: Nextcloud will log us out if we try from the client
                    // TODO: make sure the server plugin is installed if we don't
                    // call getBlob()
                    if (!config.events?.onSave) {
                        return void start();
                    }
                    getBlob(function (err, _blob) {
                        if (err) { // Can't get blob from client, try from server
                            console.warn(err);
                            return void start();
                        }
                        _blob.name = `document.${config.document.fileType}`;
                        blob = _blob;
                        start();
                    });
                };

                var getSession = function (cb) {
                    chan.send('GET_SESSION', {
                        key: key,
                        keepOld: !config.events.onNewKey
                    }, function (obj) {
                        if (obj && obj.error) { reject(obj.error); return console.error(obj.error); }

                        // OnlyOffice
                        if (!config.events.onNewKey) {
                            key = obj.key;
                            console.error(key, obj);
                            return void cb();
                        }

                        if (obj.key !== key) {
                            // The outside app may reject our new key if the "old" one is deprecated.
                            // This will happen if multiple users try to update the key at the same
                            // time and in this case, only the first user will be able to generate a key.
                            return config.events.onNewKey({
                                old: key,
                                new: obj.key
                            }, function (_key) {
                                // Delay reloading tabs with deprecated key
                                var to = _key !== obj.key ? 1000 : 0;
                                key = _key || obj.key;
                                setTimeout(cb, to);
                            });
                        }
                        cb();
                    });
                };
                getSession(onKeyValidated);

                chan.on('DOCUMENT_READY', function () {
                    if (config.events.onAppReady) {
                        config.events.onAppReady();
                    }
                    if (config.events.onReady) {
                        config.events.onReady();
                    }
                    if (config.events.onDocumentReady) {
                        config.events.onDocumentReady();
                    }
                    onDocumentReady.forEach(f => {
                        try { f(); } catch (e) { console.error(e); }
                    });
                });

                chan.on('ON_DOWNLOADAS', blob => {
                    let url = URL.createObjectURL(blob);
                    if (!config.events.onDownloadAs) { return; }
                    config.events.onDownloadAs({
                        data: {
                            fileType: config.document && config.document.fileType,
                            url
                        }
                    });
                });

                chan.on('SAVE', function (data, cb) {
                    blob = data;
                    if (!config.events.onSave) { return void cb(); }
                    config.events.onSave(data, cb);
                });
                chan.on('RELOAD', function () {
                    config.document.blob = blob;
                    if (!config.editorConfig) { // Not OnlyOffice shim
                        document.getElementById('cryptpad-editor').remove();
                    }
                    makeIframe(config);
                });
                chan.on('HAS_UNSAVED_CHANGES', function(unsavedChanges, cb) {
                    if (config.events.onHasUnsavedChanges) {
                        config.events.onHasUnsavedChanges(unsavedChanges);
                    }
                    cb();
                });
                chan.on('ON_INSERT_IMAGE', function(data, cb) {
                    if (config.events.onInsertImage) {
                        config.events.onInsertImage(data, cb);
                    } else { cb(); }
                });

            });
            });
        };

        /**
         * Create a CryptPad collaborative editor for the provided document.
         *
         * @param {string} cryptpadURL The URL of the CryptPad server.
         * @param {string} containerID (optional) The ID of the HTML element containing the iframe.
         * @param {object} config The object containing configuration parameters.
         *   @param {object} config.document The document to load.
         *     @param {string} document.url The document URL.
         *     @param {string} document.fileType The document extension (md, xml, html, etc.).
         *     @param {string} document.key The collaborative session key.
         *   @param {object} config.events Event handlers.
         *     @param {function} events.onSave (blob, callback) The save function to store the document when edited.
         *     @param {function} events.onNewKey (data, callback) The function called when a new key is used.
         *     @param {function} events.onInsertImage (data, callback) The function called the user wants to add an image.
         *   @param {string} config.documentType The editor to load in CryptPad.
         *   @param {string} config.mode The editing state of the document to load ("view" or "edit", defaults to edit).
         * @return {promise}
         */
        var init = function (cryptpadURL, containerId, config) {
            // OnlyOffice shim: don't provide a URL
            if (typeof(config) !== "object" && typeof(containerId) === "object") {
                config = containerId;
                containerId = cryptpadURL;
                cryptpadURL = getInstanceURL();
            }

            config.events = config.events || {};

            // OnlyOffice shim
            let url = config.document.url;
            if (/^http:\/\/localhost\/cache\/files\//.test(url)) {
                url = url.replace(/(http:\/\/localhost\/cache\/files\/)/, getInstanceURL() + 'ooapi/');
            }
            config.document.url = url;
            if (config.documentType === "spreadsheet" || config.documentType === "cell") {
                config.documentType = "sheet";
            }

            if (config.documentType === "slide") {
                config.documentType = "presentation";
            }
            if (config.documentType === "word" || config.documentType === "text") {
                config.documentType = "doc";
            }

            let chan;
            let ret = new Promise(function (resolve, reject) {
            setTimeout(function () {

                if (!cryptpadURL || typeof(cryptpadURL) !== "string") {
                    return reject('Missing arg: cryptpadURL');
                }
                var container;
                if (containerId) {
                    container = document.getElementById(containerId);
                }
                if (!container) {
                    console.warn('No container provided, append to body');
                    container = document.body;
                }

                if (!config) { return reject('Missing args: no data provided'); }
                if(['document.url', 'document.fileType', 'documentType',
                    /*'events.onSave', 'events.onHasUnsavedChanges',
                    'events.onNewKey', 'events.onInsertImage'*/].some(function (k) {
                    var s = k.split('.');
                    var c = config;
                    return s.some(function (key) {
                        if (!c[key]) {
                            reject(`Missing args: no "config.${k}" provided`);
                            return true;
                        }
                        c = c[key];
                    });
                })) { return; }

                cryptpadURL = cryptpadURL.replace(/(\/)+$/, '');
                var url = cryptpadURL + '/integration/';
                var parsed;
                try {
                    parsed = new URL(url);
                } catch (e) {
                    console.error(e);
                    return reject('Invalid arg: cryptpadURL');
                }

                makeIframe = function (config) {
                    var iframe = document.createElement('iframe');
                    iframe.setAttribute('id', 'cryptpad-editor');
                    iframe.setAttribute('name', 'frameEditor');
                    iframe.setAttribute('align', 'top');
                    iframe.setAttribute("src", url);
                    iframe.setAttribute("width", config.width || '100%');
                    iframe.setAttribute("height", config.height || '100%');
                    if (config.editorConfig) { // OnlyOffice
                        container.replaceWith(iframe);
                        container = iframe;
                    } else {
                        container.appendChild(iframe);
                    }

                    var onMsg = function (msg) {
                        var data = typeof(msg.data) === "string" ? JSON.parse(msg.data) : msg.data;
                        if (!data || data.q !== 'INTEGRATION_READY') { return; }
                        window.removeEventListener('message', onMsg);
                        chan = makeChan(iframe, parsed.origin);
                        start(config, chan).then(resolve).catch(reject);
                    };
                    window.addEventListener('message', onMsg);
                };
                makeIframe(config);
            });
            });

            ret.downloadAs = (arg) => {
                if (!chan) {
                    return void onDocumentReady.push(() => {
                        ret.downloadAs(arg);
                    });
                }

                chan.send('DOWNLOAD_AS', arg);
            };

            return ret;
        };

        init.version = () => { return '7.3.0'; };
        init.DocEditor = init; // OnlyOffice shim

        window.DocsAPI = init;
        return init;
    };



    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([], function () {
            return factory();
        });
    } else {
        window.CryptPadAPI = factory();
    }
}());
