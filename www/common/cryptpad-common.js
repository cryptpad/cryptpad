define([
    'jquery',
    '/api/config',
    '/customize/messages.js',
    '/common/fsStore.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-history.js',
    '/common/common-userlist.js',
    '/common/common-title.js',
    '/common/common-metadata.js',
    '/common/common-messaging.js',
    '/common/common-codemirror.js',
    '/common/common-file.js',
    '/file/file-crypto.js',
    '/common/common-realtime.js',

    '/common/clipboard.js',
    '/common/pinpad.js',
    '/customize/application_config.js',
    '/common/media-tag.js',
], function ($, Config, Messages, Store, Util, Hash, UI, History, UserList, Title, Metadata,
            Messaging, CodeMirror, Files, FileCrypto, Realtime, Clipboard,
            Pinpad, AppConfig, MediaTag) {

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

    // import UI elements
    common.findCancelButton = UI.findCancelButton;
    common.findOKButton = UI.findOKButton;
    common.listenForKeys = UI.listenForKeys;
    common.stopListening = UI.stopListening;
    common.prompt = UI.prompt;
    common.confirm = UI.confirm;
    common.alert = UI.alert;
    common.log = UI.log;
    common.warn = UI.warn;
    common.spinner = UI.spinner;
    common.addLoadingScreen = UI.addLoadingScreen;
    common.removeLoadingScreen = UI.removeLoadingScreen;
    common.errorLoadingScreen = UI.errorLoadingScreen;
    common.notify = UI.notify;
    common.unnotify = UI.unnotify;
    common.getIcon = UI.getIcon;
    common.addTooltips = UI.addTooltips;
    common.clearTooltips = UI.clearTooltips;
    common.importContent = UI.importContent;
    common.tokenField = UI.tokenField;
    common.dialog = UI.dialog;

    // import common utilities for export
    common.find = Util.find;
    var fixHTML = common.fixHTML = Util.fixHTML;
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

    // import hash utilities for export
    var createRandomHash = common.createRandomHash = Hash.createRandomHash;
    common.parseTypeHash = Hash.parseTypeHash;
    var parsePadUrl = common.parsePadUrl = Hash.parsePadUrl;
    var isNotStrongestStored = common.isNotStrongestStored = Hash.isNotStrongestStored;
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

    // Userlist
    common.createUserList = UserList.create;

    // Title
    common.createTitle = Title.create;

    // Metadata
    common.createMetadata = Metadata.create;

    // CodeMirror
    common.createCodemirror = CodeMirror.create;

    // Files
    common.createFileManager = function (config) { return Files.create(common, config); };

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
    common.getUserlist = function () {
        if (store) {
            if (store.getProxy() && store.getProxy().info) {
                return store.getProxy().info.userList;
            }
        }
        return;
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
            if (!getStore().getProxy().proxy.allowUserFeedback) { return false; }
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
    common.setPadAttribute = function (attr, value, cb) {
        var href = getRelativeHref(window.location.href);
        getStore().setPadAttribute(href, attr, value, cb);
    };
    common.setDisplayName = function (value, cb) {
        if (getProxy()) {
            getProxy()[common.displayNameKey] = value;
        }
        if (typeof cb === "function") { cb(); }
    };
    common.setAttribute = function (attr, value, cb) {
        getStore().setAttribute(attr, value, function (err, data) {
            if (cb) { cb(err, data); }
        });
    };
    /*common.setAttribute = function (attr, value, cb) {
        getStore().set(["cryptpad", attr].join('.'), value, function (err, data) {
            if (cb) { cb(err, data); }
        });
    };*/
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
    /*common.getAttribute = function (attr, cb) {
        getStore().get(["cryptpad", attr].join('.'), function (err, data) {
            cb(err, data);
        });
    };*/

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
    common.selectTemplate = function (type, rt, Crypt) {
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
                common.addLoadingScreen({hideTips: true});
                Crypt.get(parsed.hash, function (err, val) {
                    if (err) { throw new Error(err); }
                    var p = parsePadUrl(window.location.href);
                    Crypt.put(p.hash, val, function () {
                        common.findOKButton().click();
                        common.removeLoadingScreen();
                        common.feedback('TEMPLATE_USED');
                    });
                });
            }).appendTo($p);
            if (i !== temps.length) { $('<br>').appendTo($p); }
        });
        common.findOKButton().text(Messages.cancelButton);
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
        common.clearTooltips();
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
                        if (e === 'E_OVER_LIMIT') {
                            common.alert(Messages.pinLimitNotPinned, null, true);
                        }
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
    common.getSecureFilesList = function (filter, cb) {
        var store = common.getStore();
        if (!store) { return void cb("Store is not ready"); }
        var proxy = store.getProxy();
        var fo = proxy.fo;
        var list = {};
        var hashes = [];
        var types = filter.types;
        var where = filter.where;
        fo.getFiles(where).forEach(function (id) {
            var data = fo.getFileData(id);
            var parsed = parsePadUrl(data.href);
            if ((!types || types.length === 0 || types.indexOf(parsed.type) !== -1)
                 && hashes.indexOf(parsed.hash) === -1) {
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


    common.uploadFileSecure = Files.upload;

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    common.createUsageBar = function (cb) {
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

    var prepareFeedback = common.prepareFeedback = function (key) {
        if (typeof(key) !== 'string') { return $.noop; }

        var type = common.getAppType();
        return function () {
            feedback((key + (type? '_' + type: '')).toUpperCase());
        };
    };

    // Forget button
    var moveToTrash = common.moveToTrash = function (cb) {
        var href = window.location.href;
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
    var saveAsTemplate = common.saveAsTemplate = function (Cryptput, data, cb) {
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
    common.createButton = function (type, rightside, data, callback) {
        var button;
        var size = "17px";
        switch (type) {
            case 'export':
                button = $('<button>', {
                    'class': 'fa fa-download',
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class': 'drawer'}).text(Messages.exportButton));

                button.click(prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    'class': 'fa fa-upload',
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class': 'drawer'}).text(Messages.importButton));
                if (callback) {
                    button
                    .click(prepareFeedback(type))
                    .click(UI.importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
                }
                break;
            case 'upload':
                console.log('UPLOAD');
                button = $('<button>', {
                    'class': 'btn btn-primary new',
                    title: Messages.uploadButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload'})).append(' '+Messages.uploadButton);
                if (!data.FM) { return; }
                var $input = $('<input>', {
                    'type': 'file',
                    'style': 'display: none;'
                }).on('change', function (e) {
                    var file = e.target.files[0];
                    var ev = {
                        target: data.target
                    };
                    if (data.filter && !data.filter(file)) {
                        common.log('TODO: invalid avatar (type or size)');
                        return;
                    }
                    data.FM.handleFile(file, ev);
                    if (callback) { callback(); }
                });
                if (data.accept) { $input.attr('accept', data.accept); }
                button.click(function () { $input.click(); });
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                button = $('<button>', {
                    title: Messages.saveTemplateButton,
                }).append($('<span>', {'class':'fa fa-bookmark', style: 'font:'+size+' FontAwesome'}));
                if (data.rt && data.Crypt) {
                    button
                    .click(function () {
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
                            saveAsTemplate(data.Crypt.put, {
                                title: title,
                                toSave: toSave
                            }, function () {
                                common.alert(Messages.templateSaved);
                                common.feedback('TEMPLATE_CREATED');
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
                    button
                    .click(prepareFeedback(type))
                    .click(function() {
                        var msg = isLoggedIn() ? Messages.forgetPrompt : Messages.fm_removePermanentlyDialog;
                        common.confirm(msg, function (yes) {
                            if (!yes) { return; }
                            moveToTrash(function (err) {
                                if (err) { return void callback(err); }
                                var cMsg = isLoggedIn() ? Messages.movedToTrash : Messages.deleted;
                                common.alert(cMsg, undefined, true);
                                callback();
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
                    'class': "fa fa-history history",
                }).append($('<span>', {'class': 'drawer'}).text(Messages.historyText));
                if (data.histConfig) {
                    button
                    .click(prepareFeedback(type))
                    .on('click', function () {
                        common.getHistory(data.histConfig);
                    });
                }
                break;
            case 'more':
                button = $('<button>', {
                    title: Messages.moreActions || 'TODO',
                    'class': "drawer-button fa fa-ellipsis-h",
                    style: 'font:'+size+' FontAwesome'
                });
                break;
            case 'savetodrive':
                button = $('<button>', {
                    'class': 'fa fa-cloud-upload',
                    title: Messages.canvas_saveToDrive,
                })
                .click(prepareFeedback(type));
                break;
            case 'hashtag':
                button = $('<button>', {
                    'class': 'fa fa-hashtag',
                })
                .click(prepareFeedback(type))
                .click(function () {
                    // TODO fetch pad tags before presenting dialog to user
                    var dialog = UI.dialog.tagPrompt([], function (tags) {
                        if (!Array.isArray(tags)) { return; }
                        console.error(tags);
                        // TODO do something with the tags the user entered
                    });
                    document.body.appendChild(dialog);
                });
                break;
            default:
                button = $('<button>', {
                    'class': "fa fa-question",
                    style: 'font:'+size+' FontAwesome'
                })
                .click(prepareFeedback(type));
        }
        if (rightside) {
            button.addClass('rightside-button');
        }
        return button;
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
    var getFirstEmojiOrCharacter = common.getFirstEmojiOrCharacter = function (str) {
      if (!str || !str.trim()) { return '?'; }
      var emojis = emojiStringToArray(str);
      return isEmoji(emojis[0])? emojis[0]: str[0];
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
                if (mediaObject.type !== 'download') { return; }
                var root = mediaObject.rootElement;
                if (!root) { return; }

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
                            text += '<b>' + common.fixHTML(title) + '</b><br>';
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
    // SFRAME: copied to sframe-common-interface.js
    common.displayAvatar = function ($container, href, name, cb) {
        var MutationObserver = window.MutationObserver;
        var displayDefault = function () {
            var text = getFirstEmojiOrCharacter(name);
            var $avatar = $('<span>', {'class': 'default'}).text(text);
            $container.append($avatar);
            if (cb) { cb(); }
        };

        if (!href) { return void displayDefault(); }
        var parsed = common.parsePadUrl(href);
        var secret = common.getSecrets('file', parsed.hash);
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = common.base64ToHex(secret.channel);
            var src = common.getBlobPathFromHex(hexFileName);
            common.getFileSize(href, function (e, data) {
                if (e) {
                    displayDefault();
                    return void console.error(e);
                }
                if (typeof data !== "number") { return void displayDefault(); }
                if (common.bytesToMegabytes(data) > 0.5) { return void displayDefault(); }
                var $img = $('<media-tag>').appendTo($container);
                $img.attr('src', src);
                $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
                var observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length) {
                            if (mutation.addedNodes.length > 1 ||
                                mutation.addedNodes[0].nodeName !== 'IMG') {
                                $img.remove();
                                return void displayDefault();
                            }
                            var $image = $img.find('img');
                            var onLoad = function () {
                                var img = new Image();
                                img.onload = function () {
                                    var w = img.width;
                                    var h = img.height;
                                    if (w>h) {
                                        $image.css('max-height', '100%');
                                        $img.css('flex-direction', 'column');
                                        if (cb) { cb($img); }
                                        return;
                                    }
                                    $image.css('max-width', '100%');
                                    $img.css('flex-direction', 'row');
                                    if (cb) { cb($img); }
                                };
                                img.src = $image.attr('src');
                            };
                            if ($image[0].complete) { onLoad(); }
                            $image.on('load', onLoad);
                        }
                    });
                });
                observer.observe($img[0], {
                    attributes: false,
                    childList: true,
                    characterData: false
                });
                MediaTag($img[0]);
            });
        }
    };

    // This is duplicated in drive/main.js, it should be unified
    var getFileIcon = common.getFileIcon = function (data) {
        var $icon = common.getIcon();

        if (!data) { return $icon; }

        var href = data.href;
        if (!href) { return $icon; }

        var type = common.parsePadUrl(href).type;
        $icon = common.getIcon(type);

        return $icon;
    };

    common.createModal = function (cfg) {
        var $body = cfg.$body || $('body');
        var $blockContainer = $body.find('#'+cfg.id);
        if (!$blockContainer.length) {
            $blockContainer = $('<div>', {
                'class': 'cp-modal-container',
                'id': cfg.id
            });
        }
        var hide = function () {
            if (cfg.onClose) { return void cfg.onClose(); }
            $blockContainer.hide();
        };
        $blockContainer.html('').appendTo($body);
        var $block = $('<div>', {'class': 'cp-modal'}).appendTo($blockContainer);
        $('<span>', {
            'class': 'cp-modal-close fa fa-times',
            'title': Messages.filePicker_close
        }).click(hide).appendTo($block);
        $body.click(hide);
        $block.click(function (e) {
            e.stopPropagation();
        });
        $body.keydown(function (e) {
            if (e.which === 27) {
                hide();
            }
        });
        return $blockContainer;
    };
    common.createFileDialog = function (cfg) {
        var $blockContainer = common.createModal({
            id: 'fileDialog',
            $body: cfg.$body
        });
        var $block = $blockContainer.find('.cp-modal');
        var $description = $('<p>').text(Messages.filePicker_description);
        $block.append($description);
        var $filter = $('<p>', {'class': 'cp-modal-form'}).appendTo($block);
        var $container = $('<span>', {'class': 'fileContainer'}).appendTo($block);
        var updateContainer = function () {
            $container.html('');
            var filter = $filter.find('.filter').val().trim();
            var list = common.getUserFilesList();
            var fo = common.getFO();
            list.forEach(function (id) {
                var data = fo.getFileData(id);
                var name = fo.getTitle(id);
                if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                    return;
                }
                var $span = $('<span>', {
                    'class': 'element',
                    'title': name,
                }).appendTo($container);
                $span.append(getFileIcon(data));
                $span.append(name);
                $span.click(function () {
                    if (typeof cfg.onSelect === "function") { cfg.onSelect(data.href); }
                    $blockContainer.hide();
                });
            });
        };
        var to;
        $('<input>', {
            type: 'text',
            'class': 'filter',
            'placeholder': Messages.filePicker_filter
        }).appendTo($filter).on('keypress', function () {
            if (to) { window.clearTimeout(to); }
            to = window.setTimeout(updateContainer, 300);
        });
        //$filter.append(' '+Messages.or+' ');
        var data = {FM: cfg.data.FM};
        $filter.append(common.createButton('upload', false, data, function () {
            $blockContainer.hide();
        }));
        updateContainer();
        $blockContainer.show();
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
            'class': 'cp-dropdown-container'
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
        }).append($('<span>', {'class': 'cp-dropdown-button-title'}).html(config.text || ""));
        /*$('<span>', {
            'class': 'fa fa-caret-down',
        }).appendTo($button);*/

        // Menu
        var $innerblock = $('<div>', {'class': 'cp-dropdown-content'});
        if (config.left) { $innerblock.addClass('cp-dropdown-left'); }

        config.options.forEach(function (o) {
            if (!isValidOption(o)) { return; }
            $('<' + o.tag + '>', o.attributes || {}).html(o.content || '').appendTo($innerblock);
        });

        $container.append($button).append($innerblock);

        var value = config.initialValue || '';

        var setActive = function ($el) {
            if ($el.length !== 1) { return; }
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element(active');
            $el.addClass('cp-dropdown-element-active');
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
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            if (config.isSelect && value) {
                var $val = $innerblock.find('[data-value="'+value+'"]');
                setActive($val);
                $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
            }
            if (config.feedback && store) { common.feedback(config.feedback); }
        };

        $container.click(function (e) {
            e.stopPropagation();
            var state = $innerblock.is(':visible');
            $('.cp-dropdown-content').hide();
            try {
                $('iframe').each(function (idx, ifrw) {
                    $(ifrw).contents().find('.cp-dropdown-content').hide();
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
                var $value = $innerblock.find('[data-value].cp-dropdown-element-active');
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

            $container.setValue = function (val, name) {
                value = val;
                var $val = $innerblock.find('[data-value="'+val+'"]');
                var textValue = name || $val.html() || val;
                $button.find('.cp-dropdown-button-title').html(textValue);
            };
            $container.getValue = function () {
                return value || '';
            };
        }

        return $container;
    };

    // Provide $container if you want to put the generated block in another element
    // Provide $initBlock if you already have the menu block and you want the content inserted in it
    common.createLanguageSelector = function ($container, $initBlock) {
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

    // SFRAME: moved to sframe-common-interface.js
    common.createUserAdminMenu = function (config) {
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
        if (account) {
            options.push({
                tag: 'a',
                attributes: {'class': 'profile'},
                content: Messages.profileButton
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
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        //var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon);//.append($userbig);
        if (account) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            feedback: "USER_ADMIN",
        };
        var $userAdmin = createDropdown(dropdownConfigUser);

        var oldUrl = '';
        if (account && !config.static && store) {
            var $avatar = $userAdmin.find('.cp-dropdown-button-title');
            var updateButton = function (newName) {
                var profile = store.getProfile();
                var url = profile && profile.avatar;

                if (oldUrl === url) { return; }
                oldUrl = url;
                $avatar.html('');
                common.displayAvatar($avatar, url, newName || Messages.anonymous, function ($img) {
                    if ($img) {
                        $userAdmin.find('button').addClass('avatar');
                    }
                });
            };
            common.onDisplayNameChanged(updateButton);
            updateButton(common.getDisplayName());
        }

        $userAdmin.find('a.logout').click(function () {
            common.logout();
            window.location.href = '/';
        });
        $userAdmin.find('a.settings').click(function () {
            if (parsed && parsed.type) {
                window.open('/settings/');
            } else {
                window.location.href = '/settings/';
            }
        });
        $userAdmin.find('a.profile').click(function () {
            if (parsed && parsed.type) {
                window.open('/profile/');
            } else {
                window.location.href = '/profile/';
            }
        });
        $userAdmin.find('a.login').click(function () {
            if (window.location.pathname !== "/") {
                sessionStorage.redirectTo = window.location.href;
            }
            window.location.href = '/login/';
        });
        $userAdmin.find('a.register').click(function () {
            if (window.location.pathname !== "/") {
                sessionStorage.redirectTo = window.location.href;
            }
            window.location.href = '/register/';
        });

        return $userAdmin;
    };

    common.getShareHashes = function (secret, cb) {
        if (!window.location.hash) {
            var hashes = common.getHashes(secret.channel, secret);
            return void cb(null, hashes);
        }
        common.getRecentPads(function (err, recent) {
            var parsed = parsePadUrl(window.location.href);
            if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
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
        //common.alert(Messages._getKey('newVersion', [verArr.join('.')]), null, true);
        localStorage[CRYPTPAD_VERSION] = ver;
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

                updateLocalVersion();
                common.addTooltips();
                f(void 0, env);
                if (typeof(window.onhashchange) === 'function') { window.onhashchange(); }
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

        common.onFriendRequest = function (confirmText, cb) {
            common.confirm(confirmText, cb, null, true);
        };
        common.onFriendComplete = function (data) {
            common.log(data.logText);
        };

        Store.ready(function (err, storeObj) {
            store = common.store = env.store = storeObj;
            common.addDirectMessageHandler(common);

            var proxy = getProxy();
            var network = getNetwork();

            network.on('disconnect', function () {
                Realtime.setConnectionState(false);
            });
            network.on('reconnect', function () {
                Realtime.setConnectionState(true);
            });

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

            $(function() {
                // Race condition : if document.body is undefined when alertify.js is loaded, Alertify
                // won't work. We have to reset it now to make sure it uses a correct "body"
                UI.Alertify.reset();
                // clear any tooltips that might get hung
                setInterval(function () { common.clearTooltips(); }, 5000);

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
                    if (parsedNew) {
                        oldHref = newHref;
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

                        common.getPinLimit(function (e, limit, plan, note) {
                            if (e) { return void console.error(e); }
                            common.account.limit = limit;
                            localStorage.plan = common.account.plan = plan;
                            common.account.note = note;
                            cb();
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

                block++;
                require([
                    '/common/rpc.js',
                ], function (Rpc) {
                    Rpc.createAnonymous(network, function (e, call) {
                        if (e) {
                            console.error(e);
                            return void cb();
                        }
                        anon_rpc = common.anon_rpc = env.anon_rpc = call;
                        cb();
                    });
                });


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
