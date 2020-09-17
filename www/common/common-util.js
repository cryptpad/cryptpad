(function (window) {
    var Util = {};

    // polyfill for atob in case you're using this from node...
    window.atob = window.atob || function (str) { return Buffer.from(str, 'base64').toString('binary'); }; // jshint ignore:line
    window.btoa = window.btoa || function (str) { return Buffer.from(str, 'binary').toString('base64'); }; // jshint ignore:line

    Util.slice = function (A, start, end) {
        return Array.prototype.slice.call(A, start, end);
    };

    Util.bake = function (f, args) {
        if (typeof(args) === 'undefined') { args = []; }
        if (!Array.isArray(args)) { args = [args]; }
        return function () {
            return f.apply(null, args);
        };
    };

    Util.both = function (pre, post) {
        if (typeof(post) !== 'function') { post = function (x) { return x; }; }
        return function () {
            pre.apply(null, arguments);
            return post.apply(null, arguments);
        };
    };

    Util.clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    Util.tryParse = function (s) {
        try { return JSON.parse(s); } catch (e) { return;}
    };

    Util.mkAsync = function (f) {
        if (typeof(f) !== 'function') {
            throw new Error('EXPECTED_FUNCTION');
        }
        return function () {
            var args = Array.prototype.slice.call(arguments);
            setTimeout(function () {
                f.apply(null, args);
            });
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
                if (handlers.indexOf(cb) === -1) { throw new Error("Not registered"); }
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
                errorHandler("MISSING_CALLBACK", {
                    id: id,
                    args: args,
                });
            }
            try {
                pending[id].apply(null, Array.isArray(args)? args : [args]);
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
        };
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
    };


    // given a path, asynchronously return an arraybuffer
    Util.fetch = function (src, cb, progress) {
        var CB = Util.once(cb);

        var xhr = new XMLHttpRequest();
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
            return void CB(void 0, new Uint8Array(xhr.response));
        };
        xhr.send(null);
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
        var to;
        var g = function () {
            clearTimeout(to);
            to = setTimeout(Util.bake(f, Util.slice(arguments)), ms);
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
            f();
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
