define([
    'json.sortify',
    '/common/userObject.js',
    '/common/migrate-user-object.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/common-realtime.js',
    '/common/common-messaging.js',
    '/common/common-messenger.js',
    '/common/outer/chainpad-netflux-worker.js',
    '/common/outer/network-config.js',
    '/customize/application_config.js',

    '/bower_components/chainpad-crypto/crypto.js?v=0.1.5',
    '/bower_components/chainpad/chainpad.dist.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/nthen/index.js',
    '/bower_components/saferphore/index.js',
], function (Sortify, UserObject, Migrate, Hash, Util, Constants, Feedback, Realtime, Messaging, Messenger,
             CpNfWorker, NetConfig, AppConfig,
             Crypto, ChainPad, Listmap, nThen, Saferphore) {
    var Store = {};

    var create = function () {
        var postMessage = function () {};
        var broadcast = function () {};
        var sendDriveEvent = function () {};

        var storeHash;

        var store = window.CryptPad_AsyncStore = {};


        var onSync = function (cb) {
            Realtime.whenRealtimeSyncs(store.realtime, cb);
        };


        Store.get = function (clientId, key, cb) {
            cb(Util.find(store.proxy, key));
        };
        Store.set = function (clientId, data, cb) {
            var path = data.key.slice();
            var key = path.pop();
            var obj = Util.find(store.proxy, path);
            if (!obj || typeof(obj) !== "object") { return void cb({error: 'INVALID_PATH'}); }
            if (typeof data.value === "undefined") {
                delete obj[key];
            } else {
                obj[key] = data.value;
            }
            broadcast([clientId], "UPDATE_METADATA");
            onSync(cb);
        };

        Store.hasSigningKeys = function () {
            if (!store.proxy) { return; }
            return typeof(store.proxy.edPrivate) === 'string' &&
                   typeof(store.proxy.edPublic) === 'string';
        };

        Store.hasCurveKeys = function () {
            if (!store.proxy) { return; }
            return typeof(store.proxy.curvePrivate) === 'string' &&
                   typeof(store.proxy.curvePublic) === 'string';
        };

        var getUserChannelList = function () {
            // start with your userHash...
            var userHash = storeHash;
            if (!userHash) { return null; }

            // No password for drive
            var secret = Hash.getSecrets('drive', userHash);
            var userChannel = secret.channel;
            if (!userChannel) { return null; }

            // Get the list of pads' channel ID in your drive
            // This list is filtered so that it doesn't include pad owned by other users (you should
            // not pin these pads)
            var files = store.userObject.getFiles([store.userObject.FILES_DATA]);
            var edPublic = store.proxy.edPublic;
            var list = files.map(function (id) {
                    var d = store.userObject.getFileData(id);
                    if (d.owners && d.owners.length && edPublic &&
                        d.owners.indexOf(edPublic) === -1) { return; }
                    return d.channel;
                })
                .filter(function (x) { return x; });

            // Get the avatar
            var profile = store.proxy.profile;
            if (profile) {
                var profileChan = profile.edit ? Hash.hrefToHexChannelId('/profile/#' + profile.edit, null) : null;
                if (profileChan) { list.push(profileChan); }
                var avatarChan = profile.avatar ? Hash.hrefToHexChannelId(profile.avatar, null) : null;
                if (avatarChan) { list.push(avatarChan); }
            }

            if (store.proxy.friends) {
                var fList = Messaging.getFriendChannelsList(store.proxy);
                list = list.concat(fList);
            }

            list.push(userChannel);
            list.sort();

            return list;
        };

        var getExpirableChannelList = function () {
            var list = [];
            store.userObject.getFiles([store.userObject.FILES_DATA]).forEach(function (id) {
                var data = store.userObject.getFileData(id);
                var edPublic = store.proxy.edPublic;

                // Push channels owned by someone else or channel that should have expired
                // because of the expiration time
                if ((data.owners && data.owners.length && data.owners.indexOf(edPublic) === -1) ||
                        (data.expire && data.expire < (+new Date()))) {
                    list.push(data.channel);
                }
            });
            return list;
        };

        var getCanonicalChannelList = function (expirable) {
            var list = expirable ? getExpirableChannelList() : getUserChannelList();
            return Util.deduplicateString(list).sort();
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// RPC //////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        Store.pinPads = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            if (typeof(cb) !== 'function') {
                console.error('expected a callback');
            }

            store.rpc.pin(data, function (e, hash) {
                if (e) { return void cb({error: e}); }
                cb({hash: hash});
            });
        };

        Store.unpinPads = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            store.rpc.unpin(data, function (e, hash) {
                if (e) { return void cb({error: e}); }
                cb({hash: hash});
            });
        };

        var account = {};

        Store.getPinnedUsage = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            store.rpc.getFileListSize(function (err, bytes) {
                if (typeof(bytes) === 'number') {
                    account.usage = bytes;
                }
                cb({bytes: bytes});
            });
        };

        // Update for all users from accounts and return current user limits
        Store.updatePinLimit = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.rpc.updatePinLimits(function (e, limit, plan, note) {
                if (e) { return void cb({error: e}); }
                account.limit = limit;
                account.plan = plan;
                account.note = note;
                cb(account);
            });
        };
        // Get current user limits
        Store.getPinLimit = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var ALWAYS_REVALIDATE = true;
            if (ALWAYS_REVALIDATE || typeof(account.limit) !== 'number' ||
                typeof(account.plan) !== 'string' ||
                typeof(account.note) !== 'string') {
                return void store.rpc.getLimit(function (e, limit, plan, note) {
                    if (e) { return void cb({error: e}); }
                    account.limit = limit;
                    account.plan = plan;
                    account.note = note;
                    cb(account);
                });
            }
            cb(account);
        };

        Store.clearOwnedChannel = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.rpc.clearOwnedChannel(data, function (err) {
                cb({error:err});
            });
        };

        Store.removeOwnedChannel = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.rpc.removeOwnedChannel(data, function (err) {
                cb({error:err});
            });
        };

        var arePinsSynced = function (cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var list = getCanonicalChannelList(false);
            var local = Hash.hashChannelList(list);
            store.rpc.getServerHash(function (e, hash) {
                if (e) { return void cb(e); }
                cb(null, hash === local);
            });
        };

        var resetPins = function (cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }

            var list = getCanonicalChannelList(false);
            store.rpc.reset(list, function (e, hash) {
                if (e) { return void cb(e); }
                cb(null, hash);
            });
        };

        Store.uploadComplete = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            if (data.owned) {
                // Owned file
                store.rpc.ownedUploadComplete(data.id, function (err, res) {
                    if (err) { return void cb({error:err}); }
                    cb(res);
                });
                return;
            }
            // Normal upload
            store.rpc.uploadComplete(data.id, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadStatus = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.rpc.uploadStatus(data.size, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadCancel = function (clientId, data, cb) {
            if (!store.rpc) { return void cb({error: 'RPC_NOT_READY'}); }
            store.rpc.uploadCancel(data.size, function (err, res) {
                if (err) { return void cb({error:err}); }
                cb(res);
            });
        };

        Store.uploadChunk = function (clientId, data, cb) {
            store.rpc.send.unauthenticated('UPLOAD', data.chunk, function (e, msg) {
                cb({
                    error: e,
                    msg: msg
                });
            });
        };

        Store.writeLoginBlock = function (clientId, data, cb) {
            store.rpc.writeLoginBlock(data, function (e, res) {
                cb({
                    error: e,
                    data: res
                });
            });
        };

        Store.initRpc = function (clientId, data, cb) {
            if (store.rpc) { return void cb(account); }
            require(['/common/pinpad.js'], function (Pinpad) {
                Pinpad.create(store.network, store.proxy, function (e, call) {
                    if (e) { return void cb({error: e}); }

                    store.rpc = call;

                    Store.getPinLimit(null, null, function (obj) {
                        if (obj.error) { console.error(obj.error); }
                        account.limit = obj.limit;
                        account.plan = obj.plan;
                        account.note = obj.note;
                        cb(obj);
                    });

                    arePinsSynced(function (err, yes) {
                        if (!yes) {
                            resetPins(function (err) {
                                if (err) { return console.error(err); }
                                console.log('RESET DONE');
                            });
                        }
                    });
                });
            });
        };

        //////////////////////////////////////////////////////////////////
        ////////////////// ANON RPC //////////////////////////////////////
        //////////////////////////////////////////////////////////////////
        Store.anonRpcMsg = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            store.anon_rpc.send(data.msg, data.data, function (err, res) {
                if (err) { return void cb({error: err}); }
                cb(res);
            });
        };

        Store.getFileSize = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }

            var channelId = Hash.hrefToHexChannelId(data.href, data.password);
            store.anon_rpc.send("GET_FILE_SIZE", channelId, function (e, response) {
                if (e) { return void cb({error: e}); }
                if (response && response.length && typeof(response[0]) === 'number') {
                    return void cb({size: response[0]});
                } else {
                    cb({error: 'INVALID_RESPONSE'});
                }
            });
        };

        Store.isNewChannel = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            var channelId = Hash.hrefToHexChannelId(data.href, data.password);
            store.anon_rpc.send("IS_NEW_CHANNEL", channelId, function (e, response) {
                if (e) { return void cb({error: e}); }
                if (response && response.length && typeof(response[0]) === 'boolean') {
                    return void cb({
                        isNew: response[0]
                    });
                } else {
                    cb({error: 'INVALID_RESPONSE'});
                }
            });
        };

        Store.getMultipleFileSize = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            if (!Array.isArray(data.files)) {
                return void cb({error: 'INVALID_FILE_LIST'});
            }

            store.anon_rpc.send('GET_MULTIPLE_FILE_SIZE', data.files, function (e, res) {
                if (e) { return void cb({error: e}); }
                if (res && res.length && typeof(res[0]) === 'object') {
                    cb({size: res[0]});
                } else {
                    cb({error: 'UNEXPECTED_RESPONSE'});
                }
            });
        };

        Store.getDeletedPads = function (clientId, data, cb) {
            if (!store.anon_rpc) { return void cb({error: 'ANON_RPC_NOT_READY'}); }
            var list = getCanonicalChannelList(true);
            if (!Array.isArray(list)) {
                return void cb({error: 'INVALID_FILE_LIST'});
            }

            store.anon_rpc.send('GET_DELETED_PADS', list, function (e, res) {
                if (e) { return void cb({error: e}); }
                if (res && res.length && Array.isArray(res[0])) {
                    cb(res[0]);
                } else {
                    cb({error: 'UNEXPECTED_RESPONSE'});
                }
            });
        };

        Store.initAnonRpc = function (clientId, data, cb) {
            if (store.anon_rpc) { return void cb(); }
            require([
                '/common/rpc.js',
            ], function (Rpc) {
                Rpc.createAnonymous(store.network, function (e, call) {
                    if (e) { return void cb({error: e}); }
                    store.anon_rpc = call;
                    cb();
                });
            });
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// Store ////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        // Get the metadata for sframe-common-outer
        Store.getMetadata = function (clientId, data, cb) {
            var disableThumbnails = Util.find(store.proxy, ['settings', 'general', 'disableThumbnails']);
            var metadata = {
                // "user" is shared with everybody via the userlist
                user: {
                    name: store.proxy[Constants.displayNameKey] || "",
                    uid: store.proxy.uid,
                    avatar: Util.find(store.proxy, ['profile', 'avatar']),
                    profile: Util.find(store.proxy, ['profile', 'view']),
                    curvePublic: store.proxy.curvePublic,
                },
                // "priv" is not shared with other users but is needed by the apps
                priv: {
                    edPublic: store.proxy.edPublic,
                    friends: store.proxy.friends || {},
                    settings: store.proxy.settings,
                    thumbnails: disableThumbnails === false
                }
            };
            cb(JSON.parse(JSON.stringify(metadata)));
        };

        var makePad = function (href, title) {
            var now = +new Date();
            return {
                href: href,
                atime: now,
                ctime: now,
                title: title || Hash.getDefaultName(Hash.parsePadUrl(href)),
            };
        };

        Store.addPad = function (clientId, data, cb) {
            if (!data.href) { return void cb({error:'NO_HREF'}); }
            var pad = makePad(data.href, data.title);
            if (data.owners) { pad.owners = data.owners; }
            if (data.expire) { pad.expire = data.expire; }
            if (data.password) { pad.password = data.password; }
            if (data.channel) { pad.channel = data.channel; }
            store.userObject.pushData(pad, function (e, id) {
                if (e) { return void cb({error: "Error while adding a template:"+ e}); }
                var path = data.path || ['root'];
                store.userObject.add(id, path);
                sendDriveEvent('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                }, clientId);
                onSync(cb);
            });
        };

        var getOwnedPads = function () {
            var list = [];
            store.userObject.getFiles([store.userObject.FILES_DATA]).forEach(function (id) {
                var data = store.userObject.getFileData(id);
                var edPublic = store.proxy.edPublic;

                // Push channels owned by someone else or channel that should have expired
                // because of the expiration time
                if (data.owners && data.owners.length === 1 && data.owners.indexOf(edPublic) !== -1) {
                    list.push(data.channel);
                }
            });
            if (store.proxy.todo) {
                // No password for todo
                list.push(Hash.hrefToHexChannelId('/todo/#' + store.proxy.todo, null));
            }
            if (store.proxy.profile && store.proxy.profile.edit) {
                // No password for profile
                list.push(Hash.hrefToHexChannelId('/profile/#' + store.proxy.profile.edit, null));
            }
            return list;
        };
        var removeOwnedPads = function (waitFor) {
            // Delete owned pads
            var ownedPads = getOwnedPads();
            var sem = Saferphore.create(10);
            ownedPads.forEach(function (c) {
                var w = waitFor();
                sem.take(function (give) {
                    Store.removeOwnedChannel(null, c, give(function (obj) {
                        if (obj && obj.error) { console.error(obj.error); }
                        w();
                    }));
                });
            });
        };

        Store.deleteAccount = function (clientId, data, cb) {
            var edPublic = store.proxy.edPublic;
            // No password for drive
            var secret = Hash.getSecrets('drive', storeHash);
            Store.anonRpcMsg(clientId, {
                msg: 'GET_METADATA',
                data: secret.channel
            }, function (data) {
                var metadata = data[0];
                // Owned drive
                if (metadata && metadata.owners && metadata.owners.length === 1 &&
                    metadata.owners.indexOf(edPublic) !== -1) {
                    nThen(function (waitFor) {
                        var token = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                        store.proxy[Constants.tokenKey] = token;
                        postMessage(clientId, "DELETE_ACCOUNT", token, waitFor());
                    }).nThen(function (waitFor) {
                        removeOwnedPads(waitFor);
                    }).nThen(function (waitFor) {
                        // Delete Pin Store
                        store.rpc.removePins(waitFor(function (err) {
                            if (err) { console.error(err); }
                        }));
                    }).nThen(function (waitFor) {
                        // Delete Drive
                        Store.removeOwnedChannel(clientId, secret.channel, waitFor());
                    }).nThen(function () {
                        store.network.disconnect();
                        cb({
                            state: true
                        });
                    });
                    return;
                }

                // Not owned drive
                var toSign = {
                    intent: 'Please delete my account.'
                };
                toSign.drive = secret.channel;
                toSign.edPublic = edPublic;
                var signKey = Crypto.Nacl.util.decodeBase64(store.proxy.edPrivate);
                var proof = Crypto.Nacl.sign.detached(Crypto.Nacl.util.decodeUTF8(Sortify(toSign)), signKey);

                var check = Crypto.Nacl.sign.detached.verify(Crypto.Nacl.util.decodeUTF8(Sortify(toSign)),
                    proof,
                    Crypto.Nacl.util.decodeBase64(edPublic));

                if (!check) { console.error('signed message failed verification'); }

                var proofTxt = Crypto.Nacl.util.encodeBase64(proof);
                cb({
                    proof: proofTxt,
                    toSign: JSON.parse(Sortify(toSign))
                });
            });
        };

        /**
         * add a "What is CryptPad?" pad in the drive
         * data
         *   - driveReadme
         *   - driveReadmeTitle
         */
        Store.createReadme = function (clientId, data, cb) {
            require(['/common/cryptget.js'], function (Crypt) {
                var hash = Hash.createRandomHash('pad');
                Crypt.put(hash, data.driveReadme, function (e) {
                    if (e) {
                        return void cb({ error: "Error while creating the default pad:"+ e});
                    }
                    var href = '/pad/#' + hash;
                    var channel = Hash.hrefToHexChannelId(href, null);
                    var fileData = {
                        href: href,
                        channel: channel,
                        title: data.driveReadmeTitle,
                    };
                    Store.addPad(clientId, fileData, cb);
                });
            });
        };


        /**
         * Merge the anonymous drive into the user drive at registration
         * data
         *   - anonHash
         */
        Store.migrateAnonDrive = function (clientId, data, cb) {
            require(['/common/mergeDrive.js'], function (Merge) {
                var hash = data.anonHash;
                Merge.anonDriveIntoUser(store, hash, cb);
            });
        };

        var getAttributeObject = function (attr) {
            if (typeof attr === "string") {
                console.error('DEPRECATED: use setAttribute with an array, not a string');
                return {
                    path: ['settings'],
                    obj: store.proxy.settings,
                    key: attr
                };
            }
            if (!Array.isArray(attr)) { return void console.error("Attribute must be string or array"); }
            if (attr.length === 0) { return void console.error("Attribute can't be empty"); }
            var obj = store.proxy.settings;
            attr.forEach(function (el, i) {
                if (i === attr.length-1) { return; }
                if (!obj[el]) {
                    obj[el] = {};
                }
                else if (typeof obj[el] !== "object") { return void console.error("Wrong attribute"); }
                obj = obj[el];
            });
            return {
                path: ['settings'].concat(attr),
                obj: obj,
                key: attr[attr.length-1]
            };
        };

        // Set the display name (username) in the proxy
        Store.setDisplayName = function (clientId, value, cb) {
            store.proxy[Constants.displayNameKey] = value;
            broadcast([clientId], "UPDATE_METADATA");
            onSync(cb);
        };

        // Reset the drive part of the userObject (from settings)
        Store.resetDrive = function (clientId, data, cb) {
            nThen(function (waitFor) {
                removeOwnedPads(waitFor);
            }).nThen(function () {
                store.proxy.drive = store.fo.getStructure();
                sendDriveEvent('DRIVE_CHANGE', {
                    path: ['drive', 'filesData']
                }, clientId);
                onSync(cb);
            });
        };

        /**
         * Settings & pad attributes
         * data
         *   - href (String)
         *   - attr (Array)
         *   - value (String)
         */
        Store.setPadAttribute = function (clientId, data, cb) {
            store.userObject.setPadAttribute(data.href, data.attr, data.value, function () {
                sendDriveEvent('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                }, clientId);
                onSync(cb);
            });
        };
        Store.getPadAttribute = function (clientId, data, cb) {
            store.userObject.getPadAttribute(data.href, data.attr, function (err, val) {
                if (err) { return void cb({error: err}); }
                cb(val);
            });
        };
        Store.setAttribute = function (clientId, data, cb) {
            try {
                var object = getAttributeObject(data.attr);
                object.obj[object.key] = data.value;
            } catch (e) { return void cb({error: e}); }
            onSync(cb);
        };
        Store.getAttribute = function (clientId, data, cb) {
            var object;
            try {
                object = getAttributeObject(data.attr);
            } catch (e) { return void cb({error: e}); }
            cb(object.obj[object.key]);
        };

        // Tags
        Store.listAllTags = function (clientId, data, cb) {
            cb(store.userObject.getTagsList());
        };

        // Templates
        Store.getTemplates = function (clientId, data, cb) {
            var templateFiles = store.userObject.getFiles(['template']);
            var res = [];
            templateFiles.forEach(function (f) {
                var data = store.userObject.getFileData(f);
                res.push(JSON.parse(JSON.stringify(data)));
            });
            cb(res);
        };
        Store.incrementTemplateUse = function (clientId, href) {
            store.userObject.getPadAttribute(href, 'used', function (err, data) {
                // This is a not critical function, abort in case of error to make sure we won't
                // create any issue with the user object or the async store
                if (err) { return; }
                var used = typeof data === "number" ? ++data : 1;
                store.userObject.setPadAttribute(href, 'used', used);
            });
        };

        // Pads
        Store.moveToTrash = function (clientId, data, cb) {
            var href = Hash.getRelativeHref(data.href);
            store.userObject.forget(href);
            sendDriveEvent('DRIVE_CHANGE', {
                path: ['drive', UserObject.FILES_DATA]
            }, clientId);
            onSync(cb);
        };
        Store.setPadTitle = function (clientId, data, cb) {
            var title = data.title;
            var href = data.href;
            var channel = data.channel;
            var p = Hash.parsePadUrl(href);
            var h = p.hashData;

            if (AppConfig.disableAnonymousStore && !store.loggedIn) { return void cb(); }

            var channelData = Store.channels && Store.channels[channel];

            var owners;
            if (channelData && channelData.wc && channel === channelData.wc.id) {
                owners = channelData.data.owners || undefined;
            }

            var expire;
            if (channelData && channelData.wc && channel === channelData.wc.id) {
                expire = +channelData.data.expire || undefined;
            }

            var allPads = Util.find(store.proxy, ['drive', 'filesData']) || {};
            var isStronger;

            // If we don't find the new channel in our existing pads, we'll have to add the pads
            // to filesData
            var contains;

            // Update all pads that use the same channel but with a weaker hash
            // Edit > Edit (present) > View > View (present)
            for (var id in allPads) {
                var pad = allPads[id];
                if (!pad.href) { continue; }

                var p2 = Hash.parsePadUrl(pad.href);
                var h2 = p2.hashData;

                // Different types, proceed to the next one
                // No hash data: corrupted pad?
                if (p.type !== p2.type || !h2) { continue; }
                // Different channel: continue
                if (pad.channel !== channel) { continue; }

                var shouldUpdate = p.hash.replace(/\/$/, '') === p2.hash.replace(/\/$/, '');

                // If the hash is different but represents the same channel, check if weaker or stronger
                if (!shouldUpdate && h.version !== 0) {
                    // We had view & now we have edit, update
                    if (h2.mode === 'view' && h.mode === 'edit') { shouldUpdate = true; }
                    // Same mode and we had present URL, update
                    else if (h.mode === h2.mode && h2.present) { shouldUpdate = true; }
                    // If we're here it means we have a weaker URL:
                    // update the date but keep the existing hash
                    else {
                        pad.atime = +new Date();
                        contains = true;
                        continue;
                    }
                }

                if (shouldUpdate) {
                    contains = true;
                    pad.atime = +new Date();
                    pad.title = title;
                    if (owners || h.type !== "file") {
                        // OWNED_FILES
                        // Never remove owner for files
                        pad.owners = owners;
                    }
                    pad.expire = expire;

                    // If the href is different, it means we have a stronger one
                    if (href !== pad.href) { isStronger = true; }
                    pad.href = href;
                }
            }

            if (isStronger) {
                // If we have a stronger url, remove the possible weaker from the trash.
                // If all of the weaker ones were in the trash, add the stronger to ROOT
                store.userObject.restoreHref(href);
            }

            // Add the pad if it does not exist in our drive
            if (!contains) {
                Store.addPad(clientId, {
                    href: href,
                    channel: channel,
                    title: title,
                    owners: owners,
                    expire: expire,
                    password: data.password,
                    path: data.path
                }, cb);
                return;
            } else {
                sendDriveEvent('DRIVE_CHANGE', {
                    path: ['drive', UserObject.FILES_DATA]
                }, clientId);
            }
            onSync(cb);
        };

        // Filepicker app
        Store.getSecureFilesList = function (clientId, query, cb) {
            var list = {};
            var hashes = [];
            var types = query.types;
            var where = query.where;
            var filter = query.filter || {};
            var isFiltered = function (type, data) {
                var filtered;
                var fType = filter.fileType || [];
                if (type === 'file' && fType.length) {
                    if (!data.fileType) { return true; }
                    filtered = !fType.some(function (t) {
                        return data.fileType.indexOf(t) === 0;
                    });
                }
                return filtered;
            };
            store.userObject.getFiles(where).forEach(function (id) {
                var data = store.userObject.getFileData(id);
                var parsed = Hash.parsePadUrl(data.href);
                if ((!types || types.length === 0 || types.indexOf(parsed.type) !== -1) &&
                    hashes.indexOf(parsed.hash) === -1 &&
                    !isFiltered(parsed.type, data)) {
                    hashes.push(parsed.hash);
                    list[id] = data;
                }
            });
            cb(list);
        };
        Store.getPadData = function (clientId, id, cb) {
            cb(store.userObject.getFileData(id));
        };


        // Messaging (manage friends from the userlist)
        var getMessagingCfg = function (clientId) {
            return {
                proxy: store.proxy,
                realtime: store.realtime,
                network: store.network,
                updateMetadata: function () {
                    postMessage(clientId, "UPDATE_METADATA");
                },
                pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
                friendComplete: function (data) {
                    postMessage(clientId, "EV_FRIEND_COMPLETE", data);
                },
                friendRequest: function (data, cb) {
                    postMessage(clientId, "Q_FRIEND_REQUEST", data, cb);
                },
            };
        };
        Store.inviteFromUserlist = function (clientId, data, cb) {
            var messagingCfg = getMessagingCfg(clientId);
            Messaging.inviteFromUserlist(messagingCfg, data, cb);
        };
        Store.addDirectMessageHandlers = function (clientId, data) {
            var messagingCfg = getMessagingCfg(clientId);
            Messaging.addDirectMessageHandler(messagingCfg, data.href);
        };

        // Messenger

        // Get hashes for the share button
        Store.getStrongerHash = function (clientId, data, cb) {
            var allPads = Util.find(store.proxy, ['drive', 'filesData']) || {};

            // If we have a stronger version in drive, add it and add a redirect button
            var stronger = Hash.findStronger(data.href, data.channel, allPads);
            if (stronger) {
                var parsed2 = Hash.parsePadUrl(stronger.href);
                return void cb(parsed2.hash);
            }
            cb();
        };

        Store.messenger = {
            getFriendList: function (data, cb) {
                store.messenger.getFriendList(function (e, keys) {
                    cb({
                        error: e,
                        data: keys,
                    });
                });
            },
            getMyInfo: function (data, cb) {
                store.messenger.getMyInfo(function (e, info) {
                    cb({
                        error: e,
                        data: info,
                    });
                });
            },
            getFriendInfo: function (data, cb) {
                store.messenger.getFriendInfo(data, function (e, info) {
                    cb({
                        error: e,
                        data: info,
                    });
                });
            },
            removeFriend: function (data, cb) {
                store.messenger.removeFriend(data, function (e, info) {
                    cb({
                        error: e,
                        data: info,
                    });
                });
            },
            openFriendChannel: function (data, cb) {
                store.messenger.openFriendChannel(data, function (e) {
                    cb({ error: e, });
                });
            },
            getFriendStatus: function (data, cb) {
                store.messenger.getStatus(data, function (e, online) {
                    cb({
                        error: e,
                        data: online,
                    });
                });
            },
            getMoreHistory: function (data, cb) {
                store.messenger.getMoreHistory(data.curvePublic, data.sig, data.count, function (e, history) {
                    cb({
                        error: e,
                        data: history,
                    });
                });
            },
            sendMessage: function (data, cb) {
                store.messenger.sendMessage(data.curvePublic, data.content, function (e) {
                    cb({
                        error: e,
                    });
                });
            },
            setChannelHead: function (data, cb) {
                store.messenger.setChannelHead(data.curvePublic, data.sig, function (e) {
                    cb({
                        error: e
                    });
                });
            }
        };

        //////////////////////////////////////////////////////////////////
        /////////////////////// PAD //////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        var channels = Store.channels = {};

        Store.joinPad = function (clientId, data) {
            var isNew = typeof channels[data.channel] === "undefined";
            var channel = channels[data.channel] = channels[data.channel] || {
                queue: [],
                data: {},
                clients: [],
                bcast: function (cmd, data, notMe) {
                    channel.clients.forEach(function (cId) {
                        if (cId === notMe) { return; }
                        postMessage(cId, cmd, data);
                    });
                },
                history: [],
                pushHistory: function (msg, isCp) {
                    if (isCp) {
                        channel.history.push('cp|' + msg);
                        var i;
                        for (i = channel.history.length - 2; i > 0; i--) {
                            if (/^cp\|/.test(channel.history[i])) { break; }
                        }
                        channel.history = channel.history.slice(i);
                        return;
                    }
                    channel.history.push(msg);
                }
            };
            if (channel.clients.indexOf(clientId) === -1) {
                channel.clients.push(clientId);
            }

            if (!isNew && channel.wc) {
                postMessage(clientId, "PAD_CONNECT", {
                    myID: channel.wc.myID,
                    id: channel.wc.id,
                    members: channel.wc.members
                });
                channel.wc.members.forEach(function (m) {
                    postMessage(clientId, "PAD_JOIN", m);
                });
                channel.history.forEach(function (msg) {
                    postMessage(clientId, "PAD_MESSAGE", {
                        msg: CpNfWorker.removeCp(msg),
                        user: channel.wc.myID,
                        validateKey: channel.data.validateKey
                    });
                });
                postMessage(clientId, "PAD_READY");

                return;
            }
            var conf = {
                onReady: function (padData) {
                    channel.data = padData || {};
                    postMessage(clientId, "PAD_READY");
                },
                onMessage: function (user, m, validateKey, isCp) {
                    channel.pushHistory(m, isCp);
                    channel.bcast("PAD_MESSAGE", {
                        user: user,
                        msg: m,
                        validateKey: validateKey
                    });
                },
                onJoin: function (m) {
                    channel.bcast("PAD_JOIN", m);
                },
                onLeave: function (m) {
                    channel.bcast("PAD_LEAVE", m);
                },
                onDisconnect: function () {
                    channel.bcast("PAD_DISCONNECT");
                },
                onError: function (err) {
                    channel.bcast("PAD_ERROR", err);
                    delete channels[data.channel]; // TODO test?
                },
                channel: data.channel,
                validateKey: data.validateKey,
                owners: data.owners,
                password: data.password,
                expire: data.expire,
                network: store.network,
                //readOnly: data.readOnly,
                onConnect: function (wc, sendMessage) {
                    channel.sendMessage = function (msg, cId, cb) {
                        // Send to server
                        sendMessage(msg, cb);
                        // Broadcast to other tabs
                        channel.pushHistory(CpNfWorker.removeCp(msg), /^cp\|/.test(msg));
                        channel.bcast("PAD_MESSAGE", {
                            user: wc.myID,
                            msg: CpNfWorker.removeCp(msg),
                            validateKey: channel.data.validateKey
                        }, cId);
                    };
                    channel.wc = wc;
                    channel.queue.forEach(function (data) {
                        channel.sendMessage(data.message, clientId);
                    });
                    channel.bcast("PAD_CONNECT", {
                        myID: wc.myID,
                        id: wc.id,
                        members: wc.members
                    });
                }
            };
            CpNfWorker.start(conf);
        };
        Store.leavePad = function (clientId, data, cb) {
            var channel = channels[data.channel];
            if (!channel || !channel.wc) { return void cb ({error: 'EINVAL'}); }
            channel.wc.leave();
            delete channels[data.channel];
            cb();
        };
        Store.sendPadMsg = function (clientId, data, cb) {
            var msg = data.msg;
            var channel = channels[data.channel];
            if (!channel) {
                return; }
            if (!channel.wc) {
                channel.queue.push(msg);
                return void cb();
            }
            channel.sendMessage(msg, clientId, cb);
        };

        // GET_FULL_HISTORY from sframe-common-outer
        Store.getFullHistory = function (clientId, data, cb) {
            var network = store.network;
            var hkn = network.historyKeeper;
            //var crypto = Crypto.createEncryptor(data.keys);
            // Get the history messages and send them to the iframe
            var parse = function (msg) {
                try {
                    return JSON.parse(msg);
                } catch (e) {
                    return null;
                }
            };
            var msgs = [];
            var onMsg = function (msg) {
                var parsed = parse(msg);
                if (parsed[0] === 'FULL_HISTORY_END') {
                    cb(msgs);
                    return;
                }
                if (parsed[0] !== 'FULL_HISTORY') { return; }
                if (parsed[1] && parsed[1].validateKey) { // First message
                    return;
                }
                if (parsed[1][3] !== data.channel) { return; }
                msg = parsed[1][4];
                if (msg) {
                    msg = msg.replace(/cp\|(([A-Za-z0-9+\/=]+)\|)?/, '');
                    //var decryptedMsg = crypto.decrypt(msg, true);
                    msgs.push(msg);
                }
            };
            network.on('message', onMsg);
            network.sendto(hkn, JSON.stringify(['GET_FULL_HISTORY', data.channel, data.validateKey]));
        };

        // Drive
        Store.userObjectCommand = function (clientId, cmdData, cb) {
            if (!cmdData || !cmdData.cmd) { return; }
            var data = cmdData.data;
            var cb2 = function (data2) {
                var paths = data.paths || [data.path] || [];
                paths = paths.concat(data.newPath || []);
                paths.forEach(function (p) {
                    sendDriveEvent('DRIVE_CHANGE', {
                        //path: ['drive', UserObject.FILES_DATA]
                        path: ['drive'].concat(p)
                    }, clientId);
                });
                cb(data2);
            };
            switch (cmdData.cmd) {
                case 'move':
                    store.userObject.move(data.paths, data.newPath, cb2); break;
                case 'restore':
                    store.userObject.restore(data.path, cb2); break;
                case 'addFolder':
                    store.userObject.addFolder(data.path, data.name, cb2); break;
                case 'delete':
                    store.userObject.delete(data.paths, cb2, data.nocheck, data.isOwnPadRemoved); break;
                case 'emptyTrash':
                    store.userObject.emptyTrash(cb2); break;
                case 'rename':
                    store.userObject.rename(data.path, data.newName, cb2); break;
                default:
                    cb();
            }
        };

        // Clients management
        var driveEventClients = [];
        var messengerEventClients = [];

        var dropChannel = function (chanId) {
            if (!Store.channels[chanId]) { return; }

            if (Store.channels[chanId].wc) {
                Store.channels[chanId].wc.leave('');
            }
            delete Store.channels[chanId];
        };
        Store._removeClient = function (clientId) {
            var driveIdx = driveEventClients.indexOf(clientId);
            if (driveIdx !== -1) {
                driveEventClients.splice(driveIdx, 1);
            }
            var messengerIdx = messengerEventClients.indexOf(clientId);
            if (messengerIdx !== -1) {
                messengerEventClients.splice(messengerIdx, 1);
            }
            Object.keys(Store.channels).forEach(function (chanId) {
                var chanIdx = Store.channels[chanId].clients.indexOf(clientId);
                if (chanIdx !== -1) {
                    Store.channels[chanId].clients.splice(chanIdx, 1);
                }
                if (Store.channels[chanId].clients.length === 0) {
                    dropChannel(chanId);
                }
            });
        };

        // Special events

        var driveEventInit = false;
        sendDriveEvent = function (q, data, sender) {
            driveEventClients.forEach(function (cId) {
                if (cId === sender) { return; }
                postMessage(cId, q, data);
            });
        };
        Store._subscribeToDrive = function (clientId) {
            if (driveEventClients.indexOf(clientId) === -1) {
                driveEventClients.push(clientId);
            }
            if (!driveEventInit) {
                store.proxy.on('change', [], function (o, n, p) {
                    sendDriveEvent('DRIVE_CHANGE', {
                        old: o,
                        new: n,
                        path: p
                    });
                });
                store.proxy.on('remove', [], function (o, p) {
                    sendDriveEvent(clientId, 'DRIVE_REMOVE', {
                        old: o,
                        path: p
                    });
                });
                driveEventInit = true;
            }
        };

        var messengerEventInit = false;
        var sendMessengerEvent = function (q, data) {
            messengerEventClients.forEach(function (cId) {
                postMessage(cId, q, data);
            });
        };
        Store._subscribeToMessenger = function (clientId) {
            if (messengerEventClients.indexOf(clientId) === -1) {
                messengerEventClients.push(clientId);
            }
            if (!messengerEventInit) {
                var messenger = store.messenger = Messenger.messenger(store);
                messenger.on('message', function (message) {
                    sendMessengerEvent('CONTACTS_MESSAGE', message);
                });
                messenger.on('join', function (curvePublic, channel) {
                    sendMessengerEvent('CONTACTS_JOIN', {
                        curvePublic: curvePublic,
                        channel: channel,
                    });
                });
                messenger.on('leave', function (curvePublic, channel) {
                    sendMessengerEvent('CONTACTS_LEAVE', {
                        curvePublic: curvePublic,
                        channel: channel,
                    });
                });
                messenger.on('update', function (info, curvePublic) {
                    sendMessengerEvent('CONTACTS_UPDATE', {
                        curvePublic: curvePublic,
                        info: info,
                    });
                });
                messenger.on('friend', function (curvePublic) {
                    sendMessengerEvent('CONTACTS_FRIEND', {
                        curvePublic: curvePublic,
                    });
                });
                messenger.on('unfriend', function (curvePublic) {
                    sendMessengerEvent('CONTACTS_UNFRIEND', {
                        curvePublic: curvePublic,
                    });
                });
                messengerEventInit = true;
            }
        };


        //////////////////////////////////////////////////////////////////
        /////////////////////// Init /////////////////////////////////////
        //////////////////////////////////////////////////////////////////

        var onReady = function (clientId, returned, cb) {
            var proxy = store.proxy;
            var userObject = store.userObject = UserObject.init(proxy.drive, {
                pinPads: function (data, cb) { Store.pinPads(null, data, cb); },
                unpinPads: function (data, cb) { Store.unpinPads(null, data, cb); },
                removeOwnedChannel: function (data, cb) { Store.removeOwnedChannel(null, data, cb); },
                edPublic: store.proxy.edPublic,
                loggedIn: store.loggedIn,
                log: function (msg) {
                    // broadcast to all drive apps
                    sendDriveEvent("DRIVE_LOG", msg);
                }
            });
            nThen(function (waitFor) {
                postMessage(clientId, 'LOADING_DRIVE', {
                    state: 2
                });
                userObject.migrate(waitFor());
            }).nThen(function (waitFor) {
                Migrate(proxy, waitFor(), function (version, progress) {
                    postMessage(clientId, 'LOADING_DRIVE', {
                        state: 2,
                        progress: progress
                    });
                });
            }).nThen(function () {
                postMessage(clientId, 'LOADING_DRIVE', {
                    state: 3
                });
                userObject.fixFiles();

                var requestLogin = function () {
                    broadcast([], "REQUEST_LOGIN");
                };

                if (store.loggedIn) {
                    /*  This isn't truly secure, since anyone who can read the user's object can
                        set their local loginToken to match that in the object. However, it exposes
                        a UI that will work most of the time. */

                    // every user object should have a persistent, random number
                    if (typeof(proxy.loginToken) !== 'number') {
                        proxy[Constants.tokenKey] = Math.floor(Math.random()*Number.MAX_SAFE_INTEGER);
                    }
                    returned[Constants.tokenKey] = proxy[Constants.tokenKey];

                    if (store.data.localToken && store.data.localToken !== proxy[Constants.tokenKey]) {
                        // the local number doesn't match that in
                        // the user object, request that they reauthenticate.
                        return void requestLogin();
                    }
                }

                if (!proxy.settings || !proxy.settings.general ||
                        typeof(proxy.settings.general.allowUserFeedback) !== 'boolean') {
                    proxy.settings = proxy.settings || {};
                    proxy.settings.general = proxy.settings.general || {};
                    proxy.settings.general.allowUserFeedback = true;
                }
                returned.feedback = proxy.settings.general.allowUserFeedback;

                if (typeof(cb) === 'function') { cb(returned); }

                if (typeof(proxy.uid) !== 'string' || proxy.uid.length !== 32) {
                    // even anonymous users should have a persistent, unique-ish id
                    console.log('generating a persistent identifier');
                    proxy.uid = Hash.createChannelId();
                }

                // if the user is logged in, but does not have signing keys...
                if (store.loggedIn && (!Store.hasSigningKeys() ||
                    !Store.hasCurveKeys())) {
                    return void requestLogin();
                }

                proxy.on('change', [Constants.displayNameKey], function (o, n) {
                    if (typeof(n) !== "string") { return; }
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['profile'], function () {
                    // Trigger userlist update when the avatar has changed
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['friends'], function () {
                    // Trigger userlist update when the friendlist has changed
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', ['settings'], function () {
                    broadcast([], "UPDATE_METADATA");
                });
                proxy.on('change', [Constants.tokenKey], function () {
                    broadcast([], "UPDATE_TOKEN", { token: proxy[Constants.tokenKey] });
                });
            });
        };

        var connect = function (clientId, data, cb) {
            var hash = data.userHash || data.anonHash || Hash.createRandomHash('drive');
            storeHash = hash;
            if (!hash) {
                throw new Error('[Store.init] Unable to find or create a drive hash. Aborting...');
            }
            // No password for drive
            var secret = Hash.getSecrets('drive', hash);
            var listmapConfig = {
                data: {},
                websocketURL: NetConfig.getWebsocketURL(),
                channel: secret.channel,
                readOnly: false,
                validateKey: secret.keys.validateKey || undefined,
                crypto: Crypto.createEncryptor(secret.keys),
                userName: 'fs',
                logLevel: 1,
                ChainPad: ChainPad,
                classic: true,
            };
            var rt = window.rt = Listmap.create(listmapConfig);
            store.proxy = rt.proxy;
            store.loggedIn = typeof(data.userHash) !== "undefined";

            var returned = {};
            rt.proxy.on('create', function (info) {
                store.realtime = info.realtime;
                store.network = info.network;
                if (!data.userHash) {
                    returned.anonHash = Hash.getEditHashFromKeys(secret);
                }
            }).on('ready', function () {
                if (store.userObject) { return; } // the store is already ready, it is a reconnection
                if (!rt.proxy.drive || typeof(rt.proxy.drive) !== 'object') { rt.proxy.drive = {}; }
                var drive = rt.proxy.drive;
                // Creating a new anon drive: import anon pads from localStorage
                if ((!drive[Constants.oldStorageKey] || !Array.isArray(drive[Constants.oldStorageKey]))
                    && !drive['filesData']) {
                    drive[Constants.oldStorageKey] = [];
                }
                postMessage(clientId, 'LOADING_DRIVE', { state: 1 });
                // Drive already exist: return the existing drive, don't load data from legacy store
                onReady(clientId, returned, cb);
            })
            .on('change', ['drive', 'migrate'], function () {
                var path = arguments[2];
                var value = arguments[1];
                if (path[0] === 'drive' && path[1] === "migrate" && value === 1) {
                    rt.network.disconnect();
                    rt.realtime.abort();
                    broadcast([], 'NETWORK_DISCONNECT');
                }
            });

            rt.proxy.on('disconnect', function () {
                broadcast([], 'NETWORK_DISCONNECT');
            });
            rt.proxy.on('reconnect', function (info) {
                broadcast([], 'NETWORK_RECONNECT', {myId: info.myId});
            });
        };

        /**
         * Data:
         *   - userHash or anonHash
         * Todo in cb
         *   - LocalStore.setFSHash if needed
         *   - sessionStorage.User_Hash
         *   - stuff with tokenKey
         * Event to outer
         *   - requestLogin
         */
        var initialized = false;
        Store.init = function (clientId, data, callback) {
            if (initialized) {
                return void callback({
                    state: 'ALREADY_INIT',
                    returned: store.returned
                });
            }
            initialized = true;
            postMessage = function (clientId, cmd, d, cb) {
                data.query(clientId, cmd, d, cb);
            };
            broadcast = function (excludes, cmd, d, cb) {
                data.broadcast(excludes, cmd, d, cb);
            };

            store.data = data;
            connect(clientId, data, function (ret) {
                if (Object.keys(store.proxy).length === 1) {
                    Feedback.send("FIRST_APP_USE", true);
                }
                store.returned = ret;

                callback(ret);
            });
        };

        Store.disconnect = function () {
            if (!store.network) { return; }
            store.network.disconnect();
        };
        return Store;
    };

    return {
        create: create
    };
});
