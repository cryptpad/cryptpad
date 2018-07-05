define([
    '/common/userObject.js',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
], function (UserObject, Util, nThen) {


    var getConfig = function (Env) {
        var cfg = {};
        for (var k in Env.cfg) { cfg[k] = Env[k]; }
        return cfg;
    };

    // Add a shared folder to the list
    var addProxy = function (Env, id, proxy, leave) {
        var cfg = getConfig();
        cfg.sharedFolder = true;
        cfg.id = id;
        var userObject = UserObject.init(proxy, Env.cfg);
        userObject.fixFiles();
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
        for (var i=2; i<=path.length; i++) {
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
            Util.deduplicateString(files);

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
                    newUserObject.copyFromOtherDrive(newResolved.path, toCopy.el, toCopy.data);

                    // Filter owned pads so that we won't remove them from our drive
                    var toRemove = resolved.main.slice();
                    toRemove.filter(function (id) {
                        var owners = Env.user.userObject.getFileData(id).owners;
                        return !Array.isArray(owners) || owners.indexOf(Env.edPublic) === -1;
                    });

                    // Remove the elements from the old location (without unpinning)
                    Env.user.userObject.delete(resolved.main, waitFor(), false, false, true);
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
                        uoTo.copyFromOtherDrive(newResolved.path, toCopy.el, toCopy.data);

                        // Remove the elements from the old location (without unpinning)
                        uoFrom.delete(paths, waitFor(), false, false, true);
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
        resolved.userObject.addFolder(resolved.path, data.name, cb);
    };
    // Delete permanently some pads or folders
    var _delete = function (Env, data, cb) {
        data = data || {};
        var resolved = _resolvePaths(Env, data.paths);
        if (!resolved.main.length && !Object.keys(resolved.folders).length) {
            return void cb({error: 'E_NOTFOUND'});
        }
        nThen(function (waitFor)  {
            if (resolved.main.length) {
                Env.user.userObject.delete(resolved.main, waitFor(), data.nocheck,
                                           data.isOwnPadRemoved);
            }
            Object.keys(resolved.folders).forEach(function (id) {
                Env.folders[id].userObject.delete(resolved.folders[id], waitFor(), data.nocheck,
                                                  data.isOwnPadRemoved);
            });
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
        resolved.userObject.rename(resolved.path, data.newName, cb);
    };
    var onCommand = function (Env, cmdData, cb) {
        var cmd = cmdData.cmd;
        var data = cmdData.data || {};
        switch (cmd) {
            case 'move':
                _move(Env, data, cb); break;
                //store.userObject.move(data.paths, data.newPath, cb2); break;
            case 'restore':
                _restore(Env, data, cb); break;
            case 'addFolder':
                _addFolder(Env, data, cb); break;
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
        Util.deduplicateString(list);
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
        if (!edPublic) { return; }
        var result = [];
        var addChannel = function (userObject) {
            if (type === 'expirable') {
                return function (fileId) {
                    var data = userObject.getFileData(fileId);
                    // Don't push duplicates
                    if (result.indexOf(data.channel) !== -1) { return; }
                    // Return pads owned by someone else or expired by time
                    if ((data.owners && data.owners.length && data.owners.indexOf(edPublic) === -1) ||
                        (data.expire && data.expire < (+new Date()))) {
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
        };

        // Get the list of user objects
        var userObjects = _getUserObjects(Env);

        userObjects.forEach(function (uo) {
            var files = uo.getFiles([UserObject.FILES_DATA]);
            files.forEach(addChannel(uo));
        });

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
        uo.pushData(pad, function (e, id) {
            if (e) { return void cb(e); }
            uo.add(id, p);
            cb();
        });
    };

    var create = function (proxy, edPublic, uoConfig) {
        var Env = {
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

    return {
        create: create
    };
});
