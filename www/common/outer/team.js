define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',

    '/common/proxy-manager.js',
    '/common/userObject.js',
    '/common/outer/sharedfolder.js',

    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/nthen/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util, Hash, Constants, Realtime,
             ProxyManager, UserObject, SF,
             Listmap, Crypto, CpNetflux, ChainPad, nThen) {
    var Team = {};

    var Nacl = window.nacl;

    var initializeTeams = function (ctx, cb) {
        cb();
    };

    var registerChangeEvents = function (ctx, team, proxy, fId) {
        if (!team) { return; }
        proxy.on('change', [], function (o, n, p) {
            if (fId) {
                // Pin the new pads
                if (p[0] === UserObject.FILES_DATA && typeof(n) === "object" && n.channel && !n.owners) {
                    var toPin = [n.channel];
                    // Also pin the onlyoffice channels if they exist
                    if (n.rtChannel) { toPin.push(n.rtChannel); }
                    if (n.lastVersion) { toPin.push(n.lastVersion); }
                    team.pin(toPin, function (obj) { console.error(obj); });
                }
                // Unpin the deleted pads (deleted <=> changed to undefined)
                if (p[0] === UserObject.FILES_DATA && typeof(o) === "object" && o.channel && !n) {
                    var toUnpin = [o.channel];
                    var c = team.manager.findChannel(o.channel);
                    var exists = c.some(function (data) {
                        return data.fId !== fId;
                    });
                    if (!exists) { // Unpin
                        // Also unpin the onlyoffice channels if they exist
                        if (o.rtChannel) { toUnpin.push(o.rtChannel); }
                        if (o.lastVersion) { toUnpin.push(o.lastVersion); }
                        team.unpin(toUnpin, function (obj) { console.error(obj); });
                    }
                }
            }
            team.sendEvent('DRIVE_CHANGE', {
                id: fId,
                old: o,
                new: n,
                path: p
            });
        });
        proxy.on('remove', [], function (o, p) {
            team.sendEvent('DRIVE_REMOVE', {
                id: fId,
                old: o,
                path: p
            });
        });
    };

    var getTeamChannelList = function (ctx, id) {
        // Get the list of pads' channel ID in your drive
        // This list is filtered so that it doesn't include pad owned by other users
        // It now includes channels from shared folders
        var store = ctx.teams[id];
        if (!store) { return null; }
        var list = store.manager.getChannelsList('pin');

        // Teams will always be owned for now
        // XXX if the team is not owned, add the teamChannel to the list
        /*
        var _team = Util.find(ctx, ['store', 'proxy', 'teams', id]);
        var secret = Hash.getSecrets('team', _team.hash, _team.password);
        var teamChannel = secret.channel;
        list.push(userChannel);
        */


        // XXX Add the team mailbox
        /*
        if (store.proxy.mailboxes) {
            var mList = Object.keys(store.proxy.mailboxes).map(function (m) {
                return store.proxy.mailboxes[m].channel;
            });
            list = list.concat(mList);
        }
        */

        list.sort();
        return list;
    };

    var handleSharedFolder = function (ctx, id, sfId, rt) {
        var t = ctx.teams[id];
        if (!t) { return; }
        t.sharedFolders[sfId] = rt;
        registerChangeEvents(ctx, t, rt.proxy, sfId);
    };

    var initRpc = function (ctx, team, data, cb) {
        if (team.rpc) { return void cb(); }
        if (!data.edPrivate || !data.edPublic) { return void cb('EFORBIDDEN'); }
        require(['/common/pinpad.js'], function (Pinpad) {
            Pinpad.create(ctx.store.network, data, function (e, call) {
                if (e) { return void cb(e); }
                team.rpc = call;
                cb();
            });
        });
    };

    var onReady = function (ctx, id, lm, keys, cId, cb) {
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

        if (cId) { team.clients.push(cId); }

        team.sendEvent = function (q, data, sender) {
            ctx.emit(q, data, team.clients.filter(function (cId) {
                return cId !== sender;
            }));
        };

        team.getChatData = function () {
            var hash = Util.find(ctx.store.proxy, ['teams', id, 'keys' 'chat', 'hash']);
            if (!hash) { return {}; }
            var secret = Hash.getSecrets('chat', hash);
            return {
                teamId: id,
                channel: secret.channel,
                secret: secret,
                validateKey: secret.keys.validateKey
                // XXX owners: team owner + all admins?
            };
        };

        team.pin = function (data, cb) { return void cb({error: 'EFORBIDDEN'}); };
        team.unpin = function (data, cb) { return void cb({error: 'EFORBIDDEN'}); };
        nThen(function (waitFor) {
            if (!keys.edPrivate) { return; }
            initRpc(ctx, team, keys, waitFor(function (err) {
                if (err) { return; }

                team.pin = function (data, cb) {
                    if (!team.rpc) { return void cb({error: 'TEAM_RPC_NOT_READY'}); }
                    if (typeof(cb) !== 'function') { console.error('expected a callback'); }
                    team.rpc.pin(data, function (e, hash) {
                        if (e) { return void cb({error: e}); }
                        cb({hash: hash});
                    });
                };

                team.unpin = function (data, cb) {
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
                pin: team.pin,
                unpin: team.unpin,
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
            ctx.teams[id] = team;
            registerChangeEvents(ctx, team, proxy);
            SF.loadSharedFolders(ctx.Store, ctx.store.network, team, team.userObject, waitFor);
            // XXX
            // Load members pad
        }).nThen(function () {
            if (!team.rpc) { return; }
            var list = getTeamChannelList(ctx, id);
            var local = Hash.hashChannelList(list);
            // Check pin list
            team.rpc.getServerHash(function (e, hash) {
                if (e) { return void console.warn(e); }
                if (hash !== local) {
                    // Reset pin list
                    team.rpc.reset(list, function (e/*, hash*/) {
                        if (e) { console.warn(e); }
                    });
                }
            });
        }).nThen(function () {
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
            onReady(ctx, id, lm, teamData.keys, null, cb);
        });
    };

    var createTeam = function (ctx, data, cId, _cb) {
        var cb = Util.once(_cb);

        var password = Hash.createChannelId();
        var hash = Hash.createRandomHash('team', password);
        var secret = Hash.getSecrets('team', hash, password);
        var keyPair = Nacl.sign.keyPair(); // keyPair.secretKey , keyPair.publicKey

        // Crypto.create
        var membersSecret = Hash.getSecrets('members');
        var membersHashes = Hash.getHashes(membersSecret);

        var chatSecret = Hash.getSecrets('chat');
        var chatHashes = Hash.getHashes(chatSecret);

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
            // XXX add this to the reset list too
            ctx.pinPads([secret.channel, membersSecret.channel, chatSecret.channel], waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
            // XXX initialize the members channel with yourself, and mark it as owned!
            var chatCfg = {
                network: ctx.store.network,
                channel: chatSecret.channel,
                noChainPad: true,
                crypto: crypto,
                metadata: {
                    validateKey: secret.keys.validateKey,
                    owners: [ctx.store.proxy.edPublic],
                }
            };
            var chatReady = waitFor();
            var cpNf2;
            chatCfg.onReady = function () {
                if (cpNf2) { cpNf2.stop(); }
                chatReady();
            };
            chatCfg.onError = function () { chatReady(); };
            cpNf2 = CpNetflux.start(chatCfg);
        }).nThen(function () {
            var lm = Listmap.create(config);
            var proxy = lm.proxy;
            proxy.on('ready', function () {
                var id = Util.createRandomInteger();
                // Store keys in our drive
                var keys = {
                    drive: {
                        edPrivate: Nacl.util.encodeBase64(keyPair.secretKey),
                        edPublic: Nacl.util.encodeBase64(keyPair.publicKey)
                    },
                    chat: {
                        hash: chatHashes.editHash,
                        channel: chatSecret.channel
                    },
                    members: {
                        // XXX
                    }
                };
                ctx.store.proxy.teams[id] = {
                    hash: hash,
                    password: password,
                    keys: keys,
                    //members: membersHashes.editHash,
                    metadata: {
                        name: data.name
                    }
                };
                // Initialize the team drive
                proxy.drive = {};
                // Create metadata
                proxy.metadata = {
                    //chat: chatHashes.editHash,
                    //name: name,
                    //members: membersHashes.viewHash,
                };
                // Add rpc key
                //proxy.edPublic = Nacl.util.encodeBase64(keyPair.publicKey);

                onReady(ctx, id, lm, {
                    edPrivate: keyPair.secretKey,
                    edPublic: keyPair.publicKey
                }, cId, function () {
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
        // Unsubscribe from other teams: one tab can only receive events about one team
        Object.keys(ctx.teams).forEach(function (teamId) {
            var c = ctx.teams[teamId].clients;
            var idx = c.indexOf(cId);
            if (idx !== -1) {
                c.splice(idx, 1);
            }
        });
        // Also remove from pending subscriptions
        Object.keys(ctx.onReadyHandlers).forEach(function (teamId) {
            var idx = -1;
            ctx.onReadyHandlers[teamId].some(function (obj, _idx) {
                if (obj.cId === cId) {
                    idx = _idx;
                    return true;
                }
            });
            if (idx !== -1) {
                ctx.onReadyHandlers[teamId].splice(idx, 1);
            }
        });

        if (!id) { return void cb(); }
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
        if (!ctx.teams[id]) {
            return void cb({error: 'EINVAL'});
        }
        var clients = ctx.teams[id].clients;
        var idx = clients.indexOf(cId);
        if (idx === -1) {
            clients.push(cId);
        }
        cb();
    };

    var openTeamChat = function (ctx, data, cId, cb) {
        var team = ctx.teams[data.teamId];
        if (!team) { return void cb({error: 'ENOENT'}); }
        ctx.store.messenger.openTeamChat(team.getChatData(), cId, cb);
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
                console.debug('Team '+id+' ready');
            }));
        });

        team.getTeam = function (id) {
            return ctx.teams[id];
        };
        team.getTeamsData = function () {
            var t = {};
            Object.keys(teams).forEach(function (id) {
                t[id] = {
                    name: teams[id].name,
                    edPublic: Util.find(teams[id], ['keys', 'edPublic'])
                };
            });
            return t;
        };
        team.getTeams = function () {
            return Object.keys(ctx.teams);
        };
        team.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        team.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                // Only the team app will subscribe to events?
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'LIST_TEAMS') {
                return void cb(store.proxy.teams);
            }
            if (cmd === 'OPEN_TEAM_CHAT') {
                return void openTeamChat(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_TEAM') {
                return void createTeam(ctx, data, clientId, cb);
            }
        };

        return team;
    };

    return Team;
});



