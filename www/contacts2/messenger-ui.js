define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/hyperscript.js',
    '/bower_components/marked/marked.min.js',
], function ($, Cryptpad, h, Marked) {
    'use strict';
    // TODO use our fancy markdown and support media-tags
    Marked.setOptions({ sanitize: true, });

    var UI = {};
    var Messages = Cryptpad.Messages;

    var m = function (md) {
        var d = h('div.content');
        d.innerHTML = Marked(md || '');
        return d;
    };

    var dataQuery = function (curvePublic) {
        return '[data-key="' + curvePublic + '"]';
    };

    var initChannel = function (state, curvePublic, info) {
        console.log('initializing channel for [%s]', curvePublic);
        state.channels[curvePublic] = {
            messages: [],
            HEAD: info.lastKnownHash,
        };
    };

    UI.create = function (messenger, $userlist, $messages) {
        var state = window.state = {
            active: '',
        };

        state.channels = {};
        var displayNames = state.displayNames = {};

        var avatars = state.avatars = {};
        var setActive = function (curvePublic) {
            state.active = curvePublic;
        };
        var isActive = function (curvePublic) {
            return curvePublic === state.active;
        };

        var find = {};
        find.inList = function (curvePublic) {
            return $userlist.find(dataQuery(curvePublic));
        };

        var notify = function (curvePublic) {
            find.inList(curvePublic).addClass('notify');
        };
        var unnotify = function (curvePublic) {
            find.inList(curvePublic).removeClass('notify');
        };

        var markup = {};
        markup.message = function (msg) {
            var curvePublic = msg.author;
            var name = displayNames[msg.author];
            return h('div.message', {
                title: msg.time? new Date(msg.time).toLocaleString(): '?',
                'data-key': curvePublic,
            }, [
                name? h('div.sender', name): undefined,
                m(msg.text),
            ]);
        };

        var getChat = function (curvePublic) {
            return $messages.find(dataQuery(curvePublic));
        };

        var normalizeLabels = function ($messagebox) {
            $messagebox.find('div.message').toArray().reduce(function (a, b) {
                var $b = $(b);
                if ($(a).data('key') === $b.data('key')) {
                    $b.find('.sender').hide();
                    return a;
                }
                return b;
            });
        };

        markup.chatbox = function (curvePublic, data) {
            var moreHistory = h('span.more-history.fa.fa-history', {
                title: Messages.contacts_fetchHistory,
            });
            var displayName = data.displayName;

            var fetching = false;
            $(moreHistory).click(function () {
                console.log('getting history');

                // get oldest known message...
                var channel = state.channels[curvePublic];
                var sig = !(channel.messages && channel.messages.length)?
                    channel.HEAD: channel.messages[0].sig;

                fetching = true;
                var $messagebox = $(getChat(curvePublic)).find('.messages');
                messenger.getMoreHistory(curvePublic, sig, 10, function (e, history) {
                    fetching = false;
                    if (e) { return void console.error(e); }
                    history.forEach(function (msg) {
                        channel.messages.unshift(msg);
                        var el_message = markup.message(msg);
                        $messagebox.prepend(el_message);
                    });
                    normalizeLabels($messagebox);
                });
            });

            var removeHistory = h('span.remove-history.fa.fa-eraser', {
                title: Messages.contacts_removeHistoryTitle
            });

            $(removeHistory).click(function () {
                Cryptpad.confirm(Messages.contacts_confirmRemoveHistory, function (yes) {
                    if (!yes) { return; }
                    Cryptpad.clearOwnedChannel(data.channel, function (e) {
                        if (e) {
                            console.error(e);
                            Cryptpad.alert(Messages.contacts_removeHistoryServerError);
                            return;
                        }
                    });
                });
            });

            var avatar = h('div.avatar');
            var header = h('div.header', [
                avatar,
                moreHistory,
                removeHistory,
            ]);
            var messages = h('div.messages');
            var input = h('textarea', {
                placeholder: Messages.contacts_typeHere
            });
            var sendButton = h('button.btn.btn-primary.fa.fa-paper-plane', {
                title: Messages.contacts_send,
            });

            var rightCol = h('span.right-col', [
                h('span.name', displayName),
            ]);

            var $avatar = $(avatar);
            if (data.avatar && avatars[data.avatar]) {
                $avatar.append(avatars[data.avatar]).append(rightCol);
            } else {
                Cryptpad.displayAvatar($avatar, data.avatar, data.displayName, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $avatar.append(rightCol);
                });
            }

            var sending = false;
            var send = function (content) {
                if (typeof(content) !== 'string' || !content.trim()) { return; }
                if (sending) { return false; }
                sending = true;
                messenger.sendMessage(curvePublic, content, function (e) {
                    if (e) {
                        // failed to send
                        return void console.error('failed to send');
                    }
                    input.value = '';
                    sending = false;
                    console.log('sent successfully');
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
                var start = this.selectionState;
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

            return h('div.chat', {
                'data-key': curvePublic,
            }, [
                header,
                messages,
                h('div.input', [
                    input,
                    sendButton,
                ]),
            ]);
        };

        var hideInfo = function () {
            $messages.find('.info').hide();
        };

        var updateStatus = function (curvePublic) {
            var $status = find.inList(curvePublic).find('.status');
            // FIXME this stopped working :(
            messenger.getStatus(curvePublic, function (e, online) {
                if (e) { return void console.error(curvePublic, e); }
                if (online) {
                    return void $status
                        .removeClass('offline').addClass('online');
                }
                $status.removeClass('online').addClass('offline');
            });
        };

        var display = function (curvePublic) {
            var channel = state.channels[curvePublic];
            var lastMsg = channel.messages.slice(-1)[0];

            if (lastMsg) {
                channel.HEAD = lastMsg.sig;
                messenger.setChannelHead(curvePublic, channel.HEAD, function (e) {
                    if (e) { console.error(e); }
                });
            }

            setActive(curvePublic);
            unnotify(curvePublic);
            var $chat = getChat(curvePublic);
            hideInfo();
            $messages.find('div.chat[data-key]').hide();
            if ($chat.length) {
                var $chat_messages = $chat.find('div.message');
                if (!$chat_messages.length) {
                    var $more = $chat.find('.more-history');
                    console.log($more);
                    $more.click();
                }
                return void $chat.show();
            }
            messenger.getFriendInfo(curvePublic, function (e, info) {
                if (e) { return void console.error(e); } // FIXME
                var chatbox = markup.chatbox(curvePublic, info);
                $messages.append(chatbox);
            });
        };

        var removeFriend = function (curvePublic) {
            messenger.removeFriend(curvePublic, function (e, removed) {
                if (e) { return void console.error(e); }
                console.log(removed);
            });
        };

/*      var friendExistsInUserList = function (curvePublic) {
            return !!$userlist.find(dataQuery(curvePublic)).length;
        }; */

        markup.friend = function (data) {
            var curvePublic = data.curvePublic;
            var friend = h('div.friend.avatar', {
                'data-key': curvePublic,
            });

            var remove = h('span.remove.fa.fa-user-times', {
                title: Messages.contacts_remove
            });
            var status = h('span.status');
            var rightCol = h('span.right-col', [
                h('span.name', [data.displayName]),
                remove,
            ]);

            var $friend = $(friend)
            .click(function () {
                display(curvePublic);
            })
            .dblclick(function () {
                if (data.profile) { window.open('/profile/#' + data.profile); }
            });

            $(remove).click(function (e) {
                e.stopPropagation();
                Cryptpad.confirm(Messages._getKey('contacts_confirmRemove', [
                    Cryptpad.fixHTML(data.displayName)
                ]), function (yes) {
                    if (!yes) { return; }
                    removeFriend(curvePublic);
                    // TODO remove friend from userlist ui
                    // FIXME seems to trigger EJOINED from netflux-websocket (from server);
                    // (tried to join a channel in which you were already present)
                }, undefined, true);
            });

            if (data.avatar && avatars[data.avatar]) {
                $friend.append(avatars[data.avatar]);
                $friend.append(rightCol);
            } else {
                Cryptpad.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $friend.append(rightCol);
                });
            }
            $friend.append(status);
            return $friend;
        };


        var initializing = true;

        messenger.on('message', function (message) {
            console.log(JSON.stringify(message));
            if (!initializing) { Cryptpad.notify(); }
            var curvePublic = message.curve;

            var name = displayNames[curvePublic];
            var chat = getChat(curvePublic, name);
            var el_message = markup.message(message);

            state.channels[curvePublic].messages.push(message);

            var $chat = $(chat);
            var $messagebox = $chat.find('.messages').append(el_message);
            normalizeLabels($messagebox);

            var channel = state.channels[curvePublic];
            if (!channel) {
                console.error('expected channel [%s] to be open', curvePublic);
                return;
            }

            if (isActive(curvePublic)) {
                channel.HEAD = message.sig;
                messenger.setChannelHead(curvePublic, message.sig, function (e) {
                    if (e) { return void console.error(e); }
                });
                return;
            }
            var lastMsg = channel.messages.slice(-1)[0];
            if (lastMsg.sig !== channel.HEAD) {
                return void notify(curvePublic);
            }
            unnotify(curvePublic);
        });

        messenger.on('join', function (curvePublic, channel) {
            //console.log('join', curvePublic, channel);
            channel = channel;
            updateStatus(curvePublic);
        });
        messenger.on('leave', function (curvePublic, channel) {
            //console.log('leave', curvePublic, channel);
            channel = channel;
            updateStatus(curvePublic);
        });

        // change in your friend list
        messenger.on('update', function (info, curvePublic) {
            curvePublic = curvePublic;
        });

        Cryptpad.onDisplayNameChanged(function () {
            messenger.checkNewFriends();
            messenger.updateMyData();
        });

        // FIXME dirty hack
        messenger.getMyInfo(function (e, info) {
            displayNames[info.curvePublic] = info.displayName;
        });

        messenger.getFriendList(function (e, keys) {
            var count = keys.length + 1;

            var ready = function () {
                count--;
                if (count === 0) {
                    initializing = false;
                    Cryptpad.removeLoadingScreen();
                }
            };

            ready();
            keys.forEach(function (curvePublic) {
                messenger.getFriendInfo(curvePublic, function (e, info) {
                    if (e) { return void console.error(e); }
                    var name = displayNames[curvePublic] = info.displayName;
                    initChannel(state, curvePublic, info);

                    var chatbox = markup.chatbox(curvePublic, info);
                    $(chatbox).hide();
                    $messages.append(chatbox);

                    var friend = markup.friend(info, name);
                    $userlist.append(friend);
                    messenger.openFriendChannel(curvePublic, function (e) {
                        if (e) { return void console.error(e); }
                        ready(info);
                        ready();
                        updateStatus(curvePublic);
                        // don't add friends that are already in your userlist
                        //if (friendExistsInUserList(k)) { return; }
                    });
                });
            });
        });
    };

    return UI;
});
