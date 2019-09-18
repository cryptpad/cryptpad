define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',

    '/common/proxy-manager.js',
    '/common/userObject.js',
    '/common/outer/sharedfolder.js',
    '/common/outer/roster.js',
    '/common/common-messaging.js',

    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/nthen/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util, Hash, Constants, Realtime,
             ProxyManager, UserObject, SF, Roster, Messaging,
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

        var team = ctx.store.proxy.teams[id];
        list.push(team.channel);
        var chatChannel = Util.find(team, ['keys', 'chat', 'channel']);
        var membersChannel = Util.find(team, ['keys', 'roster', 'channel']);
        var mailboxChannel = Util.find(team, ['keys', 'mailbox', 'channel']);
        if (chatChannel) { list.push(chatChannel); }
        if (membersChannel) { list.push(membersChannel); }
        if (mailboxChannel) { list.push(mailboxChannel); }



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

    var onReady = function (ctx, id, lm, roster, keys, cId, cb) {
        var proxy = lm.proxy;
        var team = {
            id: id,
            proxy: proxy,
            listmap: lm,
            clients: [],
            realtime: lm.realtime,
            handleSharedFolder: function (sfId, rt) { handleSharedFolder(ctx, id, sfId, rt); },
            sharedFolders: {}, // equivalent of store.sharedFolders in async-store
            roster: roster
        };

        if (cId) { team.clients.push(cId); }

        team.sendEvent = function (q, data, sender) {
            ctx.emit(q, data, team.clients.filter(function (cId) {
                return cId !== sender;
            }));
        };

        team.getChatData = function () {
            var chatKeys = keys.chat || {};
            var hash = chatKeys.edit || chatKeys.view;
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
            if (!keys.drive.edPrivate) { return; }
            initRpc(ctx, team, keys.drive, waitFor(function (err) {
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
                edPublic: keys.drive.edPublic,
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
                edPublic: keys.drive.edPublic,
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

        var keys = teamData.keys;

        var roster;
        var lm;
        nThen(function (waitFor) {
            // Load the proxy
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
            lm = Listmap.create(cfg);
            lm.proxy.on('ready', waitFor());

            // Load the roster
            var myKeys = {
                curvePublic: ctx.store.proxy.curvePublic,
                curvePrivate: ctx.store.proxy.curvePrivate
            };
            var rosterData = keys.roster || {};
            var rosterKeys = rosterData.edit ? Crypto.Team.deriveMemberKeys(rosterData.edit, myKeys)
                                            : Crypto.Team.deriveGuestKeys(rosterData.view || '');
            Roster.create({
                network: ctx.store.network,
                channel: rosterKeys.channel,
                keys: rosterKeys,
                anon_rpc: ctx.store.anon_rpc,
                lastKnownHash: rosterData.lastKnownHash,
            }, waitFor(function (err, _roster) {
                if (err) {
                    waitFor.abort();
                    return void cb({error: 'ROSTER_ERROR'});
                }
                roster = _roster;

                // If you're allowed to edit the roster, try to update your data
                if (!rosterData.edit) { return; }
                var data = {};
                var myData = Messaging.createData(ctx.store.proxy);
                delete myData.channel;
                data[ctx.store.proxy.curvePublic] = myData;
                roster.describe(data, function (err) {
                    if (!err) { return; }
                    if (err === 'NO_CHANGE') { return; }
                    console.error(err);
                });
            }));
        }).nThen(function () {
            onReady(ctx, id, lm, roster, keys, null, cb);
        });
    };

    var createTeam = function (ctx, data, cId, _cb) {
        var cb = Util.once(_cb);

        var password = Hash.createChannelId();
        var hash = Hash.createRandomHash('team', password);
        var secret = Hash.getSecrets('team', hash, password);
        var keyPair = Nacl.sign.keyPair(); // keyPair.secretKey , keyPair.publicKey

        var rosterSeed = Crypto.Team.createSeed();
        var rosterKeys = Crypto.Team.deriveMemberKeys(rosterSeed, {
            curvePublic: ctx.store.proxy.curvePublic,
            curvePrivate: ctx.store.proxy.curvePrivate
        });
        var roster;

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
            // Initialize the roster
            Roster.create({
                network: ctx.store.network,
                channel: rosterKeys.channel, //sharedConfig.rosterChannel,
                owners: [ctx.store.proxy.edPublic],
                keys: rosterKeys,
                anon_rpc: ctx.store.anon_rpc,
                lastKnownHash: void 0,
            }, waitFor(function (err, _roster) {
                if (err) {
                    waitFor.abort();
                    return void cb({error: 'ROSTER_ERROR'});
                }
                roster = _roster;
                var myData = Messaging.createData(ctx.store.proxy);
                delete myData.channel;
                roster.init(myData, waitFor(function (err) {
                    if (err) {
                        waitFor.abort();
                        return void cb({error: 'ROSTER_INIT_ERROR'});
                    }
                }));
            }));

            // Add yourself as owner of the chat channel
            var crypto = Crypto.createEncryptor(chatSecret.keys);
            var chatCfg = {
                network: ctx.store.network,
                channel: chatSecret.channel,
                noChainPad: true,
                crypto: crypto,
                metadata: {
                    validateKey: chatSecret.keys.validateKey,
                    owners: [ctx.store.proxy.edPublic],
                }
            };
            var chatReady = waitFor();
            var cpNf2;
            chatCfg.onReady = function () {
                if (cpNf2) { cpNf2.stop(); }
                chatReady();
            };
            chatCfg.onError = function () {
                waitFor.abort();
                return void cb({error: 'CHAT_INIT_ERROR'});
            };
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
                        edit: chatHashes.editHash,
                        view: chatHashes.viewHash,
                        channel: chatSecret.channel
                    },
                    roster: {
                        channel: rosterKeys.channel,
                        edit: rosterSeed,
                        view: rosterKeys.viewKeyStr,
                    }
                };
                ctx.store.proxy.teams[id] = {
                    owner: true,
                    channel: secret.channel,
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

                onReady(ctx, id, lm, roster, keys, cId, function () {
                    cb();
                });
            }).on('error', function (info) {
                if (info && typeof (info.loaded) !== "undefined"  && !info.loaded) {
                    cb({error:'ECONNECT'});
                }
            });
        });
    };

    var getTeamMetadata = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var state = team.roster.getState() || {};
        cb(state.metadata || {});
    };

    var setTeamMetadata = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        team.roster.metadata(data.metadata, function (err) {
            if (err) { return void cb({error: err}); }
            var localTeam = ctx.store.proxy.teams[teamId];
            if (localTeam) {
                localTeam.metadata = data.metadata;
            }
            cb();
        });
    };

    // Remove a client from all the team they're subscribed to
    var removeClient = function (ctx, cId) {
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

        Object.keys(ctx.teams).forEach(function (id) {
            var clients = ctx.teams[id].clients;
            var idx = clients.indexOf(cId);
            if (idx !== -1) { clients.splice(idx, 1); }
        });
    };

    var subscribe = function (ctx, id, cId, cb) {
        // Unsubscribe from other teams: one tab can only receive events about one team
        removeClient(ctx, cId);
        // And leave the channel channel
        try {
            ctx.store.messenger.removeClient(cId);
        } catch (e) {}

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
                    name: teams[id].metadata.name,
                    edPublic: Util.find(teams[id], ['keys', 'drive', 'edPublic'])
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
            if (cmd === 'GET_TEAM_METADATA') {
                return void getTeamMetadata(ctx, data, clientId, cb);
            }
            if (cmd === 'SET_TEAM_METADATA') {
                return void setTeamMetadata(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_TEAM') {
                return void createTeam(ctx, data, clientId, cb);
            }
        };

        return team;
    };

    return Team;
});



