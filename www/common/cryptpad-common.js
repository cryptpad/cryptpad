define([
    'jquery',
    '/api/config',
    '/customize/messages.js',
    '/common/fsStore.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-history.js',

    '/common/clipboard.js',
    '/common/pinpad.js',
    '/customize/application_config.js'
], function ($, Config, Messages, Store, Util, Hash, UI, History, Clipboard, Pinpad, AppConfig) {

/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/

    var common = window.Cryptpad = {
        Messages: Messages,
        Clipboard: Clipboard
    };

    // constants
    var userHashKey = common.userHashKey = 'User_hash';
    var userNameKey = common.userNameKey = 'User_name';
    var fileHashKey = common.fileHashKey = 'FS_hash';
    var displayNameKey = common.displayNameKey = 'cryptpad.username';
    var newPadNameKey = common.newPadNameKey = "newPadName";
    var newPadPathKey = common.newPadPathKey = "newPadPath";
    var storageKey = common.storageKey = 'CryptPad_RECENTPADS';
    var PINNING_ENABLED = AppConfig.enablePinning;

    var store;
    var rpc;

    // import UI elements
    var findCancelButton = common.findCancelButton = UI.findCancelButton;
    var findOKButton = common.findOKButton = UI.findOKButton;
    var listenForKeys = common.listenForKeys = UI.listenForKeys;
    var stopListening = common.stopListening = UI.stopListening;
    common.prompt = UI.prompt;
    common.confirm = UI.confirm;
    common.alert = UI.alert;
    common.log = UI.log;
    common.warn = UI.warn;
    common.spinner = UI.spinner;
    common.addLoadingScreen = UI.addLoadingScreen;
    common.removeLoadingScreen = UI.removeLoadingScreen;
    common.errorLoadingScreen = UI.errorLoadingScreen;

    // import common utilities for export
    var find = common.find = Util.find;
    var fixHTML = common.fixHTML = Util.fixHTML;
    var hexToBase64 = common.hexToBase64 = Util.hexToBase64;
    var base64ToHex = common.base64ToHex = Util.base64ToHex;
    var deduplicateString = common.deduplicateString = Util.deduplicateString;
    var uint8ArrayToHex = common.uint8ArrayToHex = Util.uint8ArrayToHex;
    var replaceHash = common.replaceHash = Util.replaceHash;
    var getHash = common.getHash = Util.getHash;
    var fixFileName = common.fixFileName = Util.fixFileName;
    common.bytesToMegabytes = Util.bytesToMegabytes;
    common.bytesToKilobytes = Util.bytesToKilobytes;

    // import hash utilities for export
    var createRandomHash = common.createRandomHash = Hash.createRandomHash;
    var parsePadUrl = common.parsePadUrl = Hash.parsePadUrl;
    var isNotStrongestStored = common.isNotStrongestStored = Hash.isNotStrongestStored;
    var hrefToHexChannelId = common.hrefToHexChannelId = Hash.hrefToHexChannelId;
    var parseHash = common.parseHash = Hash.parseHash;
    var getRelativeHref = common.getRelativeHref = Hash.getRelativeHref;

    common.getEditHashFromKeys = Hash.getEditHashFromKeys;
    common.getViewHashFromKeys = Hash.getViewHashFromKeys;
    common.getSecrets = Hash.getSecrets;
    common.getHashes = Hash.getHashes;
    common.createChannelId = Hash.createChannelId;
    common.findWeaker = Hash.findWeaker;
    common.findStronger = Hash.findStronger;

    // History
    common.getHistory = function (config) { return History.create(common, config); };

    var getStore = common.getStore = function () {
        if (store) { return store; }
        throw new Error("Store is not ready!");
    };
    var getProxy = common.getProxy = function () {
        if (store && store.getProxy()) {
            return store.getProxy().proxy;
        }
    };
    var getNetwork = common.getNetwork = function () {
        if (store) {
            if (store.getProxy() && store.getProxy().info) {
                return store.getProxy().info.network;
            }
        }
        return;
    };

    var feedback = common.feedback = function (action, force) {
        if (force !== true) {
            if (!action) { return; }
            try {
                if (!getStore().getProxy().proxy.allowUserFeedback) { return; }
            } catch (e) { return void console.error(e); }
        }

        var href = '/common/feedback.html?' + action + '=' + (+new Date());
        console.log('[feedback] %s', href);
        $.ajax({
            type: "HEAD",
            url: href,
        });
    };

    var reportAppUsage = common.reportAppUsage = function () {
        var pattern = window.location.pathname.split('/')
            .filter(function (x) { return x; }).join('.');
        feedback(pattern);
    };

    var getUid = common.getUid = function () {
        if (store && store.getProxy() && store.getProxy().proxy) {
            return store.getProxy().proxy.uid;
        }
    };

    var getRealtime = common.getRealtime = function () {
        if (store && store.getProxy() && store.getProxy().info) {
                return store.getProxy().info.realtime;
        }
        return;
    };

    var whenRealtimeSyncs = common.whenRealtimeSyncs = function (realtime, cb) {
        realtime.sync();
        window.setTimeout(function () {
            if (realtime.getAuthDoc() === realtime.getUserDoc()) {
                return void cb();
            }
            realtime.onSettle(function () {
                cb();
            });
        }, 0);
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

    var hasSigningKeys = common.hasSigningKeys = function (proxy) {
        return typeof(proxy) === 'object' &&
            typeof(proxy.edPrivate) === 'string' &&
            typeof(proxy.edPublic) === 'string';
    };

    common.isArray = $.isArray;

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
    var checkObjectData = function (pad, cb) {
        if (!pad.ctime) { pad.ctime = pad.atime; }
        if (/^https*:\/\//.test(pad.href)) {
            pad.href = common.getRelativeHref(pad.href);
        }
        var parsed = common.parsePadUrl(pad.href);
        if (!parsed || !parsed.hash) { return; }
        if (typeof(cb) === 'function') {
            cb(parsed);
        }
        if (!pad.title) {
            pad.title = common.getDefaultname(parsed);
        }
        return parsed.hash;
    };
    // Migrate from legacy store (localStorage)
    var migrateRecentPads = common.migrateRecentPads = function (pads) {
        return pads.map(function (pad) {
            var hash;
            if (Array.isArray(pad)) { // TODO DEPRECATE_F
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
                hash = checkObjectData(pad);
                if (!hash || !common.parseHash(hash)) { return; }
                return pad;
            } else {
                console.error("[Cryptpad.migrateRecentPads] pad had unexpected value");
                console.log(pad);
                return;
            }
        }).filter(function (x) { return x; });
    };
    // Remove everything from RecentPads that is not an object and check the objects
    var checkRecentPads = common.checkRecentPads = function (pads) {
        pads.forEach(function (pad, i) {
            if (pad && typeof(pad) === 'object') {
                var hash = checkObjectData(pad);
                if (!hash || !common.parseHash(hash)) { return; }
                return pad;
            }
            console.error("[Cryptpad.migrateRecentPads] pad had unexpected value");
            getStore().removeData(i);
        });
    };

    // Get the pads from localStorage to migrate them to the object store
    var getLegacyPads = common.getLegacyPads = function (cb) {
        require(['/customize/store.js'], function(Legacy) { // TODO DEPRECATE_F
            Legacy.ready(function (err, legacy) {
                if (err) { cb(err, null); return; }
                legacy.get(storageKey, function (err2, recentPads) {
                    if (err2) { cb(err2, null); return; }
                    if (Array.isArray(recentPads)) {
                        feedback('MIGRATE_LEGACY_STORE');
                        cb(void 0, migrateRecentPads(recentPads));
                        return;
                    }
                    cb(void 0, []);
                });
            });
        });
    };

    // Create untitled documents when no name is given
    var getDefaultName = common.getDefaultName = function (parsed) {
        var type = parsed.type;
        var untitledIndex = 1;
        var name = (Messages.type)[type] + ' - ' + new Date().toString().split(' ').slice(0,4).join(' ');
        return name;
    };
    var isDefaultName = common.isDefaultName = function (parsed, title) {
        var name = getDefaultName(parsed);
        return title === name;
    };

    var makePad = function (href, title) {
        var now = +new Date();
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
    var addTemplate = common.addTemplate = function (data) {
        getStore().pushData(data);
        getStore().addPad(data.href, ['template']);
    };

    var isTemplate = common.isTemplate = function (href) {
        var rhref = getRelativeHref(href);
        var templates = listTemplates();
        return templates.some(function (t) {
            return t.href === rhref;
        });
    };
    var selectTemplate = common.selectTemplate = function (type, rt, Crypt) {
        if (!AppConfig.enableTemplates) { return; }
        var temps = listTemplates(type);
        if (temps.length === 0) { return; }
        var $content = $('<div>');
        $('<b>').text(Messages.selectTemplate).appendTo($content);
        $('<p>', {id:"selectTemplate"}).appendTo($content);
        common.alert($content.html(), null, true);
        var $p = $('#selectTemplate');
        temps.forEach(function (t, i) {
            $('<a>', {href: t.href, title: t.title}).text(t.title).click(function (e) {
                e.preventDefault();
                var parsed = parsePadUrl(t.href);
                if(!parsed) { throw new Error("Cannot get template hash"); }
                common.addLoadingScreen(null, true);
                Crypt.get(parsed.hash, function (err, val) {
                    if (err) { throw new Error(err); }
                    var p = parsePadUrl(window.location.href);
                    Crypt.put(p.hash, val, function (e) {
                        common.findOKButton().click();
                        common.removeLoadingScreen();
                    });
                });
            }).appendTo($p);
            if (i !== temps.length) { $('<br>').appendTo($p); }
        });
        common.findOKButton().text(Messages.cancelButton);
    };

    // STORAGE
    /* fetch and migrate your pad history from the store */
    var getRecentPads = common.getRecentPads = function (cb) {
        getStore().getDrive(storageKey, function (err, recentPads) {
            if (Array.isArray(recentPads)) {
                checkRecentPads(recentPads);
                cb(void 0, recentPads);
                return;
            }
            cb(void 0, []);
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

    var setPadTitle = common.setPadTitle = function (name, cb) {
        var href = window.location.href;
        var parsed = parsePadUrl(href);
        href = getRelativeHref(href);
        // getRecentPads return the array from the drive, not a copy
        // We don't have to call "set..." at the end, everything is stored with listmap
        getRecentPads(function (err, recent) {
            if (err) {
                cb(err);
                return;
            }

            var updateWeaker = [];
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
                        pad.atime = +new Date();
                        contains = true;
                        return pad;
                    }
                }

                if (shouldUpdate) {
                    contains = true;
                    // update the atime
                    pad.atime = +new Date();

                    // set the name
                    pad.title = name;

                    // If we now have a stronger version of a stored href, replace the weaker one by the strong one
                    if (pad && pad.href && href !== pad.href) {
                        updateWeaker.push({
                            o: pad.href,
                            n: href
                        });
                    }
                    pad.href = href;
                }
                return pad;
            });

            if (!contains) {
                var data = makePad(href, name);
                getStore().pushData(data);
                getStore().addPad(href, common.initialPath, common.initialName || name);
            }
            if (updateWeaker.length > 0) {
                updateWeaker.forEach(function (obj) {
                    getStore().replaceHref(obj.o, obj.n);
                });
            }
            cb(err, recent);
        });
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
    };

    var getUserChannelList = common.getUserChannelList = function () {
        var store = common.getStore();
        var proxy = store.getProxy();
        var fo = proxy.fo;

        // start with your userHash...
        var userHash = localStorage && localStorage.User_hash;
        if (!userHash) { return null; }

        var userChannel = common.parseHash(userHash).channel;
        if (!userChannel) { return null; }

        var list = fo.getFiles([fo.FILES_DATA]).map(hrefToHexChannelId)
            .filter(function (x) { return x; });

        list.push(common.base64ToHex(userChannel));
        list.sort();

        return list;
    };

    var getCanonicalChannelList = common.getCanonicalChannelList = function () {
        return deduplicateString(getUserChannelList()).sort();
    };

    var pinsReady = common.pinsReady = function () {
        if (!isLoggedIn()) {
            return false;
        }
        if (!PINNING_ENABLED) {
            console.error('[PINNING_DISABLED]');
            return false;
        }
        if (!rpc) {
            console.error('[RPC_NOT_READY]');
            return false;
        }
        return true;
    };

    var arePinsSynced = common.arePinsSynced = function (cb) {
        if (!pinsReady()) { return void cb ('[RPC_NOT_READY]'); }

        var list = getCanonicalChannelList();
        var local = Hash.hashChannelList(list);
        rpc.getServerHash(function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash === local);
        });
    };

    var resetPins = common.resetPins = function (cb) {
        if (!pinsReady()) { return void cb ('[RPC_NOT_READY]'); }

        var list = getCanonicalChannelList();
        rpc.reset(list, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    var pinPads = common.pinPads = function (pads, cb) {
        if (!pinsReady()) { return void cb ('[RPC_NOT_READY]'); }

        rpc.pin(pads, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    var unpinPads = common.unpinPads = function (pads, cb) {
        if (!pinsReady()) { return void cb ('[RPC_NOT_READY]'); }

        rpc.unpin(pads, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    var getPinnedUsage = common.getPinnedUsage = function (cb) {
        if (!pinsReady()) { return void cb('[RPC_NOT_READY]'); }
        rpc.getFileListSize(cb);
    };

    var getFileSize = common.getFileSize = function (href, cb) {
        var channelId = Hash.hrefToHexChannelId(href);
        rpc.getFileSize(channelId, function (e, bytes) {
            if (e) { return void cb(e); }
            cb(void 0, bytes);
        });
    };

    var createButton = common.createButton = function (type, rightside, data, callback) {
        var button;
        var size = "17px";
        switch (type) {
            case 'export':
                button = $('<button>', {
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class':'fa fa-download', style: 'font:'+size+' FontAwesome'}));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload', style: 'font:'+size+' FontAwesome'}));
                if (callback) {
                    button.click(UI.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }));
                }
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                button = $('<button>', {
                    title: Messages.saveTemplateButton,
                }).append($('<span>', {'class':'fa fa-bookmark', style: 'font:'+size+' FontAwesome'}));
                if (data.rt && data.Crypt) {
                    button.click(function () {
                        var title = data.getTitle() || document.title;
                        var todo = function (val) {
                            if (typeof(val) !== "string") { return; }
                            var toSave = data.rt.getUserDoc();
                            if (val.trim()) {
                                val = val.trim();
                                title = val;
                                try {
                                    var parsed = JSON.parse(toSave);
                                    var meta;
                                    if (Array.isArray(parsed) && typeof(parsed[3]) === "object") {
                                        meta = parsed[3].metadata; // pad
                                    } else if (parsed.info) {
                                        meta = parsed.info; // poll
                                    } else {
                                        meta = parsed.metadata;
                                    }
                                    if (typeof(meta) === "object") {
                                        meta.title = val;
                                        meta.defaultTitle = val;
                                        delete meta.users;
                                    }
                                    toSave = JSON.stringify(parsed);
                                } catch(e) {
                                    console.error("Parse error while setting the title", e);
                                }
                            }
                            var p = parsePadUrl(window.location.href);
                            if (!p.type) { return; }
                            var hash = createRandomHash();
                            var href = '/' + p.type + '/#' + hash;
                            data.Crypt.put(hash, toSave, function (e) {
                                if (e) { throw new Error(e); }
                                common.addTemplate(makePad(href, title));
                                whenRealtimeSyncs(getStore().getProxy().info.realtime, function () {
                                    common.alert(Messages.templateSaved);
                                });
                            });
                        };
                        common.prompt(Messages.saveTemplatePrompt, title || document.title, todo);
                    });
                }
                break;
            case 'forget':
                button = $('<button>', {
                    id: 'cryptpad-forget',
                    title: Messages.forgetButtonTitle,
                    'class': "fa fa-trash cryptpad-forget",
                    style: 'font:'+size+' FontAwesome'
                });
                getRecentPads(function (err, recent) {
                    if (isNotStrongestStored(window.location.href, recent)) {
                        button.addClass('hidden');
                    }
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
                                var n = getNetwork();
                                var r = getRealtime();
                                if (n && r) {
                                    whenRealtimeSyncs(r, function () {
                                        n.disconnect();
                                        callback();
                                    });
                                } else {
                                    callback();
                                }
                                common.alert(Messages.movedToTrash, undefined, true);
                                return;
                            });
                        });

                    });
                }
                break;
            case 'present':
                button = $('<button>', {
                    title: Messages.presentButtonTitle,
                    'class': "fa fa-play-circle cryptpad-present-button", // class used in slide.js
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'source':
                button = $('<button>', {
                    title: Messages.sourceButtonTitle,
                    'class': "fa fa-stop-circle cryptpad-source-button", // class used in slide.js
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                button = $('<button>', {
                    title: Messages.historyButton,
                    'class': "fa fa-history",
                    style: 'font:'+size+' FontAwesome'
                });
                if (data.histConfig) {
                    button.click(function () {
                        common.getHistory(data.histConfig);
                    });
                }
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
        if (typeof config !== "object" || !Array.isArray(config.options)) { return; }

        var allowedTags = ['a', 'p', 'hr'];
        var isValidOption = function (o) {
            if (typeof o !== "object") { return false; }
            if (!o.tag || allowedTags.indexOf(o.tag) === -1) { return false; }
            return true;
        };

        // Container
        var $container = $(config.container);
        var containerConfig = {
            'class': 'dropdown-bar'
        };
        if (config.buttonTitle) {
            containerConfig.title = config.buttonTitle;
        }

        if (!config.container) {
            $container = $('<span>', containerConfig);
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

        var value = config.initialValue || '';

        var setActive = function ($el) {
            if ($el.length !== 1) { return; }
            $innerblock.find('.active').removeClass('active');
            $el.addClass('active');
            var scroll = $el.position().top + $innerblock.scrollTop();
            if (scroll < $innerblock.scrollTop()) {
                $innerblock.scrollTop(scroll);
            } else if (scroll > ($innerblock.scrollTop() + 280)) {
                $innerblock.scrollTop(scroll-270);
            }
        };

        var hide = function () {
            window.setTimeout(function () { $innerblock.hide(); }, 0);
        };

        var show = function () {
            $innerblock.show();
            $innerblock.find('.active').removeClass('active');
            if (config.isSelect && value) {
                var $val = $innerblock.find('[data-value="'+value+'"]');
                setActive($val);
                $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
            }
        };

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
                hide();
                return;
            }
            show();
        });

        if (config.isSelect) {
            var pressed = '';
            var to;
            $container.keydown(function (e) {
                var $value = $innerblock.find('[data-value].active');
                if (e.which === 38) { // Up
                    if ($value.length) {
                        var $prev = $value.prev();
                        setActive($prev);
                    }
                }
                if (e.which === 40) { // Down
                    if ($value.length) {
                        var $next = $value.next();
                        setActive($next);
                    }
                }
                if (e.which === 13) { //Enter
                    if ($value.length) {
                        $value.click();
                        hide();
                    }
                }
                if (e.which === 27) { // Esc
                    hide();
                }
            });
            $container.keypress(function (e) {
                window.clearTimeout(to);
                var c = String.fromCharCode(e.which);
                pressed += c;
                var $value = $innerblock.find('[data-value^="'+pressed+'"]:first');
                if ($value.length) {
                    setActive($value);
                    $innerblock.scrollTop($value.position().top + $innerblock.scrollTop());
                }
                to = window.setTimeout(function () {
                    pressed = '';
                }, 1000);
            });

            $container.setValue = function (val) {
                value = val;
                var $val = $innerblock.find('[data-value="'+val+'"]');
                var textValue = $val.html() || val;
                $button.find('.buttonTitle').html(textValue);
            };
            $container.getValue = function () {
                return value || '';
            };
        }

        return $container;
    };

    // Provide $container if you want to put the generated block in another element
    // Provide $initBlock if you already have the menu block and you want the content inserted in it
    var createLanguageSelector = common.createLanguageSelector = function ($container, $initBlock) {
        var options = [];
        var languages = Messages._languages;
        var keys = Object.keys(languages).sort();
        keys.forEach(function (l) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'languageValue',
                    'data-value': l,
                    'href': '#',
                },
                content: languages[l] // Pretty name of the language value
            });
        });
        var dropdownConfig = {
            text: Messages.language, // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: $initBlock, // optional
            isSelect: true
        };
        var $block = createDropdown(dropdownConfig);
        $block.attr('id', 'language-selector');

        if ($container) {
            $block.appendTo($container);
        }

        Messages._initSelector($block);

        return $block;
    };

    var createUserAdminMenu = common.createUserAdminMenu = function (config) {
        var $displayedName = $('<span>', {'class': config.displayNameCls || 'displayName'});
        var accountName = localStorage[common.userNameKey];
        var account = isLoggedIn();
        var $userName = $('<span>', {'class': 'userDisplayName'});
        var options = [];
        if (config.displayNameCls) {
            var $userAdminContent = $('<p>');
            if (account) {
                var $userAccount = $('<span>', {'class': 'userAccount'}).append(Messages.user_accountName + ': ' + fixHTML(accountName));
                $userAdminContent.append($userAccount);
                $userAdminContent.append($('<br>'));
            }
            if (config.displayName) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ');
                $userName.append($displayedName.clone());
            }
            $userAdminContent.append($userName);
            options.push({
                tag: 'p',
                attributes: {'class': 'accountData'},
                content: $userAdminContent.html()
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
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls},
                content: Messages.user_rename
            });
        }
        if (parsed && (!parsed.type || parsed.type !== 'settings')) {
            options.push({
                tag: 'a',
                attributes: {'class': 'settings'},
                content: Messages.settingsButton
            });
        }
        // Add login or logout button depending on the current status
        if (account) {
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
            if (window.location.pathname !== "/") {
                sessionStorage.redirectTo = window.location.href;
            }
            window.location.href = '/login/';
        });
        $userAdmin.find('a.register').click(function (e) {
            if (window.location.pathname !== "/") {
                sessionStorage.redirectTo = window.location.href;
            }
            window.location.href = '/register/';
        });

        return $userAdmin;
    };


    common.ready = (function () {
        var env = {};
        var initialized = false;

    return function (f) {
        if (initialized) {
            return void window.setTimeout(function () {
                f(void 0, env);
            });
        }
        var block = 0;

        var cb = function () {
            block--;
            if (!block) {
                initialized = true;
                f(void 0, env);
            }
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

            var proxy = getProxy();
            var network = getNetwork();

            if (typeof(window.Proxy) === 'undefined') {
                feedback("NO_PROXIES");
            }

            if (typeof(Array.isArray) !== 'function') {
                feedback("NO_ISARRAY");
            }

            $(function() {
                // Race condition : if document.body is undefined when alertify.js is loaded, Alertify
                // won't work. We have to reset it now to make sure it uses a correct "body"
                UI.Alertify.reset();

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

                if (PINNING_ENABLED && isLoggedIn()) {
                    console.log("logged in. pads will be pinned");
                    block++;

                    Pinpad.create(network, proxy, function (e, call) {
                        if (e) {
                            console.error(e);
                            return cb();
                        }

                        console.log('RPC handshake complete');
                        rpc = common.rpc = env.rpc = call;

                        common.arePinsSynced(function (err, yes) {
                            if (!yes) {
                                common.resetPins(function (err, hash) {
                                    console.log('RESET DONE');
                                });
                            }
                        });
                        cb();
                    });
                } else if (PINNING_ENABLED) {
                    console.log('not logged in. pads will not be pinned');
                } else {
                    console.log('pinning disabled');
                }

                // Everything's ready, continue...
                if($('#pad-iframe').length) {
                    block++;
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

                block++;
                cb();
            });
        }, common);
    };

    }());

    $(function () {
        Messages._applyTranslation();
    });

    return common;
});
