define([
    '/api/config',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-messaging.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/outer/store-rpc.js',

    '/common/pinpad.js',
    '/customize/application_config.js',
    '/bower_components/nthen/index.js',
], function (Config, Messages, Util, Hash,
            Messaging, Realtime, Constants, Feedback, LocalStore, AStore,
            Pinpad, AppConfig, Nthen) {

/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/
    var postMessage = function (cmd, data, cb) {
        setTimeout(function () {
            AStore.query(cmd, data, cb);
        });
    };
    var tryParsing = function (x) {
        try { return JSON.parse(x); }
        catch (e) {
            console.error(e);
            return null;
        }
    };

    var origin = encodeURIComponent(window.location.hostname);
    var common = window.Cryptpad = {
        Messages: Messages,
        donateURL: 'https://accounts.cryptpad.fr/#/donate?on=' + origin,
        upgradeURL: 'https://accounts.cryptpad.fr/#/?on=' + origin,
        account: {},
    };

    var PINNING_ENABLED = AppConfig.enablePinning;

    // COMMON
    common.getLanguage = function () {
        return Messages._languageUsed;
    };
    common.setLanguage = function (l, cb) {
        var LS_LANG = "CRYPTPAD_LANG";
        localStorage.setItem(LS_LANG, l);
        cb();
    };


    // RESTRICTED
    // Settings only
    common.resetDrive = function (cb) {
        postMessage("RESET_DRIVE", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.logoutFromAll = function (cb) {
        var token = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
        localStorage.setItem(Constants.tokenKey, token);
        postMessage("SET", {
            key: [Constants.tokenKey],
            value: token
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    // Settings and drive
    common.getUserObject = function (cb) {
        postMessage("GET", [], function (obj) {
            cb(obj);
        });
    };
    // Settings and auth
    common.getUserObject = function (cb) {
        postMessage("GET", [], function (obj) {
            cb(obj);
        });
    };
    // Settings and ready
    common.mergeAnonDrive = function (cb) {
        var data = {
            anonHash: LocalStore.getFSHash()
        };
        postMessage("MIGRATE_ANON_DRIVE", data, cb);
    };
    // Drive
    common.userObjectCommand = function (data, cb) {
        postMessage("DRIVE_USEROBJECT", data, cb);
    };
    common.onDriveLog = Util.mkEvent();
    // Profile
    common.getProfileEditUrl = function (cb) {
        postMessage("GET", ['profile', 'edit'], function (obj) {
            cb(obj);
        });
    };
    common.setNewProfile = function (profile) {
        postMessage("SET", {
            key: ['profile'],
            value: profile
        }, function () {});
    };
    common.setAvatar = function (data, cb) {
        var postData = {
            key: ['profile', 'avatar']
        };
        // If we don't have "data", it means we want to remove the avatar and we should not have a
        // "postData.value", even set to undefined (JSON.stringify transforms undefined to null)
        if (data) { postData.value = data; }
        postMessage("SET", postData, cb);
    };
    // Todo
    common.getTodoHash = function (cb) {
        postMessage("GET", ['todo'], function (obj) {
            cb(obj);
        });
    };
    common.setTodoHash = function (hash) {
        postMessage("SET", {
            key: ['todo'],
            value: hash
        }, function () {});
    };


    // RPC
    common.pinPads = function (pads, cb) {
        postMessage("PIN_PADS", pads, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.unpinPads = function (pads, cb) {
        postMessage("UNPIN_PADS", pads, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.getPinnedUsage = function (cb) {
        postMessage("GET_PINNED_USAGE", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(null, obj.bytes);
        });
    };

    common.updatePinLimit = function (cb) {
        postMessage("UPDATE_PIN_LIMIT", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.limit, obj.plan, obj.note);
        });
    };

    common.getPinLimit = function (cb) {
        postMessage("GET_PIN_LIMIT", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.limit, obj.plan, obj.note);
        });
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
        postMessage("CLEAR_OWNED_CHANNEL", channel, cb);
    };

    common.uploadComplete = function (cb) {
        postMessage("UPLOAD_COMPLETE", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadStatus = function (size, cb) {
        postMessage("UPLOAD_STATUS", {size: size}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadCancel = function (cb) {
        postMessage("UPLOAD_CANCEL", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadChunk = function (data, cb) {
        postMessage("UPLOAD_CHUNK", {chunk: data}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    // ANON RPC

    // SFRAME: talk to anon_rpc from the iframe
    common.anonRpcMsg = function (msg, data, cb) {
        if (!msg) { return; }
        postMessage("ANON_RPC_MESSAGE", {
            msg: msg,
            data: data
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.getFileSize = function (href, cb) {
        postMessage("GET_FILE_SIZE", {href: href}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(undefined, obj.size);
        });
    };

    common.getMultipleFileSize = function (files, cb) {
        postMessage("GET_MULTIPLE_FILE_SIZE", {files:files}, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.size);
        });
    };

    // Store



    common.getMetadata = function (cb) {
        postMessage("GET_METADATA", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.setDisplayName = function (value, cb) {
        postMessage("SET_DISPLAY_NAME", value, cb);
    };

    common.setPadAttribute = function (attr, value, cb, href) {
        href = Hash.getRelativeHref(href || window.location.href);
        postMessage("SET_PAD_ATTRIBUTE", {
            href: href,
            attr: attr,
            value: value
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.getPadAttribute = function (attr, cb) {
        var href = Hash.getRelativeHref(window.location.href);
        postMessage("GET_PAD_ATTRIBUTE", {
            href: href,
            attr: attr,
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    common.setAttribute = function (attr, value, cb) {
        postMessage("SET_ATTRIBUTE", {
            attr: attr,
            value: value
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.getAttribute = function (attr, cb) {
        postMessage("GET_ATTRIBUTE", {
            attr: attr
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    // Tags
    common.resetTags = function (href, tags, cb) {
        // set pad attribute
        cb = cb || function () {};
        if (!Array.isArray(tags)) { return void cb('INVALID_TAGS'); }
        common.setPadAttribute('tags', tags.slice(), cb, href);
    };
    common.tagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            var newTags;
            if (!tags) {
                newTags = [tag];
            } else if (tags.indexOf(tag) === -1) {
                newTags = tags.slice();
                newTags.push(tag);
            }
            common.setPadAttribute('tags', newTags, cb, href);
        }, href);
    };
    common.untagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            if (!tags) { return void cb(); }
            var idx = tags.indexOf(tag);
            if (idx === -1) { return void cb(); }
            var newTags = tags.slice();
            newTags.splice(idx, 1);
            common.setPadAttribute('tags', newTags, cb, href);
        }, href);
    };
    common.getPadTags = function (href, cb) {
        if (typeof(cb) !== 'function') { return; }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            cb(void 0, tags ? tags.slice() : []);
        }, href);
    };
    common.listAllTags = function (cb) {
        postMessage("LIST_ALL_TAGS", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(void 0, obj);
        });
    };

    // STORAGE - TEMPLATES
    common.listTemplates = function (type, cb) {
        postMessage("GET_TEMPLATES", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            if (!Array.isArray(obj)) { return void cb ('NOT_AN_ARRAY'); }
            if (!type) { return void cb(null, obj); }

            var templates = obj.filter(function (f) {
                var parsed = Hash.parsePadUrl(f.href);
                return parsed.type === type;
            });
            cb(null, templates);
        });
    };

    common.saveAsTemplate = function (Cryptput, data, cb) {
        var p = Hash.parsePadUrl(window.location.href);
        if (!p.type) { return; }
        var hash = Hash.createRandomHash();
        var href = '/' + p.type + '/#' + hash;
        Cryptput(hash, data.toSave, function (e) {
            if (e) { throw new Error(e); }
            postMessage("ADD_PAD", {
                href: href,
                title: data.title,
                path: ['template']
            }, function (obj) {
                if (obj && obj.error) { return void cb(obj.error); }
                cb();
            });
        });
    };

    common.isTemplate = function (href, cb) {
        var rhref = Hash.getRelativeHref(href);
        common.listTemplates(null, function (err, templates) {
            cb(void 0, templates.some(function (t) {
                return t.href === rhref;
            }));
        });
    };

    common.useTemplate = function (href, Crypt, cb) {
        var parsed = Hash.parsePadUrl(href);
        if(!parsed) { throw new Error("Cannot get template hash"); }
        Crypt.get(parsed.hash, function (err, val) {
            if (err) { throw new Error(err); }
            var p = Hash.parsePadUrl(window.location.href);
            Crypt.put(p.hash, val, cb);
        });
    };

    // Forget button
    common.moveToTrash = function (cb, href) {
        href = href || window.location.href;
        postMessage("MOVE_TO_TRASH", { href: href }, cb);
    };

    // When opening a new pad or renaming it, store the new title
    common.setPadTitle = function (title, padHref, path, cb) {
        var href = padHref || window.location.href;
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return; }
        href = parsed.getUrl({present: parsed.present});

        if (title === null) { return; }
        if (title.trim() === "") { title = Hash.getDefaultName(parsed); }

        postMessage("SET_PAD_TITLE", {
            href: href,
            title: title,
            path: path
        }, function (obj) {
            if (obj && obj.error) {
                console.log("unable to set pad title");
                return void cb(obj.error);
            }
            cb();
        });
    };

    // Needed for the secure filepicker app
    common.getSecureFilesList = function (query, cb) {
        postMessage("GET_SECURE_FILES_LIST", query, function (list) {
            cb(void 0, list);
        });
    };

    // Messaging (manage friends from the userlist)
    common.inviteFromUserlist = function (netfluxId, cb) {
        postMessage("INVITE_FROM_USERLIST", {
            netfluxId: netfluxId,
            href: window.location.href
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };

    // Network
    common.onNetworkDisconnect = Util.mkEvent();
    common.onNetworkReconnect = Util.mkEvent();

    // Messenger
    var messenger = common.messenger = {};
    messenger.getFriendList = function (cb) {
        postMessage("CONTACTS_GET_FRIEND_LIST", null, cb);
    };
    messenger.getMyInfo = function (cb) {
        postMessage("CONTACTS_GET_MY_INFO", null, cb);
    };
    messenger.getFriendInfo = function (curvePublic, cb) {
        postMessage("CONTACTS_GET_FRIEND_INFO", curvePublic, cb);
    };
    messenger.removeFriend = function (curvePublic, cb) {
        postMessage("CONTACTS_REMOVE_FRIEND", curvePublic, cb);
    };
    messenger.openFriendChannel = function (curvePublic, cb) {
        postMessage("CONTACTS_OPEN_FRIEND_CHANNEL", curvePublic, cb);
    };
    messenger.getFriendStatus = function (curvePublic, cb) {
        postMessage("CONTACTS_GET_FRIEND_STATUS", curvePublic, cb);
    };
    messenger.getMoreHistory = function (data, cb) {
        postMessage("CONTACTS_GET_MORE_HISTORY", data, cb);
    };
    messenger.sendMessage = function (data, cb) {
        postMessage("CONTACTS_SEND_MESSAGE", data, cb);
    };
    messenger.setChannelHead = function (data, cb) {
        postMessage("CONTACTS_SET_CHANNEL_HEAD", data, cb);
    };
    messenger.onMessageEvent = Util.mkEvent();
    messenger.onJoinEvent = Util.mkEvent();
    messenger.onLeaveEvent = Util.mkEvent();
    messenger.onUpdateEvent = Util.mkEvent();
    messenger.onFriendEvent = Util.mkEvent();
    messenger.onUnfriendEvent = Util.mkEvent();

    // Pad RPC
    var pad = common.padRpc = {};
    pad.joinPad = function (data, cb) {
        postMessage("JOIN_PAD", data, cb);
    };
    pad.sendPadMsg = function (data, cb) {
        postMessage("SEND_PAD_MSG", data, cb);
    };
    pad.onReadyEvent = Util.mkEvent();
    pad.onMessageEvent = Util.mkEvent();
    pad.onJoinEvent = Util.mkEvent();
    pad.onLeaveEvent = Util.mkEvent();
    pad.onDisconnectEvent = Util.mkEvent();

    common.getFullHistory = function (data, cb) {
        postMessage("GET_FULL_HISTORY", data, cb);
    };

    common.getShareHashes = function (secret, cb) {
        var hashes;
        if (!window.location.hash) {
            hashes = Hash.getHashes(secret.channel, secret);
            return void cb(null, hashes);
        }
        var parsed = Hash.parsePadUrl(window.location.href);
        if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
        if (parsed.type === 'file') { secret.channel = Util.base64ToHex(secret.channel); }
        hashes = Hash.getHashes(secret.channel, secret);

        if (!hashes.editHash && !hashes.viewHash && parsed.hashData && !parsed.hashData.mode) {
            // It means we're using an old hash
            hashes.editHash = window.location.hash.slice(1);
            return void cb(null, hashes);
        }

        postMessage("GET_STRONGER_HASH", {
            href: window.location.href
        }, function (hash) {
            if (hash) { hashes.editHash = hash; }
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

    var _onMetadataChanged = [];
    common.onMetadataChanged = function (h) {
        if (typeof(h) !== "function") { return; }
        if (_onMetadataChanged.indexOf(h) !== -1) { return; }
        _onMetadataChanged.push(h);
    };
    common.changeMetadata = function () {
        _onMetadataChanged.forEach(function (h) { h(); });
    };

    var requestLogin = function () {
        // log out so that you don't go into an endless loop...
        LocalStore.logout();

        // redirect them to log in, and come back when they're done.
        sessionStorage.redirectTo = window.location.href;
        window.location.href = '/login/';
    };

    var onMessage = function (cmd, data, cb) {
        cb = cb || function () {};
        switch (cmd) {
            case 'REQUEST_LOGIN': {
                requestLogin();
                break;
            }
            case 'UPDATE_METADATA': {
                common.changeMetadata();
                break;
            }
            case 'UPDATE_TOKEN': {
                var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
                if (localToken !== data.token) { requestLogin(); }
                break;
            }
            case 'Q_FRIEND_REQUEST': {
                if (!common.onFriendRequest) { break; }
                common.onFriendRequest(data, cb);
                break;
            }
            case 'EV_FRIEND_COMPLETE': {
                if (!common.onFriendComplete) { break; }
                common.onFriendComplete(data);
                break;
            }
            // Network
            case 'NETWORK_DISCONNECT': {
                common.onNetworkDisconnect.fire(); break;
            }
            case 'NETWORK_RECONNECT': {
                common.onNetworkReconnect.fire(data); break;
            }
            // Messenger
            case 'CONTACTS_MESSAGE': {
                common.messenger.onMessageEvent.fire(data); break;
            }
            case 'CONTACTS_JOIN': {
                common.messenger.onJoinEvent.fire(data); break;
            }
            case 'CONTACTS_LEAVE': {
                common.messenger.onLeaveEvent.fire(data); break;
            }
            case 'CONTACTS_UPDATE': {
                common.messenger.onUpdateEvent.fire(data); break;
            }
            case 'CONTACTS_FRIEND': {
                common.messenger.onFriendEvent.fire(data); break;
            }
            case 'CONTACTS_UNFRIEND': {
                common.messenger.onUnfriendEvent.fire(data); break;
            }
            // Pad
            case 'PAD_READY': {
                common.padRpc.onReadyEvent.fire(); break;
            }
            case 'PAD_MESSAGE': {
                common.padRpc.onMessageEvent.fire(data); break;
            }
            case 'PAD_JOIN': {
                common.padRpc.onJoinEvent.fire(data); break;
            }
            case 'PAD_LEAVE': {
                common.padRpc.onLeaveEvent.fire(data); break;
            }
            case 'PAD_DISCONNECT': {
                common.padRpc.onDisconnectEvent.fire(data); break;
            }
            // Drive
            case 'DRIVE_LOG': {
                common.onDriveLog.fire(data);
            }
        }
    };

    common.ready = (function () {
        var env = {};
        var initialized = false;

    return function (f, rdyCfg) {
        if (initialized) {
            return void setTimeout(function () { f(void 0, env); });
        }

        var provideFeedback = function () {
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
        var initFeedback = function (feedback) {
            // Initialize feedback
            Feedback.init(feedback);
            provideFeedback();
        };

        Nthen(function (waitFor) {
            var cfg = {
                query: onMessage, // TODO temporary, will be replaced by a webworker channel
                userHash: LocalStore.getUserHash(),
                anonHash: LocalStore.getFSHash(),
                localToken: tryParsing(localStorage.getItem(Constants.tokenKey)),
                language: common.getLanguage(),
                messenger: rdyCfg.messenger
            };
            if (sessionStorage[Constants.newPadPathKey]) {
                cfg.initialPath = sessionStorage[Constants.newPadPathKey];
                delete sessionStorage[Constants.newPadPathKey];
            }
            AStore.query("CONNECT", cfg, waitFor(function (data) {
                if (data.error) { throw new Error(data.error); }
                if (data.state === 'ALREADY_INIT') {
                    data = data.returned;
                }

                if (data.anonHash && !cfg.userHash) { LocalStore.setFSHash(data.anonHash); }

                if (cfg.userHash && sessionStorage) {
                    // copy User_hash into sessionStorage because cross-domain iframes
                    // on safari replaces localStorage with sessionStorage or something
                    sessionStorage.setItem(Constants.userHashKey, cfg.userHash);
                }

                if (cfg.userHash) {
                    var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
                    if (localToken === null) {
                        // if that number hasn't been set to localStorage, do so.
                        localStorage.setItem(Constants.tokenKey, data[Constants.tokenKey]);
                    }
                }

                // TODO ww
                //Messaging.addDirectMessageHandler(common);
                initFeedback(data.feedback);
            }));
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
                    postMessage("DISCONNECT");
                }
            });

            if (PINNING_ENABLED && LocalStore.isLoggedIn()) {
                console.log("logged in. pads will be pinned");
                postMessage("INIT_RPC", null, waitFor(function (obj) {
                    console.log('RPC handshake complete');
                    if (obj.error) { return; }
                    localStorage.plan = obj.plan;
                }));
            } else if (PINNING_ENABLED) {
                console.log('not logged in. pads will not be pinned');
            } else {
                console.log('pinning disabled');
            }

            postMessage("INIT_ANON_RPC", null, waitFor(function () {
                console.log('Anonymous RPC ready');
            }));
        }).nThen(function (waitFor) {
            if (sessionStorage.createReadme) {
                var data = {
                    driveReadme: Messages.driveReadme,
                    driveReadmeTitle: Messages.driveReadmeTitle,
                };
                postMessage("CREATE_README", data, waitFor(function (e) {
                    if (e && e.error) { return void console.error(e.error); }
                    delete sessionStorage.createReadme;
                }));
            }
        }).nThen(function (waitFor) {
            if (sessionStorage.migrateAnonDrive) {
                common.mergeAnonDrive(waitFor(function() {
                    delete sessionStorage.migrateAnonDrive;
                }));
            }
        }).nThen(function () {
            updateLocalVersion();
            f(void 0, env);
            if (typeof(window.onhashchange) === 'function') { window.onhashchange(); }
        });
    };

    }());

    return common;
});
