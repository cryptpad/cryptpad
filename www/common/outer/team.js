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
    '/bower_components/saferphore/index.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Util, Hash, Constants, Realtime,
             ProxyManager, UserObject, SF, Roster, Messaging,
             Listmap, Crypto, CpNetflux, ChainPad, nThen, Saferphore) {
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
                    team.pin(toPin, function (obj) {
                        if (obj && obj.error) { console.error(obj.error); }
                    });
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
                        team.unpin(toUnpin, function (obj) {
                            if (obj && obj.error) { console.error(obj); }
                        });
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

    var closeTeam = function (ctx, teamId) {
        var team = ctx.teams[teamId];
        if (!team) { return; }
        try { team.listmap.stop(); } catch (e) {}
        try { team.roster.stop(); } catch (e) {}
        team.proxy = {};
        delete ctx.teams[teamId];
        delete ctx.store.proxy.teams[teamId];
        ctx.emit('LEAVE_TEAM', teamId, team.clients);
        ctx.updateMetadata();
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

        roster.on('change', function () {
            var state = roster.getState();
            var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
            if (!state.members[me]) {
                return void closeTeam(ctx, id);
            }
            var teamData = Util.find(ctx, ['store', 'proxy', 'teams', id]);
            if (teamData) { teamData.metadata = state.metadata; }
            ctx.updateMetadata();
            ctx.emit('ROSTER_CHANGE', id, team.clients);
        });
        roster.on('checkpoint', function (hash) {
            var rosterData = Util.find(ctx, ['store', 'proxy', 'teams', id, 'keys', 'roster']);
            rosterData.lastKnownHash = hash;
        });

        var state = roster.getState();
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', id]);
        if (teamData) { teamData.metadata = state.metadata; }

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
                }, id, data, function (id, rt) {
                    cb(id, rt);
                });
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

    var openChannel = function (ctx, teamData, id, _cb) {
        var cb = Util.once(_cb);

        var secret = Hash.getSecrets('team', teamData.hash, teamData.password);
        var crypto = Crypto.createEncryptor(secret.keys);

        var keys = teamData.keys;

        var roster;
        var lm;

        // Roster keys
        var myKeys = {
            curvePublic: ctx.store.proxy.curvePublic,
            curvePrivate: ctx.store.proxy.curvePrivate
        };
        var rosterData = keys.roster || {};
        var rosterKeys = rosterData.edit ? Crypto.Team.deriveMemberKeys(rosterData.edit, myKeys)
                                        : Crypto.Team.deriveGuestKeys(rosterData.view || '');

        nThen(function (waitFor) {
            ctx.store.anon_rpc.send("IS_NEW_CHANNEL", secret.channel, waitFor(function (e, response) {
                if (response && response.length && typeof(response[0]) === 'boolean' && response[0]) {
                    // Channel is empty: remove this team
                    delete ctx.store.proxy.teams[id];
                    waitFor.abort();
                    cb({error: 'ENOENT'});
                }
            }));
            ctx.store.anon_rpc.send("IS_NEW_CHANNEL", rosterKeys.channel, waitFor(function (e, response) {
                if (response && response.length && typeof(response[0]) === 'boolean' && response[0]) {
                    // Channel is empty: remove this team
                    delete ctx.store.proxy.teams[id];
                    waitFor.abort();
                    cb({error: 'ENOENT'});
                }
            }));
        }).nThen(function (waitFor) {
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
            cfg.onMetadataUpdate = function () {
                var team = ctx.teams[id];
                if (!team) { return; }
                ctx.emit('ROSTER_CHANGE', id, team.clients);
            };
            lm = Listmap.create(cfg);
            lm.proxy.on('ready', waitFor());
            lm.proxy.on('error', function (info) {
                if (info && typeof (info.loaded) !== "undefined"  && !info.loaded) {
                    cb({error:'ECONNECT'});
                }
                if (info && info.error) {
                    if (info.error === "EDELETED" ) {
                        closeTeam(ctx, id);
                    }
                }
            });

            // Load the roster
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

                rosterData.lastKnownHash = roster.getLastCheckpointHash();

                // If we've been kicked, don't try to update our data, we'll close everything
                // in the next nThen part
                var state = roster.getState();
                var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
                if (!state.members[me]) { return; }

                // If you're allowed to edit the roster, try to update your data
                if (!rosterData.edit) { return; }
                var data = {};
                var myData = Messaging.createData(ctx.store.proxy, false);
                myData.pending = false;
                data[ctx.store.proxy.curvePublic] = myData;
                roster.describe(data, function (err) {
                    if (!err) { return; }
                    if (err === 'NO_CHANGE') { return; }
                    console.error(err);
                });
            }));
        }).nThen(function (waitFor) {
            // Make sure we have not been kicked from the roster
            var state = roster.getState();
            var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
            if (!state.members[me]) {
                lm.stop();
                roster.stop();
                lm.proxy = {};
                delete ctx.store.proxy.teams[id];
                ctx.updateMetadata();
                cb({error: 'EFORBIDDEN'});
                waitFor.abort();
            }
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
        }).nThen(function (waitFor) {
            roster.metadata({
                name: data.name
            }, waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    return void cb({error: 'ROSTER_INIT_ERROR'});
                }
            }));
        }).nThen(function () {
            var id = Util.createRandomInteger();
            config.onMetadataUpdate = function () {
                var team = ctx.teams[id];
                if (!team) { return; }
                ctx.emit('ROSTER_CHANGE', id, team.clients);
            };
            var lm = Listmap.create(config);
            var proxy = lm.proxy;
            proxy.on('ready', function () {
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
                    ctx.updateMetadata();
                    cb();
                });
            }).on('error', function (info) {
                if (info && typeof (info.loaded) !== "undefined"  && !info.loaded) {
                    cb({error:'ECONNECT'});
                }
                if (info && info.error) {
                    if (info.error === "EDELETED") {
                        closeTeam(ctx, id);
                    }
                }
            });
        });
    };

    var deleteTeam = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!team || !teamData) { return void cb ({error: 'ENOENT'}); }
        var state = team.roster.getState();
        var curvePublic = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
        var me = state.members[curvePublic];
        if (!me || me.role !== "OWNER") { return cb({ error: "EFORBIDDEN"}); }

        var edPublic = Util.find(ctx, ['store', 'proxy', 'edPublic']);
        var teamEdPublic = Util.find(teamData, ['keys', 'drive', 'edPublic']);

        nThen(function (waitFor) {
            ctx.Store.anonRpcMsg(null, {
                msg: 'GET_METADATA',
                data: teamData.channel
            }, waitFor(function (obj) {
                // If we can't get owners, abort
                if (obj && obj.error) {
                    waitFor.abort();
                    return cb({ error: obj.error});
                }
                // Check if we're an owner of the team drive
                var metadata = obj[0];
                if (metadata && Array.isArray(metadata.owners) &&
                    metadata.owners.indexOf(edPublic) !== -1) { return; }
                // If w'e're not an owner, abort
                waitFor.abort();
                cb({error: 'EFORBIDDEN'});
            }));
        }).nThen(function (waitFor) {
            team.proxy.delete = true;
            // For each pad, check on the server if there are other owners.
            // If yes, then remove yourself as an owner
            // If no, delete the pad
            var ownedPads = team.manager.getChannelsList('owned');
            var sem = Saferphore.create(10);
            ownedPads.forEach(function (c) {
                var w = waitFor();
                sem.take(function (give) {
                    var otherOwners = false;
                    nThen(function (_w) {
                        ctx.Store.anonRpcMsg(null, {
                            msg: 'GET_METADATA',
                            data: c
                        }, _w(function (obj) {
                            if (obj && obj.error) {
                                give();
                                return void _w.abort();
                            }
                            var md = obj[0];
                            var isOwner = md && Array.isArray(md.owners) && md.owners.indexOf(teamEdPublic) !== -1;
                            if (!isOwner) {
                                give();
                                return void _w.abort();
                            }
                            otherOwners = md.owners.some(function (ed) { return ed !== teamEdPublic; });
                        }));
                    }).nThen(function (_w) {
                        if (otherOwners) {
                            ctx.Store.setPadMetadata(null, {
                                channel: c,
                                command: 'RM_OWNERS',
                                value: [teamEdPublic],
                            }, _w());
                            return;
                        }
                        // We're the only owner: delete the pad
                        team.rpc.removeOwnedChannel(c, _w(function (err) {
                            if (err) { console.error(err); }
                        }));
                    }).nThen(function () {
                        give();
                        w();
                    });
                });
             });
        }).nThen(function (waitFor) {
            // Delete the pins log
            team.rpc.removePins(waitFor(function (err) {
                if (err) { console.error(err); }
            }));
            // Delete the roster
            var rosterChan = Util.find(teamData, ['keys', 'roster', 'channel']);
            ctx.store.rpc.removeOwnedChannel(rosterChan, waitFor(function (err) {
                if (err) { console.error(err); }
            }));
            // Delete the chat
            var chatChan = Util.find(teamData, ['keys', 'chat', 'channel']);
            ctx.store.rpc.removeOwnedChannel(chatChan, waitFor(function (err) {
                if (err) { console.error(err); }
            }));
            // Delete the team drive
            ctx.store.rpc.removeOwnedChannel(teamData.channel, waitFor(function (err) {
                if (err) { console.error(err); }
            }));
        }).nThen(function () {
            closeTeam(ctx, teamId);
            cb();
        });
    };

    var joinTeam = function (ctx, data, cId, cb) {
        var team = data.team;
        if (!team.hash || !team.channel || !team.password
            || !team.keys || !team.metadata) { return void cb({error: 'EINVAL'}); }
        var id = Util.createRandomInteger();
        ctx.store.proxy.teams[id] = team;
        ctx.onReadyHandlers[id] = [];
        openChannel(ctx, team, id, function (obj) {
            if (!(obj && obj.error)) { console.debug('Team joined:' + id); }
            ctx.updateMetadata();
            cb(obj);
        });
    };

    var leaveTeam = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var curvePublic = ctx.store.proxy.curvePublic;
        team.roster.remove([curvePublic], function (err) {
            if (err) { return void cb({error: err}); }
            closeTeam(ctx, teamId);
            cb();
        });
    };

    var getTeamRoster = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb ({error: 'ENOENT'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var state = team.roster.getState() || {};
        var members = state.members || {};

        // Get pending owners
        var md = team.listmap.metadata || {};
        if (Array.isArray(md.pending_owners)) {
            // Get the members associated to the pending_owners' edPublic and mark them as such
            md.pending_owners.forEach(function (ed) {
                var member;
                Object.keys(members).some(function (curve) {
                    if (members[curve].edPublic === ed) {
                        member = members[curve];
                        return true;
                    }
                });
                if (!member && teamData.owner) {
                    var removeOwnership = function (chan) {
                        ctx.Store.setPadMetadata(null, {
                            channel: chan,
                            command: 'RM_PENDING_OWNERS',
                            value: [ed],
                        }, function () {});
                    };
                    removeOwnership(teamData.channel);
                    removeOwnership(Util.find(teamData, ['keys', 'roster', 'channel']));
                    removeOwnership(Util.find(teamData, ['keys', 'chat', 'channel']));
                    return;
                }
                member.pendingOwner = true;
            });
        }

        // Add online status (using messenger data)
        var chatData = team.getChatData();
        var online = ctx.store.messenger.getOnlineList(chatData.channel) || [];
        online.forEach(function (curve) {
            if (members[curve]) {
                members[curve].online = true;
            }
        });

        cb(members);
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

    var offerOwnership = function (ctx, data, cId, _cb) {
        var cb = Util.once(_cb);
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb ({error: 'ENOENT'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        if (!data.curvePublic) { return void cb({error: 'MISSING_DATA'}); }
        var state = team.roster.getState();
        var user = state.members[data.curvePublic];
        nThen(function (waitFor) {
            // Offer ownership to a friend
            var onError = function (res) {
                var err = res && res.error;
                if (err) {
                    console.error(err);
                    waitFor.abort();
                    return void cb({error:err});
                }
            };
            var addPendingOwner = function (chan) {
                ctx.Store.setPadMetadata(null, {
                    channel: chan,
                    command: 'ADD_PENDING_OWNERS',
                    value: [user.edPublic],
                }, waitFor(onError));
            };
            // Team proxy
            addPendingOwner(teamData.channel);
            // Team roster
            addPendingOwner(Util.find(teamData, ['keys', 'roster', 'channel']));
            // Team chat
            addPendingOwner(Util.find(teamData, ['keys', 'chat', 'channel']));
        }).nThen(function (waitFor) {
            var obj = {};
            obj[user.curvePublic] = {
                role: 'OWNER'
            };
            team.roster.describe(obj, waitFor(function (err) {
                if (err) { console.error(err); }
            }));
        }).nThen(function (waitFor) {
            // Send mailbox to offer ownership
            var myData = Messaging.createData(ctx.store.proxy, false);
            ctx.store.mailbox.sendTo("ADD_OWNER", {
                teamChannel: teamData.channel,
                chatChannel: Util.find(teamData, ['keys', 'chat', 'channel']),
                rosterChannel: Util.find(teamData, ['keys', 'roster', 'channel']),
                title: teamData.metadata.name,
                user: myData
            }, {
                channel: user.notifications,
                curvePublic: user.curvePublic
            }, waitFor());
        }).nThen(function () {
            cb();
        });
    };

    var revokeOwnership = function (ctx, teamId, user, _cb) {
        var cb = Util.once(_cb);
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb ({error: 'ENOENT'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        var md = team.listmap.metadata || {};
        var isPendingOwner = (md.pending_owners || []).indexOf(user.edPublic) !== -1;
        nThen(function (waitFor) {
            var cmd = isPendingOwner ? 'RM_PENDING_OWNERS' : 'RM_OWNERS';

            var onError = function (res) {
                var err = res && res.error;
                if (err) {
                    console.error(err);
                    waitFor.abort();
                    return void cb(err);
                }
            };
            var removeOwnership = function (chan) {
                ctx.Store.setPadMetadata(null, {
                    channel: chan,
                    command: cmd,
                    value: [user.edPublic],
                }, waitFor(onError));
            };
            // Team proxy
            removeOwnership(teamData.channel);
            // Team roster
            removeOwnership(Util.find(teamData, ['keys', 'roster', 'channel']));
            // Team chat
            removeOwnership(Util.find(teamData, ['keys', 'chat', 'channel']));
        }).nThen(function (waitFor) {
            var obj = {};
            obj[user.curvePublic] = {
                role: 'ADMIN',
                pendingOwner: false
            };
            team.roster.describe(obj, waitFor(function (err) {
                if (err) { console.error(err); }
            }));
        }).nThen(function (waitFor) {
            // Send mailbox to offer ownership
            var myData = Messaging.createData(ctx.store.proxy, false);
            ctx.store.mailbox.sendTo("RM_OWNER", {
                teamChannel: teamData.channel,
                title: teamData.metadata.name,
                pending: isPendingOwner,
                user: myData
            }, {
                channel: user.notifications,
                curvePublic: user.curvePublic
            }, waitFor());
        }).nThen(function () {
            cb();
        });
    };

    // We've received an offer to be an owner of the team.
    // If we accept, we need to set the "owner" flag in our team data
    // If we decline, we need to change our role back to "ADMIN"
    var answerOwnership = function (ctx, data, cId, cb) {
        var myTeams = ctx.store.proxy.teams;
        var teamId;
        Object.keys(myTeams).forEach(function (id) {
            if (myTeams[id].channel === data.teamChannel) {
                teamId = id;
                return true;
            }
        });
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb ({error: 'ENOENT'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var obj = {};

        // Accept
        if (data.answer) {
            teamData.owner = true;
            return;
        }
        // Decline
        obj[ctx.store.proxy.curvePublic] = {
            role: 'ADMIN',
        };
        team.roster.describe(obj, function (err) {
            if (err) { return void cb({error: err}); }
            cb();
        });
    };

    var describeUser = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        if (!data.curvePublic || !data.data) { return void cb({error: 'MISSING_DATA'}); }
        var state = team.roster.getState();
        var user = state.members[data.curvePublic];

        // It it is an ownership revocation, we have to set it in pad metadata first
        if (user.role === "OWNER" && data.data.role !== "OWNER") {
            revokeOwnership(ctx, teamId, user, function (err) {
                if (!err) { return; }
                console.error(err);
                return void cb({error: err});
            });
            return;
        }

        var obj = {};
        obj[data.curvePublic] = data.data;
        team.roster.describe(obj, function (err) {
            if (err) { return void cb({error: err}); }
            cb();
        });
    };

    // TODO send guest keys only in the future
    var getInviteData = function (ctx, teamId) {
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return {}; }
        var data = Util.clone(teamData);
        delete data.owner;
        return data;
    };

    var inviteToTeam = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var user = data.user;
        if (!user || !user.curvePublic || !user.notifications) { return void cb({error: 'MISSING_DATA'}); }
        delete user.channel;
        delete user.lastKnownHash;
        user.pending = true;

        var obj = {};
        obj[user.curvePublic] = user;
        team.roster.add(obj, function (err) {
            if (err && err !== 'NO_CHANGE') { return void cb({error: err}); }
            ctx.store.mailbox.sendTo('INVITE_TO_TEAM', {
                user: Messaging.createData(ctx.store.proxy, false),
                team: getInviteData(ctx, teamId)
            }, {
                channel: user.notifications,
                curvePublic: user.curvePublic
            }, function (obj) {
                cb(obj);
            });
        });
    };

    var removeUser = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        if (!data.curvePublic) { return void cb({error: 'MISSING_DATA'}); }

        var state = team.roster.getState();
        var userData = state.members[data.curvePublic];
        team.roster.remove([data.curvePublic], function (err) {
            if (err) { return void cb({error: err}); }
            // The user has been removed, send them a notification
            if (!userData || !userData.notifications) { return cb(); }
            ctx.store.mailbox.sendTo('KICKED_FROM_TEAM', {
                pending: data.pending,
                user: Messaging.createData(ctx.store.proxy, false),
                teamChannel: getInviteData(ctx, teamId).channel,
                teamName: getInviteData(ctx, teamId).metadata.name
            }, {
                channel: userData.notifications,
                curvePublic: userData.curvePublic
            }, function (obj) {
                cb(obj);
            });
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
        // And leave the chat channel
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
        var onUpdate = function () {
            ctx.emit('ROSTER_CHANGE', data.teamId, team.clients);
        };
        ctx.store.messenger.openTeamChat(team.getChatData(), onUpdate, cId, cb);
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
            teams: {},
            updateMetadata: cfg.updateMetadata
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
                    owner: teams[id].owner,
                    name: teams[id].metadata.name,
                    edPublic: Util.find(teams[id], ['keys', 'drive', 'edPublic']),
                    avatar: Util.find(teams[id], ['metadata', 'avatar'])
                };
            });
            return t;
        };
        team.getTeams = function () {
            return Object.keys(ctx.teams);
        };
        team.removeFromTeam = function (teamId, curve) {
            if (!teams[teamId]) { return; }
            if (ctx.onReadyHandlers[teamId]) {
                ctx.onReadyHandlers[teamId].push({cb : function () {
                    ctx.teams[teamId].roster.remove([curve], function (err) {
                        if (err && err !== 'NO_CHANGE') { console.error(err); }
                    });
                }});
                return;
            }
            var team = ctx.teams[teamId];
            if (!team) { return void console.error("TEAM MODULE ERROR"); }
            team.roster.remove([curve], function (err) {
                if (err && err !== 'NO_CHANGE') { console.error(err); }
            });

        };
        team.updateMyData = function (data) {
            Object.keys(ctx.teams).forEach(function (id) {
                var team = ctx.teams[id];
                if (!team.roster) { return; }
                var obj = {};
                obj[data.curvePublic] = data;
                team.roster.describe(obj, function (err) {
                    if (err) { console.error(err); }
                });
            });
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
            if (cmd === 'GET_TEAM_ROSTER') {
                return void getTeamRoster(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_TEAM_METADATA') {
                return void getTeamMetadata(ctx, data, clientId, cb);
            }
            if (cmd === 'SET_TEAM_METADATA') {
                return void setTeamMetadata(ctx, data, clientId, cb);
            }
            if (cmd === 'OFFER_OWNERSHIP') {
                return void offerOwnership(ctx, data, clientId, cb);
            }
            if (cmd === 'ANSWER_OWNERSHIP') {
                return void answerOwnership(ctx, data, clientId, cb);
            }
            if (cmd === 'DESCRIBE_USER') {
                return void describeUser(ctx, data, clientId, cb);
            }
            if (cmd === 'INVITE_TO_TEAM') {
                return void inviteToTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'LEAVE_TEAM') {
                return void leaveTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'JOIN_TEAM') {
                return void joinTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'REMOVE_USER') {
                return void removeUser(ctx, data, clientId, cb);
            }
            if (cmd === 'DELETE_TEAM') {
                return void deleteTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_TEAM') {
                return void createTeam(ctx, data, clientId, cb);
            }
        };

        return team;
    };

    return Team;
});



