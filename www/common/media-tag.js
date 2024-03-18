// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function (window) {
var factory = function () {
    var Promise = window.Promise;
    var cache;
    var cypherChunkLength = 131088;
    var sendCredentials = window.sendCredentials || false; // SSO find a logical place to infer whether this should be set

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


    var isplainTextFile = function (metadata) {
        // does its type begins with "text/"
        if (metadata.type.indexOf("text/") === 0) { return true; }
        // no type and no file extension -> let's guess it's plain text
        var parsedName = /^(\.?.+?)(\.[^.]+)?$/.exec(metadata.name) || [];
        if (!metadata.type && !parsedName[2]) { return true; }
        // other exceptions
        if (metadata.type === 'application/x-javascript') { return true; }
        if (metadata.type === 'application/xml') { return true; }
        return false;
    };

    // Default config, can be overriden per media-tag call
    var config = {
        allowed: [
            'text/plain',
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/jpg',
            'image/gif',
            'audio/mpeg',
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
            text: "Save",
            textDl: "Load attachment"
        },
        Plugins: {
            /**
             * @param {object}   metadataObject {name,  metadatatype, owners} containing metadata of the file
             * @param {strint}   url     Url of the blob object
             * @param {Blob}     content Blob object containing the data of the file
             * @param {object}   cfg     Object {Plugins, allowed, download, pdf} containing infos about plugins
             * @param {function} cb      Callback function: (err, pluginElement) => {}
             */
            text: function (metadata, url, content, cfg, cb) {
                var plainText = document.createElement('div');
                plainText.className = "plain-text-reader";
                plainText.setAttribute('style', 'white-space: pre-wrap;');
                var reader = new FileReader();
                reader.addEventListener('loadend', function (e) {
                    plainText.innerText = e.srcElement.result;
                    cb(void 0, plainText);
                });
                try {
                    reader.readAsText(content);
                } catch (err) {
                    cb(err);
                }
            },
            image: function (metadata, url, content, cfg, cb) {
                var img = document.createElement('img');
                img.setAttribute('src', url);
                img.setAttribute('alt', metadata.alt || "");
                img.blob = content;
                cb(void 0, img);
            },
            video: function (metadata, url, content, cfg, cb) {
                var video = document.createElement('video');
                video.setAttribute('src', url);
                video.setAttribute('controls', true);
                // https://discuss.codecademy.com/t/can-we-use-an-alt-attribute-with-the-video-tag/300322/4
                video.setAttribute('title', metadata.alt || "");
                cb(void 0, video);
            },
            audio: function (metadata, url, content, cfg, cb) {
                var audio = document.createElement('audio');
                audio.setAttribute('src', url);
                audio.setAttribute('controls', true);
                audio.setAttribute('alt', metadata.alt || "");
                cb(void 0, audio);
            },
            pdf: function (metadata, url, content, cfg, cb) {
                var iframe = document.createElement('iframe');
                if (cfg.pdf.viewer) { // PDFJS
                    var viewerUrl = cfg.pdf.viewer + '?file=' + url;
                    iframe.src = viewerUrl + '#' + window.encodeURIComponent(metadata.name);
                    iframe.onload = function () {
                        if (!metadata.name) { return; }
                        try {
                            iframe.contentWindow.PDFViewerApplication.setTitleUsingUrl(metadata.name);
                        } catch (e) { console.warn(e); }
                    };
                    return void cb (void 0, iframe);
                }
                iframe.src = url + '#' + window.encodeURIComponent(metadata.name);
                return void cb (void 0, iframe);
            },
            download: function (metadata, url, content, cfg, cb) {
                var btn = document.createElement('button');
                btn.setAttribute('class', 'btn btn-default');
                btn.setAttribute('alt', metadata.alt || "");
                btn.innerHTML = '<i class="fa fa-save"></i>' + cfg.download.text + '<br>' +
                                (metadata.name ? '<b>' + fixHTML(metadata.name) + '</b>' : '');
                btn.addEventListener('click', function () {
                    saveFile(content, url, metadata.name);
                });
                cb(void 0, btn);
            }
        }
    };

    var makeProgressBar = function (cfg, mediaObject) {
        if (mediaObject.bar) { return; }
        mediaObject.bar = true;
        var style = (function(){/*
.mediatag-progress-container {
    position: relative;
    border: 1px solid #0087FF;
    background: white;
    height: 25px;
    display: inline-flex;
    width: 200px;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    vertical-align: top;
    border-radius: 5px;
}
.mediatag-progress-bar {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: #0087FF;
    width: 0%;
}
.mediatag-progress-text {
    font-size: 14px;
    height: 25px;
    width: 50px;
    margin-left: 5px;
    line-height: 25px;
    vertical-align: top;
    display: inline-block;
    color: #3F4141;
    font-weight: bold;
}
*/}).toString().slice(14, -3);
        var container = document.createElement('div');
        container.classList.add('mediatag-progress-container');
        var bar = document.createElement('div');
        bar.classList.add('mediatag-progress-bar');
        container.appendChild(bar);

        var text = document.createElement('span');
        text.classList.add('mediatag-progress-text');
        text.innerText = '0%';

        mediaObject.on('progress', function (obj) {
            var percent = obj.progress;
            text.innerText = (Math.round(percent*10))/10+'%';
            bar.setAttribute('style', 'width:'+percent+'%;');
        });

        mediaObject.tag.innerHTML = '<style>'+style+'</style>';
        mediaObject.tag.appendChild(container);
        mediaObject.tag.appendChild(text);
    };
    var makeDownloadButton = function (cfg, mediaObject, size, cb) {
        var metadata = cfg.metadata || {};
        var i = '<i class="fa fa-paperclip"></i>';
        var name = metadata.name ? '<span class="mediatag-download-name">'+ i +'<b>'+
                                    fixHTML(metadata.name)+'</b></span>' : '';
        var btn = document.createElement('button');
        btn.setAttribute('class', 'btn btn-default mediatag-download-btn');
        btn.innerHTML = name + '<span>' + (name ? '' : i) +
                cfg.download.textDl + ' <b>(' + size  + 'MB)</b></span>';
        btn.addEventListener('click', function () {
            makeProgressBar(cfg, mediaObject);
            var a = (cfg.body || document).querySelectorAll('media-tag[src="'+mediaObject.tag.getAttribute('src')+'"] button.mediatag-download-btn');
            for(var i = 0; i < a.length; i++) {
                if (a[i] !== btn) { a[i].click(); }
            }
            cb();
        });
        mediaObject.tag.innerHTML = '';
        mediaObject.tag.appendChild(btn);
    };

    var getCacheKey = function (src) {
        var _src = src.replace(/(\/)*$/, ''); // Remove trailing slashes
        var idx = _src.lastIndexOf('/');
        var cacheKey = _src.slice(idx+1);
        if (!/^[a-f0-9]{48}$/.test(cacheKey)) { cacheKey = undefined; }
        return cacheKey;
    };

    var getBlobCache = function (id, cb) {
        if (!config.Cache || typeof(config.Cache.getBlobCache) !== "function") {
            return void cb('EINVAL');
        }
        config.Cache.getBlobCache(id, cb);
    };
    var setBlobCache = function (id, u8, cb) {
        if (!config.Cache || typeof(config.Cache.setBlobCache) !== "function") {
            return void cb('EINVAL');
        }
        config.Cache.setBlobCache(id, u8, cb);
    };

    var headRequest = function (src, cb) {
        var xhr = new XMLHttpRequest();
        xhr.open("HEAD", src);
        if (sendCredentials) { xhr.withCredentials = true; }
        xhr.onerror = function () { return void cb("XHR_ERROR"); };
        xhr.onreadystatechange = function() {
            if (this.readyState === this.DONE) {
                cb(null, Number(xhr.getResponseHeader("Content-Length")));
            }
        };
        xhr.onload = function () {
            if (/^4/.test('' + this.status)) { return void cb("XHR_ERROR " + this.status); }
        };
        xhr.send();

    };
    var getFileSize = function (src, _cb) {
        var cb = function (e, res) {
            _cb(e, res);
            cb = function () {};
        };

        var cacheKey = getCacheKey(src);

        var check = function () {
            headRequest(src, cb);
        };

        if (!cacheKey) { return void check(); }

        getBlobCache(cacheKey, function (err, u8) {
            check(); // send the HEAD request to update the blob activity
            if (err || !u8) { return; }
            cb(null, 0);
        });
    };

    // Download a blob from href
    var download = function (src, _cb, progressCb) {
        var cb = function (e, res) {
            _cb(e, res);
            cb = function () {};
        };

        var cacheKey = getCacheKey(src);

        var fetch = function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            if (sendCredentials) { xhr.withCredentials = true; }
            xhr.responseType = 'arraybuffer';

            var progress = function (offset) {
                progressCb(offset * 100);
            };
            xhr.addEventListener("progress", function (evt) {
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    progress(percentComplete);
                }
            }, false);

            xhr.onerror = function () { return void cb("XHR_ERROR"); };
            xhr.onload = function () {
                // Error?
                if (/^4/.test('' + this.status)) { return void cb("XHR_ERROR " + this.status); }

                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var u8 = new Uint8Array(arrayBuffer);
                    if (cacheKey) {
                        return void setBlobCache(cacheKey, u8, function () {
                            cb(null, u8);
                        });
                    }
                    cb(null, u8);
                }
            };

            xhr.send(null);
        };

        if (!cacheKey) { return void fetch(); }

        getBlobCache(cacheKey, function (err, u8) {
            if (err || !u8) { return void fetch(); }
            cb(null, u8);
        });

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
                if (N[l] !== 255) { return void N[l]++; }

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

    // The metadata size can go up to 65535 (16 bits - 2 bytes)
    // The first 8 bits are stored in A[0]
    // The last 8 bits are stored in A[0]
    var uint8ArrayJoin = function (AA) {
        var l = 0;
        var i = 0;
        for (; i < AA.length; i++) { l += AA[i].length; }
        var C = new Uint8Array(l);

        i = 0;
        for (var offset = 0; i < AA.length; i++) {
            C.set(AA[i], offset);
            offset += AA[i].length;
        }
        return C;
    };
    var fetchMetadata = function (src, _cb) {
        var cb = function (e, res) {
            _cb(e, res);
            cb = function () {};
        };

        var cacheKey = getCacheKey(src);

        var fetch = function () {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', src, true);
            if (sendCredentials) { xhr.withCredentials = true; }
            xhr.setRequestHeader('Range', 'bytes=0-1');
            xhr.responseType = 'arraybuffer';

            xhr.onerror = function () { return void cb("XHR_ERROR"); };
            xhr.onload = function () {
                // Error?
                if (/^4/.test('' + this.status)) { return void cb("XHR_ERROR " + this.status); }
                var res = new Uint8Array(xhr.response);
                var size = Decrypt.decodePrefix(res);
                var xhr2 = new XMLHttpRequest();

                xhr2.open("GET", src, true);
                if (sendCredentials) { xhr2.withCredentials = true; }
                xhr2.setRequestHeader('Range', 'bytes=2-' + (size + 2));
                xhr2.responseType = 'arraybuffer';
                xhr2.onload = function () {
                    if (/^4/.test('' + this.status)) { return void cb("XHR_ERROR " + this.status); }
                    var res2 = new Uint8Array(xhr2.response);
                    var all = uint8ArrayJoin([res, res2]);
                    cb(void 0, all);
                };
                xhr2.send(null);
            };

            xhr.send(null);
        };

        if (!cacheKey) { return void fetch(); }

        getBlobCache(cacheKey, function (err, u8) {
            if (err || !u8) { return void fetch(); }
            var size = Decrypt.decodePrefix(u8.subarray(0,2));
            cb(null, u8.subarray(0, size+2));
        });
    };
    var decryptMetadata = function (u8, key) {
        var prefix = u8.subarray(0, 2);
        var metadataLength = Decrypt.decodePrefix(prefix);

        var metaBox = new Uint8Array(u8.subarray(2, 2 + metadataLength));
        var metaChunk = window.nacl.secretbox.open(metaBox, Decrypt.createNonce(), key);

        try {
            return JSON.parse(window.nacl.util.encodeUTF8(metaChunk));
        }
        catch (e) { return null; }
    };
    var fetchDecryptedMetadata = function (src, key, cb) {
        if (typeof(src) !== 'string') {
            return window.setTimeout(function () {
                cb('NO_SOURCE');
            });
        }
        fetchMetadata(src, function (e, buffer) {
            if (e) { return cb(e); }
            if (typeof(key) === "string") { key = Decrypt.getKeyFromStr(key); }
            cb(void 0, decryptMetadata(buffer, key));
        });
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
                    if ((i * cypherChunkLength + 2 + metadataLength) < u8.length) { // not done
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
        var metadata = decrypted.metadata || {};
        var blob = decrypted.content;

        var mediaType = getType(mediaObject, metadata, cfg);
        if (isplainTextFile(metadata)) {
            mediaType = "text";
        }

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

    var initHandlers = function () {
        return {
            'progress': [],
            'complete': [],
            'metadata': [],
            'error': []
        };
    };

    // Initialize a media-tag
    var init = function (el, cfg) {
        cfg = cfg || {};

        addMissingConfig(cfg, config);

        // Handle jQuery elements
        if (typeof(el) === "object" && el.jQuery) { el = el[0]; }

        // Abort smoothly if the element is not a media-tag
        if (!el || el.nodeName !== "MEDIA-TAG") {
            console.error("Not a media-tag!");
            return {
                on: function () { return this; }
            };
        }

        var handlers = cfg.handlers || initHandlers();
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
            mediaObject.complete = true;
            process(mediaObject, decrypted, cfg, function (err) {
                if (err) { return void emit('error', err); }
                mediaObject._blob = decrypted;
                emit('complete', decrypted);
            });
        };

        var error = function (err) {
            mediaObject.tag.innerHTML = '<img style="width: 100px; height: 100px;" src="/images/broken.png">';
            emit('error', err);
        };

        var getCache = function () {
            var c = cache[uid];
            if (!c || !c.promise || !c.mt) { return; }
            return c;
        };

        var dl = function () {
            // Download the encrypted blob
            cache[uid] = getCache() || {
                promise: new Promise(function (resolve, reject) {
                    download(src, function (err, u8Encrypted) {
                        if (err) {
                            return void reject(err);
                        }
                        // Decrypt the blob
                        decrypt(u8Encrypted, strKey, function (errDecryption, u8Decrypted) {
                            if (errDecryption) {
                                return void reject(errDecryption);
                            }
                            emit('metadata', u8Decrypted.metadata);
                            resolve(u8Decrypted);
                        }, function (progress) {
                            emit('progress', {
                                progress: 50+0.5*progress
                            });
                        });
                    }, function (progress) {
                        emit('progress', {
                            progress: 0.5*progress
                        });
                    });
                }),
                mt: mediaObject
            };
            if (cache[uid].mt !== mediaObject) {
                // Add progress for other instances of this tag
                cache[uid].mt.on('progress', function (obj) {
                    if (!mediaObject.bar && !cfg.force) { makeProgressBar(cfg, mediaObject); }
                    emit('progress', {
                        progress: obj.progress
                    });
                });
            }
            cache[uid].promise.then(function (u8) {
                end(u8);
            }, function (err) {
                error(err);
            });
        };

        if (cfg.force) {
            headRequest(src, function () {}); // Update activity
            dl();
            return mediaObject;
        }

        var maxSize = typeof(config.maxDownloadSize) === "number" ? config.maxDownloadSize
                                : (5 * 1024 * 1024);
        fetchDecryptedMetadata(src, strKey, function (err, md) {
            if (err) { return void error(err); }
            cfg.metadata = md;
            emit('metadata', md);
            getFileSize(src, function (err, size) {
                // If the size is smaller than the autodownload limit, load the blob.
                // If the blob is already loaded or being loaded, don't show the button.
                if (!size || size <  maxSize || getCache()) {
                    makeProgressBar(cfg, mediaObject);
                    return void dl();
                }
                var sizeMb = Math.round(10 * size / 1024 / 1024) / 10;
                makeDownloadButton(cfg, mediaObject, sizeMb, dl);
            });
        });

        return mediaObject;
    };

    // Add the cache as a property of MediaTag
    cache = init.__Cryptpad_Cache = {};

    init.setDefaultConfig = function (key, value) {
        config[key] = value;
    };

    init.fetchDecryptedMetadata = fetchDecryptedMetadata;

    init.preview = function (content, metadata, cfg, cb) {
        cfg = cfg || {};
        addMissingConfig(cfg, config);
        var handlers = cfg.handlers || initHandlers();
        var el = document.createElement('media-tag');
        var mediaObject = el._mediaObject = {
            handlers: handlers,
            tag: el,
        };
        process(mediaObject, {
            metadata: metadata,
            content: content
        }, cfg, function (err) {
            if (err) { return void cb(err); }
            cb(void 0, el);
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
        // unsupported initialization
    }
}(typeof(window) !== 'undefined'? window : {}));
