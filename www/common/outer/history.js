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
        var driveOwned = (Util.find(ctx.store, ['driveMetadata', 'owners']) || []).indexOf(edpublic) !== -1;
        if (driveOwned) {
            channels.push(ctx.store.driveChannel);
        }

        // Profile
        var profile = ctx.store.proxy.profile;
        if (profile) {
            var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit, null) : null;
            if (profileChan) { channels.push(profileChan); }
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

    var getRpc = function (ctx, teamId) {
        if (!teamId) { return ctx.store.rpc; }
        var teams = ctx.store.modules['team'];
        if (!teams) { return; }
        var team = teams.getTeam(teamId);
        if (!team) { return; }
        return team.rpc;
    };

    commands.GET_HISTORY_SIZE = function (ctx, data, cId, cb) {
        if (!ctx.store.loggedIn || !ctx.store.rpc) { return void cb({ error: 'INSUFFICIENT_PERMISSIONS' }); }
        var channels = data.channels;
        if (!Array.isArray(channels)) { return void cb({ error: 'EINVAL' }); }

        var rpc = getRpc(ctx, data.teamid);
        if (!rpc) { return void cb({ error: 'ENORPC'}); }

        var warning = [];

        // If account trim history, get the correct channels here
        if (data.account) {
            channels = getAccountChannels(ctx);
        }

        var size = 0;
        nThen(function (waitFor) {
            // TODO: check if owner first?
            channels.forEach(function (chan) {
                size += Math.floor(Math.random()*1000) * 1024; // XXX
                /*
                var channel = chan;
                var lastKnownHash;
                if (typeof (chan) === "object" && chan.channel) {
                    channel = chan.channel;
                    lastKnownHash = chan.lastKnownHash;
                }
                rpc.getHistorySize({
                    channel: channel,
                    lastKnownHash: lastKnownHash
                }, waitFor(function (err, value) {
                    if (err) {
                        warning.push(err);
                        return;
                    }
                    size += value;
                }));
                */ // XXX TODO
            });
        }).nThen(function () {
            cb({
                warning: warning.length ? warning : undefined,
                size: size
            });
        });
    };

    commands.TRIM_HISTORY = function (ctx, data, cId, cb) {
        if (!ctx.store.loggedIn || !ctx.store.rpc) { return void cb({ error: 'INSUFFICIENT_PERMISSIONS' }); }
        var channels = data.channels;
        if (!Array.isArray(channels)) { return void cb({ error: 'EINVAL' }); }

        var rpc = getRpc(ctx, data.teamid);
        if (!rpc) { return void cb({ error: 'ENORPC'}); }

        var warning = [];

        // If account trim history, get the correct channels here
        if (data.account) {
            channels = getAccountChannels(ctx);
        }

        nThen(function (waitFor) {
            channels.forEach(function (chan) {
                /*
                rpc.trimHistory(chan, waitFor(function (err) {
                    if (err) {
                        chanWarning = true;
                        warning.push(err);
                        return;
                    }
                }));
                */ // XXX TODO
            });
        }).nThen(function () {
            // Only one channel and warning: error
            if (channels.length === 1 && warning.length) {
                return void cb({error: err});
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



