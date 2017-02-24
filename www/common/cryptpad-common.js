define([
    '/api/config?cb=' + Math.random().toString(16).slice(2),
    '/customize/messages.js?app=' + window.location.pathname.split('/').filter(function (x) { return x; }).join('.'),
    '/customize/fsStore.js',
    '/bower_components/chainpad-crypto/crypto.js?v=0.1.5',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/bower_components/spin.js/spin.min.js',
    '/common/clipboard.js',
    '/customize/fsStore.js',
    '/customize/application_config.js',

    '/bower_components/jquery/dist/jquery.min.js',
], function (Config, Messages, Store, Crypto, Alertify, Spinner, Clipboard, AppConfig) {
/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/
    var $ = window.jQuery;

    var common = window.Cryptpad = {
        Messages: Messages,
        Alertify: Alertify,
    };
    var store;

    var find = common.find = function (map, path) {
        return (map && path.reduce(function (p, n) {
            return typeof(p[n]) !== 'undefined' && p[n];
        }, map));
    };

    var getStore = common.getStore = function () {
        if (store) { return store; }
        throw new Error("Store is not ready!");
    };
    var getNetwork = common.getNetwork = function () {
        if (store) {
            if (store.getProxy() && store.getProxy().info) {
                return store.getProxy().info.network;
            }
        }
        return;
    };

    var whenRealtimeSyncs = common.whenRealtimeSyncs = function (realtime, cb) {
        realtime.sync();
        realtime.onSettle(cb);
    };

    var getWebsocketURL = common.getWebsocketURL = function () {
        if (!Config.websocketPath) { return Config.websocketURL; }
        var path = Config.websocketPath;
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var protocol = window.location.protocol.replace(/http/, 'ws');
        var host = window.location.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    var userHashKey = common.userHashKey = 'User_hash';
    var userNameKey = common.userNameKey = 'User_name';
    var fileHashKey = common.fileHashKey = 'FS_hash';
    var displayNameKey = common.displayNameKey = 'cryptpad.username';

    var login = common.login = function (hash, name, cb) {
        if (!hash) { throw new Error('expected a user hash'); }
        if (!name) { throw new Error('expected a user name'); }
        localStorage.setItem(userHashKey, hash);
        localStorage.setItem(userNameKey, name);
        if (cb) { cb(); }
    };

    var eraseTempSessionValues = common.eraseTempSessionValues = function () {
        // delete sessionStorage values that might have been left over
        // from the main page's /user redirect
        [
            'login',
            'login_user',
            'login_pass',
            'login_rmb',
            'register'
        ].forEach(function (k) {
            delete sessionStorage[k];
        });
    };

    var logoutHandlers = [];
    var logout = common.logout = function (cb) {
        [
            userNameKey,
            userHashKey,
        ].forEach(function (k) {
            sessionStorage.removeItem(k);
            localStorage.removeItem(k);
            delete localStorage[k];
            delete sessionStorage[k];
        });
        // Make sure we have an FS_hash in localStorage before reloading all the tabs
        // so that we don't end up with tabs using different anon hashes
        if (!localStorage[fileHashKey]) {
            localStorage[fileHashKey] = common.createRandomHash();
        }
        eraseTempSessionValues();

        logoutHandlers.forEach(function (h) {
            if (typeof (h) === "function") { h(); }
        });

        if (cb) { cb(); }
    };
    var onLogout = common.onLogout = function (h) {
        if (typeof (h) !== "function") { return; }
        if (logoutHandlers.indexOf(h) !== -1) { return; }
        logoutHandlers.push(h);
    };

    var getUserHash = common.getUserHash = function () {
        var hash;
        [sessionStorage, localStorage].some(function (s) {
            var h = s[userHashKey];
            if (h) { return (hash = h); }
        });

        return hash;
    };

    var isLoggedIn = common.isLoggedIn = function () {
        return typeof getUserHash() === "string";
    };

    // var isArray = function (o) { return Object.prototype.toString.call(o) === '[object Array]'; };
    var isArray = common.isArray = $.isArray;

    var fixHTML = common.fixHTML = function (html) {
        return html.replace(/</g, '&lt;');
    };

    var truncate = common.truncate = function (text, len) {
        if (typeof(text) === 'string' && text.length > len) {
            return text.slice(0, len) + '…';
        }
        return text;
    };

    var hexToBase64 = common.hexToBase64 = function (hex) {
        var hexArray = hex
            .replace(/\r|\n/g, "")
            .replace(/([\da-fA-F]{2}) ?/g, "0x$1 ")
            .replace(/ +$/, "")
            .split(" ");
        var byteString = String.fromCharCode.apply(null, hexArray);
        return window.btoa(byteString).replace(/\//g, '-').slice(0,-2);
    };

    var base64ToHex = common.base64ToHex = function (b64String) {
        var hexArray = [];
        atob(b64String.replace(/-/g, '/')).split("").forEach(function(e){
            var h = e.charCodeAt(0).toString(16);
            if (h.length === 1) { h = "0"+h; }
            hexArray.push(h);
        });
        return hexArray.join("");
    };


    var parseHash = common.parseHash = function (hash) {
        var parsed = {};
        if (hash.slice(0,1) !== '/' && hash.length >= 56) {
            // Old hash
            parsed.channel = hash.slice(0, 32);
            parsed.key = hash.slice(32);
            parsed.version = 0;
            return parsed;
        }
        var hashArr = hash.split('/');
        if (hashArr[1] && hashArr[1] === '1') {
            parsed.version = 1;
            parsed.mode = hashArr[2];
            parsed.channel = hashArr[3];
            parsed.key = hashArr[4];
            parsed.present = hashArr[5] && hashArr[5] === 'present';
            return parsed;
        }
        return;
    };
    var getEditHashFromKeys = common.getEditHashFromKeys = function (chanKey, keys) {
        if (typeof keys === 'string') {
            return chanKey + keys;
        }
        return '/1/edit/' + hexToBase64(chanKey) + '/' + Crypto.b64RemoveSlashes(keys.editKeyStr);
    };
    var getViewHashFromKeys = common.getViewHashFromKeys = function (chanKey, keys) {
        if (typeof keys === 'string') {
            return;
        }
        return '/1/view/' + hexToBase64(chanKey) + '/' + Crypto.b64RemoveSlashes(keys.viewKeyStr);
    };
    var getHashFromKeys = common.getHashFromKeys = getEditHashFromKeys;

    var specialHashes = common.specialHashes = ['iframe'];

    /*
     * Returns all needed keys for a realtime channel
     * - no argument: use the URL hash or create one if it doesn't exist
     * - secretHash provided: use secretHash to find the keys
     */
    var getSecrets = common.getSecrets = function (secretHash) {
        var secret = {};
        var generate = function () {
            secret.keys = Crypto.createEditCryptor();
            secret.key = Crypto.createEditCryptor().editKeyStr;
        };
        if (!secretHash && !/#/.test(window.location.href)) {
            generate();
            return secret;
        } else {
            var hash = secretHash || window.location.hash.slice(1);
            if (hash.length === 0 || specialHashes.indexOf(hash) !== -1) {
                generate();
                return secret;
            }
            // old hash system : #{hexChanKey}{cryptKey}
            // new hash system : #/{hashVersion}/{b64ChanKey}/{cryptKey}
            if (hash.slice(0,1) !== '/' && hash.length >= 56) {
                // Old hash
                secret.channel = hash.slice(0, 32);
                secret.key = hash.slice(32);
            }
            else {
                // New hash
                var hashArray = hash.split('/');
                if (hashArray.length < 4) {
                    common.alert("Unable to parse the key");
                    throw new Error("Unable to parse the key");
                }
                var version = hashArray[1];
                /*if (version === "1") {
                    secret.channel = base64ToHex(hashArray[2]);
                    secret.key = hashArray[3].replace(/-/g, '/');
                    if (secret.channel.length !== 32 || secret.key.length !== 24) {
                        common.alert("The channel key and/or the encryption key is invalid");
                        throw new Error("The channel key and/or the encryption key is invalid");
                    }
                }*/
                if (version === "1") {
                    var mode = hashArray[2];
                    if (mode === 'edit') {
                        secret.channel = base64ToHex(hashArray[3]);
                        var keys = Crypto.createEditCryptor(hashArray[4].replace(/-/g, '/'));
                        secret.keys = keys;
                        secret.key = keys.editKeyStr;
                        if (secret.channel.length !== 32 || secret.key.length !== 24) {
                            common.alert("The channel key and/or the encryption key is invalid");
                            throw new Error("The channel key and/or the encryption key is invalid");
                        }
                    }
                    else if (mode === 'view') {
                        secret.channel = base64ToHex(hashArray[3]);
                        secret.keys = Crypto.createViewCryptor(hashArray[4].replace(/-/g, '/'));
                        if (secret.channel.length !== 32) {
                            common.alert("The channel key is invalid");
                            throw new Error("The channel key is invalid");
                        }
                    }
                }
            }
        }
        return secret;
    };

    var uint8ArrayToHex = common.uint8ArrayToHex = function (a) {
        // call slice so Uint8Arrays work as expected
        return Array.prototype.slice.call(a).map(function (e, i) {
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

    var createChannelId = common.createChannelId = function () {
        var id = uint8ArrayToHex(Crypto.Nacl.randomBytes(16));
        if (id.length !== 32 || /[^a-f0-9]/.test(id)) {
            throw new Error('channel ids must consist of 32 hex characters');
        }
        return id;
    };

    var createRandomHash = common.createRandomHash = function () {
        // 16 byte channel Id
        var channelId = hexToBase64(createChannelId());
        // 18 byte encryption key
        var key = Crypto.b64RemoveSlashes(Crypto.rand64(18));
        return '/1/edit/' + [channelId, key].join('/');
    };

    var replaceHash = common.replaceHash = function (hash) {
        if (window.history && window.history.replaceState) {
            if (!/^#/.test(hash)) { hash = '#' + hash; }
            return void window.history.replaceState({}, window.document.title, hash);
        }
        window.location.hash = hash;
    };

    var storageKey = common.storageKey = 'CryptPad_RECENTPADS';

    /*
     *  localStorage formatting
     */
    /*
        the first time this gets called, your local storage will migrate to a
        new format. No more indices for values, everything is named now.

        * href
        * atime (access time)
        * title
        * ??? // what else can we put in here?
    */
    var migrateRecentPads = common.migrateRecentPads = function (pads) {
        return pads.map(function (pad) {
            var hash;
            if (isArray(pad)) {
                var href = pad[0];
                href.replace(/\#(.*)$/, function (a, h) {
                    hash = h;
                });

                return {
                    href: pad[0],
                    atime: pad[1],
                    title: pad[2] || hash && hash.slice(0,8),
                    ctime: pad[1],
                };
            } else if (pad && typeof(pad) === 'object') {
                if (!pad.ctime) { pad.ctime = pad.atime; }
                if (!pad.title) {
                    pad.href.replace(/#(.*)$/, function (x, hash) {
                        pad.title = hash.slice(0,8);
                    });
                }
                if (/^https*:\/\//.test(pad.href)) {
                    pad.href = common.getRelativeHref(pad.href);
                }
                hash = pad.href.slice(pad.href.indexOf('#')+1);
                if (!hash || !common.parseHash(hash)) { return; }
                return pad;
            } else {
                console.error("[Cryptpad.migrateRecentPads] pad had unexpected value");
                console.log(pad);
                return;
            }
        }).filter(function (x) { return x; });
    };

    // Get the pads from localStorage to migrate them to the object store
    var getLegacyPads = common.getLegacyPads = function (cb) {
        require(['/customize/store.js'], function(Legacy) {
            Legacy.ready(function (err, legacy) {
                if (err) { cb(err, null); return; }
                legacy.get(storageKey, function (err2, recentPads) {
                    if (err2) { cb(err2, null); return; }
                    if (isArray(recentPads)) {
                        cb(void 0, migrateRecentPads(recentPads));
                        return;
                    }
                    cb(void 0, []);
                });
            });
        });
    };

    var getHash = common.getHash = function () {
        return window.location.hash.slice(1);
    };

    var getRelativeHref = common.getRelativeHref = function (href) {
        if (!href) { return; }
        var parsed = common.parsePadUrl(href);
        return '/' + parsed.type + '/#' + parsed.hash;
    };

    var parsePadUrl = common.parsePadUrl = function (href) {
        var patt = /^https*:\/\/([^\/]*)\/(.*?)\//i;

        var ret = {};

        if (!/^https*:\/\//.test(href)) {
            var idx = href.indexOf('/#');
            ret.type = href.slice(1, idx);
            ret.hash = href.slice(idx + 2);
            return ret;
        }

        var hash = href.replace(patt, function (a, domain, type, hash) {
            ret.domain = domain;
            ret.type = type;
            return '';
        });
        ret.hash = hash.replace(/#/g, '');
        return ret;
    };

    var isNameAvailable = function (title, parsed, pads) {
        return !pads.some(function (pad) {
            // another pad is already using that title
            if (pad.title === title) {
                return true;
            }
        });
    };

    // Create untitled documents when no name is given
    var getDefaultName = common.getDefaultName = function (parsed, recentPads) {
        var type = parsed.type;
        var untitledIndex = 1;
        var name = (Messages.type)[type] + ' - ' + new Date().toString().split(' ').slice(0,4).join(' ');
        return name;
        /*
         * Pad titles are shared in the document so it does not make sense anymore to avoid duplicates
          if (isNameAvailable(name, parsed, recentPads)) { return name; }
          while (!isNameAvailable(name + ' - ' + untitledIndex, parsed, recentPads)) { untitledIndex++; }
          return name + ' - ' + untitledIndex;
        */
    };
    var isDefaultName = common.isDefaultName = function (parsed, title) {
        var name = getDefaultName(parsed, []);
        return title === name;
    };

    var makePad = function (href, title) {
        var now = ''+new Date();
        return {
            href: href,
            atime: now,
            ctime: now,
            title: title || window.location.hash.slice(1, 9),
        };
    };

    /* Sort pads according to how recently they were accessed */
    var mostRecent = common.mostRecent = function (a, b) {
        return new Date(b.atime).getTime() - new Date(a.atime).getTime();
    };

    // STORAGE
    var setPadAttribute = common.setPadAttribute = function (attr, value, cb) {
        getStore().setDrive([getHash(), attr].join('.'), value, function (err, data) {
            cb(err, data);
        });
    };
    var setAttribute = common.setAttribute = function (attr, value, cb) {
        getStore().set(["cryptpad", attr].join('.'), value, function (err, data) {
            cb(err, data);
        });
    };
    var setLSAttribute = common.setLSAttribute = function (attr, value) {
        localStorage[attr] = value;
    };

    // STORAGE
    var getPadAttribute = common.getPadAttribute = function (attr, cb) {
        getStore().getDrive([getHash(), attr].join('.'), function (err, data) {
            cb(err, data);
        });
    };
    var getAttribute = common.getAttribute = function (attr, cb) {
        getStore().get(["cryptpad", attr].join('.'), function (err, data) {
            cb(err, data);
        });
    };
    var getLSAttribute = common.getLSAttribute = function (attr) {
        return localStorage[attr];
    };

    // STORAGE - TEMPLATES
    var listTemplates = common.listTemplates = function (type) {
        var allTemplates = getStore().listTemplates();
        if (!type) { return allTemplates; }

        var templates = allTemplates.filter(function (f) {
            var parsed = parsePadUrl(f.href);
            return parsed.type === type;
        });
        return templates;
    };
    var addTemplate = common.addTemplate = function (href) {
        getStore().addTemplate(href);
    };


    // STORAGE
    /* fetch and migrate your pad history from localStorage */
    var getRecentPads = common.getRecentPads = function (cb) {
        getStore().getDrive(storageKey, function (err, recentPads) {
            if (isArray(recentPads)) {
                cb(void 0, migrateRecentPads(recentPads));
                return;
            }
            cb(void 0, []);
        });
    };

    // STORAGE
    /* commit a list of pads to localStorage */
    var setRecentPads = common.setRecentPads = function (pads, cb) {
        getStore().setDrive(storageKey, pads, function (err, data) {
            cb(err, data);
        });
    };

    // STORAGE: Display Name
    var getLastName = common.getLastName = function (cb) {
        common.getAttribute('username', function (err, userName) {
            cb(err, userName);
        });
    };
    var _onDisplayNameChanged = [];
    var onDisplayNameChanged = common.onDisplayNameChanged = function (h) {
        if (typeof(h) !== "function") { return; }
        if (_onDisplayNameChanged.indexOf(h) !== -1) { return; }
        _onDisplayNameChanged.push(h);
    };
    var changeDisplayName = common.changeDisplayName = function (newName) {
        _onDisplayNameChanged.forEach(function (h) {
            h(newName);
        });
    };


    // STORAGE
    var forgetPad = common.forgetPad = function (href, cb) {
        var parsed = parsePadUrl(href);

        var callback = function (err, data) {
            if (err) {
                cb(err);
                return;
            }

            getStore().keys(function (err, keys) {
                if (err) {
                    cb(err);
                    return;
                }
                var toRemove = keys.filter(function (k) {
                    return k.indexOf(parsed.hash) === 0;
                });

                if (!toRemove.length) {
                    cb();
                    return;
                }
                getStore().removeBatch(toRemove, function (err, data) {
                    cb(err, data);
                });
            });
        };

        if (typeof(getStore().forgetPad) === "function") {
            getStore().forgetPad(common.getRelativeHref(href), callback);
        }
    };

    // STORAGE
    var setPadTitle = common.setPadTitle = function (name, cb) {
        var href = window.location.href;
        var parsed = parsePadUrl(href);
        href = getRelativeHref(href);
        getRecentPads(function (err, recent) {
            if (err) {
                cb(err);
                return;
            }

            var contains;
            var renamed = recent.map(function (pad) {
                var p = parsePadUrl(pad.href);

                if (p.type !== parsed.type) { return pad; }

                var shouldUpdate = p.hash === parsed.hash;

                // Version 1 : we have up to 4 differents hash for 1 pad, keep the strongest :
                // Edit > Edit (present) > View > View (present)
                var pHash = parseHash(p.hash);
                var parsedHash = parseHash(parsed.hash);

                if (!pHash) { return; } // We may have a corrupted pad in our storage, abort here in that case

                if (!shouldUpdate && pHash.version === 1 && parsedHash.version === 1 && pHash.channel === parsedHash.channel) {
                    if (pHash.mode === 'view' && parsedHash.mode === 'edit') { shouldUpdate = true; }
                    else if (pHash.mode === parsedHash.mode && pHash.present) { shouldUpdate = true; }
                    else {
                        // Editing a "weaker" version of a stored hash : update the date and do not push the current hash
                        pad.atime = new Date().toISOString();
                        contains = true;
                        return pad;
                    }
                }

                if (shouldUpdate) {
                    contains = true;
                    // update the atime
                    pad.atime = new Date().toISOString();

                    // set the name
                    pad.title = name;
                    pad.href = href;
                }
                return pad;
            });

            if (!contains) {
                var data = makePad(href, name);
                renamed.push(data);
                if (typeof(getStore().addPad) === "function") {
                    getStore().addPad(href, common.initialPath, common.initialName || name);
                }
            }

            setRecentPads(renamed, function (err, data) {
                cb(err, data);
            });
        });
    };

    // STORAGE
    var getPadTitle = common.getPadTitle = function (cb) {
        var href = window.location.href;
        var parsed = parsePadUrl(window.location.href);
        var hashSlice = window.location.hash.slice(1,9);
        var title = '';

        getRecentPads(function (err, pads) {
            if (err) {
                cb(err);
                return;
            }
            pads.some(function (pad) {
                var p = parsePadUrl(pad.href);
                if (p.hash === parsed.hash && p.type === parsed.type) {
                    title = pad.title || hashSlice;
                    return true;
                }
            });

            if (title === '') { title = getDefaultName(parsed, pads); }

            cb(void 0, title);
        });
    };

    // STORAGE
    var causesNamingConflict = common.causesNamingConflict = function (title, cb) {
        var href = window.location.href;

        var parsed = parsePadUrl(href);
        getRecentPads(function (err, pads) {
            if (err) {
                cb(err);
                return;
            }
            var conflicts = pads.some(function (pad) {
                // another pad is already using that title
                if (pad.title === title) {
                    var p = parsePadUrl(pad.href);

                    if (p.type === parsed.type && p.hash === parsed.hash) {
                        // the duplicate pad has the same type and hash
                        // allow renames
                    } else {
                        // it's an entirely different pad... it conflicts
                        return true;
                    }
                }
            });
            cb(void 0, conflicts);
        });
    };

    var newPadNameKey = common.newPadNameKey = "newPadName";
    var newPadPathKey = common.newPadPathKey = "newPadPath";

    // local name?
    common.ready = function (f) {
        var state = 0;

        var env = {};

        var cb = function () {
            f(void 0, env);
        };

        if (sessionStorage[newPadNameKey]) {
            common.initialName = sessionStorage[newPadNameKey];
            delete sessionStorage[newPadNameKey];
        }
        if (sessionStorage[newPadPathKey]) {
            common.initialPath = sessionStorage[newPadPathKey];
            delete sessionStorage[newPadPathKey];
        }

        Store.ready(function (err, storeObj) {
            store = common.store = env.store = storeObj;

            $(function() {
                // Race condition : if document.body is undefined when alertify.js is loaded, Alertify
                // won't work. We have to reset it now to make sure it uses a correct "body"
                Alertify.reset();

                // Load the new pad when the hash has changed
                var oldHash  = document.location.hash.slice(1);
                window.onhashchange = function () {
                    var newHash = document.location.hash.slice(1);
                    var parsedOld = parseHash(oldHash);
                    var parsedNew = parseHash(newHash);
                    if (parsedOld && parsedNew && (
                          parsedOld.channel !== parsedNew.channel
                          || parsedOld.mode !== parsedNew.mode
                          || parsedOld.key !== parsedNew.key)) {
                        document.location.reload();
                        return;
                    }
                    if (parsedNew) {
                        oldHash = newHash;
                    }
                };

                // Everything's ready, continue...
                if($('#pad-iframe').length) {
                    var $iframe = $('#pad-iframe');
                    var iframe = $iframe[0];
                    var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc.readyState === 'complete') {
                        cb();
                        return;
                    }
                    $iframe.load(cb);
                    return;
                }
                cb();
            });
        }, common);
    };

    var errorHandlers = [];
    common.onError = function (h) {
        if (typeof h !== "function") { return; }
        errorHandlers.push(h);
    };
    common.storeError = function () {
        errorHandlers.forEach(function (h) {
            if (typeof h === "function") {
                h({type: "store"});
            }
        });
    };

    var LOADING = 'loading';
    common.addLoadingScreen = function (loadingText) {
        if ($('#' + LOADING).length) {
            $('#' + LOADING).show();
            return;
        }
        var $loading = $('<div>', {id: LOADING});
        var $container = $('<div>', {'class': 'loadingContainer'});
        $container.append('<img class="cryptofist" src="/customize/cryptofist_small.png" />');
        var $spinner = $('<div>', {'class': 'spinnerContainer'});
        var loadingSpinner = common.spinner($spinner).show();
        var $text = $('<p>').text(loadingText || Messages.loading);
        $container.append($spinner).append($text);
        $loading.append($container);
        $('body').append($loading);
    };
    common.removeLoadingScreen = function (cb) {
        $('#' + LOADING).fadeOut(750, cb);
    };
    common.errorLoadingScreen = function (error, transparent) {
        $('.spinnerContainer').hide();
        if (transparent) { $('#' + LOADING).css('opacity', 0.8); }
        $('#' + LOADING).find('p').html(error || Messages.error);
    };

    /*
     *  Saving files
     */
    var fixFileName = common.fixFileName = function (filename) {
        return filename.replace(/ /g, '-').replace(/[\/\?]/g, '_')
            .replace(/_+/g, '_');
    };

    var importContent = common.importContent = function (type, f) {
        return function () {
            var $files = $('<input type="file">').click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    /*
     * Buttons
     */
    var renamePad = common.renamePad = function (title, callback) {
        if (title === null) { return; }

        if (title.trim() === "") {
            var parsed = parsePadUrl(window.location.href);
            title = getDefaultName(parsed);
        }

        common.setPadTitle(title, function (err, data) {
            if (err) {
                console.log("unable to set pad title");
                console.log(err);
                return;
            }
            callback(null, title);
        });
        /* Pad titles are shared in the document. We don't check for duplicates anymore.
         common.causesNamingConflict(title, function (err, conflicts) {
            if (err) {
                console.log("Unable to determine if name caused a conflict");
                console.error(err);
                callback(err, title);
                return;
            }

            if (conflicts) {
                common.alert(Messages.renameConflict);
                return;
            }

            common.setPadTitle(title, function (err, data) {
                if (err) {
                    console.log("unable to set pad title");
                    console.log(err);
                    return;
                }
                callback(null, title);
            });
        });
        */
    };
    var createButton = common.createButton = function (type, rightside, data, callback) {
        var button;
        var size = "17px";
        switch (type) {
            case 'export':
                button = $('<button>', {
                    title: Messages.exportButton + '\n' + Messages.exportButtonTitle,
                }).append($('<span>', {'class':'fa fa-download', style: 'font:'+size+' FontAwesome'}));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    title: Messages.importButton + '\n' + Messages.importButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload', style: 'font:'+size+' FontAwesome'}));
                if (callback) {
                    button.click(common.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }));
                }
                break;
            case 'forget':
                button = $('<button>', {
                    id: 'cryptpad-forget',
                    title: Messages.forgetButton + '\n' + Messages.forgetButtonTitle,
                    'class': "fa fa-trash cryptpad-forget",
                    style: 'font:'+size+' FontAwesome'
                });
                if (callback) {
                    button.click(function() {
                        var href = window.location.href;
                        common.confirm(Messages.forgetPrompt, function (yes) {
                            if (!yes) { return; }
                            common.forgetPad(href, function (err, data) {
                                if (err) {
                                    console.log("unable to forget pad");
                                    console.error(err);
                                    callback(err, null);
                                    return;
                                }
                                var parsed = common.parsePadUrl(href);
                                callback(null, common.getDefaultName(parsed, []));
                            });
                        });

                    });
                }
                break;
            case 'editshare':
                button = $('<a>', {
                    title: Messages.editShareTitle,
                }).html('<span class="fa fa-users" style="font-family:FontAwesome;"></span>').append(' ' + Messages.editShare);
                if (data && data.editHash) {
                    var editHash = data.editHash;
                    button.click(function () {
                        var baseUrl = window.location.origin + window.location.pathname + '#';
                        var url = baseUrl + editHash;
                        var success = Clipboard.copy(url);
                        if (success) {
                            common.log(Messages.shareSuccess);
                            common.findOKButton().click();
                            return;
                        }
                    });
                }
                break;
            case 'viewshare':
                button = $('<a>', {
                    title: Messages.viewShareTitle,
                }).html('<span class="fa fa-eye" style="font-family:FontAwesome;"></span>').append(' ' + Messages.viewShare);
                if (data && data.viewHash) {
                    button.click(function () {
                        var baseUrl = window.location.origin + window.location.pathname + '#';
                        var url = baseUrl + data.viewHash;
                        var success = Clipboard.copy(url);
                        if (success) {
                            common.log(Messages.shareSuccess);
                            common.findOKButton().click();
                            return;
                        }
                    });
                }
                break;
            case 'viewopen':
                button = $('<a>', {
                    title: Messages.viewOpenTitle,
                }).html('<span class="fa fa-eye" style="font-family:FontAwesome;"></span>').append(' ' + Messages.viewOpen);
                if (data && data.viewHash) {
                    button.click(function () {
                        var baseUrl = window.location.origin + window.location.pathname + '#';
                        var url = baseUrl + data.viewHash;
                        common.findOKButton().click();
                        window.open(url);
                    });
                }
                break;
            case 'present':
                button = $('<button>', {
                    title: Messages.presentButton + '\n' + Messages.presentButtonTitle,
                    'class': "fa fa-play-circle cryptpad-present-button", // class used in slide.js
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'source':
                button = $('<button>', {
                    title: Messages.sourceButton + '\n' + Messages.sourceButtonTitle,
                    'class': "fa fa-stop-circle cryptpad-source-button", // class used in slide.js
                    style: 'font:'+size+' FontAwesome'
                });
                break;
             default:
                button = $('<button>', {
                    'class': "fa fa-question",
                    style: 'font:'+size+' FontAwesome'
                });
        }
        if (rightside) {
            button.addClass('rightside-button');
        }
        return button;
    };

    // Create a button with a dropdown menu
    // input is a config object with parameters:
    //  - container (optional): the dropdown container (span)
    //  - text (optional): the button text value
    //  - options: array of {tag: "", attributes: {}, content: "string"}
    //
    // allowed options tags: ['a', 'hr', 'p']
    var createDropdown = common.createDropdown = function (config) {
        if (typeof config !== "object" || !isArray(config.options)) { return; }

        var allowedTags = ['a', 'p', 'hr'];
        var isValidOption = function (o) {
            if (typeof o !== "object") { return false; }
            if (!o.tag || allowedTags.indexOf(o.tag) === -1) { return false; }
            return true;
        };

        // Container
        var $container = $(config.container);
        if (!config.container) {
            $container = $('<span>', {
                'class': 'dropdown-bar'
            });
        }

        // Button
        var $button = $('<button>', {
            'class': ''
        }).append($('<span>', {'class': 'buttonTitle'}).html(config.text || ""));
        $('<span>', {
            'class': 'fa fa-caret-down',
        }).appendTo($button);

        // Menu
        var $innerblock = $('<div>', {'class': 'cryptpad-dropdown dropdown-bar-content'});
        if (config.left) { $innerblock.addClass('left'); }

        config.options.forEach(function (o) {
            if (!isValidOption(o)) { return; }
            $('<' + o.tag + '>', o.attributes || {}).html(o.content || '').appendTo($innerblock);
        });

        $container.append($button).append($innerblock);

        $button.click(function (e) {
            e.stopPropagation();
            var state = $innerblock.is(':visible');
            $('.dropdown-bar-content').hide();
            try {
                $('iframe').each(function (idx, ifrw) {
                    $(ifrw).contents().find('.dropdown-bar-content').hide();
                });
            } catch (er) {
                // empty try catch in case this iframe is problematic (cross-origin)
            }
            if (state) {
                $innerblock.hide();
                return;
            }
            $innerblock.show();
        });

        return $container;
    };

    // Provide $container if you want to put the generated block in another element
    // Provide $initBlock if you already have the menu block and you want the content inserted in it
    var createLanguageSelector = common.createLanguageSelector = function ($container, $initBlock) {
        var options = [];
        var languages = Messages._languages;
        for (var l in languages) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'languageValue',
                    'data-value': l,
                    'href': '#',
                },
                content: languages[l] // Pretty name of the language value
            });
        }
        var dropdownConfig = {
            text: Messages.language, // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: $initBlock // optional
        };
        var $block = createDropdown(dropdownConfig);
        $block.attr('id', 'language-selector');

        if ($container) {
            $block.appendTo($container);
        }

        Messages._initSelector($block);
    };

    var createUserAdminMenu = common.createUserAdminMenu = function (config) {
        var $displayedName = $('<span>', {'class': config.displayNameCls || 'displayName'});
        var accountName = localStorage[common.userNameKey];
        var account = isLoggedIn();
        var $userAdminContent = $('<p>');
        if (account) {
            var $userAccount = $('<span>', {'class': 'userAccount'}).append(Messages.user_accountName + ': ' + accountName);
            $userAdminContent.append($userAccount);
            $userAdminContent.append($('<br>'));
        }
        var $userName = $('<span>', {'class': 'userDisplayName'});
        if (config.displayName) {
            // Hide "Display name:" in read only mode
            $userName.append(Messages.user_displayName + ': ');
            $userName.append($displayedName.clone());
        }
        //$userName.append($displayedName.clone()); TODO remove ?
        $userAdminContent.append($userName);
        var options = [];
        if (config.displayNameCls) {
            options.push({
                tag: 'p',
                attributes: {'class': 'accountData'},
                content: $userAdminContent.html()
            });
        }
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName) { //readOnly !== 1) { TODO
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls},
                content: Messages.user_rename
            });
        }
        var parsed = parsePadUrl(window.location.href);
        if (parsed && (!parsed.type || parsed.type && parsed.type !== 'drive')) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': '/drive/'
                },
                content: Messages.login_accessDrive
            });
        }
        // Add login or logout button depending on the current status
        if (account) {
            if (parsed && parsed.type && parsed.type !== 'settings') {
                options.push({
                    tag: 'a',
                    attributes: {'class': 'settings'},
                    content: Messages.settingsButton
                });
            }
            options.push({
                tag: 'a',
                attributes: {'class': 'logout'},
                content: Messages.logoutButton
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'login'},
                content: Messages.login_login
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'register'},
                content: Messages.login_register
            });
        }
        var $icon = $('<span>', {'class': 'fa fa-user'});
        var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon).append($userbig);
        if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock // optional
        };
        var $userAdmin = createDropdown(dropdownConfigUser);

        $userAdmin.find('a.logout').click(function (e) {
            common.logout();
            window.location.href = '/';
        });
        $userAdmin.find('a.settings').click(function (e) {
            if (parsed && parsed.type) {
                window.open('/settings/');
            } else {
                window.location.href = '/settings/';
            }
        });
        $userAdmin.find('a.login').click(function (e) {
            sessionStorage.redirectTo = window.location.href;
            window.location.href = '/login/';
        });
        $userAdmin.find('a.register').click(function (e) {
            sessionStorage.redirectTo = window.location.href;
            window.location.href = '/register/';
        });

        return $userAdmin;
    };

    /*
     *  Alertifyjs
     */

    // TODO: remove styleAlerts in all the apps
    var styleAlerts = common.styleAlerts = function () {};

    var findCancelButton = common.findCancelButton = function () {
        return $('button.cancel');
    };

    var findOKButton = common.findOKButton = function () {
        return $('button.ok');
    };

    var listenForKeys = function (yes, no) {
        var handler = function (e) {
            switch (e.which) {
                case 27: // cancel
                    if (typeof(no) === 'function') { no(e); }
                    no();
                    break;
                case 13: // enter
                    if (typeof(yes) === 'function') { yes(e); }
                    break;
            }
        };

        $(window).keyup(handler);
        return handler;
    };

    var stopListening = function (handler) {
        $(window).off('keyup', handler);
    };

    common.alert = function (msg, cb) {
        cb = cb || function () {};
        var keyHandler = listenForKeys(function (e) { // yes
            findOKButton().click();
        });
        Alertify.alert(msg, function (ev) {
            cb(ev);
            stopListening(keyHandler);
        });
        window.setTimeout(function () {
            findOKButton().focus();
        });
    };

    common.prompt = function (msg, def, cb, opt) {
        opt = opt || {};
        cb = cb || function () {};

        var keyHandler = listenForKeys(function (e) { // yes
            findOKButton().click();
        }, function (e) { // no
            findCancelButton().click();
        });

        Alertify
            .defaultValue(def || '')
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .prompt(msg, function (val, ev) {
                cb(val, ev);
                stopListening(keyHandler);
            }, function (ev) {
                cb(null, ev);
                stopListening(keyHandler);
            });
    };

    common.confirm = function (msg, cb, opt) {
        opt = opt || {};
        cb = cb || function () {};
        var keyHandler = listenForKeys(function (e) {
            findOKButton().click();
        }, function (e) {
            findCancelButton().click();
        });

        Alertify
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .confirm(msg, function () {
                cb(true);
                stopListening(keyHandler);
            }, function () {
                cb(false);
                stopListening(keyHandler);
            });
    };

    common.log = function (msg) {
        Alertify.success(msg);
    };

    common.warn = function (msg) {
        Alertify.error(msg);
    };

    /*
     *  spinner
     */
    common.spinner = function (parent) {
        var $target = $('<div>', {
            //
        }).hide();

        $(parent).append($target);

        var opts = {
            lines: 20, // The number of lines to draw
            length: 5, // The length of each line
            width: 2, // The line thickness
            radius: 15, // The radius of the inner circle
            scale: 2, // Scales overall size of the spinner
            corners: 1, // Corner roundness (0..1)
            color: '#ddd', // #rgb or #rrggbb or array of colors
            opacity: 0.3, // Opacity of the lines
            rotate: 31, // The rotation offset
            direction: 1, // 1: clockwise, -1: counterclockwise
            speed: 1, // Rounds per second
            trail: 49, // Afterglow percentage
            fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
            zIndex: 2e9, // The z-index (defaults to 2000000000)
            className: 'spinner', // The CSS class to assign to the spinner
            top: '50%', // Top position relative to parent
            left: '50%', // Left position relative to parent
            shadow: false, // Whether to render a shadow
            hwaccel: false, // Whether to use hardware acceleration
            position: 'relative', // Element positioning
            height: '100px'
        };
        var spinner = new Spinner(opts).spin($target[0]);

        return {
            show: function () {
                $target.show();
                return this;
            },
            hide: function () {
                $target.hide();
                return this;
            },
            get: function () {
                return spinner;
            },
        };
    };

    $(function () {
        Messages._applyTranslation();
    });

    Alertify._$$alertify.delay = AppConfig.notificationTimeout || 5000;

    return common;
});
