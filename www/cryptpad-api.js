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

        var start = function (config, chan) {
            return new Promise(function (resolve, reject) {
            setTimeout(function () {
                var key = config.document.key;
                var blob;

                var getBlob = function (cb) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', config.document.url, true);
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

                var start = function () {
                    config.document.key = key;
                    chan.send('START', {
                        key: key,
                        application: config.documentType,
                        document: blob,
                        ext: config.document.fileType,
                        autosave: config.autosave || 10
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
                    getBlob(function (err, _blob) {
                        if (err) { reject(err); return console.error(err); }
                        _blob.name = `document.${config.document.fileType}`;
                        blob = _blob;
                        start();
                    });
                };

                var getSession = function (cb) {
                    chan.send('GET_SESSION', {
                        key: key
                    }, function (obj) {
                        if (obj && obj.error) { reject(obj.error); return console.error(obj.error); }
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

                chan.on('SAVE', function (data, cb) {
                    blob = data;
                    config.events.onSave(data, cb);
                });
                chan.on('RELOAD', function () {
                    config.document.blob = blob;
                    document.getElementById('cryptpad-editor').remove();
                    makeIframe(config);
                });
                chan.on('HAS_UNSAVED_CHANGES', function(unsavedChanges, cb) {
                    config.events.onHasUnsavedChanges(unsavedChanges);
                    cb();
                });
                chan.on('ON_INSERT_IMAGE', function(data, cb) {
                    config.events.onInsertImage(data, cb);
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
         * @return {promise}
         */
        var init = function (cryptpadURL, containerId, config) {
            return new Promise(function (resolve, reject) {
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
                    'events.onSave', 'events.onHasUnsavedChanges',
                    'events.onNewKey', 'events.onInsertImage'].some(function (k) {
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
                    iframe.setAttribute("src", url);
                    container.appendChild(iframe);

                    var onMsg = function (msg) {
                        var data = typeof(msg.data) === "string" ? JSON.parse(msg.data) : msg.data;
                        if (!data || data.q !== 'INTEGRATION_READY') { return; }
                        window.removeEventListener('message', onMsg);
                        var chan = makeChan(iframe, parsed.origin);
                        start(config, chan).then(resolve).catch(reject);
                    };
                    window.addEventListener('message', onMsg);
                };
                makeIframe(config);
            });
            });
        };

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


