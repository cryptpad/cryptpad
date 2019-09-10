(function (window) {
    var Util = {};

    Util.tryParse = function (s) {
        try { return JSON.parse(s); } catch (e) { return;}
    };

    Util.mkAsync = function (f) {
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
        atob(b64String.replace(/-/g, '/')).split("").forEach(function(e){
            var h = e.charCodeAt(0).toString(16);
            if (h.length === 1) { h = "0"+h; }
            hexArray.push(h);
        });
        return hexArray.join("");
    };

    Util.uint8ArrayToHex = function (a) {
        // call slice so Uint8Arrays work as expected
        return Array.prototype.slice.call(a).map(function (e) {
            var n = Number(e & 0xff).toString(16);
            if (n === 'NaN') {
                throw new Error('invalid input resulted in NaN');
            }

            switch (n.length) {
                case 0: return '00'; // just being careful, shouldn't happen
                case 1: return '0' + n;
                case 2: return n;
                default: throw new Error('unexpected value');
            }
        }).join('');
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
            window.clearTimeout(to);
            to = window.setTimeout(f, ms);
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

    Util.slice = function (A) {
        return Array.prototype.slice.call(A);
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
