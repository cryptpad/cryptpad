(function(name, definition) {
    if (typeof module !== 'undefined') { module.exports = definition(); }
    else if (typeof define === 'function' && typeof define.amd === 'object') { define(definition); }
    else  { this[name] = definition(); }
}('MediaTag', function() {
    var cache;
    var cypherChunkLength = 131088;

    // Save a blob on the file system
    var saveFile = function (blob, url, fileName) {
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, fileName);
        } else {
            // We want to be able to download the file with a name, so we need an "a" tag with
            // a download attribute
            var a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            // It's not in the DOM, so we can't use a.click();
            var event = new MouseEvent("click");
            a.dispatchEvent(event);
        }
    };

    var fixHTML = function (str) {
        if (!str) { return ''; }
        return str.replace(/[<>&"']/g, function (x) {
            return ({ "<": "&lt;", ">": "&gt", "&": "&amp;", '"': "&#34;", "'": "&#39;" })[x];
        });
    };


    // Default config, can be overriden per media-tag call
    var config = {
        allowed: [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
            'audio/mp3',
            'audio/ogg',
            'audio/wav',
            'audio/webm',
            'video/mp4',
            'video/ogg',
            'video/webm',
            'application/pdf',
            //'application/dash+xml', // FIXME?
            'download'
        ],
        pdf: {},
        download: {
            text: "Download"
        },
        Plugins: {
            image: function (metadata, url, content, cfg, cb) {
                var img = document.createElement('img');
                img.setAttribute('src', url);
                img.blob = content;
                cb(void 0, img);
            },
            video: function (metadata, url, content, cfg, cb) {
                var video = document.createElement('video');
                video.setAttribute('src', url);
                video.setAttribute('controls', true);
                cb(void 0, video);
            },
            audio: function (metadata, url, content, cfg, cb) {
                var audio = document.createElement('audio');
                audio.setAttribute('src', url);
                audio.setAttribute('controls', true);
                cb(void 0, audio);
            },
            pdf: function (metadata, url, content, cfg, cb) {
                var iframe = document.createElement('iframe');
                if (cfg.pdf.viewer) { // PDFJS
                    var viewerUrl = cfg.pdf.viewer + '?file=' + url;
                    iframe.src = viewerUrl + '#' + window.encodeURIComponent(metadata.name);
                    return void cb (void 0, iframe);
                }
                iframe.src = url + '#' + window.encodeURIComponent(metadata.name);
                return void cb (void 0, iframe);
            },
            download: function (metadata, url, content, cfg, cb) {
                var btn = document.createElement('button');
                btn.innerHTML = cfg.download.text + '<br>' +
                                metadata.name ? '<b>' + fixHTML(metadata.name) + '</b>' : '';
                btn.addEventListener('click', function () {
                    saveFile(content, url, metadata.name);
                });
                cb(void 0, btn);
            }
        }
    };


    // Download a blob from href
    var download = function (src, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', src, true);
        xhr.responseType = 'arraybuffer';

        xhr.onload = function () {
            // Error?
            if (/^4/.test('' + this.status)) { return void cb("XHR_ERROR " + this.status); }

            var arrayBuffer = xhr.response;
            if (arrayBuffer) { cb(null, new Uint8Array(arrayBuffer)); }
        };

        xhr.send(null);
    };

    // Decryption tools
    var Decrypt = {
        // Create a nonce
        createNonce: function () {
            var n = new Uint8Array(24);
            for (var i = 0; i < 24; i++) { n[i] = 0; }
            return n;
        },

        // Increment a nonce
        increment: function (N) {
            var l = N.length;
            while (l-- > 1) {
                /* .jshint probably suspects this is unsafe because we lack types
                   but as long as this is only used on nonces, it should be safe  */
                if (N[l] !== 255) { return void N[l]++; } // jshint ignore:line

                // you don't need to worry about this running out.
                // you'd need a REAAAALLY big file
                if (l === 0) { throw new Error('E_NONCE_TOO_LARGE'); }

                N[l] = 0;
            }
        },

        decodePrefix: function (A) {
            return (A[0] << 8) | A[1];
        },
        joinChunks: function (chunks) {
            return new Blob(chunks);
        },

        // Convert a Uint8Array into Array.
        slice: function (u8) {
            return Array.prototype.slice.call(u8);
        },

        // Gets the key from the key string.
        getKeyFromStr: function (str) {
            return window.nacl.util.decodeBase64(str);
        }
    };

    // Decrypts a Uint8Array with the given key.
    var decrypt = function (u8, strKey, done, progressCb) {
        var Nacl = window.nacl;

        var progress = function (offset) {
            progressCb((offset / u8.length) * 100);
        };

        var key = Decrypt.getKeyFromStr(strKey);
        var nonce = Decrypt.createNonce();
        var i = 0;
        var prefix = u8.subarray(0, 2);
        var metadataLength = Decrypt.decodePrefix(prefix);

        var res = { metadata: undefined };

        // Get metadata
        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));
        var metaChunk = Nacl.secretbox.open(metaBox, nonce, key);

        Decrypt.increment(nonce);

        try { res.metadata = JSON.parse(Nacl.util.encodeUTF8(metaChunk)); }
        catch (e) { return void done('E_METADATA_DECRYPTION'); }

        if (!res.metadata) { return void done('NO_METADATA'); }

        var takeChunk = function (cb) {
            setTimeout(function () {
                var start = i * cypherChunkLength + 2 + metadataLength;
                var end = start + cypherChunkLength;
                i++;

                // Get the chunk
                var box = new Uint8Array(u8.subarray(start, end));

                // Decrypt the chunk
                var plaintext = Nacl.secretbox.open(box, nonce, key);
                Decrypt.increment(nonce);

                if (!plaintext) { return void cb('DECRYPTION_FAILURE'); }

                progress(Math.min(end, u8.length));

                cb(void 0, plaintext);
            });
        };

        var chunks = [];

        // decrypt file contents
        var again = function () {
            takeChunk(function (e, plaintext) {
                if (e) { return setTimeout(function () { done(e); }); }

                if (plaintext) {
                    if (i * cypherChunkLength < u8.length) { // not done
                        chunks.push(plaintext);
                        return again();
                    }

                    chunks.push(plaintext);
                    res.content = Decrypt.joinChunks(chunks);
                    return void done(void 0, res);
                }
                done('UNEXPECTED_ENDING');
            });
        };
        again();
    };

    // Get type
    var getType = function (mediaObject, metadata, cfg) {
        var mime = metadata.type;
        var s = metadata.type.split('/');
        var type = s[0];
        var extension = s[1];

        mediaObject.name = metadata.name;
        if (mime && cfg.allowed.indexOf(mime) !== -1) {
            mediaObject.type = type;
            mediaObject.extension = extension;
            mediaObject.mime = mime;
            return type;
        } else if (cfg.allowed.indexOf('download') !== -1) {
            mediaObject.type = type;
            mediaObject.extension = extension;
            mediaObject.mime = mime;
            return 'download';
        } else {
            return;
        }
    };

    // Copy attributes
    var copyAttributes = function (origin, dest) {
        Object.keys(origin.attributes).forEach(function (i) {
            if (!/^data-attr/.test(origin.attributes[i].name)) { return; }
            var name = origin.attributes[i].name.slice(10);
            var value = origin.attributes[i].value;
            dest.setAttribute(name, value);
        });
    };

    // Process
    var process = function (mediaObject, decrypted, cfg, cb) {
        var metadata = decrypted.metadata;
        var blob = decrypted.content;

        var mediaType = getType(mediaObject, metadata, cfg);

        if (mediaType === 'application') {
            mediaType = mediaObject.extension;
        }

        if (!mediaType || !cfg.Plugins[mediaType]) {
            return void cb('NO_PLUGIN_FOUND');
        }

        // Get blob URL
        var url = decrypted.url;
        if (!url && window.URL) {
            url = decrypted.url = window.URL.createObjectURL(new Blob([blob], {
                type: metadata.type
            }));
        }

        cfg.Plugins[mediaType](metadata, url, blob, cfg, function (err, el) {
            if (err || !el) { return void cb(err || 'ERR_MEDIATAG_DISPLAY'); }
            copyAttributes(mediaObject.tag, el);
            mediaObject.tag.innerHTML = '';
            mediaObject.tag.appendChild(el);
            cb();
        });
    };

    var addMissingConfig = function (base, target) {
        Object.keys(target).forEach(function (k) {
            if (!target[k]) { return; }
            // Target is an object, fix it recursively
            if (typeof target[k] === "object" && !Array.isArray(target[k])) {
                // Sub-object
                if (base[k] && (typeof base[k] !== "object" || Array.isArray(base[k]))) { return; }
                else if (base[k]) { addMissingConfig(base[k], target[k]); }
                else {
                    base[k] = {};
                    addMissingConfig(base[k], target[k]);
                }
            }
            // Target is array or immutable, copy the value if it's missing
            if (!base[k]) {
                base[k] = Array.isArray(target[k]) ? JSON.parse(JSON.stringify(target[k]))
                                                   : target[k];
            }
        });
    };

    // Initialize a media-tag
    var init = function (el, cfg) {
        cfg = cfg || {};

        addMissingConfig(cfg, config);

        // Add support for old mediatag library
        if (!cfg.pdf.viewer && init.PdfPlugin && init.PdfPlugin.viewer) {
            cfg.pdf.viewer = init.PdfPlugin.viewer;
        }

        // Handle jQuery elements
        if (typeof(el) === "object" && el.jQuery) { el = el[0]; }

        // Abort smoothly if the element is not a media-tag
        if (el.nodeName !== "MEDIA-TAG") {
            console.error("Not a media-tag!");
            return {
                on: function () { return this; }
            };
        }

        var handlers = cfg.handlers || {
            'progress': [],
            'complete': [],
            'error': []
        };

        var mediaObject = el._mediaObject = {
            handlers: handlers,
            tag: el
        };

        var emit = function (ev, data) {
            // Check if the event name is valid
            if (Object.keys(handlers).indexOf(ev) === -1) {
                return void console.error("Invalid mediatag event");
            }

            // Call the handlers
            handlers[ev].forEach(function (h) {
                // Make sure a bad handler won't break the media-tag script
                try {
                    h(data);
                } catch (err) {
                    console.error(err);
                }
            });
        };

        mediaObject.on = function (ev, handler) {
            // Check if the event name is valid
            if (Object.keys(handlers).indexOf(ev) === -1) {
                console.error("Invalid mediatag event");
                return mediaObject;
            }
            // Check if the handler is valid
            if (typeof (handler) !== "function") {
                console.error("Handler is not a function!");
                return mediaObject;
            }
            // Add the handler
            handlers[ev].push(handler);
            return mediaObject;
        };

        var src = el.getAttribute('src');
        var strKey = el.getAttribute('data-crypto-key');
        if (/^cryptpad:/.test(strKey)) {
            strKey = strKey.slice(9);
        }
        var uid = [src, strKey].join('');

        // End media-tag rendering: display the tag and emit the event
        var end = function (decrypted) {
            process(mediaObject, decrypted, cfg, function (err) {
                if (err) { return void emit('error', err); }
                emit('complete', decrypted);
            });
        };

        // If we have the blob in our cache, don't download & decrypt it again, just display
        if (cache[uid]) {
            end(cache[uid]);
            return mediaObject;
        }

        // Download the encrypted blob
        download(src, function (err, u8Encrypted) {
            if (err) {
                return void emit('error', err);
            }
            // Decrypt the blob
            decrypt(u8Encrypted, strKey, function (errDecryption, u8Decrypted) {
                if (errDecryption) {
                    return void emit('error', errDecryption);
                }
                // Cache and display the decrypted blob
                cache[uid] = u8Decrypted;
                end(u8Decrypted);
            }, function (progress) {
                emit('progress', {
                    progress: progress
                });
            });
        });

        return mediaObject;
    };

    // Add the cache as a property of MediaTag
    cache = init.__Cryptpad_Cache = {};

    init.PdfPlugin = {};

    return init;
}));
