define([
    'jquery',
    '/common/cryptpad-common.js',
    '/common/hyperscript.js',
    '/bower_components/marked/marked.min.js',
], function ($, Cryptpad, h, Marked) {
    // TODO use our fancy markdown and support media-tags
    Marked.setOptions({ sanitize: true, });

    var UI = {};
    var Messages = Cryptpad.Messages;

    var stub = function (label) {
        console.error('stub: ' + label);
    };

    var dataQuery = function (curvePublic) {
        return '[data-key="' + curvePublic + '"]';
    };

    UI.create = function (messenger, $userlist, $messages) {
        var state = {
            active: '',
        };
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
        markup.message = function (msg, name) {
            return h('div.message', {
                title: msg.time? new Date(msg.time).toLocaleString(): '?',
            }, [
                name? h('div.sender', name): undefined,
                h('div.content', msg.text),
            ]);
        };

        markup.chatbox = function (curvePublic, data) {
            var moreHistory = h('span.more-history', ['get more history']); // TODO translate
            var displayName = data.displayName;

            $(moreHistory).click(function () {
                stub('get older history');
                console.log('getting history');
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

        var getChat = function (curvePublic) {
            return $messages.find(dataQuery(curvePublic));
        };

        var updateStatus = function (curvePublic) {
            var $status = find.inList(curvePublic).find('.status');
            messenger.getStatus(curvePublic, function (e, online) {
                if (e) { return void console.error(e); }
                if (online) {
                    return void $status
                        .removeClass('offline').addClass('online');
                }
                $status.removeClass('online').addClass('offline');
            });
        };

        var display = function (curvePublic) {
            setActive(curvePublic);
            unnotify(curvePublic);
            var $chat = getChat(curvePublic);
            hideInfo();
            $messages.find('div.chat[data-key]').hide();
            if ($chat.length) {
                return void $chat.show();
            }
            messenger.getFriendInfo(curvePublic, function (e, info) {
                if (e) { return void console.error(e); } // FIXME
                $messages.append(markup.chatbox(curvePublic, info));
            });
        };

        var removeFriend = function (curvePublic) {
            messenger.removeFriend(curvePublic, function (e, removed) {
                if (e) { return void console.error(e); }
                console.log(removed);
            });
        };

        var friendExistsInUserList = function (curvePublic) {
            return !!$userlist.find(dataQuery(curvePublic)).length;
        };

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
                    stub('remove friend: ' + curvePublic);
                    removeFriend(curvePublic);
                });
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

        var displayNames = {};

        messenger.on('message', function (message) {
            console.log(JSON.stringify(message));
            Cryptpad.notify();
            var curvePublic = message.curve;

            if (!isActive(curvePublic)) { notify(curvePublic); }

            var name = displayNames[curvePublic];
            var chat = getChat(curvePublic, name);
            var el_message = markup.message(message, name);

            var $chat = $(chat);
            console.log(chat, $chat, el_message.outerHTML);
            $chat.find('.messages').append(el_message);

            // TODO notify if a message is newer than `lastKnownHash`
        });

        messenger.on('join', function (curvePublic, channel) {
            console.log('join', curvePublic, channel);
            updateStatus(curvePublic);
        });
        messenger.on('leave', function (curvePublic, channel) {
            console.log('leave', curvePublic, channel);
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

        messenger.getFriendList(function (e, keys) {
            keys.forEach(function (k) {
                messenger.openFriendChannel(k, function (e) {
                    if (e) { return void console.error(e); }
                    // don't add friends that are already in your userlist
                    if (friendExistsInUserList(k)) { return; }

                    messenger.getFriendInfo(k, function (e, info) {
                        if (e) { return console.error(e); }
                        var curvePublic = info.curvePublic;
                        var name = displayNames[curvePublic] = info.displayName;
                        var friend = markup.friend(info, name);
                        $userlist.append(friend);
                        updateStatus(curvePublic);
                    });
                });
            });
        });
    };

    return UI;
});
