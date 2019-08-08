define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/diffMarked.js',
], function ($, Messages, Util, UI, h, DiffMd) {
    'use strict';

    var debug = console.log;
    debug = function () {};

    var MessengerUI = {};

    var dataQuery = function (id) {
        return '[data-key="' + id + '"]';
    };
    var userQuery = function (curve) {
        return '[data-user="' + curve + '"]';
    };

    var initChannel = function (state, info) {
        console.log('initializing channel for [%s]', info.id);
        var h, t;
        if (Array.isArray(info.messages) && info.messages.length) {
            h = info.messages[info.messages.length -1].sig;
            t = info.messages[0].sig;
        }
        state.channels[info.id] = {
            messages: info.messages || [],
            name: info.name,
            isFriendChat: info.isFriendChat,
            needMoreHistory: !info.isPadChat,
            isPadChat: info.isPadChat,
            curvePublic: info.curvePublic,
            HEAD: h || info.lastKnownHash,
            TAIL: t || null,
        };
    };

    MessengerUI.create = function ($container, common, toolbar) {
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var origin = metadataMgr.getPrivateData().origin;
        var readOnly = metadataMgr.getPrivateData().readOnly;

        var isApp = typeof(toolbar) !== "undefined";

        $container.addClass('cp-app-contacts-initializing');

        var messaging = h('div#cp-app-contacts-messaging', [
            h('span.fa.fa-spinner.fa-pulse.fa-4x.fa-fw.cp-app-contacts-spinner'),
            h('div.cp-app-contacts-info', [
                h('h2', Messages.contacts_info1),
                h('ul', [
                    h('li', Messages.contacts_info2),
                    h('li', Messages.contacts_info3),
                    h('li', Messages.contacts_info4),
                ])
            ])
        ]);

        var friendList = h('div#cp-app-contacts-friendlist', [
            h('span.fa.fa-spinner.fa-pulse.fa-4x.fa-fw.cp-app-contacts-spinner'),
            h('div.cp-app-contacts-padchat.cp-app-contacts-category', [
                h('div.cp-app-contacts-category-content')
            ]),
            h('div.cp-app-contacts-friends.cp-app-contacts-category', [
                h('div.cp-app-contacts-category-content'),
                h('h2.cp-app-contacts-category-title', Messages.contacts_friends),
            ]),
            h('div.cp-app-contacts-rooms.cp-app-contacts-category', [
                h('div.cp-app-contacts-category-content'),
                h('h2.cp-app-contacts-category-title', Messages.contacts_rooms),
            ]),
        ]);

        var execCommand = function (cmd, data, cb) {
            sframeChan.query('Q_CHAT_COMMAND', {cmd: cmd, data: data}, function (err, obj) {
                if (err || (obj && obj.error)) { return void cb(err || (obj && obj.error)); }
                cb(void 0, obj);
            });
        };

        var $userlist = $(friendList).appendTo($container);
        var $messages = $(messaging).appendTo($container);

        var state = window.state = {
            active: '',
            channels: {}
        };

        var contactsData = state.contactsData = {};

        var avatars = state.avatars = {};
        var setActive = function (id) {
            state.active = id;
        };
        var isActive = function (id) {
            return id === state.active;
        };

        var find = {};
        find.inList = function (id) {
            return $userlist.find(dataQuery(id));
        };

        var notifyToolbar = function () {
            if (!toolbar || !toolbar['chat']) { return; }
            if (toolbar['chat'].find('button').hasClass('cp-toolbar-button-active')) { return; }
            toolbar['chat'].find('button').addClass('cp-toolbar-notification');
        };

        var notify = function (id) {
            find.inList(id).addClass('cp-app-contacts-notify');
        };
        var unnotify = function (id) {
            find.inList(id).removeClass('cp-app-contacts-notify');
        };

        var onResize = function () {
            // Don't update the width if we are in the contacts app
            if (!isApp) { return; }
            var w = $userlist[0].offsetWidth - $userlist[0].clientWidth;
            $userlist.css('width', (68 + w)+'px');
        };
        var reorderRooms = function () {
            var channels = Object.keys(state.channels).sort(function (a, b) {
                var m1 = state.channels[a].messages.slice(-1)[0];
                var m2 = state.channels[b].messages.slice(-1)[0];
                if (!m2) { return !m1 ? 0 : 1; }
                if (!m1) { return -1; }
                return m1.time - m2.time;
            });

            channels.forEach(function (c, i) {
                $userlist.find(dataQuery(c)).css('order', i);
            });

            // Make sure the width is correct even if there is a scrollbar
            onResize();
        };

        $(window).on('resize', onResize);

        var m = function (md, hour) {
            var id = Util.createRandomInteger();
            var d = h('div', {
                id: 'msg-'+id
            });
            try {
                var $d = $(d);
                DiffMd.apply(DiffMd.render(md || '', true, true), $d, common);
                $d.addClass("cp-app-contacts-content");

                // override link clicking, because we're in an iframe
                $d.find('a').each(function () {
                    var href = $(this).click(function (e) {
                        e.preventDefault();
                        common.openUnsafeURL(href);
                    }).attr('href');
                });

                var time = h('div.cp-app-contacts-time', hour);
                $d.append(time);
            } catch (e) {
                console.error(md);
                console.error(e);
            }
            return d;
        };

        var markup = {};
        markup.message = function (msg) {
            if (msg.type !== 'MSG') { return; }
            var curvePublic = msg.author;
            var name = typeof msg.name !== "undefined" ?
                            (msg.name || Messages.anonymous) :
                            contactsData[msg.author].displayName;
            var d = msg.time ? new Date(msg.time) : undefined;
            var day = d ? d.toLocaleDateString() : '';
            var hour = d ? d.toLocaleTimeString() : '';
            return h('div.cp-app-contacts-message', {
                //title: time || '?',
                'data-user': curvePublic || name,
                'data-day': day
            }, [
                name? h('div.cp-app-contacts-sender', [
                    h('span.cp-app-contacts-sender-name', name),
                    h('span.cp-app-contacts-sender-time', day)
                ]): undefined,
                m(msg.text, hour),
            ]);
        };

        var getChat = function (id) {
            return $messages.find(dataQuery(id));
        };

        var scrollChatToBottom = function () {
            var $messagebox = $('.cp-app-contacts-messages');
            $messagebox.scrollTop($messagebox[0].scrollHeight);
        };

        var normalizeLabels = function ($messagebox) {
            $messagebox.find('div.cp-app-contacts-message').toArray().reduce(function (a, b) {
                var $b = $(b);
                if ($(a).data('user') === $b.data('user') &&
                    $(a).data('day') === $b.data('day')) {
                    $b.find('.cp-app-contacts-sender').hide();
                    return a;
                }
                return b;
            }, []);
        };

        var clearChannel = function (id) {
            $(getChat(id)).find('.cp-app-contacts-messages').html('');
        };
        markup.chatbox = function (id, data, curvePublic) {
            var moreHistory = h('span.cp-app-contacts-more-history.fa.fa-history', {
                title: Messages.contacts_fetchHistory,
            });

            var chan = state.channels[id];
            var displayName = chan.name;

            var fetching = false;
            var $moreHistory = $(moreHistory).click(function () {
                if (fetching) { return; }

                // get oldest known message...
                var channel = state.channels[id];

                if (channel.exhausted) {
                    return void $moreHistory.addClass('cp-app-contacts-faded');
                }

                debug('getting history');
                var sig = channel.TAIL || channel.HEAD;

                fetching = true;
                var $messagebox = $(getChat(id)).find('.cp-app-contacts-messages');
                execCommand('GET_MORE_HISTORY', {
                    id: id,
                    sig: sig,
                    count: 10
                }, function (e, history) {
                    fetching = false;
                    if (e) { return void console.error(e); }

                    if (history.length === 0) {
                        channel.exhausted = true;
                        return;
                    }

                    history.forEach(function (msg, i) {
                        if (channel.exhausted) { return; }
                        if (msg.sig) {
                            if (i === 0 && history.length > 1 && msg.sig === channel.TAIL) {
                                // First message is usually the lastKnownHash, ignore it
                                return;
                            }
                            if (msg.sig === channel.TAIL) {
                                console.error('No more messages to fetch');
                                channel.exhausted = true;
                                return void $moreHistory.addClass('cp-app-contacts-faded');
                            } else {
                                channel.TAIL = msg.sig;
                            }
                        } else {
                            return void console.error('expected signature');
                        }
                        if (msg.type !== 'MSG') { return; }

                    // FIXME Schlameil the painter (performance does not scale well)
                        channel.messages.unshift(msg);
                        var el_message = markup.message(msg);
                        $messagebox.prepend(el_message);
                    });
                    normalizeLabels($messagebox);
                });
            });

            var removeHistory = h('span.cp-app-contacts-remove-history.fa.fa-eraser', {
                title: Messages.contacts_removeHistoryTitle
            });

            $(removeHistory).click(function () {
                UI.confirm(Messages.contacts_confirmRemoveHistory, function (yes) {
                    if (!yes) { return; }

                    execCommand('CLEAR_OWNED_CHANNEL', id, function (e) {
                        if (e) {
                            console.error(e);
                            UI.alert(Messages.contacts_removeHistoryServerError);
                            return;
                        }
                    });
                });
            });

            var avatar = h('div.cp-avatar');

            var headerContent = [avatar, moreHistory, data.isFriendChat ? removeHistory : undefined];
            if (isApp) {
                headerContent = [
                    h('div.cp-app-contacts-header-title', Messages.contacts_padTitle),
                    moreHistory
                ];
            }
            var header = h('div.cp-app-contacts-header', headerContent);

            var priv = metadataMgr.getPrivateData();

            var closeTips = h('span.fa.fa-window-close.cp-app-contacts-tips-close');
            var tips;
            if (isApp && Util.find(priv.settings, ['general', 'hidetips', 'chat']) !== true) {
                tips = h('div.cp-app-contacts-tips', [
                    closeTips,
                    Messages.contacts_warning
                ]);
            }
            $(closeTips).click(function () {
                $(tips).hide();
                common.setAttribute(['general', 'hidetips', 'chat'], true);
            });

            var messages = h('div.cp-app-contacts-messages');
            var input = h('textarea', {
                placeholder: Messages.contacts_typeHere
            });
            var sendButton = h('button.btn.btn-primary.fa.fa-paper-plane', {
                title: Messages.contacts_send,
            });

            var rightCol = h('span.cp-app-contacts-right-col', [
                h('span.cp-app-contacts-name', displayName),
            ]);

            var $avatar = $(avatar);
            var friend = contactsData[curvePublic] || {};
            if (friend.avatar && avatars[friend.avatar]) {
                $avatar.append(avatars[friend.avatar]).append(rightCol);
            } else {
                common.displayAvatar($avatar, friend.avatar, displayName, function ($img) {
                    if (friend.avatar && $img) {
                        avatars[friend.avatar] = $img[0].outerHTML;
                    }
                    $(rightCol).insertAfter($avatar);
                });
            }

            var sending = false;
            var send = function (content) {
                if (typeof(content) !== 'string' || !content.trim()) { return; }
                if (sending) { return false; }
                sending = true;
                execCommand('SEND_MESSAGE', {
                    id: id,
                    content: content
                }, function (e) {
                    if (e) {
                        // failed to send
                        return void console.error('failed to send', e);
                    }
                    input.value = '';
                    sending = false;
                    debug('sent successfully');
                    scrollChatToBottom();
                });
            };

            var onKeyDown = function (e) {
                // ignore anything that isn't 'enter'
                if (e.keyCode !== 13) { return; }
                // send unless they're holding a ctrl-key or shift
                if (!e.ctrlKey && !e.shiftKey) {
                    send(this.value);
                    return false;
                }

                // insert a newline if they're holding either
                var val = this.value;
                var start = this.selectionStart;
                var end = this.selectionEnd;

                if (![start,end].some(function (x) {
                    return typeof(x) !== 'number';
                })) {
                    this.value = val.slice(0, start) + '\n' + val.slice(end);
                    this.selectionStart = this.selectionEnd = start + 1;
                } else if (document.selection && document.selection.createRange) {
                    this.focus();
                    var range = document.selection.createRange();
                    range.text = '\r\n';
                    range.collapse(false);
                    range.select();
                }
                return false;
            };
            $(input).on('keydown', onKeyDown);
            $(sendButton).click(function () { send(input.value); });

            return h('div.cp-app-contacts-chat', {
                'data-key': id,
                'data-user': data.isFriendChat && curvePublic
            }, [
                header,
                readOnly ? undefined : tips,
                messages,
                readOnly ? undefined : h('div.cp-app-contacts-input', [
                    input,
                    sendButton,
                ]),
            ]);
        };

        var hideInfo = function () {
            $messages.find('.cp-app-contacts-info').hide();
        };

        var showInfo = function () {
            $messages.find('.cp-app-contacts-info').show();
        };

        var updateStatus = function (id) {
            if (!state.channels[id]) { return; }
            var $status = find.inList(id).find('.cp-app-contacts-status');
            execCommand('GET_STATUS', id, function (e, online) {
                // if error maybe you shouldn't display this friend...
                if (e) {
                    find.inList(id).hide();
                    getChat(id).hide();

                    return void console.error(id, e);
                }
                if (online) {
                    return void $status
                        .removeClass('cp-app-contacts-offline').addClass('cp-app-contacts-online');
                }
                $status.removeClass('cp-app-contacts-online').addClass('cp-app-contacts-offline');
            });
        };

        var display = function (chanId) {
            var channel = state.channels[chanId];
            var lastMsg = channel.messages.slice(-1)[0];

            if (lastMsg) {
                channel.HEAD = lastMsg.sig;
                execCommand('SET_CHANNEL_HEAD', {
                    id: chanId,
                    sig: channel.HEAD
                }, function (e) {
                    if (e) { console.error(e); }
                });
            }

            setActive(chanId);
            unnotify(chanId);
            var $chat = getChat(chanId);
            hideInfo();
            $messages.find('div.cp-app-contacts-chat[data-key]').hide();
            if ($chat.length) {
                var $chat_messages = $chat.find('div.cp-app-contacts-message');
                if ($chat_messages.length < 10) {
                    delete channel.needMoreHistory;
                    var $more = $chat.find('.cp-app-contacts-more-history');
                    $more.click();
                }
                $chat.show();
                return;
            } else {
                console.error("Chat is missing... Please reload the page and try again.");
            }
        };

        var removeFriend = function (curvePublic) {
            execCommand('REMOVE_FRIEND', curvePublic, function (e /*, removed */) {
                if (e) { return void console.error(e); }
            });
        };

        markup.room = function (id, room, userlist) {
            var roomEl = h('div.cp-app-contacts-friend.cp-avatar', {
                'data-key': id,
                'data-user': room.isFriendChat ? userlist[0].curvePublic : '',
                title: room.name
            });

            var remove = h('span.cp-app-contacts-remove.fa.fa-user-times', {
                title: Messages.contacts_remove
            });
            var leaveRoom = h('span.cp-app-contacts-remove.fa.fa-sign-out', {
                title: Messages.contacts_leaveRoom
            });

            var status = h('span.cp-app-contacts-status', {
                title: Messages.contacts_online
            });
            var rightCol = h('span.cp-app-contacts-right-col', [
                h('span.cp-app-contacts-name', [room.name]),
                room.isFriendChat ? remove :
                    room.isPadChat ? undefined : leaveRoom,
            ]);

            var friendData = room.isFriendChat ? userlist[0] : {};

            var $room = $(roomEl).click(function () {
                display(id);
            }).dblclick(function () {
                if (friendData.profile) { window.open(origin + '/profile/#' + friendData.profile); }
            });

            $(remove).click(function (e) {
                e.stopPropagation();
                var channel = state.channels[id];
                if (!channel.isFriendChat) { return; }
                var curvePublic = channel.curvePublic;
                var friend = contactsData[curvePublic] || friendData;
                UI.confirm(Messages._getKey('contacts_confirmRemove', [
                    Util.fixHTML(friend.name)
                ]), function (yes) {
                    if (!yes) { return; }
                    removeFriend(curvePublic, function (e) {
                        if (e) { return void console.error(e); }
                    });
                    // TODO remove friend from userlist ui
                    // FIXME seems to trigger EJOINED from netflux-websocket (from server);
                    // (tried to join a channel in which you were already present)
                }, undefined, true);
            });

            if (friendData.avatar && avatars[friendData.avatar]) {
                $room.append(avatars[friendData.avatar]);
                $room.append(rightCol);
            } else {
                common.displayAvatar($room, friendData.avatar, room.name, function ($img) {
                    if (friendData.avatar && $img) {
                        avatars[friendData.avatar] = $img[0].outerHTML;
                    }
                    $room.append(rightCol);
                });
            }
            $room.append(status);
            return $room;
        };

        var isBottomedOut = function ($elem) {
            return ($elem[0].scrollHeight - $elem.scrollTop() === $elem[0].clientHeight);
        };

        var onMessage = function (message) {
            var chanId = message.channel;
            var channel = state.channels[chanId];
            if (!channel) { return; }

            var chat = getChat(chanId);

            debug(message);

            var el_message = markup.message(message);

            common.notify();
            if (message.type === 'MSG') {
                var name = typeof message.name !== "undefined" ?
                        (message.name || Messages.anonymous) :
                        contactsData[message.author].displayName;
                common.notify({title: name, msg: message.text});
            }
            notifyToolbar();

            channel.messages.push(message);

            var $chat = $(chat);
            if (!$chat.length) {
                console.error("Got a message but the chat isn't open");
            }

            var $messagebox = $chat.find('.cp-app-contacts-messages');
            var shouldScroll = isBottomedOut($messagebox);

            $messagebox.append(el_message);

            if (shouldScroll) {
                scrollChatToBottom();
            }
            normalizeLabels($messagebox);
            reorderRooms();

            if (isActive(chanId)) {
                channel.HEAD = message.sig;
                execCommand('SET_CHANNEL_HEAD', {
                    id: chanId,
                    sig: message.sig
                }, function (e) {
                    if (e) { return void console.error(e); }
                });
                return;
            }
            var lastMsg = channel.messages.slice(-1)[0];
            if (lastMsg.sig !== channel.HEAD) {
                return void notify(chanId, message);
            }
            unnotify(chanId);
        };

        var onJoin = function (obj) {
            var channel = obj.id;
            var data = obj.info;
            if (data.curvePublic) {
                contactsData[data.curvePublic] = data;
            }
            updateStatus(channel);
        };
        var onLeave = function (obj) {
            var channel = obj.id;
            var chan = state.channels[channel];
            var data = obj.info;
            // XXX Teams: if someone leaves a room, don't remove their data if they're also a friend
            if (contactsData[data.curvePublic] && !(chan && chan.isFriendChat)) {
                delete contactsData[data.curvePublic];
            }
            updateStatus(channel);
        };

        // change in your friend list
        var onUpdateData = function (data) {
            var info = data.info;
            var types = data.types;
            var channel = data.channel;
            if (!info || !info.curvePublic) { return; }
            // Make sure we don't store useless data (friends data in pad chat or the other way)
            if (channel && !state.channels[channel]) { return; }

            var curvePublic = info.curvePublic;
            contactsData[curvePublic] = info;

            if (types.indexOf('displayName') !== -1) {
                var name = info.displayName;

                // update label in friend list
                $userlist.find(userQuery(curvePublic)).find('.cp-app-contacts-name').text(name);
                $userlist.find(userQuery(curvePublic)).attr('title', name);

                // update title bar and messages
                $messages.find(userQuery(curvePublic) + ' .cp-app-contacts-header ' +
                    '.cp-app-contacts-name, div.cp-app-contacts-message'+
                    userQuery(curvePublic) + ' div.cp-app-contacts-sender').text(name);
            }

            if (types.indexOf('profile') !== -1) {
                // update dblclick event in friend list
                $userlist.find(userQuery(curvePublic)).off('dblclick').dblclick(function () {
                    if (info.profile) { window.open(origin + '/profile/#' + info.profile); }
                });
            }

            if (types.indexOf('avatar') !== -1) {
                var $mAvatar = $messages
                    .find(userQuery(curvePublic) +' .cp-app-contacts-header .cp-avatar');
                var $lAvatar = $userlist.find(userQuery(curvePublic));
                $lAvatar.find('.cp-avatar-default, media-tag').remove();

                var $div = $('<div>');
                common.displayAvatar($div, info.avatar, info.displayName, function ($img) {
                    if (info.avatar && $img) {
                        avatars[info.avatar] = $img[0].outerHTML;
                    }
                    $mAvatar.html($div.html());
                    $lAvatar.find('.cp-app-contacts-right-col').before($div.html());
                });

            }
        };

        var initializeRoom = function (room) {
            var id = room.id;
            initChannel(state, room);

            execCommand('GET_USERLIST', {id: id}, function (e, list) {
                if (e || list.error) { return void console.error(e || list.error); }
                if (!room.isPadChat && (!Array.isArray(list) || !list.length)) {
                    return void console.error("Empty room!");
                }
                debug('userlist: ' + JSON.stringify(list), id);

                var friend = {};

                if (room.isFriendChat) {
                    // This is a friend, the userlist is only one user.
                    friend = list[0];
                    contactsData[friend.curvePublic] = friend;
                }

                var chatbox = markup.chatbox(id, room, friend.curvePublic);
                $(chatbox).hide();
                $messages.append(chatbox);

                var $messagebox = $(chatbox).find('.cp-app-contacts-messages');
                room.messages.forEach(function (msg) {
                    var el_message = markup.message(msg);
                    $messagebox.append(el_message);
                });
                normalizeLabels($messagebox);

                var roomEl = markup.room(id, room, list);

                var $parentEl;
                if (room.isFriendChat) {
                    $parentEl = $userlist.find('.cp-app-contacts-friends');
                } else if (room.isPadChat) {
                    $parentEl = $userlist.find('.cp-app-contacts-padchat');
                } else {
                    $parentEl = $userlist.find('.cp-app-contacts-rooms');
                }
                $parentEl.find('.cp-app-contacts-category-content').append(roomEl);

                reorderRooms();

                updateStatus(id);

                if (isApp && room.isPadChat) {
                    $container.removeClass('cp-app-contacts-initializing');
                    display(room.id);
                }
            });
        };

        var onFriend = function (obj) {
            var curvePublic = obj.curvePublic;
            if (isApp) { return; }
            debug('new friend: ', curvePublic);
            execCommand('GET_ROOMS', {curvePublic: curvePublic}, function (err, rooms) {
                if (err) { return void console.error(err); }
                debug('rooms: ' + JSON.stringify(rooms));
                rooms.forEach(initializeRoom);
            });
        };

        var onUnfriend = function (obj) {
            var curvePublic = obj.curvePublic;
            var removedByMe = obj.fromMe;
            if (isApp) { return; }
            var channel = state.channels[state.active];
            $userlist.find(userQuery(curvePublic)).remove();
            $messages.find(userQuery(curvePublic)).remove();
            if (channel && channel.curvePublic === curvePublic) {
                showInfo();
            }
            if (!removedByMe) {
                // TODO UI.alert if this is triggered by the other guy
            }
        };

        common.getMetadataMgr().onTitleChange(function () {
            var padChat = common.getPadChat();
            var md = common.getMetadataMgr().getMetadata();
            var name = md.title || md.defaultTitle;
            $userlist.find(dataQuery(padChat)).find('.cp-app-contacts-name').text(name);
            $userlist.find(dataQuery(padChat)).attr('title', name);
            $messages.find(dataQuery(padChat) + ' .cp-app-contacts-header .cp-app-contacts-name')
                .text(name);

            var $mAvatar = $messages.find(dataQuery(padChat) +' .cp-app-contacts-header .cp-avatar');
            var $lAvatar = $userlist.find(dataQuery(padChat));
            $lAvatar.find('.cp-avatar-default, media-tag').remove();

            var $div = $('<div>');
            common.displayAvatar($div, null, name, function () {
                $mAvatar.html($div.html());
                $lAvatar.find('.cp-app-contacts-right-col').before($div.html());
            });
        });

        // TODO room
        // var onJoinRoom
        // var onLeaveRoom


        execCommand('GET_MY_INFO', null, function (e, info) {
            contactsData[info.curvePublic] = info;
        });

        var ready = false;
        var onMessengerReady = function () {
            if (isApp) { return; }
            if (ready) { return; }
            ready = true;

            execCommand('GET_ROOMS', null, function (err, rooms) {
                if (err) { return void console.error(err); }

                debug('rooms: ' + JSON.stringify(rooms));
                rooms.forEach(initializeRoom);
            });

            $container.removeClass('cp-app-contacts-initializing');
        };

        var onPadChatReady = function (data) {
            var padChat = common.getPadChat();
            if (data !== padChat) { return; }
            if (state.channels[data]) { return; }
            execCommand('GET_ROOMS', {padChat: data}, function (err, rooms) {
                if (err) { return void console.error(err); }
                if (!Array.isArray(rooms) || rooms.length !== 1) {
                    return void console.error('Invalid pad chat');
                }
                var room = rooms[0];
                var md = common.getMetadataMgr().getMetadata();
                var name = md.title || md.defaultTitle;
                room.name = name;
                rooms.forEach(initializeRoom);
            });
        };

        var onDisconnect = function () {
            debug('disconnected');
            $messages.find('.cp-app-contacts-input textarea').prop('disabled', true);
        };
        var onReconnect = function () {
            debug('reconnected');
            $messages.find('.cp-app-contacts-input textarea').prop('disabled', false);
        };

        // Initialize chat when outer is ready (all channels loaded)
        // TODO: try again in outer if fail to load a channel
        if (!isApp) {
            execCommand('INIT_FRIENDS', null, function () {});
            execCommand('IS_READY', null, function (err, yes) {
                if (yes) { onMessengerReady(); }
            });
        }
        sframeChan.on('EV_CHAT_EVENT', function (obj) {
            var cmd = obj.ev;
            var data = obj.data;
            if (cmd === 'READY') {
                onMessengerReady();
                return;
            }
            if (cmd === 'CLEAR_CHANNEL') {
                clearChannel(data);
                return;
            }
            if (cmd === 'PADCHAT_READY') {
                onPadChatReady(data);
                return;
            }
            if (cmd === 'DISCONNECT') {
                onDisconnect();
                return;
            }
            if (cmd === 'RECONNECT') {
                onReconnect();
                return;
            }
            if (cmd === 'UPDATE_DATA') {
                onUpdateData(data);
                return;
            }
            if (cmd === 'MESSAGE') {
                onMessage(data);
                return;
            }
            if (cmd === 'JOIN') {
                onJoin(data);
                return;
            }
            if (cmd === 'LEAVE') {
                onLeave(data);
                return;
            }
            if (cmd === 'FRIEND') {
                onFriend(data);
                return;
            }
            if (cmd === 'UNFRIEND') {
                onUnfriend(data);
                return;
            }
        });
    };

    return MessengerUI;
});
