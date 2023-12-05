// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    '/common/common-feedback.js',
    '/common/outer/invitation.js',
    '/common/cryptget.js',
    '/common/outer/cache-store.js',

    'chainpad-listmap',
    '/components/chainpad-crypto/crypto.js',
    'chainpad-netflux',
    '/components/chainpad/chainpad.dist.js',
    '/components/nthen/index.js',
    '/components/saferphore/index.js',
    '/components/tweetnacl/nacl-fast.min.js',
], function (Util, Hash, Constants, Realtime,
             ProxyManager, UserObject, SF, Roster, Messaging, Feedback, Invite, Crypt, Cache,
             Listmap, Crypto, CpNetflux, ChainPad, nThen, Saferphore) {
    var Team = {};

    var Nacl = window.nacl;
    var onStoreReady = Util.mkEvent(true);
    var openCachedTeamChat = function () {}; // Placeholder

    var registerChangeEvents = function (ctx, team, proxy, fId) {
        if (!team) { return; }
        if (!fId) {
            // Listen for shared folder password change
            proxy.on('change', ['drive', UserObject.SHARED_FOLDERS], function (o, n, p) {
                if (p.length > 3 && p[3] === 'password') {
                    var id = p[2];
                    var data = proxy.drive[UserObject.SHARED_FOLDERS][id];
                    var href = team.manager.user.userObject.getHref ?
                            team.manager.user.userObject.getHref(data) : data.href;
                    var parsed = Hash.parsePadUrl(href);
                    var secret = Hash.getSecrets(parsed.type, parsed.hash, o);
                    // We've received a new password, we should update it locally
                    // NOTE: this is an async call because new password means new roHref!
                    // We need to wait for the new roHref in the proxy before calling the handlers
                    // because a read-only team will use it when connecting to the new channel
                    setTimeout(function () {
                        SF.updatePassword(ctx.Store, {
                            oldChannel: secret.channel,
                            password: n,
                            href: href
                        }, ctx.store.network, function () {
                            console.log('Shared folder password changed');
                        });
                    });
                    return false;
                }
            });
            proxy.on('disconnect', function () {
                team.offline = true;
                team.sendEvent('NETWORK_DISCONNECT', team.id);
            });
            proxy.on('reconnect', function () {
                team.offline = false;
                team.sendEvent('NETWORK_RECONNECT', team.id);
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
            if (o && !n && Array.isArray(p) && (p[0] === UserObject.FILES_DATA ||
                (p[0] === 'drive' && p[1] === UserObject.FILES_DATA))) {
                setTimeout(function () {
                    ctx.Store.checkDeletedPad(o && o.channel);
                });
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
        team.stopped = true;
        delete ctx.teams[teamId];
        delete ctx.cache[teamId];
        delete ctx.store.proxy.teams[teamId];
        ctx.emit('LEAVE_TEAM', teamId, team.clients);
        ctx.updateMetadata();
        if (ctx.store.calendar) {
            ctx.store.calendar.closeTeam(teamId);
        }
        if (ctx.store.mailbox) {
            ctx.store.mailbox.close('team-'+teamId, function () {
                // Close team mailbox
            });
        }
    };

    var getTeamChannelList = function (ctx, id) {
        // Get the list of pads' channel ID in your drive
        // This list is filtered so that it doesn't include pad owned by other users
        // It now includes channels from shared folders
        var store = ctx.teams[id];
        if (!store) { return null; }
        var list = store.manager.getChannelsList('pin');

        var team = ctx.store.proxy.teams[id];
        list.push(`${team.channel}#drive`);
        var chatChannel = Util.find(team, ['keys', 'chat', 'channel']);
        var membersChannel = Util.find(team, ['keys', 'roster', 'channel']);
        var mailboxChannel = Util.find(team, ['keys', 'mailbox', 'channel']);
        if (chatChannel) { list.push(chatChannel); }
        if (membersChannel) { list.push(membersChannel); }
        if (mailboxChannel) { list.push(mailboxChannel); }

        if (store.proxy.calendars) {
            var cList = Object.keys(store.proxy.calendars).map(function (c) {
                return store.proxy.calendars[c].channel;
            });
            list = list.concat(cList);
        }

        var state = store.roster.getState();
        if (state.members) {
            Object.keys(state.members).forEach(function (curve) {
                var m = state.members[curve];
                if (m.inviteChannel && m.pending) { list.push(m.inviteChannel); }
                if (m.previewChannel && m.pending) { list.push(m.previewChannel); }
            });
        }

        list.sort();
        return list;
    };

    var handleSharedFolder = function (ctx, id, sfId, rt) {
        var t = ctx.teams[id];
        if (!t) { return; }
        if (!rt) {
            delete t.sharedFolders[sfId];
            return;
        }
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
                if (team && team.onRpcReadyEvt) { team.onRpcReadyEvt.fire(); }
                cb();
            }, Cache);
        });
    };

    var onCacheReady = function (ctx, id, lm, roster, keys, cId, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        if (ctx.cache[id]) { return void cb(); }
        var proxy = lm.proxy;
        var team = {
            id: id,
            proxy: proxy,
            listmap: lm,
            clients: [],
            realtime: lm.realtime,
            handleSharedFolder: function (sfId, rt) { handleSharedFolder(ctx, id, sfId, rt); },
            sharedFolders: {}, // equivalent of store.sharedFolders in async-store
            roster: roster,
            onRpcReadyEvt: Util.mkEvent(true),
            offline: true
        };
        ctx.cache[id] = team;

        // Subscribe to events
        if (cId) { team.clients.push(cId); }

        // Listen for roster changes
        roster.on('change', function () {
            var state = roster.getState();
            var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
            if (!state.members || !Object.keys(state.members).length) {
                // invalid roster, don't leave the team
                console.error(JSON.stringify(state));
                return;
            }
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

        // Broadcast an event to all the tabs displaying this team
        team.sendEvent = function (q, data, sender) {
            ctx.emit(q, data, team.clients.filter(function (cId) {
                return cId !== sender;
            }));
        };

        // Provide team chat keys to the messenger app
        team.getChatData = function () {
            var chatKeys = keys.chat || {};
            var hash = chatKeys.edit || chatKeys.view;
            if (!hash) { return {}; }
            var secret = Hash.getSecrets('chat', hash);
            return {
                teamId: id,
                channel: secret.channel,
                secret: secret,
                validateKey: chatKeys.validateKey
            };
        };

        team.pin = function (data, cb) {
            if (!keys.drive.edPrivate) { return void cb({error: 'EFORBIDDEN'}); }
            if (!team.rpc) { return void cb({error: 'TEAM_RPC_NOT_READY'}); }
            if (typeof(cb) !== 'function') { console.error('expected a callback'); }
            team.rpc.pin(data, function (e, hash) {
                if (e) { return void cb({error: e}); }
                cb({hash: hash});
            });
        };
        team.unpin = function (data, cb) {
            if (!keys.drive.edPrivate) { return void cb({error: 'EFORBIDDEN'}); }
            if (!team.rpc) { return void cb({error: 'TEAM_RPC_NOT_READY'}); }
            if (typeof(cb) !== 'function') { console.error('expected a callback'); }
            team.rpc.unpin(data, function (e, hash) {
                if (e) { return void cb({error: e}); }
                cb({hash: hash});
            });
        };

        // Create the proxy manager
        var loadSharedFolder = function (id, data, cb, isNew) {
            SF.load({
                isNew: isNew,
                network: ctx.store.network || ctx.store.networkPromise,
                store: team,
                isNewChannel: ctx.Store.isNewChannel,
                Store: ctx.Store
            }, id, data, cb);
        };
        var teamData = ctx.store.proxy.teams[team.id];
        var hash = teamData.hash || teamData.roHash;
        var secret = Hash.getSecrets('team', hash, teamData.password);
        var manager = team.manager = ProxyManager.create(proxy.drive, {
            onSync: function (cb) { ctx.Store.onSync(id, cb); },
            edPublic: keys.drive.edPublic,
            pin: team.pin,
            unpin: team.unpin,
            loadSharedFolder: loadSharedFolder,
            settings: {
                drive: Util.find(ctx.store, ['proxy', 'settings', 'drive'])
            },
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
            Store: ctx.Store,
            store: ctx.store
        }, {
            teamId: team.id,
            outer: true,
            edPublic: keys.drive.edPublic,
            loggedIn: true,
            log: function (msg) {
                // broadcast to all drive apps
                team.sendEvent("DRIVE_LOG", msg);
            },
            rt: team.realtime,
            editKey: secret.keys.secondaryKey,
            readOnly: Boolean(!secret.keys.secondaryKey)
        });
        team.secondaryKey = secret && secret.keys.secondaryKey;
        team.userObject = manager.user.userObject;

        nThen(function (waitFor) {
            // Load the shared folders
            ctx.teams[id] = team;
            registerChangeEvents(ctx, team, proxy);
            var network = ctx.store.network || ctx.store.networkPromise;
            SF.loadSharedFolders(ctx.Store, network, team,
                                team.userObject, waitFor, function (data) {
                ctx.progress += 70/(ctx.numberOfTeams * data.max);
                ctx.updateProgress({
                    progress: ctx.progress
                });
            }, true);
        }).nThen(function () {
            if (ctx.store.modules.calendar) { ctx.store.modules.calendar.openTeam(id); }
            cb();
        });
    };

    var onReady = function (ctx, id, lm, roster, keys, cId, cb) {
        // Update metadata
        var state = roster.getState();
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', id]);
        if (teamData) { teamData.metadata = state.metadata; }

        var team;
        if (!ctx.store.proxy.teams[id]) { return; }
        nThen(function (waitFor) {
            onCacheReady(ctx, id, lm, roster, keys, cId, waitFor());
            team = ctx.teams[id] || ctx.cache[id];

            // Init Team RPC
            if (!keys.drive.edPrivate) { return; }
            initRpc(ctx, team, keys.drive, waitFor(function () {}));
        }).nThen(function (waitFor) {
            // Load the shared folders
            team.userObject.fixFiles();
            SF.checkMigration(team.secondaryKey, team.proxy, team.userObject, waitFor());
            SF.loadSharedFolders(ctx.Store, ctx.store.network, team,
                                team.userObject, waitFor, function (data) {
                ctx.progress += 70/(ctx.numberOfTeams * data.max);
                ctx.updateProgress({
                    progress: ctx.progress
                });
            });
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
            team.offline = false;
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
            if (ctx.store.modules.calendar) { ctx.store.modules.calendar.openTeam(id); }
            cb();
        });

    };

    var checkTeamChannels = function (ctx, id, channel, roster, waitFor, cb) {
        var close = function () {
            if (ctx.cache[id] || ctx.teams[id]) { closeTeam(ctx, id); }
            delete ctx.store.proxy.teams[id];
            delete ctx.onReadyHandlers[id];
            waitFor.abort();
            cb({error: 'ENOENT'});
        };
        if (channel) {
            ctx.store.anon_rpc.send("IS_NEW_CHANNEL", channel, waitFor(function (e, res) {
                if (res && res.length && typeof(res[0]) === 'object' && res[0].isNew) {
                    // Channel is empty: remove this team
                    close();
                }
            }));
        }
        if (roster) {
            ctx.store.anon_rpc.send("IS_NEW_CHANNEL", roster, waitFor(function (e, res) {
                if (res && res.length && typeof(res[0]) === 'object' && res[0].isNew) {
                    // Channel is empty: remove this team
                    close();
                }
            }));
        }
    };

    // Progress:
    // One team = (30/(#teams))%
    // One shared folder = (70/(#teams * #folders))%
    var openChannel = function (ctx, teamData, id, _cb, cache) {
        var cb = Util.once(Util.mkAsync(_cb));

        var hash = teamData.hash || teamData.roHash;
        var secret = Hash.getSecrets('team', hash, teamData.password);
        var crypto = Crypto.createEncryptor(secret.keys);

        if (!teamData.roHash) {
            teamData.roHash = Hash.getViewHashFromKeys(secret);
        }

        var keys = teamData.keys;
        if (!keys.chat.validateKey && keys.chat.edit) {
            var chatSecret = Hash.getSecrets('chat', keys.chat.edit);
            keys.chat.validateKey = chatSecret.keys.validateKey;
        }


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
            if (cache) {
                // If we're in cache mode, make sure we have a cache for this team
                Cache.getChannelCache(secret.channel, waitFor(function (err, obj) {
                    var c = obj && obj.c; // content
                    if (!c) {
                        waitFor.abort();
                        cb({error: 'NOCACHE_DRIVE'});
                    }
                }));
                Cache.getChannelCache(rosterKeys.channel, waitFor(function (err, obj) {
                    var c = obj && obj.c; // content
                    var k = obj && obj.k;
                    if (k && !rosterKeys.teamEdPublic) {
                        rosterKeys.teamEdPublic = k;
                    }
                    if (!c) {
                        waitFor.abort();
                        cb({error: 'NOCACHE_ROSTER'});
                    }
                }));
                return;
            }
            checkTeamChannels(ctx, id, secret.channel, rosterKeys.channel, waitFor, cb);
        }).nThen(function (waitFor) {
            var cacheRdy = {
                lm: false,
                roster: false,
                check: function () {
                    if (!this.lm || !this.roster) { return; }
                    if (!cache) { return; }
                    // Both are cacheready!
                    ctx.progress += 30/ctx.numberOfTeams;
                    ctx.updateProgress({
                        progress: ctx.progress
                    });
                    onCacheReady(ctx, id, lm, roster, keys, null, waitFor(cb));
                    this.check = function () {};
                }
            };

            // Load the proxy
            var cfg = {
                data: {},
                readOnly: !Boolean(secret.keys.signKey),
                network: ctx.store.network || ctx.store.networkPromise,
                channel: secret.channel,
                crypto: crypto,
                ChainPad: ChainPad,
                Cache: Cache,
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
            lm.proxy.on('cacheready', function () {
                cacheRdy.lm = true;
                cacheRdy.check();
            });
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
                network: ctx.store.network || ctx.store.networkPromise,
                channel: rosterKeys.channel,
                keys: rosterKeys,
                store: ctx.store,
                lastKnownHash: rosterData.lastKnownHash,
                onCacheReady: function (_roster) {
                    if (!cache) { return; }
                    if (_roster && _roster.error === "CORRUPTED") {
                        console.error('Corrupted roster cache, cant load this team offline', teamData);
                        if (lm && typeof(lm.stop) === "function") { lm.stop(); }
                        waitFor.abort();
                        cb({error: 'CACHE_CORRUPTED_ROSTER'});
                        return;
                    }
                    roster = _roster;
                    cacheRdy.roster = true;
                    cacheRdy.check();
                },
                Cache: Cache
            }, waitFor(function (err, _roster) {
                if (err) {
                    waitFor.abort();
                    console.error(err);
                    return void cb({error: 'ROSTER_ERROR'});
                }
                roster = _roster;

                rosterData.lastKnownHash = roster.getLastCheckpointHash();

                // If we've been kicked, don't try to update our data, we'll close everything
                // in the next nThen part
                var state = roster.getState();
                var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
                if (!state.members[me]) { return; }

                onStoreReady.reg(function () {
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
                });
            }));
        }).nThen(function (waitFor) {
            // Make sure we have not been kicked from the roster
            var state = roster.getState();
            var me = Util.find(ctx, ['store', 'proxy', 'curvePublic']);
            // FIXME roster history temporarily corrupted, don't leave the team
            if (!state.members || !Object.keys(state.members).length) {
                lm.stop();
                roster.stop();
                lm.proxy = {};
                cb({error: 'EINVAL'});
                waitFor.abort();
                console.error(JSON.stringify(state));
                Feedback.send("ROSTER_CORRUPTED");
                return;
            }
            // Kicked from the team
            if (!state.members[me]) {
                lm.stop();
                roster.stop();
                lm.proxy = {};
                delete ctx.store.proxy.teams[id];
                ctx.updateMetadata();
                cb({error: 'EFORBIDDEN'});
                waitFor.abort();
                return;
            }
            // Check access rights
            // If we're not a viewer, make sure we have edit rights
            var s = state.members[me];
            var teamEdPrivate = Util.find(teamData, ['keys', 'drive', 'edPrivate']);
            if ((!teamData.hash || !teamEdPrivate) && ['ADMIN', 'MEMBER'].indexOf(s.role) !== -1) {
                console.warn("Missing edit rights: demote to viewer");
                var data = {};
                data[ctx.store.proxy.curvePublic] = {
                    role: "VIEWER"
                };
                roster.describe(data, function (err) {
                    Feedback.send("TEAM_RIGHTS_FIXED");
                    // Make sure we've removed all the keys
                    delete teamData.hash;
                    delete teamData.keys.drive.edPrivate;
                    delete teamData.keys.chat.edit;
                    if (!err) { return; }
                    if (err === 'NO_CHANGE') { return; }
                    console.error(err);
                });
            } else if ((!teamData.hash || !teamEdPrivate) && s.role === "OWNER") {
                Feedback.send("TEAM_RIGHTS_OWNER");
            }
        }).nThen(function () {
            if (!cache) {
                ctx.progress += 30/ctx.numberOfTeams;
                ctx.updateProgress({
                    progress: ctx.progress
                });
            }
            onReady(ctx, id, lm, roster, keys, null, cb);
        });
    };

    var createTeam = function (ctx, data, cId, _cb) {
        var cb = Util.once(_cb);

        var password = Hash.createChannelId();
        var hash = Hash.createRandomHash('team', password);
        var secret = Hash.getSecrets('team', hash, password);
        var roHash = Hash.getViewHashFromKeys(secret);
        var keyPair = Nacl.sign.keyPair(); // keyPair.secretKey , keyPair.publicKey

        var curvePair = Nacl.box.keyPair();

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
            Cache: Cache,
            owners: [ctx.store.proxy.edPublic]
        };
        nThen(function (waitFor) {
            // Initialize the roster
            Roster.create({
                network: ctx.store.network || ctx.store.networkPromise,
                channel: rosterKeys.channel, //sharedConfig.rosterChannel,
                owners: [ctx.store.proxy.edPublic],
                keys: rosterKeys,
                store: ctx.store,
                lastKnownHash: void 0,
                newTeam: true,
                Cache: Cache
            }, waitFor(function (err, _roster) {
                if (err) {
                    waitFor.abort();
                    console.error(err);
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
            proxy.version = 2; // No migration needed
            proxy.on('ready', function () {
                // Store keys in our drive
                var keys = {
                    mailbox: {
                        channel: Hash.createChannelId(),
                        viewed: [],
                        keys: {
                            curvePrivate: Nacl.util.encodeBase64(curvePair.secretKey),
                            curvePublic: Nacl.util.encodeBase64(curvePair.publicKey)
                        }
                    },
                    drive: {
                        edPrivate: Nacl.util.encodeBase64(keyPair.secretKey),
                        edPublic: Nacl.util.encodeBase64(keyPair.publicKey)
                    },
                    chat: {
                        edit: chatHashes.editHash,
                        view: chatHashes.viewHash,
                        validateKey: chatSecret.keys.validateKey,
                        channel: chatSecret.channel
                    },
                    roster: {
                        channel: rosterKeys.channel,
                        edit: rosterSeed,
                        view: rosterKeys.viewKeyStr,
                    }
                };
                var t = ctx.store.proxy.teams[id] = {
                    owner: true,
                    channel: secret.channel,
                    hash: hash,
                    roHash: roHash,
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
                    Feedback.send('TEAM_CREATION');
                    ctx.store.mailbox.open('team-'+id, t.keys.mailbox, function () {
                        // Team mailbox loaded
                    }, true, {
                        owners: t.keys.drive.edPublic
                    });
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
                        // Don't check server metadata for blobs
                        if (c.length !== 32) { return; }
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
            // Delete the mailbox
            var mailboxChan = Util.find(teamData, ['keys', 'mailbox', 'channel']);
            team.rpc.removeOwnedChannel(mailboxChan, waitFor(function (err) {
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
            Feedback.send('TEAM_DELETION');
            closeTeam(ctx, teamId);
            cb();
        });
    };

    var joinTeam = function (ctx, data, cId, cb) {
        var team = data.team;
        if (!(team.hash || team.roHash) || !team.channel || !team.password
            || !team.keys || !team.metadata) { return void cb({error: 'EINVAL'}); }
        var id = Util.createRandomInteger();
        ctx.store.proxy.teams[id] = team;
        ctx.onReadyHandlers[id] = [];
        openChannel(ctx, team, id, function (obj) {
            if (!(obj && obj.error)) { console.debug('Team joined:' + id); }
            var t = ctx.store.proxy.teams[id];
            ctx.store.mailbox.open('team-'+id, t.keys.mailbox, function () {
                // Team mailbox loaded
            }, true, {
                owners: t.keys.drive.edPublic
            });
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

        var md;
        nThen(function (waitFor) {
            // Get pending owners
            ctx.Store.getPadMetadata(null, {
                channel: teamData.channel
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    md = team.listmap.metadata || {};
                    return;
                }
                md = obj;
            }));
        }).nThen(function () {
            ctx.pending_owners = md.pending_owners;
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
            if (ctx.store.messenger) {
                var chatData = team.getChatData();
                var online = ctx.store.messenger.getOnlineList(chatData.channel) || [];
                online.forEach(function (curve) {
                    if (members[curve]) {
                        members[curve].online = true;
                    }
                });
            }

            // Decrypt hash for invite links
            Object.keys(members).forEach(function (curve) {
                var member = members[curve];
                if (!member.inviteChannel) { return; }
                if (!member.hash) { return; }
                if (!teamData.hash) { delete member.hash; return; }
                try {
                    member.hash = Invite.decryptHash(member.hash, teamData.hash);
                } catch (e) { console.error(e); }
            });

            cb(members);
        });
    };

    // Return folders with edit rights available to everybody (decrypted pad href)
    var getEditableFolders = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        var folders = team.manager.folders || {};
        var ids = Object.keys(folders).filter(function (id) {
            return !folders[id].proxy.version;
        });
        cb(ids.map(function (id) {
            var uo = Util.find(team, ['user', 'userObject']);
            return {
                name: Util.find(folders, [id, 'proxy', 'metadata', 'title']),
                path: uo ? uo.findFile(id)[0] : []
            };
        }));
    };

    var getTeamMetadata = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        var state = team.roster.getState() || {};
        var md = state.metadata || {};
        md.offline = team.offline;
        cb(md);
    };

    var setTeamMetadata = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }
        if (team.offline) { return void cb({error: 'OFFLINE'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        if (data.metadata) { delete data.metadata.offline; }
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
            ctx.store.mailbox.sendTo("ADD_OWNER", {
                teamChannel: teamData.channel,
                chatChannel: Util.find(teamData, ['keys', 'chat', 'channel']),
                rosterChannel: Util.find(teamData, ['keys', 'roster', 'channel']),
                title: teamData.metadata.name
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
        var isPendingOwner = user.pendingOwner;
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
            ctx.store.mailbox.sendTo("RM_OWNER", {
                teamChannel: teamData.channel,
                title: teamData.metadata.name,
                pending: isPendingOwner
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

    var getInviteData = function (ctx, teamId, edit) {
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return {}; }
        var data = Util.clone(teamData);
        if (!edit) {
            // Delete edit keys
            delete data.hash;
            delete data.keys.drive.edPrivate;
            delete data.keys.chat.edit;
        }
        // Delete owner key
        delete data.owner;
        return data;
    };

    // Update my edit rights in listmap (only upgrade) and userObject (upgrade and downgrade)
    // We also need to propagate the changes to the shared folders
    var updateMyRights = function (ctx, teamId, hash) {
        if (!teamId) { return true; }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return true; }
        var team = ctx.teams[teamId];
        if (!team) { return true; }

        var secret = Hash.getSecrets('team', hash || teamData.roHash, teamData.password);
        // Upgrade the listmap if we can
        SF.upgrade(teamData.channel, secret);
        // Set the new readOnly value in userObject
        if (team.userObject) {
            team.userObject.setReadOnly(!secret.keys.secondaryKey, secret.keys.secondaryKey);
        }

        // Upgrade? update calendar rights
        if (secret.keys.secondaryKey) {
            try {
                ctx.store.modules.calendar.upgradeTeam(teamId);
            } catch (e) { console.error(e); }
        }

        if (!secret.keys.secondaryKey && team.rpc) {
            team.rpc.destroy();
        }

        // Upgrade the shared folders
        var folders = Util.find(team, ['proxy', 'drive', 'sharedFolders']);
        Object.keys(folders || {}).forEach(function (sfId) {
            var data = team.manager.getSharedFolderData(sfId);
            var parsed = Hash.parsePadUrl(data.href || data.roHref);
            var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
            SF.upgrade(secret.channel, secret);
            var uo = Util.find(team, ['manager', 'folders', sfId, 'userObject']);
            if (uo) {
                uo.setReadOnly(!secret.keys.secondaryKey, secret.keys.secondaryKey);
            }
        });
        ctx.updateMetadata();
        ctx.emit('ROSTER_CHANGE_RIGHTS', teamId, team.clients);
    };

    var changeMyRights = function (ctx, teamId, state, data, cb) {
        if (!teamId) { return void cb(false); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb(false); }
        var onReady = ctx.onReadyHandlers[teamId];
        var team = ctx.teams[teamId];

        if (teamData.channel !== data.channel || teamData.password !== data.password) { return void cb(false); }

        // Update our proxy
        if (state) {
            teamData.hash = data.hash;
            teamData.keys.drive.edPrivate = data.keys.drive.edPrivate;
            teamData.keys.chat.edit = data.keys.chat.edit;
        } else {
            delete teamData.hash;
            delete teamData.keys.drive.edPrivate;
            delete teamData.keys.chat.edit;
        }

        // Team not ready yet: try again onReady
        if (!team && Array.isArray(onReady)) {
            onReady.push({
                cb: function () {
                    changeMyRights(ctx, teamId, state, data, cb);
                }
            });
            return;
        }

        // No team and not initialized at all...
        if (!team) { return void cb(false); }

        // Team is initialized and ready: update the loaded elements
        if (state) {
            initRpc(ctx, team, teamData.keys.drive, function () {
                team.manager.addPin(team.pin, team.unpin);
            });

            var secret = Hash.getSecrets('team', data.hash, teamData.password);
            team.secondaryKey = secret && secret.keys.secondaryKey;

            var crypto = Crypto.createEncryptor(secret.keys);
            team.listmap.setReadOnly(false, crypto);
        } else {
            delete team.secondaryKey;
            if (team.rpc && team.rpc.destroy) {
                team.rpc.destroy();
            }
            team.manager.removePin();
            team.listmap.setReadOnly(true);
        }

        updateMyRights(ctx, teamId, data.hash);
        cb(true);
    };
    var changeEditRights = function (ctx, teamId, user, state, cb) {
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        if (!teamData) { return void cb ({error: 'ENOENT'}); }
        var team = ctx.teams[teamId];
        if (!team) { return void cb ({error: 'ENOENT'}); }

        // Send mailbox to offer ownership
        ctx.store.mailbox.sendTo("TEAM_EDIT_RIGHTS", {
            state: state,
            teamData: getInviteData(ctx, teamId, state)
        }, {
            channel: user.notifications,
            curvePublic: user.curvePublic
        }, cb);
    };

    var describeUser = function (ctx, data, cId, cb) {
        var teamId = data.teamId;
        if (!teamId) { return void cb({error: 'EINVAL'}); }
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        var team = ctx.teams[teamId];
        if (!teamData || !team) { return void cb ({error: 'ENOENT'}); }
        if (!team.roster) { return void cb({error: 'NO_ROSTER'}); }
        if (!data.curvePublic || !data.data) { return void cb({error: 'MISSING_DATA'}); }
        var state = team.roster.getState();
        var user = state.members[data.curvePublic];

        var md;
        nThen(function (waitFor) {
            // Get pending owners
            ctx.Store.getPadMetadata(null, {
                channel: teamData.channel
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    md = team.listmap.metadata || {};
                    return;
                }
                md = obj;
            }));
        }).nThen(function () {
            user.pendingOwner = Array.isArray(md.pending_owners) &&
                                md.pending_owners.indexOf(user.edPublic) !== -1;

            // It it is an ownership revocation, we have to set it in pad metadata first
            if (user.role === "OWNER" && data.data.role !== "OWNER") {
                revokeOwnership(ctx, teamId, user, function (err) {
                    if (!err) { return void cb(); }
                    console.error(err);
                    return void cb({error: err});
                });
                return;
            }

            // Viewer to editor
            if (user.role === "VIEWER" && data.data.role !== "VIEWER") {
                changeEditRights(ctx, teamId, user, true, function (obj) {
                    return void cb(obj);
                });
            }

            // Editor to viewer
            if (user.role !== "VIEWER" && data.data.role === "VIEWER") {
                changeEditRights(ctx, teamId, user, false, function (obj) {
                    return void cb(obj);
                });
            }

            var obj = {};
            obj[data.curvePublic] = data.data;
            team.roster.describe(obj, function (err) {
                if (err) { return void cb({error: err}); }
                cb();
            });
        });
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
        obj[user.curvePublic].role = 'VIEWER';
        team.roster.add(obj, function (err) {
            if (err && err !== 'NO_CHANGE') { return void cb({error: err}); }
            ctx.store.mailbox.sendTo('INVITE_TO_TEAM', {
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
        openCachedTeamChat = function () {};

        if (!id) { return void cb(); }
        // If the team is loading, add ourselves to the list
        if (ctx.onReadyHandlers[id] && !ctx.teams[id]) {
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
        if (ctx.store.messenger) {
            ctx.store.messenger.openTeamChat(team.getChatData(), onUpdate, cId, cb);
        } else {
            openCachedTeamChat = function () {
                ctx.store.messenger.openTeamChat(team.getChatData(), onUpdate, cId, cb);
            };
        }
    };

    var createInviteLink = function (ctx, data, cId, _cb) {
        var cb = Util.mkAsync(Util.once(_cb));

        var teamId = data.teamId;
        var team = ctx.teams[data.teamId];
        var seeds = data.seeds; // {scrypt, preview}
        var bytes64 = data.bytes64;

        if (!teamId || !team) { return void cb({error: 'EINVAL'}); }

        var roster = team.roster;

        var teamName;
        try {
            teamName = roster.getState().metadata.name;
        } catch (err) {
            return void cb({ error: "TEAM_NAME_ERR" });
        }

        var message = data.message;
        var name = data.name;

        //var password = data.password;
        var hash = data.hash;
        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        try {
            var encryptedHash = Invite.encryptHash(hash, teamData.hash);
        } catch (e) { console.error(e); }

        // derive { channel, cryptKey} for the preview content channel
        var previewKeys = Invite.derivePreviewKeys(seeds.preview);

        // derive {channel, cryptkey} for the invite content channel
        var inviteKeys = Invite.deriveInviteKeys(bytes64);

        // randomly generate ephemeral keys for ownership of the above content
        // and a placeholder in the roster
        var ephemeralKeys = Invite.generateKeys();

        // Initial role of the invited users
        var role = data.role || "VIEWER";
        var uses = data.uses || 1;

        nThen(function (w) {


            (function () {
                // a random signing keypair to prevent further writes to the channel
                // we don't need to remember it cause we're only writing once
                var sign = Invite.generateSignPair(); // { validateKey, signKey}
                var putOpts = {
                    initialState: '{}',
                    network: ctx.store.network,
                    metadata: {
                        owners: [ctx.store.proxy.edPublic, ephemeralKeys.edPublic]
                    }
                };
                putOpts.metadata.validateKey = sign.validateKey;

                // visible with only the invite link
                var previewContent = {
                    teamName: teamName,
                    message: message,
                    author: Messaging.createData(ctx.store.proxy, false),
                    displayName: name,
                };

                var cryptput_config = {
                    channel: previewKeys.channel,
                    type: 'pad',
                    version: 2,
                    keys: { // what would normally be provided by getSecrets
                        cryptKey: previewKeys.cryptKey,
                        validateKey: sign.validateKey, // sent to historyKeeper
                        signKey: sign.signKey, // b64EdPrivate
                    },
                };

                Crypt.put(cryptput_config, JSON.stringify(previewContent), w(function (err /*, doc */) {
                    if (err) {
                        console.error("CRYPTPUT_ERR", err);
                        w.abort();
                        return void cb({ error: "SET_PREVIEW_CONTENT" });
                    }
                }), putOpts);
            }());

            (function () {
                // a different random signing key so that the server can't correlate these documents
                // as components of an invite
                var sign = Invite.generateSignPair(); // { validateKey, signKey}
                var putOpts = {
                    initialState: '{}',
                    network: ctx.store.network,
                    metadata: {
                        owners: [ctx.store.proxy.edPublic, ephemeralKeys.edPublic]
                    }
                };
                putOpts.metadata.validateKey = sign.validateKey;




                // available only with the link and the content
                var inviteContent = {
                    teamData: getInviteData(ctx, teamId, role === "MEMBER"),
                    ephemeral: {
                        edPublic: ephemeralKeys.edPublic,
                        edPrivate: ephemeralKeys.edPrivate,
                        curvePublic: ephemeralKeys.curvePublic,
                        curvePrivate: ephemeralKeys.curvePrivate,
                    },
                };

                var cryptput_config = {
                    channel: inviteKeys.channel,
                    type: 'pad',
                    version: 2,
                    keys: {
                        cryptKey: inviteKeys.cryptKey,
                        validateKey: sign.validateKey,
                        signKey: sign.signKey,
                    },
                };

                Crypt.put(cryptput_config, JSON.stringify(inviteContent), w(function (err /*, doc */) {
                    if (err) {
                        console.error("CRYPTPUT_ERR", err);
                        w.abort();
                        return void cb({ error: "SET_PREVIEW_CONTENT" });
                    }
                }), putOpts);
            }());
        }).nThen(function (w) {
            team.pin([inviteKeys.channel, previewKeys.channel], function (obj) {
                if (obj && obj.error) { console.error(obj.error); }
            });
            Invite.createRosterEntry(team.roster, {
                curvePublic: ephemeralKeys.curvePublic,
                content: {
                    curvePublic: ephemeralKeys.curvePublic,
                    displayName: data.name,
                    pending: true,
                    remaining: uses,
                    totalUses: uses,
                    role: role,
                    hash: encryptedHash,
                    inviteChannel: inviteKeys.channel,
                    previewChannel: previewKeys.channel,
                }
            }, w(function (err) {
                if (err) {
                    w.abort();
                    cb(err);
                }
            }));
        }).nThen(function () {
            // call back empty if everything worked
            cb();
        });
    };

    var getPreviewContent = function (ctx, data, cId, cb) {
        var seeds = data.seeds;
        var previewKeys;
        try {
            previewKeys = Invite.derivePreviewKeys(seeds.preview);
        } catch (err) {
            return void cb({ error: "INVALID_SEEDS" });
        }
        Crypt.get({ // secrets
            channel: previewKeys.channel,
            type: 'pad',
            version: 2,
            keys: {
                cryptKey: previewKeys.cryptKey,
            },
        }, function (err, val) {
            if (err) { return void cb({ error: err }); }
            if (!val) { return void cb({ error: 'DELETED' }); }

            var json = Util.tryParse(val);
            if (!json) { return void cb({ error: "parseError" }); }
            cb(json);
        }, { // cryptget opts
            network: ctx.store.network,
            initialState: '{}',
        });
    };

    var getInviteContent = function (ctx, data, cId, cb) {
        var bytes64 = data.bytes64;
        var previewKeys;
        try {
            previewKeys = Invite.deriveInviteKeys(bytes64);
        } catch (err) {
            return void cb({ error: "INVALID_SEEDS" });
        }
        Crypt.get({ // secrets
            channel: previewKeys.channel,
            type: 'pad',
            version: 2,
            keys: {
                cryptKey: previewKeys.cryptKey,
            },
        }, function (err, val) {
            if (err) { return void cb({error: err}); }
            if (!val) { return void cb({error: 'DELETED'}); }

            var json = Util.tryParse(val);
            if (!json) { return void cb({error: "parseError"}); }
            cb(json);
        }, { // cryptget opts
            network: ctx.store.network,
            initialState: '{}',
        });
    };

    var acceptLinkInvitation = function (ctx, data, cId, cb) {
        var inviteContent;
        var rosterState;
        nThen(function (waitFor) {
            // Get team keys and ephemeral keys
            getInviteContent(ctx, data, cId, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
                inviteContent = obj;
            }));
        }).nThen(function (waitFor) {
            // Check if you're already a member of this team
            var chan = Util.find(inviteContent, ['teamData', 'channel']);
            var myTeams = ctx.store.proxy.teams || {};
            var isMember = Object.keys(myTeams).some(function (k) {
                var t = myTeams[k];
                return t.channel === chan;
            });
            if (isMember) {
                waitFor.abort();
                return void cb({error: 'ALREADY_MEMBER'});
            }
            // Accept the roster invitation: relplace our ephemeral keys with our user keys
            var rosterData = Util.find(inviteContent, ['teamData', 'keys', 'roster']);
            var myKeys = inviteContent.ephemeral;
            if (!rosterData || !myKeys) {
                waitFor.abort();
                return void cb({error: 'INVALID_INVITE_CONTENT'});
            }
            var rosterKeys = Crypto.Team.deriveMemberKeys(rosterData.edit, myKeys);
            Roster.create({
                network: ctx.store.network || ctx.store.networkPromise,
                channel: rosterData.channel,
                keys: rosterKeys,
                store: ctx.store,
                Cache: Cache
            }, waitFor(function (err, roster) {
                if (err) {
                    waitFor.abort();
                    console.error(err);
                    return void cb({error: 'ROSTER_ERROR'});
                }
                var myData = Messaging.createData(ctx.store.proxy, false);
                var state = roster.getState();
                rosterState = state.members[myKeys.curvePublic];
                roster.accept(myData.curvePublic, waitFor(function (err) {
                    roster.stop();
                    if (err) {
                        waitFor.abort();
                        console.error(err);
                        return void cb({error: 'ACCEPT_ERROR'});
                    }
                }));
            }));
        }).nThen(function () {
            var tempRpc = {};
            if (!rosterState.remaining || rosterState.remaining === 1) {
                initRpc(ctx, tempRpc, inviteContent.ephemeral, function (err) {
                    if (err) { return; }
                    var rpc = tempRpc.rpc;
                    if (rosterState.inviteChannel) {
                        rpc.removeOwnedChannel(rosterState.inviteChannel, function (err) {
                            if (err) { console.error(err); }
                        });
                    }
                    if (rosterState.previewChannel) {
                        rpc.removeOwnedChannel(rosterState.previewChannel, function (err) {
                            if (err) { console.error(err); }
                        });
                    }
                });
            }
            // Add the team to our list and join...
            joinTeam(ctx, {
                team: inviteContent.teamData
            }, cId, cb);
        });
    };

    var deriveMailbox = function (team) {
        if (!team) { return; }
        if (team.keys && team.keys.mailbox) { return team.keys.mailbox; }
        var strSeed = Util.find(team, ['keys', 'roster', 'edit']);
        if (!strSeed) { return; }
        var hash = Nacl.hash(Nacl.util.decodeUTF8(strSeed));
        var seed = hash.slice(0,32);
        var mailboxChannel = Util.uint8ArrayToHex(hash.slice(32,48));
        var curvePair = Nacl.box.keyPair.fromSecretKey(seed);
        return {
            channel: mailboxChannel,
            viewed: [],
            keys: {
                curvePrivate: Nacl.util.encodeBase64(curvePair.secretKey),
                curvePublic: Nacl.util.encodeBase64(curvePair.publicKey)
            }
        };
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
            cache: {},
            updateMetadata: cfg.updateMetadata,
            updateProgress: cfg.updateLoadingProgress,
            progress: 0
        };

        if (!store.proxy.teams) { store.proxy.teams = {}; }
        var teams = store.proxy.teams;

        ctx.numberOfTeams = Object.keys(teams).length;

        // Listen for changes in our access rights (if another worker receives edit access)
        ctx.store.proxy.on('change', ['teams'], function (o, n, p) {
            if (p[2] !== 'hash') { return; }
            updateMyRights(ctx, p[1], n);
        });
        ctx.store.proxy.on('remove', ['teams'], function (o, p) {
            if (p[2] !== 'hash') { return; }
            updateMyRights(ctx, p[1]);
        });

        var checkKeyPair = function (edPrivate, edPublic) {
            if (!edPrivate || !edPublic) { return true; }
            try {
                var secretKey = Nacl.util.decodeBase64(edPrivate);
                var pair = Nacl.sign.keyPair.fromSecretKey(secretKey);
                return Nacl.util.encodeBase64(pair.publicKey) === edPublic;
            } catch (e) {
                return false;
            }
        };

        // Remove duplicate teams
        var removeDuplicates = function () {
            var _teams = {};
            Object.keys(teams).forEach(function (id) {
                try {
                    var t = teams[id];
                    var _t = _teams[t.channel];

                    var edPrivate = Util.find(t, ['keys', 'drive', 'edPrivate']);
                    var edPublic = Util.find(t, ['keys', 'drive', 'edPublic']);

                    // If the edPrivate is corrupted, remove it
                    if (!edPublic) {
                        Feedback.send("TEAM_CORRUPTED_EDPUBLIC");
                    } else if (edPrivate && edPublic && !checkKeyPair(edPrivate, edPublic)) {
                        Feedback.send("TEAM_CORRUPTED_EDPRIVATE");
                        delete teams[id].keys.drive.edPrivate;
                        edPrivate = undefined;
                    }

                    // If the hash is corrupted, feedback
                    if (t.hash) {
                        var parsed = Hash.parseTypeHash('drive', t.hash);
                        if (parsed.version === 2 && t.hash.length !== 40) {
                            Feedback.send("TEAM_CORRUPTED_HASH");
                            // FIXME ?
                        }
                    }

                    // Not found yet? add to the list
                    if (!_t) {
                        _teams[t.channel] = id;
                        return;
                    }

                    // Duplicate found: update our team to add missing data
                    var best = teams[_t]; // This is a proxy!
                    var bestPrivate = Util.find(best, ['keys', 'drive', 'edPrivate']);
                    var bestChat = Util.find(best, ['keys', 'chat', 'edit']);
                    var chat = Util.find(t, ['keys', 'chat', 'edit']);
                    if (!best.hash && t.hash) {
                        best.hash = t.hash;
                    }
                    if (!bestPrivate && edPrivate) {
                        best.keys.drive.edPrivate = edPrivate;
                    }
                    if (!bestChat && chat) {
                        best.keys.chat.edit = chat;
                    }

                    // Deprecate the duplicate
                    ctx.store.proxy.duplicateTeams = ctx.store.proxy.duplicateTeams || {};
                    ctx.store.proxy.duplicateTeams[id] = teams[id];
                    delete teams[id];
                } catch (e) { console.error(e); }
            });
        };

        // Load teams
        Object.keys(teams).forEach(function (id) {
            ctx.onReadyHandlers[id] = [];
            if (!Util.find(teams, [id, 'keys', 'mailbox'])) {
                teams[id].keys.mailbox = deriveMailbox(teams[id]);
            }
            openChannel(ctx, teams[id], id, waitFor(function (err) {
                if (err) {
                    delete ctx.onReadyHandlers[id];
                    delete ctx.cache[id];
                    var txt = typeof(err) === "string" ? err : (err.type || err.message);
                    Feedback.send("TEAM_LOADING_ERROR="+txt);
                    return void console.error(err);
                }
                console.debug('Team '+id+' cache ready');
            }), true);
        });

        // Proxy is ready, check if our team list has changed
        team.onReady = function (waitFor) {
            removeDuplicates();

            // Close all the teams from our cache that have been removed and add waitFor to the
            // one that still exist
            var checkTeam = function (id) {
                if (!teams[id]) {
                    closeTeam(ctx, id);
                    delete ctx.onReadyHandlers[id];
                    return true;
                }
                return false;
            };
            Object.keys(ctx.teams).forEach(checkTeam);
            Object.keys(ctx.onReadyHandlers).forEach(function (id) {
                var closed = checkTeam(id);
                if (closed) { return; }
                var team = ctx.store.proxy.teams[id];
                var rosterChan = Util.find(team, ['keys', 'roster', 'channel']);
                var _cb = Util.once(Util.mkAsync(waitFor()));
                nThen(function (w) {
                    checkTeamChannels(ctx, id, team.channel, rosterChan, w, _cb);
                });
                ctx.onReadyHandlers[id].push({
                    cb: _cb
                });
            });

            // Load all the teams that weren't in our cache
            Object.keys(teams).forEach(function (id) {
                // Team already loaded? abort
                if (ctx.onReadyHandlers[id] || ctx.teams[id]) { return; }

                // Load team
                ctx.onReadyHandlers[id] = [];
                if (!Util.find(teams, [id, 'keys', 'mailbox'])) {
                    teams[id].keys.mailbox = deriveMailbox(teams[id]);
                }
                openChannel(ctx, teams[id], id, waitFor(function (err) {
                    if (err) {
                        var txt = typeof(err) === "string" ? err : (err.type || err.message);
                        Feedback.send("TEAM_LOADING_ERROR="+txt);
                        return void console.error(err);
                    }
                    console.debug('Team '+id+' ready');
                }));
            });

            openCachedTeamChat();
            onStoreReady.fire();
        };

        team.getTeam = function (id) {
            return ctx.teams[id];
        };
        team.getTeamsData = function (app) {
            var t = {};
            var safe = false;
            if (['drive', 'teams', 'settings'].indexOf(app) !== -1) { safe = true; }
            Object.keys(teams).forEach(function (id) {
                if (!ctx.teams[id]) { return; }
                var proxy = ctx.teams[id].proxy || {};
                var nPads = proxy.drive && Object.keys(proxy.drive.filesData || {}).length;
                var nSf = proxy.drive && Object.keys(proxy.drive.sharedFolders || {}).length;
                t[id] = {
                    owner: teams[id].owner,
                    name: teams[id].metadata.name,
                    channel: teams[id].channel,
                    numberPads: nPads,
                    numberSf: nSf,
                    roster: Util.find(teams[id], ['keys', 'roster', 'channel']),
                    edPublic: Util.find(teams[id], ['keys', 'drive', 'edPublic']),
                    avatar: Util.find(teams[id], ['metadata', 'avatar']),
                    viewer: !Util.find(teams[id], ['keys', 'drive', 'edPrivate']),
                    notifications: Util.find(teams[id], ['keys', 'mailbox', 'channel']),
                    curvePublic: Util.find(teams[id], ['keys', 'mailbox', 'keys', 'curvePublic']),
                    validKeys: checkKeyPair(Util.find(teams[id], ['keys', 'drive', 'edPrivate']), Util.find(teams[id], ['keys', 'drive', 'edPublic']))
                };
                if (safe && ctx.teams[id]) {
                    t[id].secondaryKey = ctx.teams[id].secondaryKey;
                }
                if (ctx.teams[id]) {
                    t[id].hasSecondaryKey = Boolean(ctx.teams[id].secondaryKey);
                }
            });
            return t;
        };
        team.getTeams = function () {
            return Object.keys(ctx.teams);
        };

        var isPending = function (teamId, curve) {
            var team = ctx.teams[teamId];
            if (!team) { return; }
            var state = team.roster && team.roster.getState();
            if (!state.members) { return; }
            var m = state.members[curve] || {};
            return m.pending;
        };
        team.removeFromTeam = function (teamId, curve, pendingOnly) {
            if (!teams[teamId]) { return; }

            // When receiving a negative answer to a team invitation, remove
            // the pending user from the roster.
            if (pendingOnly && !isPending(teamId, curve)) { return; }

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
        team.changeMyRights = function (id, edit, teamData, cb) {
            changeMyRights(ctx, id, edit, teamData, cb);
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
        var listTeams = function (cb) {
            var t = Util.clone(teams);
            Object.keys(t).forEach(function (id) {
                // If failure to load the team, don't send it
                if (ctx.teams[id]) {
                    t[id].offline = ctx.teams[id].offline;
                    return;
                }
                t[id].error = true;
            });
            cb(t);
        };
        team.execCommand = function (clientId, obj, cb) {

            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                // Only the team app will subscribe to events?
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'LIST_TEAMS') {
                return void listTeams(cb);
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
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void offerOwnership(ctx, data, clientId, cb);
            }
            if (cmd === 'ANSWER_OWNERSHIP') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void answerOwnership(ctx, data, clientId, cb);
            }
            if (cmd === 'DESCRIBE_USER') {
                return void describeUser(ctx, data, clientId, cb);
            }
            if (cmd === 'INVITE_TO_TEAM') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void inviteToTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'LEAVE_TEAM') {
                return void leaveTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'JOIN_TEAM') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void joinTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'REMOVE_USER') {
                return void removeUser(ctx, data, clientId, cb);
            }
            if (cmd === 'DELETE_TEAM') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void deleteTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_TEAM') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void createTeam(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_EDITABLE_FOLDERS') {
                return void getEditableFolders(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_INVITE_LINK') {
                return void createInviteLink(ctx, data, clientId, cb);
            }
            if (cmd === 'GET_PREVIEW_CONTENT') {
                return void getPreviewContent(ctx, data, clientId, cb);
            }
            if (cmd === 'ACCEPT_LINK_INVITATION') {
                if (ctx.store.offline) { return void cb({ error: 'OFFLINE' }); }
                return void acceptLinkInvitation(ctx, data, clientId, cb);
            }
        };

        return team;
    };

    Team.anonGetPreviewContent = function (cfg, data, cb) {
        getPreviewContent(cfg, data, null, cb);
    };

    return Team;
});



