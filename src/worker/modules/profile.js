// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (Util, Hash, Constants, Realtime,
                Listmap, Crypto, ChainPad) => {
    var Profile = {};

    var initializeProfile = function (ctx, cb) {
        var profile = ctx.profile;
        if (!profile.edit || !profile.view) {
            var hash = Hash.createRandomHash('profile');
            var secret = Hash.getSecrets('profile', hash);
            ctx.pinPads([secret.channel], function (res) {
                if (res.error) {
                    return void cb(res.error);
                }
                profile.edit = Hash.getEditHashFromKeys(secret);
                profile.view = Hash.getViewHashFromKeys(secret);
                setTimeout(cb);
            });
            return;
        }
        setTimeout(cb);
    };

    var openChannel = function (ctx) {
        var profile = ctx.profile;
        var secret = Hash.getSecrets('profile', profile.edit);
        var crypto = Crypto.createEncryptor(secret.keys);

        var cfg = {
            data: {},
            network: ctx.store.network,
            channel: secret.channel,
            crypto: crypto,
            owners: [ctx.store.proxy.edPublic],
            ChainPad: ChainPad,
            validateKey: secret.keys.validateKey || undefined,
            userName: 'profile',
            classic: true
        };
        var lm = Listmap.create(cfg);
        lm.proxy.on('create', function () {
        }).on('ready', function () {
            lm.proxy.name = ctx.store.proxy[Constants.displayNameKey] || "";
            ctx.listmap = lm;
            if (!lm.proxy.curvePublic) {
                lm.proxy.curvePublic = ctx.store.proxy.curvePublic;
            }
            if (!lm.proxy.notifications) {
                lm.proxy.notifications = Util.find(ctx.store.proxy, ['mailboxes', 'notifications', 'channel']);
            }
            if (!lm.proxy.edPublic) {
                lm.proxy.edPublic = ctx.store.proxy.edPublic;
            }
            if (ctx.onReadyHandlers.length) {
                ctx.onReadyHandlers.forEach(function (f) {
                    try {
                        f(lm.proxy);
                    } catch (e) { console.error(e); }
                });
                ctx.onReadyHandlers = [];
            }
        }).on('change', [], function () {
            ctx.emit('UPDATE', lm.proxy, ctx.clients);
        });
    };

    var setName = function (ctx, value) {
        ctx.listmap.proxy.name = value;
        Realtime.whenRealtimeSyncs(ctx.listmap.realtime, function () {
            if (!ctx.listmap) { return; }
            ctx.emit('UPDATE', ctx.listmap.proxy, ctx.clients);
        });
    };

    var subscribe = function (ctx, data, cId, cb) {
        // Subscribe to new notifications
        var idx = ctx.clients.indexOf(cId);
        if (idx === -1) {
            ctx.clients.push(cId);
        }
        if (ctx.listmap) {
            return void cb(ctx.listmap.proxy);
        }
        ctx.onReadyHandlers.push(function (proxy) {
            cb(proxy);
        });
    };

    var setValue = function (ctx, data, cId, cb) {
        var key = data.key;
        var value = data.value;
        if (!key) { return; }
        ctx.listmap.proxy[key] = value;
        Realtime.whenRealtimeSyncs(ctx.listmap.realtime, function () {
            ctx.emit('UPDATE', ctx.listmap.proxy, ctx.clients.filter(function (clientId) {
                return clientId !== cId;
            }));
            if (key === 'badge') {
                ctx.Store.set(null, {
                    key: ['profile', 'badge'],
                    value: value || undefined
                }, () => {});
            }
            cb(ctx.listmap.proxy);
        });
    };

    var removeClient = function (ctx, cId) {
        var idx = ctx.clients.indexOf(cId);
        if (idx !== -1) { ctx.clients.splice(idx, 1); }
    };

    Profile.init = function (cfg, waitFor, emit) {
        var profile = {};
        var store = cfg.store;
        if (!store.loggedIn || !store.proxy.edPublic) { return; }
        var ctx = {
            Store: cfg.Store,
            store: store,
            pinPads: cfg.pinPads,
            updateMetadata: cfg.updateMetadata,
            emit: emit,
            onReadyHandlers: [],
            clients: [],
        };

        ctx.profile = store.proxy.profile = store.proxy.profile || {};

        initializeProfile(ctx, waitFor(function (err) {
            if (err) { return; }
            openChannel(ctx);
        }));

        profile.setName = function (value) {
            setName(ctx, value);
        };
        profile.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        profile.update = function () {
            if (!ctx.listmap) { return; }
            ctx.emit('UPDATE', ctx.listmap.proxy, ctx.clients);
        };
        profile.execCommand = function (clientId, obj, cb) {
            console.log(obj);
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'SET') {
                return void setValue(ctx, data, clientId, cb);
            }
        };

        return profile;
    };

    return Profile;
};

if (typeof(module) !== 'undefined' && module.exports) {
    // Code from customize can't be laoded directly in the build
    module.exports = factory(
        require('../../common/common-util'),
        require('../../common/common-hash'),
        require('../../common/common-constants'),
        require('../../common/common-realtime'),
        require('chainpad-listmap'),
        require('chainpad-crypto'),
        require('chainpad')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/common-util.js',
        '/common/common-hash.js',
        '/common/common-constants.js',
        '/common/common-realtime.js',
        'chainpad-listmap',
        '/components/chainpad-crypto/crypto.js',
        '/components/chainpad/chainpad.dist.js',
        ], factory);
} else {
    // unsupported initialization
}

})();
