define([
    'jquery',
    '/api/config',
    '/customize/messages.js',
    '/common/fsStore.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-messaging.js',
    '/common/common-realtime.js',
    '/common/common-language.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',

    '/common/pinpad.js',
    '/customize/application_config.js',
    '/bower_components/nthen/index.js',
], function ($, Config, Messages, Store, Util, Hash,
            Messaging, Realtime, Language, Constants, Feedback, LocalStore,
            Pinpad, AppConfig, Nthen) {

/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/

    var origin = encodeURIComponent(window.location.hostname);
    var common = window.Cryptpad = {
        Messages: Messages,
        donateURL: 'https://accounts.cryptpad.fr/#/donate?on=' + origin,
        upgradeURL: 'https://accounts.cryptpad.fr/#/?on=' + origin,
        account: {},
    };

    var PINNING_ENABLED = AppConfig.enablePinning;

    var store;
    var rpc;
    var anon_rpc;

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

    // REFACTOR pull language directly
    common.getLanguage = function () {
        return Messages._languageUsed;
    };
    common.setLanguage = function (l, cb) {
        Language.setLanguage(l, null, cb);
    };

    // REAFCTOR store.getProfile should be store.get(['profile'])
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
            name = getProxy()[Constants.displayNameKey];
        }
        name = name || '';
        if (typeof cb === "function") { cb(null, name); }
        return name;
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

    var makePad = common.makePad = function (href, title) {
        var now = +new Date();
        return {
            href: href,
            atime: now,
            ctime: now,
            title: title || Hash.getDefaultName(Hash.parsePadUrl(href)),
        };
    };

    // STORAGE
    common.setPadAttribute = function (attr, value, cb, href) {
        href = Hash.getRelativeHref(href || window.location.href);
        getStore().setPadAttribute(href, attr, value, cb);
    };
    common.setDisplayName = function (value, cb) {
        if (getProxy()) {
            getProxy()[Constants.displayNameKey] = value;
        }
        if (typeof cb === "function") { Realtime.whenRealtimeSyncs(getRealtime(), cb); }
    };
    common.setAttribute = function (attr, value, cb) {
        getStore().setAttribute(attr, value, function (err, data) {
            if (cb) { cb(err, data); }
        });
    };

    // STORAGE
    common.getPadAttribute = function (attr, cb) {
        var href = Hash.getRelativeHref(window.location.href);
        getStore().getPadAttribute(href, attr, cb);
    };
    common.getAttribute = function (attr, cb) {
        getStore().getAttribute(attr, function (err, data) {
            cb(err, data);
        });
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
        var entry = Util.find(getProxy(), [
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
        var files = Util.find(proxy, ['drive', 'filesData']);

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

    // STORAGE - TEMPLATES
    var listTemplates = common.listTemplates = function (type) {
        var allTemplates = getStore().listTemplates();
        if (!type) { return allTemplates; }

        var templates = allTemplates.filter(function (f) {
            var parsed = Hash.parsePadUrl(f.href);
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
        var rhref = Hash.getRelativeHref(href);
        var templates = listTemplates();
        return templates.some(function (t) {
            return t.href === rhref;
        });
    };

    // Secure iframes
    common.useTemplate = function (href, Crypt, cb) {
        var parsed = Hash.parsePadUrl(href);
        if(!parsed) { throw new Error("Cannot get template hash"); }
        Crypt.get(parsed.hash, function (err, val) {
            if (err) { throw new Error(err); }
            var p = Hash.parsePadUrl(window.location.href);
            Crypt.put(p.hash, val, cb);
        });
    };

    // STORAGE
    /* fetch and migrate your pad history from the store */
    var getRecentPads = common.getRecentPads = function (cb) {
        getStore().getDrive('filesData', function (err, recentPads) {
            if (typeof(recentPads) === "object") {
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
            getStore().forgetPad(Hash.getRelativeHref(href), cb);
            return;
        }
        cb ("store.forgetPad is not a function");
    };

    common.setPadTitle = function (name, padHref, cb) {
        var href = typeof padHref === "string" ? padHref : window.location.href;
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return; }
        href = parsed.getUrl({present: parsed.present});
        //href = Hash.getRelativeHref(href);
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
                var p = Hash.parsePadUrl(pad.href);

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

    /*
     * Buttons
     */
    common.renamePad = function (title, href, callback) {
        if (title === null) { return; }

        if (title.trim() === "") {
            var parsed = Hash.parsePadUrl(href || window.location.href);
            title = Hash.getDefaultName(parsed);
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
            var parsed = Hash.parsePadUrl(data.href);
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
        var userHash = localStorage && localStorage[Constants.userHashKey];
        if (!userHash) { return null; }

        var userParsedHash = Hash.parseTypeHash('drive', userHash);
        var userChannel = userParsedHash && userParsedHash.channel;
        if (!userChannel) { return null; }

        var list = fo.getFiles([fo.FILES_DATA]).map(function (id) {
                return Hash.hrefToHexChannelId(fo.getFileData(id).href);
            })
            .filter(function (x) { return x; });

        // Get the avatar
        var profile = store.getProfile();
        if (profile) {
            var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit) : null;
            if (profileChan) { list.push(profileChan); }
            var avatarChan = profile.avatar ? Hash.hrefToHexChannelId(profile.avatar) : null;
            if (avatarChan) { list.push(avatarChan); }
        }

        if (getProxy().friends) {
            var fList = Messaging.getFriendChannelsList(common);
            list = list.concat(fList);
        }

        list.push(Util.base64ToHex(userChannel));
        list.sort();

        return list;
    };

    var getCanonicalChannelList = common.getCanonicalChannelList = function () {
        return Util.deduplicateString(getUserChannelList()).sort();
    };

    var pinsReady = common.pinsReady = function () {
        if (!LocalStore.isLoggedIn()) {
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
        if (!LocalStore.isLoggedIn()) { return void cb(null, false); }
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
                Realtime.whenRealtimeSyncs(r, function () {
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
        var p = Hash.parsePadUrl(window.location.href);
        if (!p.type) { return; }
        var hash = Hash.createRandomHash();
        var href = '/' + p.type + '/#' + hash;
        Cryptput(hash, data.toSave, function (e) {
            if (e) { throw new Error(e); }
            common.addTemplate(makePad(href, data.title));
            Realtime.whenRealtimeSyncs(getRealtime(), function () {
                cb();
            });
        });
    };

    common.getShareHashes = function (secret, cb) {
        if (!window.location.hash) {
            var hashes = Hash.getHashes(secret.channel, secret);
            return void cb(null, hashes);
        }
        common.getRecentPads(function (err, recent) {
            var parsed = Hash.parsePadUrl(window.location.href);
            if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
            if (parsed.type === 'file') { secret.channel = Util.base64ToHex(secret.channel); }
            var hashes = Hash.getHashes(secret.channel, secret);

            if (!hashes.editHash && !hashes.viewHash && parsed.hashData && !parsed.hashData.mode) {
                // It means we're using an old hash
                hashes.editHash = window.location.hash.slice(1);
            }

            // If we have a stronger version in drive, add it and add a redirect button
            var stronger = recent && Hash.findStronger(null, recent);
            if (stronger) {
                var parsed2 = Hash.parsePadUrl(stronger);
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

        if (sessionStorage[Constants.newPadPathKey]) {
            common.initialPath = sessionStorage[Constants.newPadPathKey];
            delete sessionStorage[Constants.newPadPathKey];
        }

        var proxy;
        var network;
        var provideFeedback = function () {
            if (Object.keys(proxy).length === 1) {
                Feedback.send("FIRST_APP_USE", true);
            }

            if (typeof(window.Proxy) === 'undefined') {
                Feedback.send("NO_PROXIES");
            }

            var shimPattern = /CRYPTPAD_SHIM/;
            if (shimPattern.test(Array.isArray.toString())) {
                Feedback.send("NO_ISARRAY");
            }

            if (shimPattern.test(Array.prototype.fill.toString())) {
                Feedback.send("NO_ARRAYFILL");
            }

            if (typeof(Symbol) === 'undefined') {
                Feedback.send('NO_SYMBOL');
            }
            Feedback.reportScreenDimensions();
            Feedback.reportLanguage();
        };
        var initFeedback = function () {
            // Initialize feedback
            try {
                var entry = Util.find(getProxy(), [
                    'settings',
                    'general',
                    'allowUserFeedback'
                ]);
                Feedback.init(entry);
            } catch (e) {
                console.error(e);
                Feedback.init(false);
            }
            provideFeedback();
        };

        Nthen(function (waitFor) {
            Store.ready(waitFor(function (err, storeObj) {
                store = common.store = env.store = storeObj;
                Messaging.addDirectMessageHandler(common);
                proxy = getProxy();
                network = getNetwork();
                network.on('disconnect', function () {
                    Realtime.setConnectionState(false);
                });
                network.on('reconnect', function () {
                    Realtime.setConnectionState(true);
                });
                initFeedback();
            }), common);
        }).nThen(function (waitFor) {
            $(waitFor());
        }).nThen(function (waitFor) {
            // Load the new pad when the hash has changed
            var oldHref  = document.location.href;
            window.onhashchange = function () {
                var newHref = document.location.href;
                var parsedOld = Hash.parsePadUrl(oldHref).hashData;
                var parsedNew = Hash.parsePadUrl(newHref).hashData;
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
            // Listen for login/logout in other tabs
            window.addEventListener('storage', function (e) {
                if (e.key !== Constants.userHashKey) { return; }
                var o = e.oldValue;
                var n = e.newValue;
                if (!o && n) {
                    document.location.reload();
                } else if (o && !n) {
                    LocalStore.logout();
                    if (getNetwork()) {
                        getNetwork().disconnect();
                    }
                }
            });

            if (PINNING_ENABLED && LocalStore.isLoggedIn()) {
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
                    var hash = Hash.createRandomHash();
                    Crypt.put(hash, Messages.driveReadme, function (e) {
                        if (e) {
                            console.error("Error while creating the default pad:", e);
                            return void w();
                        }
                        var href = '/pad/#' + hash;
                        var data = {
                            href: href,
                            title: Messages.driveReadmeTitle,
                            atime: +new Date(),
                            ctime: +new Date()
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
                    var hash = LocalStore.getFSHash();
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
