define([
    '/customize/application_config.js',
    '/common/common-feedback.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-messaging.js',
    '/common/cryptget.js',
    '/common/outer/mailbox.js',
    '/customize/messages.js',
    '/common/common-realtime.js',
    '/bower_components/nthen/index.js',
    '/bower_components/chainpad-crypto/crypto.js',
], function (AppConfig, Feedback, Hash, Util, Messaging, Crypt, Mailbox, Messages, Realtime, nThen, Crypto) {
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
                            if (!el.href) {
                                // Already migrated
                                return void progress(7, Math.round(100*i/padsLength));
                            }
                            if (el.href.indexOf('#') === -1) {
                                // Encrypted href: already migrated
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
                var myData = Messaging.createData(userObject);

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
        }).nThen(function (waitFor) {
            // Migration 10: deprecate todo
            var fixTodo = function () {
                var h = store.proxy.todo;
                if (!h) { return; }
                var next = waitFor(function () {
                    Feedback.send('Migrate-10', true);
                    userObject.version = version = 10;
                });
                var old;
                var opts = {
                    network: store.network,
                    initialState: '{}',
                    metadata: {
                        owners: store.proxy.edPublic ? [store.proxy.edPublic] : []
                    }
                };
                nThen(function (w) {
                    Crypt.get(h, w(function (err, val) {
                        if (err || !val) {
                            w.abort();
                            next();
                            return;
                        }
                        try {
                            old = JSON.parse(val);
                        } catch (e) {} // We will abort in the next step in case of error
                    }), opts);
                }).nThen(function (w) {
                    if (!old || typeof(old) !== "object") {
                        w.abort();
                        next();
                        return;
                    }
                    var k = {
                        content: {
                            data: {
                                "1": {
                                    id: "1",
                                    color: 'color6',
                                    item: [],
                                    title: Messages.kanban_todo
                                },
                                "2": {
                                    id: "2",
                                    color: 'color3',
                                    item: [],
                                    title: Messages.kanban_working
                                },
                                "3": {
                                    id: "3",
                                    color: 'color5',
                                    item: [],
                                    title: Messages.kanban_done
                                },
                            },
                            items: {},
                            list: [1, 2, 3]
                        },
                        metadata: {
                            title: Messages.type.todo,
                            defaultTitle: Messages.type.todo,
                            type: "kanban"
                        }
                    };
                    var i = 4;
                    var items = false;
                    (old.order || []).forEach(function (key) {
                        var data = old.data[key];
                        if (!data || !data.task) { return; }
                        items = true;
                        var column = data.state ? '3' : '1';
                        k.content.data[column].item.push(i);
                        k.content.items[i] = {
                            id: i,
                            title: data.task
                        };
                        i++;
                    });
                    if (!items) {
                        w.abort();
                        next();
                        return;
                    }
                    var newH = Hash.createRandomHash('kanban');
                    var secret = Hash.getSecrets('kanban', newH);
                    var oldSecret = Hash.getSecrets('todo', h);
                    Crypt.put(newH, JSON.stringify(k), w(function (err) {
                        if (err) {
                            w.abort();
                            next();
                            return;
                        }
                        if (store.rpc) {
                            store.rpc.pin([secret.channel], function () {
                                // Try to pin and ignore errors...
                                // Todo won't be available anyway so keep your unpinned kanban
                            });
                            store.rpc.unpin([oldSecret.channel], function () {
                                // Try to unpin and ignore errors...
                            });
                        }
                        var href = Hash.hashToHref(newH, 'kanban');
                        store.manager.addPad(['root'], {
                            title: Messages.type.todo,
                            owners: opts.metadata.owners,
                            channel: secret.channel,
                            href: href,
                            roHref: Hash.hashToHref(Hash.getViewHashFromKeys(secret), 'kanban'),
                            atime: +new Date(),
                            ctime: +new Date()
                        }, w(function (e) {
                            if (e) { return void console.error(e); }
                            delete store.proxy.todo;
                            var myData = Messaging.createData(userObject);
                            var ctx = { store: store };
                            Mailbox.sendTo(ctx, 'MOVE_TODO', {
                                user: myData,
                                href: href,
                            }, {
                                channel: myData.notifications,
                                curvePublic: myData.curvePublic
                            }, function (obj) {
                                if (obj && obj.error) { return void console.error(obj); }
                            });
                        }));
                    }), opts);
                }).nThen(function () {
                    next();
                });
            };
            if (version < 10) {
                fixTodo();
            }
        }).nThen(function (waitFor) {
            if (version >= 11) { return; }
            // Migration 11: alert users of safe links as the new default

            var done = function () {
                Feedback.send('Migrate-11', true);
                userObject.version = version = 11;
            };

            /*  userObject.settings.security.unsafeLinks
                    undefined => the user has never touched it
                    false => the user has explicitly enabled "safe links"
                    true => the user has explicitly disabled "safe links"
            */
            var unsafeLinks = Util.find(userObject, [ 'settings', 'security', 'unsafeLinks' ]);
            if (unsafeLinks !== undefined) { return void done(); }

            var ctx = {
                store: store,
            };
            var myData = Messaging.createData(userObject);
            if (!myData.curvePublic) { return void done(); }

            Mailbox.sendTo(ctx, 'SAFE_LINKS_DEFAULT', {
                user: myData,
            }, {
                channel: myData.notifications,
                curvePublic: myData.curvePublic
            }, waitFor(function (obj) {
                if (obj && obj.error) { return void console.error(obj); }
                done();
            }));
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
            Realtime.whenRealtimeSyncs(store.realtime, Util.mkAsync(Util.bake(cb)));
        });
    };
});
