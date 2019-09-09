define([
    '/api/config',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-messaging.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/outer/local-store.js',
    '/common/outer/worker-channel.js',
    '/common/outer/login-block.js',

    '/customize/application_config.js',
    '/bower_components/nthen/index.js',
], function (Config, Messages, Util, Hash,
            Messaging, Constants, Feedback, LocalStore, Channel, Block,
            AppConfig, Nthen) {

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
        donateURL: 'https://accounts.cryptpad.fr/#/donate?on=' + origin,
        upgradeURL: 'https://accounts.cryptpad.fr/#/?on=' + origin,
        account: {},
    };

    // COMMON
    common.getLanguage = function () {
        return Messages._languageUsed;
    };
    common.setLanguage = function (l, cb) {
        var LS_LANG = "CRYPTPAD_LANG";
        localStorage.setItem(LS_LANG, l);
        cb();
    };

    common.makeNetwork = function (cb) {
        require([
            '/bower_components/netflux-websocket/netflux-client.js',
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

    // RESTRICTED
    // Settings only
    common.resetDrive = function (cb) {
        postMessage("RESET_DRIVE", null, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb();
        });
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
    common.getUserObject = function (cb) {
        postMessage("GET", [], function (obj) {
            cb(obj);
        });
    };
    common.getSharedFolder = function (id, cb) {
        postMessage("GET_SHARED_FOLDER", id, function (obj) {
            cb(obj);
        });
    };
    common.loadSharedFolder = function (id, data, cb) {
        postMessage("LOAD_SHARED_FOLDER", {
            id: id,
            data: data
        }, cb);
    };
    // Settings and ready
    common.mergeAnonDrive = function (cb) {
        var data = {
            anonHash: LocalStore.getFSHash()
        };
        postMessage("MIGRATE_ANON_DRIVE", data, cb);
    };
    // Settings
    common.deleteAccount = function (cb) {
        postMessage("DELETE_ACCOUNT", null, function (obj) {
            if (obj.state) {
                Feedback.send('DELETE_ACCOUNT_AUTOMATIC');
            } else {
                Feedback.send('DELETE_ACCOUNT_MANUAL');
            }
            cb(obj);
        });
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
            key:['drive'],
            value: data.drive
        }, function (obj) {
            cb(obj);
        }, {
            timeout: 5 * 60 * 1000
        });
    };
    common.addSharedFolder = function (secret, cb) {
        postMessage("ADD_SHARED_FOLDER", {
            path: ['root'],
            folderData: {
                href: '/drive/#' + Hash.getEditHashFromKeys(secret),
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
    // Profile
    common.getProfileEditUrl = function (cb) {
        postMessage("GET", ['profile', 'edit'], function (obj) {
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
        postMessage("GET", ['todo'], function (obj) {
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
    common.pinPads = function (pads, cb) {
        postMessage("PIN_PADS", pads, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.unpinPads = function (pads, cb) {
        postMessage("UNPIN_PADS", pads, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj.hash);
        });
    };

    common.getPinnedUsage = function (cb) {
        postMessage("GET_PINNED_USAGE", null, function (obj) {
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

    common.getPinLimit = function (cb) {
        postMessage("GET_PIN_LIMIT", null, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.limit, obj.plan, obj.note);
        });
    };

    common.isOverPinLimit = function (cb) {
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
            common.getPinLimit(andThen);
        };
        common.getPinnedUsage(todo);
    };

    common.clearOwnedChannel = function (channel, cb) {
        postMessage("CLEAR_OWNED_CHANNEL", channel, cb);
    };
    // "force" allows you to delete your drive ID
    common.removeOwnedChannel = function (channel, cb, force) {
        postMessage("REMOVE_OWNED_CHANNEL", {
            channel: channel,
            force: force
        }, cb);
    };

    common.getDeletedPads = function (data, cb) {
        postMessage("GET_DELETED_PADS", data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadComplete = function (id, owned, cb) {
        postMessage("UPLOAD_COMPLETE", {id: id, owned: owned}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadStatus = function (size, cb) {
        postMessage("UPLOAD_STATUS", {size: size}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadCancel = function (size, cb) {
        postMessage("UPLOAD_CANCEL", {size: size}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.uploadChunk = function (data, cb) {
        postMessage("UPLOAD_CHUNK", {chunk: data}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    common.writeLoginBlock = function (data, cb) {
        postMessage('WRITE_LOGIN_BLOCK', data, function (obj) {
            cb(obj);
        });
    };

    common.removeLoginBlock = function (data, cb) {
        postMessage('REMOVE_LOGIN_BLOCK', data, function (obj) {
            cb(obj);
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

    common.getFileSize = function (href, password, cb) {
        postMessage("GET_FILE_SIZE", {href: href, password: password}, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(undefined, obj.size);
        });
    };

    common.getMultipleFileSize = function (files, cb) {
        postMessage("GET_MULTIPLE_FILE_SIZE", {files:files}, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            cb(undefined, obj.size);
        });
    };

    common.isNewChannel = function (href, password, cb) {
        postMessage('IS_NEW_CHANNEL', {href: href, password: password}, function (obj) {
            if (obj.error) { return void cb(obj.error); }
            if (!obj) { return void cb('INVALID_RESPONSE'); }
            cb(undefined, obj.isNew);
        });
    };

    // Store



    common.getMetadata = function (cb) {
        postMessage("GET_METADATA", null, function (obj) {
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
        href = Hash.getRelativeHref(href || window.location.href);
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
        href = Hash.getRelativeHref(href || window.location.href);
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
        var p = Hash.parsePadUrl(window.location.href);
        if (!p.type) { return; }
        // PPP: password for the new template?
        var hash = Hash.createRandomHash(p.type);
        var href = '/' + p.type + '/#' + hash;

        var optsPut = {};
        if (p.type === 'poll') { optsPut.initialState = '{}'; }
        // PPP: add password as cryptput option
        Cryptput(hash, data.toSave, function (e) {
            if (e) { throw new Error(e); }
            postMessage("ADD_PAD", {
                href: href,
                title: data.title,
                path: ['template']
            }, function (obj) {
                if (obj && obj.error) { return void cb(obj.error); }
                cb();
            });
        }, optsPut);
    };

    common.isTemplate = function (href, cb) {
        var rhref = Hash.getRelativeHref(href);
        common.listTemplates(null, function (err, templates) {
            cb(void 0, templates.some(function (t) {
                return t.href === rhref;
            }));
        });
    };

    common.useTemplate = function (data, Crypt, cb, optsPut) {
        // opts is used to overrides options for chainpad-netflux in cryptput
        // it allows us to add owners and expiration time if it is a new file
        var href = data.href;

        var parsed = Hash.parsePadUrl(href);
        var parsed2 = Hash.parsePadUrl(window.location.href);
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
        }).nThen(function () {
            Crypt.get(parsed.hash, function (err, val) {
                if (err) { throw new Error(err); }
                try {
                    // Try to fix the title before importing the template
                    var parsed = JSON.parse(val);
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
                        meta.title = "";
                        delete meta.users;
                        delete meta.chat2;
                        delete meta.chat;
                        delete meta.cursor;
                        if (data.chat) { meta.chat2 = data.chat; }
                        if (data.cursor) { meta.cursor = data.cursor; }
                    }
                    val = JSON.stringify(parsed);
                } catch (e) {
                    console.log("Can't fix template title", e);
                }
                Crypt.put(parsed2.hash, val, cb, optsPut);
            }, optsGet);
        });
    };

    common.useFile = function (Crypt, cb, optsPut) {
        var fileHost = Config.fileHost || window.location.origin;
        var data = common.fromFileData;
        var parsed = Hash.parsePadUrl(data.href);
        var parsed2 = Hash.parsePadUrl(window.location.href);
        var hash = parsed.hash;
        var name = data.title;
        var secret = Hash.getSecrets('file', hash, data.password);
        var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
        var key = secret.keys && secret.keys.cryptKey;

        var u8;
        var res;
        var mode;
        var val;
        Nthen(function(waitFor) {
            Util.fetch(src, waitFor(function (err, _u8) {
                if (err) { return void waitFor.abort(); }
                u8 = _u8;
            }));
        }).nThen(function (waitFor) {
            require(["/file/file-crypto.js"], waitFor(function (FileCrypto) {
                FileCrypto.decrypt(u8, key, waitFor(function (err, _res) {
                    if (err || !_res.content) { return void waitFor.abort(); }
                    res = _res;
                }));
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
        }).nThen(function () {
            Crypt.put(parsed2.hash, JSON.stringify(val), cb, optsPut);
        });

    };

    // Forget button
    common.moveToTrash = function (cb, href) {
        href = href || window.location.href;
        postMessage("MOVE_TO_TRASH", { href: href }, cb);
    };

    // When opening a new pad or renaming it, store the new title
    common.setPadTitle = function (data, cb) {
        if (!data || typeof (data) !== "object") { return cb ('Data is not an object'); }

        var href = data.href || window.location.href;
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return cb ('Invalid hash'); }
        data.href = parsed.getUrl({present: parsed.present});

        if (typeof (data.title) !== "string") { return cb('Missing title'); }

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
            cb();
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

    // Onlyoffice
    var onlyoffice = common.onlyoffice = {};
    onlyoffice.execCommand = function (data, cb) {
        postMessage("OO_COMMAND", data, cb);
    };
    onlyoffice.onEvent = Util.mkEvent();

    // Messenger
    var messenger = common.messenger = {};
    messenger.execCommand = function (data, cb) {
        postMessage("CHAT_COMMAND", data, cb);
    };
    messenger.onEvent = Util.mkEvent();

    // Cursor
    var cursor = common.cursor = {};
    cursor.execCommand = function (data, cb) {
        postMessage("CURSOR_COMMAND", data, cb);
    };
    cursor.onEvent = Util.mkEvent();

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
        postMessage("SEND_PAD_MSG", data, cb);
    };
    pad.onReadyEvent = Util.mkEvent();
    pad.onMessageEvent = Util.mkEvent();
    pad.onJoinEvent = Util.mkEvent();
    pad.onLeaveEvent = Util.mkEvent();
    pad.onDisconnectEvent = Util.mkEvent();
    pad.onConnectEvent = Util.mkEvent();
    pad.onErrorEvent = Util.mkEvent();
    pad.onMetadataEvent = Util.mkEvent();

    pad.requestAccess = function (data, cb) {
        postMessage("REQUEST_PAD_ACCESS", data, cb);
    };
    pad.giveAccess = function (data, cb) {
        postMessage("GIVE_PAD_ACCESS", data, cb);
    };

    common.setPadMetadata = function (data, cb) {
        postMessage('SET_PAD_METADATA', data, cb);
    };
    common.getPadMetadata = function (data, cb) {
        postMessage('GET_PAD_METADATA', data, cb);
    };

    common.changePadPassword = function (Crypt, Crypto, href, newPassword, edPublic, cb) {
        if (!href) { return void cb({ error: 'EINVAL_HREF' }); }
        var parsed = Hash.parsePadUrl(href);
        if (!parsed.hash) { return void cb({ error: 'EINVAL_HREF' }); }

        var warning = false;
        var newHash, newRoHref;
        var oldChannel;
        var oldSecret;
        var oldMetadata;
        var newSecret;

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

        var optsGet = {};
        var optsPut = {
            password: newPassword,
            metadata: {}
        };


        Nthen(function (waitFor) {
            if (parsed.hashData && parsed.hashData.password) {
                common.getPadAttribute('password', waitFor(function (err, password) {
                    optsGet.password = password;
                }), href);
            }
        }).nThen(function (waitFor) {
            oldSecret = Hash.getSecrets(parsed.type, parsed.hash, optsGet.password);
            oldChannel = oldSecret.channel;
            common.getPadMetadata({channel: oldChannel}, waitFor(function (metadata) {
                oldMetadata = metadata;
            }));
        }).nThen(function (waitFor) {
            // Get owners, mailbox and expiration time

            var owners = oldMetadata.owners;
            if (!Array.isArray(owners) || owners.indexOf(edPublic) === -1) {
                // We're not an owner, we shouldn't be able to change the password!
                waitFor.abort();
                return void cb({ error: 'EPERM' });
            }
            optsPut.metadata.owners = owners;

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
                        console.log(mailbox[ed]);
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
            optsPut.metadata.expire = (expire - (+new Date())) / 1000; // Lifetime in seconds
        }).nThen(function (waitFor) {
            Crypt.get(parsed.hash, waitFor(function (err, val) {
                if (err) {
                    waitFor.abort();
                    return void cb({ error: err });
                }
                Crypt.put(newHash, val, waitFor(function (err) {
                    if (err) {
                        waitFor.abort();
                        return void cb({ error: err });
                    }
                }), optsPut);
            }), optsGet);
        }).nThen(function (waitFor) {
            pad.leavePad({
                channel: oldChannel
            }, waitFor());
            pad.onDisconnectEvent.fire(true);
        }).nThen(function (waitFor) {
            common.removeOwnedChannel(oldChannel, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
                }
            }));
            common.unpinPads([oldChannel], waitFor());
            common.pinPads([newSecret.channel], waitFor());
        }).nThen(function (waitFor) {
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
        }).nThen(function () {
            cb({
                warning: warning,
                hash: newHash,
                href: newHref,
                roHref: newRoHref
            });
        });
    };

    common.changeUserPassword = function (Crypt, edPublic, data, cb) {
        if (!edPublic) {
            return void cb({
                error: 'E_NOT_LOGGED_IN'
            });
        }
        var accountName = LocalStore.getAccountName();
        var hash = LocalStore.getUserHash();
        if (!hash) {
            return void cb({
                error: 'E_NOT_LOGGED_IN'
            });
        }

        var password = data.password; // To remove your old block
        var newPassword = data.newPassword; // To create your new block
        var secret = Hash.getSecrets('drive', hash);
        var newHash, newHref, newSecret, blockKeys;
        var oldIsOwned = false;

        var blockHash = LocalStore.getBlockHash();
        var oldBlockKeys;

        var Cred, Block, Login;
        Nthen(function (waitFor) {
            require([
                '/customize/credential.js',
                '/common/outer/login-block.js',
                '/customize/login.js'
            ], waitFor(function (_Cred, _Block, _Login) {
                Cred = _Cred;
                Block = _Block;
                Login = _Login;
            }));
        }).nThen(function (waitFor) {
            // confirm that the provided password is correct
            Cred.deriveFromPassphrase(accountName, password, Login.requiredBytes, waitFor(function (bytes) {
                var allocated = Login.allocateBytes(bytes);
                oldBlockKeys = allocated.blockKeys;
                if (blockHash) {
                    if (blockHash !== allocated.blockHash) {
                        console.log("provided password did not yield the correct blockHash");
                        // incorrect password probably
                        waitFor.abort();
                        return void cb({
                            error: 'INVALID_PASSWORD',
                        });
                    }
                    // the user has already created a block, so you should compare against that
                } else {
                    // otherwise they're a legacy user, and we should check against the User_hash
                    if (hash !== allocated.userHash) {
                        console.log("provided password did not yield the correct userHash");
                        waitFor.abort();
                        return void cb({
                            error: 'INVALID_PASSWORD',
                        });
                    }
                }
            }));
        }).nThen(function (waitFor) {
            // Check if our drive is already owned
            console.log("checking if old drive is owned");
            common.anonRpcMsg('GET_METADATA', secret.channel, waitFor(function (err, obj) {
                if (err || obj.error) { return; }
                if (obj.owners && Array.isArray(obj.owners) &&
                    obj.owners.indexOf(edPublic) !== -1) {
                    oldIsOwned = true;
                }
            }));
        }).nThen(function (waitFor) {
            // Create a new user hash
            // Get the current content, store it in the new user file
            // and make sure the new user drive is owned
            newHash = Hash.createRandomHash('drive');
            newHref = '/drive/#' + newHash;
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
            // Drive content copied: get the new block location
            console.log("deriving new credentials from passphrase");
            Cred.deriveFromPassphrase(accountName, newPassword, Login.requiredBytes, waitFor(function (bytes) {
                var allocated = Login.allocateBytes(bytes);
                blockKeys = allocated.blockKeys;
            }));
        }).nThen(function (waitFor) {
            // Write the new login block
            var temp = {
                User_name: accountName,
                User_hash: newHash,
                edPublic: edPublic,
            };

            var content = Block.serialize(JSON.stringify(temp), blockKeys);

            console.log("writing new login block");
            common.writeLoginBlock(content, waitFor(function (obj) {
                if (obj && obj.error) {
                    waitFor.abort();
                    return void cb(obj);
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
            if (blockHash) {
                console.log('removing old login block');
                var removeData = Block.remove(oldBlockKeys);
                common.removeLoginBlock(removeData, waitFor(function (obj) {
                    if (obj && obj.error) { return void console.error(obj.error); }
                }));
            }
        }).nThen(function (waitFor) {
            if (oldIsOwned) {
                console.log('removing old drive');
                common.removeOwnedChannel(secret.channel, waitFor(function (obj) {
                    if (obj && obj.error) {
                        // Deal with it as if it was not owned
                        oldIsOwned = false;
                        return;
                    }
                    common.logoutFromAll(waitFor(function () {
                        postMessage("DISCONNECT");
                    }));
                }), true);
            }
        }).nThen(function (waitFor) {
            if (!oldIsOwned) {
                console.error('deprecating old drive.');
                postMessage("SET", {
                    key: [Constants.deprecatedKey],
                    value: true
                }, waitFor(function (obj) {
                    if (obj && obj.error) {
                        console.error(obj.error);
                    }
                    common.logoutFromAll(waitFor(function () {
                        postMessage("DISCONNECT");
                    }));
                }));
            }
        }).nThen(function () {
            // We have the new drive, with the new login block
            var feedbackKey = (password === newPassword)?
                'OWNED_DRIVE_MIGRATION': 'PASSWORD_CHANGED';

            Feedback.send(feedbackKey, undefined, function () {
                window.location.reload();
            });
        });
    };

    // Loading events
    common.loading = {};
    common.loading.onDriveEvent = Util.mkEvent();

    // (Auto)store pads
    common.autoStore = {};
    common.autoStore.onStoreRequest = Util.mkEvent();

    common.getFullHistory = function (data, cb) {
        postMessage("GET_FULL_HISTORY", data, cb, {timeout: 180000});
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
        var parsed = Hash.parsePadUrl(window.location.href);
        if (!parsed.type || !parsed.hashData) { return void cb('E_INVALID_HREF'); }
        hashes = Hash.getHashes(secret);

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
            href: window.location.href,
            channel: secret.channel,
            password: secret.password
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
        var arr = /ver=([0-9.]+)(-[0-9]*)?/.exec(urlArgs);
        var ver = arr[1];
        if (!ver) { return; }
        var verArr = ver.split('.');
        verArr[2] = 0;
        if (verArr.length !== 3) { return; }
        var stored = currentVersion || '0.0.0';
        var storedArr = stored.split('.');
        storedArr[2] = 0;
        var shouldUpdate = parseInt(verArr[0]) > parseInt(storedArr[0]) ||
                           (parseInt(verArr[0]) === parseInt(storedArr[0]) &&
                            parseInt(verArr[1]) > parseInt(storedArr[1]));
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
        LocalStore.logout();

        // redirect them to log in, and come back when they're done.
        sessionStorage.redirectTo = window.location.href;
        window.location.href = '/login/';
    };

    common.startAccountDeletion = function (data, cb) {
        // Logout other tabs
        LocalStore.logout(null, true);
        cb();
    };

    var onPing = function (data, cb) {
        cb();
    };

    var timeout = false;
    common.onTimeoutEvent = Util.mkEvent();
    var onTimeout = function () {
        timeout = true;
        common.onNetworkDisconnect.fire();
        common.padRpc.onDisconnectEvent.fire();
        common.onTimeoutEvent.fire();
    };

    var queries = {
        PING: onPing,
        TIMEOUT: onTimeout,
        REQUEST_LOGIN: requestLogin,
        UPDATE_METADATA: common.changeMetadata,
        UPDATE_TOKEN: function (data) {
            var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
            if (localToken !== data.token) { requestLogin(); }
        },
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
        // Chat
        CHAT_EVENT: common.messenger.onEvent.fire,
        // Cursor
        CURSOR_EVENT: common.cursor.onEvent.fire,
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
        PAD_CONNECT: common.padRpc.onConnectEvent.fire,
        PAD_ERROR: common.padRpc.onErrorEvent.fire,
        PAD_METADATA: common.padRpc.onMetadataEvent.fire,
        // Drive
        DRIVE_LOG: common.drive.onLog.fire,
        DRIVE_CHANGE: common.drive.onChange.fire,
        DRIVE_REMOVE: common.drive.onRemove.fire,
        // Account deletion
        DELETE_ACCOUNT: common.startAccountDeletion,
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
        if (initialized) {
            return void setTimeout(function () { f(void 0, env); });
        }

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

        var userHash;

        Nthen(function (waitFor) {
            if (AppConfig.beforeLogin) {
                AppConfig.beforeLogin(LocalStore.isLoggedIn(), waitFor());
            }

        }).nThen(function (waitFor) {
            var blockHash = LocalStore.getBlockHash();
            if (blockHash) {
                console.log(blockHash);
                var parsed = Block.parseBlockHash(blockHash);

                if (typeof(parsed) !== 'object') {
                    console.error("Failed to parse blockHash");
                    console.log(parsed);
                    return;
                } else {
                    //console.log(parsed);
                }
                Util.fetch(parsed.href, waitFor(function (err, arraybuffer) {
                    if (err) { return void console.log(err); }

                    // use the results to load your user hash and
                    // put your userhash into localStorage
                    try {
                        var block_info = Block.decrypt(arraybuffer, parsed.keys);
                        if (!block_info) {
                            console.error("Failed to decrypt !");
                            return;
                        }
                        userHash = block_info[Constants.userHashKey];
                        if (!userHash || userHash !== LocalStore.getUserHash()) {
                            return void requestLogin();
                        }
                    } catch (e) {
                        console.error(e);
                        return void console.error("failed to decrypt or decode block content");
                    }
                }));
            }
        }).nThen(function (waitFor) {
            var cfg = {
                init: true,
                userHash: userHash || LocalStore.getUserHash(),
                anonHash: LocalStore.getFSHash(),
                localToken: tryParsing(localStorage.getItem(Constants.tokenKey)), // TODO move this to LocalStore ?
                language: common.getLanguage(),
                messenger: rdyCfg.messenger, // Boolean
                driveEvents: rdyCfg.driveEvents // Boolean
            };
            // if a pad is created from a file
            if (sessionStorage[Constants.newPadFileData]) {
                common.fromFileData = JSON.parse(sessionStorage[Constants.newPadFileData]);
                delete sessionStorage[Constants.newPadFileData];
            }

            if (sessionStorage[Constants.newPadPathKey]) {
                common.initialPath = sessionStorage[Constants.newPadPathKey];
                delete sessionStorage[Constants.newPadPathKey];
            }

            var channelIsReady = waitFor();

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

                    window.addEventListener('beforeunload', function () {
                        postMsg('CLOSE');
                    });
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
                            msgEv.fire({data: data});
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
                        }

                        if (data.anonHash && !cfg.userHash) { LocalStore.setFSHash(data.anonHash); }

                        /*if (cfg.userHash && sessionStorage) {
                            // copy User_hash into sessionStorage because cross-domain iframes
                            // on safari replaces localStorage with sessionStorage or something
                            sessionStorage.setItem(Constants.userHashKey, cfg.userHash);
                        }*/

                        if (cfg.userHash) {
                            var localToken = tryParsing(localStorage.getItem(Constants.tokenKey));
                            if (localToken === null) {
                                // if that number hasn't been set to localStorage, do so.
                                localStorage.setItem(Constants.tokenKey, data[Constants.tokenKey]);
                            }
                        }

                        initFeedback(data.feedback);
                        initialized = true;
                        channelIsReady();
                    });

                }, false);
            });

        }).nThen(function () {
            // Load the new pad when the hash has changed
            var oldHref  = document.location.href;
            window.onhashchange = function (ev) {
                if (ev && ev.reset) { oldHref = document.location.href; return; }
                var newHref = document.location.href;

                // Compare the URLs without /embed and /present
                var parsedOld = Hash.parsePadUrl(oldHref);
                var parsedNew = Hash.parsePadUrl(newHref);
                if (parsedOld.hashData && parsedNew.hashData &&
                    parsedOld.getUrl() !== parsedNew.getUrl()) {
                    if (!parsedOld.hashData.key) { oldHref = newHref; return; }
                    // If different, reload
                    document.location.reload();
                    return;
                }
                if (parsedNew.hashData) { oldHref = newHref; }
            };
            // Listen for login/logout in other tabs
            window.addEventListener('storage', function (e) {
                if (e.key !== Constants.userHashKey) { return; }
                var o = e.oldValue;
                var n = e.newValue;
                if (!o && n) {
                    document.location.reload();
                } else if (o && !n) {
                    LocalStore.logout();
                }
            });
            LocalStore.onLogout(function () {
                console.log('onLogout: disconnect');
                postMessage("DISCONNECT");
            });
        }).nThen(function (waitFor) {
            if (sessionStorage.createReadme) {
                var data = {
                    driveReadme: Messages.driveReadme,
                    driveReadmeTitle: Messages.driveReadmeTitle,
                };
                postMessage("CREATE_README", data, waitFor(function (e) {
                    if (e && e.error) { return void console.error(e.error); }
                    delete sessionStorage.createReadme;
                }));
            }
        }).nThen(function (waitFor) {
            if (sessionStorage.migrateAnonDrive) {
                common.mergeAnonDrive(waitFor(function() {
                    delete sessionStorage.migrateAnonDrive;
                }));
            }
        }).nThen(function (waitFor) {
            if (AppConfig.afterLogin) {
                AppConfig.afterLogin(common, waitFor());
            }
        }).nThen(function () {
            updateLocalVersion();
            f(void 0, env);
            if (typeof(window.onhashchange) === 'function') { window.onhashchange(); }
        });
    };

    }());

    return common;
});
