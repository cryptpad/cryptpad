define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/userObject.js',
    '/bower_components/nthen/index.js',
], function (Util, Hash, UserObject, nThen) {
    var History = {};
    var commands = {};

    var getAccountChannels = function (ctx) {
        var channels = [];
        var edPublic = Util.find(ctx.store, ['proxy', 'edPublic']);

        // Drive
        var driveOwned = (Util.find(ctx.store, ['driveMetadata', 'owners']) || []).indexOf(edPublic) !== -1;
        if (driveOwned) {
            channels.push(ctx.store.driveChannel);
        }

        // Profile
        var profile = ctx.store.proxy.profile;
        if (profile) {
            var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit, null) : null;
            if (profileChan) { channels.push(profileChan); }
        }

        // Todo
        if (ctx.store.proxy.todo) {
            channels.push(Hash.hrefToHexChannelId('/todo/#' + ctx.store.proxy.todo, null));
        }


        // Mailboxes
        var mailboxes = ctx.store.proxy.mailboxes;
        if (mailboxes) {
            var mList = Object.keys(mailboxes).map(function (m) {
                return {
                    lastKnownHash: mailboxes[m].lastKnownHash,
                    channel: mailboxes[m].channel
                };
            });
            Array.prototype.push.apply(channels, mList);
        }

        // Shared folders owned by me
        var sf = ctx.store.proxy[UserObject.SHARED_FOLDERS];
        if (sf) {
            var sfChannels = Object.keys(sf).map(function (fId) {
                var data = sf[fId];
                if (!data || !data.owners) { return; }
                var isOwner = Array.isArray(data.owners) && data.owners.indexOf(edPublic) !== -1;
                if (!isOwner) { return; }
                return data.channel;
            }).filter(Boolean);
            Array.prototype.push.apply(channels, sfChannels);
        }

        return channels;
    };

    var getEdPublic = function (ctx, teamId) {
        if (!teamId) { return Util.find(ctx.store, ['proxy', 'edPublic']); }

        var teamData = Util.find(ctx, ['store', 'proxy', 'teams', teamId]);
        return Util.find(teamData, ['keys', 'drive', 'edPublic']);
    };
    var getRpc = function (ctx, teamId) {
        if (!teamId) { return ctx.store.rpc; }
        var teams = ctx.store.modules['team'];
        if (!teams) { return; }
        var team = teams.getTeam(teamId);
        if (!team) { return; }
        return team.rpc;
    };

    var getHistoryData = function (ctx, channel, lastKnownHash, teamId, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var edPublic = getEdPublic(ctx, teamId);
        var Store = ctx.Store;

        var total = 0;
        var history = 0;
        var metadata = 0;
        var hash;
        nThen(function (waitFor) {
            // Total size
            Store.getFileSize(null, {
                channel: channel
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
                if (typeof(obj.size) === "undefined") {
                    waitFor.abort();
                    return void cb({error: 'ENOENT'});
                }
                total = obj.size;
            }));
            // Pad
            Store.getHistory(null, {
                channel: channel,
                lastKnownHash: lastKnownHash
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
                if (!Array.isArray(obj)) {
                    waitFor.abort();
                    return void cb({error: 'EINVAL'});
                }

                if (!obj.length) { return; }

                hash = obj[0].hash;
                var messages = obj.map(function(data) {
                    return data.msg;
                });
                history = messages.join('\n').length;
            }), true);
            // Metadata
            Store.getPadMetadata(null, {
                channel: channel
            }, waitFor(function (obj) {
                if (obj && obj.error) { return; }
                if (!obj || typeof(obj) !== "object") { return; }
                metadata = JSON.stringify(obj).length;
                if (!obj || !Array.isArray(obj.owners) ||
                    obj.owners.indexOf(edPublic) === -1) {
                    waitFor.abort();
                    return void cb({error: 'INSUFFICIENT_PERMISSIONS'});
                }
            }));
        }).nThen(function () {
            cb({
                size: (total - metadata - history),
                hash: hash
            });
        });

    };

    commands.GET_HISTORY_SIZE = function (ctx, data, cId, cb) {
        if (!ctx.store.loggedIn || !ctx.store.rpc) { return void cb({ error: 'INSUFFICIENT_PERMISSIONS' }); }
        var channels = data.channels;
        if (!Array.isArray(channels)) { return void cb({ error: 'EINVAL' }); }

        var warning = [];

        // If account trim history, get the correct channels here
        if (data.account) {
            channels = getAccountChannels(ctx);
        }

        var size = 0;
        var res = [];
        nThen(function (waitFor) {
            channels.forEach(function (chan) {
                var channel = chan;
                var lastKnownHash;
                if (typeof (chan) === "object" && chan.channel) {
                    channel = chan.channel;
                    lastKnownHash = chan.lastKnownHash;
                }
                getHistoryData(ctx, channel, lastKnownHash, data.teamId, waitFor(function (obj) {
                    if (obj && obj.error) {
                        warning.push(obj.error);
                        return;
                    }
                    size += obj.size;
                    if (!obj.hash) { return; }
                    res.push({
                        channel: channel,
                        hash: obj.hash
                    });
                }));
            });
        }).nThen(function () {
            cb({
                warning: warning.length ? warning : undefined,
                channels: res,
                size: size
            });
        });
    };

    commands.TRIM_HISTORY = function (ctx, data, cId, cb) {
        if (!ctx.store.loggedIn || !ctx.store.rpc) { return void cb({ error: 'INSUFFICIENT_PERMISSIONS' }); }
        var channels = data.channels;
        if (!Array.isArray(channels)) { return void cb({ error: 'EINVAL' }); }

        var rpc = getRpc(ctx, data.teamId);
        if (!rpc) { return void cb({ error: 'ENORPC'}); }

        var warning = [];

        nThen(function (waitFor) {
            channels.forEach(function (obj) {
                rpc.trimHistory(obj, waitFor(function (err) {
                    if (err) {
                        warning.push(err);
                        return;
                    }
                }));
            });
        }).nThen(function () {
            // Only one channel and warning: error
            if (channels.length === 1 && warning.length) {
                return void cb({error: warning[0]});
            }
            cb({
                warning: warning.length ? warning : undefined
            });
        });
    };

    History.init = function (cfg, waitFor, emit) {
        var history = {};
        if (!cfg.store) { return; }
        var ctx = {
            store: cfg.store,
            Store: cfg.Store,
            pinPads: cfg.pinPads,
            updateMetadata: cfg.updateMetadata,
            emit: emit,
        };

        history.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            try {
                commands[cmd](ctx, data, clientId, cb);
            } catch (e) {
                console.error(e);
            }
        };

        return history;
    };

    return History;
});



