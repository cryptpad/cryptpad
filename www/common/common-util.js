// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function (window) {
    var Util = {};

    // polyfill for atob in case you're using this from node...
    window.atob = window.atob || function (str) { return Buffer.from(str, 'base64').toString('binary'); };
    window.btoa = window.btoa || function (str) { return Buffer.from(str, 'binary').toString('base64'); };

    Util.slice = function (A, start, end) {
        return Array.prototype.slice.call(A, start, end);
    };

    Util.shuffleArray = function (a) {
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
    };

    Util.bake = function (f, args) {
        if (typeof(args) === 'undefined') { args = []; }
        if (!Array.isArray(args)) { args = [args]; }
        return function () {
            return f.apply(null, args);
        };
    };

    Util.both = function (pre, post) {
        if (typeof(pre) !== 'function') { throw new Error('INVALID_USAGE'); }
        if (typeof(post) !== 'function') { post = function (x) { return x; }; }
        return function () {
            pre.apply(null, arguments);
            return post.apply(null, arguments);
        };
    };

    Util.clone = function (o) {
        if (o === undefined || o === null) { return o; }
        return JSON.parse(JSON.stringify(o));
    };

    Util.serializeError = function (err) {
        if (!(err instanceof Error)) { return err; }
        var ser = {};
        Object.getOwnPropertyNames(err).forEach(function (key) {
            ser[key] = err[key];
        });
        return ser;
    };

    Util.tryParse = function (s) {
        try { return JSON.parse(s); } catch (e) { return;}
    };

    Util.mkAsync = function (f, ms) {
        if (typeof(f) !== 'function') {
            throw new Error('EXPECTED_FUNCTION');
        }
        return function () {
            var args = Array.prototype.slice.call(arguments);
            setTimeout(function () {
                f.apply(null, args);
            }, ms);
        };
    };

    // If once is true, after the event has been fired, any further handlers which are
    // registered will fire immediately, and this type of event cannot be fired twice.
    Util.mkEvent = function (once) {
        var handlers = [];
        var fired = false;
        return {
            reg: function (cb) {
                if (once && fired) { return void setTimeout(cb); }
                handlers.push(cb);
            },
            unreg: function (cb) {
                if (handlers.indexOf(cb) === -1) {
                    return void console.log("event handler was already unregistered");
                }
                handlers.splice(handlers.indexOf(cb), 1);
            },
            fire: function () {
                if (once && fired) { return; }
                fired = true;
                var args = Array.prototype.slice.call(arguments);
                handlers.forEach(function (h) { h.apply(null, args); });
            }
        };
    };

    Util.mkTimeout = function (_f, ms) {
        ms = ms || 0;
        var f = Util.once(_f);

        var timeout = setTimeout(function () {
            f('TIMEOUT');
        }, ms);

        return Util.both(f, function () {
            clearTimeout(timeout);
        });
    };

    Util.onClickEnter = function ($element, handler, cfg) {
        $element.on('click keydown', function (e) {
            var isClick = e.type === 'click';
            var isEnter = e.type === 'keydown' && e.which === 13;
            var isSpace = e.type === 'keydown' && e.which === 32 && cfg && cfg.space;
            if (!isClick && !isEnter && !isSpace) { return; }

            // "enter" on a button triggers a click, disable it
            if (e.type === 'keydown') { e.preventDefault(); }

            handler(e);
        });
    };

    Util.response = function (errorHandler) {
        var pending = {};
        var timeouts = {};

        if (typeof(errorHandler) !== 'function') {
            errorHandler = function (label) {
                throw new Error(label);
            };
        }

        var clear = function (id) {
            clearTimeout(timeouts[id]);
            delete timeouts[id];
            delete pending[id];
        };

        var expect = function (id, fn, ms) {
            if (typeof(id) !== 'string') { errorHandler('EXPECTED_STRING'); }
            if (typeof(fn) !== 'function') { errorHandler('EXPECTED_CALLBACK'); }
            pending[id] = fn;
            if (typeof(ms) === 'number' && ms) {
                timeouts[id] = setTimeout(function () {
                    if (typeof(pending[id]) === 'function') { pending[id]('TIMEOUT'); }
                    clear(id);
                }, ms);
            }
        };

        var handle = function (id, args) {
            var fn = pending[id];
            if (typeof(fn) !== 'function') {
                return void errorHandler("MISSING_CALLBACK", {
                    id: id,
                    args: args,
                });
            }
            try {
                fn.apply(null, Array.isArray(args)? args : [args]);
            } catch (err) {
                errorHandler('HANDLER_ERROR', {
                    error: err,
                    id: id,
                    args: args,
                });
            }
            clear(id);
        };

        return {
            clear: clear,
            expected: function (id) {
                return Boolean(pending[id]);
            },
            expectation: function (id) {
                return pending[id];
            },
            expect: expect,
            handle: handle,
            _pending: pending,
        };
    };

    Util.inc = function (map, key, val) {
        map[key] = (map[key] || 0) + (typeof(val) === 'number'? val: 1);
    };

    Util.values = function (obj) {
        return Object.keys(obj).map(function (k) {
            return obj[k];
        });
    };

    Util.find = function (map, path) {
        var l = path.length;
        for (var i = 0; i < l; i++) {
            if (typeof(map[path[i]]) === 'undefined') { return; }
            map = map[path[i]];
        }
        return map;
    };

    Util.uid = function () {
        return Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
            .toString(32).replace(/\./g, '');
    };

    Util.guid = function (map) {
        var id = Util.uid();
        // the guid (globally unique id) is valid if it does already exist in the map
        if (typeof(map[id]) === 'undefined') { return id; }
        // otherwise try again
        return Util.guid(map);
    };

    Util.fixHTML = function (str) {
        if (!str) { return ''; }
        return str.replace(/[<>&"']/g, function (x) {
            return ({ "<": "&lt;", ">": "&gt", "&": "&amp;", '"': "&#34;", "'": "&#39;" })[x];
        });
    };

    Util.hexToBase64 = function (hex) {
        var hexArray = hex
            .replace(/\r|\n/g, "")
            .replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
            .replace(/ +$/, "")
            .split(" ");
        var byteString = String.fromCharCode.apply(null, hexArray);
        return window.btoa(byteString).replace(/\//g, '-').replace(/=+$/, '');
    };

    Util.base64ToHex = function (b64String) {
        var hexArray = [];
        window.atob(b64String.replace(/-/g, '/')).split("").forEach(function(e){
            var h = e.charCodeAt(0).toString(16);
            if (h.length === 1) { h = "0"+h; }
            hexArray.push(h);
        });
        return hexArray.join("");
    };

    Util.uint8ArrayToHex = function (bytes) {
        var hexString = '';
        for (var i = 0; i < bytes.length; i++) {
            if (bytes[i] < 16) { hexString += '0'; }
            hexString += bytes[i].toString(16);
        }
        return hexString;
    };

    Util.hexToUint8Array = function (hexString) {
        var bytes = new Uint8Array(Math.ceil(hexString.length / 2));
        for (var i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
        }
        return bytes;
    };

    // given an array of Uint8Arrays, return a new Array with all their values
    Util.uint8ArrayJoin = function (AA) {
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

    Util.escapeKeyCharacters = function (key) {
        return key && key.replace && key.replace(/\//g, '-');
    };

    Util.unescapeKeyCharacters = function (key) {
        return key.replace(/\-/g, '/');
    };

    Util.deduplicateString = function (array) {
        var a = array.slice();
        for(var i=0; i<a.length; i++) {
            for(var j=i+1; j<a.length; j++) {
                if(a[i] === a[j]) { a.splice(j--, 1); }
            }
        }
        return a;
    };

    /*
     *  Saving files
     */
    Util.fixFileName = function (filename) {
        return filename.replace(/ /g, '-').replace(/[\/\?]/g, '_')
            .replace(/_+/g, '_');
    };

    var oneKilobyte = 1024;
    var oneMegabyte = 1024 * oneKilobyte;
    var oneGigabyte = 1024 * oneMegabyte;

    Util.bytesToGigabytes = function (bytes) {
        return Math.ceil(bytes / oneGigabyte * 100) / 100;
    };

    Util.bytesToMegabytes = function (bytes) {
        return Math.ceil(bytes / oneMegabyte * 100) / 100;
    };

    Util.bytesToKilobytes = function (bytes) {
        return Math.ceil(bytes / oneKilobyte * 100) / 100;
    };

    Util.magnitudeOfBytes = function (bytes) {
        if (bytes >= oneGigabyte) { return 'GB'; }
        else if (bytes >= oneMegabyte) { return 'MB'; }
        else { return 'KB'; }
    };

    // given a path, asynchronously return an arraybuffer
    var getCacheKey = function (src) {
        var _src = src.replace(/(\/)*$/, ''); // Remove trailing slashes
        var idx = _src.lastIndexOf('/');
        var cacheKey = _src.slice(idx+1);
        if (!/^[a-f0-9]{48}$/.test(cacheKey)) { cacheKey = undefined; }
        return cacheKey;
    };


    Util.getBlock = function (src, opt, cb) {
        var CB = Util.once(Util.mkAsync(cb));

        var headers = {};

        if (typeof(opt.bearer) === 'string' && opt.bearer) {
            headers.authorization = `Bearer ${opt.bearer}`;
        }


        fetch(src, {
            method: 'GET',
            credentials: 'include',
            headers: headers,
        }).then(response => {
            if (response.ok) {
                // TODO this should probably be returned as an arraybuffer or something rather than a promise
                // this is resulting in some code duplication
                return void CB(void 0, response);
            }
            if (response.status === 401 || response.status === 404) {
                response.json().then((data) => {
                    CB(response.status, data);
                }).catch(() => {
                    CB(response.status);
                });

                return;
            }
            CB(response.status, response);
        }).catch(error => {
            CB(error);
        });
    };


    Util.fetch = function (src, cb, progress, cache) {
        var CB = Util.once(Util.mkAsync(cb));

        var cacheKey = getCacheKey(src);
        var getBlobCache = function (id, cb) {
            if (!cache || typeof(cache.getBlobCache) !== "function") { return void cb('EINVAL'); }
            cache.getBlobCache(id, cb);
        };
        var setBlobCache = function (id, u8, cb) {
            if (!cache || typeof(cache.setBlobCache) !== "function") { return void cb('EINVAL'); }
            cache.setBlobCache(id, u8, cb);
        };

        var xhr;

        var fetch = function () {
            xhr = new XMLHttpRequest();
            xhr.open("GET", src, true);
            if (progress) {
                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        progress(percentComplete);
                    }
                }, false);
            }
            xhr.responseType = "arraybuffer";
            xhr.onerror = function (err) { CB(err); };
            xhr.onload = function () {
                if (/^4/.test(''+this.status)) {
                    return CB('XHR_ERROR');
                }

                var arrayBuffer = xhr.response;
                if (arrayBuffer) {
                    var u8 = new Uint8Array(arrayBuffer);
                    if (cacheKey) {
                        return void setBlobCache(cacheKey, u8, function () {
                            CB(null, u8);
                        });
                    }
                    return void CB(void 0, u8);
                }
                CB('ENOENT');
            };
            xhr.send(null);
        };

        if (!cacheKey) { return void fetch(); }

        getBlobCache(cacheKey, function (err, u8) {
            if (err || !u8) { return void fetch(); }
            CB(void 0, u8);
        });

        return {
            cancel: function () {
                if (xhr && xhr.abort) { xhr.abort(); }
            }
        };
    };

    Util.dataURIToBlob = function (dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        var bb = new Blob([ab], {type: mimeString});
        return bb;
    };

    Util.throttle = function (f, ms) {
        var last = 0;
        var to;
        var args;

        var defer = function (delay) {
            // no timeout: run function `f` in `ms` milliseconds
            // unless `g` is called again in the meantime
            to = setTimeout(function () {
                // wipe the current timeout handler
                to = undefined;

                // take the current time
                var now = +new Date();
                // compute time passed since `last`
                var diff = now - last;
                if (diff < ms) {
                    // don't run `f` if `g` was called since this timeout was set
                    // instead calculate how much further in the future your next
                    // timeout should be scheduled
                    return void defer(ms - diff);
                }

                // else run `f` with the most recently supplied arguments
                f.apply(null, args);
            }, delay);
        };

        var g = function () {
            // every time you call this function store the time
            last = +new Date();
            // remember what arguments were passed
            args = Util.slice(arguments);
            // if there is a pending timeout then do nothing
            if (to) { return; }
            defer(ms);
        };

        g.clear = function () {
            clearTimeout(to);
            to = undefined;
        };
        return g;
    };

    /*  takes a function (f) and a time (t) in ms. returns a function wrapper
        which prevents the internal function from being called more than once
        every t ms. if the function is prevented, returns time til next valid
        execution, else null.
    */
    Util.notAgainForAnother = function (f, t) {
        if (typeof(f) !== 'function' || typeof(t) !== 'number') {
            throw new Error("invalid inputs");
        }
        var last = null;
        return function () {
            var now = +new Date();
            if (last && now <= last + t) { return t - (now - last); }
            last = now;
            f.apply(null, Util.slice(arguments));
            return null;
        };
    };

    Util.createRandomInteger = function () {
        return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    };

    Util.noop = function () {};

    /* for wrapping async functions such that they can only be called once */
    Util.once = function (f, g) {
        return function () {
            if (!f) { return; }
            f.apply(this, Array.prototype.slice.call(arguments));
            f = g;
        };
    };

    Util.blobToImage = function (blob, cb) {
        var reader = new FileReader();
        reader.onloadend = function() {
            cb(reader.result);
        };
        reader.readAsDataURL(blob);
    };
    Util.blobURLToImage = function (url, cb) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                cb(reader.result);
            };
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    };

    // Check if an element is a plain object
    Util.isObject = function (o) {
        return typeof (o) === "object" &&
               Object.prototype.toString.call(o) === '[object Object]';
    };

    Util.isCircular = function (o) {
        try {
            JSON.stringify(o);
            return false;
        } catch (e) { return true; }
    };

    /*  recursively adds the properties of an object 'b' to 'a'
        arrays are only shallow copies, so references to the original
        might still be present. Be mindful if you will modify 'a' in the future */
    Util.extend = function (a, b) {
        if (!Util.isObject(a) || !Util.isObject(b)) {
            return void console.log("Extend only works with 2 objects");
        }
        if (Util.isCircular(b)) {
            return void console.log("Extend doesn't accept circular objects");
        }
        for (var k in b) {
            if (Util.isObject(b[k])) {
                a[k] = Util.isObject(a[k]) ? a[k] : {};
                Util.extend(a[k], b[k]);
                continue;
            }
            if (Array.isArray(b[k])) {
                a[k] = b[k].slice();
                continue;
            }
            a[k] = b[k];
        }
    };

    Util.isChecked = function (el) {
        // could be nothing...
        if (!el) { return false; }
        // check if it's a dom element
        if (typeof(el.tagName) !== 'undefined') {
            return Boolean(el.checked);
        }
        // sketchy test to see if it's jquery
        if (typeof(el.prop) === 'function') {
            return Boolean(el.prop('checked'));
        }
        // else just say it's not checked
        return false;
    };

    Util.hexToRGB = function (hex) {
        var h = hex.replace(/^#/, '');
        return [
            parseInt(h.slice(0,2), 16),
            parseInt(h.slice(2,4), 16),
            parseInt(h.slice(4,6), 16),
        ];
    };

    Util.isSmallScreen = function () {
        return window.innerHeight < 800 || window.innerWidth < 800;
    };

    Util.stripTags = function (text) {
        var div = document.createElement("div");
        div.innerHTML = text;
        return div.innerText;
    };

    // return an object containing {name, ext}
    // or {} if the name could not be parsed
    Util.parseFilename = function (filename) {
        if (!filename || !filename.trim()) { return {}; }
        var parsedName =  /^(\.?.+?)(\.[^.]+)?$/.exec(filename) || [];
        return {
            name: parsedName[1],
            ext: parsedName[2],
        };
    };

    // Tell if a file is plain text from its metadata={title, fileType}
    Util.isPlainTextFile = function (type, name) {
        // does its type begins with "text/"
        if (type && type.indexOf("text/") === 0) { return true; }
        // no type and no file extension -> let's guess it's plain text
        var parsedName = Util.parseFilename(name);
        if (!type && name && !parsedName.ext) { return true; }
        // other exceptions
        if (type === 'application/x-javascript') { return true; }
        if (type === 'application/xml') { return true; }
        return false;
    };

    // Tell if a file is spreadsheet from its metadata={title, fileType}
    Util.isSpreadsheet = function (type, name) {
        return (type &&
                    (type === 'application/vnd.oasis.opendocument.spreadsheet' ||
                    type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'))
                || (name && (name.endsWith('.xlsx') || name.endsWith('.ods')));
    };
    Util.isOfficeDoc = function (type, name) {
        return (type &&
                    (type === 'application/vnd.oasis.opendocument.text' ||
                    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'))
                || (name && (name.endsWith('.docx') || name.endsWith('.odt')));
    };
    Util.isPresentation = function (type, name) {
        return (type &&
                    (type === 'application/vnd.oasis.opendocument.presentation' ||
                    type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'))
                || (name && (name.endsWith('.pptx') || name.endsWith('.odp')));
    };

    Util.isValidURL = function (str) {
        var pattern = new RegExp('^(https?:\\/\\/)'+ // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?'); // query string
            //'(\\#[-a-z\\d_]*)?$','i'); // fragment locator
        return !!pattern.test(str);
    };

    var emoji_patt = /([\uD800-\uDBFF][\uDC00-\uDFFF])/;
    var isEmoji = function (str) {
      return emoji_patt.test(str);
    };
    var emojiStringToArray = function (str) {
      var split = str.split(emoji_patt);
      var arr = [];
      for (var i=0; i<split.length; i++) {
        var char = split[i];
        if (char !== "") {
          arr.push(char);
        }
      }
      return arr;
    };
    Util.getFirstCharacter = function (str) {
      if (!str || !str.trim()) { return '?'; }
      var emojis = emojiStringToArray(str);
      return isEmoji(emojis[0])? emojis[0]: str[0];
    };

    Util.getRandomColor = function (light) {
        var getColor = function () {
            if (light) {
                return Math.floor(Math.random() * 156) + 70;
            }
            return Math.floor(Math.random() * 200) + 25;
        };
        return '#' + getColor().toString(16) +
                     getColor().toString(16) +
                     getColor().toString(16);
    };

    Util.checkRestrictedApp = function (app, AppConfig, earlyTypes, plan, loggedIn) {
        // If this is an early access app, make sure this instance allows them
        if (Array.isArray(earlyTypes) && earlyTypes.includes(app) && !AppConfig.enableEarlyAccess) {
            return -2;
        }

        var premiumTypes = AppConfig.premiumTypes;
        // If this is not a premium app, don't disable it
        if (!Array.isArray(premiumTypes) || !premiumTypes.includes(app)) { return 2; }
        // This is a premium app
        // if you're not logged in, disable it
        if (!loggedIn) { return -1; }
        // if you're logged in, enable it only if you're a premium user
        return plan ? 1 : 0;

    };

    /*  Chrome 92 dropped support for SharedArrayBuffer in cross-origin contexts
        where window.crossOriginIsolated is false.

        Their blog (https://blog.chromium.org/2021/02/restriction-on-sharedarraybuffers.html)
        isn't clear about why they're doing this, but since it's related to site-isolation
        it seems they're trying to do vague security things.

        In any case, there seems to be a workaround where you can still create them
        by using `new WebAssembly.Memory({shared: true, ...})` instead of `new SharedArrayBuffer`.

        This seems unreliable, but it's better than not being able to export, since
        we actively rely on postMessage between iframes and therefore can't afford
        to opt for full isolation.
    */
    var supportsSharedArrayBuffers = function () {
        try {
            return Object.prototype.toString.call(new window.WebAssembly.Memory({shared: true, initial: 0, maximum: 0}).buffer) === '[object SharedArrayBuffer]';
        } catch (err) {
            console.error(err);
        }
        return false;
    };
    Util.supportsWasm = function () {
        return !(typeof(Atomics) === "undefined" || !supportsSharedArrayBuffers() || typeof(WebAssembly) === 'undefined');
    };

    //Returns an array of integers in range 0 to (length-1)
    Util.getKeysArray = function (length) {
        return [...Array(length).keys()];
    };

    Util.getVersionFromUrlArgs = urlArgs => {
        let arr = /ver=([0-9.]+)(-[0-9]*)?/.exec(urlArgs);
        let ver = Array.isArray(arr) && arr[1];
        return ver || undefined;
    };

    Util.get = function(obj, key, defaultValue = undefined) {
        if (typeof key === "string") {
            key = key.split(".");
        }

        for (const k of key) {
            if (obj == null) {
                return defaultValue;
            }
            obj = obj[k];
        }

        if (obj == null) {
            return defaultValue;
        }
        return obj;
    };

    Util.deepAssign = function(target, source) {
        if (typeof target != "object") {
            return source;
        }

        const result = Object.assign({}, target);
        for (const key of Object.keys(source)) {
            result[key] = Util.deepAssign(target[key], source[key]);
        }
        return result;
    };

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = Util;
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define([], function () {
            window.CryptPad_Util = Util;
            return Util;
        });
    } else {
        window.CryptPad_Util = Util;
    }
}(typeof(self) !== 'undefined'? self: this));
