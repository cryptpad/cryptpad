define([
    'jquery',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/notifications.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
], function ($, Util, UI, UIElements, Notifications, h, Messages) {
    var Mailbox = {};

    Mailbox.create = function (Common) {
        var mailbox = Common.mailbox;
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
            if (!history[type]) { return; }
            history[type] = history[type].filter(function (obj) {
                return obj.hash !== hash;
            });
        };

        mailbox.sendTo = function (type, content, user, cb) {
            cb = cb || function () {};
            execCommand('SENDTO', {
                type: type,
                msg: content,
                user: user
            }, function (err, obj) {
                cb(err || (obj && obj.error), obj);
                if (err || (obj && obj.error)) {
                    return void console.error(err || obj.error);
                }
            });
        };

        // UI

        var formatData = function (data) {
            return JSON.stringify(data.content.msg.content);
        };
        var createElement = mailbox.createElement = function (data) {
            var notif;
            notif = h('div.cp-notification', {
                'data-hash': data.content.hash
            }, [h('div.cp-notification-content', h('p', formatData(data)))]);

            if (typeof(data.content.getFormatText) === "function") {
                $(notif).find('.cp-notification-content p').html(data.content.getFormatText());
            }

            if (data.content.isClickable) {
                $(notif).find('.cp-notification-content').addClass("cp-clickable")
                    .click(data.content.handler);
            }
            if (data.content.isDismissible) {
                var dismissIcon = h('span.fa.fa-times');
                var dismiss = h('div.cp-notification-dismiss', {
                    title: Messages.notifications_dismiss
                }, dismissIcon);
                $(dismiss).addClass("cp-clickable")
                    .click(data.content.dismissHandler);
                $(notif).append(dismiss);
            }
            return notif;
        };


        var onViewedHandlers = [];
        var onMessageHandlers = [];

        onViewedHandlers.push(function (data) {
            var hash = data.hash.replace(/"/g, '\\\"');
            var $notif = $('.cp-notification[data-hash="'+hash+'"]:not(.cp-app-notification-archived)');
            if ($notif.length) {
                $notif.remove();
            }
        });

        // Call the onMessage handlers
        var pushMessage = function (data, handler) {
            var todo = function (f) {
                try {
                    var el;
                    if (data.type === 'notifications') {
                        Notifications.add(Common, data);
                        el = createElement(data);
                    }
                    f(data, el);
                } catch (e) {
                    console.error(e);
                }
            };
            if (typeof (handler) === "function") {
                return void todo(handler);
            }
            onMessageHandlers.forEach(todo);
        };

        var onViewed = function (data) {
            // data = { type: 'type', hash: 'hash' }
            onViewedHandlers.forEach(function (f) {
                try {
                    f(data);
                    if (data.type === 'notifications') {
                        Notifications.remove(Common, data);
                    }
                } catch (e) {
                    console.error(e);
                }
            });
            removeFromHistory(data.type, data.hash);
        };

        var onMessage = function (data, cb) {
            // data = { type: 'type', content: {msg: 'msg', hash: 'hash'} }
            console.debug(data.type, data.content);
            pushMessage(data);
            if (data.content && typeof (data.content.getFormatText) === "function") {
                var text = $('<div>').html(data.content.getFormatText()).text();
                cb({
                    msg: text
                });
            }
            if (!history[data.type]) { history[data.type] = []; }
            history[data.type].push(data.content);
        };

        mailbox.dismiss = function (data, cb) {
            var dataObj = {
                hash: data.content.hash,
                type: data.type
            };
            execCommand('DISMISS', dataObj, function (obj) {
                if (obj && obj.error) { return void cb(obj.error); }
                onViewed(dataObj);
                cb();
            });
        };

        var subscribed = false;

        // Get all existing notifications + the new ones when they come
        mailbox.subscribe = function (types, cfg) {
            if (!subscribed) {
                execCommand('SUBSCRIBE', null, function () {});
                subscribed = true;
            }
            if (typeof(cfg.onViewed) === "function") {
                onViewedHandlers.push(function (data) {
                    if (types.indexOf(data.type) === -1) { return; }
                    cfg.onViewed(data);
                });
            }
            if (typeof(cfg.onMessage) === "function") {
                onMessageHandlers.push(function (data, el) {
                    if (types.indexOf(data.type) === -1) { return; }
                    cfg.onMessage(data, el);
                });
            }
            Object.keys(history).forEach(function (type) {
                if (types.indexOf(type) === -1) { return; }
                history[type].forEach(function (data) {
                    pushMessage({
                        type: type,
                        content: data
                    }, cfg.onMessage);
                });
            });
        };

        var historyState = false;
        var onHistory = function () {};
        mailbox.getMoreHistory = function (type, count, lastKnownHash, cb) {
            if (historyState) { return void cb("ALREADY_CALLED"); }
            historyState = true;
            var txid = Util.uid();
            execCommand('LOAD_HISTORY', {
                type: type,
                count: lastKnownHash ? count + 1 : count,
                txid: txid,
                lastKnownHash: lastKnownHash
            }, function (err, obj) {
                if (obj && obj.error) { console.error(obj.error); }
            });
            var messages = [];
            onHistory = function (data) {
                if (data.txid !== txid) { return; }
                if (data.complete) {
                    onHistory = function () {};
                    var end = messages.length < count;
                    cb(null, messages, end);
                    historyState = false;
                    return;
                }
                if (data.hash !== lastKnownHash) {
                    messages.push({
                        type: type,
                        content: {
                            msg: data.message,
                            time: data.time,
                            hash: data.hash
                        }
                    });
                }
            };
        };
        mailbox.getNotificationsHistory = function (type, count, lastKnownHash, cb) {
            mailbox.getMoreHistory(type, count, lastKnownHash, function (err, messages, end) {
                if (!Array.isArray(messages)) { return void cb(err); }
                messages.forEach(function (data) {
                    data.content.archived = true;
                    Notifications.add(Common, data);
                });
                cb(err, messages, end);
            });
        };

        // CHANNEL WITH WORKER

        sframeChan.on('EV_MAILBOX_EVENT', function (obj, cb) {
            // obj = { ev: 'type', data: obj }
            var ev = obj.ev;
            var data = obj.data;
            if (ev === 'HISTORY') {
                return void onHistory(data);
            }
            if (ev === 'MESSAGE') {
                return void onMessage(data, cb);
            }
            if (ev === 'VIEWED') {
                return void onViewed(data);
            }
        });

        return mailbox;
    };

    return Mailbox;
});


