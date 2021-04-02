define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',
    '/customize/messages.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function (Util, Hash, Constants, Realtime, Messages, Listmap, Crypto, ChainPad) {
    var Calendar = {};


/* TODO
* Calendar
{
    href,
    roHref,
    channel, (pinning)
    title, (when created from the UI, own calendar has no title)
    color
}


* Own drive
{
    calendars: {
        own: calendar,
        extra: {
            uid: calendar,
            uid: calendar
        }
    }
}

* Team drive
{
    calendars: {
        own: calendar,
        extra: {
            uid: calendar,
            uid: calendar
        }
    }
}

* Calendars are listmap
{
    content: {},
    metadata: {
        title: "pewpewpew"
    }
}

ctx.calendars[channel] = {
    lm: lm,
    proxy: lm.proxy?
    stores: [teamId, teamId, 1]
}

* calendar app can subscribe to this module
    * when a listmap changes, push an update for this calendar to subscribed tabs
* Ability to open a calendar not stored in the stores but from its URL directly
* No "userlist" visible in the UI
* No framework





*/

    var makeCalendar = function () {
        var hash = Hash.createRandomHash('calendar');
        var secret = Hash.getSecrets('calendar', hash);
        var roHash = Hash.getViewHashFromKeys(secret);
        var href = Hash.hashToHref(hash, 'calendar');
        var roHref = Hash.hashToHref(roHash, 'calendar');
        return {
            href: href,
            roHref: roHref,
            channel: secret.channel,
        };
    };
    var initializeCalendars = function (ctx, cb) {
        var proxy = ctx.store.proxy;
        var calendars = proxy.calendars = proxy.calendars || {};
        if (!calendars.own) {
            var own = calendars.own = makeCalendar(true);
            own.color = ctx.Store.getUserColor();
        }
        setTimeout(cb);
        // XXX for each team, if we have edit rights, create the team calendar?
        // XXX or maybe do it from the team app?
    };

    var sendUpdate = function (ctx, c) {
        ctx.emit('UPDATE', {
            teams: c.stores,
            id: c.channel,
            readOnly: c.readOnly,
            data: Util.clone(c.proxy)
        }, ctx.clients);
    };

    var openChannel = function (ctx, cfg) {
        var teamId = cfg.storeId;
        var data = cfg.data;
        var channel = data.channel;
        if (!channel) { return; }

        var c = ctx.calendars[channel];
        if (c) {
            if (c.stores && c.stores.indexOf(teamId) !== -1) { return; }
            if (c.readOnly && data.href) {
                // XXX UPGRADE
                // XXX different cases if already ready or not?
            }
            c.stores.push(teamId);
            return;
        }

        // Multiple teams can have the same calendar. Make sure we remember the list of stores
        // that know it so that we don't close the calendar when leaving/deleting a team.
        c = ctx.calendars[channel] = {
            ready: false,
            channel: channel,
            readOnly: !data.href,
            stores: [teamId]
        };

        var update = function () {
            console.log(ctx.clients);
            sendUpdate(ctx, c);
        };


        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        var secret = Hash.getSecrets('calendar', parsed.hash);
        var crypto = Crypto.createEncryptor(secret.keys);

        // Set the owners as the first store opening it. We don't know yet if it's a new or
        // existing calendar. "owners' will be ignored if the calendar already exists.
        var edPublic;
        if (teamId === 1) {
            edPublic = ctx.store.proxy.edPublic;
        } else {
            var teams = ctx.store.modules.team && ctx.store.modules.team.getTeamsData();
            var team = teams && teams[teamId];
            edPublic = team ? team.edPublic : undefined;
        }

        var config = {
            data: {},
            network: ctx.store.network, // XXX offline
            channel: secret.channel,
            crypto: crypto,
            owners: [edPublic],
            ChainPad: ChainPad,
            validateKey: secret.keys.validateKey || undefined,
            userName: 'calendar',
            classic: true
        };

        console.error(channel, config);
        var lm = Listmap.create(config);
        c.lm = lm;
        c.proxy = lm.proxy;

        lm.proxy.on('ready', function () {
            c.ready = true;
            console.warn('READY', channel);
            setTimeout(update);
        }).on('change', [], function () {
            setTimeout(update);
        });
    };
    var openChannels = function (ctx) {
        var findFromStore = function (store) {
            var c = store.proxy.calendars;
            if (!c) { return; }
            if (c.own) {
                openChannel(ctx, {
                    storeId: store.id || 1,
                    data: c.own
                });
            }
            if (c.extra) {
                Object.keys(c.extra).forEach(function (channel) {
                    openChannel(ctx, {
                        storeId: store.id || 1,
                        data: c.extra[channel]
                    });
                });
            }
        };

        // Personal drive
        findFromStore(ctx.store);
    };


    var subscribe = function (ctx, data, cId, cb) {
        // Subscribe to new notifications
        var idx = ctx.clients.indexOf(cId);
        if (idx === -1) {
            ctx.clients.push(cId);
        }
        cb();
        Object.keys(ctx.calendars).forEach(function (channel) {
            var c = ctx.calendars[channel] || {};
            console.log(channel, c);
            if (!c.ready) { return; }
            sendUpdate(ctx, c);
        });
    };

    var removeClient = function (ctx, cId) {
        var idx = ctx.clients.indexOf(cId);
        ctx.clients.splice(idx, 1);
    };

    Calendar.init = function (cfg, waitFor, emit) {
        var calendar = {};
        var store = cfg.store;
        if (!store.loggedIn || !store.proxy.edPublic) { return; } // XXX logged in only?
        var ctx = {
            store: store,
            Store: cfg.Store,
            pinPads: cfg.pinPads,
            updateMetadata: cfg.updateMetadata,
            emit: emit,
            onReady: Util.mkEvent(true),
            calendars: {},
            clients: [],
        };

        initializeCalendars(ctx, waitFor(function (err) {
            if (err) { return; }
            openChannels(ctx);
        }));

        calendar.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        calendar.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                return void subscribe(ctx, data, clientId, cb);
            }
        };

        return calendar;
    };

    return Calendar;
});



