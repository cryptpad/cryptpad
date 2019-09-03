define([
    '/common/userObject.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
], function (UserObject, Util, Hash, Messages, nThen) {


    var getConfig = function (Env) {
        var cfg = {};
        for (var k in Env.cfg) { cfg[k] = Env.cfg[k]; }
        return cfg;
    };

    // Add a shared folder to the list
    var addProxy = function (Env, id, proxy, leave) {
        var cfg = getConfig(Env);
        cfg.sharedFolder = true;
        cfg.id = id;
        var userObject = UserObject.init(proxy, cfg);
        if (userObject.fixFiles) {
            // Only in outer
            userObject.fixFiles();
        }
        Env.folders[id] = {
            proxy: proxy,
            userObject: userObject,
            leave: leave
        };
        return userObject;
    };

    // TODO: Remove a shared folder from the list
    var removeProxy = function (Env, id) {
        var f = Env.folders[id];
        if (!f) { return; }
        f.leave();
        delete Env.folders[id];
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
    var findChannel = function (Env, channel) {
        var ret = [];
        Env.user.userObject.findChannels([channel]).forEach(function (id) {
            ret.push({
                data: Env.user.userObject.getFileData(id),
                userObject: Env.user.userObject
            });
        });
        Object.keys(Env.folders).forEach(function (fId) {
            Env.folders[fId].userObject.findChannels([channel]).forEach(function (id) {
                ret.push({
                    fId: fId,
                    data: Env.folders[fId].userObject.getFileData(id),
                    userObject: Env.folders[fId].userObject
                });
            });
        });
        return ret;
    };
    // Return files data objects associated to a given href for setPadAttribute...
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
        userObjects.forEach(function (uo) {
            var fPath = _getUserObjectPath(Env, uo);
            var results = uo.findFile(id);
            if (fPath) {
                // This is a shared folder, we have to fix the paths in the results
                results.forEach(function (p) {
                    Array.prototype.unshift.apply(p, fPath);
                });
            }
            // Push the results from this proxy
            Array.prototype.push.apply(ret, results);
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

    var _getFileData = function (Env, id) {
        var userObjects = _getUserObjects(Env);
        var data = {};
        userObjects.some(function (uo) {
            data = uo.getFileData(id);
            if (Object.keys(data).length) { return true; }
        });
        return data;
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
                    userObject: Env.folders[current].userObject,
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

            // TODO RO
            // Encrypt  or decrypt edit link here
            // filesData.forEach(function (d) { d.href = encrypt(d.href); });


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
                    var ownedPads = [];
                    toCopy.forEach(function (obj) {
                        newUserObject.copyFromOtherDrive(newResolved.path, obj.el, obj.data, obj.key);
                        var _owned = Object.keys(obj.data).filter(function (id) {
                            var owners = obj.data[id].owners;
                            return _ownedByMe(Env, owners);
                        });
                        Array.prototype.push.apply(ownedPads, _owned);
                    });

                    if (copy) { return; }

                    if (resolved.main.length) {
                        var rootPath = resolved.main[0].slice();
                        rootPath.pop();
                        ownedPads = Util.deduplicateString(ownedPads);
                        ownedPads.forEach(function (id) {
                            Env.user.userObject.add(Number(id), rootPath);
                        });

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
                ctime: +new Date(),
            };
            if (data.password) { folderData.password = data.password; }
            if (data.owned) { folderData.owners = [Env.edPublic]; }
        }).nThen(function (waitFor) {
            Env.pinPads([folderData.channel], waitFor());
        }).nThen(function (waitFor) {
            // 1. add the shared folder to our list of shared folders
            Env.user.userObject.pushSharedFolder(folderData, waitFor(function (err, folderId) {
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
            Env.loadSharedFolder(id, folderData, waitFor(function (rt, metadata) {
                if (!rt.proxy.metadata) { // Creating a new shared folder
                    rt.proxy.metadata = { title: data.name || Messages.fm_newFolder };
                }
                // If we're importing a folder, check its serverside metadata
                if (data.folderData && metadata) {
                    var fData = Env.user.proxy[UserObject.SHARED_FOLDERS][id];
                    if (metadata.owners) { fData.owners = metadata.owners; }
                    if (metadata.expire) { fData.expire = +metadata.expire; }
                }
            }));
        }).nThen(function () {
            cb(id);
        });
    };

    // convert a folder to a Shared Folder
    var _convertFolderToSharedFolder = function (Env, data, cb) {
        return void cb({
            error: 'DISABLED'
        }); // XXX CONVERT
        /*var path = data.path;
        var folderElement = Env.user.userObject.find(path);
        // don't try to convert top-level elements (trash, root, etc) to shared-folders
        // TODO also validate that you're in root (not templates, etc)
        if (data.path.length <= 1) {
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
                cb();
            });
        });*/
    };

    // Delete permanently some pads or folders
    var _delete = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePaths(Env, data.paths);
        if (!resolved.main.length && !Object.keys(resolved.folders).length) {
            return void cb({error: 'E_NOTFOUND'});
        }

        var toUnpin = [];
        var ownedRemoved;
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
                uo.delete(resolved.main, waitFor(function (err, _toUnpin, _ownedRemoved) {
                    ownedRemoved = _ownedRemoved;
                    if (!Env.unpinPads || !_toUnpin) { return; }
                    Array.prototype.push.apply(toUnpin, _toUnpin);
                }));
            }
        }).nThen(function (waitFor) {
            // Check if removed owned pads are duplicated in some shared folders
            // If that's the case, we have to remove them from the shared folders too
            // We can do that by adding their paths to the list of pads to remove from shared folders
            if (ownedRemoved) {
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
            }
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
                if (data.rtChannel) { arr.push(data.rtChannel); }
                if (data.lastVersion) { arr.push(Hash.hrefToHexChannelId(data.lastVersion)); }
                Array.prototype.push.apply(toKeep, arr);
            });
            // Compute the unpin list and unpin
            var unpinList = [];
            toUnpin.forEach(function (chan) {
                if (toKeep.indexOf(chan) === -1) {
                    unpinList.push(chan);
                }
            });

            Env.unpinPads(unpinList, waitFor(function (response) {
                if (response && response.error) { return console.error(response.error); }
            }));
        }).nThen(function () {
            cb();
        });
    };
    // Empty the trash (main drive only)
    var _emptyTrash = function (Env, data, cb) {
        Env.user.userObject.emptyTrash(cb);
    };
    // Rename files or folders
    var _rename = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePath(Env, data.path);
        if (!resolved || !resolved.userObject) { return void cb({error: 'E_NOTFOUND'}); }
        if (!resolved.id) {
            var el = Env.user.userObject.find(resolved.path);
            if (Env.user.userObject.isSharedFolder(el) && Env.folders[el]) {
                Env.folders[el].proxy.metadata.title = data.newName;
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
    var onCommand = function (Env, cmdData, cb) {
        var cmd = cmdData.cmd;
        var data = cmdData.data || {};
        switch (cmd) {
            case 'move':
                _move(Env, data, cb); break;
            case 'restore':
                _restore(Env, data, cb); break;
            case 'addFolder':
                _addFolder(Env, data, cb); break;
            case 'addSharedFolder':
                _addSharedFolder(Env, data, cb); break;
            case 'convertFolderToSharedFolder':
                _convertFolderToSharedFolder(Env, data, cb); break;
            case 'delete':
                _delete(Env, data, cb); break;
            case 'emptyTrash':
                _emptyTrash(Env, data, cb); break;
            case 'rename':
                _rename(Env, data, cb); break;
            case 'setFolderData':
                _setFolderData(Env, data, cb); break;
            default:
                cb();
        }
    };

    // Set the value everywhere the given pad is stored (main and shared folders)
    var setPadAttribute = function (Env, data, cb) {
        cb = cb || function () {};
        if (!data.attr || !data.attr.trim()) { return void cb("E_INVAL_ATTR"); }
        var sfId = Env.user.userObject.getSFIdFromHref(data.href);
        if (sfId) {
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
    var getPadAttribute = function (Env, data, cb) {
        cb = cb || function () {};
        var sfId = Env.user.userObject.getSFIdFromHref(data.href);
        if (sfId) {
            return void cb(null, Env.user.proxy[UserObject.SHARED_FOLDERS][sfId][data.attr]);
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
        cb(null, res.value);
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
                if (channels.indexOf(d.data.channel) === -1) {
                    channels.push(d.data.channel);
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
                    if (_ownedByOther(Env, data.owners)) { return; }
                    // Don't push duplicates
                    if (data.lastVersion) {
                        var otherChan = Hash.hrefToHexChannelId(data.lastVersion);
                        if (result.indexOf(otherChan) === -1) {
                            result.push(otherChan);
                        }
                    }
                    if (data.rtChannel && result.indexOf(data.rtChannel) === -1) {
                        result.push(data.rtChannel);
                    }
                    if (result.indexOf(data.channel) === -1) {
                        result.push(data.channel);
                    }
                };
            }
        };

        if (type === 'owned' && !Env.edPublic) { return result; }
        if (type === 'pin' && !Env.edPublic) { return result; }

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
                return Env.user.proxy[UserObject.SHARED_FOLDERS][fId].channel;
            });
            Array.prototype.push.apply(result, sfChannels);
        }

        return result;
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
                if (uo.id && _ownedByMe(Env, pad.owners)) {
                    // Creating an owned pad in a shared folder:
                    // We must add a copy in the user's personnal drive
                    Env.user.userObject.pushData(pad, waitFor(function (e, id) {
                        if (e) { error = e; return; }
                        Env.user.userObject.add(id, ['root']);
                    }));
                }
            }).nThen(function () {
                cb(error);
            });
        };
        if (!Env.pinPads) { return void todo(); }
        Env.pinPads([pad.channel], function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            todo();
        });
    };

    var create = function (proxy, data, uoConfig) {
        var Env = {
            pinPads: data.pin,
            unpinPads: data.unpin,
            onSync: data.onSync,
            loadSharedFolder: data.loadSharedFolder,
            cfg: uoConfig,
            edPublic: data.edPublic,
            settings: data.settings,
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
            // Drive
            command: callWithEnv(onCommand),
            getPadAttribute: callWithEnv(getPadAttribute),
            setPadAttribute: callWithEnv(setPadAttribute),
            getTagsList: callWithEnv(getTagsList),
            getSecureFilesList: callWithEnv(getSecureFilesList),
            // Store
            getChannelsList: callWithEnv(getChannelsList),
            addPad: callWithEnv(addPad),
            // Tools
            findChannel: callWithEnv(findChannel),
            findHref: callWithEnv(findHref),
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
    var emptyTrashInner = function (Env, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "emptyTrash",
            data: null
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
        return uo.getTitle(id, type);
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
            var data = uo.getFiles([UserObject.FILES_DATA]).map(function (id) {
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

    var getSharedFolderData = function (Env, id) {
        if (!Env.folders[id]) { return {}; }
        var obj = Env.folders[id].proxy.metadata || {};
        for (var k in Env.user.proxy[UserObject.SHARED_FOLDERS][id] || {}) {
            obj[k] = Env.user.proxy[UserObject.SHARED_FOLDERS][id][k];
        }
        return obj;
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
            // Drive RPC commands
            rename: callWithEnv(renameInner),
            move: callWithEnv(moveInner),
            emptyTrash: callWithEnv(emptyTrashInner),
            addFolder: callWithEnv(addFolderInner),
            addSharedFolder: callWithEnv(addSharedFolderInner),
            convertFolderToSharedFolder: callWithEnv(convertFolderToSharedFolderInner),
            delete: callWithEnv(deleteInner),
            restore: callWithEnv(restoreInner),
            setFolderData: callWithEnv(setFolderDataInner),
            // Tools
            getFileData: callWithEnv(getFileData),
            find: callWithEnv(find),
            getTitle: callWithEnv(getTitle),
            isReadOnlyFile: callWithEnv(isReadOnlyFile),
            getFiles: callWithEnv(getFiles),
            search: callWithEnv(search),
            getRecentPads: callWithEnv(getRecentPads),
            getOwnedPads: callWithEnv(getOwnedPads),
            getTagsList: callWithEnv(getTagsList),
            findFile: callWithEnv(findFile),
            findChannels: callWithEnv(findChannels),
            getSharedFolderData: callWithEnv(getSharedFolderData),
            getFolderData: callWithEnv(getFolderData),
            isInSharedFolder: callWithEnv(isInSharedFolder),
            getUserObjectPath: callWithEnv(getUserObjectPath),
            isDuplicateOwned: callWithEnv(isDuplicateOwned),
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
        create: create,
        createInner: createInner
    };
});
