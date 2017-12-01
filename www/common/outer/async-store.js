define([
    '/common/userObject.js',
    '/common/migrate-user-object.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/common-realtime.js',
    '/common/common-messaging.js',
    '/common/outer/network-config.js',

    '/bower_components/chainpad-crypto/crypto.js?v=0.1.5',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
], function (UserObject, Migrate, Hash, Util, Constants, Feedback, Realtime, Messaging, NetConfig,
             Crypto, ChainPad, Listmap) {
    var Store = {};

    var postMessage = function () {};

    var storeHash;

    var store = {};


    var onSync = function (cb) {
        Realtime.whenRealtimeSyncs(store.realtime, cb);
    };


    Store.get = function (key, cb) {
        cb(Util.find(store.proxy, key));
    };
    Store.set = function (data, cb) {
        var path = data.key.slice();
        var key = path.pop();
        var obj = Util.find(store.proxy, path);
        if (!obj || typeof(obj) !== "object") { return void cb({error: 'INVALID_PATH'}); }
        if (typeof data.value === "undefined") {
            delete obj[key];
        } else {
            obj[key] = data.value;
        }
        onSync(cb);
    };

    Store.hasSigningKeys = function () {
        if (!store.proxy) { return; }
        return typeof(store.proxy.edPrivate) === 'string' &&
               typeof(store.proxy.edPublic) === 'string';
    };

    Store.hasCurveKeys = function () {
        if (!store.proxy) { return; }
        return typeof(store.proxy.curvePrivate) === 'string' &&
               typeof(store.proxy.curvePublic) === 'string';
    };

    var getUserChannelList = function () {
        // start with your userHash...
        var userHash = storeHash;
        if (!userHash) { return null; }

        var userParsedHash = Hash.parseTypeHash('drive', userHash);
        var userChannel = userParsedHash && userParsedHash.channel;
        if (!userChannel) { return null; }

        var list = store.userObject.getFiles([store.userObject.FILES_DATA]).map(function (id) {
                return Hash.hrefToHexChannelId(store.userObject.getFileData(id).href);
            })
            .filter(function (x) { return x; });

        // Get the avatar
        var profile = store.proxy.profile;
        if (profile) {
            var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit) : null;
            if (profileChan) { list.push(profileChan); }
            var avatarChan = profile.avatar ? Hash.hrefToHexChannelId(profile.avatar) : null;
            if (avatarChan) { list.push(avatarChan); }
        }

        if (store.proxy.friends) {
            var fList = Messaging.getFriendChannelsList(store.proxy);
            list = list.concat(fList);
        }

        list.push(Util.base64ToHex(userChannel));
        list.sort();

        return list;
    };

    var getCanonicalChannelList = function () {
        return Util.deduplicateString(getUserChannelList()).sort();
    };

    //////////////////////////////////////////////////////////////////
    /////////////////////// RPC //////////////////////////////////////
    //////////////////////////////////////////////////////////////////

    Store.pinPads = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        if (typeof(cb) !== 'function') {
            console.error('expected a callback');
        }

        store.rpc.pin(data, function (e, hash) {
            if (e) { return void cb({error: e}); }
            cb({hash: hash});
        });
    };

    Store.unpinPads = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

        store.rpc.unpin(data, function (e, hash) {
            if (e) { return void cb({error: e}); }
            cb({hash: hash});
        });
    };

    var account = {};

    Store.getPinnedUsage = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

        store.rpc.getFileListSize(function (err, bytes) {
            if (typeof(bytes) === 'number') {
                account.usage = bytes;
            }
            cb({bytes: bytes});
        });
    };

    // Update for all users from accounts and return current user limits
    Store.updatePinLimit = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        store.rpc.updatePinLimits(function (e, limit, plan, note) {
            if (e) { return void cb({error: e}); }
            account.limit = limit;
            account.plan = plan;
            account.note = note;
            cb(account);
        });
    };
    // Get current user limits
    Store.getPinLimit = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

        var ALWAYS_REVALIDATE = true;
        if (ALWAYS_REVALIDATE || typeof(account.limit) !== 'number' ||
            typeof(account.plan) !== 'string' ||
            typeof(account.note) !== 'string') {
            return void store.rpc.getLimit(function (e, limit, plan, note) {
                if (e) { return void cb({error: e}); }
                account.limit = limit;
                account.plan = plan;
                account.note = note;
                cb(account);
            });
        }
        cb(account);
    };

    Store.clearOwnedChannel = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        store.rpc.clearOwnedChannel(data.channel, function (err, res) {
            if (err) { return void cb({error:err}); }
            cb(res);
        });
    };

    Store.uploadComplete = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        store.rpc.uploadComplete(function (err, res) {
            if (err) { return void cb({error:err}); }
            cb(res);
        });
    };

    Store.uploadStatus = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        store.rpc.uploadStatus(data.size, function (err, res) {
            if (err) { return void cb({error:err}); }
            cb(res);
        });
    };

    Store.uploadCancel = function (data, cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
        store.rpc.uploadCancel(function (err, res) {
            if (err) { return void cb({error:err}); }
            cb(res);
        });
    };

    var arePinsSynced = function (cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

        var list = getCanonicalChannelList();
        var local = Hash.hashChannelList(list);
        store.rpc.getServerHash(function (e, hash) {
            if (e) { return void cb(e); }
            cb(null, hash === local);
        });
    };

    var resetPins = function (cb) {
        if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

        var list = getCanonicalChannelList();
        store.rpc.reset(list, function (e, hash) {
            if (e) { return void cb(e); }
            cb(null, hash);
        });
    };

    Store.uploadChunk = function (data, cb) {
        store.rpc.send.unauthenticated('UPLOAD', data.chunk, function (e, msg) {
            cb({
                error: e,
                msg: msg
            });
        });
    };

    Store.initRpc = function (data, cb) {
        require(['/common/pinpad.js'], function (Pinpad) {
            Pinpad.create(store.network, store.proxy, function (e, call) {
                if (e) { return void cb({error: e}); }

                store.rpc = call;

                Store.getPinLimit(null, function (obj) {
                    if (obj.error) { console.error(obj.error); }
                    account.limit = obj.limit;
                    account.plan = obj.plan;
                    account.note = obj.note;
                    cb(obj);
                });

                arePinsSynced(function (err, yes) {
                    if (!yes) {
                        resetPins(function (err) {
                            if (err) { return console.error(err); }
                            console.log('RESET DONE');
                        });
                    }
                });
            });
        });
    };

    //////////////////////////////////////////////////////////////////
    ////////////////// ANON RPC //////////////////////////////////////
    //////////////////////////////////////////////////////////////////
    Store.anonRpcMsg = function (data, cb) {
        if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
        store.anon_rpc.send(data.msg, data.data, function (err, res) {
            if (err) { return void cb({error: err}); }
            cb(res);
        });
    };

    Store.getFileSize = function (data, cb) {
        console.log(data, cb);
        if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }

        var channelId = Hash.hrefToHexChannelId(data.href);
        store.anon_rpc.send("GET_FILE_SIZE", channelId, function (e, response) {
            if (e) { return void cb({error: e}); }
            if (response && response.length && typeof(response[0]) === 'number') {
                return void cb({size: response[0]});
            } else {
                cb({error: 'INVALID_RESPONSE'});
            }
        });
    };

    Store.getMultipleFileSize = function (data, cb) {
        if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
        if (!Array.isArray(data.files)) {
            return void cb({error: 'INVALID_FILE_LIST'});
        }

        store.anon_rpc.send('GET_MULTIPLE_FILE_SIZE', data.files, function (e, res) {
            if (e) { return void cb({error: e}); }
            if (res && res.length && typeof(res[0]) === 'object') {
                cb({size: res[0]});
            } else {
                cb({error: 'UNEXPECTED_RESPONSE'});
            }
        });
    };

    Store.initAnonRpc = function (data, cb) {
        require([
            '/common/rpc.js',
        ], function (Rpc) {
            Rpc.createAnonymous(store.network, function (e, call) {
                if (e) { return void cb({error: e}); }
                store.anon_rpc = call;
                cb();
            });
        });
    };



    //////////////////////////////////////////////////////////////////
    /////////////////////// Store ////////////////////////////////////
    //////////////////////////////////////////////////////////////////

    // Get the metadata for sframe-common-outer
    Store.getMetadata = function (data, cb) {
        var metadata = {
            // "user" is shared with everybody via the userlist
            user: {
                name: store.proxy[Constants.displayNameKey],
                uid: store.proxy.uid,
                avatar: Util.find(store.proxy, ['profile', 'avatar']),
                profile: Util.find(store.proxy, ['profile', 'view']),
                curvePublic: store.proxy.curvePublic,
            },
            // "priv" is not shared with other users but is needed by the apps
            priv: {
                edPublic: store.proxy.edPublic,
                friends: store.proxy.friends,
                settings: store.proxy.settings,
                thumbnails: !((store.proxy.settings || {}).general || {}).disableThumbnails
            }
        };
        cb(JSON.parse(JSON.stringify(metadata)));
    };

    // Reset the drive part of the userObject (from settings)
    Store.resetDrive = function (data, cb) {
        store.proxy.drive = store.fo.getStructure();
        onSync(cb);
    };

    /**
     * add a "What is CryptPad?" pad in the drive
     * data
     *   - driveReadme
     *   - driveReadmeTitle
     */
    Store.createReadme = function (data, cb) {
        require(['/common/cryptget.js'], function (Crypt) {
            var hash = Hash.createRandomHash();
            Crypt.put(hash, data.driveReadme, function (e) {
                if (e) {
                    return void cb({ error: "Error while creating the default pad:"+ e});
                }
                var href = '/pad/#' + hash;
                var fileData = {
                    href: href,
                    title: data.driveReadmeTitle,
                    atime: +new Date(),
                    ctime: +new Date()
                };
                store.userObject.pushData(fileData, function (e, id) {
                    if (e) {
                        return void cb({ error: "Error while creating the default pad:"+ e});
                    }
                    store.userObject.add(id);
                    onSync(cb);
                });
            });
        });
    };


    /**
     * Merge the anonymous drive into the user drive at registration
     * data
     *   - anonHash
     */
    Store.migrateAnonDrive = function (data, cb) {
        require(['/common/mergeDrive.js'], function (Merge) {
            var hash = data.anonHash;
            Merge.anonDriveIntoUser(store, hash, cb);
        });
    };

    var getAttributeObject = function (attr) {
        if (typeof attr === "string") {
            console.error('DEPRECATED: use setAttribute with an array, not a string');
            return {
                obj: store.proxy.settings,
                key: attr
            };
        }
        if (!Array.isArray(attr)) { return void console.error("Attribute must be string or array"); }
        if (attr.length === 0) { return void console.error("Attribute can't be empty"); }
        var obj = store.proxy.settings;
        attr.forEach(function (el, i) {
            if (i === attr.length-1) { return; }
            if (!obj[el]) {
                obj[el] = {};
            }
            else if (typeof obj[el] !== "object") { return void console.error("Wrong attribute"); }
            obj = obj[el];
        });
        return {
            obj: obj,
            key: attr[attr.length-1]
        };
    };

    // Set the display name (username) in the proxy
    Store.setDisplayName = function (value, cb) {
        store.proxy[Constants.displayNameKey] = value;
        onSync(cb);
    };

    /**
     * Settings & pad attributes
     * data
     *   - href (String)
     *   - attr (Array)
     *   - value (String)
     */
    Store.setPadAttribute = function (data, cb) {
        store.userObject.setPadAttribute(data.href, data.attr, data.value, function () {
            onSync(cb);
        });
    };
    Store.getPadAttribute = function (data, cb) {
        store.userObject.getPadAttribute(data.href, data.attr, function (err, val) {
            if (err) { return void cb({error: err}); }
            cb(val);
        });
    };
    Store.setAttribute = function (data, cb) {
        try {
            var object = getAttributeObject(data.attr);
            object.obj[object.key] = data.value;
        } catch (e) { return void cb({error: e}); }
        onSync(cb);
    };
    Store.getAttribute = function (data, cb) {
        var object;
        try {
            object = getAttributeObject(data.attr);
        } catch (e) { return void cb({error: e}); }
        cb(object.obj[object.key]);
    };

    // Tags
    Store.listAllTags = function (data, cb) {
        var all = [];
        var files = Util.find(store.proxy, ['drive', 'filesData']);

        if (typeof(files) !== 'object') { return cb({error: 'invalid_drive'}); }
        Object.keys(files).forEach(function (k) {
            var file = files[k];
            if (!Array.isArray(file.tags)) { return; }
            file.tags.forEach(function (tag) {
                if (all.indexOf(tag) === -1) { all.push(tag); }
            });
        });
        cb(all);
    };

    var makePad = function (href, title) {
        var now = +new Date();
        return {
            href: href,
            atime: now,
            ctime: now,
            title: title || Hash.getDefaultName(Hash.parsePadUrl(href)),
        };
    };

    Store.addPad = function (data, cb) {
        if (!data.href) { return void cb({error:'NO_HREF'}); }
        var pad = makePad(data.href, data.title);
        store.userObject.pushData(pad, function (e, id) {
            if (e) { return void cb({error: "Error while adding a template:"+ e}); }
            var path = data.path || ['root'];
            store.userObject.add(id, path);
            onSync(cb);
        });
    };

    // Templates
    Store.getTemplates = function (data, cb) {
        var templateFiles = store.userObject.getFiles(['template']);
        var res = [];
        templateFiles.forEach(function (f) {
            var data = store.userObject.getFileData(f);
            res.push(JSON.parse(JSON.stringify(data)));
        });
        cb(res);
    };

    // Pads
    Store.moveToTrash = function (data, cb) {
        var href = Hash.getRelativeHref(data.href);
        store.userObject.forget(href);
        onSync(cb);
    };
    Store.setPadTitle = function (data, cb) {
        var title = data.title;
        var href = data.href;
        var p = Hash.parsePadUrl(href);
        var h = p.hashData;

        var allPads = Util.find(store.proxy, ['drive', 'filesData']) || {};
        var isStronger;

        // If we don't find the new channel in our existing pads, we'll have to add the pads
        // to filesData
        var contains;

        // Update all pads that use the same channel but with a weaker hash
        // Edit > Edit (present) > View > View (present)
        for (var id in allPads) {
            var pad = allPads[id];
            if (!pad.href) { continue; }

            var p2 = Hash.parsePadUrl(pad.href);
            var h2 = p2.hashData;

            // Different types, proceed to the next one
            // No hash data: corrupted pad?
            if (p.type !== p2.type || !h2) { continue; }

            var shouldUpdate = p.hash.replace(/\/$/, '') === p2.hash.replace(/\/$/, '');

            // If the hash is different but represents the same channel, check if weaker or stronger
            if (!shouldUpdate &&
                h.version === 1 && h2.version === 1 &&
                h.channel === h2.channel) {
                // We had view & now we have edit, update
                if (h2.mode === 'view' && h.mode === 'edit') { shouldUpdate = true; }
                // Same mode and we had present URL, update
                else if (h.mode === h2.mode && h2.present) { shouldUpdate = true; }
                // If we're here it means we have a weaker URL:
                // update the date but keep the existing hash
                else {
                    pad.atime = +new Date();
                    contains = true;
                    continue;
                }
            }

            if (shouldUpdate) {
                contains = true;
                pad.atime = +new Date();
                pad.title = title;

                // If the href is different, it means we have a stronger one
                if (href !== pad.href) { isStronger = true; }
                pad.href = href;
            }
        }

        if (isStronger) {
            // If we have a stronger url, remove the possible weaker from the trash.
            // If all of the weaker ones were in the trash, add the stronger to ROOT
            store.userObject.restoreHref(href);
        }

        // Add the pad if it does not exist in our drive
        if (!contains) {
            Store.addPad({
                href: href,
                title: title,
                path: data.path || (store.data && store.data.initialPath)
            }, cb);
            return;
        }
        onSync(cb);
    };

    // Filepicker app
    Store.getSecureFilesList = function (query, cb) {
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
        store.userObject.getFiles(where).forEach(function (id) {
            var data = store.userObject.getFileData(id);
            var parsed = Hash.parsePadUrl(data.href);
            if ((!types || types.length === 0 || types.indexOf(parsed.type) !== -1) &&
                hashes.indexOf(parsed.hash) === -1 &&
                !isFiltered(parsed.type, data)) {
                hashes.push(parsed.hash);
                list[id] = data;
            }
        });
        cb(list);
    };

    // Get hashes for the share button
    Store.getStrongerHash = function (data, cb) {
        var allPads = Util.find(store.proxy, ['drive', 'filesData']) || {};

        // If we have a stronger version in drive, add it and add a redirect button
        var stronger = Hash.findStronger(data.href, allPads);
        if (stronger) {
            var parsed2 = Hash.parsePadUrl(stronger);
            return void cb(parsed2.hash);
        }
        cb();
    };

    // Messaging
    var getMessagingCfg = function () {
        return {
            proxy: store.proxy,
            realtime: store.realtime,
            network: store.network,
            updateMetadata: function () {
                postMessage("UPDATE_METADATA");
            },
            pinPads: Store.pinPads,
            friendComplete: function (data, cb) {
                postMessage("Q_FRIEND_COMPLETE", data, cb);
            },
            friendRequest: function (data) {
                postMessage("EV_FRIEND_REQUEST", data);
            },
        };
    };
    Store.inviteFromUserlist = function (data, cb) {
        var messagingCfg = getMessagingCfg();
        Messaging.inviteFromUserlist(messagingCfg, data, cb);
    };

    var onReady = function (returned, cb) {
        var proxy = store.proxy;
        var userObject = store.userObject = UserObject.init(proxy.drive, {
            pinPads: Store.pinPads,
            loggedIn: store.loggedIn
        });
        var todo = function () {
            userObject.fixFiles();

            Migrate(proxy);

            var requestLogin = function () {
                postMessage("REQUEST_LOGIN");
            };

            if (store.loggedIn) {
                /*  This isn't truly secure, since anyone who can read the user's object can
                    set their local loginToken to match that in the object. However, it exposes
                    a UI that will work most of the time. */

                // every user object should have a persistent, random number
                if (typeof(proxy.loginToken) !== 'number') {
                    proxy[Constants.tokenKey] = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                }
                returned[Constants.tokenKey] = proxy[Constants.tokenKey];

                if (store.data.localToken && store.data.localToken !== proxy[Constants.tokenKey]) {
                    // the local number doesn't match that in
                    // the user object, request that they reauthenticate.
                    return void requestLogin();
                }
            }

            if (!proxy.settings || !proxy.settings.general ||
                    typeof(proxy.settings.general.allowUserFeedback) !== 'boolean') {
                proxy.settings = proxy.settings || {};
                proxy.settings.general = proxy.settings.general || {};
                proxy.settings.general.allowUserFeedback = true;
            }
            returned.feedback = proxy.settings.general.allowUserFeedback;

            if (typeof(cb) === 'function') { cb(returned); }

            if (typeof(proxy.uid) !== 'string' || proxy.uid.length !== 32) {
                // even anonymous users should have a persistent, unique-ish id
                console.log('generating a persistent identifier');
                proxy.uid = Hash.createChannelId();
            }

            // if the user is logged in, but does not have signing keys...
            if (store.loggedIn && (!Store.hasSigningKeys() ||
                !Store.hasCurveKeys())) {
                return void requestLogin();
            }

            proxy.on('change', [Constants.displayNameKey], function (o, n) {
                if (typeof(n) !== "string") { return; }
                postMessage("UPDATE_METADATA");
            });
            proxy.on('change', ['profile'], function () {
                // Trigger userlist update when the avatar has changed
                postMessage("UPDATE_METADATA");
            });
            proxy.on('change', ['friends'], function () {
                // Trigger userlist update when the friendlist has changed
                postMessage("UPDATE_METADATA");
            });
            proxy.on('change', ['settings'], function () {
                postMessage("UPDATE_METADATA");
            });
            proxy.on('change', [Constants.tokenKey], function () {
                postMessage("UPDATE_TOKEN", { token: proxy[Constants.tokenKey] });
            });
        };
        userObject.migrate(todo);
    };

    var connect = function (data, cb) {
        var hash = data.userHash || data.anonHash || Hash.createRandomHash();
        storeHash = hash;
        if (!hash) {
            throw new Error('[Store.init] Unable to find or create a drive hash. Aborting...');
        }
        var secret = Hash.getSecrets('drive', hash);
        var listmapConfig = {
            data: {},
            websocketURL: NetConfig.getWebsocketURL(),
            channel: secret.channel,
            readOnly: false,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'fs',
            logLevel: 1,
            ChainPad: ChainPad,
            classic: true,
        };
        var rt = Listmap.create(listmapConfig);
        store.proxy = rt.proxy;
        store.loggedIn = typeof(data.userHash) !== "undefined";

        var returned = {};
        rt.proxy.on('create', function (info) {
            store.realtime = info.realtime;
            store.network = info.network;
            if (!data.userHash) {
                returned.anonHash = Hash.getEditHashFromKeys(info.channel, secret.keys);
            }
        }).on('ready', function () {
            if (store.userObject) { return; } // the store is already ready, it is a reconnection
            if (!rt.proxy.drive || typeof(rt.proxy.drive) !== 'object') { rt.proxy.drive = {}; }
            var drive = rt.proxy.drive;
            // Creating a new anon drive: import anon pads from localStorage
            if ((!drive[Constants.oldStorageKey] || !Array.isArray(drive[Constants.oldStorageKey]))
                && !drive['filesData']) {
                drive[Constants.oldStorageKey] = [];
            }
            // Drive already exist: return the existing drive, don't load data from legacy store
            onReady(returned, cb);
        })
        .on('change', ['drive', 'migrate'], function () {
            var path = arguments[2];
            var value = arguments[1];
            if (path[0] === 'drive' && path[1] === "migrate" && value === 1) {
                rt.network.disconnect();
                rt.realtime.abort();
            }
        });
    };

    /**
     * Data:
     *   - userHash or anonHash
     * Todo in cb
     *   - LocalStore.setFSHash if needed
     *   - sessionStorage.User_Hash
     *   - stuff with tokenKey
     * Event to outer
     *   - requestLogin
     */
    var initialized = false;
    Store.init = function (data, callback) {
        if (initialized) {
            return void callback({
                error: 'ALREADY_INIT'
            });
        }
        initialized = true;
        postMessage = function (cmd, d, cb) {
            setTimeout(function () {
                data.query(cmd, d, cb); // TODO temporary, will be rzplaced by webworker channel
            });
        };

        store.data = data;
        connect(data, function (ret) {
            if (Object.keys(store.proxy).length === 1) {
                Feedback.send("FIRST_APP_USE", true);
            }

            callback(ret);

            var messagingCfg = getMessagingCfg();
            Messaging.addDirectMessageHandler(messagingCfg);


        });
    };

    Store.disconnect = function () {
        if (!store.network) { return; }
        store.network.disconnect();
    };
    return Store;
});
