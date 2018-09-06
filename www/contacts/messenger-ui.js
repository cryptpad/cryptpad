define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-notifier.js',
    '/common/hyperscript.js',
    '/bower_components/marked/marked.min.js',
    '/common/media-tag.js',
], function ($, Messages, Util, UI, Notifier, h, Marked, MediaTag) {
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
        state.channels[info.id] = {
            messages: [],
            name: info.name,
            isFriendChat: info.isFriendChat,
            curvePublic: info.curvePublic,
            HEAD: info.lastKnownHash,
            TAIL: null,
        };
    };

    MessengerUI.create = function (messenger, $container, common) {
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var origin = metadataMgr.getPrivateData().origin;

        $container.addClass('cp-app-contacts-initializing');

        var messaging = h('div#cp-app-contacts-messaging', [
            h('span.fa.fa-spinner.fa-pulse.fa-4x.fa-fw.cp-app-contacts-spinner'),
            h('div.cp-app-contacts-info', [
                h('h2', Messages.contacts_info1),
                h('ul', [
                    h('li', Messages.contacts_info2),
                    h('li', Messages.contacts_info3),
                ])
            ])
        ]);

        var friendList = h('div#cp-app-contacts-friendlist', [
            h('span.fa.fa-spinner.fa-pulse.fa-4x.fa-fw.cp-app-contacts-spinner'),
        ]);

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

        var notify = function (id) {
            find.inList(id).addClass('cp-app-contacts-notify');
        };
        var unnotify = function (id) {
            find.inList(id).removeClass('cp-app-contacts-notify');
        };

        var m = function (md) {
            var d = h('div.cp-app-contacts-content');
            try {
                d.innerHTML = Marked(md || '');
                var $d = $(d);
                // remove potentially malicious elements
                $d.find('script, iframe, object, applet, video, audio').remove();

                // override link clicking, because we're in an iframe
                $d.find('a').each(function () {
                    var href = $(this).click(function (e) {
                        e.preventDefault();
                        common.openUnsafeURL(href);
                    }).attr('href');
                });

                // activate media-tags
                $d.find('media-tag').each(function (i, e) { MediaTag(e); });
            } catch (e) {
                console.error(md);
                console.error(e);
            }
            return d;
        };

        var markup = {};
        markup.message = function (msg) {
            var curvePublic = msg.author;
            var name = contactsData[msg.author].displayName;
            return h('div.cp-app-contacts-message', {
                title: msg.time? new Date(msg.time).toLocaleString(): '?',
                'data-user': curvePublic,
            }, [
                name? h('div.cp-app-contacts-sender', name): undefined,
                m(msg.text),
            ]);
        };

        var getChat = function (id) {
            return $messages.find(dataQuery(id));
        };

        var normalizeLabels = function ($messagebox) {
            $messagebox.find('div.cp-app-contacts-message').toArray().reduce(function (a, b) {
                var $b = $(b);
                if ($(a).data('user') === $b.data('user')) {
                    $b.find('.cp-app-contacts-sender').hide();
                    return a;
                }
                return b;
            }, []);
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
                messenger.getMoreHistory(id, sig, 10, function (e, history) {
                    fetching = false;
                    if (e) { return void console.error(e); }

                    if (history.length === 0) {
                        channel.exhausted = true;
                        return;
                    }

                    history.forEach(function (msg) {
                        if (channel.exhausted) { return; }
                        if (msg.sig) {
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
                        // XXX trust the server?
                        /*
                        if (channel.messages.some(function (old) {
                            return msg.sig === old.sig;
                        })) { return; }*/

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
                // XXX
                console.error("TODO: only display clear button if owned");
                UI.confirm(Messages.contacts_confirmRemoveHistory, function (yes) {
                    if (!yes) { return; }

                    messenger.clearOwnedChannel(id, function (e) {
                        if (e) {
                            console.error(e);
                            UI.alert(Messages.contacts_removeHistoryServerError);
                            return;
                        }
                        // XXX clear the UI?
                    });
                });
            });

            var avatar = h('div.cp-avatar');
            var header = h('div.cp-app-contacts-header', [
                avatar,
                moreHistory,
                removeHistory,
            ]);
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
            if (data.isFriendChat) {
                var friend = contactsData[curvePublic];
                if (friend.avatar && avatars[friend.avatar]) {
                    $avatar.append(avatars[friend.avatar]).append(rightCol);
                } else {
                    common.displayAvatar($avatar, friend.avatar, friend.displayName, function ($img) {
                        if (friend.avatar && $img) {
                            avatars[friend.avatar] = $img[0].outerHTML;
                        }
                        $(rightCol).insertAfter($avatar);
                    });
                }
            }

            var sending = false;
            var send = function (content) {
                if (typeof(content) !== 'string' || !content.trim()) { return; }
                if (sending) { return false; }
                sending = true;
                messenger.sendMessage(id, content, function (e) {
                    if (e) {
                        // failed to send
                        return void console.error('failed to send');
                    }
                    input.value = '';
                    sending = false;
                    debug('sent successfully');
                    var $messagebox = $(messages);

                    var height = $messagebox[0].scrollHeight;
                    $messagebox.scrollTop(height);
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
                messages,
                h('div.cp-app-contacts-input', [
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
            var $status = find.inList(id).find('.cp-app-contacts-status');
            messenger.getStatus(id, function (e, online) {
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
                messenger.setChannelHead(chanId, channel.HEAD, function (e) {
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
                if (!$chat_messages.length) {
                    var $more = $chat.find('.cp-app-contacts-more-history');
                    $more.click();
                }
                return void $chat.show();
            } else {
                console.error("Chat is missing... Please reload the page and try again.");
            }
        };

        var removeFriend = function (curvePublic) {
            messenger.removeFriend(curvePublic, function (e /*, removed */) {
                if (e) { return void console.error(e); }
            });
        };

        markup.room = function (id, room, userlist) {
            var roomEl = h('div.cp-app-contacts-friend.cp-avatar', {
                'data-key': id,
                'data-user': room.isFriendChat ? userlist[0].curvePublic : ''
            });

            var remove = h('span.cp-app-contacts-remove.fa.fa-user-times', {
                title: Messages.contacts_remove
            });
            var status = h('span.cp-app-contacts-status');
            var rightCol = h('span.cp-app-contacts-right-col', [
                h('span.cp-app-contacts-name', [room.name]),
                remove,
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
                if (channel.isFriendChat) {
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
                } else {
                    // TODO room remove room
                }
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
            return ($elem[0].scrollHeight - $elem.scrollTop() === $elem.outerHeight());
        };

        var initializing = true;
        messenger.on('message', function (message) {
            if (!initializing) { Notifier.notify(); }
            var chanId = message.channel;

            var chat = getChat(chanId);

            debug(message);

            var el_message = markup.message(message);

            var channel = state.channels[chanId];
            if (!channel) {
                console.error('expected channel [%s] to be open', chanId);
                return;
            }

            channel.messages.push(message);

            var $chat = $(chat);
            if (!$chat.length) {
                console.error("Got a message but the chat isn't open");
            }

            var $messagebox = $chat.find('.cp-app-contacts-messages');
            var shouldScroll = isBottomedOut($messagebox);

            $messagebox.append(el_message);

            if (shouldScroll) {
                $messagebox.scrollTop($messagebox.outerHeight());
            }
            normalizeLabels($messagebox);

            if (isActive(chanId)) {
                channel.HEAD = message.sig;
                messenger.setChannelHead(chanId, message.sig, function (e) {
                    if (e) { return void console.error(e); }
                });
                return;
            }
            var lastMsg = channel.messages.slice(-1)[0];
            if (lastMsg.sig !== channel.HEAD) {
                return void notify(chanId);
            }
            unnotify(chanId);
        });

        messenger.on('join', function (data, channel) {
            if (data.curvePublic) {
                contactsData[data.curvePublic] = data;
            }
            updateStatus(channel);
            // TODO room refresh online userlist
        });
        messenger.on('leave', function (data, channel) {
            if (contactsData[data.curvePublic]) {
                delete contactsData[data.curvePublic];
            }
            updateStatus(channel);
            // TODO room refresh online userlist
        });

        // change in your friend list
        messenger.on('update', function (info, types) {
            if (!info || !info.curvePublic) { return; }
            var curvePublic = info.curvePublic;
            contactsData[curvePublic] = info;

            if (types.indexOf('displayName') !== -1) {
                var name = info.displayName;

                // update label in friend list
                $userlist.find(userQuery(curvePublic)).find('.cp-app-contacts-name').text(name);

                // update title bar and messages
                $messages.find(userQuery(curvePublic) + ' .cp-app-contacts-header ' +
                    '.cp-app-contacts-name, div.cp-app-contacts-message'+
                    userQuery(curvePublic) + ' div.cp-app-contacts-sender').text(name);

                // XXX update name in state.channels[id] ??

                // TODO room
                // Update name in room userlist
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
        });

        var execCommand = function (cmd, data, cb) {
            sframeChan.query('Q_CHAT_COMMAND', {cmd: cmd, data: data}, function (err, obj) {
                if (err || obj.error) { return void cb(err || obj.error); }
                cb(void 0, obj);
            });
        };

        var initializeRoom = function (room) {
            var id = room.id;
            initChannel(state, room);

            execCommand('GET_USERLIST', {id: id}, function (e, list) {
                if (e || list.error) { return void console.error(e || list.error); }
                if (!Array.isArray(list) || !list.length) {
                    return void console.error("Empty room!");
                }
                debug('userlist: ' + JSON.stringify(list));

                // This is a friend, the userlist is only one user.
                var friend = list[0];
                contactsData[friend.curvePublic] = friend;

                var chatbox = markup.chatbox(id, room, friend.curvePublic);
                $(chatbox).hide();
                $messages.append(chatbox);

                var roomEl = markup.room(id, room, list);
                $userlist.append(roomEl);

                updateStatus(id);
            });

            // TODO room group chat
        };

        messenger.on('friend', function (curvePublic) {
            debug('new friend: ', curvePublic);
            execCommand('GET_ROOMS', curvePublic, function (err, rooms) {
                if (err) { return void console.error(err); }
                debug('rooms: ' + JSON.stringify(rooms));
                rooms.forEach(initializeRoom);
            });
        });

        messenger.on('unfriend', function (curvePublic, removedByMe) {
            var channel = state.channels[state.active];
            $userlist.find(userQuery(curvePublic)).remove();
            $messages.find(userQuery(curvePublic)).remove();
            if (channel && channel.curvePublic === curvePublic) {
                showInfo();
            }
            if (!removedByMe) {
                // TODO UI.alert if this is triggered by the other guy
            }
        });


        // TODO room
        // messenger.on('joinroom', function (chanid))
        // messenger.on('leaveroom', function (chanid))


        messenger.getMyInfo(function (e, info) {
            contactsData[info.curvePublic] = info;
        });

        var ready = false;
        var onMessengerReady = function () {
            if (ready) { return; }
            ready = true;

            execCommand('GET_ROOMS', null, function (err, rooms) {
                if (err) { return void console.error(err); }

                debug('rooms: ' + JSON.stringify(rooms));
                rooms.forEach(initializeRoom);
            });

            $container.removeClass('cp-app-contacts-initializing');
        };

        // Initialize chat when outer is ready (all channels loaded)
        // TODO: try again in outer if fail to load a channel
        execCommand('IS_READY', null, function (err, yes) {
            if (yes) { onMessengerReady(); }
        });
        sframeChan.on('EV_CHAT_EVENT', function (data) {
            if (data.ev === 'READY') {
                onMessengerReady();
                return;
            }
        });
    };

    return MessengerUI;
});
