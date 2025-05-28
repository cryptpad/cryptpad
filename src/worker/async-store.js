// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (Sortify, UserObject, ProxyManager,
                Migrate, Hash, Util, Constants, Feedback,
                Realtime, Messaging, Pinpad, Rpc, Merge, Cache,
                SF, AccountTS, DriveTS, Cursor,
                Support, Integration, OnlyOffice,
                Mailbox, Profile, Team, Messenger, History,
                Calendar, BadgeTS, Block, NetConfig,
                Crypto, ChainPad, CpNetflux, Listmap,
                Netflux, nThen) => {

    let ApiConfig = {};
    let AppConfig = {};
    const Account = AccountTS.Account;
    const Drive = DriveTS.Drive;
    const Badge = BadgeTS.Badge;
    const window = globalThis;
    globalThis.nacl = globalThis.nacl || Crypto.Nacl;

    const Saferphore = Util.Saferphore;
    var onReadyEvt = Util.mkEvent(true);
    var onCacheReadyEvt = Util.mkEvent(true);
    var onJoinedEvt = Util.mkEvent(true);
    var onPadRejectedEvt = Util.mkEvent(true);

    const setCustomize = data => {
        ApiConfig = data.ApiConfig;
        AppConfig = data.AppConfig;
    };

    // Number of days before deleting the cache for a channel or blob
    var CACHE_MAX_AGE = 90; // DAYS

    // Default settings for new users
    var NEW_USER_SETTINGS = {
        drive: {
            hideDuplicate: true
        },
        pad: {
            width: true,
            spellcheck: true
        },
        security: {
            unsafeLinks: false
        },
        general: {
            allowUserFeedback: true
        }
    };

    var create = function (config) {
        var Store = window.Cryptpad_Store = {};
        let postMessage = config.query || function () {};
        let broadcast = config.broadcast || function () {};

        var store = window.CryptPad_AsyncStore = {
            modules: {}
        };

        Store.onReadyEvt = onReadyEvt;

        // Drive clients
        var driveEventClients = [];
        var sendDriveEvent = function (q, data, sender) {
            driveEventClients.forEach(function (cId) {
                if (cId === sender) { return; }
                postMessage(cId, q, data);
            });
        };

        var getStore = function (teamId) {
            if (!teamId) { return store; }
            try {
                var teams = store.modules['team'];
                var team = teams.getTeam(teamId);
                if (!team) {
                    console.error('Team not found', teamId);
                    return;
                }
                return team;
            } catch (e) {
                console.error(e);
                console.error('Team not found', teamId);
                return;
            }
        };

        var onSync = Store.onSync = function (teamId, cb) {
            var s = getStore(teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            nThen(function (waitFor) {
                if (s.realtime) {
                    Realtime.whenRealtimeSyncs(s.realtime, waitFor());
                }
                if (!s.id && s.drive?.realtime) {
                    Realtime.whenRealtimeSyncs(s.drive.realtime, waitFor());
                }
                if (s.sharedFolders && typeof (s.sharedFolders) === "object") {
                    for (var k in s.sharedFolders) {
                        if (!s.sharedFolders[k].realtime) { continue; } // Deprecated
                        Realtime.whenRealtimeSyncs(s.sharedFolders[k].realtime, waitFor());
                    }
                }
            }).nThen(function () { cb(); });
        };

        Store.get = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.proxy) { return void cb({ error: 'ENODRIVE' }); }
            cb(Util.find(s.proxy, data.key));
        };
        Store.set = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.proxy) { return void cb({ error: 'ENODRIVE' }); }
            var path = data.key.slice();
            var key = path.pop();
            var obj = Util.find(s.proxy, path);
            if (!obj || typeof(obj) !== "object") { return void cb({error: 'INVALID_PATH'}); }
            if (typeof data.value === "undefined") {
                delete obj[key];
            } else {
                obj[key] = data.value;
            }
            if (!data.teamId) {
                broadcast([clientId], "UPDATE_METADATA");
                if (Array.isArray(path) && path[0] === 'profile' && store.messenger) {
                    Messaging.updateMyData(store);
                }
            }
            onSync(data.teamId, cb);
        };

        const copyObject = (src, target) => {
            Object.keys(src).forEach(k => {
                delete src[k];
            });
            Object.keys(target).forEach(k => {
                src[k] = Util.clone(target[k]);
            });
        };
        const getProxy = teamId => {
            let proxy;
            if (!teamId) {
                proxy = store.drive?.proxy;
            } else {
                const s = getStore(teamId);
                proxy = s?.drive?.proxy;
            }
            return proxy;
        };
        Store.drive = {
            get: (clientId, data, cb) => {
                let proxy = getProxy(data.teamId);
                if (!proxy) { return void cb({error: 'ENOTFOUND'}); }
                cb(proxy);
            },
            set: (clientId, data, cb) => {
                let proxy = getProxy(data.teamId);
                if (!proxy) { return void cb({error: 'ENOTFOUND'}); }
                copyObject(proxy, data.value);
                onSync(data.teamId, cb);
            }
        };

        Store.getSharedFolder = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            var id = data.id;
            var proxy;
            if (!s || !s.manager) { return void cb({ error: 'ENOTFOUND' }); }
            if (s.manager.folders[id]) {
                proxy = Util.clone(s.manager.folders[id].proxy);
                proxy.offline = Boolean(s.manager.folders[id].offline);
                // If it is loaded, return the shared folder proxy
                return void cb(proxy);
            } else {
                // Otherwise, check if we know this shared folder
                var shared = Util.find(s.proxy, ['drive', UserObject.SHARED_FOLDERS]) || {};
                if (shared[id]) {
                    // If we know the shared folder, load it and return the proxy
                    return void Store.loadSharedFolder(data.teamId, id, shared[id], function () {
                        cb(s.manager.folders[id].proxy);
                    });
                }
            }
            cb({});
        };

        Store.restoreSharedFolder = function (clientId, data, cb) {
            if (!data.sfId || !data.drive) { return void cb({error:'EINVAL'}); }
            var s = getStore(data.teamId);
            if (s.sharedFolders[data.sfId]) {
                Object.keys(data.drive).forEach(function (k) {
                    s.sharedFolders[data.sfId].proxy[k] = data.drive[k];
                });
                Object.keys(s.sharedFolders[data.sfId].proxy).forEach(function (k) {
                    if (data.drive[k]) { return; }
                    delete s.sharedFolders[data.sfId].proxy[k];
                });
            }
            onSync(data.teamId, cb);
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

        Store.isOwned = function (owners) {
            var edPublic = store.proxy.edPublic;
            // Not logged in? false
            if (!edPublic) { return false; }
            // No owners? false
            if (!Array.isArray(owners) || !owners.length) { return false; }

            if (owners.indexOf(edPublic) !== -1) { return true; }

            // No team
            var teams = store.proxy.teams;
            if (!teams) { return false; }
            return Object.keys(teams).some(function (id) {
                var ed = Util.find(teams[id], ['keys', 'drive', 'edPublic']);
                return ed && owners.indexOf(ed) !== -1;
            });
        };

        var getUserChannelList = function () {
            var userChannel = `${store.driveChannel}#drive`;
            if (!userChannel) { return null; }

            // Get the list of pads' channel ID in your drive
            // This list is filtered so that it doesn't include pad owned by other users
            // It now includes channels from shared folders
            var list = store.manager.getChannelsList('pin');

            // Get the avatar & profile
            var profile = store.proxy.profile;
            if (profile) {
                var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit, null) : null;
                if (profileChan) { list.push(profileChan); }
                var avatarChan = profile.avatar ? Hash.hrefToHexChannelId(profile.avatar, null) : null;
                if (avatarChan) { list.push(avatarChan); }
            }

            if (store.proxy.todo) {
                list.push(Hash.hrefToHexChannelId('/todo/#' + store.proxy.todo, null));
            }

            if (store.proxy.friends) {
                var fList = Messaging.getFriendChannelsList(store.proxy);
                list = list.concat(fList);
            }

            if (store.proxy.mailboxes) {
                var mList = Object.keys(store.proxy.mailboxes).map(function (m) {
                    if (m === "broadcast" && !store.isAdmin) { return; }
                    return store.proxy.mailboxes[m].channel;
                }).filter(Boolean);
                list = list.concat(mList);
            }

            if (store.proxy.calendars) {
                var cList = Object.keys(store.proxy.calendars).map(function (c) {
                    return store.proxy.calendars[c].channel;
                });
                list = list.concat(cList);
            }

            list.push(userChannel);

            if (store.data && store.data.blockId) {
                list.push(`${store.data.blockId}#block`);
            }

            list.sort();

            return list;
        };

        var getExpirableChannelList = function () {
            return store.manager.getChannelsList('expirable');
        };

        var getCanonicalChannelList = function (expirable) {
            var list = expirable ? getExpirableChannelList() : getUserChannelList();
            return Util.deduplicateString(list).sort();
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// RPC //////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        // pinPads needs to support the old format where data is an array of channel IDs
        // and the new format where data is an object with "teamId" and "pads"
        Store.pinPads = function (clientId, data, cb) {
            if (!data) { return void cb({error: 'EINVAL'}); }

            var s = getStore(data && data.teamId);
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            if (typeof(cb) !== 'function') {
                console.error('expected a callback');
                cb = function () {};
            }

            var pads = data.pads || data;
            s.rpc.pin(pads, function (e) {
                if (e) { return void cb({error: e}); }
                cb({});
            });
        };

        // unpinPads needs to support the old format where data is an array of channel IDs
        // and the new format where data is an object with "teamId" and "pads"
        Store.unpinPads = function (clientId, data, cb) {
            if (!data) { return void cb({error: 'EINVAL'}); }

            var s = getStore(data && data.teamId);
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var pads = data.pads || data;
            s.rpc.unpin(pads, function (e) {
                if (e) { return void cb({error: e}); }
                cb({});
            });
        };

        var account = store.account = {};

        Store.getPinnedUsage = function (clientId, data, cb) {
            var s = getStore(data && data.teamId);
            if (!s || !s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            s.rpc.getFileListSize(function (err, bytes) {
                if (!s.id && typeof(bytes) === 'number') {
                    account.usage = bytes;
                }
                cb({bytes: bytes});
            });
        };

        // Update for all users from accounts and return current user limits
        Store.updatePinLimit = function (clientId, data, cb) {
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
        Store.getPinLimit = function (clientId, data, cb) {
            var s = getStore(data && data.teamId);
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var ALWAYS_REVALIDATE = true;
            if (ALWAYS_REVALIDATE || typeof(account.limit) !== 'number' ||
                typeof(account.plan) !== 'string' ||
                typeof(account.note) !== 'string') {
                return void s.rpc.getLimit(function (e, limit, plan, note) {
                    if (e) { return void cb({error: e}); }
                    var data = s.id ? {} : account;
                    data.limit = limit;
                    data.plan = plan;
                    data.note = note;
                    cb(data);
                });
            }
            cb(account);
        };

        // clearOwnedChannel is only used for private chat and forms
        Store.clearOwnedChannel = function (clientId, data, cb) {
            var s = getStore(data && data.teamId);
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            s.rpc.clearOwnedChannel(data.channel, function (err) {
                cb({error:err});
            });
        };

        var myDeletions = {};
        Store.removeOwnedChannel = function (clientId, data, cb) {
            // "data" used to be a string (channelID), now it can also be an object
            // data.force tells us we can safely remove the drive ID
            var channel = data;
            var force = false;
            var teamId;
            var reason;
            if (data && typeof(data) === "object") {
                channel = data.channel;
                force = data.force;
                teamId = data.teamId;
                reason = data.reason;
            }

            if (channel === store.driveChannel && !force) {
                return void cb({error: 'User drive removal blocked!'});
            }

            var s = getStore(teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            // If this channel is loaded, remember that we deleted it ourselves
            if (Store.channels[channel]) { myDeletions[channel] = true; }

            s.rpc.removeOwnedChannel(channel, function (err) {
                if (err) { delete myDeletions[channel]; }
                cb({error:err});
            }, reason);
        };

        var arePinsSynced = function (cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var list = getCanonicalChannelList(false);
            var local = Hash.hashChannelList(list);
            store.rpc.getServerHash(function (e, hash) {
                if (e) { return void cb(e); }
                cb(null, hash === local);
            });
        };

        var resetPins = function (cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var list = getCanonicalChannelList(false);
            store.rpc.reset(list, function (e) {
                if (e) { return void cb(e); }
                cb(null);
            });
        };

        Store.uploadComplete = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            if (data.owned) {
                // Owned file
                s.rpc.ownedUploadComplete(data.id, function (err, res) {
                    if (err) { return void cb({error:err}); }
                    cb(res);
                });
                return;
            }
            // Normal upload
            s.rpc.uploadComplete(data.id, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadStatus = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            s.rpc.uploadStatus(data.size, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadCancel = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            s.rpc.uploadCancel(data.size, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadChunk = function (clientId, data, cb) {
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            if (!s.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            s.rpc.send.unauthenticated('UPLOAD', data.chunk, function (e, msg) {
                cb({
                    error: e,
                    msg: msg
                });
            });
        };

        var initTempRpc = (clientId, cb) => {
            if (store.rpc) { return void cb(store.rpc); }
            var kp = Crypto.Nacl.sign.keyPair();
            var keys = {
                edPublic: Util.encodeBase64(kp.publicKey),
                edPrivate: Util.encodeBase64(kp.secretKey)
            };
            Pinpad.create(store.network, keys, function (e, call) {
                if (e) { return void cb({error: e}); }
                store.rpc = call;
                cb(call);
            });
        };
        var initRpc = function (clientId, data, cb) {
            if (!store.loggedIn) { return cb(); }
            if (store.rpc) { return void cb(account); }
            Pinpad.create(store.network, store.proxy, function (e, call) {
                if (e) { return void cb({error: e}); }

                store.rpc = call;

                store.onRpcReadyEvt.fire();

                Store.getPinLimit(null, null, function (obj) {
                    if (obj.error) { console.error(obj.error); }
                    account.limit = obj.limit;
                    account.plan = obj.plan;
                    account.note = obj.note;
                    cb(obj);
                });
            }, Cache);
        };

        //////////////////////////////////////////////////////////////////
        ////////////////// ANON RPC //////////////////////////////////////
        //////////////////////////////////////////////////////////////////
        Store.anonRpcMsg = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            store.anon_rpc.send(data.msg, data.data, function (err, res) {
                if (err) { return void cb({error: err}); }
                cb(res);
            });
        };

        Store.getFileSize = function (clientId, data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));

            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }

            var channelId = data.channel || Hash.hrefToHexChannelId(data.href, data.password);
            store.anon_rpc.send("GET_FILE_SIZE", channelId, function (e, response) {
                if (e) { return void cb({error: e}); }
                if (response && response.length && typeof(response[0]) === 'number') {
                    if (response[0] === 0) { Cache.clearChannel(channelId); }
                    return void cb({size: response[0]});
                } else {
                    cb({error: 'INVALID_RESPONSE'});
                }
            });
        };

        Store.isNewChannel = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            var channelId = data.channel || Hash.hrefToHexChannelId(data.href, data.password);
            store.anon_rpc.send("IS_NEW_CHANNEL", channelId, function (e, response) {
                if (e) { return void cb({error: e}); }
                if (response && response.length && typeof(response[0]) === 'object') {
                    if (response[0].isNew) { Cache.clearChannel(channelId); }
                    return void cb(response[0]);
                } else {
                    cb({error: 'INVALID_RESPONSE'});
                }
            });
        };

        Store.getMultipleFileSize = function (clientId, data, cb) {
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

        Store.getDeletedPads = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            var list = (data && data.list) || getCanonicalChannelList(true);
            if (!Array.isArray(list)) {
                return void cb({error: 'INVALID_FILE_LIST'});
            }

            store.anon_rpc.send('GET_DELETED_PADS', list, function (e, res) {
                if (e) { return void cb({error: e}); }
                if (res && res.length && Array.isArray(res[0])) {
                    cb(res[0]);
                } else {
                    cb({error: 'UNEXPECTED_RESPONSE'});
                }
            });
        };

        var initAnonRpc = function (clientId, data, cb) {
            if (store.anon_rpc) { return void cb(); }
            Rpc.createAnonymous(store.network, function (e, call) {
                if (e) { return void cb({error: e}); }
                store.anon_rpc = call;
                cb();
            });
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// Store ////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        var getAllStores = Store.getAllStores = function () {
            if (!store.proxy || !store.manager) { return []; }
            var stores = [store];
            var teamModule = store.modules['team'];
            if (teamModule) {
                var teams = teamModule.getTeams().map(function (id) {
                    return teamModule.getTeam(id);
                });
                Array.prototype.push.apply(stores, teams);
            }
            return stores;
        };

        // Get or create the user color for the cursor position
        Store.getUserColor = function () {
            var color = Util.find(store, ['proxy', 'settings', 'general', 'cursor', 'color']);
            if (!color) {
                color = Util.getRandomColor(true);
                Store.setAttribute(null, {
                    attr: ['general', 'cursor', 'color'],
                    value: color
                }, function () {});
            }
            return color;
        };

        // Get the metadata for sframe-common-outer
        Store.getMetadata = function (clientId, app, cb) {
            var proxy = store.proxy || {};
            var disableThumbnails = Util.find(proxy, ['settings', 'general', 'disableThumbnails']);
            var teams = (store.modules['team'] && store.modules['team'].getTeamsData(app)) || {};
            if (!proxy.uid) {
                store.noDriveUid = store.noDriveUid || Hash.createChannelId();
            }

            var metadata = {
                // "user" is shared with everybody via the userlist
                user: {
                    name: proxy[Constants.displayNameKey] || store.noDriveName || "",
                    uid: proxy.uid || store.noDriveUid, // Random uid in nodrive mode
                    avatar: Util.find(proxy, ['profile', 'avatar']),
                    profile: Util.find(proxy, ['profile', 'view']),
                    color: Store.getUserColor(),
                    notifications: Util.find(proxy, ['mailboxes', 'notifications', 'channel']),
                    curvePublic: proxy.curvePublic,
                    edPublic: proxy.edPublic,
                    netfluxId:  store?.network?.webChannels?.[0]?.myID,
                    badge: Util.find(proxy, ['profile', 'badge'])
                },
                // "priv" is not shared with other users but is needed by the apps
                priv: {
                    clientId: clientId,
                    edPublic: proxy.edPublic,
                    edPrivate: proxy.edPrivate,
                    friends: proxy.friends || {},
                    settings: proxy.settings || NEW_USER_SETTINGS,
                    thumbnails: disableThumbnails === false,
                    isDriveOwned: Boolean(Util.find(store, ['driveMetadata', 'owners'])),
                    driveChannel: store.driveChannel,
                    pendingFriends: proxy.friends_pending || {},
                    supportPrivateKey: Util.find(proxy, ['mailboxes', 'supportadmin', 'keys', 'curvePrivate']),
                    accountName: proxy.login_name || '',
                    offline: store.proxy && store.offline,
                    teams: teams,
                    plan: store.ready ? (account.plan || '') : undefined,
                    mutedChannels: proxy.mutedChannels
                }
            };
            cb(JSON.parse(JSON.stringify(metadata)));
            return metadata;
        };

        Store.onMaintenanceUpdate = function (/*uid*/) {
            // use uid in /api/broadcast so that all connected users will use the same cached
            // version on the server
            let origin = ApiConfig.httpUnsafeOrigin;
            Util.fetchApi(origin, 'broadcast', true, (Broadcast) => {
                if (!Broadcast) { return; }
                broadcast([], 'UNIVERSAL_EVENT', {
                    type: 'broadcast',
                    data: {
                        ev: 'MAINTENANCE',
                        data: Broadcast.maintenance
                    }
                });
            });
        };
        Store.onSurveyUpdate = function (/*uid*/) {
            // use uid in /api/broadcast so that all connected users will use the same cached
            // version on the server
            let origin = ApiConfig.httpUnsafeOrigin;
            Util.fetchApi(origin, 'broadcast', true, (Broadcast) => {
                broadcast([], 'UNIVERSAL_EVENT', {
                    type: 'broadcast',
                    data: {
                        ev: 'SURVEY',
                        data: Broadcast.surveyURL
                    }
                });
            });
        };

        var makePad = function (href, roHref, title) {
            var now = +new Date();
            return {
                href: href,
                roHref: roHref,
                atime: now,
                ctime: now,
                title: title || UserObject.getDefaultName(Hash.parsePadUrl(href)),
            };
        };

        Store.addPad = function (clientId, data, cb) {
            if (!data.href && !data.roHref) { return void cb({error:'NO_HREF'}); }
            var secret;
            if (!data.roHref) {
                var parsed = Hash.parsePadUrl(data.href);
                if (parsed.hashData.type === "pad") {
                    secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
                    data.roHref = '/' + parsed.type + '/#' + Hash.getViewHashFromKeys(secret);
                }
            }
            var pad = makePad(data.href, data.roHref, data.title);
            if (data.owners) { pad.owners = data.owners; }
            if (data.expire) { pad.expire = data.expire; }
            if (data.password) { pad.password = data.password; }
            if (data.channel || secret) { pad.channel = data.channel || secret.channel; }
            if (data.readme) { pad.readme = 1; }
            Object.keys(data.attributes || {}).forEach(k => {
                if (!data.attributes[k]) { return; } // undefined
                pad[k] = data.attributes[k];
            });

            if (data.teamId === -1) { data.teamId = undefined; }
            var s = getStore(data.teamId);
            if (!s || !s.manager) { return void cb({ error: 'ENOTFOUND' }); }

            s.manager.addPad(data.path, pad, function (e) {
                if (e) { return void cb({error: e}); }
                // Send a CHANGE events to all the teams because we may have just
                // added a pad to a shared folder stored in multiple teams
                getAllStores().forEach(function (_s) {
                    var send = _s.id ? _s.sendEvent : sendDriveEvent;
                    send('DRIVE_CHANGE', {
                        path: ['drive', UserObject.FILES_DATA]
                    }, clientId);
                });
                onSync(data.teamId, cb);
            });
        };

        var getOwnedPads = function (account) {
            var list = [];
            if (account) {
                if (store.proxy.todo) {
                    // No password for todo
                    list.push(Hash.hrefToHexChannelId('/todo/#' + store.proxy.todo, null));
                }
                if (store.proxy.profile && store.proxy.profile.edit) {
                    // No password for profile
                    list.push(Hash.hrefToHexChannelId('/profile/#' + store.proxy.profile.edit, null));
                }
                if (store.proxy.mailboxes) {
                    Object.keys(store.proxy.mailboxes || {}).forEach(function (id) {
                        if (id === 'supportadmin') { return; }
                        var m = store.proxy.mailboxes[id];
                        list.push(m.channel);
                    });
                }
            } else {
                list = store.manager.getChannelsList('owned');
                /*
                if (store.proxy.teams) {
                    Object.keys(store.proxy.teams || {}).forEach(function (id) {
                        var t = store.proxy.teams[id];
                        if (t.owner) {
                            list.push(t.channel);
                            list.push(t.keys.roster.channel);
                            list.push(t.keys.chat.channel);
                        }
                    });
                }
                */
            }
            return list.filter(function (channel) {
                if (typeof(channel) !== 'string') { return; }
                return [32, 48].indexOf(channel.length) !== -1;
            });
        };
        var removeOwnedPads = function (account, waitFor) {
            // Delete owned pads
            var edPublic = Util.find(store, ['proxy', 'edPublic']);
            var ownedPads = getOwnedPads(account);
            var sem = Saferphore.create(10);

            var deleteChannel = function (c) {
                // When deleting the whole account, no need to remove from drive
                if (account) { return; }

                var all = store.manager.findChannel(c);
                all.forEach(function (d) {
                    var p = store.manager.findFile(d.id);
                    store.manager.delete({paths:p});
                });
            };

            ownedPads.forEach(function (c) {
                var w = waitFor();
                sem.take(function (give) {
                    var otherOwners = false;
                    nThen(function (_w) {
                        // Don't check server metadata for blobs
                        if (c.length !== 32) { return; }
                        Store.anonRpcMsg(null, {
                            msg: 'GET_METADATA',
                            data: c
                        }, _w(function (obj) {
                            if (obj && obj.error) {
                                give();
                                w();
                                return void _w.abort();
                            }
                            var md = obj[0];

                            if (!Object.keys(md || {}).length) {
                                deleteChannel(c);
                                give();
                                w();
                                return void _w.abort();
                            }

                            var isOwner = md && Array.isArray(md.owners) && md.owners.indexOf(edPublic) !== -1;
                            if (!isOwner) {
                                give();
                                w();
                                return void _w.abort();
                            }
                            otherOwners = md.owners.some(function (ed) { return ed !== edPublic; });
                        }));
                    }).nThen(function (_w) {
                        if (otherOwners) {
                            Store.setPadMetadata(null, {
                                channel: c,
                                command: 'RM_OWNERS',
                                value: [edPublic],
                            }, _w());
                            return;
                        }
                        // We're the only owner: delete the pad
                        store.rpc.removeOwnedChannel(c, _w(function (err) {
                            if (err) { return void console.error(err); }
                            deleteChannel(c);
                        }));
                    }).nThen(function () {
                        give();
                        w();
                    });
                });
            });
        };

        Store.removeOwnedPads = function (clientId, data, cb) {
            var edPublic = store.proxy.edPublic;
            if (!edPublic) { return void cb({ error: 'NOT_LOGGED_IN' }); }
            nThen(function (waitFor) {
                removeOwnedPads(false, waitFor);
            }).nThen(cb);
        };
        Store.deleteAccount = function (clientId, data, cb) {
            var edPublic = store.proxy.edPublic;
            var blockKeys = data && data.keys;
            var auth = data && data.auth;
            Store.anonRpcMsg(clientId, {
                msg: 'GET_METADATA',
                data: store.driveChannel
            }, function (data) {
                var metadata = data[0];
                // Owned drive
                if (metadata && metadata.owners && metadata.owners.length === 1 &&
                    metadata.owners.indexOf(edPublic) !== -1) {
                    nThen(function (waitFor) {
                        Block.checkRights({
                            auth: auth,
                            blockKeys: blockKeys,
                        }, waitFor(function (err) {
                            if (err) {
                                waitFor.abort();
                                console.error(err);
                                return void cb({ error: 'INVALID_CODE' });
                            }
                        }));
                    }).nThen(function (waitFor) {
                        globalThis.accountDeletion = clientId;
                        // Log out from other workers
                        store.proxy[Constants.tokenKey] = 'DELETED';
                        onSync(null, waitFor());
                    }).nThen(function (waitFor) {
                        // Delete Pin Store
                        store.rpc.removePins(waitFor(function (err) {
                            if (err) { console.error(err); }
                        }));
                    }).nThen(function (waitFor) {
                        // Delete Drive
                        store.ownDeletion = true;
                        Store.removeOwnedChannel(clientId, {
                            channel: store.driveChannel,
                            force: true
                        }, waitFor());
                    }).nThen(function (waitFor) {
                        if (!blockKeys) { return; }
                        Block.removeLoginBlock({
                            reason: 'ARCHIVE_OWNED',
                            auth: auth,
                            edPublic: edPublic,
                            blockKeys: blockKeys,
                        }, waitFor(function (err) {
                            if (err) { console.error(err); }
                        }));
                    }).nThen(function (waitFor) {
                        removeOwnedPads(true, waitFor);
                    }).nThen(function () {
                        // Log out current worker
                        broadcast([clientId], "DRIVE_DELETED", 'ARCHIVE_OWNED');
                        postMessage(clientId, "DELETE_ACCOUNT", 'DELETED', function () {});
                        store.network.disconnect();
                        cb({
                            state: true
                        });
                    });
                    return;
                }

                // Not owned drive
                var toSign = {
                    intent: 'Please delete my account.'
                };
                toSign.drive = store.driveChannel;
                toSign.edPublic = edPublic;
                var signKey = Util.decodeBase64(store.proxy.edPrivate);
                var proof = Crypto.Nacl.sign.detached(Util.decodeUTF8(Sortify(toSign)), signKey);

                var check = Crypto.Nacl.sign.detached.verify(Util.decodeUTF8(Sortify(toSign)),
                    proof,
                    Util.decodeBase64(edPublic));

                if (!check) { console.error('signed message failed verification'); }

                var proofTxt = Util.encodeBase64(proof);
                cb({
                    proof: proofTxt,
                    toSign: JSON.parse(Sortify(toSign))
                });
            });
        };

        /**
         * Merge the anonymous drive into the user drive at registration
         * data
         *   - anonHash
         */
        Store.migrateAnonDrive = function (clientId, data, cb) {
            var hash = data.anonHash;
            Merge.anonDriveIntoUser(store, hash, cb);
        };

        // Set the display name (username) in the proxy
        Store.setDisplayName = function (clientId, value, cb) {
            if (!store.proxy) {
                store.noDriveName = value;
                broadcast([clientId], "UPDATE_METADATA");
                return void cb();
            }
            if (store.modules['profile']) {
                store.modules['profile'].setName(value);
            }
            store.proxy[Constants.displayNameKey] = value;
            broadcast([clientId], "UPDATE_METADATA");
            Messaging.updateMyData(store);
            onSync(null, cb);
        };

        // Reset the drive part of the userObject (from settings)
        Store.resetDrive = function (clientId, data, cb) {
            nThen(function (waitFor) {
                removeOwnedPads(waitFor);
            }).nThen(function () {
                store.proxy.drive = store.userObject.getStructure();
                sendDriveEvent('DRIVE_CHANGE', {
                    path: ['drive', 'filesData']
                }, clientId);
                onSync(null, cb);
            });
        };

        /**
         * Settings & pad attributes
         * data
         *   - href (String)
         *   - attr (Array)
         *   - value (String)
         */
        Store.setPadAttribute = function (clientId, data, cb) {
            nThen(function (waitFor) {
                getAllStores().forEach(function (s) {
                    s.manager.setPadAttribute(data, waitFor(function () {
                        var send = s.id ? s.sendEvent : sendDriveEvent;
                        send('DRIVE_CHANGE', {
                            path: ['drive', UserObject.FILES_DATA]
                        }, clientId);
                        onSync(s.id, waitFor());
                    }));
                });
            }).nThen(cb); // cb when all managers are synced
        };
        Store.getPadAttribute = function (clientId, data, cb) {
            var res = {};
            nThen(function (waitFor) {
                getAllStores().forEach(function (s) {
                    s.manager.getPadAttribute(data, waitFor(function (err, val) {
                        if (err) { return; }
                        if (!val || typeof(val) !== "object") { return void console.error("Not an object!"); }
                        if (!res.value || res.atime < val.atime) {
                            res.atime = val.atime;
                            res.value = val.value;
                        }
                    }));
                });
            }).nThen(function () {
                cb(res.value);
            });
        };

        var getAttributeObject = function (attr) {
            if (typeof attr === "string") {
                console.error('DEPRECATED: use setAttribute with an array, not a string');
                return {
                    path: ['settings'],
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
                path: ['settings'].concat(attr),
                obj: obj,
                key: attr[attr.length-1]
            };
        };
        Store.setAttribute = function (clientId, data, cb) {
            try {
                var object = getAttributeObject(data.attr);
                object.obj[object.key] = data.value;
            } catch (e) { return void cb({error: e}); }
            onSync(null, function () {
                cb();
                broadcast([], "UPDATE_METADATA");
            });
        };
        Store.getAttribute = function (clientId, data, cb) {
            var object;
            try {
                object = getAttributeObject(data.attr);
            } catch (e) { return void cb({error: e}); }
            cb(object.obj[object.key]);
        };

        // Tags
        Store.listAllTags = function (clientId, data, cb) {
            var tags = {};
            getAllStores().forEach(function (s) {
                var l = s.manager.getTagsList();
                Object.keys(l).forEach(function (tag) {
                    tags[tag] = (tags[tag] || 0) + l[tag];
                });
            });
            cb(tags);
        };

        // Templates
        // Note: maybe we should get templates "per team" to avoid creating a document with a template
        // from a different team
        Store.getTemplates = function (clientId, data, cb) {
            // No templates in shared folders: we don't need the manager here
            var res = [];
            var channels = [];
            getAllStores().forEach(function (s) {
                var templateFiles = s.userObject.getFiles(['template']);
                templateFiles.forEach(function (f) {
                    var data = s.userObject.getFileData(f);
                    // Don't push duplicates
                    if (channels.indexOf(data.channel) !== -1) { return; }
                    channels.push(data.channel);
                    // Puhs a copy of the data
                    res.push(JSON.parse(JSON.stringify(data)));
                });
            });
            cb(res);
        };
        Store.incrementTemplateUse = function (clientId, href) {
            // No templates in shared folders: we don't need the manager here
            getAllStores().forEach(function (s) {
                s.userObject.getPadAttribute(href, 'used', function (err, data) {
                    // This is a not critical function, abort in case of error to make sure we won't
                    // create any issue with the user object or the async store
                    if (err) { return; }
                    var used = typeof data === "number" ? ++data : 1;
                    s.userObject.setPadAttribute(href, 'used', used);
                });
            });
        };

        // Pads
        Store.isOnlyInSharedFolder = function (clientId, channel, cb) {
            var res = false;

            // The main drive doesn't have an fId (folder ID)
            var isInMainDrive = function (obj) { return !obj.fId; };

            // A pad is only in a shared folder if it is in one of our managers
            // AND if if it not in any "main" drive
            getAllStores().some(function (s) {
                var _res = s.manager.findChannel(channel);

                // Not in this manager: go the the next one
                if (!_res.length) { return; }

                // if the pad is in the main drive, cb(false)
                if (_res.some(isInMainDrive)) {
                    res = false;
                    return true;
                }

                // Otherwise the pad is only in a shared folder in this manager:
                // set the result to true and check the next manager
                res = true;
            });

            return cb (res);
        };
        Store.moveToTrash = function (clientId, data, cb) {
            var href = Hash.getRelativeHref(data.href);
            var allErrors = true;
            nThen(function (waitFor) {
                getAllStores().forEach(function (s) {
                    var deleted = s.userObject.forget(href);
                    if (!deleted) { return; }
                    allErrors = false;
                    var send = s.id ? s.sendEvent : sendDriveEvent;
                    send('DRIVE_CHANGE', {
                        path: ['drive', UserObject.FILES_DATA]
                    }, clientId);
                    onSync(s.id, waitFor());
                });
            }).nThen(function () {
                cb({
                    error: allErrors ? 'FORBIDDEN' : undefined
                });
            });
        };
        Store.setPadTitle = function (clientId, data, cb) {
            onReadyEvt.reg(function () {
            var title = data.title;
            var href = data.href;
            var channel = data.channel;
            var p = Hash.parsePadUrl(href);
            var h = p.hashData;

            if (title.trim() === "") { title = UserObject.getDefaultName(p); }

            if (AppConfig.disableAnonymousStore && !store.loggedIn) {
                return void cb({ notStored: true });
            }
            if (p.type === "debug") {
                return void cb({ notStored: true });
            }

            var channelData = Store.channels && Store.channels[channel];

            var owners;
            if (channelData && channelData.wc && channel === channelData.wc.id) {
                owners = channelData.data.owners || undefined;
            }
            if (data.owners) {
                owners = data.owners;
            }

            var expire;
            if (channelData && channelData.wc && channel === channelData.wc.id) {
                expire = +channelData.data.expire || undefined;
            }
            if (data.expire) {
                expire = data.expire;
            }

            //var storeLocally = data.teamId === -1;
            if (data.teamId) { data.teamId = Number(data.teamId); }

            // If a teamId is provided, it means we want to store the pad in a specific
            // team drive. In this case, we just need to check if the pad is already
            // stored in this team drive.
            // If no team ID is provided, this may be a pad shared with its URL.
            // We need to check if the pad is stored in any managers (user or teams).
            // If it is stored, update its data, otherwise ask the user if they want to store it
            var allData = [];
            var sendTo = [];
            var inTargetDrive, inMyDrive;
            getAllStores().forEach(function (s) {
                // If this is an edit link but we don't have edit rights, this entry is not useful
                if (h.mode === "edit" && s.id && !s.secondaryKey) {
                    return;
                }

                var res = s.manager.findChannel(channel, true);
                if (res.length) {
                    sendTo.push(s.id);
                }

                // Check if the pad is already stored in the specified drive (data.teamId)
                if ((!s.id && (!data.teamId || data.teamId === -1)) || Number(s.id) === data.teamId) {
                    if (!inTargetDrive) {
                        inTargetDrive = res.length;
                    }
                }

                if (!s.id) { inMyDrive = res.length; }

                Array.prototype.push.apply(allData, res);
            });
            var contains = allData.length !== 0;
            if (store.offline && !contains) {
                return void cb({ error: 'OFFLINE' });
            } else if (store.offline) {
                return void cb();
            }
            allData.forEach(function (obj) {
                var pad = obj.data;
                pad.atime = +new Date();
                pad.title = title;
                if (owners || h.type !== "file") {
                    // OWNED_FILES
                    // Never remove owner for files
                    pad.owners = owners;
                }
                pad.expire = expire;

                if (pad.readme) {
                    delete pad.readme;
                    Feedback.send('OPEN_README');
                }

                if (h.mode === 'view') { return; }

                // If we only have rohref, it means we have a stronger href
                if (!pad.href) {
                    // If we have a stronger url, remove the possible weaker from the trash.
                    // If all of the weaker ones were in the trash, add the stronger to ROOT
                    obj.userObject.restoreHref(href);
                }
                obj.userObject.setHref(channel, null, href);
            });

            // Add the pad if it does not exist in our drive
            if (!contains || (data.forceSave && !inTargetDrive)) {
                var autoStore = Util.find(store.proxy, ['settings', 'general', 'autostore']);
                if (autoStore !== 1 && !data.forceSave && !data.path) {
                    // send event to inner to display the corner popup
                    postMessage(clientId, "AUTOSTORE_DISPLAY_POPUP", {
                        autoStore: autoStore
                    });
                    return void cb({ notStored: true });
                } else {
                    var roHref;
                    if (h.mode === "view") {
                        roHref = href;
                        href = undefined;
                    }
                    Store.addPad(clientId, {
                        teamId: data.teamId,
                        href: href,
                        roHref: roHref,
                        channel: channel,
                        title: title,
                        owners: owners,
                        expire: expire,
                        password: data.password,
                        path: data.path,
                        attributes: data.attributes
                    }, cb);
                    // Let inner know that dropped files shouldn't trigger the popup
                    postMessage(clientId, "AUTOSTORE_DISPLAY_POPUP", {
                        stored: true,
                        inMyDrive: inMyDrive || (!contains && !data.teamId) // display "store in cryptdrive" entry
                    });
                    return;
                }
            }

            sendTo.forEach(function (teamId) {
                var send = teamId ? getStore(teamId).sendEvent : sendDriveEvent;
                send('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                }, clientId);
            });
            // Let inner know that dropped files shouldn't trigger the popup
            postMessage(clientId, "AUTOSTORE_DISPLAY_POPUP", {
                stored: true,
                inMyDrive: inMyDrive
            });
            nThen(function (waitFor) {
                sendTo.forEach(function (teamId) {
                    onSync(teamId, waitFor());
                });
            }).nThen(cb);

            });
        };

        // Filepicker app

        // Get a map of file data corresponding to the given filters.
        // The keys used in the map represent the ID of the "files"
        // TODO maybe we shouldn't mix results from teams and from the user?
        Store.getSecureFilesList = function (clientId, query, cb) {
            var list = {};
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
            var channels = [];
            getAllStores().forEach(function (s) {
                s.manager.getSecureFilesList(where).forEach(function (obj) {
                    var data = obj.data;
                    if (channels.indexOf(data.channel || data.id) !== -1) { return; }
                    var id = obj.id;
                    if (data.channel) { channels.push(data.channel || data.id); }
                    // Only include static links if "link" is requested
                    if (data.static) {
                        if (types.indexOf('link') !== -1) { list[id] = data; }
                        return;
                    }
                    var parsed = Hash.parsePadUrl(data.href || data.roHref);
                    if ((!types || types.length === 0 || types.indexOf(parsed.type) !== -1) &&
                        !isFiltered(parsed.type, data)) {
                        list[id] = data;
                    }
                });
            });
            cb(list);
        };

        // Get the first pad we can find in any of our drives and return its file data
        // NOTE: This is currently only used for template: this won't search inside shared folders
        Store.getPadData = function (clientId, id, cb) {
            var res = {};
            getAllStores().some(function (s) {
                var d = s.userObject.getFileData(id);
                if (!d.roHref && !d.href) { return; }
                res = d;
                return true;
            });
            cb(res);
        };

        Store.getPadDataFromChannel = function (clientId, obj, cb) {
            var channel = obj.channel;
            var edit = obj.edit;
            var isFile = obj.file;
            var res;
            var viewRes;
            getAllStores().some(function (s) {
                var chans = s.manager.findChannel(channel);
                if (!Array.isArray(chans)) { return; }
                return chans.some(function (pad) {
                    if (!pad || !pad.data) { return; }
                    var data = pad.data;
                    // We've found a match: return the value and stop the loops
                    if ((edit && data.href) || (!edit && data.roHref) || isFile) {
                        res = data;
                        return true;
                    }
                    // We've found a weaker match: store it for now
                    if (edit && !viewRes && data.roHref) {
                        viewRes = data;
                    }
                });
            });
            var result = res || viewRes;

            // If we're not fully synced yet and we don't have a result, wait for the ready event
            if (!result && store.offline) {
                onReadyEvt.reg(function () {
                    Store.getPadDataFromChannel(clientId, obj, cb);
                });
                return;
            }
            // Call back with the best value we can get
            cb(result || {});
        };

        // Hidden hash: if a pad is deleted, we may have to switch back to full hash
        // in some tabs
        Store.checkDeletedPad = function (channel, cb) {
            if (!channel) { return; }

            // Check if the pad is still stored in one of our drives
            Store.getPadDataFromChannel(null, {
                channel: channel,
                isFile: true // we don't care if it's view or edit
            }, function (res) {
                if (typeof(cb) === "function") { setTimeout(cb); }
                // If it is stored, abort
                if (Object.keys(res).length) { return; }
                // Otherwise, tell all the tabs that this channel was deleted and give them the hrefs
                broadcast([], "CHANNEL_DELETED", channel);
            });
        };

        // Messaging (manage friends from the userlist)
        Store.answerFriendRequest = function (clientId, obj, cb) {
            var value = obj.value;
            var data = obj.data;
            if (data.type !== 'notifications') { return void cb ({error: 'EINVAL'}); }
            var hash = data.content.hash;
            var msg = data.content.msg;

            var dismiss = function (cb) {
                cb = cb || function () {};
                store.mailbox.dismiss({
                    hash: hash,
                    type: 'notifications'
                }, cb);
            };

            // If we accept the request, add the friend to the list
            if (value) {
                Messaging.acceptFriendRequest(store, msg.content.user, function (obj) {
                    if (obj && obj.error) { return void cb(obj); }
                    Messaging.addToFriendList({
                        proxy: store.proxy,
                        realtime: store.realtime,
                        pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
                    }, msg.content.user, function (err) {
                        if (store.messenger) {
                            store.messenger.onFriendAdded(msg.content.user);
                        }
                        broadcast([], "UPDATE_METADATA");
                        if (err) { return void cb({error: err}); }
                        dismiss(cb);
                    });
                });
                return;
            }
            // Otherwise, just remove the notification
            Messaging.declineFriendRequest(store, msg.content.user, function (obj) {
                broadcast([], "UPDATE_METADATA");
                cb(obj);
            });
            dismiss();
        };
        Store.sendFriendRequest = function (clientId, data, cb) {
            var friend = Messaging.getFriend(store.proxy, data.curvePublic);
            if (friend) { return void cb({error: 'ALREADY_FRIEND'}); }
            if (!data.notifications || !data.curvePublic) { return void cb({error: 'INVALID_USER'}); }

            store.proxy.friends_pending = store.proxy.friends_pending || {};

            var p = store.proxy.friends_pending[data.curvePublic];
            if (p) {
                return void cb({error: 'ALREADY_SENT'});
            }

            store.proxy.friends_pending[data.curvePublic] = {
                time: +new Date(),
                channel: data.notifications,
                curvePublic: data.curvePublic
            };
            broadcast([], "UPDATE_METADATA");

            store.mailbox.sendTo('FRIEND_REQUEST', {
                user: Messaging.createData(store.proxy)
            }, {
                channel: data.notifications,
                curvePublic: data.curvePublic
            }, function (obj) {
                cb(obj);
            });
        };
        Store.cancelFriendRequest = function (data, cb) {
            if (!data.curvePublic || !data.notifications) {
                return void cb({error: 'EINVAL'});
            }

            var proxy = store.proxy;
            var f = Messaging.getFriend(proxy, data.curvePublic);

            if (f) {
                // Already friend
                console.error("You can't cancel an accepted friend request");
                return void cb({error: 'ALREADY_FRIEND'});
            }

            var pending = Util.find(store, ['proxy', 'friends_pending']) || {};
            if (!pending) { return void cb(); }

            store.mailbox.sendTo('CANCEL_FRIEND_REQUEST', {
                user: Messaging.createData(store.proxy)
            }, {
                channel: data.notifications,
                curvePublic: data.curvePublic
            }, function (obj) {
                if (obj && obj.error) { return void cb(obj); }
                delete store.proxy.friends_pending[data.curvePublic];
                broadcast([], "UPDATE_METADATA");
                onSync(null, function () {
                    cb(obj);
                });
            });
        };

        Store.anonGetPreviewContent = function (clientId, data, cb) {
            Team.anonGetPreviewContent({
                store: store
            }, data, cb);
        };

        // Get hashes for the share button
        // If we can find a stronger hash
        Store.getStrongerHash = function (clientId, data, _cb) {
            var cb = Util.once(_cb);

            var found = getAllStores().some(function (s) {
                var stronger = s.manager.getEditHash(data.channel);
                if (stronger) {
                    cb(stronger);
                    return true;
                }
            });
            if (!found) { cb(); }
        };

        // Universal
        Store.universal = {
            execCommand: function (clientId, obj, cb) {
                var todo = function () {
                    var type = obj.type;
                    var data = obj.data;
                    if (store.modules[type]) {
                        store.modules[type].execCommand(clientId, data, cb);
                    } else {
                        return void cb({error: type + ' is disabled'});
                    }
                };
                // Teams support offline/cache mode
                if (['team', 'calendar'].indexOf(obj.type) !== -1) { return void todo(); }
                // If we're in "noDrive" mode
                if (!store.proxy) { return void todo(); }
                // Other modules should wait for the ready event
                onReadyEvt.reg(todo);
            }
        };
        var loadUniversal = function (Module, type, waitFor, clientId) {
            if (store.modules[type]) { return; }
            store.modules[type] = Module.init({
                Store: Store,
                store: store,
                updateLoadingProgress: function (data) {
                    data.type = "team";
                    postMessage(clientId, 'LOADING_DRIVE', data);
                },
                updateMetadata: function () {
                    broadcast([], "UPDATE_METADATA");
                },
                pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
                unpinPads: function (data, cb) { Store.unpinPads(null, data, cb); },
            }, waitFor, function (ev, data, clients) {
                clients.forEach(function (cId) {
                    postMessage(cId, 'UNIVERSAL_EVENT', {
                        type: type,
                        data: {
                            ev: ev,
                            data: data
                        }
                    });
                });
            });
        };

        // OnlyOffice
        Store.onlyoffice = {
            execCommand: function (clientId, data, cb) {
                if (!store.onlyoffice) { return void cb({error: 'OnlyOffice is disabled'}); }
                store.onlyoffice.execCommand(clientId, data, cb);
            }
        };

        // Mailbox
        Store.mailbox = {
            execCommand: function (clientId, data, cb) {
                // The mailbox can only be used when the store is ready
                onReadyEvt.reg(function () {
                    if (!store.mailbox) { return void cb ({error: 'Mailbox is disabled'}); }
                    store.mailbox.execCommand(clientId, data, cb);
                });
            }
        };

        // Admin
        Store.adminRpc = function (clientId, data, cb) {
            store.rpc.adminRpc(data, function (err, res) {
                if (err) { return void cb({error: err}); }
                cb(res);
            });
        };
        Store.addAdminMailbox = function (clientId, data, cb) {
            var priv = data && data.priv;
            var pub = Hash.getBoxPublicFromSecret(priv);
            var isNewSupport = data && data.version === 2;
            if (!priv || !pub) { return void cb({error: 'EINVAL'}); }
            var channel = Hash.getChannelIdFromKey(pub);
            var mailboxes = store.proxy.mailboxes = store.proxy.mailboxes || {};
            var key = isNewSupport ? 'supportteam' : 'supportadmin';
            var box = mailboxes[key] = {
                channel: channel,
                viewed: [],
                lastKnownHash: data.lastKnownHash || '',
                keys: {
                    curvePublic: pub,
                    curvePrivate: priv
                }
            };
            Store.pinPads(null, [channel], function () {});
            store.mailbox.open(key, box, function () {
                console.log('ready');
            });
            onSync(null, cb);
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// PAD //////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        var channels = Store.channels = store.channels = {};

        Store.getSnapshot = function (clientId, data, cb) {
            Store.getHistoryRange(clientId, {
                cpCount: 1,
                channel: data.channel,
                lastKnownHash: data.hash
            }, cb);
        };

        var getVersionHash = function (clientId, data) {
            var validateKey;
            var fakeNetflux = Hash.createChannelId();
            nThen(function (waitFor) {
                Store.getPadMetadata(null, {
                    channel: data.channel
                }, waitFor(function (md) {
                    if (md && md.rejected) {
                        postMessage(clientId, "PAD_ERROR", {type: "ERESTRICTED"});
                        waitFor.abort();
                        return;
                    }
                    validateKey = md.validateKey;
                }));
            }).nThen(function () {
                Store.getHistoryRange(clientId, {
                    cpCount: 1,
                    channel: data.channel,
                    lastKnownHash: data.versionHash
                }, function (obj) {
                    if (obj && obj.error) {
                        postMessage(clientId, "PAD_ERROR", obj.error);
                        return;
                    }
                    var msgs = obj.messages || [];
                    if (msgs.length && msgs[msgs.length - 1].serverHash !== data.versionHash) {
                        postMessage(clientId, "PAD_ERROR", {type: "HASH_NOT_FOUND"});
                        return;
                    }
                    postMessage(clientId, "PAD_CONNECT", {
                        myID: fakeNetflux,
                        id: data.channel,
                        members: [fakeNetflux]
                    });
                    (obj.messages || []).forEach(function (data) {
                        postMessage(clientId, "PAD_MESSAGE", {
                            msg: data.msg,
                            time: data.time,
                            user: fakeNetflux.slice(0,16), // fake history keeper to avoid validate
                        });
                    });
                    if (validateKey && store.messenger) {
                        store.messenger.storeValidateKey(data.channel, validateKey);
                    }
                    postMessage(clientId, "PAD_READY");
                });
            });
        };

        Store.onRejected = function (allowed, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            if (!Array.isArray(allowed)) { return void cb('ERESTRICTED'); }

            onPadRejectedEvt.fire();
            onReadyEvt.reg(() => {
                // There is an allow list: check if we can authenticate
                if (!store.loggedIn || !store.proxy.edPublic) { return void cb('ERESTRICTED'); }

                var teamModule = store.modules['team'];
                var teams = (teamModule && teamModule.getTeams()) || [];
                var _store;

                if (allowed.indexOf(store.proxy.edPublic) !== -1) {
                    // We are allowed: use our own rpc
                    _store = store;
                } else if (teams.some(function (teamId) {
                    // We're not allowed: check our teams
                    var ed = Util.find(store, ['proxy', 'teams', teamId, 'keys', 'drive', 'edPublic']);
                    var edPrivate = Util.find(store, ['proxy', 'teams', teamId, 'keys', 'drive', 'edPrivate']);
                    if (allowed.indexOf(ed) === -1) { return false; }
                    if (!edPrivate) { return false; } // FIXME: Only editors can authenticate...
                    // This team is allowed: use its rpc
                    var t = teamModule.getTeam(teamId);
                    _store = t;
                    return true;
                })) {}

                var auth = function () {
                    if (!_store) { return void cb('ERESTRICTED'); }
                    var rpc = _store.rpc;
                    if (!rpc) { return void cb('ERESTRICTED'); }
                    rpc.send('COOKIE', '', function (err) {
                        cb(err);
                    });
                };

                // Wait for the RPC we need to be ready and then tyr to authenticate
                if (_store && _store.onRpcReadyEvt) {
                    _store.onRpcReadyEvt.reg(function () {
                        auth();
                    });
                    return;
                }

                // Fall back to the old system in case onRpcReadyEvt doesn't exist (shouldn't happen)
                auth();
            });
        };

        Store.joinPad = function (clientId, data) {
            if (data.versionHash) {
                return void getVersionHash(clientId, data);
            }
            if (!Hash.isValidChannel(data.channel)) {
                return void postMessage(clientId, "PAD_ERROR", 'INVALID_CHAN');
            }
            var isNew = typeof channels[data.channel] === "undefined";
            var channel = channels[data.channel] = channels[data.channel] || {
                queue: [],
                data: {},
                clients: [],
                bcast: function (cmd, data, notMe) {
                    channel.clients.forEach(function (cId) {
                        if (cId === notMe) { return; }
                        postMessage(cId, cmd, data);
                    });
                },
                history: [],
                pushHistory: function (msg, isCp) {
                    if (isCp) {
                        // the current message is a checkpoint.
                        // push it to your worker's history, prepending it with cp|
                        // cp| and anything else related to checkpoints has already
                        // been stripped by chainpad-netflux-worker or within async store
                        // when the message was outgoing.
                        channel.history.push('cp|' + msg);
                        // since the latest message is a checkpoint, we are able to drop
                        // some of the older history, but we can't rely on checkpoints being
                        // correct, as they might be checkpoints from different forks
                        var i;
                        for (i = channel.history.length - 101; i > 0; i--) {
                            if (/^cp\|/.test(channel.history[i])) { break; }
                        }
                        channel.history = channel.history.slice(Math.max(i, 0));
                        return;
                    }
                    channel.history.push(msg);
                }
            };
            if (channel.clients.indexOf(clientId) === -1) {
                channel.clients.push(clientId);
            }

            if (!isNew && channel.wc) {
                postMessage(clientId, "PAD_CONNECT", {
                    myID: channel.wc.myID,
                    id: channel.wc.id,
                    members: channel.wc.members
                });
                channel.wc.members.forEach(function (m) {
                    postMessage(clientId, "PAD_JOIN", m);
                });
                channel.history.forEach(function (msg) {
                    postMessage(clientId, "PAD_MESSAGE", {
                        msg: CpNetflux.removeCp(msg),
                        user: channel.wc.myID,
                        validateKey: channel.data.validateKey
                    });
                });
                postMessage(clientId, "PAD_READY");

                return;
            }
            var onError = function (err) {
                // If it's a deletion started from this worker, different UI message
                if (err && err.type === "EDELETED" && myDeletions[data.channel]) {
                    delete myDeletions[channel];
                    err.ownDeletion = true;
                }
                channel.bcast("PAD_ERROR", err);

                if (err && err.type === "EDELETED" && Cache && Cache.clearChannel) {
                    Cache.clearChannel(data.channel);
                }

                // If this is a DELETED, EXPIRED or RESTRICTED pad, leave the channel
                if (["EDELETED", "EEXPIRED", "ERESTRICTED"].indexOf(err.type) === -1) { return; }
                Store.leavePad(null, data, function () {});
            };
            var conf = {
                Cache: store.neverCache ? undefined : Cache,
                priority: 1,
                onCacheStart: function () {
                    postMessage(clientId, "PAD_CACHE");
                },
                onCacheReady: function () {
                    postMessage(clientId, "PAD_CACHE_READY");
                },
                onReady: function (pad) {
                    var padData = pad.metadata || {};
                    channel.data = padData;
                    if (padData && padData.validateKey && store.messenger) {
                        store.messenger.storeValidateKey(data.channel, padData.validateKey);
                    }
                    postMessage(clientId, "PAD_READY", pad.noCache);
                    /*
                    if (!store.proxy) {
                        postMessage(clientId, "PAD_READY", pad.noCache);
                        return;
                    }
                    onReadyEvt.reg(function () {
                        postMessage(clientId, "PAD_READY", pad.noCache);
                    });
                    */
                },
                onMessage: function (m, user, validateKey, isCp, hash) {
                    channel.lastHash = hash;
                    channel.pushHistory(m, isCp);
                    channel.bcast("PAD_MESSAGE", {
                        user: user,
                        msg: m,
                        validateKey: validateKey
                    });
                },
                onJoin: function (m) {
                    channel.bcast("PAD_JOIN", m);
                },
                onLeave: function (m) {
                    channel.bcast("PAD_LEAVE", m);
                },
                onError: onError,
                onChannelError: onError,
                onRejected: Store.onRejected,
                onConnectionChange: function (info) {
                    if (!info.state) {
                        channel.bcast("PAD_DISCONNECT");
                    }
                },
                onMetadataUpdate: function (metadata) {
                    channel.data = metadata || {};
                    getAllStores().forEach(function (s) {
                        var allData = s.manager.findChannel(data.channel, true);
                        allData.forEach(function (obj) {
                            obj.data.owners = metadata.owners;
                            obj.data.atime = +new Date();
                            if (metadata.expire) {
                                obj.data.expire = +metadata.expire;
                            }
                        });
                        var send = s.sendEvent || sendDriveEvent;
                        send('DRIVE_CHANGE', {
                            path: ['drive', UserObject.FILES_DATA]
                        });
                    });
                    channel.bcast("PAD_METADATA", metadata);
                },
                crypto: {
                    // The encryption and decryption is done in the outer window.
                    // This async-store only deals with already encrypted messages.
                    encrypt: function (m) { return m; },
                    decrypt: function (m) { return m; }
                },
                noChainPad: true,
                channel: data.channel,
                metadata: data.metadata,
                network: store.network || store.networkPromise,
                websocketURL: NetConfig.getWebsocketURL(),
                onInit: function () {
                    onJoinedEvt.fire();
                },
                //readOnly: data.readOnly,
                onConnect: function (wc, sendMessage) {
                    channel.sendMessage = function (msg, cId, cb) {
                        // Send to server
                        sendMessage(msg, function (err) {
                            if (err) {
                                return void cb({ error: err });
                            }
                            // Broadcast to other tabs
                            channel.lastHash = msg.slice(0,64);
                            channel.pushHistory(CpNetflux.removeCp(msg), /^cp\|/.test(msg));
                            channel.bcast("PAD_MESSAGE", {
                                user: wc.myID,
                                msg: CpNetflux.removeCp(msg),
                                validateKey: channel.data.validateKey
                            }, cId);
                            cb();
                        });
                    };
                    channel.wc = wc;
                    channel.queue.forEach(function (data) {
                        channel.sendMessage(data.message, clientId);
                    });
                    channel.queue = [];
                    channel.bcast("PAD_CONNECT", {
                        myID: wc.myID,
                        id: wc.id,
                        members: wc.members
                    });
                }
            };
            channel.cpNf = CpNetflux.start(conf);
        };
        Store.leavePad = function (clientId, data, cb) {
            var channel = channels[data.channel];
            if (!channel || !channel.cpNf) { return void cb ({error: 'EINVAL'}); }
            Store.dropChannel(data.channel);
            cb();
        };
        Store.sendPadMsg = function (clientId, data, cb) {
            var msg = data.msg;
            var channel = channels[data.channel];
            if (!channel) {
                return; }
            if (!channel.wc) {
                channel.queue.push(msg);
                return void cb();
            }
            channel.sendMessage(msg, clientId, cb);
        };

        Store.corruptedCache = function (clientId, channel) {
            var chan = channels[channel];
            if (!chan || !chan.cpNf) { return; }
            Cache.clearChannel(channel);
            if (!chan.cpNf.resetCache) { return; }
            chan.cpNf.resetCache();
        };

        // Unpin and pin the new channel in all team when changing a pad password
        Store.changePadPasswordPin = function (clientId, data, cb) {
            var oldChannel = data.oldChannel;
            var channel = data.channel;
            nThen(function (waitFor) {
                getAllStores().forEach(function (s) {
                    var allData = s.manager.findChannel(channel);
                    if (!allData.length) { return; }
                    s.rpc.unpin([oldChannel], waitFor());
                    s.rpc.pin([channel], waitFor());
                });
            }).nThen(cb);
        };

        // contactPadOwner is used to send "REQUEST_ACCESS" messages
        // and to notify form owners when sending a response
        Store.contactPadOwner = function (clientId, data, cb) {
            var owners = data.owners;

            // If send is true, send the request to the owner.
            if (!Array.isArray(owners) || !owners.length) { return cb({state: false}); }

            if (!data.send) { return void cb({state: true}); }

            nThen(function (waitFor) {
                owners.forEach(function (owner) {
                    var sendTo = function (query, msg, user, _cb) {
                        if (store.mailbox && !data.anon) {
                            return store.mailbox.sendTo(query, msg, user, _cb);
                        }
                        Mailbox.sendToAnon(store.anon_rpc, query, msg, user, _cb);
                    };
                    sendTo(data.query, {
                        channel: data.channel,
                        data: data.msgData
                    }, {
                        channel: owner.notifications,
                        curvePublic: owner.curvePublic
                    }, waitFor());
                });
            }).nThen(function () {
                cb({state: true});
            });
        };
        Store.givePadAccess = function (clientId, data, cb) {
            var edPublic = store.proxy.edPublic;
            var channel = data.channel;
            var res = store.manager.findChannel(channel);

            if (!data.user || !data.user.notifications || !data.user.curvePublic) {
                return void cb({error: 'EINVAL'});
            }

            var href, title;

            if (!res.some(function (obj) {
                if (obj.data &&
                    Array.isArray(obj.data.owners) && obj.data.owners.indexOf(edPublic) !== -1 &&
                    obj.data.href) {
                        href = obj.data.href;
                        title = obj.data.title;
                        return true;
                }
            })) { return void cb({error: 'ENOTFOUND'}); }

            store.mailbox.sendTo("GIVE_PAD_ACCESS", {
                channel: channel,
                href: href,
                title: title
            }, {
                channel: data.user.notifications,
                curvePublic: data.user.curvePublic
            });
            cb();
        };

        Store.getLastHash = function (clientId, data, cb) {
            var chan = channels[data.channel];
            if (!chan) { return void cb({error: 'ENOCHAN'}); }
            if (!chan.lastHash) { return void cb({error: 'EINVAL'}); }
            cb({
                hash: chan.lastHash
            });
        };

        // Delete a pad received with a burn after reading URL

        var notifyOwnerPadRemoved = function (data, obj) {
            var channel = data.channel;
            var href = data.href;
            var parsed = Hash.parsePadUrl(href);
            var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
            if (obj && obj.error) { return; }
            if (!obj.mailbox) { return; }

            // Decrypt the mailbox
            var crypto = Crypto.createEncryptor(secret.keys);
            var m = [];
            try {
                if (typeof (obj.mailbox) === "string") {
                    m.push(crypto.decrypt(obj.mailbox, true, true));
                } else {
                    Object.keys(obj.mailbox).forEach(function (k) {
                        m.push(crypto.decrypt(obj.mailbox[k], true, true));
                    });
                }
            } catch (e) {
                console.error(e);
            }

            // Tell all the owners that the pad was deleted from the server
            var curvePublic;
            try {
                // users in noDrive mode don't have a proxy and
                // unregistered users don't have a curvePublic
                curvePublic = store.proxy.curvePublic;
            } catch (err) {
                console.error(err);
                return;
            }
            m.forEach(function (obj) {
                var mb = JSON.parse(obj);
                if (mb.curvePublic === curvePublic) { return; }
                store.mailbox.sendTo('OWNED_PAD_REMOVED', {
                    channel: channel
                }, {
                    channel: mb.notifications,
                    curvePublic: mb.curvePublic
                }, function () {});
            });
        };

        Store.burnPad = function (clientId, data) {
            var channel = data.channel;
            var ownerKey = Crypto.b64AddSlashes(data.ownerKey || '');
            if (!channel || !ownerKey) { return void console.error("Can't delete BAR pad"); }
            try {
                var signKey = Hash.decodeBase64(ownerKey);
                var pair = Crypto.Nacl.sign.keyPair.fromSecretKey(signKey);
                Pinpad.create(store.network, {
                    edPublic: Hash.encodeBase64(pair.publicKey),
                    edPrivate: Hash.encodeBase64(pair.secretKey)
                }, function (e, rpc) {
                    if (e) { return void console.error(e); }
                    Store.getPadMetadata(null, {
                        channel: channel
                    }, function (md) {
                        rpc.removeOwnedChannel(channel, function (err) {
                            if (err) { return void console.error(err); }
                            // Notify owners that the pad was removed
                            notifyOwnerPadRemoved(data, md);
                        });
                    });
                });
            } catch (e) {
                console.error(e);
            }
        };

        // Fetch the latest version of the metadata on the server and return it.
        // If the pad is stored in our drive, update the local values of "owners" and "expire"
        Store.getPadMetadata = function (clientId, data, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));

            if (store.offline || !store.anon_rpc) { return void cb({ error: 'OFFLINE' }); }
            if (!data.channel) { return void cb({ error: 'ENOTFOUND'}); }
            if (data.channel.length !== 32) { return void cb({ error: 'EINVAL'}); }
            if (!Hash.isValidChannel(data.channel)) {
                Feedback.send('METADATA_INVALID_CHAN');
                return void cb({ error: 'EINVAL' });
            }
            store.anon_rpc.send('GET_METADATA', data.channel, function (err, obj) {
                if (err) { return void cb({error: err}); }
                var metadata = (obj && obj[0]) || {};
                cb(metadata);

                // If you don't have access to the metadata, stop here
                // (we can't update the local data)
                if (metadata.rejected) { return; }

                // Update owners and expire time in the drive
                getAllStores().forEach(function (s) {
                    var allData = s.manager.findChannel(data.channel, true);
                    var changed = false;
                    allData.forEach(function (obj) {
                        if (Sortify(obj.data.owners) !== Sortify(metadata.owners)) {
                            changed = true;
                        }
                        obj.data.owners = metadata.owners;
                        obj.data.atime = +new Date();
                        if (metadata.expire) {
                            obj.data.expire = +metadata.expire;
                        }
                    });
                    // If we had to change the "owners" field, redraw the drive UI
                    if (!changed) { return; }
                    var send = s.sendEvent || sendDriveEvent;
                    send('DRIVE_CHANGE', {
                        path: ['drive', UserObject.FILES_DATA]
                    });
                });
            });
        };
        Store.setPadMetadata = function (clientId, data, cb) {
            if (!data.channel) { return void cb({ error: 'ENOTFOUND'}); }
            if (!data.command) { return void cb({ error: 'EINVAL' }); }
            var s = getStore(data.teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }

            var otherChannels = data.channels;
            delete data.channels;
            s.rpc.setMetadata(data, function (err, res) {
                if (err) { return void cb({ error: err }); }
                if (!Array.isArray(res) || !res.length) { return void cb({}); }
                cb(res[0]);
            });
            // If we have other related channels, send the command for them too
            if (Array.isArray(otherChannels)) {
                otherChannels.forEach(function (chan) {
                    var _d = Util.clone(data);
                    _d.channel = chan;
                    Store.setPadMetadata(clientId, _d, function () {

                    });
                });
            }
        };

        Store.deleteMailboxMessage = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.anon_rpc.send('DELETE_MAILBOX_MESSAGE', data, function (e) {
                cb({error:e});
            });
        };

        // GET_FULL_HISTORY from sframe-common-outer
        Store.getFullHistory = function (clientId, data, cb) {
            var network = store.network;
            var hk = network.historyKeeper;
            //var crypto = Crypto.createEncryptor(data.keys);
            // Get the history messages and send them to the iframe
            var parse = function (msg) {
                try {
                    return JSON.parse(msg);
                } catch (e) {
                    return null;
                }
            };
            var msgs = [];
            var completed = false;
            var onMsg = function (msg) {
                if (completed) { return; }
                var parsed = parse(msg);
                if (!parsed) { return; }
                if (parsed[0] === 'FULL_HISTORY_END') {
                    cb(msgs);
                    network.off('message', onMsg);
                    completed = true;
                    return;
                }
                if (parsed[0] !== 'FULL_HISTORY') { return; }
                if (parsed[1] && parsed[1].validateKey) { // First message
                    return;
                }
                if (parsed[1][3] !== data.channel) { return; }
                msg = parsed[1][4];
                if (msg) {
                    msg = msg.replace(/cp\|(([A-Za-z0-9+\/=]+)\|)?/, '');
                    //var decryptedMsg = crypto.decrypt(msg, true);
                    if (data.debug) {
                        msgs.push({
                            serverHash: msg.slice(0,64),
                            msg: msg,
                            author: parsed[1][1],
                            time: parsed[1][5]
                        });
                    } else {
                        msgs.push(msg);
                    }
                }
            };
            network.on('message', onMsg);
            network.sendto(hk, JSON.stringify(['GET_FULL_HISTORY', data.channel, data.validateKey]));
        };

        Store.getHistory = function (clientId, data, _cb, full) {
            var cb = Util.once(Util.mkAsync(_cb));

            var network = store.network;
            var hk = network.historyKeeper;

            var parse = function (msg) {
                try {
                    return JSON.parse(msg);
                } catch (e) {
                    return null;
                }
            };

            var txid = Math.floor(Math.random() * 1000000);

            var msgs = [];
            var completed = false;
            var onMsg = function (msg, sender) {
                if (completed) { return; }
                if (sender !== hk) { return; }
                var parsed = parse(msg);
                if (!parsed) { return; }

                if (parsed.txid && parsed.txid !== txid) { return; }

                // Ignore the metadata message
                if (parsed.validateKey && parsed.channel) { return; }
                if (parsed.error && parsed.channel) {
                    if (parsed.channel === data.channel) {
                        network.off('message', onMsg);
                        completed = true;
                        cb({error: parsed.error});
                    }
                    return;
                }

                // End of history: cb
                if (parsed.state === 1 && parsed.channel) {
                    if (parsed.channel !== data.channel) { return; }
                    cb(msgs);
                    network.off('message', onMsg);
                    completed = true;
                    return;
                }

                if (Array.isArray(parsed) && parsed[0] && parsed[0] !== txid) { return; }

                // Keep only the history for our channel
                if (parsed[3] !== data.channel) { return; }
                // If we want the full messages, push the parsed data
                if (parsed[4] && full) {
                    msgs.push({
                        msg: msg,
                        hash: parsed[4].slice(0,64)
                    });
                    return;
                }
                // Otherwise, push the messages
                msg = parsed[4];
                if (msg) {
                    msg = msg.replace(/cp\|(([A-Za-z0-9+\/=]+)\|)?/, '');
                    msgs.push(msg);
                }
            };
            network.on('message', onMsg);

            var cfg = {
                txid: txid,
                lastKnownHash: data.lastKnownHash
            };
            var msg = ['GET_HISTORY', data.channel, cfg];
            network.sendto(hk, JSON.stringify(msg));
        };

        Store.getHistoryRange = function (clientId, data, cb) {
            var network = store.network;
            var hk = network.historyKeeper;
            var parse = function (msg) {
                try {
                    return JSON.parse(msg);
                } catch (e) {
                    return null;
                }
            };
            var msgs = [];
            var first = true;
            var fullHistory = false;
            var completed = false;
            var lastKnownHash;
            var txid = Util.uid();

            var onMsg = function (msg) {
                if (completed) { return; }
                var parsed = parse(msg);
                if (parsed[1] !== txid) { console.log('bad txid'); return; }
                if (parsed[0] === 'HISTORY_RANGE_ERROR') {
                    let err = parsed[2];
                    if (err?.code === 'ENOENT') {
                        completed = true;
                        return void cb({
                            messages: msgs,
                            isFull: true
                        });
                    }
                    return void cb({
                        error: parsed[2]
                    });
                }
                if (parsed[0] === 'HISTORY_RANGE_END') {
                    cb({
                        messages: msgs,
                        isFull: fullHistory,
                        lastKnownHash: lastKnownHash
                    });
                    completed = true;
                    return;
                }
                if (parsed[0] !== 'HISTORY_RANGE') { return; }
                if (parsed[2] && parsed[1].validateKey) { // Metadata
                    return;
                }
                if (parsed[2][3] !== data.channel) { return; }
                msg = parsed[2][4];
                if (msg) {
                    if (first) {
                        // If the first message if not a checkpoint, it means it is the first
                        // message of the pad, so we have the full history!
                        if (!/^cp\|/.test(msg) && !data.toHash) { fullHistory = true; }
                        lastKnownHash = msg.slice(0,64);
                        first = false;
                    }
                    msg = msg.replace(/cp\|(([A-Za-z0-9+\/=]+)\|)?/, '');
                    msgs.push({
                        serverHash: msg.slice(0,64),
                        msg: msg,
                        author: parsed[2][1],
                        time: parsed[2][5]
                    });
                }
            };

            network.on('message', onMsg);
            network.sendto(hk, JSON.stringify(['GET_HISTORY_RANGE', data.channel, {
                from: data.lastKnownHash,
                to: data.toHash,
                cpCount: data.cpCount || 2, // Ignored if "to" is provided
                txid: txid
            }]));
        };

        // Special events
        var registerProxyEvents = function (proxy, fId) {
            if (!proxy) { return; }
            if (proxy.deprecated || proxy.restricted) { return; }
            if (!fId) {
                // Listen for shared folder password change
                proxy.on('change', ['drive', UserObject.SHARED_FOLDERS], function (o, n, p) {
                    if (p.length > 3 && p[3] === 'password') {
                        var id = p[2];
                        var data = proxy.drive[UserObject.SHARED_FOLDERS][id];
                        var href = store.manager.user.userObject.getHref ?
                                store.manager.user.userObject.getHref(data) : data.href;
                        var parsed = Hash.parsePadUrl(href);
                        var secret = Hash.getSecrets(parsed.type, parsed.hash, o);
                        SF.updatePassword(Store, {
                            oldChannel: secret.channel,
                            password: n,
                            href: href
                        }, store.network, function () {
                            console.log('Shared folder password changed');
                        });
                        return false;
                    }
                });
            }
            proxy.on('change', [], function (o, n, p) {
                if (fId) {
                    // Pin the new pads
                    if (p[0] === UserObject.FILES_DATA && typeof(n) === "object" && n.channel && !n.owners) {
                        var toPin = [n.channel];
                        // Also pin the onlyoffice channels if they exist
                        if (n.rtChannel) { toPin.push(n.rtChannel); }
                        if (n.lastVersion) { toPin.push(n.lastVersion); }
                        Store.pinPads(null, toPin, function (obj) { console.error(obj); });
                    }
                    // Unpin the deleted pads (deleted <=> changed to undefined)
                    if (p[0] === UserObject.FILES_DATA && typeof(o) === "object" && o.channel && !n) {
                        var toUnpin = [o.channel];
                        var c = store.manager.findChannel(o.channel);
                        var exists = c.some(function (data) {
                            return data.fId !== fId;
                        });
                        if (!exists) { // Unpin
                            // Also unpin the onlyoffice channels if they exist
                            if (o.rtChannel) { toUnpin.push(o.rtChannel); }
                            if (o.lastVersion) { toUnpin.push(o.lastVersion); }
                            Store.unpinPads(null, toUnpin, function (obj) { console.error(obj); });
                        }
                    }
                }
                if (o && !n && Array.isArray(p) && (p[0] === UserObject.FILES_DATA ||
                    (p[0] === 'drive' && p[1] === UserObject.FILES_DATA))) {
                    setTimeout(function () {
                        Store.checkDeletedPad(o && o.channel);
                    });
                }
                sendDriveEvent('DRIVE_CHANGE', {
                    id: fId,
                    old: o,
                    new: n,
                    path: p
                });
            });
            proxy.on('remove', [], function (o, p) {
                sendDriveEvent('DRIVE_REMOVE', {
                    id: fId,
                    old: o,
                    path: p
                });
            });
        };

        // SHARED FOLDERS
        var addSharedFolderHandler = function () {
            store.sharedFolders = {};
            store.handleSharedFolder = function (id, rt) {
                if (!rt) {
                    delete store.sharedFolders[id];
                    return;
                }
                store.sharedFolders[id] = rt;
                if (store.driveEvents) {
                    registerProxyEvents(rt.proxy, id);
                }
            };
        };
        Store.loadSharedFolder = function (teamId, id, data, cb, isNew) {
            var s = getStore(teamId);
            if (!s) { return void cb({ error: 'ENOTFOUND' }); }
            var parsed = Hash.parsePadUrl(data.href || data.roHref);
            if (!parsed && !parsed.hashData) { return void cb({error: 'EINVAL'}); }
            SF.load({
                isNew: isNew,
                network: store.network || store.networkPromise,
                store: s,
                Store: Store,
                isNewChannel: Store.isNewChannel
            }, id, data, cb);
        };
        var loadSharedFolder = function (id, data, cb, isNew) {
            Store.loadSharedFolder(null, id, data, cb, isNew);
        };
        Store.loadSharedFolderAnon = function (clientId, data, cb) {
            Store.loadSharedFolder(null, data.id, data.data, function (rt) {
                cb({
                    error: rt ? undefined : 'EDELETED'
                });
            });
        };
        Store.addSharedFolder = function (clientId, data, cb) {
            onReadyEvt.reg(function () {
                var s = getStore(data.teamId);
                s.manager.addSharedFolder(data, function (id) {
                    if (id && typeof(id) === "object" && id.error) {
                        return void cb(id);
                    }
                    var send = data.teamId ? s.sendEvent : sendDriveEvent;
                    send('DRIVE_CHANGE', {
                        path: ['drive', UserObject.FILES_DATA]
                    }, clientId);
                    cb(id);
                });
            });
        };
        Store.updateSharedFolderPassword = function (clientId, data, cb) {
            SF.updatePassword(Store, data, store.network, cb);
        };

        // Drive
        Store.userObjectCommand = function (clientId, cmdData, cb) {
            if (!cmdData || !cmdData.cmd) { return; }
            //var data = cmdData.data;
            var s = getStore(cmdData.teamId);
            if (s.offline) {
                var send = s.id ? s.sendEvent : sendDriveEvent;
                send('NETWORK_DISCONNECT');
                return void cb({ error: 'OFFLINE' });
            }
            var cb2 = function (data2) {
                // Send the CHANGE event to all the stores because the command may have
                // affected data from a shared folder used by multiple teams.
                getAllStores().forEach(function (_s) {
                    var send = _s.id ? _s.sendEvent : sendDriveEvent;
                    send('DRIVE_CHANGE', {
                        path: ['drive', UserObject.FILES_DATA]
                    }, clientId);
                });
                onSync(cmdData.teamId, function () {
                    cb(data2);
                });
            };
            s.manager.command(cmdData, cb2);
        };


        // Check if this is a channel that we shouldn't leave when closing the debug app
        var alwaysOnline = function (chanId) {
            if (!store) { return; }
            // Drive
            if (store.driveChannel === chanId) { return true; }
            // Shared folders
            if (SF.isSharedFolderChannel(chanId)) { return true; }
            // Teams
            if (Util.find(store, ['proxy', 'teams'])) {
                var t = Util.find(store, ['proxy', 'teams']) || {};
                return Object.keys(t).some(function (id) {
                    return t[id].channel === chanId;
                });
            }
            // Profile
            if (Util.find(store, ['proxy', 'profile', 'href'])) {
                return Hash.hrefToHexChannelId(Util.find(store, ['proxy', 'profile', 'href']))
                        === chanId;
            }
        };

        var dropChannel = Store.dropChannel = function (chanId) {
            console.error('Drop channel', chanId);

            try {
                store.messenger.leavePad(chanId);
            } catch (e) { console.error(e); }
            try {
                store.modules['cursor'].leavePad(chanId);
            } catch (e) { console.error(e); }
            try {
                store.modules['integration'].leavePad(chanId);
            } catch (e) { console.error(e); }
            try {
                store.onlyoffice.leavePad(chanId);
            } catch (e) { console.error(e); }

            try {
                if (alwaysOnline(chanId)) {
                    delete Store.channels[chanId];
                    return;
                }
            } catch (e) { console.error(e); }

            try {
                Cache.leaveChannel(chanId);
            } catch (e) { console.error(e); }

            if (!Store.channels[chanId]) { return; }

            if (Store.channels[chanId].cpNf) {
                Store.channels[chanId].cpNf.stop();
            }

            delete Store.channels[chanId];
        };
        Store._removeClient = function (clientId) {
            var driveIdx = driveEventClients.indexOf(clientId);
            if (driveIdx !== -1) {
                driveEventClients.splice(driveIdx, 1);
            }
            try {
                store.onlyoffice?.removeClient(clientId);
            } catch (e) { console.error(e); }
            try {
                store.mailbox?.removeClient(clientId);
            } catch (e) { console.error(e); }
            Object.keys(store.modules).forEach(function (key) {
                if (!store.modules[key]) { return; }
                if (!store.modules[key].removeClient) { return; }
                try {
                    store.modules[key].removeClient(clientId);
                } catch (e) { console.error(e); }
            });

            Object.keys(Store.channels).forEach(function (chanId) {
                var chanIdx = Store.channels[chanId].clients.indexOf(clientId);
                if (chanIdx !== -1) {
                    Store.channels[chanId].clients.splice(chanIdx, 1);
                }
                if (Store.channels[chanId].clients.length === 0) {
                    dropChannel(chanId);
                }
            });
        };




/*
        var loadProfile = function (waitFor) {
            store.profile = Profile.init({
                store: store,
                updateMetadata: function () {
                    broadcast([], "UPDATE_METADATA");
                },
                pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
            }, waitFor, function (ev, data, clients) {
                clients.forEach(function (cId) {
                    postMessage(cId, 'PROFILE_EVENT', {
                        ev: ev,
                        data: data
                    });
                });
            });
        };
*/
        var loadOnlyOffice = function () {
            if (store.onlyoffice) { return; }
            store.onlyoffice = OnlyOffice.init(store, function (ev, data, clients) {
                clients.forEach(function (cId) {
                    postMessage(cId, 'OO_EVENT', {
                        ev: ev,
                        data: data
                    });
                });
            });
        };

        var loadMailbox = function (waitFor) {
            store.mailbox = Mailbox.init({
                Store: Store,
                store: store,
                updateMetadata: function () {
                    broadcast([], "UPDATE_METADATA");
                },
                updateDrive: function () {
                    sendDriveEvent('DRIVE_CHANGE', {
                        path: ['drive', 'filesData']
                    });
                },
                pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
            }, waitFor, function (ev, data, clients, _cb) {
                var cb = Util.once(_cb || function () {});
                clients.forEach(function (cId) {
                    postMessage(cId, 'MAILBOX_EVENT', {
                        ev: ev,
                        data: data
                    }, cb);
                });
            });
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// Init /////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        Store.refreshDriveUI = function () {
            getAllStores().forEach(function (_s) {
                var send = _s.id ? _s.sendEvent : sendDriveEvent;
                send('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                });
            });
        };

        var onCacheReady = function (clientId, _cb) {
            const cb = Util.mkAsync(_cb);
            var proxy = store.proxy;
            var drive = store.drive;
            if (store.manager) { return void cb(); }
            var unpin = function (data, cb) {
                if (!store.loggedIn) { return void cb(); }
                Store.unpinPads(null, data, cb);
            };
            var pin = function (data, cb) {
                if (!store.loggedIn) { return void cb(); }
                Store.pinPads(null, data, cb);
            };
            var manager = store.manager = ProxyManager.create(drive.proxy, {
                onSync: function (cb) { onSync(null, cb); },
                edPublic: proxy.edPublic,
                pin: pin,
                unpin: unpin,
                loadSharedFolder: loadSharedFolder,
                settings: proxy.settings,
                removeOwnedChannel: function (channel, cb) {
                    Store.removeOwnedChannel('', channel, cb);
                },
                store: store,
                Store: Store
            }, {
                outer: true,
                edPublic: store.proxy.edPublic,
                loggedIn: store.loggedIn,
                log: function (msg) {
                    // broadcast to all drive apps
                    sendDriveEvent("DRIVE_LOG", msg);
                },
                rt: drive.realtime
            });
            var userObject = store.userObject = manager.user.userObject;
            nThen(function (waitFor) {
                addSharedFolderHandler();
                userObject.migrate(waitFor());
            }).nThen(function (waitFor) {
                var network = store.network || store.networkPromise;
                SF.loadSharedFolders(Store, network, store,
                    drive.proxy, userObject, waitFor, obj => {
                    var data = {
                        type: 'sf',
                        progress: 100*obj.progress/obj.max
                    };
                    postMessage(clientId, 'LOADING_DRIVE', data);
                }, true);
            }).nThen(function (waitFor) {
                loadUniversal(Team, 'team', waitFor, clientId);
            }).nThen(function (waitFor) {
                loadUniversal(Calendar, 'calendar', waitFor);
            }).nThen(function () {
                cb();
            });
        };

        // Modules that won't load anything from the server
        const loadSyncModules = (waitFor = function (){}) => {
            loadUniversal(Cursor, 'cursor', waitFor);
            loadUniversal(Integration, 'integration', waitFor);
            loadUniversal(Messenger, 'messenger', waitFor);
            loadUniversal(History, 'history', waitFor);
            loadUniversal(Badge, 'badge', waitFor);
            loadOnlyOffice();
            if (store) {
                store.messenger = store.modules['messenger'];
            }
        };

        const startCacheModules = (clientId, returned, _cb) => {
            const cb = Util.mkAsync(_cb);
            onCacheReady(clientId, function () {
                onCacheReadyEvt.fire();
                cb(returned);
            });
        };

        // onReady: called when the drive is synced (not using the cache anymore)
        // "cb" is wrapped in Util.once() and may have already been called
        // if we have a local cache
        var onReady = function (clientId, returned, cb) {
            store.ready = true;
            var proxy = store.proxy;
            var manager = store.manager;
            var userObject = store.userObject;

            nThen(function (waitFor) {
                if (!proxy.settings) { proxy.settings = NEW_USER_SETTINGS; }
                if (!proxy.forms) { proxy.forms = {}; }
                if (!proxy.friends_pending) { proxy.friends_pending = {}; }
                // Form seed is used to generate a box encryption keypair when
                // answering a form anonymously
                if (!proxy.form_seed) { proxy.form_seed = Hash.createChannelId(); }


                // Call onCacheReady if the manager is not yet defined
                if (!manager) {
                    startCacheModules(clientId, returned, waitFor());
                    manager = store.manager;
                    userObject = store.userObject;
                }

                // Initialize RPC in parallel of onCacheReady in case a shared folder
                // is RESTRICTED and requires RPC authentication
                initAnonRpc(null, null, waitFor());
                initRpc(null, null, waitFor());

                // Update loading progress
                postMessage(clientId, 'LOADING_DRIVE', {
                    type: 'migrate',
                    progress: 0
                });
            }).nThen(function (waitFor) {
                if (typeof(proxy.version) === "undefined") { proxy.version = 11; }
                Migrate(proxy, waitFor(), function (version, progress) {
                    postMessage(clientId, 'LOADING_DRIVE', {
                        type: 'migrate',
                        progress: progress
                    });
                }, store);
            }).nThen(function (waitFor) {
                postMessage(clientId, 'LOADING_DRIVE', {
                    type: 'sf',
                    progress: 0
                });
                userObject.fixFiles();
                SF.loadSharedFolders(Store, store.network, store,
                    store.drive.proxy, userObject, waitFor, obj => {
                    var data = {
                        type: 'sf',
                        progress: 100*obj.progress/obj.max
                    };
                    postMessage(clientId, 'LOADING_DRIVE', data);
                });
                loadSyncModules(waitFor);
                loadUniversal(Profile, 'profile', waitFor);
                loadUniversal(Calendar, 'calendar', waitFor);
                loadUniversal(Support, 'support', waitFor);
                nThen(waitFor => {
                    // Make teams non-blocking
                    if (store.modules['team']) { store.modules['team'].onReady(waitFor); }
                });
            }).nThen(function () {
                var requestLogin = function () {
                    broadcast([], "REQUEST_LOGIN");
                };

                if (store.loggedIn) {
                    arePinsSynced(function (err, yes) {
                        if (!yes) {
                            resetPins(function (err) {
                                if (err) { return console.error(err); }
                                console.log('RESET DONE');
                            });
                        }
                    });

                    /*  This isn't truly secure, since anyone who can read the user's object can
                        set their local loginToken to match that in the object. However, it exposes
                        a UI that will work most of the time. */

                    // every user object should have a persistent, random number
                    if (typeof(proxy.loginToken) !== 'number') {
                        proxy[Constants.tokenKey] = store.data.localToken ||
                                    Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                    }
                    returned[Constants.tokenKey] = proxy[Constants.tokenKey];

                    if (store.data.localToken && store.data.localToken !== proxy[Constants.tokenKey]) {
                        // the local number doesn't match that in
                        // the user object, request that they reauthenticate.
                        return void requestLogin();
                    }
                }

                returned.feedback = Util.find(proxy, ['settings', 'general', 'allowUserFeedback']);
                Feedback.init(returned.feedback);

                // "cb" may have already been called by onCacheReady
                store.returned = returned;
                if (typeof(cb) === 'function') { cb(returned); }

                store.offline = false;
                sendDriveEvent('NETWORK_RECONNECT'); // Tell inner that we're now online
                broadcast([], "UPDATE_METADATA");
                broadcast([], "STORE_READY", returned);

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
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['profile'], function () {
                    // Trigger userlist update when the avatar has changed
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['friends'], function (o, n, p) {
                    // Trigger userlist update when the friendlist has changed
                    broadcast([], "UPDATE_METADATA");

                    if (!store.messenger) { return; }
                    if (o !== undefined) { return; }
                    var curvePublic = p.slice(-1)[0];
                    var friend = proxy.friends && proxy.friends[curvePublic];
                    store.messenger.onFriendAdded(friend);
                });
                proxy.on('remove', ['friends'], function (o, p) {
                    broadcast([], "UPDATE_METADATA");

                    if (!store.messenger) { return; }
                    var curvePublic = p[1];
                    if (!curvePublic) { return; }
                    if (p[2] !== 'channel') { return; }
                    store.messenger.onFriendRemoved(curvePublic, o);
                });
                proxy.on('change', ['friends_pending'], function () {
                    // Trigger userlist update when the friendlist has changed
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('remove', ['friends_pending'], function () {
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['settings'], function () {
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', [Constants.tokenKey], function () {
                    if (store.isDeleted || proxy[Constants.tokenKey] === 'DELETED') { return; }
                    broadcast([], "UPDATE_TOKEN", { token: proxy[Constants.tokenKey] });
                });

                loadMailbox();

                onReadyEvt.fire();
            });
        };

        const loadAccount = (clientId, data, cacheCb, cb) => {
            if (store.accountModule) {
                return store.accountModule;
            }
            const account = Account.init({
                userHash: data.userHash,
                anonHash: data.anonHash,
                cache: data.cache,
                form_seed: data.form_seed,
                store,
                broadcast,
                postMessage
            });
            store.accountModule = account;
            const {
                channel, onAccountReady, onAccountCacheReady,
                onDisconnect, onReconnect
            } = account;

            store.driveChannel = channel;

            // don't always call onCacheReady and onReady?
            // it depends on what was required by the first tab
            onAccountCacheReady(returned => {
                store.returned ||= returned;
                cacheCb(returned);
            });
            onAccountReady(returned => {
                store.returned ||= returned;
                cb(returned);
            });
            onDisconnect(() => {
                sendDriveEvent('NETWORK_DISCONNECT');
            });
            onReconnect(() => {
                sendDriveEvent('NETWORK_RECONNECT');
            });


            // Ping clients regularly to make sure one tab was not closed without sending a removeClient()
            // command. This allow us to avoid phantom viewers in pads.
            const PING_INTERVAL = 120000;
            const MAX_PING = 30000;
            const MAX_FAILED_PING = 2;

            setInterval(function () {
                var clients = [];
                Object.keys(Store.channels).forEach(function (chanId) {
                    var c = Store.channels[chanId].clients;
                    Array.prototype.push.apply(clients, c);
                });
                clients = Util.deduplicateString(clients);
                clients.forEach(function (cId) {
                    var nb = 0;
                    var ping = function () {
                        if (nb >= MAX_FAILED_PING) {
                            Store._removeClient(cId);
                            postMessage(cId, 'TIMEOUT');
                            console.error('TIMEOUT', cId);
                            return;
                        }
                        nb++;
                        var to = setTimeout(ping, MAX_PING);
                        postMessage(cId, 'PING', null, function (err) {
                            if (err) { console.error(err); }
                            clearTimeout(to);
                        });
                    };
                    ping();
                });
            }, PING_INTERVAL);
            return account;
        };
        const loadDrive = (clientId, data, cacheCb, cb) => {
            const startDrive = Util.once((account) => {
                const drive = Drive.init({
                    account,
                    store,
                    broadcast,
                    postMessage
                });

                const {
                    /*channel,*/ onDriveReady, onDriveCacheReady,
                    onDisconnect, onReconnect
                } = drive;

                onDriveCacheReady(() => {
                    cacheCb(store.returned);
                });
                onDriveReady(() => {
                    cb(store.returned);
                });

                onDisconnect(() => {
                });
                onReconnect(() => {
                });
            });

            const noop = () => {};
            const account = loadAccount(clientId, data, noop, noop);
            account.onAccountCacheReady(() => {
                startDrive(account);
            });
            account.onAccountReady(() => {
                startDrive(account);
            });
        };

        Store.disableCache = function (clientId, disabled, cb) {
            if (disabled) {
                Cache.disable();
            } else {
                Cache.enable();
            }
            cb();
        };

        /**
         * Data:
         *   - userHash or anonHash
         * Todo in cb
         *   - LocalStore.setFSHash if needed
         *   - stuff with tokenKey
         * Event to outer
         *   - requestLogin
         */
        var initialized = false;

        // Are we still in noDrive mode?
        Store.hasDrive = function (clientId, data, cb) {
            cb({
                state: Boolean(store.proxy)
            });
        };

        const loadHK = (cb) => {
            if (store?.network?.historyKeeper) {
                return setTimeout(cb);
            }
            // Join a basic ephemeral channel
            // get the ID and leave it instantly
            const onNetwork = network => {
                store.network ||= network;
                const chan = '0000000000000000000000000000000000';
                network.join(chan).then(function (wc) {
                    let hk;
                    wc.members.forEach(p => {
                        if (p.length === 16) { hk = p; }
                    });
                    network.historyKeeper = hk;
                    wc.leave();
                    cb();
                }, function (err) {
                    console.error(err);
                    cb({error: 'GET_HK'});
                });
            };
            if (store.network) {
                return onNetwork(store.network);
            }
            store.networkPromise?.then(onNetwork);
        };
        // If we load CryptPad for the first time from an existing pad, don't create a
        // drive automatically.
        var onNoDrive = function (clientId, cb, initRpc) {
            var andThen = function () {
                // Initialize modules that can be used by pads
                // and don't require account data
                loadSyncModules();
                let getAnon = () => {
                    // Load anonymous rpc
                    initAnonRpc(null, null, function () {
                        Feedback.send("NO_DRIVE", true);
                        cb({});
                    });
                };
                if (initRpc) {
                    // In integration mode, we may need an RPC
                    return initTempRpc(clientId, getAnon);
                }
                getAnon();
            };

            // We need an anonymous RPC to be able to check if the pad exists and to get
            // its metadata, so we have to create a network first.
            if (!store.network) {
                var wsUrl = NetConfig.getWebsocketURL();
                return void Netflux.connect(wsUrl).then(function (network) {
                    // If we already haave a network (race condition), use the
                    // existing one and forget this one
                    if (!store.network) { store.network = network; }
                    else {
                        network.disconnect();
                        network = store.network;
                    }
                    // We need to know the HistoryKeeper ID to initialize the anon RPC
                    loadHK(err => {
                        if (err) { return void cb(err); }
                        andThen();
                    });
                }, function (err) {
                    console.error(err);
                    cb({error: 'OFFLINE'});
                });
            }
            andThen();
        };

        const startModules = (clientId, returned, cb) => {
            if (store.manager) {
                return void onCacheReadyEvt.reg(function () {
                    const onNetwork = (_network) => {
                        store.network ||= _network;
                        onReady(clientId, returned, () => {
                            cb(returned);
                        });
                    };
                    loadHK(onNetwork);
                });
            }
            onReady(clientId, returned, () => {
                cb(returned);
            });
        };
        const start = (clientId, data, cb) => {
            // Don't create a drive if the user only wants to
            // open an existing pad
            const noDrive = data.neverDrive || (data.noDrive && !data.userHash && !data.anonHash);
            if (noDrive) {
                if (data.neverDrive) { store.neverCache = true; }
                return void onNoDrive(clientId, obj => {
                    if (obj?.error) {
                        Feedback.send("NO_DRIVE_ERROR", true);
                    }
                    cb(obj);
                }, !!data.neverDrive);
            }

            const requires = data.requires;

            // data.noDrive indicates that we can use drive-less
            // mode. It will be false is we are loading a safe hash
            const requiresDrive = !data.noDrive;

            // Mark initialized to true: new tabs will have to
            // wait for the entire worker to be ready
            initialized = true;
            store.data = data;

            let onInit = (ret) => {
                if (Object.keys(store.proxy).length === 1) {
                    Feedback.send("FIRST_APP_USE", true);
                }
                if (ret && ret.error) {
                    initialized = false;
                }
            };

            // Now users will create a drive, but they may not
            // own an account
            if (requires === 'pad' && !requiresDrive) {
                // Start with only the pad modules, callback
                // and then load the account and other modules
                return void onNoDrive(clientId, function (obj) {
                    if (obj && obj.error) {
                        // handle error
                        return;
                    }
                    // Callback now to unfreeze the loading screen
                    // Pad can now start to be loaded
                    cb(obj);
                    // Once pad is joined, continue the loading process
                    let next = Util.once(() => {
                        loadDrive(clientId, data, ret => {
                            startCacheModules(clientId, ret, onInit);
                        }, ret => {
                            startModules(clientId, ret, onInit);
                        });
                    });
                    onJoinedEvt.reg(next);
                    onPadRejectedEvt.reg(next);
                });
            }
            if (requires === 'file' && !requiresDrive) {
                // Start with only the pad modules, callback
                // and then load the account and other modules
                return void onNoDrive(clientId, function (obj) {
                    if (obj && obj.error) {
                        // handle error
                        return;
                    }
                    // Callback now to unfreeze the loading screen
                    // Pad can now start to be loaded
                    cb(obj);
                    loadDrive(clientId, data, ret => {
                        startCacheModules(clientId, ret, onInit);
                    }, ret => {
                        startModules(clientId, ret, onInit);
                    });
                });
            }

            if (requires === 'team') {
                let called = false;
                const initTeams = cache => {
                    return ret => {
                        if (called) { return; }
                        called = true;
                        // On cache ready (if cache enabled)
                        // or on ready (if cache disabled)
                        nThen(w => {
                            if (cache) { return; }
                            initAnonRpc(null, null, w());
                        }).nThen(w => {
                            loadUniversal(Team, 'team', w, clientId);
                        }).nThen(w => {
                            // Sync teams before other modules
                            // when cache is empty
                            if (!cache && store.modules['team']) {
                                store.modules['team'].onReady(w);
                            }
                        }).nThen(() => {
                            cb(ret);
                            loadDrive(clientId, data, ret => {
                                startCacheModules(clientId, ret, onInit);
                            }, ret => {
                                startModules(clientId, ret, onInit);
                            });
                        });
                    };
                };
                return void loadAccount(clientId, data,
                                initTeams(true), initTeams(false));
            }

            if (requires === 'drive') {
                return void loadDrive(clientId, data, ret => {
                    cb(ret);
                    startCacheModules(clientId, ret, onInit);
                }, ret => {
                    cb(ret);
                    startModules(clientId, ret, onInit);
                });
                // TODO
            }

            let done = ret => {
                onInit(ret);
                const redirect = Constants.prefersDriveRedirectKey;
                const redirectPreference = Util.find(store, [ 'proxy', 'settings', 'general', redirect ]);

                ret[redirect] = redirectPreference;

                cb(ret);
            };
            loadDrive(clientId, data, ret => {
                startCacheModules(clientId, ret, done);
            }, ret => {
                startModules(clientId, ret, done);
            });
        };

        let subscribeToDrive = function (clientId) {
            onCacheReadyEvt.reg(() => {
                if (driveEventClients.indexOf(clientId) === -1) {
                    driveEventClients.push(clientId);
                }
                if (!store.driveEvents) {
                    store.driveEvents = true;
                    registerProxyEvents(store.proxy);
                    Object.keys(store.manager.folders)
                      .forEach(function (fId) {
                        var proxy = store.manager.folders[fId].proxy;
                        registerProxyEvents(proxy, fId);
                    });
                }
            });
        };

        Store.init = function (clientId, data, _callback) {
            var callback = Util.once(function (obj) {
                if (data.driveEvents) { subscribeToDrive(clientId); }
                _callback(obj);
            });

            // If this is not the first tab and we're offline, callback only if the app
            // supports offline mode
            if (initialized && !store.returned && data.cache) {
                return void onCacheReadyEvt.reg(function () {
                    callback({
                        state: 'ALREADY_INIT',
                        returned: store.cacheReturned
                    });
                });
            }

            // If this is not the first tab (initialized is true), it means either we don't
            // support offline or we're already online
            if (initialized) {
                if (store.networkTimeout) {
                    postMessage(clientId, "LOADING_DRIVE", {
                        type: "offline"
                    });
                }
                return void onReadyEvt.reg(function () {
                    callback({
                        state: 'ALREADY_INIT',
                        returned: store.returned
                    });
                });
            }

            if (data.disableCache) {
                Cache.disable();
            }

            if (data.noDrive && !data.requires) {
                data.requires = 'pad';
            }

            start(clientId, data, Util.once(obj => {
                if (obj.error === 'GET_HK') {
                    return void callback({
                        error: 'ERROR'
                    });
                }
                callback(obj);
            }));
        };

        // Clear inactive channels from cache
        onReadyEvt.reg(function () {
            var inactiveTime = (+new Date()) - CACHE_MAX_AGE * (24 * 3600 * 1000);
            Cache.getKeys(function (err, keys) {
                if (err) { return void console.error(err); }
                var next = function () {
                    if (!keys.length) { return; }
                    var key = keys.pop();
                    Cache.getTime(key, function (err, atime) {
                        if (err) { return void next(); }
                        if (!atime || atime < inactiveTime) {
                            Cache.clearChannel(key, next());
                            return;
                        }
                        next();
                    });
                };
                next();
            });
        });

        Store.disconnect = function () {
            if (globalThis.accountDeletion) { return; }
            if (!store.network) { return; }
            store.network.disconnect();
        };
        return Store;
    };

    return {
        setCustomize,
        create: create
    };
};

if (typeof(module) !== 'undefined' && module.exports) {
    // Code from customize can't be laoded directly in the build
    module.exports = factory(
        require('json.sortify'),
        require('../common/user-object'),
        require('../common/proxy-manager'),
        require('./components/migrate-user-object'),
        require('../common/common-hash'),
        require('../common/common-util'),
        require('../common/common-constants'),
        require('../common/common-feedback'),
        require('../common/common-realtime'),
        require('./components/messaging'),
        require('../common/pinpad'),
        require('../common/rpc'),
        require('./components/merge-drive'),
        require('../common/cache-store'),
        require('./components/sharedfolder'),
        require('./components/account'), // .ts
        require('./components/drive'), // .ts
        require('./modules/cursor'),
        require('./modules/support'),
        require('./modules/integration'),
        require('./modules/onlyoffice'),
        require('./modules/mailbox'),
        require('./modules/profile'),
        require('./modules/team'),
        require('./modules/messenger'),
        require('./modules/history'),
        require('./modules/calendar'),
        require('./modules/badge'),
        require('../common/login-block'),
        require('../common/network-config'),
        require('chainpad-crypto'),
        require('chainpad'),
        require('chainpad-netflux'),
        require('chainpad-listmap'),
        require('netflux-websocket'),
        require('nthen')
    );
} else {
    // unsupported initialization
}

})();
