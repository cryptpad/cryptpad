// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (UserObject, Util, Hash,
                SF, Messages = {}, Feedback, nThen) => {

    let setCustomize = data => {
        Messages = data.Messages;
        UserObject.setCustomize(data);
    };

    var getConfig = function (Env) {
        var cfg = {};
        for (var k in Env.cfg) { cfg[k] = Env.cfg[k]; }
        return cfg;
    };

    // Add a shared folder to the list
    var addProxy = function (Env, id, lm, leave, editKey, force) {
        if (Env.folders[id] && !force && !Env.folders[id].restricted) {
            // Shared folder already added to the proxy-manager, probably
            // a cached version
            if (Env.folders[id].offline && !lm.cache && Env.Store) {
                Env.folders[id].offline = false;
                if (Env.folders[id].userObject.fixFiles) { Env.folders[id].userObject.fixFiles(); }
                Env.Store.refreshDriveUI();
            }
            return;
        }
        var cfg = getConfig(Env);
        cfg.sharedFolder = true;
        cfg.id = id;
        cfg.editKey = editKey;
        cfg.rt = lm.realtime;
        cfg.readOnly = Boolean(!editKey);
        var userObject = UserObject.init(lm.proxy, cfg);
        if (userObject.fixFiles) {
            // Only in outer
            userObject.fixFiles();
        }
        var proxy = lm.proxy;
        if (proxy.metadata && proxy.metadata.title) {
            var sf = Env.user.proxy[UserObject.SHARED_FOLDERS][id];
            if (sf) {
                sf.lastTitle = proxy.metadata.title;
            }
        }
        Env.folders[id] = {
            proxy: lm.proxy,
            userObject: userObject,
            leave: leave,
            restricted: proxy.restricted,
            offline: Boolean(lm.cache)
        };
        if (proxy.on) {
            proxy.on('disconnect', function () {
                Env.folders[id].offline = true;
            });
            proxy.on('reconnect', function () {
                Env.folders[id].offline = false;
            });
        }
        return userObject;
    };

    var removeProxy = function (Env, id) {
        var f = Env.folders[id];
        if (!f) { return; }
        f.leave();
        delete Env.folders[id];
    };

    var sendNotification = (Env, sfId, title) => {
        var mailbox = Env.store.mailbox;
        if (!mailbox) { return; }
        var team = Env.cfg.teamId;
        var box;
        if (team) {
            let teams = Env.store.modules['team'].getTeamsData();
            box = teams[team];
        } else {
            let md = Env.Store.getMetadata(null, null, () => {});
            box = md.user;
        }
        mailbox.sendTo('SF_DELETED', {
            sfId: sfId,
            team: team,
            title: title
        }, {
            curvePublic: box.curvePublic,
            channel: box.notifications
        }, (err) => {
                console.error(err);
        });
    };

    // Password may have changed
    var deprecateProxy = function (Env, id, channel, reason) {
        if (Env.folders[id] && Env.folders[id].deleting) {
            // Folder is being deleted by its owner, don't deprecate it
            return;
        }
        if (Env.user.userObject.readOnly) {
            // In a read-only team, we can't deprecate a shared folder
            // Use a empty object with a deprecated flag...
            var lm = { proxy: { deprecated: true } };
            removeProxy(Env, id);
            addProxy(Env, id, lm, function () {});
            return void Env.Store.refreshDriveUI();
        }
        if (channel) { Env.unpinPads([channel], function () {}); }

        // If it's explicitely a deletion, no need to deprecate, just delete
        if (reason && reason !== "PASSWORD_CHANGE") {
            let temp = Util.find(Env, ['user', 'proxy', UserObject.SHARED_FOLDERS]);
            let title = temp[id] && temp[id].lastTitle;
            if (title) { sendNotification(Env, id, title); }

            delete temp[id];

            if (Env.Store && Env.Store.refreshDriveUI) { Env.Store.refreshDriveUI(); }
            return;
        }

        // It's explicitely a password change, better message in drive: provide the "reason" to the UI
        Env.user.userObject.deprecateSharedFolder(id, reason);
        removeProxy(Env, id);
        if (Env.Store && Env.Store.refreshDriveUI) { Env.Store.refreshDriveUI(); }
    };

    var restrictedProxy = function (Env, id) {
        var lm = { proxy: { restricted: true, root: {}, filesData: {} } };
        removeProxy(Env, id);
        addProxy(Env, id, lm, function () {});
        return void Env.Store.refreshDriveUI();
    };

    /*
        Tools
    */
    var _ownedByMe = function (Env, owners) {
        return Array.isArray(owners) && owners.indexOf(Env.edPublic) !== -1;
    };
    var _ownedByOther = function (Env, owners) {
        return Array.isArray(owners) && owners.length &&
                (!Env.edPublic || owners.indexOf(Env.edPublic) === -1);
    };

    var _getUserObjects = function (Env) {
        var userObjects = [Env.user.userObject];
        var foldersUO = Object.keys(Env.folders).map(function (k) {
            return Env.folders[k].userObject;
        });
        Array.prototype.push.apply(userObjects, foldersUO);
        return userObjects;
    };

    var _getUserObjectFromId = function (Env, id) {
        var userObjects = _getUserObjects(Env);
        var userObject = Env.user.userObject;
        userObjects.some(function (uo) {
            if (Object.keys(uo.getFileData(id)).length) {
                userObject = uo;
                return true;
            }
        });
        return userObject;
    };

    var _getUserObjectPath = function (Env, uo) {
        var fId = Number(uo.id);
        if (!fId) { return; }
        var fPath = Env.user.userObject.findFile(fId)[0];
        return fPath;
    };

    // Return files data objects associated to a channel for setPadTitle
    // All occurences are returned, in drive or shared folders
    // If "editable" is true, the data returned is a proxy, otherwise
    // it's a cloned object (NOTE: href should never be edited directly)
    var findChannel = function (Env, channel, editable) {
        var ret = [];
        Env.user.userObject.findChannels([channel], true).forEach(function (id) {
            // Check in shared folders, then clone if needed
            var data = Env.user.proxy[UserObject.SHARED_FOLDERS][id];
            if (data && !editable) { data = JSON.parse(JSON.stringify(data)); }
            // If it's not a shared folder, check the pads
            if (!data) { data = Env.user.userObject.getFileData(id, editable); }
            ret.push({
                id: id,
                data: data,
                userObject: Env.user.userObject
            });
        });
        Object.keys(Env.folders).forEach(function (fId) {
            Env.folders[fId].userObject.findChannels([channel]).forEach(function (id) {
                ret.push({
                    id: id,
                    fId: fId,
                    data: Env.folders[fId].userObject.getFileData(id, editable),
                    userObject: Env.folders[fId].userObject
                });
            });
        });
        return ret;
    };
    // Return files data objects associated to a given href for setPadAttribute...
    // If "editable" is true, the data returned is a proxy, otherwise
    // it's a cloned object (NOTE: href should never be edited directly)
    var findHref = function (Env, href) {
        var ret = [];
        var id = Env.user.userObject.getIdFromHref(href);
        if (id) {
            ret.push({
                data: Env.user.userObject.getFileData(id),
                userObject: Env.user.userObject
            });
        }
        Object.keys(Env.folders).forEach(function (fId) {
            var id = Env.folders[fId].userObject.getIdFromHref(href);
            if (!id) { return; }
            ret.push({
                fId: fId,
                data: Env.folders[fId].userObject.getFileData(id),
                userObject: Env.folders[fId].userObject
            });
        });
        return ret;
    };
    // Return paths linked to a file ID
    var findFile = function (Env, id) {
        var ret = [];
        var userObjects = _getUserObjects(Env);
        let mainRes = {};
        userObjects.forEach(function (uo) {
            var fId = Number(uo.id);
            let results;
            if (!fId) {
                // Main drive: get the paths of all the SF
                // in addition to the paths of the requested file
                let ids = [id];
                let fIds = userObjects.map(uo => {
                    return +uo.id;
                }).filter(Boolean);
                Array.prototype.push.apply(ids, fIds);
                mainRes = uo.findFiles(ids); // Store paths of each SF
                results = mainRes[id]; // Paths of requested file
            } else {
                results = uo.findFile(id);
                // This is a shared folder, we have to fix the paths in the results
                let fPath = (mainRes[fId] || [])[0];
                if (!fPath) { return; } // Can't search into this sf
                results.forEach(function (p) {
                    Array.prototype.unshift.apply(p, fPath);
                });
            }
            // Push the results from this proxy
            Array.prototype.push.apply(ret, results);
        });
        return ret;
    };
    var findFiles = function (Env, ids) {
        var ret = {};
        var userObjects = _getUserObjects(Env);
        let mainRes = {};
        userObjects.forEach(function (uo) {
            //var fPath = _getUserObjectPath(Env, uo);
            var fId = Number(uo.id);
            if (!uo.id) {
                let fIds = userObjects.map(uo => {
                    return +uo.id;
                }).filter(Boolean);
                Array.prototype.push.apply(ids, fIds);
            }
            var results = uo.findFiles(ids);
            if (!uo.id) { mainRes = results; }
            //console.error(results);
            if (fId) {
                // This is a shared folder, we have to fix the paths in the results
                let fPath = (mainRes[fId] || [])[0];
                if (!fPath) { return; } // Can't search into this sf
                Object.keys(results).forEach(file => {
                    results[file].forEach(p => {
                        Array.prototype.unshift.apply(p, fPath);
                    });
                });
            }
            // Push the results from this proxy
            Object.keys(results).forEach(file => {
                ret[file] ||= [];
                Array.prototype.push.apply(ret[file], results[file]);
            });
        });
        return ret;
    };


    // Returns file IDs corresponding to the provided channels
    var _findChannels = function (Env, channels, onlyMain) {
        if (onlyMain) {
            return Env.user.userObject.findChannels(channels);
        }
        var ret = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            var results = uo.findChannels(channels);
            Array.prototype.push.apply(ret, results);
        });
        ret = Util.deduplicateString(ret);
        return ret;
    };

    var _getFileData = function (Env, id, editable) {
        var userObjects = _getUserObjects(Env);
        var data = {};
        userObjects.some(function (uo) {
            data = uo.getFileData(id, editable);
            if (data && Object.keys(data).length) { return true; }
        });
        return data;
    };

    var getSharedFolderData = function (Env, id) {
        var inHistory;
        if (Env.isHistoryMode && !Env.folders[id]) { inHistory = true; }
        else if (!Env.folders[id]) { return {}; }
        var proxy = inHistory? {}: Env.folders[id].proxy;

        // Clean deprecated values
        if (Object.keys(proxy.metadata || {}).length > 1) {
            proxy.metadata = { title: proxy.metadata.title };
        }

        var obj = Util.clone(proxy.metadata || {});

        for (var k in Env.user.proxy[UserObject.SHARED_FOLDERS][id] || {}) {
            if (typeof(Env.user.proxy[UserObject.SHARED_FOLDERS][id][k]) === "undefined") { // TODO "deleted folder" for restricted shared folders when viewer in a team
                continue;
            }
            var data = Util.clone(Env.user.proxy[UserObject.SHARED_FOLDERS][id][k]);
            if (k === "href" && data.indexOf('#') === -1) {
                try {
                    data = Env.user.userObject.cryptor.decrypt(data);
                } catch (e) {}
            }
            if (k === "href" && data.indexOf('#') === -1) { data = undefined; }
            obj[k] = data;
        }
        return obj;
    };


    // Transform an absolute path into a path relative to the correct shared folder
    var _resolvePath = function (Env, path) {
        var res = {
            id: null,
            userObject: Env.user.userObject,
            path: path
        };
        if (!Array.isArray(path) || path.length <= 1) {
            return res;
        }
        var current;
        var uo = Env.user.userObject;
        // We don't need to check the last element of the path because we only need to split it
        // when the path contains an element inside the shared folder
        for (var i=2; i<path.length; i++) {
            current = uo.find(path.slice(0,i));
            if (uo.isSharedFolder(current)) {
                res = {
                    id: current,
                    userObject: Env.folders[current]?.userObject,
                    path: path.slice(i)
                };
                break;
            }
        }
        return res;
    };
    var _resolvePaths = function (Env, paths) {
        var main = [];
        var folders = {};
        paths.forEach(function (path) {
            var r = _resolvePath(Env, path);
            if (r.id) {
                if (!folders[r.id]) {
                    folders[r.id] = [r.path];
                } else {
                    folders[r.id].push(r.path);
                }
            } else {
                main.push(r.path);
            }
        });
        return {
            main: main,
            folders: folders
        };
    };

    // Check if a given path is resolved to a shared folder or to the main drive
    var _isInSharedFolder = function (Env, path) {
        var resolved = _resolvePath(Env, path);
        return typeof resolved.id === "number" ? resolved.id : false;
    };

    // Get the owned files in the main drive that are also duplicated in shared folders
    var _isDuplicateOwned = function (Env, path, id) {
        if (path && _isInSharedFolder(Env, path)) { return; }
        var data = _getFileData(Env, id || Env.user.userObject.find(path));
        if (!data) { return; }
        if (!_ownedByMe(Env, data.owners)) { return; }
        var channel = data.channel;
        if (!channel) { return; }
        var foldersUO = Object.keys(Env.folders).map(function (k) {
            return Env.folders[k].userObject;
        });
        return foldersUO.some(function (uo) {
            return uo.findChannels([channel]).length;
        });
    };

    // Get a copy of the elements located in the given paths, with their files data
    // Note: This function is only called to move files from a proxy to another
    var _getCopyFromPaths = function (Env, paths, userObject) {
        var data = [];
        var toNotRemove = [];
        paths.forEach(function (path, idx) {
            var el = userObject.find(path);
            var files = [];
            var key = path[path.length - 1];

            // Get the files ID from the current path (file or folder)
            if (userObject.isFile(el)) {
                files.push(el);
            } else if (userObject.isSharedFolder(el)) {
                files.push(el);
                var obj = Env.folders[el].proxy.metadata || {};
                if (obj) { key = obj.title; }
            } else {
                try {
                    el = JSON.parse(JSON.stringify(el));
                } catch (e) { return undefined; }
                userObject.getFilesRecursively(el, files);
            }

            // If the element is a folder and it contains a shared folder, abort!
            // We don't want nested shared folders!
            if (files.some(function (f) { return userObject.isSharedFolder(f); })) {
                if (Env.cfg && Env.cfg.log) {
                    Env.cfg.log(Messages._getKey('fm_moveNestedSF', [key]));
                }
                toNotRemove.unshift(idx);
                return;
            }

            // Deduplicate
            files = Util.deduplicateString(files);

            // Get the files data associated to these files
            var filesData = {};
            files.forEach(function (f) {
                filesData[f] = userObject.getFileData(f);
            });

            data.push({
                el: el,
                data: filesData,
                key: key
            });
        });

        // Remove from the "paths" array the elements that we don't want to move
        toNotRemove.forEach(function (idx) {
            paths.splice(idx, 1);
        });

        return data;
    };

    var getEditHash = function (Env, channel) {
        var res = findChannel(Env, channel);
        var stronger;
        res.some(function (obj) {
            if (!obj || !obj.data || !obj.data.href) { return; }
            var parsed = Hash.parsePadUrl(obj.data.href);
            var parsedHash = parsed.hashData;
            if (!parsedHash || parsedHash.mode === 'view') { return; }
            // We've found an edit hash!
            stronger = parsed.hash;
            return true;
        });
        return stronger;
    };

    /*
        Drive RPC
    */

    // Move files or folders in the drive
    var _move = function (Env, data, cb) {
        var resolved = _resolvePaths(Env, data.paths);
        var newResolved = _resolvePath(Env, data.newPath);

        // NOTE: we can only copy when moving from one drive to another. We don't want
        // duplicates in the same drive
        var copy = data.copy;

        if (!newResolved.userObject.isFolder(newResolved.path)) { return void cb(); }

        nThen(function (waitFor) {
            if (resolved.main.length) {
                // Move from the main drive
                if (!newResolved.id) {
                    // Move from the main drive to the main drive
                    Env.user.userObject.move(resolved.main, newResolved.path, waitFor());
                } else {
                    // Move from the main drive to a shared folder

                    // Copy the elements to the new location
                    var toCopy = _getCopyFromPaths(Env, resolved.main, Env.user.userObject);
                    var newUserObject = newResolved.userObject;
                    toCopy.forEach(function (obj) {
                        newUserObject.copyFromOtherDrive(newResolved.path, obj.el, obj.data, obj.key);
                    });

                    if (copy) { return; }

                    if (resolved.main.length) {
                        // Remove the elements from the old location (without unpinning)
                        Env.user.userObject.delete(resolved.main, waitFor()); // FIXME waitFor() is called synchronously
                    }
                }
            }
            var folderIds = Object.keys(resolved.folders);
            if (folderIds.length) {
                // Move from a shared folder
                folderIds.forEach(function (fIdStr) {
                    var fId = Number(fIdStr);
                    var paths = resolved.folders[fId];
                    if (newResolved.id === fId) {
                        // Move to the same shared folder
                        newResolved.userObject.move(paths, newResolved.path, waitFor());
                    } else {
                        // Move to a different shared folder or to main drive
                        var uoFrom = Env.folders[fId].userObject;
                        var uoTo = newResolved.userObject;

                        // Copy the elements to the new location
                        var toCopy = _getCopyFromPaths(Env, paths, uoFrom);
                        toCopy.forEach(function (obj) {
                            uoTo.copyFromOtherDrive(newResolved.path, obj.el, obj.data, obj.key);
                        });

                        if (copy) { return; }

                        // Remove the elements from the old location (without unpinning)
                        uoFrom.delete(paths, waitFor()); // FIXME waitFor() is called synchronously
                    }
                });
            }
        }).nThen(function () {
            cb();
        });
    };
    // Restore from the trash (main drive only)
    var _restore = function (Env, data, cb) {
        var userObject = Env.user.userObject;
        data = data || {};
        userObject.restore(data.path, cb);
    };
    // Add a folder/subfolder
    var _addFolder = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        resolved.userObject.addFolder(resolved.path, data.name, function (obj) {
            // The result is the relative path of the new folder. We have to make it absolute.
            if (obj.newPath && resolved.id) {
                var fPath = _getUserObjectPath(Env, resolved.userObject);
                if (fPath) {
                    // This is a shared folder, we have to fix the paths in the search results
                    Array.prototype.unshift.apply(obj.newPath, fPath);
                }
            }
            cb(obj);
        });
    };
    // Add a shared folder
    var _addSharedFolder = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        if (resolved.id) { return void cb({error: 'EINVAL'}); }
        if (!Env.pinPads) { return void cb({error: 'EAUTH'}); }

        var folderData = data.folderData || {};

        var id;
        nThen(function () {
            // Check if it is an imported folder or a folder creation
            if (data.folderData) { return; }

            // Folder creation
            var hash = Hash.createRandomHash('drive', data.password);
            var secret = Hash.getSecrets('drive', hash, data.password);
            var hashes = Hash.getHashes(secret);
            folderData = {
                href: '/drive/#' + hashes.editHash,
                roHref: '/drive/#' + hashes.viewHash,
                channel: secret.channel,
                lastTitle: data.name,
                ctime: +new Date(),
            };
            if (data.password) { folderData.password = data.password; }
            if (data.owned) { folderData.owners = [Env.edPublic]; }
        }).nThen(function (waitFor) {
            Env.Store.getPadMetadata(null, {
                channel: folderData.channel
            }, waitFor(function (obj) {
                if (obj && (obj.error || obj.rejected)) {
                    waitFor.abort();
                    return void cb({
                        error: obj.error || 'ERESTRICTED'
                    });
                }
            }));
        }).nThen(function (waitFor) {
            Env.pinPads([folderData.channel], waitFor());
        }).nThen(function (waitFor) {
            // 1. add the shared folder to our list of shared folders
            // NOTE: pushSharedFolder will encrypt the href directly in the object if needed
            Env.user.userObject.pushSharedFolder(folderData, waitFor(function (err, folderId) {
                if (err === "EEXISTS" && folderData.href && folderId) { // Check upgrade
                    var parsed = Hash.parsePadUrl(folderData.href);
                    var secret = Hash.getSecrets('drive', parsed.hash, folderData.password);
                    SF.upgrade(secret.channel, secret);
                    if (Env.folders[folderId]) {
                        Env.folders[folderId].userObject.setReadOnly(false, secret.keys.secondaryKey);
                    }
                    waitFor.abort();
                    return void cb(folderId);
                }
                if (err === "EEXISTS" && folderId) { // Exists but no upgrade, return folderId
                    waitFor.abort();
                    return void cb(folderId);
                }
                if (err) {
                    waitFor.abort();
                    return void cb(err);
                }
                id = folderId;
            }));
        }).nThen(function (waitFor) {
            // 2a. add the shared folder to the path in our drive
            Env.user.userObject.add(id, resolved.path);

            // 2b. load the proxy
            Env.loadSharedFolder(id, folderData, waitFor(function (rt) {
                if (!rt) {
                    waitFor.abort();
                    return void cb({ error: 'EDELETED' });
                }

                if (!rt.proxy.metadata) { // Creating a new shared folder
                    rt.proxy.metadata = { title: data.name || Messages.fm_newFolder };
                }
                if (data.folderData) {
                    // If we're importing a folder, check its serverside metadata
                    Env.Store.getPadMetadata(null, { channel: folderData.channel }, function (md) {
                        var fData = Env.user.proxy[UserObject.SHARED_FOLDERS][id];
                        if (md.owners) { fData.owners = md.owners; }
                        if (md.expire) { fData.expire = +md.expire; }
                    });
                }
            }), !Boolean(data.folderData));
        }).nThen(function () {
            Env.onSync(function () {
                cb(id);
            });
        });
    };
    // Add a link
    var _addLink = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        var uo = resolved.userObject;
        var now = +new Date();
        uo.pushLink({
            name: data.name,
            href: data.href,
            atime: now,
            ctime: now
        }, function (e, id) {
            if (e) { return void cb({error: e}); }
            uo.add(id, resolved.path);
            Env.onSync(cb);
        });
    };

    var _restoreSharedFolder = function (Env, _data, cb) {
        var fId = _data.id;
        var newPassword = _data.password;
        var temp = Util.find(Env, ['user', 'proxy', UserObject.SHARED_FOLDERS_TEMP]);
        var data = temp && temp[fId];
        if (!data) { return void cb({ error: 'EINVAL' }); }
        if (!Env.Store) { return void cb({ error: 'ESTORE' }); }
        var href = Env.user.userObject.getHref ? Env.user.userObject.getHref(data) : data.href;
        var isNew = false;
        nThen(function (waitFor) {
            Env.Store.isNewChannel(null, {
                href: href,
                password: newPassword
            }, waitFor(function (obj) {
                if (!obj || obj.error) {
                    isNew = false;
                    return;
                }
                isNew = obj.isNew;
            }));
        }).nThen(function () {
            if (isNew) {
                return void cb({ error: 'ENOTFOUND' });
            }
            var newData = Util.clone(data);
            var parsed = Hash.parsePadUrl(href);
            var secret = Hash.getSecrets(parsed.type, parsed.hash, newPassword);
            newData.password = newPassword;
            newData.channel = secret.channel;
            if (secret.keys.editKeyStr) {
                newData.href = '/drive/#'+Hash.getEditHashFromKeys(secret);
            }
            newData.roHref = '/drive/#'+Hash.getViewHashFromKeys(secret);
            delete newData.legacy;
            _addSharedFolder(Env, {
                path: ['root'],
                folderData: newData,
            }, function () {
                delete temp[fId];
                Env.onSync(cb);
            });
        });

    };

    // convert a folder to a Shared Folder
    var _convertFolderToSharedFolder = function (Env, data, cb) {
        var path = data.path;
        var folderElement = Env.user.userObject.find(path);
        // don't try to convert top-level elements (trash, root, etc) to shared-folders
        if (path.length <= 1 || path[0] !== UserObject.ROOT) {
            return void cb({
                error: 'E_INVAL_PATH',
            });
        }
        if (_isInSharedFolder(Env, path)) {
            return void cb({
                error: 'E_INVAL_NESTING',
            });
        }
        if (Env.user.userObject.hasSubSharedFolder(folderElement)) {
            return void cb({
                error: 'E_INVAL_NESTING',
            });
        }
        var parentPath = path.slice(0, -1);
        var parentFolder = Env.user.userObject.find(parentPath);
        var folderName = path[path.length - 1];
        var SFId;
        nThen(function (waitFor) {
            // create shared folder
            _addSharedFolder(Env, {
                path: parentPath,
                name: folderName,
                owned: data.owned,
                password: data.password || '',
            }, waitFor(function (id) {
                // _addSharedFolder can be an id or an error
                if (typeof(id) === 'object' && id && id.error) {
                    waitFor.abort();
                    return void cb(id);
                } else {
                    SFId = id;
                }
            }));
        }).nThen(function (waitFor) {
            // move everything from folder to SF
            if (!SFId) {
                waitFor.abort();
                return void cb({
                    error: 'E_NO_ID'
                });
            }
            var paths = [];
            for (var el in folderElement) {
                if (Env.user.userObject.isFolder(folderElement[el]) || Env.user.userObject.isFile(folderElement[el])) {
                    paths.push(path.concat(el));
                }
            }
            var SFKey;
            // this is basically Array.find, except it works in IE
            Object.keys(parentFolder).some(function (el) {
                if (parentFolder[el] === SFId) {
                    SFKey = el;
                    return true;
                }
            });

            if (!SFKey) {
                waitFor.abort();
                return void cb({
                    error: 'E_NO_KEY'
                });
            }
            var newPath = parentPath.concat(SFKey).concat(UserObject.ROOT);
            _move(Env, {
                paths: paths,
                newPath: newPath,
                copy: false,
            }, waitFor());
        }).nThen(function (waitFor) {
            // Move the owned pads from the old folder to root
            var paths = [];
            Object.keys(folderElement).forEach(function (el) {
                if (!Env.user.userObject.isFile(folderElement[el])) { return; }
                var data = Env.user.userObject.getFileData(folderElement[el]);
                if (!data || !_ownedByMe(Env, data.owners)) { return; }
                // This is an owned pad: move it to ROOT before deleting the initial folder
                paths.push(path.concat(el));
            });
            _move(Env, {
                paths: paths,
                newPath: [UserObject.ROOT],
                copy: false,
            }, waitFor());
        }).nThen(function () {
            // migrate metadata
            var sharedFolderElement = Env.user.proxy[UserObject.SHARED_FOLDERS][SFId];
            var metadata = Env.user.userObject.getFolderData(folderElement);
            for (var key in metadata) {
                // it shouldn't be possible to have nested metadata
                // but this is a reasonable sanity check
                if (key === "metadata") { continue; }
                // copy the metadata from the original folder to the new shared folder
                sharedFolderElement[key] = metadata[key];
            }

            // remove folder
            Env.user.userObject.delete([path], function () {
                cb({
                    fId: SFId
                });
            });
        });
    };

    var _delete = function (Env, data, cb) {
        data = data || {};
        var resolved = data.resolved || _resolvePaths(Env, data.paths);
        if (!resolved.main.length && !Object.keys(resolved.folders).length) {
            return void cb({error: 'E_NOTFOUND'});
        }

        // Deleted or password changed for a shared folder
        if (data.paths && data.paths.length === 1 &&
            data.paths[0][0] === UserObject.SHARED_FOLDERS_TEMP) {
            var temp = Util.find(Env, ['user', 'proxy', UserObject.SHARED_FOLDERS_TEMP]);
            delete temp[data.paths[0][1]];
            return void Env.onSync(cb);
        }

        var toUnpin = [];
        nThen(function (waitFor)  {
            // Delete paths from the main drive and get the list of pads to unpin
            // We also get the list of owned pads that were removed
            if (resolved.main.length) {
                var uo = Env.user.userObject;
                if (Util.find(Env.settings, ['drive', 'hideDuplicate'])) {
                    // If we hide duplicate owned pads in our drive, we have
                    // to make sure we're not deleting a hidden own file
                    // from inside a folder we're trying to delete
                    resolved.main.forEach(function (p) {
                        var el = uo.find(p);
                        if (p[0] === UserObject.FILES_DATA) { return; }
                        if (uo.isFile(el) || uo.isSharedFolder(el)) { return; }
                        var arr = [];
                        uo.getFilesRecursively(el, arr);
                        arr.forEach(function (id) {
                            if (_isDuplicateOwned(Env, null, id)) {
                                Env.user.userObject.add(Number(id), [UserObject.ROOT]);
                            }
                        });
                    });
                }
                uo.delete(resolved.main, waitFor(function (err, _toUnpin/*, _ownedRemoved*/) {
                    //ownedRemoved = _ownedRemoved;
                    if (!Env.unpinPads || !_toUnpin) { return; }
                    Array.prototype.push.apply(toUnpin, _toUnpin);
                }));
            }
        }).nThen(function (waitFor) {
            // Check if removed owned pads are duplicated in some shared folders
            // If that's the case, we have to remove them from the shared folders too
            // We can do that by adding their paths to the list of pads to remove from shared folders
            /*if (ownedRemoved) {
                var ids = _findChannels(Env, ownedRemoved);
                ids.forEach(function (id) {
                    var paths = findFile(Env, id);
                    var _resolved = _resolvePaths(Env, paths);
                    Object.keys(_resolved.folders).forEach(function (fId) {
                        if (resolved.folders[fId]) {
                            Array.prototype.push.apply(resolved.folders[fId], _resolved.folders[fId]);
                        } else {
                            resolved.folders[fId] = _resolved.folders[fId];
                        }
                    });
                });
            }*/
            // Delete paths from the shared folders
            Object.keys(resolved.folders).forEach(function (id) {
                Env.folders[id].userObject.delete(resolved.folders[id], waitFor(function (err, _toUnpin) {
                    if (!Env.unpinPads || !_toUnpin) { return; }
                    Array.prototype.push.apply(toUnpin, _toUnpin);
                }));
            });
        }).nThen(function (waitFor) {
            if (!Env.unpinPads) { return; }

            // Deleted channels
            toUnpin = Util.deduplicateString(toUnpin);
            // Deleted channels that are still in another proxy
            var toKeep = [];
            _findChannels(Env, toUnpin).forEach(function (id) {
                var data = _getFileData(Env, id);
                var arr = [data.channel];
                if (data.answersChannel) { arr.push(data.answersChannel); }
                if (data.rtChannel) { arr.push(data.rtChannel); }
                if (data.lastVersion) { arr.push(Hash.hrefToHexChannelId(data.lastVersion)); }
                Array.prototype.push.apply(toKeep, arr);
            });
            // Compute the unpin list and unpin
            var unpinList = [];
            toUnpin.forEach(function (chan) {
                if (toKeep.indexOf(chan) === -1) {
                    unpinList.push(chan);

                    // Check if need need to restore a full hash (hidden hash deleted from drive)
                    Env.Store.checkDeletedPad(chan);
                }
            });

            Env.unpinPads(unpinList, waitFor(function (response) {
                if (response && response.error) { return console.error(response.error); }
            }));
        }).nThen(function () {
            cb();
        });
    };
    // Delete permanently some pads or folders
    var _deleteOwned = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePaths(Env, data.paths || []);
        if (!data.channel && !resolved.main.length && !Object.keys(resolved.folders).length) {
            return void cb({error: 'E_NOTFOUND'});
        }
        var toDelete = {
            main: [],
            folders: {}
        };
        var todo = function (channel, uo, p, _cb) {
            var cb = Util.once(Util.mkAsync(_cb));
            var chan = channel;
            if (!chan && uo) {
                var el = uo.find(p);
                if (!uo.isFile(el) && !uo.isSharedFolder(el)) { return; }
                var data = uo.isFile(el) ? uo.getFileData(el) : getSharedFolderData(Env, el);
                chan = data.channel;
            }
            // If the pad was a shared folder, delete it too and leave it
            var fId;
            Object.keys(Env.user.proxy[UserObject.SHARED_FOLDERS] || {}).some(function (id) {
                var sfData = Env.user.proxy[UserObject.SHARED_FOLDERS][id] || {};
                if (sfData.channel === chan) {
                    fId = Number(id);
                    Env.folders[id].deleting = true;
                    return true;
                }
            });
            Env.removeOwnedChannel(chan, function (obj) {
                // If the error is that the file is already removed, nothing to
                // report, it's a normal behavior (pad expired probably)
                if (obj && obj.error && obj.error !== "ENOENT") {
                    // RPC may not be responding
                    // Send a report that can be handled manually
                    if (fId && Env.folders[fId] && Env.folders[fId].deleting) {
                        delete Env.folders[fId].deleting;
                    }
                    Feedback.send('ERROR_DELETING_OWNED_PAD=' + chan + '|' + obj.error, true);
                    return void cb();
                }

                // No error: delete the pad and all its copies from our drive and shared folders
                var ids = _findChannels(Env, [chan]);

                // If the pad was a shared folder, delete it too and leave it
                if (fId) {
                    ids.push(fId);
                }

                if (!ids.length) {
                    toDelete = undefined;
                    return void cb();
                }

                ids.forEach(function (id) {
                    var paths = findFile(Env, id);
                    var _resolved = _resolvePaths(Env, paths);

                    Array.prototype.push.apply(toDelete.main, _resolved.main);
                    Object.keys(_resolved.folders).forEach(function (fId) {
                        if (toDelete.folders[fId]) {
                            Array.prototype.push.apply(toDelete.folders[fId], _resolved.folders[fId]);
                        } else {
                            toDelete.folders[fId] = _resolved.folders[fId];
                        }
                    });
                });
                cb();
            });
        };
        nThen(function (w) {
            // Delete owned pads from the server
            if (data.channel) {
                todo(data.channel, null, null, w());
            }
            resolved.main.forEach(function (p) {
                todo(null, Env.user.userObject, p, w());
            });
            Object.keys(resolved.folders).forEach(function (id) {
                var uo = Env.folders[id].userObject;
                resolved.folders[id].forEach(function (p) {
                    todo(null, uo, p, w());
                });
            });
        }).nThen(function () {
            if (!toDelete) {
                // Nothing to delete
                cb();
            } else {
                // Remove deleted pads from the drive
                _delete(Env, { resolved: toDelete }, cb);
            }
            // If we were using the access modal, send a refresh command
            if (data.channel) {
                Env.Store.refreshDriveUI();
            }
        });
    };

    // Empty the trash (main drive only)
    var _emptyTrash = function (Env, data, cb) {
        nThen(function (waitFor) {
            if (data && data.deleteOwned) {
                // Delete owned pads in the trash from the server
                var owned = Env.user.userObject.ownedInTrash(function (owners) {
                    return _ownedByMe(Env, owners);
                });
                var n = nThen;
                owned.forEach(function (chan) {
                    n = n(function (w) {
                        Env.removeOwnedChannel(chan, w(function (obj) {
                            setTimeout(w(), 50);
                            // If the error is that the file is already removed, nothing to
                            // report, it's a normal behavior (pad expired probably)
                            if (obj && obj.error && obj.error !== "ENOENT") {
                                // RPC may not be responding
                                // Send a report that can be handled manually
                                console.error(obj.error, chan);
                                Feedback.send('ERROR_EMPTYTRASH_OWNED=' + chan + '|' + obj.error, true);
                            }
                            console.warn('DELETED', chan);
                        }));
                    }).nThen;
                });
                n(waitFor());
            }

            // Empty the trash
            Env.user.userObject.emptyTrash(waitFor(function (err, toClean) {
                var nn = nThen;
                // Don't block nThen for the lower-priority tasks
                setTimeout(waitFor(function () {
                    // Unpin deleted pads if needed
                    // Check if we need to restore a full hash (hidden hash deleted from drive)
                    if (!Array.isArray(toClean)) { return; }
                    var done = waitFor();
                    var toCheck = Util.deduplicateString(toClean);
                    var toUnpin = [];
                    toCheck.forEach(function (channel) {
                        // Check unpin
                        nn = nn(function (w) {
                            var data = findChannel(Env, channel, true);
                            if (!data.length) { toUnpin.push(channel); }
                            // Check hidden hash, one at a time, asynchronously
                            Env.Store.checkDeletedPad(channel, w());
                        }).nThen;
                    });
                    nn(function () {
                        Env.unpinPads(toUnpin, function () {
                            done();
                        });
                    });
                }));
            }));
        }).nThen(cb);
    };
    // Rename files or folders
    var _rename = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        if (!resolved.id) {
            var el = Env.user.userObject.find(resolved.path);
            if (Env.user.userObject.isSharedFolder(el) && Env.folders[el]) {
                Env.folders[el].proxy.metadata.title = data.newName || Messages.fm_folder;
                Env.user.proxy[UserObject.SHARED_FOLDERS][el].lastTitle = data.newName || Messages.fm_folder;
                return void cb();
            }
        }
        resolved.userObject.rename(resolved.path, data.newName, cb);
    };
    var _setFolderData = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        if (!resolved.id) {
            var el = Env.user.userObject.find(resolved.path);
            if (Env.user.userObject.isSharedFolder(el) && Env.folders[el]) {
                Env.user.proxy[UserObject.SHARED_FOLDERS][el][data.key] = data.value;
                return void Env.onSync(cb);
            }
        }
        resolved.userObject.setFolderData(resolved.path, data.key, data.value, function () {
            Env.onSync(cb);
        });

    };

    var _updateStaticAccess = function (Env, id, cb) {
        var uo = _getUserObjectFromId(Env, id);
        var sd = uo.getFileData(id, true);
        sd.atime = +new Date();
        Env.onSync(cb);
    };

    var COMMANDS = {
        move: _move,
        restore: _restore,
        addFolder: _addFolder,
        addSharedFolder: _addSharedFolder,
        addLink: _addLink,
        restoreSharedFolder: _restoreSharedFolder,
        convertFolderToSharedFolder: _convertFolderToSharedFolder,
        delete: _delete,
        deleteOwned: _deleteOwned,
        emptyTrash: _emptyTrash,
        rename: _rename,
        setFolderData: _setFolderData,
        updateStaticAccess: _updateStaticAccess,
    };

    var onCommand = function (Env, cmdData, cb) {
        var cmd = cmdData.cmd;
        var data = cmdData.data || {};
        var method = COMMANDS[cmd];

        if (typeof(method) === 'function') {
            return void method(Env, data, cb);
        }
        // if the command was not handled then call back
        cb();
    };

    // Set the value everywhere the given pad is stored (main and shared folders)
    var setPadAttribute = function (Env, data, cb) {
        cb = cb || function () {};
        if (!data.attr || !data.attr.trim()) { return void cb("E_INVAL_ATTR"); }
        var sfId = Env.user.userObject.getSFIdFromHref(data.href);
        if (sfId) {
            if (data.attr === "href") {
                data.value = Env.user.userObject.cryptor.encrypt(data.value);
            }
            Env.user.proxy[UserObject.SHARED_FOLDERS][sfId][data.attr] = data.value;
        }
        var datas = findHref(Env, data.href);
        var nt = nThen;
        datas.forEach(function (d) {
            nt = nt(function (waitFor) {
                d.userObject.setPadAttribute(data.href, data.attr, data.value, waitFor());
            }).nThen;
        });
        nt(function () { cb(); });
    };
    // Get pad attribute must return only one value, even if the pad is stored in multiple places
    // (main or shared folders)
    // We're going to return the value with the most recent atime. The attributes may have been
    // updated in a shared folder by another user, so the most recent one is more likely to be the
    // correct one.
    // NOTE: we also return the atime, so that we can also check with each team manager
    var getPadAttribute = function (Env, data, cb) {
        cb = cb || function () {};
        var sfId = Env.user.userObject.getSFIdFromHref(data.href);
        if (sfId) {
            var sfData = getSharedFolderData(Env, sfId);
            var sfValue = data.attr ? sfData[data.attr] : JSON.parse(JSON.stringify(sfData));
            setTimeout(function () {
                cb(null, {
                    value: sfValue,
                    atime: 1
                });
            });
            return;
        }
        var datas = findHref(Env, data.href);
        var res = {};
        datas.forEach(function (d) {
            var atime = d.data.atime;

            var value = data.attr ? d.data[data.attr] : JSON.parse(JSON.stringify(d.data));
            if (!res.value || res.atime < atime) {
                res.atime = atime;
                res.value = value;
            }
        });
        setTimeout(function () {
            cb(null, res);
        });
    };

    var getTagsList = function (Env) {
        var list = {};
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            var l = uo.getTagsList();
            Object.keys(l).forEach(function (t) {
                list[t] = list[t] ? (list[t] + l[t]) : l[t];
            });
        });
        return list;
    };

    var getSecureFilesList = function (Env, where) {
        var userObjects = _getUserObjects(Env);
        var list = [];
        var channels = [];
        userObjects.forEach(function (uo) {
            var toPush = uo.getFiles(where).map(function (id) {
                return {
                    id: id,
                    data: uo.getFileData(id)
                };
            }).filter(function (d) {
                if (channels.indexOf(d.data.channel || d.id) === -1) {
                    channels.push(d.data.channel || d.id);
                    return true;
                }
            });
            Array.prototype.push.apply(list, toPush);
        });
        return list;
    };


    /*
        Store
    */

    var excludeInvalidIdentifiers = function (result) {
        return result.filter(function (channel) {
            if (typeof(channel) !== 'string') { return; }
            return [32, 48].indexOf(channel.length) !== -1;
        });
    };

    // Get the list of channels filtered by a type (expirable channels, owned channels, pin list)
    var getChannelsList = function (Env, type) {
        var result = [];
        var addChannel = function (userObject) {
            if (type === 'expirable') {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    if (!data) { return; }
                    // Don't push duplicates
                    if (result.indexOf(data.channel) !== -1) { return; }
                    // Return pads owned by someone else or expired by time
                    if (_ownedByOther(Env, data.owners) || (data.expire && data.expire < (+new Date()))) {
                        result.push(data.channel);
                    }
                };
            }
            if (type === 'owned') {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    if (!data) { return; }
                    // Don't push duplicates
                    if (result.indexOf(data.channel) !== -1) { return; }
                    // Return owned pads
                    if (_ownedByMe(Env, data.owners)) {
                        result.push(data.channel);
                    }
                };
            }
            if (type === "pin") {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    if (!data) { return; }
                    // Don't pin pads owned by someone else
                    //if (_ownedByOther(Env, data.owners)) { return; }
                    // Pin onlyoffice checkpoints
                    if (data.lastVersion) {
                        var otherChan = Hash.hrefToHexChannelId(data.lastVersion);
                        if (result.indexOf(otherChan) === -1) {
                            result.push(otherChan);
                        }
                    }
                    // Pin form answers channels
                    if (data.answersChannel && result.indexOf(data.answersChannel) === -1) {
                        result.push(data.answersChannel);
                    }
                    // Pin onlyoffice realtime patches
                    if (data.rtChannel && result.indexOf(data.rtChannel) === -1) {
                        result.push(data.rtChannel);
                    }
                    // Pin onlyoffice images
                    if (data.ooImages && Array.isArray(data.ooImages)) {
                        Array.prototype.push.apply(result, data.ooImages);
                    }
                    // Pin the pad
                    if (result.indexOf(data.channel) === -1) {
                        result.push(data.channel);
                    }
                };
            }
        };

        if (type === 'owned' && !Env.edPublic) { return excludeInvalidIdentifiers(result); }
        if (type === 'pin' && !Env.edPublic) { return excludeInvalidIdentifiers(result); }

        // Get the list of user objects
        var userObjects = _getUserObjects(Env);

        userObjects.forEach(function (uo) {
            var files = uo.getFiles([UserObject.FILES_DATA]);
            files.forEach(addChannel(uo));
        });

        // NOTE: expirable shared folder should be added here if we ever decide to enable them
        if (type === "owned") {
            var sfOwned = Object.keys(Env.user.proxy[UserObject.SHARED_FOLDERS]).filter(function (fId) {
                var owners = Env.user.proxy[UserObject.SHARED_FOLDERS][fId].owners;
                if (_ownedByMe(Env, owners)) { return true; }
            }).map(function (fId) {
                return Env.user.proxy[UserObject.SHARED_FOLDERS][fId].channel;
            });
            Array.prototype.push.apply(result, sfOwned);
        }
        if (type === "pin") {
            var sfChannels = Object.keys(Env.folders).map(function (fId) {
                try {
                    return Env.user.proxy[UserObject.SHARED_FOLDERS][fId].channel;
                } catch (err) {
                    console.error(err);
                }
            }).filter(Boolean);
            Array.prototype.push.apply(result, sfChannels);
        }

        return excludeInvalidIdentifiers(result);
    };

    var addPad = function (Env, path, pad, cb) {
        var uo = Env.user.userObject;
        var p = ['root'];
        if (path) {
            var resolved = _resolvePath(Env, path);
            uo = resolved.userObject;
            p = resolved.path;
        }
        var todo = function () {
            var error;
            nThen(function (waitFor) {
                uo.pushData(pad, waitFor(function (e, id) {
                    if (e) { error = e; return; }
                    uo.add(id, p);
                }));
            }).nThen(function () {
                cb(error);
            });
        };
        if (!Env.pinPads) { return void todo(); }
        let channels = [pad.channel];

        if (pad.rtChannel) { channels.push(pad.rtChannel); }
        if (pad.answersChannel) { channels.push(pad.answersChannel); }
        if (pad.lastVersion) {
            channels.push(Hash.hrefToHexChannelId(pad.lastVersion));
        }

        Env.pinPads(channels, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            todo();
        });
    };

    var create = function (proxy, data, uoConfig) {
        var Env = {
            pinPads: data.pin,
            unpinPads: data.unpin,
            onSync: data.onSync,
            Store: data.Store,
            store: data.store,
            removeOwnedChannel: data.removeOwnedChannel,
            loadSharedFolder: data.loadSharedFolder,
            cfg: uoConfig,
            edPublic: data.edPublic,
            settings: data.settings,
            user: {
                proxy: proxy,
            },
            folders: {}
        };

        uoConfig.removeProxy = function (id) {
            removeProxy(Env, id);
        };
        Env.user.userObject = UserObject.init(proxy, uoConfig);

        var callWithEnv = function (f) {
            return function () {
                [].unshift.call(arguments, Env);
                return f.apply(null, arguments);
            };
        };

        var addPin = function (pin, unpin) {
            Env.pinPads = pin;
            Env.unpinPads = unpin;
        };
        var removePin = function () {
            delete Env.pinPads;
            delete Env.unpinPads;
        };

        return {
            // Manager
            addProxy: callWithEnv(addProxy),
            removeProxy: callWithEnv(removeProxy),
            deprecateProxy: callWithEnv(deprecateProxy),
            restrictedProxy: callWithEnv(restrictedProxy),
            addSharedFolder: callWithEnv(_addSharedFolder),
            addPin: addPin,
            removePin: removePin,
            // Drive
            command: callWithEnv(onCommand),
            getPadAttribute: callWithEnv(getPadAttribute),
            setPadAttribute: callWithEnv(setPadAttribute),
            getTagsList: callWithEnv(getTagsList),
            getSecureFilesList: callWithEnv(getSecureFilesList),
            getSharedFolderData: callWithEnv(getSharedFolderData),
            // Store
            getChannelsList: callWithEnv(getChannelsList),
            addPad: callWithEnv(addPad),
            delete: callWithEnv(_delete),
            deleteOwned: callWithEnv(_deleteOwned),
            // Tools
            findChannel: callWithEnv(findChannel),
            findHref: callWithEnv(findHref),
            findFile: callWithEnv(findFile),
            getEditHash: callWithEnv(getEditHash),
            user: Env.user,
            folders: Env.folders
        };
    };

    /* =============================================================================
     * =============================================================================
     *                                  Inner only
     * =============================================================================
     * ============================================================================= */

    var renameInner = function (Env, path, newName, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "rename",
            data: {
                path: path,
                newName: newName
            }
        }, cb);
    };
    var moveInner = function (Env, paths, newPath, cb, copy) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "move",
            data: {
                paths: paths,
                newPath: newPath,
                copy: copy
            }
        }, cb);
    };
    var emptyTrashInner = function (Env, deleteOwned, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "emptyTrash",
            data: {
                deleteOwned: deleteOwned
            }
        }, cb);
    };
    var addFolderInner = function (Env, path, name, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "addFolder",
            data: {
                path: path,
                name: name
            }
        }, cb);
    };
    var addSharedFolderInner = function (Env, path, data, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "addSharedFolder",
            data: {
                path: path,
                name: data.name,
                owned: data.owned,
                password: data.password
            }
        }, cb);
    };
    var addLinkInner = function (Env, path, data, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "addLink",
            data: {
                path: path,
                name: data.name,
                href: data.url
            }
        }, cb);
    };
    var restoreSharedFolderInner = function (Env, fId, password, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "restoreSharedFolder",
            data: {
                id: fId,
                password: password
            }
        }, cb);
    };
    var convertFolderToSharedFolderInner = function (Env, path, owned, password, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "convertFolderToSharedFolder",
            data: {
                path: path,
                owned: owned,
                password: password
            }
        }, cb);
    };
    var deleteInner = function (Env, paths, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "delete",
            data: {
                paths: paths,
            }
        }, cb);
    };
    var deleteOwnedInner = function (Env, paths, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "deleteOwned",
            data: {
                paths: paths,
            }
        }, cb);
    };
    var restoreInner = function (Env, path, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "restore",
            data: {
                path: path
            }
        }, cb);
    };
    var setFolderDataInner = function (Env, data, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "setFolderData",
            data: data
        }, cb);
    };

    var updateStaticAccessInner = function (Env, id, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "updateStaticAccess",
            data: id
        }, cb);

    };

    /* Tools */

    var findChannels = _findChannels;
    var getFileData = _getFileData;
    var getUserObjectPath = _getUserObjectPath;

    var find = function (Env, path, fId) {
        if (fId) { return Env.folders[fId].userObject.find(path); }
        var resolved = _resolvePath(Env, path);
        return resolved.userObject.find(resolved.path);
    };

    var getTitle = function (Env, id, type) {
        var uo = _getUserObjectFromId(Env, id);
        return String(uo.getTitle(id, type));
    };

    var isStaticFile = function (Env, id) {
        var uo = _getUserObjectFromId(Env, id);
        return uo.isStaticFile(id);
    };

    var isReadOnlyFile = function (Env, id) {
        var uo = _getUserObjectFromId(Env, id);
        return uo.isReadOnlyFile(id);
    };

    var getFiles = function (Env, categories) {
        var files = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            Array.prototype.push.apply(files, uo.getFiles(categories));
        });
        files = Util.deduplicateString(files);
        return files;
    };

    var search = function (Env, value) {
        var ret = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            var fPath = _getUserObjectPath(Env, uo);
            var results = uo.search(value);
            if (!results.length) { return; }
            if (fPath) {
                // This is a shared folder, we have to fix the paths in the search results
                results.forEach(function (r) {
                    r.inSharedFolder = true;
                    r.paths.forEach(function (p) {
                        Array.prototype.unshift.apply(p, fPath);
                    });
                });
            }
            // Push the results from this proxy
            Array.prototype.push.apply(ret, results);
        });
        return ret;
    };

    var getRecentPads = function (Env) {
        var files = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            var data = uo.getFiles([UserObject.FILES_DATA, UserObject.STATIC_DATA]).map(function (id) {
                return [Number(id), uo.getFileData(id)];
            });
            Array.prototype.push.apply(files, data);
        });
        var sorted = files.filter(function (a) { return a[1].atime; })
            .sort(function (a,b) {
                return b[1].atime - a[1].atime;
            });
        return sorted;
        //return Env.user.userObject.getRecentPads();
    };
    var getOwnedPads = function (Env) {
        return Env.user.userObject.getOwnedPads(Env.edPublic);
    };

    var setHistoryMode = function (Env, flag) {
        Env.isHistoryMode = Boolean(flag);
    };

    var getFolderData = function (Env, path) {
        var resolved = _resolvePath(Env, path);
        if (!resolved || !resolved.userObject) { return {}; }
        if (!resolved.id) {
            var el = Env.user.userObject.find(resolved.path);
            if (Env.user.userObject.isSharedFolder(el)) {
                return getSharedFolderData(Env, el);
            }
        }
        var folder = resolved.userObject.find(resolved.path);
        return resolved.userObject.getFolderData(folder);
    };

    var isInSharedFolder = _isInSharedFolder;

    /* Generic: doesn't need access to a proxy */
    var isValidDrive = function (Env, obj) {
        return Env.user.userObject.isValidDrive(obj);
    };
    var isFile = function (Env, el, allowStr) {
        return Env.user.userObject.isFile(el, allowStr);
    };
    var isFolder = function (Env, el) {
        return Env.user.userObject.isFolder(el);
    };
    var isSharedFolder = function (Env, el) {
        return Env.user.userObject.isSharedFolder(el);
    };
    var isFolderEmpty = function (Env, el) {
        if (Env.folders[el]) {
            var uo = Env.folders[el].userObject;
            return uo.isFolderEmpty(uo.find[uo.ROOT]);
        }
        return Env.user.userObject.isFolderEmpty(el);
    };
    var isPathIn = function (Env, path, categories) {
        return Env.user.userObject.isPathIn(path, categories);
    };
    var isSubpath = function (Env, path, parentPath) {
        return Env.user.userObject.isSubpath(path, parentPath);
    };
    var isInTrashRoot = function (Env, path) {
        return Env.user.userObject.isInTrashRoot(path);
    };
    var comparePath = function (Env, a, b) {
        return Env.user.userObject.comparePath(a, b);
    };
    var hasSubfolder = function (Env, el, trashRoot) {
        if (Env.folders[el]) {
            var uo = Env.folders[el].userObject;
            return uo.hasSubfolder(uo.find[uo.ROOT]);
        }
        return Env.user.userObject.hasSubfolder(el, trashRoot);
    };
    var hasSubSharedFolder = function (Env, el) {
        return Env.user.userObject.hasSubSharedFolder(el);
    };
    var hasFile = function (Env, el, trashRoot) {
        if (Env.folders[el]) {
            var uo = Env.folders[el].userObject;
            return uo.hasFile(uo.find[uo.ROOT]);
        }
        return Env.user.userObject.hasFile(el, trashRoot);
    };
    var ownedInTrash = function (Env) {
        return Env.user.userObject.ownedInTrash(function (owners) {
            return _ownedByMe(Env, owners);
        });
    };

    var isDuplicateOwned = _isDuplicateOwned;

    var createInner = function (proxy, sframeChan, edPublic, uoConfig) {
        var Env = {
            cfg: uoConfig,
            sframeChan: sframeChan,
            edPublic: edPublic,
            user: {
                proxy: proxy,
                userObject: UserObject.init(proxy, uoConfig)
            },
            folders: {}
        };

        var callWithEnv = function (f) {
            return function () {
                [].unshift.call(arguments, Env);
                return f.apply(null, arguments);
            };
        };

        return {
            // Manager
            addProxy: callWithEnv(addProxy),
            removeProxy: callWithEnv(removeProxy),
            setHistoryMode: callWithEnv(setHistoryMode),
            // Drive RPC commands
            rename: callWithEnv(renameInner),
            move: callWithEnv(moveInner),
            emptyTrash: callWithEnv(emptyTrashInner),
            addFolder: callWithEnv(addFolderInner),
            addSharedFolder: callWithEnv(addSharedFolderInner),
            addLink: callWithEnv(addLinkInner),
            restoreSharedFolder: callWithEnv(restoreSharedFolderInner),
            convertFolderToSharedFolder: callWithEnv(convertFolderToSharedFolderInner),
            delete: callWithEnv(deleteInner),
            deleteOwned: callWithEnv(deleteOwnedInner),
            restore: callWithEnv(restoreInner),
            setFolderData: callWithEnv(setFolderDataInner),
            updateStaticAccess: callWithEnv(updateStaticAccessInner),
            // Tools
            getFileData: callWithEnv(getFileData),
            find: callWithEnv(find),
            getTitle: callWithEnv(getTitle),
            isReadOnlyFile: callWithEnv(isReadOnlyFile),
            isStaticFile: callWithEnv(isStaticFile),
            getFiles: callWithEnv(getFiles),
            search: callWithEnv(search),
            getRecentPads: callWithEnv(getRecentPads),
            getOwnedPads: callWithEnv(getOwnedPads),
            getTagsList: callWithEnv(getTagsList),
            findFile: callWithEnv(findFile),
            findFiles: callWithEnv(findFiles),
            findChannels: callWithEnv(findChannels),
            getSharedFolderData: callWithEnv(getSharedFolderData),
            getFolderData: callWithEnv(getFolderData),
            isInSharedFolder: callWithEnv(isInSharedFolder),
            getUserObjectPath: callWithEnv(getUserObjectPath),
            isDuplicateOwned: callWithEnv(isDuplicateOwned),
            ownedInTrash: callWithEnv(ownedInTrash),
            // Generic
            isValidDrive: callWithEnv(isValidDrive),
            isFile: callWithEnv(isFile),
            isFolder: callWithEnv(isFolder),
            isSharedFolder: callWithEnv(isSharedFolder),
            isFolderEmpty: callWithEnv(isFolderEmpty),
            isPathIn: callWithEnv(isPathIn),
            isSubpath: callWithEnv(isSubpath),
            isInTrashRoot: callWithEnv(isInTrashRoot),
            comparePath: callWithEnv(comparePath),
            hasSubfolder: callWithEnv(hasSubfolder),
            hasSubSharedFolder: callWithEnv(hasSubSharedFolder),
            hasFile: callWithEnv(hasFile),
            // Data
            user: Env.user,
            folders: Env.folders
        };
    };

    return {
        setCustomize,
        create: create,
        createInner: createInner
    };
};

if (typeof(module) !== 'undefined' && module.exports) {
    // We don't need Messages in worker or node
    module.exports = factory(
        require('./user-object'),
        require('./common-util'),
        require('./common-hash'),
        require('../worker/components/sharedfolder'),
        undefined,
        require('./common-feedback'),
        require('nthen')
    );
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/common/user-object.js',
        '/common/common-util.js',
        '/common/common-hash.js',
        '/common/outer/sharedfolder.js',
        '/customize/messages.js',
        '/common/common-feedback.js',
        '/components/nthen/index.js',
    ], factory);
} else {
    // unsupported initialization
}

})();
