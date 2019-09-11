define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',

    '/common/proxy-manager.js',
    '/common/outer/sharedfolder.js',

    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/nthen/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util, Hash, Constants, Realtime,
             ProxyManager, SF,
             Listmap, Crypto, ChainPad, nThen) {
    var Team = {};

    var Nacl = window.nacl;

    var initializeTeams = function (ctx, cb) {
        // XXX ?
        cb();
    };

    var handleSharedFolder = function (ctx, id, sfId, rt) {
        var t = ctx.teams[id];
        if (!t) { return; }
        t.sharedFolders[sfId] = rt;
        // XXX register events
        // rt.proxy.on('change',...  emit change event
        // TODO: pin or unpin document added to a shared folder from someone who is not a member of the team
    };

    var initRpc = function (ctx, team, data, cb) {
        if (team.rpc) { return void cb(); }
        if (!data.edPrivate || !data.edPublic) { return void cb('EFORBIDDEN'); }
        require(['/common/pinpad.js'], function (Pinpad) {
            Pinpad.create(ctx.store.network, data, function (e, call) {
                if (e) { return void cb(e); }
                team.rpc = call;
                cb();
                // XXX get pin limit?
            });
        });
    };

    var onReady = function (ctx, id, lm, keys, cb) {
        // XXX
        // sanity check: do we have all the required keys?
        // [x] initialize team rpc with pin, unpin, ...
        // [x] team.rpc = rpc
        // [x] load manager with userObject
        //   team.manager =... team.userObject = ....
        // [ ] load members pad
        // [ ] load shared folders
        // [ ] register listmap 'change' events for the drive and the shared folders
        // [ ] ~resetPins for the team?
        // [ ] getPinLimit

        var proxy = lm.proxy;
        var team = {
            id: id,
            proxy: proxy,
            listmap: lm,
            clients: [],
            realtime: lm.realtime,
            handleSharedFolder: function (sfId, rt) { handleSharedFolder(ctx, id, sfId, rt); },
            sharedFolders: {}, // equivalent of store.sharedFolders in async-store
        };

        team.sendEvent = function (q, data, sender) {
            ctx.emit(q, data, team.clients.filter(function (cId) {
                return cId !== sender;
            }));
        };

        var pin = function (data, cb) { return void cb({error: 'EFORBIDDEN'}); };
        var unpin = function (data, cb) { return void cb({error: 'EFORBIDDEN'}); };
        nThen(function (waitFor) {
            if (!keys.edPrivate) { return; }
            initRpc(ctx, team, keys, waitFor(function (err) {
                if (err) { return; }

                pin = function (data, cb) {
                    if (!team.rpc) { return void cb({error: 'TEAM_RPC_NOT_READY'}); }
                    if (typeof(cb) !== 'function') { console.error('expected a callback'); }
                    team.rpc.pin(data, function (e, hash) {
                        if (e) { return void cb({error: e}); }
                        cb({hash: hash});
                    });
                };

                unpin = function (data, cb) {
                    if (!team.rpc) { return void cb({error: 'TEAM_RPC_NOT_READY'}); }
                    if (typeof(cb) !== 'function') { console.error('expected a callback'); }
                    team.rpc.unpin(data, function (e, hash) {
                        if (e) { return void cb({error: e}); }
                        cb({hash: hash});
                    });
                };
            }));
        }).nThen(function () {
            var loadSharedFolder = function (id, data, cb) {
                SF.load({
                    network: ctx.store.network,
                    store: team
                }, id, data, cb);
            };
            var manager = team.manager = ProxyManager.create(proxy.drive, {
                onSync: function (cb) { ctx.Store.onSync(id, cb); },
                edPublic: proxy.edPublic,
                pin: pin,
                unpin: unpin,
                loadSharedFolder: loadSharedFolder,
                settings: {
                    drive: Util.find(ctx.store, ['proxy', 'settings', 'drive'])
                }
            }, {
                outer: true,
                removeOwnedChannel: function (channel, cb) {
                    var data;
                    if (typeof(channel) === "object") {
                        channel.teamId = id;
                        data = channel;
                    } else {
                        data = {
                            channel: channel,
                            teamId: id
                        };
                    }
                    ctx.Store.removeOwnedChannel('', data, cb);
                },
                edPublic: proxy.edPublic,
                loggedIn: true,
                log: function (msg) {
                    // broadcast to all drive apps
                    team.sendEvent("DRIVE_LOG", msg);
                }
            });
            team.userObject = manager.user.userObject;
            team.userObject.fixFiles();
        }).nThen(function (waitFor) {
            // XXX
            // Load shared folders
            // Load members pad
            console.log('ok', waitFor);
        }).nThen(function () {
            ctx.teams[id] = team;
            if (ctx.onReadyHandlers[id]) {
                ctx.onReadyHandlers[id].forEach(function (obj) {
                    // Callback and subscribe the client to new notifications
                    if (typeof (obj.cb) === "function") { obj.cb(); }
                    if (!obj.cId) { return; }
                    var idx = team.clients.indexOf(obj.cId);
                    if (idx === -1) {
                        team.clients.push(obj.cId);
                    }
                });
            }
            delete ctx.onReadyHandlers[id];
            cb();
        });

    };

    var openChannel = function (ctx, teamData, id, cb) {
        var secret = Hash.getSecrets('team', teamData.hash, teamData.password);
        var crypto = Crypto.createEncryptor(secret.keys);

        var cfg = {
            data: {},
            readOnly: !Boolean(secret.keys.signKey),
            network: ctx.store.network,
            channel: secret.channel,
            crypto: crypto,
            ChainPad: ChainPad,
            metadata: {
                validateKey: secret.keys.validateKey || undefined,
            },
            userName: 'team',
            classic: true
        };
        var lm = Listmap.create(cfg);
        lm.proxy.on('create', function () {
        }).on('ready', function () {
            onReady(ctx, id, lm, teamData.keys, cb);
        });
    };

    var createTeam = function (ctx, data, cId, _cb) {
        var cb = Util.once(_cb);

        var password = Hash.createChannelId();
        var hash = Hash.createRandomHash('team', password);
        var secret = Hash.getSecrets('team', hash, password);
        var keyPair = Nacl.sign.keyPair(); // keyPair.secretKey , keyPair.publicKey

        var membersSecret = Hash.getSecrets('members');
        var membersHashes = Hash.getHashes(membersSecret);

        var config = {
            network: ctx.store.network,
            channel: secret.channel,
            data: {},
            validateKey: secret.keys.validateKey, // derived validation key
            crypto: Crypto.createEncryptor(secret.keys),
            logLevel: 1,
            classic: true,
            ChainPad: ChainPad,
            owners: [ctx.store.proxy.edPublic]
        };
        nThen(function (waitFor) {
            console.log('pin..');
            ctx.pinPads([secret.channel, membersSecret.channel], waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
            // XXX initialize the members channel with yourself, and mark it as owned!
        }).nThen(function () {
            console.log('init proxy');
            var lm = Listmap.create(config);
            var proxy = lm.proxy;
            proxy.on('ready', function () {
                console.log('ready');
                // Store keys in our drive
                var id = Util.createRandomInteger();
                var keys = {
                    edPrivate: Nacl.util.encodeBase64(keyPair.secretKey),
                    edPublic: Nacl.util.encodeBase64(keyPair.publicKey)
                };
                ctx.store.proxy.teams[id] = {
                    hash: hash,
                    password: password,
                    keys: keys,
                    members: membersHashes.editHash,
                    name: data.name
                };
                // Initialize the team drive
                proxy.drive = {};
                // Create metadata
                proxy.metadata = {
                    name: name,
                    members: membersHashes.viewHash,
                };
                // Add rpc key
                proxy.edPublic = Nacl.util.encodeBase64(keyPair.publicKey);

                onReady(ctx, id, lm, {
                    edPrivate: keyPair.secretKey,
                    edPublic: keyPair.publicKey
                }, function () {
                    cb();
                });
            }).on('error', function (info) {
                if (info && typeof (info.loaded) !== "undefined"  && !info.loaded) {
                    cb({error:'ECONNECT'});
                }
            });
        });
    };

    var subscribe = function (ctx, id, cId, cb) {
        // If the team is loading, as ourselves in the list
        if (ctx.onReadyHandlers[id]) {
            var _idx = ctx.onReadyHandlers[id].indexOf(cId);
            if (_idx === -1) {
                ctx.onReadyHandlers[id].push({
                    cId: cId,
                    cb: cb
                });
            }
            return;
        }
        // Otherwise, subscribe to new notifications
        if (!id || !ctx.teams[id]) {
            return void cb({error: 'EINVAL'});
        }
        var clients = ctx.teams[id].clients;
        var idx = clients.indexOf(cId);
        if (idx === -1) {
            clients.push(cId);
        }
        cb();
    };

    // Remove a client from all the team they're subscribed to
    var removeClient = function (ctx, cId) {
        Object.keys(ctx.teams).forEach(function (id) {
            // Remove from the subscribers
            var clients = ctx.teams[id].clients;
            var idx = clients.indexOf(cId);
            if (idx !== -1) { clients.splice(idx, 1); }

            // And remove from the onReady handlers in case they haven't finished loading
            if (ctx.onReadyHandlers[id]) {
                var idx2 = ctx.onReadyHandlers.indexOf(cId);
                if (idx2 !== -1) { ctx.onReadyHandlers.splice(idx2, 1); }
            }
        });
    };

    Team.init = function (cfg, waitFor, emit) {
        var team = {};
        var store = cfg.store;
        if (!store.loggedIn || !store.proxy.edPublic) { return; }
        var ctx = {
            store: store,
            Store: cfg.Store,
            pinPads: cfg.pinPads,
            emit: emit,
            onReadyHandlers: {},
            teams: {}
        };

        var teams = store.proxy.teams = store.proxy.teams || {};

        initializeTeams(ctx, waitFor(function (err) {
            if (err) { return; }
        }));

        Object.keys(teams).forEach(function (id) {
            ctx.onReadyHandlers[id] = [];
            openChannel(ctx, teams[id], id, waitFor(function () {
                console.error('team '+id+' ready');
            }));
        });

        team.getTeam = function (id) {
            return ctx.teams[id];
        };
        team.getTeams = function () {
            return Object.keys(ctx.teams);
        };
        team.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        team.execCommand = function (clientId, obj, cb) {
            console.log(obj);
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                // Only the team app will subscribe to events?
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'LIST_TEAMS') {
                return void cb(store.proxy.teams);
            }
            if (cmd === 'CREATE_TEAM') {
                return void createTeam(ctx, data, clientId, cb);
            }
        };

        return team;
    };

    return Team;
});



