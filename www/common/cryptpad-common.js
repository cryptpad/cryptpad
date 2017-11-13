define([
    'jquery',
    '/api/config',
    '/customize/messages.js',
    '/common/fsStore.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-messaging.js',
    '/file/file-crypto.js',
    '/common/common-realtime.js',
    '/common/common-language.js',

    '/common/clipboard.js',
    '/common/pinpad.js',
    '/customize/application_config.js',
    '/common/media-tag.js',
    '/bower_components/nthen/index.js',
    '/bower_components/localforage/dist/localforage.min.js',
], function ($, Config, Messages, Store, Util, Hash,
            Messaging, FileCrypto, Realtime, Language, Clipboard,
            Pinpad, AppConfig, MediaTag, Nthen, localForage) {

    // Configure MediaTags to use our local viewer
    if (MediaTag && MediaTag.PdfPlugin) {
        MediaTag.PdfPlugin.viewer = '/common/pdfjs/web/viewer.html';
    }

/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/

    var origin = encodeURIComponent(window.location.hostname);
    var common = window.Cryptpad = {
        Messages: Messages,
        Clipboard: Clipboard,
        donateURL: 'https://accounts.cryptpad.fr/#/donate?on=' + origin,
        upgradeURL: 'https://accounts.cryptpad.fr/#/?on=' + origin,
        account: {},
        MediaTag: MediaTag,
    };

    // constants
    var userHashKey = common.userHashKey = 'User_hash';
    var userNameKey = common.userNameKey = 'User_name';
    var fileHashKey = common.fileHashKey = 'FS_hash';
    common.displayNameKey = 'cryptpad.username';
    var newPadNameKey = common.newPadNameKey = "newPadName";
    var newPadPathKey = common.newPadPathKey = "newPadPath";
    common.oldStorageKey = 'CryptPad_RECENTPADS';
    common.storageKey = 'filesData';
    var PINNING_ENABLED = AppConfig.enablePinning;

    var store;
    var rpc;
    var anon_rpc;

    // import common utilities for export
    common.find = Util.find;
    common.hexToBase64 = Util.hexToBase64;
    common.base64ToHex = Util.base64ToHex;
    var deduplicateString = common.deduplicateString = Util.deduplicateString;
    common.uint8ArrayToHex = Util.uint8ArrayToHex;
    common.replaceHash = Util.replaceHash;
    common.getHash = Util.getHash;
    common.fixFileName = Util.fixFileName;
    common.bytesToMegabytes = Util.bytesToMegabytes;
    common.bytesToKilobytes = Util.bytesToKilobytes;
    common.fetch = Util.fetch;
    common.throttle = Util.throttle;
    common.createRandomInteger = Util.createRandomInteger;
    common.getAppType = Util.getAppType;
    common.notAgainForAnother = Util.notAgainForAnother;
    common.uid = Util.uid;
    common.slice = Util.slice;

    // import hash utilities for export
    var createRandomHash = common.createRandomHash = Hash.createRandomHash;
    common.parseTypeHash = Hash.parseTypeHash;
    var parsePadUrl = common.parsePadUrl = Hash.parsePadUrl;
    common.isNotStrongestStored = Hash.isNotStrongestStored;
    var hrefToHexChannelId = common.hrefToHexChannelId = Hash.hrefToHexChannelId;
    var getRelativeHref = common.getRelativeHref = Hash.getRelativeHref;
    common.getBlobPathFromHex = Hash.getBlobPathFromHex;

    common.getEditHashFromKeys = Hash.getEditHashFromKeys;
    common.getViewHashFromKeys = Hash.getViewHashFromKeys;
    common.getFileHashFromKeys = Hash.getFileHashFromKeys;
    common.getUserHrefFromKeys = Hash.getUserHrefFromKeys;
    common.getSecrets = Hash.getSecrets;
    common.getHashes = Hash.getHashes;
    common.createChannelId = Hash.createChannelId;
    common.findWeaker = Hash.findWeaker;
    common.findStronger = Hash.findStronger;
    common.serializeHash = Hash.serializeHash;
    common.createInviteUrl = Hash.createInviteUrl;

    // Messaging
    common.addDirectMessageHandler = Messaging.addDirectMessageHandler;
    common.inviteFromUserlist = Messaging.inviteFromUserlist;
    common.getFriendList = Messaging.getFriendList;
    common.getFriendChannelsList = Messaging.getFriendChannelsList;
    common.createData = Messaging.createData;
    common.getPendingInvites = Messaging.getPending;
    common.getLatestMessages = Messaging.getLatestMessages;

    // Realtime
    var whenRealtimeSyncs = common.whenRealtimeSyncs = function (realtime, cb) {
        Realtime.whenRealtimeSyncs(common, realtime, cb);
    };

    common.beginDetectingInfiniteSpinner = function (realtime) {
        Realtime.beginDetectingInfiniteSpinner(common, realtime);
    };

    var getStore = common.getStore = function () {
        if (store) { return store; }
        throw new Error("Store is not ready!");
    };
    var getProxy = common.getProxy = function () {
        if (store && store.getProxy()) {
            return store.getProxy().proxy;
        }
    };
    common.getFO = function () {
        if (store && store.getProxy()) {
            return store.getProxy().fo;
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
    common.getLanguage = function () {
        return Messages._languageUsed;
    };
    common.setLanguage = function (l, cb) {
        Language.setLanguage(l, null, cb);
    };
    common.getProfileUrl = function () {
        if (store && store.getProfile()) {
            return store.getProfile().view;
        }
    };
    common.getAvatarUrl = function () {
        if (store && store.getProfile()) {
            return store.getProfile().avatar;
        }
    };
    common.getDisplayName = function (cb) {
        var name;
        if (getProxy()) {
            name = getProxy()[common.displayNameKey];
        }
        name = name || '';
        if (typeof cb === "function") { cb(null, name); }
        return name;
    };
    common.getAccountName = function () {
        return localStorage[common.userNameKey];
    };

    var randomToken = function () {
        return Math.random().toString(16).replace(/0./, '');
    };

    common.isFeedbackAllowed = function () {
        try {
            var entry = common.find(getProxy(), [
                'settings',
                'general',
                'allowUserFeedback'
            ]);
            if (!entry) { return false; }
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };
    var feedback = common.feedback = function (action, force) {
        if (!action) { return; }
        if (force !== true) {
            try {
                if (!common.isFeedbackAllowed()) { return; }
            } catch (e) { return void console.error(e); }
        }

        var href = '/common/feedback.html?' + action + '=' + randomToken();
        $.ajax({
            type: "HEAD",
            url: href,
        });
    };

    common.reportAppUsage = function () {
        var pattern = window.location.pathname.split('/')
            .filter(function (x) { return x; }).join('.');
        if (/^#\/1\/view\//.test(window.location.hash)) {
            feedback(pattern + '_VIEW');
        } else {
            feedback(pattern);
        }
    };

    common.reportScreenDimensions = function () {
        var h = window.innerHeight;
        var w = window.innerWidth;
        feedback('DIMENSIONS:' + h + 'x' + w);
    };
    common.reportLanguage = function () {
        feedback('LANG_' + Messages._languageUsed);
    };

    common.getUid = function () {
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

    common.getWebsocketURL = function () {
        if (!Config.websocketPath) { return Config.websocketURL; }
        var path = Config.websocketPath;
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var protocol = window.location.protocol.replace(/http/, 'ws');
        var host = window.location.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    common.login = function (hash, name, cb) {
        if (!hash) { throw new Error('expected a user hash'); }
        if (!name) { throw new Error('expected a user name'); }
        hash = common.serializeHash(hash);
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
    common.logout = function (cb) {
        [
            userNameKey,
            userHashKey,
            'loginToken',
            'plan',
        ].forEach(function (k) {
            sessionStorage.removeItem(k);
            localStorage.removeItem(k);
            delete localStorage[k];
            delete sessionStorage[k];
        });
        localForage.clear();
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
    common.onLogout = function (h) {
        if (typeof (h) !== "function") { return; }
        if (logoutHandlers.indexOf(h) !== -1) { return; }
        logoutHandlers.push(h);
    };

    var getUserHash = common.getUserHash = function () {
        var hash = localStorage[userHashKey];

        if (['undefined', 'undefined/'].indexOf(hash) !== -1) {
            localStorage.removeItem(userHashKey);
            return;
        }

        if (hash) {
            var sHash = common.serializeHash(hash);
            if (sHash !== hash) { localStorage[userHashKey] = sHash; }
        }

        return hash;
    };

    var isLoggedIn = common.isLoggedIn = function () {
        return typeof getUserHash() === "string";
    };

    common.hasSigningKeys = function (proxy) {
        return typeof(proxy) === 'object' &&
            typeof(proxy.edPrivate) === 'string' &&
            typeof(proxy.edPublic) === 'string';
    };

    common.hasCurveKeys = function (proxy) {
        return typeof(proxy) === 'object' &&
            typeof(proxy.curvePrivate) === 'string' &&
            typeof(proxy.curvePublic) === 'string';
    };

    common.getPublicKeys = function (proxy) {
        proxy = proxy || common.getProxy();
        if (!proxy || !proxy.edPublic || !proxy.curvePublic) { return; }
        return {
            curve: proxy.curvePublic,
            ed: proxy.edPublic,
        };
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
            pad.title = common.getDefaultName(parsed);
        }
        return parsed.hashData;
    };
    // Migrate from legacy store (localStorage)
    common.migrateRecentPads = function (pads) {
        return pads.map(function (pad) {
            var parsedHash;
            if (Array.isArray(pad)) { // TODO DEPRECATE_F
                return {
                    href: pad[0],
                    atime: pad[1],
                    title: pad[2] || '',
                    ctime: pad[1],
                };
            } else if (pad && typeof(pad) === 'object') {
                parsedHash = checkObjectData(pad);
                if (!parsedHash || !parsedHash.type) { return; }
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
        Object.keys(pads).forEach(function (id, i) {
            var pad = pads[id];
            if (pad && typeof(pad) === 'object') {
                var parsedHash = checkObjectData(pad);
                if (!parsedHash || !parsedHash.type) {
                    console.error("[Cryptpad.checkRecentPads] pad had unexpected value", pad);
                    getStore().removeData(i);
                    return;
                }
                return pad;
            }
            console.error("[Cryptpad.checkRecentPads] pad had unexpected value", pad);
            getStore().removeData(i);
        });
    };

    // Create untitled documents when no name is given
    var getLocaleDate = common.getLocaleDate = function () {
        if (window.Intl && window.Intl.DateTimeFormat) {
            var options = {weekday: "short", year: "numeric", month: "long", day: "numeric"};
            return new window.Intl.DateTimeFormat(undefined, options).format(new Date());
        }
        return new Date().toString().split(' ').slice(0,4).join(' ');
    };
    var getDefaultName = common.getDefaultName = function (parsed) {
        var type = parsed.type;
        var name = (Messages.type)[type] + ' - ' + getLocaleDate();
        return name;
    };
    common.isDefaultName = function (parsed, title) {
        var name = getDefaultName(parsed);
        return title === name;
    };

    var makePad = common.makePad = function (href, title) {
        var now = +new Date();
        return {
            href: href,
            atime: now,
            ctime: now,
            title: title || getDefaultName(parsePadUrl(href)),
        };
    };

    /* Sort pads according to how recently they were accessed */
    common.mostRecent = function (a, b) {
        return new Date(b.atime).getTime() - new Date(a.atime).getTime();
    };

    // STORAGE
    common.setPadAttribute = function (attr, value, cb, href) {
        href = getRelativeHref(href || window.location.href);
        getStore().setPadAttribute(href, attr, value, cb);
    };
    common.setDisplayName = function (value, cb) {
        if (getProxy()) {
            getProxy()[common.displayNameKey] = value;
        }
        if (typeof cb === "function") { whenRealtimeSyncs(getRealtime(), cb); }
    };
    common.setAttribute = function (attr, value, cb) {
        getStore().setAttribute(attr, value, function (err, data) {
            if (cb) { cb(err, data); }
        });
    };
    common.setLSAttribute = function (attr, value) {
        localStorage[attr] = value;
    };

    // STORAGE
    common.getPadAttribute = function (attr, cb) {
        var href = getRelativeHref(window.location.href);
        getStore().getPadAttribute(href, attr, cb);
    };
    common.getAttribute = function (attr, cb) {
        getStore().getAttribute(attr, function (err, data) {
            cb(err, data);
        });
    };

    common.setThumbnail = function (key, value, cb) {
        localForage.setItem(key, value, cb);
    };
    common.getThumbnail = function (key, cb) {
        localForage.getItem(key, cb);
    };
    common.clearThumbnail = function (cb) {
        localForage.clear(cb);
    };

    /*  this returns a reference to your proxy. changing it will change your drive.
    */
    var getFileEntry = common.getFileEntry = function (href, cb) {
        if (typeof(cb) !== 'function') { return; }
        var store = getStore();
        if (!store) { return void cb('NO_STORE'); }
        href = href || (window.location.pathname + window.location.hash);
        var id = store.getIdFromHref(href);
        if (!id) { return void cb('NO_ID'); }
        var entry = common.find(getProxy(), [
            'drive',
            'filesData',
            id
        ]);
        cb(void 0, entry);
    };

    common.resetTags = function (href, tags, cb) {
        cb = cb || $.noop;
        if (!Array.isArray(tags)) { return void cb('INVALID_TAGS'); }
        getFileEntry(href, function (e, entry) {
            if (e) { return void cb(e); }
            if (!entry) { cb('NO_ENTRY'); }
            entry.tags = tags.slice();
            cb();
        });
    };

    common.tagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        getFileEntry(href, function (e, entry) {
            if (e) { return void cb(e); }
            if (!entry) { cb('NO_ENTRY'); }
            if (!entry.tags) {
                entry.tags = [tag];
            } else if (entry.tags.indexOf(tag) === -1) {
                entry.tags.push(tag);
            }
            cb();
        });
    };

    common.untagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        getFileEntry(href, function (e, entry) {
            if (e) { return void cb(e); }
            if (!entry) { cb('NO_ENTRY'); }
            if (!entry.tags) { return void cb(); }
            var idx = entry.tags.indexOf(tag);
            if (idx === -1) { return void cb(); }
            entry.tags.splice(idx, 1);
            cb();
        });
    };

    common.getPadTags = function (href, cb) {
        if (typeof(cb) !== 'function') { return; }
        getFileEntry(href, function (e, entry) {
            if (entry) {
                return void cb(void 0, entry.tags?
                    JSON.parse(JSON.stringify(entry.tags)): []);
            }
            return cb('NO_ENTRY');
        });
    };

    common.listAllTags = function (cb) {
        var all = [];
        var proxy = getProxy();
        var files = common.find(proxy, ['drive', 'filesData']);

        if (typeof(files) !== 'object') { return cb('invalid_drive'); }
        Object.keys(files).forEach(function (k) {
            var file = files[k];
            if (!Array.isArray(file.tags)) { return; }
            file.tags.forEach(function (tag) {
                if (all.indexOf(tag) === -1) {
                    all.push(tag);
                }
            });
        });
        cb(void 0, all);
    };

    common.getLSAttribute = function (attr) {
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
    common.addTemplate = function (data) {
        getStore().pushData(data, function (e, id) {
            if (e) { return void console.error("Error while adding a template:", e); } // TODO LIMIT
            getStore().addPad(id, ['template']);
        });
    };

    common.isTemplate = function (href) {
        var rhref = getRelativeHref(href);
        var templates = listTemplates();
        return templates.some(function (t) {
            return t.href === rhref;
        });
    };

    // Secure iframes
    common.useTemplate = function (href, Crypt, cb) {
        var parsed = parsePadUrl(href);
        if(!parsed) { throw new Error("Cannot get template hash"); }
        Crypt.get(parsed.hash, function (err, val) {
            if (err) { throw new Error(err); }
            var p = parsePadUrl(window.location.href);
            Crypt.put(p.hash, val, cb);
        });
    };

    // STORAGE
    /* fetch and migrate your pad history from the store */
    var getRecentPads = common.getRecentPads = function (cb) {
        getStore().getDrive('filesData', function (err, recentPads) {
            if (typeof(recentPads) === "object") {
                checkRecentPads(recentPads);
                cb(void 0, recentPads);
                return;
            }
            cb(void 0, {});
        });
    };

    // STORAGE: Display Name
    common.getLastName = common.getDisplayName;
   /* function (cb) {
        common.getDisplayName(function (err, userName) {
            cb(err, userName);
        });
    };*/
    var _onDisplayNameChanged = [];
    common.onDisplayNameChanged = function (h) {
        if (typeof(h) !== "function") { return; }
        if (_onDisplayNameChanged.indexOf(h) !== -1) { return; }
        _onDisplayNameChanged.push(h);
    };
    common.changeDisplayName = function (newName, isLocal) {
        _onDisplayNameChanged.forEach(function (h) {
            h(newName, isLocal);
        });
    };

    // STORAGE
    common.forgetPad = function (href, cb) {
        if (typeof(getStore().forgetPad) === "function") {
            getStore().forgetPad(common.getRelativeHref(href), cb);
            return;
        }
        cb ("store.forgetPad is not a function");
    };

    common.setPadTitle = function (name, padHref, cb) {
        var href = typeof padHref === "string" ? padHref : window.location.href;
        var parsed = parsePadUrl(href);
        if (!parsed.hash) { return; }
        href = parsed.getUrl({present: parsed.present});
        //href = getRelativeHref(href);
        // getRecentPads return the array from the drive, not a copy
        // We don't have to call "set..." at the end, everything is stored with listmap
        getRecentPads(function (err, recent) {
            if (err) {
                cb(err);
                return;
            }

            var updateWeaker = [];
            var contains;
            Object.keys(recent).forEach(function (id) {
                var pad = recent[id];
                var p = parsePadUrl(pad.href);

                if (p.type !== parsed.type) { return pad; }

                var shouldUpdate = p.hash.replace(/\/$/, '') === parsed.hash.replace(/\/$/, '');

                // Version 1 : we have up to 4 differents hash for 1 pad, keep the strongest :
                // Edit > Edit (present) > View > View (present)
                var pHash = p.hashData;
                var parsedHash = parsed.hashData;

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

            if (updateWeaker.length > 0) {
                updateWeaker.forEach(function (obj) {
                    // If we have a stronger url, and if all the occurences of the weaker were
                    // in the trash, add remove them from the trash and add the stronger in root
                    getStore().restoreHref(obj.n);
                });
            }
            if (!contains && href) {
                var data = makePad(href, name);
                getStore().pushData(data, function (e, id) {
                    if (e) {
                        return void cb(e);
                    }
                    getStore().addPad(id, common.initialPath);
                    cb(err, recent);
                });
                return;
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
    common.renamePad = function (title, href, callback) {
        if (title === null) { return; }

        if (title.trim() === "") {
            var parsed = parsePadUrl(href || window.location.href);
            title = getDefaultName(parsed);
        }

        common.setPadTitle(title, href, function (err) {
            if (err) {
                console.log("unable to set pad title");
                console.error(err);
                return;
            }
            callback(null, title);
        });
    };

    common.getUserFilesList = function () {
        var store = common.getStore();
        var proxy = store.getProxy();
        var fo = proxy.fo;
        var hashes = [];
        var list = fo.getFiles([fo.ROOT]).filter(function (id) {
            var href = fo.getFileData(id).href;
            var parsed = parsePadUrl(href);
            if ((parsed.type === 'file' || parsed.type === 'media')
                 && hashes.indexOf(parsed.hash) === -1) {
                hashes.push(parsed.hash);
                return true;
            }
        });
        return list;
    };
    // Needed for the secure filepicker app
    common.getSecureFilesList = function (query, cb) {
        var store = common.getStore();
        if (!store) { return void cb("Store is not ready"); }
        var proxy = store.getProxy();
        var fo = proxy.fo;
        var list = {};
        var hashes = [];
        var types = query.types;
        var where = query.where;
        var filter = query.filter || {};
        var isFiltered = function (type, data) {
            var filtered;
            var fType = filter.fileType || [];
            if (type === 'file' && fType.length) {
                if (!data.fileType) { return true; }
                filtered = !fType.some(function (t) {
                    return data.fileType.indexOf(t) === 0;
                });
            }
            return filtered;
        };
        fo.getFiles(where).forEach(function (id) {
            var data = fo.getFileData(id);
            var parsed = parsePadUrl(data.href);
            if ((!types || types.length === 0 || types.indexOf(parsed.type) !== -1)
                 && hashes.indexOf(parsed.hash) === -1) {
                if (isFiltered(parsed.type, data)) { return; }
                hashes.push(parsed.hash);
                list[id] = data;
            }
        });
        cb (null, list);
    };

    var getUserChannelList = common.getUserChannelList = function () {
        var store = common.getStore();
        var proxy = store.getProxy();
        var fo = proxy.fo;

        // start with your userHash...
        var userHash = localStorage && localStorage.User_hash;
        if (!userHash) { return null; }

        var userParsedHash = common.parseTypeHash('drive', userHash);
        var userChannel = userParsedHash && userParsedHash.channel;
        if (!userChannel) { return null; }

        var list = fo.getFiles([fo.FILES_DATA]).map(function (id) {
                return hrefToHexChannelId(fo.getFileData(id).href);
            })
            .filter(function (x) { return x; });

        // Get the avatar
        var profile = store.getProfile();
        if (profile) {
            var profileChan = profile.edit ? hrefToHexChannelId('/profile/#' + profile.edit) : null;
            if (profileChan) { list.push(profileChan); }
            var avatarChan = profile.avatar ? hrefToHexChannelId(profile.avatar) : null;
            if (avatarChan) { list.push(avatarChan); }
        }

        if (getProxy().friends) {
            var fList = common.getFriendChannelsList(common);
            list = list.concat(fList);
        }

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
            console.error('RPC_NOT_READY');
            return false;
        }
        return true;
    };

    common.arePinsSynced = function (cb) {
        if (!pinsReady()) { return void cb ('RPC_NOT_READY'); }

        var list = getCanonicalChannelList();
        var local = Hash.hashChannelList(list);
        rpc.getServerHash(function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash === local);
        });
    };

    common.resetPins = function (cb) {
        if (!pinsReady()) { return void cb ('RPC_NOT_READY'); }

        var list = getCanonicalChannelList();
        rpc.reset(list, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    common.pinPads = function (pads, cb) {
        if (!pinsReady()) { return void cb ('RPC_NOT_READY'); }
        if (typeof(cb) !== 'function') {
            console.error('expected a callback');
        }

        rpc.pin(pads, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    common.unpinPads = function (pads, cb) {
        if (!pinsReady()) { return void cb ('RPC_NOT_READY'); }

        rpc.unpin(pads, function (e, hash) {
            if (e) { return void cb(e); }
            cb(void 0, hash);
        });
    };

    common.getPinnedUsage = function (cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }

        rpc.getFileListSize(function (err, bytes) {
            if (typeof(bytes) === 'number') {
                common.account.usage = bytes;
            }
            cb(err, bytes);
        });
    };

    // SFRAME: talk to anon_rpc from the iframe
    common.anonRpcMsg = function (msg, data, cb) {
        if (!msg) { return; }
        if (!anon_rpc) { return void cb('ANON_RPC_NOT_READY'); }
        anon_rpc.send(msg, data, cb);
    };

    common.getFileSize = function (href, cb) {
        if (!anon_rpc) { return void cb('ANON_RPC_NOT_READY'); }
        //if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        var channelId = Hash.hrefToHexChannelId(href);
        anon_rpc.send("GET_FILE_SIZE", channelId, function (e, response) {
            if (e) { return void cb(e); }
            if (response && response.length && typeof(response[0]) === 'number') {
                return void cb(void 0, response[0]);
            } else {
                cb('INVALID_RESPONSE');
            }
        });
    };

    common.getMultipleFileSize = function (files, cb) {
        if (!anon_rpc) { return void cb('ANON_RPC_NOT_READY'); }
        if (!Array.isArray(files)) {
            return void setTimeout(function () { cb('INVALID_FILE_LIST'); });
        }

        anon_rpc.send('GET_MULTIPLE_FILE_SIZE', files, function (e, res) {
            if (e) { return cb(e); }
            if (res && res.length && typeof(res[0]) === 'object') {
                cb(void 0, res[0]);
            } else {
                cb('UNEXPECTED_RESPONSE');
            }
        });
    };

    common.updatePinLimit = function (cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        rpc.updatePinLimits(function (e, limit, plan, note) {
            if (e) { return cb(e); }
            common.account.limit = limit;
            common.account.plan = plan;
            common.account.note = note;
            cb(e, limit, plan, note);
        });
    };

    common.getPinLimit = function (cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }

        var account = common.account;

        var ALWAYS_REVALIDATE = true;
        if (ALWAYS_REVALIDATE || typeof(account.limit) !== 'number' ||
            typeof(account.plan) !== 'string' ||
            typeof(account.note) !== 'string') {
            return void rpc.getLimit(function (e, limit, plan, note) {
                if (e) { return cb(e); }
                common.account.limit = limit;
                common.account.plan = plan;
                common.account.note = note;
                cb(void 0, limit, plan, note);
            });
        }

        cb(void 0, account.limit, account.plan, account.note);
    };

    common.isOverPinLimit = function (cb) {
        if (!common.isLoggedIn()) { return void cb(null, false); }
        var usage;
        var andThen = function (e, limit, plan) {
            if (e) { return void cb(e); }
            var data = {usage: usage, limit: limit, plan: plan};
            if (usage > limit) {
                return void cb (null, true, data);
            }
            return void cb (null, false, data);
        };
        var todo = function (e, used) {
            if (e) { return void cb(e); }
            usage = used;
            common.getPinLimit(andThen);
        };
        common.getPinnedUsage(todo);
    };

    common.clearOwnedChannel = function (channel, cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        rpc.clearOwnedChannel(channel, cb);
    };

    common.uploadComplete = function (cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        rpc.uploadComplete(cb);
    };

    common.uploadStatus = function (size, cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        rpc.uploadStatus(size, cb);
    };

    common.uploadCancel = function (cb) {
        if (!pinsReady()) { return void cb('RPC_NOT_READY'); }
        rpc.uploadCancel(cb);
    };

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    common.createUsageBar = function (cb) {
        if (!isLoggedIn()) { return cb("NOT_LOGGED_IN"); }
        // getPinnedUsage updates common.account.usage, and other values
        // so we can just use those and only check for errors
        var $container = $('<span>', {'class':'limit-container'});
        var todo;
        var updateUsage = window.updateUsage = common.notAgainForAnother(function () {
            common.getPinnedUsage(todo);
        }, LIMIT_REFRESH_RATE);

        todo = function (err) {
            if (err) { return void console.error(err); }

            $container.html('');
            var unit = Util.magnitudeOfBytes(common.account.limit);

            var usage = unit === 'GB'? Util.bytesToGigabytes(common.account.usage):
                Util.bytesToMegabytes(common.account.usage);
            var limit = unit === 'GB'? Util.bytesToGigabytes(common.account.limit):
                Util.bytesToMegabytes(common.account.limit);

            var $limit = $('<span>', {'class': 'cryptpad-limit-bar'}).appendTo($container);
            var quota = usage/limit;
            var $usage = $('<span>', {'class': 'usage'}).css('width', quota*100+'%');

            var makeDonateButton = function () {
                $('<a>', {
                    'class': 'upgrade btn btn-success',
                    href: common.donateURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.supportCryptpad).appendTo($container);
            };

            var makeUpgradeButton = function () {
                $('<a>', {
                    'class': 'upgrade btn btn-success',
                    href: common.upgradeURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.upgradeAccount).appendTo($container);
            };

            if (!Config.removeDonateButton) {
                if (!common.isLoggedIn() || !Config.allowSubscriptions) {
                    // user is not logged in, or subscriptions are disallowed
                    makeDonateButton();
                } else if (!common.account.plan) {
                    // user is logged in and subscriptions are allowed
                    // and they don't have one. show upgrades
                    makeUpgradeButton();
                } else {
                    // they have a plan. show nothing
                }
            }

            var prettyUsage;
            var prettyLimit;

            if (unit === 'GB') {
                prettyUsage = Messages._getKey('formattedGB', [usage]);
                prettyLimit = Messages._getKey('formattedGB', [limit]);
            } else {
                prettyUsage = Messages._getKey('formattedMB', [usage]);
                prettyLimit = Messages._getKey('formattedMB', [limit]);
            }

            if (quota < 0.8) { $usage.addClass('normal'); }
            else if (quota < 1) { $usage.addClass('warning'); }
            else { $usage.addClass('above'); }
            var $text = $('<span>', {'class': 'usageText'});
            $text.text(usage + ' / ' + prettyLimit);
            $limit.append($usage).append($text);
        };

        setInterval(function () {
            updateUsage();
        }, LIMIT_REFRESH_RATE * 3);

        updateUsage();
        getProxy().on('change', ['drive'], function () {
            updateUsage();
        });
        cb(null, $container);
    };

    // Forget button
    // TODO REFACTOR only used in sframe-common-outer
    common.moveToTrash = function (cb, href) {
        href = href || window.location.href;
        common.forgetPad(href, function (err) {
            if (err) {
                console.log("unable to forget pad");
                console.error(err);
                cb(err, null);
                return;
            }
            var n = getNetwork();
            var r = getRealtime();
            if (n && r) {
                whenRealtimeSyncs(r, function () {
                    n.disconnect();
                    cb();
                });
            } else {
                cb();
            }
        });
    };
    // TODO REFACTOR only used in sframe-common-outer
    common.saveAsTemplate = function (Cryptput, data, cb) {
        var p = parsePadUrl(window.location.href);
        if (!p.type) { return; }
        var hash = createRandomHash();
        var href = '/' + p.type + '/#' + hash;
        Cryptput(hash, data.toSave, function (e) {
            if (e) { throw new Error(e); }
            common.addTemplate(makePad(href, data.title));
            whenRealtimeSyncs(getStore().getProxy().info.realtime, function () {
                cb();
            });
        });
    };


    common.getMediatagScript = function () {
        var origin = window.location.origin;
        return '<script src="' + origin + '/common/media-tag-nacl.min.js"></script>';
    };
    common.getMediatagFromHref = function (href) {
        var parsed = common.parsePadUrl(href);
        var secret = common.getSecrets('file', parsed.hash);
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = common.base64ToHex(secret.channel);
            var origin = Config.fileHost || window.location.origin;
            var src = origin + common.getBlobPathFromHex(hexFileName);
            return '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + cryptKey + '">' +
                   '</media-tag>';
        }
        return;
    };
    $(window.document).on('decryption', function (e) {
        var decrypted = e.originalEvent;
        if (decrypted.callback) {
            var cb = decrypted.callback;
            cb(function (mediaObject) {
                var root = mediaObject.element;
                if (!root) { return; }

                if (mediaObject.type === 'image') {
                    $(root).data('blob', decrypted.blob);
                }

                if (mediaObject.type !== 'download') { return; }

                var metadata = decrypted.metadata;

                var title = '';
                var size = 0;
                if (metadata && metadata.name) {
                    title = metadata.name;
                }

                if (decrypted.blob) {
                    size = decrypted.blob.size;
                }

                var sizeMb = common.bytesToMegabytes(size);

                var $btn = $(root).find('button');
                $btn.addClass('btn btn-success')
                    .attr('type', 'download')
                    .html(function () {
                        var text = Messages.download_mt_button + '<br>';
                        if (title) {
                            text += '<b>' + Util.fixHTML(title) + '</b><br>';
                        }
                        if (size) {
                            text += '<em>' + Messages._getKey('formattedMB', [sizeMb]) + '</em>';
                        }
                        return text;
                    });
            });
        }
    });
    common.avatarAllowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
    ];

    common.getShareHashes = function (secret, cb) {
        if (!window.location.hash) {
            var hashes = common.getHashes(secret.channel, secret);
            return void cb(null, hashes);
        }
        common.getRecentPads(function (err, recent) {
            var parsed = parsePadUrl(window.location.href);
            if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
            if (parsed.type === 'file') { secret.channel = Util.base64ToHex(secret.channel); }
            var hashes = common.getHashes(secret.channel, secret);

            if (!hashes.editHash && !hashes.viewHash && parsed.hashData && !parsed.hashData.mode) {
                // It means we're using an old hash
                hashes.editHash = window.location.hash.slice(1);
            }

            // If we have a stronger version in drive, add it and add a redirect button
            var stronger = recent && common.findStronger(null, recent);
            if (stronger) {
                var parsed2 = parsePadUrl(stronger);
                hashes.editHash = parsed2.hash;
            }

            cb(null, hashes);
        });
    };

    var CRYPTPAD_VERSION = 'cryptpad-version';
    var updateLocalVersion = function () {
        // Check for CryptPad updates
        var urlArgs = Config.requireConf ? Config.requireConf.urlArgs : null;
        if (!urlArgs) { return; }
        var arr = /ver=([0-9.]+)(-[0-9]*)?/.exec(urlArgs);
        var ver = arr[1];
        if (!ver) { return; }
        var verArr = ver.split('.');
        verArr[2] = 0;
        if (verArr.length !== 3) { return; }
        var stored = localStorage[CRYPTPAD_VERSION] || '0.0.0';
        var storedArr = stored.split('.');
        storedArr[2] = 0;
        var shouldUpdate = parseInt(verArr[0]) > parseInt(storedArr[0]) ||
                           (parseInt(verArr[0]) === parseInt(storedArr[0]) &&
                            parseInt(verArr[1]) > parseInt(storedArr[1]));
        if (!shouldUpdate) { return; }
        localStorage[CRYPTPAD_VERSION] = ver;
    };

    common.ready = (function () {
        var env = {};
        var initialized = false;

    return function (f) {
        if (initialized) {
            return void setTimeout(function () { f(void 0, env); });
        }

        if (sessionStorage[newPadNameKey]) {
            common.initialName = sessionStorage[newPadNameKey];
            delete sessionStorage[newPadNameKey];
        }
        if (sessionStorage[newPadPathKey]) {
            common.initialPath = sessionStorage[newPadPathKey];
            delete sessionStorage[newPadPathKey];
        }

        var proxy;
        var network;
        var provideFeedback = function () {
            if (Object.keys(proxy).length === 1) {
                feedback("FIRST_APP_USE", true);
            }

            if (typeof(window.Proxy) === 'undefined') {
                feedback("NO_PROXIES");
            }

            var shimPattern = /CRYPTPAD_SHIM/;
            if (shimPattern.test(Array.isArray.toString())) {
                feedback("NO_ISARRAY");
            }

            if (shimPattern.test(Array.prototype.fill.toString())) {
                feedback("NO_ARRAYFILL");
            }

            if (typeof(Symbol) === 'undefined') {
                feedback('NO_SYMBOL');
            }
            common.reportScreenDimensions();
            common.reportLanguage();
        };

        Nthen(function (waitFor) {
            Store.ready(waitFor(function (err, storeObj) {
                store = common.store = env.store = storeObj;
                common.addDirectMessageHandler(common);
                proxy = getProxy();
                network = getNetwork();
                network.on('disconnect', function () {
                    Realtime.setConnectionState(false);
                });
                network.on('reconnect', function () {
                    Realtime.setConnectionState(true);
                });
                provideFeedback();
            }), common);
        }).nThen(function (waitFor) {
            $(waitFor());
        }).nThen(function (waitFor) {
            // Load the new pad when the hash has changed
            var oldHref  = document.location.href;
            window.onhashchange = function () {
                var newHref = document.location.href;
                var parsedOld = parsePadUrl(oldHref).hashData;
                var parsedNew = parsePadUrl(newHref).hashData;
                if (parsedOld && parsedNew && (
                      parsedOld.type !== parsedNew.type
                      || parsedOld.channel !== parsedNew.channel
                      || parsedOld.mode !== parsedNew.mode
                      || parsedOld.key !== parsedNew.key)) {
                    if (!parsedOld.channel) { oldHref = newHref; return; }
                    document.location.reload();
                    return;
                }
                if (parsedNew) { oldHref = newHref; }
            };

            if (PINNING_ENABLED && isLoggedIn()) {
                console.log("logged in. pads will be pinned");
                var w0 = waitFor();
                Pinpad.create(network, proxy, function (e, call) {
                    if (e) {
                        console.error(e);
                        return w0();
                    }

                    console.log('RPC handshake complete');
                    rpc = common.rpc = env.rpc = call;

                    common.getPinLimit(function (e, limit, plan, note) {
                        if (e) { return void console.error(e); }
                        common.account.limit = limit;
                        localStorage.plan = common.account.plan = plan;
                        common.account.note = note;
                        w0();
                    });

                    common.arePinsSynced(function (err, yes) {
                        if (!yes) {
                            common.resetPins(function (err) {
                                if (err) {
                                    console.error("Pin Reset Error");
                                    return console.error(err);
                                }
                                console.log('RESET DONE');
                            });
                        }
                    });
                });
            } else if (PINNING_ENABLED) {
                console.log('not logged in. pads will not be pinned');
            } else {
                console.log('pinning disabled');
            }

            var w1 = waitFor();
            require([
                '/common/rpc.js',
            ], function (Rpc) {
                Rpc.createAnonymous(network, function (e, call) {
                    if (e) {
                        console.error(e);
                        return void w1();
                    }
                    anon_rpc = common.anon_rpc = env.anon_rpc = call;
                    w1();
                });
            });

            // Everything's ready, continue...
            if($('#pad-iframe').length) {
                var w2 = waitFor();
                var $iframe = $('#pad-iframe');
                var iframe = $iframe[0];
                var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc.readyState === 'complete') {
                    return void w2();
                }
                $iframe.load(w2); //cb);
            }
        }).nThen(function (waitFor) {
            if (sessionStorage.createReadme) {
                var w = waitFor();
                require(['/common/cryptget.js'], function (Crypt) {
                    var hash = common.createRandomHash();
                    Crypt.put(hash, Messages.driveReadme, function (e) {
                        if (e) {
                            console.error("Error while creating the default pad:", e);
                            return void w();
                        }
                        var href = '/pad/#' + hash;
                        var data = {
                            href: href,
                            title: Messages.driveReadmeTitle,
                            atime: new Date().toISOString(),
                            ctime: new Date().toISOString()
                        };
                        common.getFO().pushData(data, function (e, id) {
                            if (e) {
                                console.error("Error while creating the default pad:", e);
                                return void w();
                            }
                            common.getFO().add(id);
                            w();
                        });
                    });
                    delete sessionStorage.createReadme;
                });
            }
        }).nThen(function (waitFor) {
            if (sessionStorage.migrateAnonDrive) {
                var w = waitFor();
                require(['/common/mergeDrive.js'], function (Merge) {
                    var hash = localStorage.FS_hash;
                    Merge.anonDriveIntoUser(getStore().getProxy(), hash, function () {
                        delete sessionStorage.migrateAnonDrive;
                        w();
                    });
                });
            }
        }).nThen(function () {
            updateLocalVersion();
            f(void 0, env);
            if (typeof(window.onhashchange) === 'function') { window.onhashchange(); }
        });
    };

    }());

    // MAGIC that happens implicitly
    $(function () {
        Language.applyTranslation();
    });

    return common;
});
