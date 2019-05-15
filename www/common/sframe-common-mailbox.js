define([
    'jquery',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/customize/messages.js'
], function ($, Util, UI, UIElements, Messages) {
    var Mailbox = {};

    Mailbox.create = function (Common) {
        var mailbox = {};
        var metadataMgr = Common.getMetadataMgr();
        var sframeChan = Common.getSframeChannel();

        var execCommand = function (cmd, data, cb) {
            sframeChan.query('Q_MAILBOX_COMMAND', {
                cmd: cmd,
                data: data
            }, function (err, obj) {
                if (err) { return void cb({error: err}); }
                cb(obj);
            });
        };

        var history = {};

        var removeFromHistory = function (type, hash) {
            history[type] = history[type].filter(function (obj) {
                return obj.hash !== hash;
            });
        };

        mailbox.dismiss = function (type, hash, cb) {
            execCommand('DISMISS', {
                hash: hash,
                type: type
            }, function (obj) {
                if (obj && obj.error) { return void cb(obj.error); }
                removeFromHistory(type, hash);
                cb();
            });
        };

        mailbox.sendTo = function (user, type, content) {
            
        };

        // UI

        var onViewedHandlers = [];
        var onMessageHandlers = [];

        // Call the onMessage handlers
        var pushMessage = function (data) {
            onMessageHandlers.forEach(function (f) {
                try {
                    f(data);
                } catch (e) {
                    console.error(e);
                }
            });
        };

        // Get all existing notifications + the new ones when they come
        mailbox.subscribe = function (cfg) {
            if (typeof(cfg.onViewed) === "function") {
                onViewedHandlers.push(cfg.onViewed);
            }
            if (typeof(cfg.onMessage) === "function") {
                onMessageHandlers.push(cfg.onMessage);
            }
            Object.keys(history).forEach(function (type) {
                history[type].forEach(function (data) {
                    pushMessage({
                        type: type,
                        content: data
                    });
                });
            });
        };

        var onViewed = function (data) {
            // data = { type: 'type', hash: 'hash' }
            onViewedHandlers.forEach(function (f) {
                try {
                    f(data);
                } catch (e) {
                    console.error(e);
                }
            });
            removeFromHistory(data.type, data.hash);
        };

        var onMessage = function (data) {
            // data = { type: 'type', content: {msg: 'msg', hash: 'hash'} }
            console.log(data.content);
            pushMessage(data);
            if (!history[data.type]) { history[data.type] = []; }
            history[data.type].push(data.content);
        };


        // CHANNEL WITH WORKER

        sframeChan.on('EV_MAILBOX_EVENT', function (obj) {
            // obj = { ev: 'type', data: obj }
            var ev = obj.ev;
            var data = obj.data;
            if (ev === 'MESSAGE') {
                return void onMessage(data);
            }
            if (ev === 'VIEWED') {
                return void onViewed(data);
            }
        });

        execCommand('SUBSCRIBE', null, function () {
            console.log('subscribed');
        });

        return mailbox;
    };

    return Mailbox;
});


