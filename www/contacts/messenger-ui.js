define([
    'jquery',
    '/common/cryptpad-common.js',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/bower_components/marked/marked.min.js',
    '/common/media-tag.js',
], function ($, Cryptpad, Messages, Util, UI, h, Marked, MediaTag) {
    'use strict';

    var UI = {};

    var m = function (md) {
        var d = h('div.cp-app-contacts-content');
        try {
            d.innerHTML = Marked(md || '');
            var $d = $(d);
            // remove potentially malicious elements
            $d.find('script, iframe, object, applet, video, audio').remove();

            // activate media-tags
            $d.find('media-tag').each(function (i, e) { MediaTag(e); });
        } catch (e) {
            console.error(md);
            console.error(e);
        }
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
            TAIL: null,
        };
    };

    UI.create = function (messenger, $userlist, $messages, common) {
        var origin = common.getMetadataMgr().getPrivateData().origin;

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
            find.inList(curvePublic).addClass('cp-app-contacts-notify');
        };
        var unnotify = function (curvePublic) {
            find.inList(curvePublic).removeClass('cp-app-contacts-notify');
        };

        var markup = {};
        markup.message = function (msg) {
            var curvePublic = msg.author;
            var name = displayNames[msg.author];
            return h('div.cp-app-contacts-message', {
                title: msg.time? new Date(msg.time).toLocaleString(): '?',
                'data-key': curvePublic,
            }, [
                name? h('div.cp-app-contacts-sender', name): undefined,
                m(msg.text),
            ]);
        };

        var getChat = function (curvePublic) {
            return $messages.find(dataQuery(curvePublic));
        };

        var normalizeLabels = function ($messagebox) {
            $messagebox.find('div.cp-app-contacts-message').toArray().reduce(function (a, b) {
                var $b = $(b);
                if ($(a).data('key') === $b.data('key')) {
                    $b.find('.cp-app-contacts-sender').hide();
                    return a;
                }
                return b;
            }, []);
        };

        markup.chatbox = function (curvePublic, data) {
            var moreHistory = h('span.cp-app-contacts-more-history.fa.fa-history', {
                title: Messages.contacts_fetchHistory,
            });
            var displayName = data.displayName;

            var fetching = false;
            var $moreHistory = $(moreHistory).click(function () {
                if (fetching) { return; }

                // get oldest known message...
                var channel = state.channels[curvePublic];

                if (channel.exhausted) {
                    return void $moreHistory.addClass('cp-app-contacts-faded');
                }

                console.log('getting history');
                var sig = channel.TAIL || channel.HEAD;

                fetching = true;
                var $messagebox = $(getChat(curvePublic)).find('.cp-app-contacts-messages');
                messenger.getMoreHistory(curvePublic, sig, 10, function (e, history) {
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
                                console.log(channel);
                                return void $moreHistory.addClass('cp-app-contacts-faded');
                            } else {
                                channel.TAIL = msg.sig;
                            }
                        } else {
                            return void console.error('expected signature');
                        }
                        if (msg.type !== 'MSG') { return; }

                    // FIXME Schlameil the painter (performance does not scale well)
                        if (channel.messages.some(function (old) {
                            return msg.sig === old.sig;
                        })) { return; }

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
                    Cryptpad.clearOwnedChannel(data.channel, function (e) {
                        if (e) {
                            console.error(e);
                            UI.alert(Messages.contacts_removeHistoryServerError);
                            return;
                        }
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
            if (data.avatar && avatars[data.avatar]) {
                $avatar.append(avatars[data.avatar]).append(rightCol);
            } else {
                common.displayAvatar($avatar, data.avatar, data.displayName, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $(rightCol).insertAfter($avatar);
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

            return h('div.cp-app-contacts-chat', {
                'data-key': curvePublic,
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

        var updateStatus = function (curvePublic) {
            var $status = find.inList(curvePublic).find('.cp-app-contacts-status');
            // FIXME this stopped working :(
            messenger.getStatus(curvePublic, function (e, online) {
                // if error maybe you shouldn't display this friend...
                if (e) {
                    find.inList(curvePublic).hide();
                    getChat(curvePublic).hide();

                    return void console.error(curvePublic, e);
                }
                if (online) {
                    return void $status
                        .removeClass('cp-app-contacts-offline').addClass('cp-app-contacts-online');
                }
                $status.removeClass('cp-app-contacts-online').addClass('cp-app-contacts-offline');
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
            $messages.find('div.cp-app-contacts-chat[data-key]').hide();
            if ($chat.length) {
                var $chat_messages = $chat.find('div.cp-app-contacts-message');
                if (!$chat_messages.length) {
                    var $more = $chat.find('.cp-app-contacts-more-history');
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
            messenger.removeFriend(curvePublic, function (e /*, removed */) {
                if (e) { return void console.error(e); }
                find.inList(curvePublic).remove();
                //console.log(removed);
            });
        };

        markup.friend = function (data) {
            var curvePublic = data.curvePublic;
            var friend = h('div.cp-app-contacts-friend.cp-avatar', {
                'data-key': curvePublic,
            });

            var remove = h('span.cp-app-contacts-remove.fa.fa-user-times', {
                title: Messages.contacts_remove
            });
            var status = h('span.cp-app-contacts-status');
            var rightCol = h('span.cp-app-contacts-right-col', [
                h('span.cp-app-contacts-name', [data.displayName]),
                remove,
            ]);

            var $friend = $(friend)
            .click(function () {
                display(curvePublic);
            })
            .dblclick(function () {
                if (data.profile) { window.open(origin + '/profile/#' + data.profile); }
            });

            $(remove).click(function (e) {
                e.stopPropagation();
                UI.confirm(Messages._getKey('contacts_confirmRemove', [
                    Util.fixHTML(data.displayName)
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

            if (data.avatar && avatars[data.avatar]) {
                $friend.append(avatars[data.avatar]);
                $friend.append(rightCol);
            } else {
                common.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $friend.append(rightCol);
                });
            }
            $friend.append(status);
            return $friend;
        };

        var isBottomedOut = function ($elem) {
            return ($elem[0].scrollHeight - $elem.scrollTop() === $elem.outerHeight());
        };

        var initializing = true;
        messenger.on('message', function (message) {
            if (!initializing) { Cryptpad.notify(); }
            var curvePublic = message.curve;

            var name = displayNames[curvePublic];
            var chat = getChat(curvePublic, name);

            console.log(message);

            var el_message = markup.message(message);

            state.channels[curvePublic].messages.push(message);

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
            channel = channel;
            updateStatus(curvePublic);
        });
        messenger.on('leave', function (curvePublic, channel) {
            channel = channel;
            updateStatus(curvePublic);
        });

        // change in your friend list
        messenger.on('update', function (info, curvePublic) {
            var name = displayNames[curvePublic] = info.displayName;

            // update label in friend list
            find.inList(curvePublic).find('.cp-app-contacts-name').text(name);

            // update title bar and messages
            $messages.find(dataQuery(curvePublic) + ' .cp-app-contacts-header ' +
                '.cp-app-contacts-name, div.cp-app-contacts-message'+
                dataQuery(curvePublic) + ' div.cp-app-contacts-sender').text(name).text(name);
        });

        var connectToFriend = function (curvePublic, cb) {
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
                    cb();
                    updateStatus(curvePublic);
                    // don't add friends that are already in your userlist
                    //if (friendExistsInUserList(k)) { return; }
                });
            });
        };

        messenger.on('friend', function (curvePublic) {
            console.log('new friend: ', curvePublic);
            //console.error("TODO redraw user list");
            //console.error("TODO connect to new friend");
            // FIXME this doesn't work right now because the friend hasn't been fully added?
            connectToFriend(curvePublic, function () {
                //console.error('connected');
            });
        });

        messenger.on('unfriend', function (curvePublic) {
            console.log('unfriend', curvePublic);
            find.inList(curvePublic).remove();
            console.error('TODO remove chatbox');
            console.error('TODO show something if that chatbox was active');
        });

        Cryptpad.onDisplayNameChanged(function () {
            //messenger.checkNewFriends();
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
                connectToFriend(curvePublic, ready);
            });
        });
    };

    return UI;
});
