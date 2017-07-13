define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js'
], function ($, Crypto, Curve) {
    var Msg = {};

    var Types = {
        message: 'MSG',
        update: 'UPDATE',
        unfriend: 'UNFRIEND'
    };

    // TODO: pin the chat channel!


    // TODO: new Types
    // - send a rename message to the chat
    // - petnames
    // - close a chat / remove a friend

    // TODO
    // - mute a channel (hide notifications or don't open it?)
    // 

    var pending = {};

    var createData = Msg.createData = function (common, hash) {
        var proxy = common.getProxy();
        return {
            channel: hash || common.createChannelId(),
            displayName: proxy[common.displayNameKey],
            profile: proxy.profile && proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic,
            avatar: proxy.profile && proxy.profile.avatar
        };
    };

    var getFriend = function (common, pubkey) {
        var proxy = common.getProxy();
        if (pubkey === proxy.edPublic) {
            var data = createData(common);
            delete data.channel;
            return data;
        }
        return proxy.friends ? proxy.friends[pubkey] : undefined;
    };

    var removeFromFriendList = Msg.removeFromFriendList = function (common, edPublic, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            return;
        }
        var friends = proxy.friends;
        delete friends[edPublic];
        common.whenRealtimeSyncs(common.getRealtime(), cb);
    };

    var getFriendList = Msg.getFriendList = function (common) {
        var proxy = common.getProxy();
        return proxy.friends || {};
    };

    Msg.getFriendChannelsList = function (common) {
        var friends = getFriendList(common);
        var list = [];
        Object.keys(friends).forEach(function (key) {
            list.push(friends[key].channel);
        });
        return list;
    };

    // Messaging tools

    var avatars = {};
    Msg.getFriendListUI = function (common, open, remove) {
        var proxy = common.getProxy();
        var $block = $('<div>');
        var friends = proxy.friends || {};
        Object.keys(friends).forEach(function (f) {
            var data = friends[f];
            var $friend = $('<div>', {'class': 'friend avatar'}).appendTo($block);
            $friend.data('key', f);
            var $rightCol = $('<span>', {'class': 'right-col'});
            $('<span>', {'class': 'name'}).text(data.displayName).appendTo($rightCol);
            var $remove = $('<span>', {'class': 'remove fa fa-user-times'}).appendTo($rightCol);
            $friend.dblclick(function () {
                if (data.profile) {
                    window.open('/profile/#' + data.profile);
                }
            });
            $friend.click(function () {
                open(data.edPublic);
            });
            $remove.click(function (e) {
                e.stopPropagation();
                Cryptpad.confirm("TODO: Are you sure?", function (yes) {
                    if (!yes) { return; }
                    remove(data.edPublic);
                });
            });
            if (data.avatar && avatars[data.avatar]) {
                $friend.append(avatars[data.avatar]);
                $friend.append($rightCol);
            } else {
                common.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                    if (data.avatar && $img) {
                        avatars[data.avatar] = $img[0].outerHTML;
                    }
                    $friend.append($rightCol);
                });
            }
        });
        return $block;
    };

    Msg.createOwnedChannel = function (common, channelId, validateKey, owners, cb) {
        var network = common.getNetwork();
        network.join(channelId).then(function (wc) {
            var cfg = {
                validateKey: validateKey,
                owners: owners
            };
            var msg = ['GET_HISTORY', wc.id, cfg];
            network.sendto(network.historyKeeper, JSON.stringify(msg)).then(cb, function (err) {
                throw new Error(err);
            });
        }, function (err) {
            throw new Error(err);
        });
    };

    var channels = Msg.channels  = window.channels = {};

    var pushMsg = function (common, channel, cryptMsg) {
        var msg = channel.encryptor.decrypt(cryptMsg);
        var parsedMsg = JSON.parse(msg);
        console.log(parsedMsg);
        if (parsedMsg[0] === Types.message) {
            parsedMsg.shift();
            channel.messages.push([cryptMsg.slice(0,64), parsedMsg]);
            return;
        }
        if (parsedMsg[0] === Types.update) {
            var proxy = common.getProxy();
            if (parsedMsg[1] === common.getProxy().edPublic) { return; }
            var newdata = parsedMsg[3];
            var data = getFriend(common, parsedMsg[1]);
            var types = []
            Object.keys(newdata).forEach(function (k) {
                if (data[k] !== newdata[k]) {
                    types.push(k);
                    data[k] = newdata[k];
                }
            });
            channel.updateUI(types);
            return;
        }
        if (parsedMsg[0] === Types.unfriend) {
            var proxy = common.getProxy();
            if (parsedMsg[1] === common.getProxy().edPublic) { return; }
            channel.wc.leave(Types.unfriend);
            channel.removeUI();
            return;
        }
    };

    var onDirectMessage = function (common, msg, sender) {
        if (sender !== Msg.hk) { return; }
        var parsed = JSON.parse(msg);
        if ((parsed.validateKey || parsed.owners) && parsed.channel) {
            return;
        }
        if (parsed.state && parsed.state === 1 && parsed.channel) {
            if (channels[parsed.channel]) {
                // parsed.channel is Ready
                // TODO: call a function that shows that the channel is ready? (remove a spinner, ...)
                // channel[parsed.channel].ready();
                channels[parsed.channel].ready = true;
                var updateTypes = channels[parsed.channel].updateOnReady;
                if (updateTypes) {
                    channels[parsed.channel].updateUI(updateTypes);
                }
            }
            return;
        }
        var chan = parsed[3];
        if (!chan || !channels[chan]) { return; }
        pushMsg(common, channels[chan], parsed[4]);
    };
    var onMessage = function (common, msg, sender, chan) {
        if (!channels[chan.id]) { return; }
        pushMsg(common, channels[chan.id], msg);
        channels[chan.id].notify();
        channels[chan.id].refresh();
    };

    var createChatBox = function (common, $container, edPublic) {
        var data = getFriend(common, edPublic);
        var proxy = common.getProxy();

        var $header = $('<div>', {'class': 'header avatar'}).appendTo($container);
        $('<div>', {'class': 'messages'}).appendTo($container);
        var $inputBlock = $('<div>', {'class': 'input'}).appendTo($container);

        // Input
        var channel = channels[data.channel];
        var $input = $('<input>', {type: 'text'}).appendTo($inputBlock);
        var send = function () {
            if (!$input.val()) { return; }
            // Send the message
            var msg = [Types.message, proxy.edPublic, +new Date(), $input.val()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);
            channel.wc.bcast(cryptMsg).then(function () {
                $input.val('');
                pushMsg(common, channel, cryptMsg);
                channel.refresh();
            }, function (err) {
                console.error(err);
            });
        };
        $('<button>').text('TODO: Send').appendTo($inputBlock).click(send); // XXX
        $input.on('keypress', function (e) {
            if (e.which === 13) { send(); }
        });

        // Header
        var $rightCol = $('<span>', {'class': 'right-col'});
        $('<span>', {'class': 'name'}).text(data.displayName).appendTo($rightCol);
        if (data.avatar && avatars[data.avatar]) {
            $header.append(avatars[data.avatar]);
            $header.append($rightCol);
        } else {
            common.displayAvatar($header, data.avatar, data.displayName, function ($img) {
                if (data.avatar && $img) {
                    avatars[data.avatar] = $img[0].outerHTML;
                }
                $header.append($rightCol);
            });
        }

    };

    Msg.init = function (common, $listContainer, $msgContainer) {
        var network = common.getNetwork();
        var proxy = common.getProxy();
        Msg.hk = network.historyKeeper;
        var friends = getFriendList(common);
        network.on('message', function(msg, sender) {
            onDirectMessage(common, msg, sender);
        });

        // Refresh the active channel
        var refresh = function (edPublic) {
            if (Msg.active !== edPublic) { return; }
            var data = friends[edPublic];
            var channel = channels[data.channel];
            if (!channel) { return; }

            var $chat = $msgContainer.find('.chat').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });

            if (!$chat.length) { return; }
            // Add new messages
            var messages = channel.messages;
            var $messages = $chat.find('.messages');
            var $msg, msg, date, name;
            var last = typeof(channel.lastDisplayed) === 'number'? channel.lastDisplayed: -1;
            for (var i = last + 1; i<messages.length; i++) {
                msg = messages[i][1]; // 0 is the hash, 1 the array
                $msg = $('<div>', {'class': 'message'}).appendTo($messages);

                // date
                date = msg[1] ? new Date(msg[1]).toLocaleString() : '?';
                //$('<div>', {'class':'date'}).text(date).appendTo($msg);
                $msg.attr('title', date);

                // name
                if (msg[0] !== channel.lastSender) {
                    name = getFriend(common, msg[0]).displayName;
                    $('<div>', {'class':'sender'}).text(name).appendTo($msg);
                }
                channel.lastSender = msg[0];

                // content
                $('<div>', {'class':'content'}).text(msg[2]).appendTo($msg);
            }
            $messages.scrollTop($messages[0].scrollHeight);
            channel.lastDisplayed = i-1;
            channel.unnotify();

            if (messages.length > 10) {
                var lastKnownMsg = messages[messages.length - 11];
                data.lastKnownHash = lastKnownMsg[0];
            }
        };
        // Display a new channel
        var display = function (edPublic) {
            var isNew = false;
            var $chat = $msgContainer.find('.chat').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });
            if (!$chat.length) {
                $chat = $('<div>', {'class':'chat'}).data('key', edPublic).appendTo($msgContainer);
                createChatBox(common, $chat, edPublic);
                isNew = true;
            }
            // Show the correct div
            $msgContainer.find('.chat').hide();
            $chat.show();

            Msg.active = edPublic;

            refresh(edPublic);
        };

        var remove = function (edPublic) {
            var data = getFriend(common, edPublic);
            var channel = channels[data.channel];
            var newdata = createData(common, data.channel);
            var msg = [Types.unfriend, proxy.edPublic, +new Date()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);
            channel.wc.bcast(cryptMsg).then(function () {
                removeFromFriendList(common, edPublici, function () {
                    channel.wc.leave(Types.unfriend);
                    channel.removeUI();
                });
            }, function (err) {
                console.error(err);
            });
        };

        // Display friend list
        common.getFriendListUI(common, display, remove).appendTo($listContainer);

        // Notify on new messages
        var notify = function (edPublic) {
            if (Msg.active === edPublic) { return; }
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });
            $friend.addClass('notify');
        };
        var unnotify = function (edPublic) {
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });
            $friend.removeClass('notify');
        };
        var removeUI = function (edPublic) {
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });
            $friend.remove();
        };
        var updateUI = function (edPublic, types) {
            var data = getFriend(common, edPublic);
            var chan = channels[data.channel];
            if (!chan.ready) {
                chan.updateOnReady = (chan.updateOnReady || []).concat(types);
                return;
            }
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === edPublic;
            });
            if (types.indexOf('displayName') >= 0) {
                $friend.find('.name').text(data.displayName);
            }
            if (types.indexOf('avatar') >= 0) {
                $friend.find('.default').remove();
                $friend.find('media-tag').remove();
                if (data.avatar && avatars[data.avatar]) {
                    $friend.prepend(avatars[data.avatar]);
                } else {
                    common.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                        if (data.avatar && $img) {
                            avatars[data.avatar] = $img[0].outerHTML;

                        }
                    });
                }
            }
        };

        // Open the channels
        Object.keys(friends).forEach(function (f) {
            var data = friends[f];
            var keys = Curve.deriveKeys(data.curvePublic, proxy.curvePrivate);
            var encryptor = Curve.createEncryptor(keys);
            channels[data.channel] = {
                keys: keys,
                encryptor: encryptor,
                messages: [],
                refresh: function () { refresh(data.edPublic); },
                notify: function () { notify(data.edPublic); },
                unnotify: function () { unnotify(data.edPublic); },
                removeUI: function () { removeUI(data.edPublic); },
                updateUI: function (types) { updateUI(data.edPublic, types); }
            };
            network.join(data.channel).then(function (chan) {
                channels[data.channel].wc = chan;
                chan.on('message', function (msg, sender) {
                    onMessage(common, msg, sender, chan);
                });
                var cfg = {
                    validateKey: keys.validateKey,
                    owners: [proxy.edPublic, data.edPublic],
                    lastKnownHash: data.lastKnownHash
                };
                var msg = ['GET_HISTORY', chan.id, cfg];
                network.sendto(network.historyKeeper, JSON.stringify(msg))
                  .then($.noop, function (err) {
                    throw new Error(err);
                });
            }, function (err) {
                console.error(err);
            });
        });

        Cryptpad.onDisplayNameChanged(function() {
            Object.keys(channels).forEach(function (chan) {
                var channel = channels[chan];
                var newdata = createData(common, chan);
                delete newdata.channel;
                var msg = [Types.update, proxy.edPublic, +new Date(), newdata];
                var msgStr = JSON.stringify(msg);
                var cryptMsg = channel.encryptor.encrypt(msgStr);
                channel.wc.bcast(cryptMsg).then(function () {
                    channel.refresh();
                }, function (err) {
                    console.error(err);
                });
            });
        });
    };

    // Invitation

    var addToFriendList = Msg.addToFriendList = function (common, data, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            proxy.friends = {};
        }
        var friends = proxy.friends;
        var pubKey = data.edPublic;

        if (pubKey === proxy.edPublic) { return void cb("E_MYKEY"); }
        if (friends[pubKey]) { return void cb("E_EXISTS"); }

        friends[pubKey] = data;
        common.whenRealtimeSyncs(common.getRealtime(), function () {
            common.pinPads([data.channel], cb);
        });
        common.changeDisplayName(proxy[common.displayNameKey]);
    };

    Msg.addDirectMessageHandler = function (common) {
        var network = common.getNetwork();
        if (!network) { return void console.error('Network not ready'); }
        network.on('message', function (message, sender) {
            var msg;
            if (sender === network.historyKeeper) { return; }
            try {
                var parsed = common.parsePadUrl(window.location.href);
                if (!parsed.hashData) { return; }
                var chan = parsed.hashData.channel;
                // Decrypt
                var keyStr = parsed.hashData.key;
                var cryptor = Crypto.createEditCryptor(keyStr);
                var key = cryptor.cryptKey;
                var decryptMsg = Crypto.decrypt(message, key);
                // Parse
                msg = JSON.parse(decryptMsg);
                if (msg[1] !== parsed.hashData.channel) { return; }
                var msgData = msg[2];
                var msgStr;
                if (msg[0] === "FRIEND_REQ") {
                    msg = ["FRIEND_REQ_NOK", chan];
                    var existing = getFriend(common, msgData.edPublic);
                    if (existing) {
                        msg = ["FRIEND_REQ_OK", chan, createData(common, existing.channel)];
                        msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                        return;
                    }
                    common.confirm("Accept friend?", function (yes) { // XXX
                        if (yes) {
                            pending[sender] = msgData;
                            msg = ["FRIEND_REQ_OK", chan, createData(common, msgData.channel)];
                        }
                        msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    // XXX
                    addToFriendList(common, msgData, function (err) {
                        if (err) {
                            return void common.log('Error while adding that friend to the list');
                        }
                        common.log('Friend invite accepted.');
                        var msg = ["FRIEND_REQ_ACK", chan];
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_NOK") {
                    // XXX
                    common.log('Friend invite rejected');
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    // XXX
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(common, data, function (err) {
                        if (err) {
                            return void common.log('Error while adding that friend to the list');
                        }
                        common.log('Friend added to the list.');
                    });
                    return;
                }
                // TODO: timeout ACK: warn the user
            } catch (e) {
                console.error("Cannot parse direct message", msg || message, "from", sender, e);
            }
        });
    };

    Msg.inviteFromUserlist = function (common, netfluxId) {
        var network = common.getNetwork();
        var parsed = common.parsePadUrl(window.location.href);
        if (!parsed.hashData) { return; }
        // Message
        var chan = parsed.hashData.channel;
        var myData = createData(common);
        var msg = ["FRIEND_REQ", chan, myData];
        // Encryption
        var keyStr = parsed.hashData.key;
        var cryptor = Crypto.createEditCryptor(keyStr);
        var key = cryptor.cryptKey;
        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
        // Send encrypted message
        network.sendto(netfluxId, msgStr);
    };

    return Msg;
});
