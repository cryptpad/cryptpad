define([
    '/customize/application_config.js',
    '/common/common-feedback.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-messenger.js',
    '/common/outer/mailbox.js',
    '/bower_components/nthen/index.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (AppConfig, Feedback, Hash, Util, Messenger, Mailbox, nThen, Crypto) {
    // Start migration check
    // Versions:
    // 1: migrate pad attributes
    // 2: migrate indent settings (codemirror)

    return function (userObject, cb, progress, store) {
        var version = userObject.version || 0;

        nThen(function () {
            // DEPRECATED
            // Migration 1: pad attributes moved to filesData
            var migratePadAttributesToData = function () {
                return true;
            };
            if (version < 1) {
                migratePadAttributesToData();
            }
        }).nThen(function () {
            // Migration 2: global attributes from root to 'settings' subobjects
            var migrateAttributes = function () {
                var drawer = 'cryptpad.userlist-drawer';
                var polls = 'cryptpad.hide_poll_text';
                var indentKey = 'cryptpad.indentUnit';
                var useTabsKey = 'cryptpad.indentWithTabs';
                var settings = userObject.settings = userObject.settings || {};
                if (typeof(userObject[indentKey]) !== "undefined") {
                    settings.codemirror = settings.codemirror || {};
                    settings.codemirror.indentUnit = userObject[indentKey];
                    delete userObject[indentKey];
                }
                if (typeof(userObject[useTabsKey]) !== "undefined") {
                    settings.codemirror = settings.codemirror || {};
                    settings.codemirror.indentWithTabs = userObject[useTabsKey];
                    delete userObject[useTabsKey];
                }
                if (typeof(userObject[drawer]) !== "undefined") {
                    settings.toolbar = settings.toolbar || {};
                    settings.toolbar['userlist-drawer'] = userObject[drawer];
                    delete userObject[drawer];
                }
                if (typeof(userObject[polls]) !== "undefined") {
                    settings.poll = settings.poll || {};
                    settings.poll['hide-text'] = userObject[polls];
                    delete userObject[polls];
                }
            };
            if (version < 2) {
                migrateAttributes();
                Feedback.send('Migrate-2', true);
                userObject.version = version = 2;
            }
        }).nThen(function () {
            // Migration 3: language from localStorage to settings
            var migrateLanguage = function () {
                if (!localStorage.CRYPTPAD_LANG) { return; }
                var l = localStorage.CRYPTPAD_LANG;
                userObject.settings.language = l;
            };
            if (version < 3) {
                migrateLanguage();
                Feedback.send('Migrate-3', true);
                userObject.version = version = 3;
            }
        }).nThen(function () {
            // Migration 4: allowUserFeedback to settings
            var migrateFeedback = function () {
                var settings = userObject.settings = userObject.settings || {};
                if (typeof(userObject['allowUserFeedback']) !== "undefined") {
                    settings.general = settings.general || {};
                    settings.general.allowUserFeedback = userObject['allowUserFeedback'];
                    delete userObject['allowUserFeedback'];
                }
            };
            if (version < 4) {
                migrateFeedback();
                Feedback.send('Migrate-4', true);
                userObject.version = version = 4;
            }
        }).nThen(function () {
            // Migration 5: dates to Number
            var migrateDates = function () {
                var data = userObject.drive && userObject.drive.filesData;
                if (data) {
                    for (var id in data) {
                        if (typeof data[id].ctime !== "number") {
                            data[id].ctime = +new Date(data[id].ctime);
                        }
                        if (typeof data[id].atime !== "number") {
                            data[id].atime = +new Date(data[id].atime);
                        }
                    }
                }
            };
            if (version < 5) {
                migrateDates();
                Feedback.send('Migrate-5', true);
                userObject.version = version = 5;
            }
        }).nThen(function (waitFor) {
            var addChannelId = function () {
                var data = userObject.drive.filesData;
                var el, parsed;
                var n = nThen(function () {});
                var padsLength = Object.keys(data).length;
                Object.keys(data).forEach(function (k, i) {
                    n = n.nThen(function (w) {
                        setTimeout(w(function () {
                            el = data[k];
                            parsed = Hash.parsePadUrl(el.href);
                            if (!el.href) { return; }
                            if (!el.channel) {
                                var secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                                el.channel = secret.channel;
                                progress(6, Math.round(100*i/padsLength));
                                console.log('Adding missing channel in filesData ', el.channel);
                            }
                        }));
                    });
                });
                n.nThen(waitFor(function () {
                    Feedback.send('Migrate-6', true);
                    userObject.version = version = 6;
                }));
            };
            if (version < 6) {
                addChannelId();
            }
        }).nThen(function (waitFor) {
            var addRoHref = function () {
                var data = userObject.drive.filesData;
                var el, parsed;
                var n = nThen(function () {});
                var padsLength = Object.keys(data).length;
                Object.keys(data).forEach(function (k, i) {
                    n = n.nThen(function (w) {
                        setTimeout(w(function () {
                            el = data[k];
                            if (!el.href || (el.roHref && false)) {
                                // Already migrated
                                return void progress(7, Math.round(100*i/padsLength));
                            }
                            parsed = Hash.parsePadUrl(el.href);
                            if (parsed.hashData.type !== "pad") {
                                // No read-only mode for files
                                return void progress(7, Math.round(100*i/padsLength));
                            }
                            if (parsed.hashData.mode === "view") {
                                // This is a read-only pad in our drive
                                el.roHref = el.href;
                                delete el.href;
                                console.log('Move href to roHref in filesData ', el.roHref);
                            } else {
                                var secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                                var hash = Hash.getViewHashFromKeys(secret);
                                if (hash) {
                                    // Version 0 won't have a view hash available
                                    el.roHref = '/' + parsed.type + '/#' + hash;
                                    console.log('Adding missing roHref in filesData ', el.href);
                                }
                            }
                            progress(6, Math.round(100*i/padsLength));
                        }));
                    });
                });
                n.nThen(waitFor(function () {
                    Feedback.send('Migrate-7', true);
                    userObject.version = version = 7;
                }));
            };
            if (version < 7) {
                addRoHref();
            }
        }).nThen(function () {
            // Migration 8: remove duplicate entries in proxy.FS_hashes (list of migrated anon drives)
            var fixDuplicate = function () {
                userObject.FS_hashes = Util.deduplicateString(userObject.FS_hashes || []);
            };
            if (version < 8) {
                fixDuplicate();
                Feedback.send('Migrate-8', true);
                userObject.version = version = 8;
            }
        }).nThen(function () {
            // Migration 9: send our mailbox channel to existing friends
            var migrateFriends = function () {
                var network = store.network;
                var channels = {};
                var ctx = {
                    store: store
                };
                var myData = Messenger.createData(userObject);

                var close = function (chan) {
                    var channel = channels[chan];
                    if (!channel) { return; }
                    try {
                        channel.wc.leave();
                    } catch (e) {}
                    delete channels[chan];
                };

                var onDirectMessage = function (msg, sender) {
                    if (sender !== network.historyKeeper) { return; }
                    var parsed = JSON.parse(msg);

                    // Metadata msg? we don't care
                    if ((parsed.validateKey || parsed.owners) && parsed.channel) { return; }

                    // End of history message, "onReady"
                    if (parsed.channel && channels[parsed.channel]) {
                        // History cleared while we were offline
                        // ==> we asked for an invalid last known hash
                        if (parsed.error && parsed.error === "EINVAL") {
                            var histMsg = ['GET_HISTORY', parsed.channel, {}];
                            network.sendto(network.historyKeeper, JSON.stringify(histMsg))
                              .then(function () {}, function () {});
                            return;
                        }
                        // End of history
                        if (parsed.state && parsed.state === 1) {
                            // Channel is ready and we didn't receive their mailbox channel: send our channel
                            myData.channel = parsed.channel;
                            var updateMsg = ['UPDATE', myData.curvePublic, +new Date(), myData];
                            var cryptMsg = channels[parsed.channel].encrypt(JSON.stringify(updateMsg));
                            channels[parsed.channel].wc.bcast(cryptMsg).then(function () {}, function (err) {
                                console.error("Can't migrate this friend", channels[parsed.channel].friend, err);
                            });
                            close(parsed.channel);
                            return;
                        }
                    } else if (parsed.channel) {
                        return;
                    }

                    // History message: we only care about "UPDATE" messages
                    var chan = parsed[3];
                    if (!chan || !channels[chan]) { return; }
                    var channel = channels[chan];
                    var msgIn = channel.decrypt(parsed[4]);
                    var parsedMsg = JSON.parse(msgIn);
                    if (parsedMsg[0] === 'UPDATE') {
                        if (parsedMsg[1] === myData.curvePublic) { return; }
                        var data = parsedMsg[3];
                        // If it doesn't contain the mailbox channel, ignore the message
                        if (!data.notifications) { return; }
                        // Otherwise we know their channel, we can send them our own
                        channel.friend.notifications = data.notifications;
                        myData.channel = chan;
                        Mailbox.sendTo(ctx, 'UPDATE_DATA', myData, {
                            channel: data.notifications,
                            curvePublic: data.curvePublic
                        }, function (obj) {
                            if (obj && obj.error) { return void console.error(obj); }
                            console.log('friend migrated', channel.friend);
                        });
                        close(chan);
                    }
                };

                network.on('message', function(msg, sender) {
                    try {
                        onDirectMessage(msg, sender);
                    } catch (e) {
                        console.error(e);
                    }
                });

                var friends = userObject.friends || {};
                Object.keys(friends).forEach(function (curve) {
                    if (curve.length !== 44) { return; }
                    var friend = friends[curve];

                    // Check if it is already a "new" friend
                    if (friend.notifications) { return; }

                    /** Old friend:
                     *  1. Open the messenger channel
                     *  2. Check if they sent us their mailbox channel
                     *  3.a. Yes ==> sent them a mail containing our mailbox channel
                     *  3.b. No  ==> post our mailbox data to the messenger channel
                     */
                    network.join(friend.channel).then(function (wc) {
                        var keys = Crypto.Curve.deriveKeys(friend.curvePublic, userObject.curvePrivate);
                        var encryptor = Crypto.Curve.createEncryptor(keys);
                        channels[friend.channel] = {
                            wc: wc,
                            friend: friend,
                            decrypt: encryptor.decrypt,
                            encrypt: encryptor.encrypt
                        };
                        var cfg = {
                            lastKnownHash: friend.lastKnownHash
                        };
                        var msg = ['GET_HISTORY', friend.channel, cfg];
                        network.sendto(network.historyKeeper, JSON.stringify(msg))
                          .then(function () {}, function (err) {
                            console.error("Can't migrate this friend", friend, err);
                        });
                    }, function (err) {
                        console.error("Can't migrate this friend", friend, err);
                    });
                });
            };
            if (version < 9) {
                migrateFriends();
                Feedback.send('Migrate-9', true);
                userObject.version = version = 9;
            }
        /*}).nThen(function (waitFor) {
            // Test progress bar in the loading screen
            var i = 0;
            var w = waitFor();
            var it = setInterval(function () {
                i += 5;
                if (i >= 100) { w(); clearInterval(it); i = 100;}
                progress(0, i);
            }, 500);
            progress(0, 0);*/
        }).nThen(function () {
            setTimeout(cb);
        });
    };
});
