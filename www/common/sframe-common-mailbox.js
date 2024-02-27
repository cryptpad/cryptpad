// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/notifications.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
], function ($, Util, Hash, UI, UIElements, Notifications, h, Messages) {
    var Mailbox = {};

    Mailbox.create = function (Common) {
        var mailbox = Common.mailbox;
        var sframeChan = Common.getSframeChannel();
        var priv = Common.getMetadataMgr().getPrivateData();

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
            }, function (obj) {
                cb(obj && obj.error, obj);
                if (obj && obj.error) {
                    return void console.error(obj.error);
                }
            });
        };

        // UI

        var formatData = function (data) {
            return JSON.stringify(data.content.msg.content);
        };
        var createElement = mailbox.createElement = function (data) {
            var notif;
            var avatar;
            var userData = Util.find(data, ['content', 'msg', 'content', 'user']);

            if (Util.find(data, ['content', 'msg', 'type']) === 'BROADCAST_DELETE') {
                return;
            }
            if (data.type === 'broadcast') {
                avatar = h('i.fa.fa-bullhorn.cp-broadcast');
                if (/^LOCAL\|/.test(data.content.hash)) {
                    $(avatar).addClass('preview');
                }
            } else if (data.type === 'reminders') {
                avatar = h('i.fa.fa-calendar.cp-broadcast.preview');
                if (priv.app !== 'calendar') { avatar.classList.add('cp-reminder'); }
                $(avatar).click(function (e) {
                    e.stopPropagation();
                    if (data.content && data.content.handler) {
                        return void data.content.handler();
                    }
                    Common.openURL(Hash.hashToHref('', 'calendar'));
                });
            } else if (userData && typeof(userData) === "object" && userData.profile) {
                avatar = h('span.cp-avatar');
                Common.displayAvatar($(avatar), userData.avatar, userData.displayName || userData.name);
                $(avatar).click(function (e) {
                    e.stopPropagation();
                    Common.openURL(Hash.hashToHref(userData.profile, 'profile'));
                });
            } else if (userData && userData.supportTeam) {
                avatar = h('span.cp-avatar-image', h('img', { src:'/customize/CryptPad_logo.svg' }));
            }
            var order = -Math.floor((Util.find(data, ['content', 'msg', 'ctime']) || 0) / 1000);
            const tabIndexValue = undefined;//data.content.isDismissible ? undefined : '0';
            notif = h('li.cp-notification', {
                role: 'menuitem',
                tabindex: '0',
                style: 'order:'+order+';',
                'data-hash': data.content.hash
            }, [
                avatar,
                h('div.cp-notification-content', {
                    tabindex: tabIndexValue
                }, [
                    h('p', data.content.msg.type + ' - ' +formatData(data))
                ])
            ]);

            if (typeof(data.content.getFormatText) === "function") {
                $(notif).find('.cp-notification-content p').html(data.content.getFormatText());
                if (data.content.autorefresh) {
                    var it = setInterval(function () {
                        if (!data.content.autorefresh) {
                            clearInterval(it);
                            return;
                        }
                        $(notif).find('.cp-notification-content p').html(data.content.getFormatText());
                    }, 60000);
                }
            }

            $(notif).mouseenter((e) => {
                e.stopPropagation();
                $(notif).focus();
            });

            if (data.content.isClickable) {
                $(notif).find('.cp-notification-content').addClass("cp-clickable").on('click keypress', function (event) {
                    if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                        data.content.handler();
                    }
                });
            }
            if (data.content.isDismissible) {
                var dismissIcon = h('span.fa.fa-times');
                var dismiss = h('div.cp-notification-dismiss', {
                    title: Messages.notifications_dismiss,
                }, dismissIcon);
                $(dismiss).addClass("cp-clickable")
                    .on('click keypress', function (event) {
                        event.stopPropagation();
                        if (event.type === 'click' || (event.type === 'keypress' && event.which === 13)) {
                            data.content.dismissHandler();
                        }
                    });
                $(notif).append(dismiss);
            }
            return notif;
        };


        var onViewedHandlers = [];
        var onMessageHandlers = [];

        onViewedHandlers.push(function (data) {
            var hash = data.hash.replace(/"/g, '\\\"');
            if (/^REMINDER\|/.test(hash)) { hash = hash.split('-')[0]; }
            var $notif = $('.cp-notification[data-hash^="'+hash+'"]:not(.cp-app-notification-archived)');
            if ($notif.length) {
                $notif.remove();
            }
        });

        // Call the onMessage handlers
        var isNotification = function (type) {
            return type === "notifications" || /^team-/.test(type) || type === "broadcast" || type === "reminders" || type === "supportteam";
        };
        var pushMessage = function (data, handler) {
            var todo = function (f) {
                try {
                    var el;
                    if (isNotification(data.type)) {
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
                    if (isNotification(data.type)) {
                        Notifications.remove(Common, data);
                    }
                } catch (e) {
                    console.error(e);
                }
            });
            removeFromHistory(data.type, data.hash);
        };

        var onMessage = mailbox.onMessage = function (data, cb) {
            // data = { type: 'type', content: {msg: 'msg', hash: 'hash'} }
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
            if (/^LOCAL\|/.test(dataObj.hash)) {
                onViewed(dataObj);
                cb();
                return;
            }
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
            var teams = types.indexOf('team') !== -1;
            if (typeof(cfg.onViewed) === "function") {
                onViewedHandlers.push(function (data) {
                    var type = data.type;
                    if (types.indexOf(type) === -1 && !(teams && /^team-/.test(type))) { return; }
                    cfg.onViewed(data);
                });
            }
            if (typeof(cfg.onMessage) === "function" && !cfg.history) {
                onMessageHandlers.push(function (data, el) {
                    var type = data.type;
                    if (types.indexOf(type) === -1 && !(teams && /^team-/.test(type))) { return; }
                    cfg.onMessage(data, el);
                });
            }
            Object.keys(history).forEach(function (type) {
                if (types.indexOf(type) === -1 && !(teams && /^team-/.test(type))) { return; }
                history[type].forEach(function (data) {
                    pushMessage({
                        type: type,
                        content: data
                    }, cfg.onMessage);
                });
            });
        };

        var onHistory = function () {};
        var onHistoryEnd;
        mailbox.getMoreHistory = function (type, count, lastKnownHash, cb) {
            if (type === "broadcast" && onHistoryEnd) {
                onHistoryEnd.reg(cb);
                return;
            }
            if (onHistoryEnd) { return void cb("ALREADY_CALLED"); }
            onHistoryEnd = Util.mkEvent();
            onHistoryEnd.reg(cb);
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
                    onHistoryEnd.fire(null, messages, end);
                    onHistoryEnd = undefined;
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


