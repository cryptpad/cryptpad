define([
    '/common/userObject.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/bower_components/nthen/index.js',
], function (UserObject, Util, Hash, nThen) {


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
        ret.push({
            data: Env.user.userObject.getFileData(id),
            userObject: Env.user.userObject
        });
        Object.keys(Env.folders).forEach(function (fId) {
            var id = Env.folders[fId].userObject.getIdFromHref(href);
            ret.push({
                fId: fId,
                data: Env.folders[fId].userObject.getFileData(id),
                userObject: Env.folders[fId].userObject
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

    // Get a copy of the elements located in the given paths, with their files data
    var _getCopyFromPaths = function (paths, userObject) {
        var data = [];
        paths.forEach(function (path) {
            var el = userObject.find(path);
            var files = [];

            // Get the files ID from the current path (file or folder)
            if (userObject.isFile(el)) {
                files.push(el);
            } else {
                userObject.getFilesRecursively(el, files);
            }

            // Remove the shared folder from this list of files ID
            files.filter(function (f) { return !userObject.isSharedFolder(f); });
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
                data: filesData
            });
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

        if (!newResolved.userObject.isFolder(newResolved.path)) { return void cb(); } // XXX

        nThen(function (waitFor) {
            if (resolved.main.length) {
                // Move from the main drive
                if (!newResolved.id) {
                    // Move from the main drive to the main drive
                    Env.user.userObject.move(resolved.main, newResolved.path, waitFor());
                } else {
                    // Move from the main drive to a shared folder

                    // Copy the elements to the new location
                    var toCopy = _getCopyFromPaths(resolved.main, Env.user.userObject);
                    var newUserObject = newResolved.userObject;
                    var ownedPads = [];
                    toCopy.forEach(function (obj) {
                        newUserObject.copyFromOtherDrive(newResolved.path, obj.el, obj.data);
                        var _owned = Object.keys(obj.data).filter(function (id) {
                            var owners = obj.data[id].owners;
                            return Array.isArray(owners) && owners.indexOf(Env.edPublic) !== -1;
                        });
                        Array.prototype.push.apply(ownedPads, _owned);
                    });

                    var rootPath = resolved.main[0].slice();
                    rootPath.pop();
                    ownedPads = Util.deduplicateString(ownedPads);
                    ownedPads.forEach(function (id) {
                        Env.user.userObject.add(Number(id), rootPath);
                    });

                    // Remove the elements from the old location (without unpinning)
                    Env.user.userObject.delete(resolved.main, waitFor());
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
                        var toCopy = _getCopyFromPaths(paths, uoFrom);
                        toCopy.forEach(function (obj) {
                            uoTo.copyFromOtherDrive(newResolved.path, obj.el, obj.data);
                        });

                        // Remove the elements from the old location (without unpinning)
                        uoFrom.delete(paths, waitFor());
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
    // Add a folder/subfolder
    var _addSharedFolder = function (Env, data, cb) {
        console.log(data);
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
            var hash = Hash.createRandomHash('drive');
            var href = '/drive/#' + hash;
            var secret = Hash.getSecrets('drive', hash);
            folderData = {
                href: href,
                roHref: '/drive/#' + Hash.getViewHashFromKeys(secret),
                channel: secret.channel,
                ctime: +new Date()
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
                if (data.name && !rt.proxy.metadata) { // Creating a new shared folder
                    rt.proxy.metadata = {title: data.name};
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
    // Delete permanently some pads or folders
    var _delete = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePaths(Env, data.paths);
        if (!resolved.main.length && !Object.keys(resolved.folders).length) {
            return void cb({error: 'E_NOTFOUND'});
        }

        var toUnpin = [];
        nThen(function (waitFor)  {
            if (resolved.main.length) {
                Env.user.userObject.delete(resolved.main, waitFor(function (err, _toUnpin) {
                    if (!Env.unpinPads || !_toUnpin) { return; }
                    Array.prototype.push.apply(toUnpin, _toUnpin);
                }), data.nocheck, data.isOwnPadRemoved);
            }
            Object.keys(resolved.folders).forEach(function (id) {
                Env.folders[id].userObject.delete(resolved.folders[id], waitFor(function (err, _toUnpin) {
                    if (!Env.unpinPads || !_toUnpin) { return; }
                    Array.prototype.push.apply(toUnpin, _toUnpin);
                }), data.nocheck, data.isOwnPadRemoved);
            });
        }).nThen(function (waitFor) {
            if (!Env.unpinPads) { return; }

            // Deleted channels
            toUnpin = Util.deduplicateString(toUnpin);
            // Deleted channels that are still in another proxy
            var toKeep = _findChannels(Env, toUnpin).map(function (id) {
                return _getFileData(Env, id).channel;
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
            case 'delete':
                _delete(Env, data, cb); break;
            case 'emptyTrash':
                _emptyTrash(Env, data, cb); break;
            case 'rename':
                _rename(Env, data, cb); break;
            default:
                cb();
        }
    };

    // Set the value everywhere the given pad is stored (main and shared folders)
    var setPadAttribute = function (Env, data, cb) {
        cb = cb || function () {};
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
        var datas = findHref(Env, data.href);
        var nt = nThen;
        var res = {};
        datas.forEach(function (d) {
            nt = nt(function (waitFor) {
                var atime, value;
                var w = waitFor();
                nThen(function (waitFor2) {
                    d.userObject.getPadAttribute(data.href, 'atime', waitFor2(function (err, v) {
                        atime = v;
                    }));
                    d.userObject.getPadAttribute(data.href, data.attr, waitFor2(function (err, v) {
                        value = v;
                    }));
                }).nThen(function () {
                    if (!res.value || res.atime < atime) {
                        res.atime = atime;
                        res.value = value;
                    }
                    w();
                });
            }).nThen;
        });
        nt(function () { cb(null, res.value); });
    };

    var getTagsList = function (Env) {
        var list = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            Array.prototype.push.apply(list, uo.getTagsList());
        });
        list = Util.deduplicateString(list);
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
    var getChannelsList = function (Env, edPublic, type) {
        //if (!edPublic) { return; }
        var result = [];
        var addChannel = function (userObject) {
            if (type === 'expirable') {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    // Don't push duplicates
                    if (result.indexOf(data.channel) !== -1) { return; }
                    // Return pads owned by someone else or expired by time
                    if ((data.owners && data.owners.length && (!edPublic || data.owners.indexOf(edPublic) === -1))
                        || (data.expire && data.expire < (+new Date()))) {
                        result.push(data.channel);
                    }
                };
            }
            if (type === 'owned') {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    // Don't push duplicates
                    if (result.indexOf(data.channel) !== -1) { return; }
                    // Return owned pads
                    if (Array.isArray(data.owners) && data.owners.length &&
                        data.owners.indexOf(edPublic) !== -1) {
                        result.push(data.channel);
                    }
                };
            }
            if (type === "pin") {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    // Don't pin pads owned by someone else
                    if (Array.isArray(data.owners) && data.owners.length &&
                        data.owners.indexOf(edPublic) === -1) { return; }
                    // Don't push duplicates
                    if (result.indexOf(data.channel) === -1) {
                        result.push(data.channel);
                    }
                };
            }
        };

        if (type === 'owned' && !edPublic) { return result; }
        if (type === 'pin' && !edPublic) { return result; }

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
                if (Array.isArray(owners) && owners.length &&
                    owners.indexOf(edPublic) !== -1) { return true; }
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
            console.log('here');
            uo.pushData(pad, function (e, id) {
                if (e) { return void cb(e); }
                console.log(id, p);
                uo.add(id, p);
                cb();
            });
        };
        if (!Env.pinPads) { return void todo(); }
        Env.pinPads([pad.channel], function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            todo();
        });
    };

    var create = function (proxy, edPublic, pinPads, unpinPads, loadSf, uoConfig) {
        var Env = {
            pinPads: pinPads,
            unpinPads: unpinPads,
            loadSharedFolder: loadSf,
            cfg: uoConfig,
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
            user: Env.user,
            folders: Env.folders
        };
    };

    /*
        Inner only
    */

    var renameInner = function (Env, path, newName, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "rename",
            data: {
                path: path,
                newName: newName
            }
        }, cb);
    };
    var moveInner = function (Env, paths, newPath, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "move",
            data: {
                paths: paths,
                newPath: newPath
            }
        }, cb);
    };
    var emptyTrashInner = function (Env, cb) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "emptyTrash"
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
        console.log(data);
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
    var deleteInner = function (Env, paths, cb, nocheck, isOwnPadRemoved, noUnpin) {
        return void Env.sframeChan.query("Q_DRIVE_USEROBJECT", {
            cmd: "delete",
            data: {
                paths: paths,
                nocheck: nocheck,
                noUnpin: noUnpin,
                isOwnPadRemoved: isOwnPadRemoved
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

    /* Tools */

    var findChannels = _findChannels;
    var getFileData = _getFileData;

    var find = function (Env, path) {
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
            if (fPath) {
                // This is a shared folder, we have to fix the paths in the search results
                results = results.map(function (r) {
                    r.paths.map(function (p) {
                        Array.prototype.unshift.apply(p, fPath);
                    });
                });
            }
            // Push the results from this proxy
            Array.prototype.push.apply(ret, results);
        });
        return ret;
    };

    var findFile = function (Env, id) {
        var ret = [];
        var userObjects = _getUserObjects(Env);
        userObjects.forEach(function (uo) {
            var fPath = _getUserObjectPath(Env, uo);
            var results = uo.findFile(id);
            if (fPath) {
                // This is a shared folder, we have to fix the paths in the results
                results = results.map(function (p) {
                    Array.prototype.unshift.apply(p, fPath);
                });
            }
            // Push the results from this proxy
            Array.prototype.push.apply(ret, results);
        });
        return ret;
    };

    var getRecentPads = function (Env) {
        return Env.user.userObject.getRecentPads();
    };
    var getOwnedPads = function (Env, edPublic) {
        return Env.user.userObject.getOwnedPads(edPublic);
    };

    var getSharedFolderData = function (Env, id) {
        if (!Env.folders[id]) { return; }
        var obj = Env.folders[id].proxy.metadata || {};
        for (var k in Env.user.proxy[UserObject.SHARED_FOLDERS][id] || {}) {
            obj[k] = Env.user.proxy[UserObject.SHARED_FOLDERS][id][k];
        }
        return obj;
    };

    var isInSharedFolder = function (Env, path) {
        var resolved = _resolvePath(Env, path);
        return typeof resolved.id === "number";
    };

    /* Generic: doesn't need access to a proxy */
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
    var hasFile = function (Env, el, trashRoot) {
        if (Env.folders[el]) {
            var uo = Env.folders[el].userObject;
            return uo.hasFile(uo.find[uo.ROOT]);
        }
        return Env.user.userObject.hasFile(el, trashRoot);
    };

    var createInner = function (proxy, sframeChan, uoConfig) {
        var Env = {
            cfg: uoConfig,
            sframeChan: sframeChan,
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
            delete: callWithEnv(deleteInner),
            restore: callWithEnv(restoreInner),
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
            isInSharedFolder: callWithEnv(isInSharedFolder),
            // Generic
            isFile: callWithEnv(isFile),
            isFolder: callWithEnv(isFolder),
            isSharedFolder: callWithEnv(isSharedFolder),
            isFolderEmpty: callWithEnv(isFolderEmpty),
            isPathIn: callWithEnv(isPathIn),
            isSubpath: callWithEnv(isSubpath),
            isinTrashRoot: callWithEnv(isInTrashRoot),
            comparePath: callWithEnv(comparePath),
            hasSubfolder: callWithEnv(hasSubfolder),
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
