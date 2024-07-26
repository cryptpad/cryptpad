// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/outer/cache-store.js',
    '/common/common-messaging.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/visible.js',
    '/common/userObject.js',
    '/common/outer/local-store.js',
    '/common/outer/worker-channel.js',
    '/common/outer/login-block.js',
    '/common/common-credential.js',
    '/customize/login.js',

    '/customize/application_config.js',
    '/components/nthen/index.js',
], function (Config, Messages, Util, Hash, Cache,
            Messaging, Constants, Feedback, Visible, UserObject, LocalStore, Channel, Block,
            Cred, Login, AppConfig, Nthen) {

/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/
    var urlArgs = Util.find(Config, ['requireConf', 'urlArgs']) || '';

    var postMessage = function (/*cmd, data, cb*/) {
        /*setTimeout(function () {
            AStore.query(cmd, data, cb);
        });*/
        console.error('NOT_READY');
    };
    var tryParsing = function (x) {
        try { return JSON.parse(x); }
        catch (e) {
            console.error(e);
            return null;
        }
    };

    // Upgrade and donate URLs duplicated in pages.js
    var origin = encodeURIComponent(window.location.hostname);
    var common = window.Cryptpad = {
        Messages: Messages,
        donateURL: AppConfig.donateURL || "https://opencollective.com/cryptpad/",
        upgradeURL: AppConfig.upgradeURL || 'https://accounts.cryptpad.fr/#/?on=' + origin,
        account: {},
    };

    // Store the href in memory
    // This is a placeholder value overriden in common.ready from sframe-common-outer
    var currentPad = common.currentPad = {
        href: window.location.href
    };

    // COMMON
    common.getLanguage = function () {
        return Messages._languageUsed;
    };
    common.setLanguage = function (l, cb) {
        var LS_LANG = "CRYPTPAD_LANG";
        localStorage.setItem(LS_LANG, l);
        postMessage("SET_ATTRIBUTE", {
            attr: ['general', 'language'],
            value: l
        }, cb);
    };

    common.getAccessKeys = function (cb) {
        var keys = [];
        Nthen(function (waitFor) {
            // Push account keys
            postMessage("GET", {
                key: ['edPrivate'],
            }, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                try {
                    keys.push({
                        edPrivate: obj,
                        edPublic: Hash.getSignPublicFromPrivate(obj)
                    });
                } catch (e) { console.error(e); }
            }));

            // Push teams keys
            postMessage("GET", {
                key: ['teams'],
            }, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                Object.keys(obj || {}).forEach(function (id) {
                    var t = obj[id];
                    var _keys = {};
                    try {
                        _keys = t.keys.drive || {};
                    } catch (err) {
                        console.error(err);
                    }
                    _keys.id = id;
                    if (!_keys.edPrivate) { return; }
                    keys.push(t.keys.drive);
                });
            }));
        }).nThen(function () {
            cb(keys);
        });
    };

    common.getFormKeys = function (cb) {
        var curvePrivate;
        var formSeed;
        Nthen(function (waitFor) {
            postMessage("GET", {
                key: ['curvePrivate'],
            }, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                curvePrivate = obj;
            }));
            postMessage("GET", {
                key: ['form_seed'],
            }, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                formSeed = obj;
            }));
        }).nThen(function () {
            if (!formSeed) { // no drive mode
                formSeed = localStorage.CP_formSeed || Hash.createChannelId();
                localStorage.CP_formSeed = formSeed;
            } else {
                delete localStorage.CP_formSeed;
            }
            cb({
                curvePrivate: curvePrivate,
                curvePublic: curvePrivate && Hash.getCurvePublicFromPrivate(curvePrivate),
                formSeed: formSeed
            });
        });
    };
    common.getFormAnswer = function (data, cb) {
        postMessage("GET", {
            key: ['forms', data.channel],
        }, function (obj) {
            if (obj && obj.error === "ENODRIVE") {
                var all = Util.tryParse(localStorage.CP_formAnswers || "{}");
                return void cb(all[data.channel]);
            }
            if (obj && obj.error) { return void cb(obj); }

            if (obj) {
                if (!Array.isArray(obj)) { obj = [obj]; }
                return void cb(obj);
            }

            // We have a drive and no answer but maybe we had
            // previous "nodrive" answers: migrate
            var old = Util.tryParse(localStorage.CP_formAnswers || "{}");
            if (Array.isArray(old[data.channel])) {
                var d = old[data.channel];
                return void postMessage("SET", {
                    key: ['forms', data.channel],
                    value: d
                }, function (obj) {
                    // Delete old data if it was correctly stored in the drive
                    if (obj && obj.error) { return void cb(d); }
                    delete old[data.channel];
                    localStorage.CP_formAnswers = JSON.stringify(old);
                    cb(d);
                });
            }

            cb();
        });
    };
    common.storeFormAnswer = function (data, cb) {
        var answer = {
            uid: data.uid,
            hash: data.hash,
            curvePrivate: data.curvePrivate,
            anonymous: data.anonymous
        };
        var answers = [];
        Nthen(function (waitFor) {
            common.getFormAnswer(data, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                answers = obj;
            }));
        }).nThen(function () {
            answers.push(answer);
            postMessage("SET", {
                key: ['forms', data.channel],
                value: answers
            }, function (obj) {
                if (obj && obj.error) {
                    if (obj.error === "ENODRIVE") {
                        var all = Util.tryParse(localStorage.CP_formAnswers || "{}");
                        all[data.channel] = answers;
                        localStorage.CP_formAnswers = JSON.stringify(all);
/*

                        var answered = JSON.parse(localStorage.CP_formAnswered || "[]");
                        if (answered.indexOf(data.channel) === -1) { answered.push(data.channel); }
                        localStorage.CP_formAnswered = JSON.stringify(answered);
*/
                        return void cb();
                    }
                    console.error(obj.error);
                }
                cb();
            });
        });
    };
    common.deleteFormAnswers = function (data, _cb) {
        var cb = Util.once(_cb);
        common.getFormAnswer(data, function (obj) {
            if (!obj || obj.error) { return void cb(); }
            if (!obj.length) { return void cb(); }
            var n = Nthen;
            var nacl, theirs;
            n = n(function (waitFor) {
                require([
                    '/api/broadcast?'+ (+new Date()),
                    '/components/tweetnacl/nacl-fast.min.js'
                ], waitFor(function (Broadcast) {
                    nacl = window.nacl;
                    theirs = nacl.util.decodeBase64(Broadcast.curvePublic);
                }));
            }).nThen;
            var toDelete = [];
            obj.forEach(function (answer) {
                if (answer.uid !== data.uid) { return; }
                n = n(function (waitFor) {
                    var hash = answer.hash;
                    var h = nacl.util.decodeUTF8(hash);

                    // Make proof
                    var curve = answer.curvePrivate;
                    var mySecret = nacl.util.decodeBase64(curve);
                    var nonce = nacl.randomBytes(24);
                    var proofBytes = nacl.box(h, nonce, theirs, mySecret);
                    var proof = nacl.util.encodeBase64(nonce) +'|'+ nacl.util.encodeBase64(proofBytes);
                    var lineData = {
                        channel: data.channel,
                        hash: hash,
                        proof: proof
                    };
                    postMessage("DELETE_MAILBOX_MESSAGE", lineData, waitFor(function (obj) {
                        if (obj && obj.error && obj.error !== 'HASH_NOT_FOUND') {
                            // If HASH_NOT_FOUND, the message is already deleted
                            // so we can delete it locally
                            waitFor.abort();
                            return void cb(obj);
                        }
                        toDelete.push(hash);
                    }));
                }).nThen;
            });
            n(function () {
                obj = obj.filter(function (answer) { return !toDelete.includes(answer.hash); });
                if (!obj.length) { obj = undefined; }
                postMessage("SET", {
                    key: ['forms', data.channel],
                    value: obj
                }, function (_obj) {
                    if (_obj && _obj.error === "ENODRIVE") {
                        var all = Util.tryParse(localStorage.CP_formAnswers || "{}");
                        if (obj) { all[data.channel] = obj; }
                        else { delete all[data.channel]; }
                        localStorage.CP_formAnswers = JSON.stringify(all);
                        return void cb();
                    }
                    return void cb(_obj);
                });
            });
        });
    };
    common.muteChannel = function (channel, state, cb) {
        var mutedChannels = [];
        Nthen(function (waitFor) {
            postMessage("GET", {
                key: ['mutedChannels'],
            }, waitFor(function (obj) {
                if (obj && obj.error) { waitFor.abort(); return void cb(obj); }
                mutedChannels = obj || [];
            }));
        }).nThen(function () {
            if (state) {
                if (!mutedChannels.includes(channel)) {
                    mutedChannels.push(channel);
                }
            } else {
                mutedChannels = mutedChannels.filter(function (chan) {
                    return chan !== channel;
                });
            }
            postMessage("SET", {
                key: ['mutedChannels'],
                value: mutedChannels
            }, cb);
        });
    };

    common.makeNetwork = function (cb) {
        require([
            'netflux-client',
            '/common/outer/network-config.js'
        ], function (Netflux, NetConfig) {
            var wsUrl = NetConfig.getWebsocketURL();
            Netflux.connect(wsUrl).then(function (network) {
                cb(null, network);
            }, function (err) {
                cb(err);
            });
        });
    };


    common.getTeamsId = function () {
        postMessage("GET", {
            key: ['teams'],
        }, function (obj) {
            if (obj.error) { return; }
            Object.keys(obj || {}).forEach(function (id) {
                console.log(obj[id].metadata.name, ':', id);
            });
        });

    };
    common.fixFork = function (teamId) {
        var i = 0;
        var send = function () {
            if (i >= 110) {
                postMessage("SET", {
                    teamId: teamId,
                    key: ['fixFork'],
                }, function () {});
                return;
            }
            postMessage("SET", {
                teamId: teamId,
                key: ['fixFork'],
                value: i
            }, function () {
                i++;
                setTimeout(send, 500);
            });
        };
        send();
    };
    common.fixRosterHash = function () {
        // Push teams keys
        postMessage("GET", {
            key: ['teams'],
        }, function (obj) {
            if (obj.error) { return console.error(obj.error); }
            Object.keys(obj || {}).forEach(function (id) {
                postMessage("SET", {
                    key: ['teams', id, 'keys', 'roster', 'lastKnownHash'],
                    value: ''
                }, function () {
                    console.log('done, please close all your CryptPad tabs before testing the fix');
                });
            });
        });
    };

    (function () {
        var bypassHashChange = function (key) {
            return function (value) {
                var ohc = window.onhashchange;
                window.onhashchange = function () {};
                window.location[key] = value;
                window.onhashchange = ohc;
                ohc({reset: true});
            };
        };
        common.setTabHref = bypassHashChange('href');
        common.setTabHash = bypassHashChange('hash');
    }());

    // RESTRICTED
    // Settings only
    common.resetDrive = function (cb) {
        postMessage("RESET_DRIVE", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.stopWorker = function () {
        postMessage('STOPWORKER');
    };
    common.logoutFromAll = function (cb) {
        var token = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
        localStorage.setItem(Constants.tokenKey, token);
        postMessage("SET", {
            key: [Constants.tokenKey],
            value: token
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    // Settings and drive and auth
    common.getUserObject = function (teamId, cb) {
        postMessage("GET", {
            teamId: teamId,
            key: []
        }, function (obj) {
            cb(obj);
        });
    };
    common.getSharedFolder = function (data, cb) {
        postMessage("GET_SHARED_FOLDER", data, function (obj) {
            cb(obj);
        });
    };
    common.loadSharedFolder = function (id, data, cb) {
        postMessage("LOAD_SHARED_FOLDER", {
            id: id,
            data: data
        }, cb);
    };
    common.getEdPublic = function (teamId, cb) {
        postMessage("GET", {
            key: teamId ? ['teams', teamId, 'keys', 'drive', 'edPublic'] : ['edPublic']
        }, function (obj) {
            cb(obj);
        });
    };
    // Settings and ready
    common.mergeAnonDrive = function (cb) {
        var data = {
            anonHash: LocalStore.getFSHash()
        };
        postMessage("MIGRATE_ANON_DRIVE", data, cb);
    };
    // Drive
    common.userObjectCommand = function (data, cb) {
        postMessage("DRIVE_USEROBJECT", data, cb);
    };
    common.restoreDrive = function (data, cb) {
        if (data.sfId) { // Shared folder ID
            postMessage('RESTORE_SHARED_FOLDER', data, cb, {
                timeout: 5 * 60 * 1000
            });
            return;
        }
        postMessage("SET", {
            teamId: data.teamId,
            key:['drive'],
            value: data.drive
        }, function (obj) {
            cb(obj);
        }, {
            timeout: 5 * 60 * 1000
        });
    };
    common.addSharedFolder = function (teamId, secret, cb) {
        var href = (secret.keys && secret.keys.editKeyStr) ? '/drive/#' + Hash.getEditHashFromKeys(secret) : undefined;
        postMessage("ADD_SHARED_FOLDER", {
            teamId: teamId,
            path: ['root'],
            folderData: {
                href: href,
                roHref: '/drive/#' + Hash.getViewHashFromKeys(secret),
                channel: secret.channel,
                password: secret.password,
                ctime: +new Date()
            }
        }, cb);
    };
    common.drive = {};
    common.drive.onLog = Util.mkEvent();
    common.drive.onChange = Util.mkEvent();
    common.drive.onRemove = Util.mkEvent();
    common.drive.onDeleted = Util.mkEvent();
    // Profile
    common.getProfileEditUrl = function (cb) {
        postMessage("GET", { key: ['profile', 'edit'] }, function (obj) {
            cb(obj);
        });
    };
    common.setNewProfile = function (profile) {
        postMessage("SET", {
            key: ['profile'],
            value: profile
        }, function () {});
    };
    common.setAvatar = function (data, cb) {
        var postData = {
            key: ['profile', 'avatar']
        };
        // If we don't have "data", it means we want to remove the avatar and we should not have a
        // "postData.value", even set to undefined (JSON.stringify transforms undefined to null)
        if (data) { postData.value = data; }
        postMessage("SET", postData, cb);
    };
    // Todo
    common.getTodoHash = function (cb) {
        postMessage("GET", { key: ['todo'] }, function (obj) {
            cb(obj);
        });
    };
    common.setTodoHash = function (hash) {
        postMessage("SET", {
            key: ['todo'],
            value: hash
        }, function () {});
    };


    // RPC
    common.pinPads = function (pads, cb, teamId) {
        var data = {
            teamId: teamId,
            pads: pads
        };
        postMessage("PIN_PADS", data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.unpinPads = function (pads, cb, teamId) {
        var data = {
            teamId: teamId,
            pads: pads
        };
        postMessage("UNPIN_PADS", data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.getPinnedUsage = function (data, cb) {
        postMessage("GET_PINNED_USAGE", data, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(null, obj.bytes);
        });
    };

    common.updatePinLimit = function (cb) {
        postMessage("UPDATE_PIN_LIMIT", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.limit, obj.plan, obj.note);
        });
    };

    common.getPinLimit = function (data, cb) {
        postMessage("GET_PIN_LIMIT", data, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.limit, obj.plan, obj.note);
        });
    };

    common.isOverPinLimit = function (teamId, cb) {
        if (!LocalStore.isLoggedIn()) { return void cb(null, false); }
        var usage;
        var andThen = function (e, limit, plan) {
            if (e) { return void cb(e); }
            var data = {usage: usage, limit: limit, plan: plan};
            if (usage > limit) {
                return void cb (null, true, data);
            }
            return void cb (null, false, data);
        };
        var todo = function (e, used) {
            if (e) { return void cb(e); }
            usage = used;
            common.getPinLimit({
                teamId: teamId
            }, andThen);
        };
        common.getPinnedUsage({
            teamId: teamId
        }, todo);
    };

    common.clearOwnedChannel = function (data, cb) {
        postMessage("CLEAR_OWNED_CHANNEL", data, cb);
    };
    // "force" allows you to delete your drive ID
    common.removeOwnedChannel = function (data, cb) {
        postMessage("REMOVE_OWNED_CHANNEL", data, cb);
    };

    common.getDeletedPads = function (data, cb) {
        postMessage("GET_DELETED_PADS", data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadComplete = function (teamId, id, owned, cb) {
        postMessage("UPLOAD_COMPLETE", {teamId: teamId, id: id, owned: owned}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadStatus = function (teamId, size, cb) {
        postMessage("UPLOAD_STATUS", {teamId: teamId, size: size}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadCancel = function (teamId, size, cb) {
        postMessage("UPLOAD_CANCEL", {teamId: teamId, size: size}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadChunk = function (teamId, data, cb) {
        postMessage("UPLOAD_CHUNK", {teamId: teamId, chunk: data}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    // ANON RPC

    // SFRAME: talk to anon_rpc from the iframe
    common.anonRpcMsg = function (msg, data, cb) {
        if (!msg) { return; }
        postMessage("ANON_RPC_MESSAGE", {
            msg: msg,
            data: data
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.getFileSize = function (href, password, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var channel = Hash.hrefToHexChannelId(href, password);
        var error;
        Nthen(function (waitFor) {
            // Blobs can't change, if it's in the cache, use it
            Cache.getBlobCache(channel, waitFor(function(err, blob) {
                if (err) { return; }
                waitFor.abort();
                cb(null, blob.length);
            }));

        }).nThen(function (waitFor) {
            // If it's not in the cache or it's not a blob, try to get the value from the server
            var getSize = () => {
                postMessage("GET_FILE_SIZE", {channel:channel}, waitFor(function (obj) {
                    if (obj && obj.error === "ANON_RPC_NOT_READY") { return void setTimeout(waitFor(getSize), 100); }

                    if (obj && obj.error && obj.error.code === 'ENOENT' && obj.error.reason) {
                        waitFor.abort();
                        cb(obj.error.reason);
                    } else if (obj && obj.error) {
                        // If disconnected, try to get the value from the channel cache (next nThen)
                        error = obj.error;
                        return;
                    }
                    waitFor.abort();
                    cb(undefined, obj.size);
                }));
            };
            getSize();
        }).nThen(function () {
            Cache.getChannelCache(channel, function(err, data) {
                if (err) { return void cb(error); }
                var size = data && Array.isArray(data.c) && data.c.join('').length;
                cb(null, size || 0);
            });
        });
    };

    common.getMultipleFileSize = function (files, cb) {
        postMessage("GET_MULTIPLE_FILE_SIZE", {files:files}, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.size);
        });
    };

    common.isNewChannel = function (href, password, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var channel = Hash.hrefToHexChannelId(href, password);
        postMessage('IS_NEW_CHANNEL', {channel: channel}, function (obj) {
            var error = obj && obj.error;
            if (error) { return void cb(error); }
            if (!obj) { return void cb('ERROR'); }
            cb (null, obj.isNew, obj.reason);
        }, {timeout: -1});
    };
    // This function is used when we want to open a pad. We first need
    // to check if it exists. With the cached drive, we need to wait for
    // the network to be available before we can continue.
    common.hasChannelHistory = function (href, password, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var channel = Hash.hrefToHexChannelId(href, password);
        var error;
        Nthen(function (waitFor) {
            Cache.getChannelCache(channel, waitFor(function(err, data) {
                if (err || !data) { return; }
                waitFor.abort();
                cb(undefined, false);
            }));
        }).nThen(function () {
            // If it's not in the cache try to get the value from the server
            var isNew = function () {
                error = undefined;
                postMessage('IS_NEW_CHANNEL', {channel: channel}, function (obj) {
                    if (obj && obj.error) { error = obj.error; }
                    if (!obj) { error = "INVALID_RESPONSE"; }

                    if (error === "ANON_RPC_NOT_READY") {
                        // Try again in 1s
                        return void setTimeout(isNew, 100);
                    } else if (error) {
                        return void cb(error);
                    }
                    cb(undefined, obj.isNew, obj.reason);
                }, {timeout: -1});
            };
            isNew();
        });
    };

    // Store



    common.getMetadata = function (cb) {
        var parsed = Hash.parsePadUrl(currentPad.href);
        postMessage("GET_METADATA", parsed && parsed.type, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.isOnlyInSharedFolder = function (data, cb) {
        postMessage("IS_ONLY_IN_SHARED_FOLDER", data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.setDisplayName = function (value, cb) {
        postMessage("SET_DISPLAY_NAME", value, cb);
    };

    common.setPadAttribute = function (attr, value, cb, href) {
        cb = cb || function () {};
        href = Hash.getRelativeHref(href || currentPad.href);
        postMessage("SET_PAD_ATTRIBUTE", {
            href: href,
            attr: attr,
            value: value
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.getPadAttribute = function (attr, cb, href) {
        href = Hash.getRelativeHref(href || currentPad.href);
        if (!href) {
            return void cb('E404');
        }
        postMessage("GET_PAD_ATTRIBUTE", {
            href: href,
            attr: attr,
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    common.setAttribute = function (attr, value, cb) {
        cb = cb || function () {};
        postMessage("SET_ATTRIBUTE", {
            attr: attr,
            value: value
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
    };
    common.getAttribute = function (attr, cb) {
        postMessage("GET_ATTRIBUTE", {
            attr: attr
        }, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    // Tags
    common.resetTags = function (href, tags, cb) {
        // set pad attribute
        cb = cb || function () {};
        if (!Array.isArray(tags)) { return void cb('INVALID_TAGS'); }
        common.setPadAttribute('tags', tags.slice(), cb, href);
    };
    common.tagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            var newTags;
            if (!tags) {
                newTags = [tag];
            } else if (tags.indexOf(tag) === -1) {
                newTags = tags.slice();
                newTags.push(tag);
            }
            common.setPadAttribute('tags', newTags, cb, href);
        }, href);
    };
    common.untagPad = function (href, tag, cb) {
        if (typeof(cb) !== 'function') {
            return void console.error('EXPECTED_CALLBACK');
        }
        if (typeof(tag) !== 'string') { return void cb('INVALID_TAG'); }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            if (!tags) { return void cb(); }
            var idx = tags.indexOf(tag);
            if (idx === -1) { return void cb(); }
            var newTags = tags.slice();
            newTags.splice(idx, 1);
            common.setPadAttribute('tags', newTags, cb, href);
        }, href);
    };
    common.getPadTags = function (href, cb) {
        if (typeof(cb) !== 'function') { return; }
        common.getPadAttribute('tags', function (e, tags) {
            if (e) { return void cb(e); }
            cb(void 0, tags ? tags.slice() : []);
        }, href);
    };
    common.listAllTags = function (cb) {
        postMessage("LIST_ALL_TAGS", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(void 0, obj);
        });
    };

    // STORAGE - TEMPLATES
    common.listTemplates = function (type, cb) {
        postMessage("GET_TEMPLATES", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            if (!Array.isArray(obj)) { return void cb ('NOT_AN_ARRAY'); }
            if (!type) { return void cb(null, obj); }

            var templates = obj.filter(function (f) {
                var parsed = Hash.parsePadUrl(f.href);
                return parsed.type === type;
            });
            cb(null, templates);
        });
    };

    common.saveAsTemplate = function (Cryptput, data, cb) {
        var p = Hash.parsePadUrl(currentPad.href);
        if (!p.type) { return; }
        // PPP: password for the new template?
        var hash = Hash.createRandomHash(p.type);
        var href = '/' + p.type + '/#' + hash;

        var optsPut = {};
        if (p.type === 'poll') { optsPut.initialState = '{}'; }
        // PPP: add password as cryptput option
        Nthen(function (w) {
            common.getEdPublic(null, w(function (obj) {
                if (obj && obj.error) { return; }
                optsPut.owners = [obj];
            }));
        }).nThen(function () {
            Cryptput(hash, data.toSave, function (e) {
                if (e) { throw new Error(e); }
                postMessage("ADD_PAD", {
                    teamId: data.teamId,
                    href: href,
                    title: data.title,
                    owners: optsPut.owners,
                    path: ['template']
                }, function (obj) {
                    if (obj && obj.error) { return void cb(obj.error); }
                    cb();
                });
            }, optsPut);
        });
    };

    common.isTemplate = function (href, cb) {
        var rhref = Hash.getRelativeHref(href);
        common.listTemplates(null, function (err, templates) {
            cb(void 0, templates.some(function (t) {
                return t.href === rhref;
            }));
        });
    };

    var fixPadMetadata = function (parsed, copy) {
        var meta;
        if (Array.isArray(parsed) && typeof(parsed[3]) === "object") {
            meta = parsed[3].metadata; // pad
        } else if (parsed.info) {
            meta = parsed.info; // poll
        } else {
            meta = parsed.metadata;
        }
        if (typeof(meta) === "object") {
            meta.defaultTitle = meta.title || meta.defaultTitle;
            if (copy) {
                meta.defaultTitle = Messages._getKey('copy_title', [meta.defaultTitle]);
            }
            meta.title = "";
            delete meta.users;
            delete meta.chat2;
            delete meta.chat;
            delete meta.cursor;

            if (meta.type === "form") {
                // Keep anonymous and makeAnonymous values from templates
                var anonymous = parsed.answers.anonymous || false;
                var makeAnonymous = parsed.answers.makeAnonymous || false;
                delete parsed.answers;
                parsed.answers = {
                    anonymous: anonymous,
                    makeAnonymous: makeAnonymous
                };
            }
        }
    };

    common.useTemplate = function (data, Crypt, cb, optsPut) {
        // opts is used to overrides options for chainpad-netflux in cryptput
        // it allows us to add owners and expiration time if it is a new file
        var href = data.href;

        var parsed = Hash.parsePadUrl(href);
        var parsed2 = Hash.parsePadUrl(currentPad.href);
        if(!parsed) { throw new Error("Cannot get template hash"); }
        postMessage("INCREMENT_TEMPLATE_USE", href);

        optsPut = optsPut || {};
        var optsGet = {};

        if (parsed.type === 'poll') { optsGet.initialState = '{}'; }
        if (parsed2.type === 'poll') { optsPut.initialState = '{}'; }

        Nthen(function (waitFor) {
            if (parsed.hashData && parsed.hashData.password) {
                common.getPadAttribute('password', waitFor(function (err, password) {
                    optsGet.password = password;
                }), href);
            }
            if (parsed2.hashData && parsed2.hashData.password && !optsPut.password) {
                common.getPadAttribute('password', waitFor(function (err, password) {
                    optsPut.password = password;
                }));
            }
            common.getAccessKeys(waitFor(function (keys) {
                optsGet.accessKeys = keys;
                optsPut.accessKeys = keys;
            }));
        }).nThen(function () {
            Crypt.get(parsed.hash, function (err, val, errData) {
                if (err) {
                    return void cb(err, errData);
                }
                if (!val) {
                    return void cb('ENOENT');
                }
                if (data.oo) { return void cb(val); } // OnlyOffice template: are handled in inner
                try {
                    // Try to fix the title before importing the template
                    var parsed = JSON.parse(val);
                    fixPadMetadata(parsed);
                    val = JSON.stringify(parsed);
                } catch (e) {
                    console.log("Can't fix template title", e);
                }
                Crypt.put(parsed2.hash, val, cb, optsPut);
            }, optsGet);
        });
    };

    common.useFile = function (Crypt, cb, optsPut, onProgress) {
        var fileHost = Config.fileHost || window.location.origin;
        var data = common.fromFileData;
        var parsed = Hash.parsePadUrl(data.href);
        var parsed2 = Hash.parsePadUrl(currentPad.href);

        if (parsed2.type === 'poll') { optsPut.initialState = '{}'; }

        var val;
        Nthen(function(_waitFor) {
            // If pad, use cryptget
            if (parsed.hashData && parsed.hashData.type === 'pad') {
                var optsGet = {
                    password: data.password,
                    initialState: parsed.type === 'poll' ? '{}' : undefined
                };
                var next = _waitFor();
                Nthen(function (waitFor) {
                    // Authenticate in case the pad os restricted
                    common.getAccessKeys(waitFor(function (keys) {
                        optsGet.accessKeys = keys;
                    }));
                }).nThen(function () {
                    Crypt.get(parsed.hash, function (err, _val, errData) {
                        if (err) {
                            _waitFor.abort();
                            return void cb(err, errData);
                        }
                        try {
                            val = JSON.parse(_val);
                            fixPadMetadata(val, true);
                            next();
                        } catch (e) {
                            _waitFor.abort();
                            return void cb(e.message);
                        }
                    }, optsGet);
                });
                return;
            }

            var name = data.title;
            var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
            var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
            var key = secret.keys && secret.keys.cryptKey;
            var u8;
            var res;
            var mode;

            // Otherwise, it's a text blob "open in code": get blob data & convert format
            Nthen(function (waitFor) {
                Util.fetch(src, waitFor(function (err, _u8) {
                    if (err) {
                        _waitFor.abort();
                        return void cb(err);
                    }
                    u8 = _u8;
                }), function (progress) {
                    onProgress(progress * 50);
                }, Cache);
            }).nThen(function (waitFor) {
                require(["/file/file-crypto.js"], waitFor(function (FileCrypto) {
                    FileCrypto.decrypt(u8, key, waitFor(function (err, _res) {
                        if (err || !_res.content) {
                            _waitFor.abort();
                            return void cb(err);
                        }
                        res = _res;
                    }), function (progress) {
                        onProgress(50 + progress * 50);
                    });
                }));
            }).nThen(function (waitFor) {
                var ext = Util.parseFilename(data.title).ext;
                if (!ext) {
                    mode = "text";
                    return;
                }
                require(["/common/modes.js"], waitFor(function (Modes) {
                    Modes.list.some(function (fType) {
                        if (fType.ext === ext) {
                            mode = fType.mode;
                            return true;
                        }
                    });
                }));
            }).nThen(function (waitFor) {
                var reader = new FileReader();
                reader.addEventListener('loadend', waitFor(function (e) {
                    val = {
                        content: e.srcElement.result,
                        highlightMode: mode,
                        metadata: {
                            defaultTitle: name,
                            title: name,
                            type: "code",
                        },
                    };
                }));
                reader.readAsText(res.content);
            }).nThen(_waitFor());
        }).nThen(function () {
            Crypt.put(parsed2.hash, JSON.stringify(val), function () {
                cb();
            }, optsPut);
        });

    };

    // Forget button
    common.moveToTrash = function (cb, href) {
        href = href || currentPad.href;
        postMessage("MOVE_TO_TRASH", { href: href }, cb);
    };

    // When opening a new pad or renaming it, store the new title
    common.setPadTitle = function (data, cb) {
        if (!data || typeof (data) !== "object") { return cb ('Data is not an object'); }

        var href = data.href || currentPad.href;
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return cb ('Invalid hash'); }
        data.href = parsed.getUrl({present: parsed.present});

        if (typeof (data.title) !== "string") { return cb('Missing title'); }

        if (common.initialTeam) {
            // If the value is -1, it means the user drive was selected from the pad creation screen
            // If the value is a positive Integer, force save in the team with the selected ID
            if (common.initialTeam !== -1) {
                // Team selected from the PCS or pad created from a team drive
                data.teamId = common.initialTeam;
            }
            data.forceSave = 1;
            //delete common.initialTeam;
        }
        if (data.forceOwnDrive) {
            data.teamId = -1;
        }
        if (common.initialPath) {
            if (!data.path) {
                data.path = Array.isArray(common.initialPath) ? common.initialPath
                                : decodeURIComponent(common.initialPath).split(',');
                delete common.initialPath;
            }
        }

        postMessage("SET_PAD_TITLE", data, function (obj) {
            if (obj && obj.error) {
                if (obj.error !== "EAUTH") { console.log("unable to set pad title"); }
                return void cb(obj.error);
            }
            cb(null, obj);
        });
    };

    common.storeInTeam = function (data, cb) {
        if (!data.href) { return void cb({error: 'EINVAL'}); }
        var parsed = Hash.parsePadUrl(data.href);
        var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);
        if (!secret || !secret.channel) { return void cb ({error: 'EINVAL'}); }

        if (parsed.type === 'drive') {
            // Shared folder
            var teamId = data.teamId === -1 ? undefined : data.teamId;
            common.addSharedFolder(teamId, secret, cb);
            return;
        }

        Nthen(function (waitFor) {
            if (parsed.hashData.type !== 'pad') { return; }
            // Set the correct owner and expiration time if we can find them
            postMessage('GET_PAD_METADATA', {
                channel: secret.channel
            }, waitFor(function (obj) {
                if (!obj || obj.error) { return; }
                data.owners = obj.owners;
                data.expire = +obj.expire;
            }));
        }).nThen(function () {
            postMessage("SET_PAD_TITLE", {
                teamId: data.teamId,
                href: Hash.getRelativeHref(data.href),
                title: data.title,
                password: data.password,
                channel: secret.channel,
                path: data.path,
                owners: data.owners,
                expire: data.expire,
                forceSave: 1
            }, function (obj) {
                if (obj && obj.error) { return void cb(obj.error); }
                cb();
            });
        });
    };

    // Needed for the secure filepicker app
    common.getSecureFilesList = function (query, cb) {
        postMessage("GET_SECURE_FILES_LIST", query, function (list) {
            cb(void 0, list);
        });
    };
    // Get a template href from its id
    common.getPadData = function (id, cb) {
        postMessage("GET_PAD_DATA", id, function (data) {
            cb(void 0, data);
        });
    };
    // Get data about a given channel: use with hidden hashes
    common.getPadDataFromChannel = function (obj, cb) {
        if (!obj || !obj.channel) { return void cb('EINVAL'); }
        // Note: no timeout for this command, we may only have loaded the cached drive
        // and need to wait for the fully synced drive
        postMessage("GET_PAD_DATA_FROM_CHANNEL", obj, function (data) {
            cb(void 0, data);
        }, {timeout: -1});
    };

    common.disableCache = function (disabled, cb) {
        postMessage("CACHE_DISABLE", disabled, cb);
    };
    window.addEventListener('storage', function (e) {
        if (e.key !== 'CRYPTPAD_STORE|disableCache') { return; }
        var n = e.newValue;
        if (n) {
            Cache.disable();
            common.disableCache(true, function () {});
        } else {
            Cache.enable();
            common.disableCache(false, function () {});
        }
    });
    if (localStorage['CRYPTPAD_STORE|disableCache']) {
        Cache.disable();
    }

    // Admin
    common.adminRpc = function (data, cb) {
        postMessage("ADMIN_RPC", data, cb);
    };
    common.addAdminMailbox = function (data, cb) {
        postMessage("ADMIN_ADD_MAILBOX", data, cb);
    };

    // Network
    common.onNetworkDisconnect = Util.mkEvent();
    common.onNetworkReconnect = Util.mkEvent();
    common.onNewVersionReconnect = Util.mkEvent();

    // Messaging (friend requests)
    var messaging = common.messaging = {};
    messaging.answerFriendRequest = function (data, cb) {
        postMessage("ANSWER_FRIEND_REQUEST", data, cb);
    };
    messaging.sendFriendRequest = function (data, cb) {
        postMessage("SEND_FRIEND_REQUEST", data, cb);
    };

    // Team
    common.anonGetPreviewContent = function (data, cb) {
        postMessage("ANON_GET_PREVIEW_CONTENT", data, cb);
    };

    // Onlyoffice
    var onlyoffice = common.onlyoffice = {};
    onlyoffice.execCommand = function (data, cb) {
        postMessage("OO_COMMAND", data, cb);
    };
    onlyoffice.onEvent = Util.mkEvent();

    // Mailbox
    var mailbox = common.mailbox = {};
    mailbox.execCommand = function (data, cb) {
        postMessage("MAILBOX_COMMAND", data, cb);
    };
    mailbox.onEvent = Util.mkEvent();

    // Universal
    var universal = common.universal = {};
    universal.execCommand = function (data, cb) {
        postMessage("UNIVERSAL_COMMAND", data, cb);
    };
    universal.onEvent = Util.mkEvent();


    // Pad RPC
    var pad = common.padRpc = {};
    pad.joinPad = function (data) {
        postMessage("JOIN_PAD", data);
    };
    pad.leavePad = function (data, cb) {
        postMessage("LEAVE_PAD", data, cb);
    };
    pad.sendPadMsg = function (data, cb) {
        // -1 ==> no timeout, we may receive the callback only when we reconnect
        postMessage("SEND_PAD_MSG", data, cb, { timeout: -1 });
    };
    pad.getLastHash = function (data, cb) {
        postMessage("GET_LAST_HASH", data, cb);
    };
    pad.getSnapshot = function (data, cb) {
        postMessage("GET_SNAPSHOT", data, cb);
    };
    pad.onReadyEvent = Util.mkEvent();
    pad.onMessageEvent = Util.mkEvent();
    pad.onJoinEvent = Util.mkEvent();
    pad.onLeaveEvent = Util.mkEvent();
    pad.onDisconnectEvent = Util.mkEvent();
    pad.onCacheEvent = Util.mkEvent();
    pad.onCacheReadyEvent = Util.mkEvent();
    pad.onConnectEvent = Util.mkEvent();
    pad.onErrorEvent = Util.mkEvent();
    pad.onMetadataEvent = Util.mkEvent();
    pad.onChannelDeleted = Util.mkEvent();

    pad.contactOwner = function (data, cb) {
        postMessage("CONTACT_PAD_OWNER", data, cb);
    };
    pad.giveAccess = function (data, cb) {
        postMessage("GIVE_PAD_ACCESS", data, cb);
    };

    common.onCorruptedCache = function (channel) {
        postMessage("CORRUPTED_CACHE", channel);
    };

    common.setPadMetadata = function (data, cb) {
        postMessage('SET_PAD_METADATA', data, cb);
    };
    common.getPadMetadata = function (data, cb) {
        postMessage('GET_PAD_METADATA', data, cb);
    };

    common.burnPad = function (data) {
        postMessage('BURN_PAD', data);
    };

    common.setDriveRedirectPreference = function (data, cb) {
        LocalStore.setDriveRedirectPreference(data && data.value);
        cb();
    };

    common.changePadPassword = function (Crypt, Crypto, data, cb) {
        var href = data.href;
        var oldPassword = data.oldPassword;
        var newPassword = data.password;
        var teamId = data.teamId;
        if (!href) { return void cb({ error: 'EINVAL_HREF' }); }
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return void cb({ error: 'EINVAL_HREF' }); }

        var warning = false;
        var newHash, newRoHref;
        var oldChannel;
        var oldSecret;
        var oldMetadata;
        var newSecret;
        var privateData;

        if (parsed.hashData.version >= 2) {
            newSecret = Hash.getSecrets(parsed.type, parsed.hash, newPassword);
            if (!(newSecret.keys && newSecret.keys.editKeyStr)) {
                return void cb({error: 'EAUTH'});
            }
            newHash = Hash.getEditHashFromKeys(newSecret);
        } else {
            newHash = Hash.createRandomHash(parsed.type, newPassword);
            newSecret = Hash.getSecrets(parsed.type, newHash, newPassword);
        }
        var newHref = '/' + parsed.type + '/#' + newHash;

        var isSharedFolder = parsed.type === 'drive';

        var optsGet = {
            password: oldPassword
        };
        var optsPut = {
            password: newPassword,
            metadata: {},
            initialState: isSharedFolder ? '{}' : undefined
        };

        var cryptgetVal;

        Nthen(function (waitFor) {
            if (parsed.hashData && parsed.hashData.password && !oldPassword) {
                common.getPadAttribute('password', waitFor(function (err, password) {
                    optsGet.password = password;
                }), href);
            }
        }).nThen(function (waitFor) {
            oldSecret = Hash.getSecrets(parsed.type, parsed.hash, optsGet.password);
            oldChannel = oldSecret.channel;
            common.getPadMetadata({channel: oldChannel}, waitFor(function (metadata) {
                oldMetadata = metadata || {};
            }));
            common.getMetadata(waitFor(function (err, data) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
                privateData = data.priv;
            }));
        }).nThen(function (waitFor) {
            // Get owners, mailbox and expiration time
            var owners = oldMetadata.owners;
            optsPut.metadata.owners = owners;

            // Check if we're allowed to change the password
            var edPublic = teamId ? (privateData.teams[teamId] || {}).edPublic : privateData.edPublic;
            var isOwner = Array.isArray(owners) && edPublic && owners.indexOf(edPublic) !== -1;
            if (!isOwner) {
                // We're not an owner, we shouldn't be able to change the password!
                waitFor.abort();
                return void cb({ error: 'EPERM' });
            }

            var mailbox = oldMetadata.mailbox;
            if (mailbox) {
                // Create the encryptors to be able to decrypt and re-encrypt the mailboxes
                var oldCrypto = Crypto.createEncryptor(oldSecret.keys);
                var newCrypto = Crypto.createEncryptor(newSecret.keys);

                var m;
                if (typeof(mailbox) === "string") {
                    try {
                        m = newCrypto.encrypt(oldCrypto.decrypt(mailbox, true, true));
                    } catch (e) {}
                } else if (mailbox && typeof(mailbox) === "object") {
                    m = {};
                    Object.keys(mailbox).forEach(function (ed) {
                        try {
                            m[ed] = newCrypto.encrypt(oldCrypto.decrypt(mailbox[ed], true, true));
                        } catch (e) {
                            console.error(e);
                        }
                    });
                }
                optsPut.metadata.mailbox = m;
            }

            var expire = oldMetadata.expire;
            if (expire) {
                optsPut.metadata.expire = (expire - (+new Date())) / 1000; // Lifetime in seconds
            }
        }).nThen(function (waitFor) {
            common.getAccessKeys(waitFor(function (keys) {
                optsGet.accessKeys = keys;
                optsPut.accessKeys = keys;
             }));
        }).nThen(function (waitFor) {
            Crypt.get(parsed.hash, waitFor(function (err, val) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
                cryptgetVal = val;
                if (isSharedFolder) {
                    var parsed = JSON.parse(val || '{}');
                    var oldKey = parsed.version === 2 && oldSecret.keys.secondaryKey;
                    var newKey = newSecret.keys.secondaryKey;
                    UserObject.reencrypt(oldKey, newKey, parsed);
                    cryptgetVal = JSON.stringify(parsed);
                }
            }), optsGet);
            Cache.clearChannel(newSecret.channel, waitFor());
        }).nThen(function (waitFor) {
            optsPut.metadata.restricted = oldMetadata.restricted;
            optsPut.metadata.allowed = oldMetadata.allowed;
            if (!newPassword) { optsPut.metadata.forcePlaceholder = true; }
            Crypt.put(newHash, cryptgetVal, waitFor(function (err) {
                if (err) {
                    if (err === "EDELETED") { err = "PASSWORD_ALREADY_USED"; }
                    waitFor.abort();
                    return void cb({ error: err });
                }
            }), optsPut);
        }).nThen(function (waitFor) {
            if (isSharedFolder) {
                postMessage("UPDATE_SHARED_FOLDER_PASSWORD", {
                    href: href,
                    oldChannel: oldChannel,
                    password: newPassword
                }, waitFor());
                return;
            }
            pad.leavePad({
                channel: oldChannel
            }, waitFor());
            pad.onDisconnectEvent.fire(true);
        }).nThen(function (waitFor) {
            // Set the new password to our pad data
            common.setPadAttribute('password', newPassword, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            common.setPadAttribute('channel', newSecret.channel, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            var viewHash = Hash.getViewHashFromKeys(newSecret);
            newRoHref = '/' + parsed.type + '/#' + viewHash;
            common.setPadAttribute('roHref', newRoHref, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);

            if (parsed.hashData.password && newPassword) { return; } // same hash
            common.setPadAttribute('href', newHref, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
        }).nThen(function (waitFor) {
            // delete the old pad
            common.removeOwnedChannel({
                channel: oldChannel,
                teamId: teamId,
                reason: 'PASSWORD_CHANGE',
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
            if (!isSharedFolder) {
                postMessage("CHANGE_PAD_PASSWORD_PIN", {
                    oldChannel: oldChannel,
                    channel: newSecret.channel
                }, waitFor());
            }
        }).nThen(function () {
            common.drive.onChange.fire({path: ['drive', Constants.storageKey]});
            cb({
                warning: warning,
                hash: newHash,
                href: newHref,
                roHref: newRoHref,
                channel: newSecret.channel
            });
        });
    };

    common.changeBlobPassword = function (data, handlers, cb) {
        var href = data.href;
        var newPassword = data.password;
        var teamId = data.teamId;
        if (!href) { return void cb({ error: 'EINVAL_HREF' }); }
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return void cb({ error: 'EINVAL_HREF' }); }
        if (parsed.hashData.type !== 'file') { return void cb({ error: 'EINVAL_TYPE' }); }

        var newSecret;
        var newHash;

        if (parsed.hashData.version >= 2) {
            newSecret = Hash.getSecrets(parsed.type, parsed.hash, newPassword);
            if (!(newSecret.keys && newSecret.keys.fileKeyStr)) {
                return void cb({error: 'EAUTH'});
            }
            newHash = Hash.getFileHashFromKeys(newSecret);
        } else {
            newHash = Hash.createRandomHash(parsed.type, newPassword);
            newSecret = Hash.getSecrets(parsed.type, newHash, newPassword);
        }
        var newHref = '/' + parsed.type + '/#' + newHash;
        var fileHost = Config.fileHost || window.location.origin || '';

        /*
            1. get old password
            2. get owners
        */
        var oldPassword;
        var decrypted;
        var oldChannel;
        var warning;

        var MediaTag;
        var Upload;
        Nthen(function (waitFor) {
            if (parsed.hashData && parsed.hashData.password) {
                common.getPadAttribute('password', waitFor(function (err, password) {
                    oldPassword = password || '';
                }), href);
            }
        }).nThen(function (waitFor) {
            require([
                '/common/media-tag.js',
                '/common/outer/upload.js',
                '/components/tweetnacl/nacl-fast.min.js'
            ], waitFor(function (_MT, _Upload) {
                MediaTag = _MT;
                Upload = _Upload;
            }));
        }).nThen(function (waitFor) {
            var oldSecret = Hash.getSecrets(parsed.type, parsed.hash, oldPassword);
            oldChannel = oldSecret.channel;
            var src = fileHost + Hash.getBlobPathFromHex(oldChannel);
            var key = oldSecret.keys && oldSecret.keys.cryptKey;
            var cryptKey = window.nacl.util.encodeBase64(key);

            var mt = document.createElement('media-tag');
            mt.setAttribute('src', src);
            mt.setAttribute('data-crypto-key', 'cryptpad:'+cryptKey);

            MediaTag(mt).on('complete', waitFor(function (_decrypted) {
                decrypted = _decrypted;
            })).on('error', function (err) {
                waitFor.abort();
                cb({error: err});
                console.error(err);
            });
        }).nThen(function (waitFor) {
            var reader = new FileReader();
            reader.readAsArrayBuffer(decrypted.content);
            reader.onloadend = waitFor(function() {
                decrypted.u8 = new Uint8Array(reader.result);
            });
        }).nThen(function (waitFor) {
            var key = newSecret.keys && newSecret.keys.cryptKey;

            var onError = function (err) {
                waitFor.abort();
                cb({error: err});
            };
            Upload.uploadU8(common, {
                teamId: teamId,
                u8: decrypted.u8,
                metadata: decrypted.metadata,
                key: key,
                id: newSecret.channel,
                owned: true,
                onError: onError,
                onPending: handlers.onPending,
                updateProgress: handlers.updateProgress,
            }, waitFor());
        }).nThen(function (waitFor) {
            // Set the new password to our pad data
            common.setPadAttribute('password', newPassword, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            common.setPadAttribute('channel', newSecret.channel, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            if (parsed.hashData.password && newPassword) { return; } // same hash
            common.setPadAttribute('href', newHref, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
        }).nThen(function (waitFor) {
            // delete the old pad
            common.removeOwnedChannel({
                channel: oldChannel,
                teamId: teamId,
                reason: 'PASSWORD_CHANGE'
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
            postMessage("CHANGE_PAD_PASSWORD_PIN", {
                oldChannel: oldChannel,
                channel: newSecret.channel
            }, waitFor());
        }).nThen(function () {
            common.drive.onChange.fire({path: ['drive', Constants.storageKey]});
            cb({
                warning: warning,
                hash: newHash,
                href: newHref,
            });
        });
    };

    common.changeOOPassword = function (data, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var href = data.href;
        var oldPassword = data.oldPassword;
        var newPassword = data.password;
        var teamId = data.teamId;
        if (!href) { return void cb({ error: 'EINVAL_HREF' }); }
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return void cb({ error: 'EINVAL_HREF' }); }
        if (parsed.type !== 'sheet') { return void cb({ error: 'EINVAL_TYPE' }); }

        var warning = false;
        var newHash, newRoHref;
        var oldSecret;
        var oldMetadata;
        var oldRtChannel;
        var privateData;

        var newSecret;
        if (parsed.hashData.version >= 2) {
            newSecret = Hash.getSecrets(parsed.type, parsed.hash, newPassword);
            if (!(newSecret.keys && newSecret.keys.editKeyStr)) {
                return void cb({error: 'EAUTH'});
            }
            newHash = Hash.getEditHashFromKeys(newSecret);
        }
        var newHref = '/' + parsed.type + '/#' + newHash;
        var newRtChannel = Hash.createChannelId();

        var Crypt, Crypto;
        var cryptgetVal;
        var optsPut = {
            password: newPassword,
            metadata: {
                validateKey: newSecret.keys.validateKey
            },
        };
        var optsGet = {
            password: oldPassword
        };

        Nthen(function (waitFor) {
            common.getPadAttribute('', waitFor(function (err, _data) {
                if (!oldPassword && _data) {
                    optsGet.password = _data.password;
                }
            }), href);
            common.getAccessKeys(waitFor(function (keys) {
                optsGet.accessKeys = keys;
                optsPut.accessKeys = keys;
            }));
        }).nThen(function (waitFor) {
            oldSecret = Hash.getSecrets(parsed.type, parsed.hash, optsGet.password);

            require([
                '/common/cryptget.js',
                '/components/chainpad-crypto/crypto.js',
            ], waitFor(function (_Crypt, _Crypto) {
                Crypt = _Crypt;
                Crypto = _Crypto;
            }));

            common.getPadMetadata({channel: oldSecret.channel}, waitFor(function (metadata) {
                oldMetadata = metadata;
            }));
            common.getMetadata(waitFor(function (err, data) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
                privateData = data.priv;
            }));
        }).nThen(function (waitFor) {
            // Check if we're allowed to change the password
            var owners = oldMetadata.owners;
            optsPut.metadata.owners = owners;
            var edPublic = teamId ? (privateData.teams[teamId] || {}).edPublic : privateData.edPublic;
            var isOwner = Array.isArray(owners) && edPublic && owners.indexOf(edPublic) !== -1;
            if (!isOwner) {
                // We're not an owner, we shouldn't be able to change the password!
                waitFor.abort();
                return void cb({ error: 'EPERM' });
            }

            var mailbox = oldMetadata.mailbox;
            if (mailbox) {
                // Create the encryptors to be able to decrypt and re-encrypt the mailboxes
                var oldCrypto = Crypto.createEncryptor(oldSecret.keys);
                var newCrypto = Crypto.createEncryptor(newSecret.keys);

                var m;
                if (typeof(mailbox) === "string") {
                    try {
                        m = newCrypto.encrypt(oldCrypto.decrypt(mailbox, true, true));
                    } catch (e) {}
                } else if (mailbox && typeof(mailbox) === "object") {
                    m = {};
                    Object.keys(mailbox).forEach(function (ed) {
                        try {
                            m[ed] = newCrypto.encrypt(oldCrypto.decrypt(mailbox[ed], true, true));
                        } catch (e) {
                            console.error(e);
                        }
                    });
                }
                optsPut.metadata.mailbox = m;
            }

            var expire = oldMetadata.expire;
            if (expire) {
                optsPut.metadata.expire = (expire - (+new Date())) / 1000; // Lifetime in seconds
            }

            // Get last cp (cryptget)
            Crypt.get(parsed.hash, waitFor(function (err, val) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
                try {
                    cryptgetVal = JSON.parse(val);
                    if (!cryptgetVal.content) {
                        waitFor.abort();
                        return void cb({ error: 'INVALID_CONTENT' });
                    }
                } catch (e) {
                    waitFor.abort();
                    return void cb({ error: 'CANT_PARSE' });
                }
            }), optsGet);
        }).nThen(function (waitFor) {
            // Re-encrypt rtchannel
            oldRtChannel = Util.find(cryptgetVal, ['content', 'channel']);
            var newCrypto = Crypto.createEncryptor(newSecret.keys);
            var oldCrypto = Crypto.createEncryptor(oldSecret.keys);
            var cps = Util.find(cryptgetVal, ['content', 'hashes']);
            var cpLength = Object.keys(cps).length;
            var lastCp = cpLength ? cps[cpLength] : {};
            cryptgetVal.content.hashes = {};
            common.getHistory({
                channel: oldRtChannel,
                lastKnownHash: lastCp.hash
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    console.error(obj);
                    return void cb(obj.error);
                }
                var msgs = obj;
                var newHistory = msgs.map(function (str) {
                    try {
                        var d = oldCrypto.decrypt(str, true, true);
                        return newCrypto.encrypt(d);
                    } catch (e) {
                        console.log(e);
                        waitFor.abort();
                        return void cb({error: e});
                    }
                });
                // Update last knwon hash in cryptgetVal
                if (cpLength && newHistory.length) {
                    lastCp.hash = newHistory[0].slice(0, 64);
                    lastCp.index = 50;
                    cryptgetVal.content.hashes[1] =  lastCp;
                }
                common.onlyoffice.execCommand({
                    cmd: 'REENCRYPT',
                    data: {
                        channel: newRtChannel,
                        msgs: newHistory,
                        metadata: optsPut.metadata
                    }
                }, waitFor(function (obj) {
                    if (obj && obj.error) {
                        waitFor.abort();
                        console.warn(obj);
                        return void cb(obj.error);
                    }
                }));
            }));
            Cache.clearChannel(newSecret.channel, waitFor());
        }).nThen(function (waitFor) {
            // The new rt channel is ready
            // The blob uses its own encryption and doesn't need to be reencrypted
            cryptgetVal.content.channel = newRtChannel;
            if (!newPassword) { optsPut.metadata.forcePlaceholder = true; }
            Crypt.put(newHash, JSON.stringify(cryptgetVal), waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
            }), optsPut);
        }).nThen(function (waitFor) {
            pad.leavePad({
                channel: oldSecret.channel
            }, waitFor());
            pad.onDisconnectEvent.fire(true);
        }).nThen(function (waitFor) {
            // Set the new password to our pad data
            common.setPadAttribute('password', newPassword, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            common.setPadAttribute('channel', newSecret.channel, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            common.setPadAttribute('rtChannel', newRtChannel, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
            var viewHash = Hash.getViewHashFromKeys(newSecret);
            newRoHref = '/' + parsed.type + '/#' + viewHash;
            common.setPadAttribute('roHref', newRoHref, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);

            if (parsed.hashData.password && newPassword) { return; } // same hash
            common.setPadAttribute('href', newHref, waitFor(function (err) {
                if (err) { warning = true; }
            }), href);
        }).nThen(function (waitFor) {
            // delete the old pad
            common.removeOwnedChannel({
                channel: oldSecret.channel,
                teamId: teamId
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    console.info(obj);
                    return void cb(obj.error);
                }
                common.removeOwnedChannel({
                    channel: oldRtChannel,
                    teamId: teamId
                }, waitFor());
            }));
        }).nThen(function () {
            common.drive.onChange.fire({path: ['drive', Constants.storageKey]});
            cb({
                warning: warning,
                hash: newHash,
                href: newHref,
                roHref: newRoHref
            });
        });
    };

    common.deleteAccount = function (data, cb) {
        data = data || {};
        common.CP_onAccountDeletion = true;

        var bytes = data.bytes; // From Scrypt
        var auth = data.auth; // MFA data

        var allocated = Login.allocateBytes(bytes);
        var blockKeys = allocated.blockKeys;

        postMessage("DELETE_ACCOUNT", {
            keys: blockKeys,
            auth: auth
        }, function (obj) {
            if (obj.state) {
                Feedback.send('DELETE_ACCOUNT_AUTOMATIC');
            } else {
                Feedback.send('DELETE_ACCOUNT_MANUAL');
            }
            cb(obj);
        }, {raw: true});
    };
    common.removeOwnedPads = function (data, cb) {
        postMessage("REMOVE_OWNED_PADS", data, cb);
    };
    common.changeUserPassword = function (Crypt, edPublic, data, cb) {
        if (!edPublic) {
            return void cb({
                error: 'E_NOT_LOGGED_IN'
            });
        }
        var hash = common.userHash;
        if (!hash) {
            return void cb({
                error: 'E_NOT_LOGGED_IN'
            });
        }

        var oldBytes = data.oldBytes; // From Scrypt
        var newBytes = data.newBytes; // From Scrypt
        var secret = Hash.getSecrets('drive', hash);
        var newHash, newSecret;
        var oldIsOwned = false;

        var blockHash = LocalStore.getBlockHash();

        var oldAllocated = Login.allocateBytes(oldBytes);
        var newAllocated = Login.allocateBytes(newBytes);
        var oldBlockKeys = oldAllocated.blockKeys;
        var blockKeys = newAllocated.blockKeys;
        var auth = data.auth;

        Nthen(function (waitFor) {
            // Check if our drive is already owned
            console.log("checking if old drive is owned");
            common.anonRpcMsg('GET_METADATA', secret.channel, waitFor(function (err, obj) {
                if (err || obj.error) { return; }
                var md = obj[0];
                if (md && md.owners && Array.isArray(md.owners) &&
                    md.owners.indexOf(edPublic) !== -1) {
                    oldIsOwned = true;
                }
            }));
        }).nThen(function (waitFor) {
            Block.checkRights({
                auth: auth,
                blockKeys: oldBlockKeys,
            }, waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    console.error(err);
                    return void cb({ error: 'INVALID_CODE' });
                }
            }));
        }).nThen(function (waitFor) {
            var blockUrl = Block.getBlockUrl(blockKeys);
            // Check whether there is a block at that new location
            Util.getBlock(blockUrl, {}, waitFor(function (err, response) {
                // If there is no block or the block is invalid, continue.
                // error 401 means protected block

                /*
                // the following block prevent users from re-using an old password
                if (err === 404 && response && response.reason) {
                    waitFor.abort();
                    return void cb({
                        error: 'EDELELED',
                        reason: response.reason
                    });
                }
                */

                if (err && err !== 401) {
                    console.log("no block found");
                    return;
                }
                if (err && err === 401) {
                    // there is a protected block at the next location, abort FIXME check
                    waitFor.abort();
                    return void cb({ error: 'EEXISTS' });
                }

                response.arrayBuffer().then(waitFor(arraybuffer => {
                    var block = new Uint8Array(arraybuffer);
                    var decryptedBlock = Block.decrypt(block, blockKeys);
                    if (!decryptedBlock) {
                        console.error("Found a login block but failed to decrypt");
                        return;
                    }

                    // If there is already a valid block, abort! We risk overriding another user's data
                    waitFor.abort();
                    cb({ error: 'EEXISTS' });
                }));
            }));
        }).nThen(function (waitFor) {
            // Create a new user hash
            // Get the current content, store it in the new user file
            // and make sure the new user drive is owned
            newHash = Hash.createRandomHash('drive');
            newSecret = Hash.getSecrets('drive', newHash);

            var optsPut = {
                owners: [edPublic],
                initialState: '{}',
            };

            console.log("copying contents of old drive to new location");
            Crypt.get(hash, waitFor(function (err, val) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }

                Crypt.put(newHash, val, waitFor(function (err) {
                    if (err) {
                        waitFor.abort();
                        console.error(err);
                        return void cb({ error: err });
                    }
                }), optsPut);
            }));
        }).nThen(function (waitFor) {
            // Write the new login block
            var content = {
                User_hash: newHash,
                edPublic: edPublic,
            };
            var userData = [undefined, edPublic];
            var sessionToken = LocalStore.getSessionToken() || undefined;
            Block.writeLoginBlock({
                auth: auth,
                userData: userData,
                blockKeys: blockKeys,
                oldBlockKeys: oldBlockKeys,
                content: content,
                session: sessionToken // Recover existing SSO session
            }, waitFor(function (err, data) {
                if (err) {
                    waitFor.abort();
                    return void cb({error: err});
                }
                // Update the session if OTP is enabled
                // If OTP is disabled, keep the existing SSO session
                if (data && data.bearer) {
                    LocalStore.setSessionToken(data.bearer);
                }
            }));

        }).nThen(function (waitFor) {
            var isSSO = Boolean(LocalStore.getSSOSeed());
            if (!isSSO) { return; }

            // Update "sso_block" data for SSO accounts
            Block.updateSSOBlock({
                blockKeys: blockKeys,
                oldBlockKeys: oldBlockKeys
            }, waitFor(function (err) {
                if (err) {
                    // If we can't move the sso_block data, we won't be able to log in later
                    // so we must abort the password change.
                    console.error(err);
                    waitFor.abort();
                    return void cb({error: err});
                }
            }));
        }).nThen(function (waitFor) {
            var blockUrl = Block.getBlockUrl(blockKeys);
            var sessionToken = LocalStore.getSessionToken() || undefined;
            Util.getBlock(blockUrl, {
                bearer: sessionToken,
            }, waitFor((err) => {
                if (err) {
                    console.error(err);
                    waitFor.abort();
                    return cb({
                        error: err,
                    });
                }
                console.log("new login block written");
                var newBlockHash = Block.getBlockHash(blockKeys);
                LocalStore.setBlockHash(newBlockHash);
            }));
        }).nThen(function (waitFor) {
            // New drive hash is in login block, unpin the old one and pin the new one
            console.log("unpinning old drive and pinning new one");
            common.unpinPads([secret.channel], waitFor());
            common.pinPads([newSecret.channel], waitFor());
        }).nThen(function (waitFor) {
            // Remove block hash
            if (!blockHash) { return; }
            console.log('removing old login block');
            Block.removeLoginBlock({
                reason: 'PASSWORD_CHANGE',
                auth: auth,
                edPublic: edPublic,
                blockKeys: oldBlockKeys,
            }, waitFor(function (err) {
                if (err) { return void console.error(err); }
                common.passwordUpdated = true;
            }));
        }).nThen(function (waitFor) {
            if (!oldIsOwned) { return; }
            console.log('removing old drive');
            common.removeOwnedChannel({
                channel: secret.channel,
                teamId: null,
                force: true,
                reason: 'PASSWORD_CHANGE'
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    // Deal with it as if it was not owned
                    oldIsOwned = false;
                    return;
                }
                common.stopWorker();
            }));
        }).nThen(function (waitFor) {
            if (oldIsOwned) { return; }
            console.error('deprecating old drive.');
            postMessage("SET", {
                teamId: data.teamId,
                key: [Constants.deprecatedKey],
                value: true
            }, waitFor(function (obj) {
                if (obj && obj.error) {
                    console.error(obj.error);
                }
                common.stopWorker();
            }));
        }).nThen(function () {
            // We have the new drive, with the new login block
            var feedbackKey = (data.password === data.newPassword)?
                'OWNED_DRIVE_MIGRATION': 'PASSWORD_CHANGED';

            Feedback.send(feedbackKey, undefined, function () {
                window.location.reload();
            });
        });
    };

    // Loading events
    common.loading = {};
    common.loading.onDriveEvent = Util.mkEvent();
    common.loading.onMissingMFAEvent = Util.mkEvent();

    // (Auto)store pads
    common.autoStore = {};
    common.autoStore.onStoreRequest = Util.mkEvent();

    common.getFullHistory = function (data, cb) {
        postMessage("GET_FULL_HISTORY", data, cb, {timeout: 180000});
    };
    common.getHistory = function (data, cb) {
        postMessage("GET_HISTORY", data, cb, {timeout: 180000});
    };
    common.getHistoryRange = function (data, cb) {
        postMessage("GET_HISTORY_RANGE", data, cb);
    };

    common.getShareHashes = function (secret, cb) {
        var hashes;
        if (!window.location.hash) {
            hashes = Hash.getHashes(secret);
            return void cb(null, hashes);
        }
        var parsed = Hash.parsePadUrl(currentPad.href);
        if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
        hashes = Hash.getHashes(secret);

        // If the current href is an edit one, return the existing hashes
        var parsedHash = parsed.hashData;
        if (!parsedHash || parsedHash.mode === 'edit') { return void cb(null, hashes); }
        if (parsedHash.type !== 'pad') { return void cb(null, hashes); }

        if (secret.version === 0) {
            // It means we're using an old hash
            hashes.editHash = window.location.hash.slice(1);
            return void cb(null, hashes);
        }

        if (hashes.editHash) {
            // no need to find stronger if we already have edit hash
            return void cb(null, hashes);
        }

        postMessage("GET_STRONGER_HASH", {
            channel: secret.channel
        }, function (hash) {
            if (hash) { hashes.editHash = hash; }
            cb(null, hashes);
        });
    };

    var CRYPTPAD_VERSION = 'cryptpad-version';
    var currentVersion = localStorage[CRYPTPAD_VERSION];
    var updateLocalVersion = function (newUrlArgs) {
        // Check for CryptPad updates
        var urlArgs = newUrlArgs || (Config.requireConf ? Config.requireConf.urlArgs : null);
        if (!urlArgs) { return; }
        let ver = Util.getVersionFromUrlArgs(urlArgs);
        if (!ver) { return; }
        var verArr = ver.split('.');
        //verArr[2] = 0;
        if (verArr.length !== 3) { return; }
        var stored = currentVersion || '0.0.0';
        var storedArr = stored.split('.');
        //storedArr[2] = 0;
        var shouldUpdate = JSON.stringify(verArr) !== JSON.stringify(storedArr);
/*
        var shouldUpdate = parseInt(verArr[0]) !== parseInt(storedArr[0]) ||
                           (parseInt(verArr[0]) === parseInt(storedArr[0]) &&
                            parseInt(verArr[1]) !== parseInt(storedArr[1]));
*/
        if (!shouldUpdate) { return; }
        currentVersion = ver;
        localStorage[CRYPTPAD_VERSION] = ver;
        if (newUrlArgs) {
            // It's a reconnect
            common.onNewVersionReconnect.fire();
        }
        return true;
    };

    var _onMetadataChanged = [];
    common.onMetadataChanged = function (h) {
        if (typeof(h) !== "function") { return; }
        if (_onMetadataChanged.indexOf(h) !== -1) { return; }
        _onMetadataChanged.push(h);
    };
    common.changeMetadata = function () {
        _onMetadataChanged.forEach(function (h) { h(); });
    };

    var requestLogin = function () {
        // log out so that you don't go into an endless loop...
        LocalStore.logout(function () {
            // redirect them to log in, and come back when they're done.
            var href = Hash.hashToHref('', 'login');
            var url = Hash.getNewPadURL(href, { href: currentPad.href });
            window.location.href = url;
        });
    };

    var provideFeedback = function () {
        if (typeof(window.Proxy) === 'undefined') {
            Feedback.send("NO_PROXIES");
        }

        if (!common.isWebRTCSupported()) {
            Feedback.send("NO_WEBRTC");
        }

        var shimPattern = /CRYPTPAD_SHIM/;
        if (shimPattern.test(Array.isArray.toString())) {
            Feedback.send("NO_ISARRAY");
        }

        if (shimPattern.test(Array.prototype.fill.toString())) {
            Feedback.send("NO_ARRAYFILL");
        }

        if (typeof(Symbol) === 'undefined') {
            Feedback.send('NO_SYMBOL');
        }

        if (typeof(SharedWorker) === "undefined") {
            Feedback.send('NO_SHAREDWORKER');
        } else {
            Feedback.send('SHAREDWORKER');
        }
        if (typeof(Worker) === "undefined") {
            Feedback.send('NO_WEBWORKER');
        }
        if (!('serviceWorker' in navigator)) {
            Feedback.send('NO_SERVICEWORKER');
        }
        if (!common.hasCSSVariables()) {
            Feedback.send('NO_CSS_VARIABLES');
        }
        Feedback.reportScreenDimensions();
        Feedback.reportLanguage();
    };
    var initFeedback = function (feedback) {
        // Initialize feedback
        Feedback.init(feedback);
        provideFeedback();
    };
    var onStoreReady = function (data) {
        if (common.userHash) {
            var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
            if (localToken === null) {
                // if that number hasn't been set to localStorage, do so.
                localStorage.setItem(Constants.tokenKey, data[Constants.tokenKey]);
            }
        }
        initFeedback(data.feedback);
    };

    common.startAccountDeletion = function (data, cb) {
        // Logout other tabs
        LocalStore.logout(null, true);
        cb();
    };

    common.storeLogout = function (data) {
        if (common.passwordUpdated) { return; }
        LocalStore.logout(function () {
            common.stopWorker();
            common.drive.onDeleted.fire(data.reason);
        }, true);
    };

    var lastPing = +new Date();
    var onPing = function (data, cb) {
        lastPing = +new Date();
        cb();
    };

    var timeout = false;
    common.onTimeoutEvent = Util.mkEvent();
    var onTimeout = function (fromOuter) {
        var key = fromOuter ? "TIMEOUT_OUTER" : "TIMEOUT_KICK";
        Feedback.send(key, true);
        timeout = true;
        common.onNetworkDisconnect.fire();
        common.padRpc.onDisconnectEvent.fire();
        common.onTimeoutEvent.fire();
    };

    Visible.onChange(function (visible) {
        if (!visible) { return; }
        var now = +new Date();
        // If last ping is bigger than 2min, ping the worker
        if (now - lastPing > (2 * 60 * 1000)) {
            var to = setTimeout(function () {
                onTimeout(true);
            }, 5000);
            postMessage('PING', null, function () {
                clearTimeout(to);
            });
        }
    });

    var queries = {
        PING: onPing,
        TIMEOUT: onTimeout,
        REQUEST_LOGIN: requestLogin,
        UPDATE_METADATA: common.changeMetadata,
        UPDATE_TOKEN: function (data) {
            var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
            if (localToken !== data.token) { requestLogin(); }
        },
        // Store
        STORE_READY: onStoreReady,
        // Network
        NETWORK_DISCONNECT: common.onNetworkDisconnect.fire,
        NETWORK_RECONNECT: function (data) {
            require(['/api/config?' + (+new Date())], function (NewConfig) {
                var update = updateLocalVersion(NewConfig.requireConf && NewConfig.requireConf.urlArgs);
                if (update) {
                    postMessage('DISCONNECT');
                    return;
                }
                common.onNetworkReconnect.fire(data);
            });
        },
        // OnlyOffice
        OO_EVENT: common.onlyoffice.onEvent.fire,
        // Mailbox
        MAILBOX_EVENT: common.mailbox.onEvent.fire,
        // Universal
        UNIVERSAL_EVENT: common.universal.onEvent.fire,
        // Pad
        PAD_READY: common.padRpc.onReadyEvent.fire,
        PAD_MESSAGE: common.padRpc.onMessageEvent.fire,
        PAD_JOIN: common.padRpc.onJoinEvent.fire,
        PAD_LEAVE: common.padRpc.onLeaveEvent.fire,
        PAD_DISCONNECT: common.padRpc.onDisconnectEvent.fire,
        PAD_CACHE: common.padRpc.onCacheEvent.fire,
        PAD_CACHE_READY: common.padRpc.onCacheReadyEvent.fire,
        PAD_CONNECT: common.padRpc.onConnectEvent.fire,
        PAD_ERROR: common.padRpc.onErrorEvent.fire,
        PAD_METADATA: common.padRpc.onMetadataEvent.fire,
        CHANNEL_DELETED: common.padRpc.onChannelDeleted.fire,
        // Drive
        DRIVE_LOG: common.drive.onLog.fire,
        DRIVE_CHANGE: common.drive.onChange.fire,
        DRIVE_REMOVE: common.drive.onRemove.fire,
        DRIVE_DELETED: common.drive.onDeleted.fire,
        // Account deletion
        DELETE_ACCOUNT: common.startAccountDeletion,
        LOGOUT: common.storeLogout,
        // Loading
        LOADING_DRIVE: common.loading.onDriveEvent.fire,
        // AutoStore
        AUTOSTORE_DISPLAY_POPUP: common.autoStore.onStoreRequest.fire,
    };

    common.hasCSSVariables = function () {
        if (window.CSS && window.CSS.supports && window.CSS.supports('--a', 0)) { return true; }
        // Safari lol y u always b returnin false ?
        var color = 'rgb(255, 198, 0)';
        var el = document.createElement('span');
        el.style.setProperty('--color', color);
        el.style.setProperty('background', 'var(--color)');
        document.body.appendChild(el);
        var styles = getComputedStyle(el);
        var doesSupport = (styles.backgroundColor === color);
        document.body.removeChild(el);
        return doesSupport;
    };

    common.isWebRTCSupported = function () {
        return Boolean(navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia ||
            window.RTCPeerConnection);
    };

    common.ready = (function () {
        var env = {};
        var initialized = false;

    return function (f, rdyCfg) {
        rdyCfg = rdyCfg || {};

        if (rdyCfg.currentPad) {
            currentPad = common.currentPad = rdyCfg.currentPad;
        }

        if (initialized) {
            return void setTimeout(function () { f(void 0, env); });
        }

        var userHash;

        (function iOSFirefoxFix () {
/*
    For some bizarre reason Firefox on iOS throws an error during the
    loading process unless we call this function. Drawing these elements
    to the DOM presumably causes the JS engine to wait just a little bit longer
    until some APIs we need are ready. This occurs despite all this code being
    run after the usual dom-ready events. This fix was discovered while trying
    to log the error messages to the DOM because it's extremely difficult
    to debug Firefox iOS in the usual ways. In summary, computers are terrible.
*/
             try {
                var style = document.createElement('style');
                    style.type = 'text/css';
                    style.appendChild(document.createTextNode('#cp-logger { display: none; }'));
                document.head.appendChild(style);

                var logger = document.createElement('div');
                    logger.setAttribute('id', 'cp-logger');
                document.body.appendChild(logger);

                var pre = document.createElement('pre');
                    pre.innerText = 'x';
                logger.appendChild(pre);
            } catch (err) { console.error(err); }
        }());

        Nthen(function (waitFor) {
            if (AppConfig.beforeLogin) {
                AppConfig.beforeLogin(LocalStore.isLoggedIn(), waitFor());
            }
        }).nThen(function (waitFor) {
            var blockHash = LocalStore.getBlockHash();
            if (!blockHash || !Config.enforceMFA) { return; }

            // If this instance is configured to enforce MFA for all registered users,
            // request the login block with no credential to check if it is protected.
            var parsed = Block.parseBlockHash(blockHash);
            Util.getBlock(parsed.href, { }, waitFor((err, response) => {
                // If this account is already protected, nothing to do
                if (err === 401 && response.method) { return; }

                // Missing MFA protection, show set up screen
                common.loading.onMissingMFAEvent.fire({
                    cb: waitFor()
                });
            }));

        }).nThen(function (waitFor) {
            // if a block URL is present then the user is probably logged in with a modern account
            var blockHash = LocalStore.getBlockHash();
            if (blockHash) {
                console.debug("Block hash is present");
                var parsed = Block.parseBlockHash(blockHash);

                if (typeof(parsed) !== 'object') {
                    console.error("Failed to parse blockHash");
                    console.log(parsed);
                    return;
                }

                // they might also have a "session token", which is a JWT.
                // this indicates that their login block is protected with 2FA
                var sessionToken = LocalStore.getSessionToken() || undefined;

                var done = waitFor();

                // request the login block, providing credentials if available
                Util.getBlock(parsed.href, {
                    bearer: sessionToken,
                }, waitFor((err, response) => {
                    if (err === 401) {
                        // a 401 error indicates insufficient authentication
                        // either their JWT is invalid, or they didn't provide one
                        // when it was expected. Log them out and redirect them to
                        // the login page, where they will be able to authenticate
                        // and request a new JWT

                        // TODO Re-authenticate without user password? We'd need another way
                        // to send the OTP code to the server

                        waitFor.abort();
                        return void LocalStore.logout(function () {
                            requestLogin();
                        });
                    }

                    if (err === 404) {
                        // Not found: account deleted
                        waitFor.abort();
                        return LocalStore.logout(function () {
                            f(response || err);
                        });
                    }

                    if (err) {
                        // TODO
                        // it seems wrong that errors here aren't reported or handled
                        // but it's consistent with other failure cases in the rest of this process
                        // that probably justifies some more thorough review.
                        // In particular, it should not be possible to be "half-logged-in"
                        // behaving like a guest after trying to authenticate as a registered user
                        return void console.error(err);
                    }

                    // if no errors occurred then we can try to convert the response
                    // to an arraybuffer and decrypt its payload
                    response.arrayBuffer().then(arraybuffer => {
                        arraybuffer = new Uint8Array(arraybuffer);
                        // use the results to load your user hash and
                        // put your userhash into localStorage
                        try {
                            var block_info = Block.decrypt(arraybuffer, parsed.keys);
                            if (!block_info) {
                                console.error("Failed to decrypt !");
                                return;
                            }
                            userHash = block_info[Constants.userHashKey];
                            if (!userHash) {
                                return void LocalStore.logout(function () {
                                    requestLogin();
                                });
                            }
                        } catch (e) {
                            console.error(e);
                            return void console.error("failed to decrypt or decode block content");
                        }
                        done();
                    });
                }));
            }
        }).nThen(function (waitFor) {
            var blockHash = LocalStore.getBlockHash();
            var blockId = '';
            try {
                var blockPath = (new URL(blockHash)).pathname;
                var blockSplit = blockPath.split('/');
                if (blockSplit[1] === 'block') {
                    blockId = blockSplit[3];
                }
            } catch (e) { }
            var cfg = {
                init: true,
                userHash: userHash || LocalStore.getUserHash(),
                anonHash: LocalStore.getFSHash(),
                localToken: tryParsing(localStorage.getItem(Constants.tokenKey)), // TODO move this to LocalStore ?
                language: common.getLanguage(),
                form_seed: localStorage.CP_formSeed,
                cache: rdyCfg.cache,
                noDrive: rdyCfg.noDrive,
                neverDrive: rdyCfg.neverDrive,
                disableCache: localStorage['CRYPTPAD_STORE|disableCache'],
                driveEvents: !rdyCfg.noDrive, //rdyCfg.driveEvents // Boolean
                lastVisit: Number(localStorage.lastVisit) || undefined,
                blockId: blockId,
                blockHash: blockHash
            };
            common.userHash = userHash || LocalStore.getUserHash();

            // FIXME Backward compatibility
            if (sessionStorage.newPadFileData) {
                common.fromFileData = JSON.parse(sessionStorage.newPadFileData);
                var _parsed1 = Hash.parsePadUrl(common.fromFileData.href);
                var _parsed2 = Hash.parsePadUrl(window.location.href);
                if (_parsed1.hashData.type === 'pad') {
                    if (_parsed1.type !== _parsed2.type) { delete common.fromFileData; }
                }
                delete sessionStorage.newPadFileData;
            }

            if (sessionStorage.newPadPath) {
                common.initialPath = sessionStorage.newPadPath;
                delete sessionStorage.newPadPath;
            }

            if (sessionStorage.newPadTeam) {
                common.initialTeam = sessionStorage.newPadTeam;
                delete sessionStorage.newPadTeam;
            }


            var channelIsReady = waitFor();
            updateLocalVersion();

            var msgEv = Util.mkEvent();
            var postMsg, worker;
            var noWorker = AppConfig.disableWorkers || false;
            var noSharedWorker = false;
            if (localStorage.CryptPad_noWorkers) {
                noWorker = localStorage.CryptPad_noWorkers === '1';
                console.error('WebWorker/SharedWorker state forced to ' + !noWorker);
            }
            Nthen(function (waitFor2) {
                if (Worker) {
                    var w = waitFor2();
                    try {
                        worker = new Worker('/common/outer/testworker.js?' + urlArgs);
                        worker.onerror = function (errEv) {
                            errEv.preventDefault();
                            errEv.stopPropagation();
                            noWorker = true;
                            worker.terminate();
                            w();
                        };
                        worker.onmessage = function (ev) {
                            if (ev.data === "OK") {
                                worker.terminate();
                                w();
                            }
                        };
                    } catch (e) {
                        noWorker = true;
                        w();
                    }
                }
                if (typeof(SharedWorker) !== "undefined") {
                    try {
                        new SharedWorker('');
                    } catch (e) {
                        noSharedWorker = true;
                        console.log('Disabling SharedWorker because of privacy settings.');
                    }
                }
            }).nThen(function (waitFor2) {
                if (!noWorker && !noSharedWorker && typeof(SharedWorker) !== "undefined") {
                    worker = new SharedWorker('/common/outer/sharedworker.js?' + urlArgs);
                    worker.onerror = function (e) {
                        console.error(e.message); // FIXME seeing lots of errors here as of 2.20.0
                    };
                    worker.port.onmessage = function (ev) {
                        if (ev.data === "SW_READY") {
                            return;
                        }
                        msgEv.fire(ev);
                    };
                    postMsg = function (data) {
                        worker.port.postMessage(data);
                    };
                    postMsg('INIT');

                    /*
                    window.addEventListener('beforeunload', function () {
                        postMsg('CLOSE');
                    });
                    */
                    window.addEventListener('unload', function () {
                        postMsg('CLOSE');
                    });
                // eslint-disable-next-line no-constant-condition
                } else if (false && !noWorker && !noSharedWorker && 'serviceWorker' in navigator) {
                    var initializing = true;
                    var stopWaiting = waitFor2(); // Call this function when we're ready

                    postMsg = function (data) {
                        if (worker) { return void worker.postMessage(data); }
                    };

                    navigator.serviceWorker.register('/common/outer/serviceworker.js?' + urlArgs, {scope: '/'})
                        .then(function(reg) {
                            // Add handler for receiving messages from the service worker
                            navigator.serviceWorker.addEventListener('message', function (ev) {
                                if (initializing && ev.data === "SW_READY") {
                                    initializing = false;
                                } else {
                                    msgEv.fire(ev);
                                }
                            });

                            // Initialize the worker
                            // If it is active (probably running in another tab), just post INIT
                            if (reg.active) {
                                worker = reg.active;
                                postMsg("INIT");
                            }
                            // If it was not active, wait for the "activated" state and post INIT
                            reg.onupdatefound = function () {
                                if (initializing) {
                                    var w = reg.installing;
                                    var onStateChange = function () {
                                        if (w.state === "activated") {
                                            worker = w;
                                            postMsg("INIT");
                                            w.removeEventListener("statechange", onStateChange);
                                        }
                                    };
                                    w.addEventListener('statechange', onStateChange);
                                    return;
                                }
                                // New version detected (from another tab): kill?
                                console.error('New version detected: ABORT?');
                            };
                            return void stopWaiting();
                        }).catch(function(error) {
                            /**/console.log('Registration failed with ' + error);
                        });

                    window.addEventListener('beforeunload', function () {
                        postMsg('CLOSE');
                    });
                } else if (!noWorker && Worker) {
                    worker = new Worker('/common/outer/webworker.js?' + urlArgs);
                    worker.onerror = function (e) {
                        console.error(e.message);
                    };
                    worker.onmessage = function (ev) {
                        msgEv.fire(ev);
                    };
                    postMsg = function (data) {
                        worker.postMessage(data);
                    };
                } else {
                    // Use the async store in the main thread if workers are not available
                    require(['/common/outer/noworker.js'], waitFor2(function (NoWorker) {
                        NoWorker.onMessage(function (data) {
                            msgEv.fire({data: data, origin: ''});
                        });
                        postMsg = function (d) { setTimeout(function () { NoWorker.query(d); }); };
                        NoWorker.create();
                    }));
                }
            }).nThen(function () {
                Channel.create(msgEv, postMsg, function (chan) {
                    console.log('Outer ready');
                    Object.keys(queries).forEach(function (q) {
                        chan.on(q, function (data, cb) {
                            if (timeout) { return; }
                            try {
                                queries[q](data, cb);
                            } catch (e) {
                                console.error("Error in outer when executing query " + q);
                                console.error(e);
                                console.log(data);
                            }
                        });
                    });

                    postMessage = function (cmd, data, cb, opts) {
                        cb = cb || function () {};
                        if (timeout) { return void cb ({error: 'TIMEOUT'}); }
                        chan.query(cmd, data, function (err, data) {
                            if (err) { return void cb ({error: err}); }
                            cb(data);
                        }, opts);
                    };

                    console.log('Posting CONNECT');
                    postMessage('CONNECT', cfg, function (data) {
                        // FIXME data should always exist
                        // this indicates a false condition in sharedWorker
                        // got here via a reference error:
                        // uncaught exception: TypeError: data is undefined
                        if (!data) { throw new Error('FALSE_INIT'); }
                        if (data.error) { throw new Error(data.error); }
                        if (data.state === 'ALREADY_INIT') {
                            data = data.returned;
                            initFeedback(data.feedback);
                        }

                        if (data.edPublic) {
                            if (Array.isArray(Config.adminKeys) &&
                                    Config.adminKeys.includes(data.edPublic)) {
                                // Doesn't provides extra-rights but may show
                                // additional warnings in the UI
                                localStorage.CP_admin = "1";
                            }
                        }

                        if (data.loggedIn) {
                            window.CP_logged_in = true;
                        }
                        if (data.anonHash && !cfg.userHash) { LocalStore.setFSHash(data.anonHash); }

                        var prefersDriveRedirect = data[Constants.prefersDriveRedirectKey];
                        if (typeof(prefersDriveRedirect) === 'boolean') {
                            LocalStore.setDriveRedirectPreference(prefersDriveRedirect);
                        }

                        initialized = true;
                        channelIsReady();
                    });

                }, false);
            });

        }).nThen(function () {
            // Load the new pad when the hash has changed
            var oldHref  = document.location.href;

            // remove tracking parameters from URLs
            try {
                var u = new URL(oldHref);
                u.search = '';
                if (u.href !== oldHref) {
                    window.history.replaceState({}, window.document.title, u.href);
                }
            } catch (err) { console.error(err); }

            window.onhashchange = function (ev) {
                if (ev && ev.reset) { oldHref = document.location.href; return; }
                var newHref = document.location.href;

                // Compare the URLs without /embed and /present
                var parsedOld = Hash.parsePadUrl(oldHref);
                var parsedNew = Hash.parsePadUrl(newHref);
                if (parsedOld.hashData && parsedNew.hashData &&
                    parsedOld.getUrl() !== parsedNew.getUrl()) {
                    if (parsedOld.hashData.version !== 3 && !parsedOld.hashData.key) {
                        oldHref = newHref;
                        return;
                    }
                    // If different, reload
                    document.location.reload();
                    return;
                }
                if (parsedNew.hashData) { oldHref = newHref; }
            };
            // If you're in noDrive mode, check if an FS_hash is added and reload if that's the case
            if (rdyCfg.noDrive && !localStorage[Constants.fileHashKey]) {
                window.addEventListener('storage', function (e) {
                    if (e.key !== Constants.fileHashKey) { return; }
                    // New entry added to FS_hash: drive created in another tab, reload
                    var o = e.oldValue;
                    var n = e.newValue;
                    if (!o && n) {
                        postMessage('HAS_DRIVE', null, function(obj) {
                            // If we're still in noDrive mode, reload
                            if (!obj.state) {
                                LocalStore.loginReload();
                            }
                            // Otherwise this worker is connected, nothing to do
                        });
                    }
                });
            }
            // Listen for login/logout in other tabs
            window.addEventListener('storage', function (e) {
                if (e.key !== Constants.blockHashKey) { return; }
                var o = e.oldValue;
                var n = e.newValue;
                if (!o && n) {
                    LocalStore.loginReload();
                } else if (o && !n) {
                    if (!common.CP_onAccountDeletion) { LocalStore.logout(); }
                } else if (o && n && o !== n) {
                    common.passwordUpdated = true;
                    window.location.reload();
                }
            });
            common.drive.onDeleted.reg(function () {
                common.CP_onAccountDeletion = true;
            });
            LocalStore.onLogout(function () {
                if (common.CP_onAccountDeletion) { return; }
                console.log('onLogout: disconnect');
                common.stopWorker();
            });
        }).nThen(function (waitFor) {
            if (common.migrateAnonDrive || sessionStorage.migrateAnonDrive) {
                common.mergeAnonDrive(waitFor());
            }
        }).nThen(function (waitFor) {
            if (AppConfig.afterLogin) {
                AppConfig.afterLogin(common, waitFor());
            }
        }).nThen(function () {
            // Last visit is used to warn you about missed events from your calendars
            localStorage.lastVisit = +new Date();
            setInterval(function () {
                // Bump last visit every minute
                localStorage.lastVisit = +new Date();
            }, 60000);
            f(void 0, env);
            if (typeof(window.onhashchange) === 'function') { window.onhashchange(); }
        });
    };

    }());

    return common;
});
