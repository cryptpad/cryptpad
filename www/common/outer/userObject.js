define([
    '/customize/application_config.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/customize/messages.js'
], function (AppConfig, Util, Hash, Realtime, Messages) {
    var module = {};

    var clone = function (o) {
        try { return JSON.parse(JSON.stringify(o)); }
        catch (e) { return undefined; }
    };

    module.init = function (config, exp, files) {
        var loggedIn = config.loggedIn;
        var sharedFolder = config.sharedFolder;

        var readOnly = config.readOnly;

        var ROOT = exp.ROOT;
        var FILES_DATA = exp.FILES_DATA;
        var OLD_FILES_DATA = exp.OLD_FILES_DATA;
        var UNSORTED = exp.UNSORTED;
        var TRASH = exp.TRASH;
        var TEMPLATE = exp.TEMPLATE;
        var SHARED_FOLDERS = exp.SHARED_FOLDERS;
        var SHARED_FOLDERS_TEMP = exp.SHARED_FOLDERS_TEMP;

        var debug = exp.debug;

        exp._setReadOnly = function (state) {
            readOnly = state;
            if (!readOnly) { exp.fixFiles(); }
        };

        exp.setHref = function (channel, id, href) {
            if (!id && !channel) { return; }
            if (readOnly) { return; }
            var ids = id ? [id] : exp.findChannels([channel]);
            ids.forEach(function (i) {
                var data = exp.getFileData(i, true);
                var oldHref = exp.getHref(data);
                if (oldHref === href) { return; }
                data.href = exp.cryptor.encrypt(href);
            });
        };

        exp.setPadAttribute = function (href, attr, value, cb) {
            cb = cb || function () {};
            if (readOnly) { return void cb('EFORBIDDEN'); }
            var id = exp.getIdFromHref(href);
            if (!id) { return void cb("E_INVAL_HREF"); }
            if (!attr || !attr.trim()) { return void cb("E_INVAL_ATTR"); }
            var data = exp.getFileData(id, true);
            if (attr === "href") {
                exp.setHref(null, id, value);
            } else {
                data[attr] = clone(value);
            }
            cb(null);
        };
        exp.getPadAttribute = function (href, attr, cb) {
            cb = cb || function () {};
            var id = exp.getIdFromHref(href);
            if (!id) { return void cb(null, undefined); }
            var data = exp.getFileData(id);
            cb(null, clone(data[attr]));
        };

        exp.pushData = function (_data, cb) {
            if (typeof cb !== "function") { cb = function () {}; }
            if (readOnly) { return void cb('EFORBIDDEN'); }
            var id = Util.createRandomInteger();
            var data = clone(_data);
            // If we were given an edit link, encrypt its value if needed
            if (data.href && data.href.indexOf('#') !== -1) { data.href = exp.cryptor.encrypt(data.href); }
            files[FILES_DATA][id] = data;
            cb(null, id);
        };

        exp.pushSharedFolder = function (_data, cb) {
            if (typeof cb !== "function") { cb = function () {}; }
            if (readOnly) { return void cb('EFORBIDDEN'); }
            var data = clone(_data);

            // Check if we already have this shared folder in our drive
            var exists;
            if (Object.keys(files[SHARED_FOLDERS]).some(function (k) {
                if (files[SHARED_FOLDERS][k].channel === data.channel) {
                    // We already know this shared folder. Check if we can get better access rights
                    if (data.href && !files[SHARED_FOLDERS][k].href) {
                        files[SHARED_FOLDERS][k].href = data.href;
                    }
                    exists = k;
                    return true;
                }
            })) {
                return void cb ('EEXISTS', exists);
            }

            // Add the folder
            if (!loggedIn || config.testMode) {
                return void cb("EAUTH");
            }
            var id = Util.createRandomInteger();
            if (data.href && data.href.indexOf('#') !== -1) { data.href = exp.cryptor.encrypt(data.href); }
            files[SHARED_FOLDERS][id] = data;
            cb(null, id);
        };

        exp.deprecateSharedFolder = function (id) {
            if (readOnly) { return; }
            var data = files[SHARED_FOLDERS][id];
            if (!data) { return; }
            var ro = !data.href || exp.cryptor.decrypt(data.href).indexOf('#') === -1;
            if (!ro) {
                files[SHARED_FOLDERS_TEMP][id] = JSON.parse(JSON.stringify(data));
            }
            var paths = exp.findFile(Number(id));
            exp.delete(paths, null, true);
            delete files[SHARED_FOLDERS][id];
        };

        // FILES DATA
        var spliceFileData = function (id) {
            if (readOnly) { return; }
            delete files[FILES_DATA][id];
        };

        // Find files in FILES_DATA that are not anymore in the drive, and remove them from
        // FILES_DATA.
        exp.checkDeletedFiles = function (cb) {
            if (!loggedIn && !config.testMode) { return void cb(); }
            if (readOnly) { return void cb('EFORBIDDEN'); }

            var filesList = exp.getFiles([ROOT, 'hrefArray', TRASH]);
            var toClean = [];
            exp.getFiles([FILES_DATA, SHARED_FOLDERS]).forEach(function (id) {
                if (filesList.indexOf(id) === -1) {
                    var fd = exp.isSharedFolder(id) ? files[SHARED_FOLDERS][id] : exp.getFileData(id);
                    var channelId = fd.channel;
                    if (fd.lastVersion) { toClean.push(Hash.hrefToHexChannelId(fd.lastVersion)); }
                    if (fd.rtChannel) { toClean.push(fd.rtChannel); }
                    if (channelId) { toClean.push(channelId); }
                    if (exp.isSharedFolder(id)) {
                        delete files[SHARED_FOLDERS][id];
                        if (config.removeProxy) { config.removeProxy(id); }
                    } else {
                        spliceFileData(id);
                    }
                }
            });
            if (!toClean.length) { return void cb(); }
            cb(null, toClean);
        };
        var deleteHrefs = function (ids) {
            if (readOnly) { return; }
            ids.forEach(function (obj) {
                var idx = files[obj.root].indexOf(obj.id);
                files[obj.root].splice(idx, 1);
            });
        };
        var deleteMultipleTrashRoot = function (roots) {
            if (readOnly) { return; }
            roots.forEach(function (obj) {
                var idx = files[TRASH][obj.name].indexOf(obj.el);
                files[TRASH][obj.name].splice(idx, 1);
            });
        };
        exp.deleteMultiplePermanently = function (paths, nocheck, cb) {
            if (readOnly) { return void cb('EFORBIDDEN'); }

            var allFilesPaths = paths.filter(function(x) { return exp.isPathIn(x, [FILES_DATA]); });

            if (!loggedIn && !config.testMode) {
                allFilesPaths.forEach(function (path) {
                    var id = path[1];
                    if (!id) { return; }
                    spliceFileData(id);
                });
                return void cb();
            }

            var hrefPaths = paths.filter(function(x) { return exp.isPathIn(x, ['hrefArray']); });
            var rootPaths = paths.filter(function(x) { return exp.isPathIn(x, [ROOT]); });
            var trashPaths = paths.filter(function(x) { return exp.isPathIn(x, [TRASH]); });

            var ids = [];
            hrefPaths.forEach(function (path) {
                var id = exp.find(path);
                ids.push({
                    root: path[0],
                    id: id
                });
            });
            deleteHrefs(ids);

            rootPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = exp.find(parentPath);
                delete parentEl[key];
            });

            var trashRoot = [];
            trashPaths.forEach(function (path) {
                var parentPath = path.slice();
                var key = parentPath.pop();
                var parentEl = exp.find(parentPath);
                // Trash root: we have array here, we can't just splice with the path otherwise we might break the path
                // of another element in the loop
                if (path.length === 4) {
                    trashRoot.push({
                        name: path[1],
                        el: parentEl
                    });
                    return;
                }
                // Trash but not root: it's just a tree so remove the key
                delete parentEl[key];
            });
            deleteMultipleTrashRoot(trashRoot);

            // In some cases, we want to remove pads from a location without removing them from
            // FILES_DATA (replaceHref)
            if (!nocheck) { exp.checkDeletedFiles(cb); }
            else { cb(); }
        };

        // Move

        // From another drive
        exp.copyFromOtherDrive = function (path, element, data, key) {
            if (readOnly) { return; }
            // Copy files data
            // We have to remove pads that are already in the current proxy to make sure
            // we won't create duplicates

            var toRemove = [];
            Object.keys(data).forEach(function (id) {
                id = Number(id);
                // Find and maybe update existing pads with the same channel id
                var d = data[id];
                // If we were given an edit link, encrypt its value if needed
                if (d.href) { d.href = exp.cryptor.encrypt(d.href); }
                var found = false;
                for (var i in files[FILES_DATA]) {
                    if (files[FILES_DATA][i].channel === d.channel) {
                        // Update href?
                        if (!files[FILES_DATA][i].href) {
                            files[FILES_DATA][i].href = d.href;
                        }
                        found = true;
                        break;
                    }
                }
                if (found) {
                    toRemove.push(id);
                    return;
                }
                files[FILES_DATA][id] = d;
            });

            // Remove existing pads from the "element" variable
            if (exp.isFile(element) && toRemove.indexOf(element) !== -1) {
                exp.log(Messages.sharedFolders_duplicate);
                return;
            } else if (exp.isFolder(element)) {
                var _removeExisting = function (root) {
                    for (var k in root) {
                        if (exp.isFile(root[k])) {
                            if (toRemove.indexOf(root[k]) !== -1) {
                                exp.log(Messages.sharedFolders_duplicate);
                                delete root[k];
                            }
                        } else if (exp.isFolder(root[k])) {
                            _removeExisting(root[k]);
                        }
                    }
                };
                _removeExisting(element);
            }


            // Copy file or folder
            var newParent = exp.find(path);
            var tempName = exp.isFile(element) ? Hash.createChannelId() : key;
            var newName = exp.getAvailableName(newParent, tempName);
            newParent[newName] = element;
        };

        // From the same drive
        var pushToTrash = function (name, element, path) {
            if (readOnly) { return; }

            var trash = files[TRASH];
            if (typeof(trash[name]) === "undefined") { trash[name] = []; }
            var trashArray = trash[name];
            var trashElement = {
                element: element,
                path: path
            };
            trashArray.push(trashElement);
        };
        exp.copyElement = function (elementPath, newParentPath) {
            if (readOnly) { return; }
            if (exp.comparePath(elementPath, newParentPath)) { return; } // Nothing to do...
            var element = exp.find(elementPath);
            var newParent = exp.find(newParentPath);

            // Move to Trash
            if (exp.isPathIn(newParentPath, [TRASH])) {
                if (!elementPath || elementPath.length < 2 || elementPath[0] === TRASH) {
                    debug("Can't move an element from the trash to the trash: ", elementPath);
                    return;
                }
                var key = elementPath[elementPath.length - 1];
                var elName = exp.isPathIn(elementPath, ['hrefArray']) ? exp.getTitle(element) : key;
                var parentPath = elementPath.slice();
                parentPath.pop();
                pushToTrash(elName, element, parentPath);
                return true;
            }
            // Move to hrefArray
            if (exp.isPathIn(newParentPath, ['hrefArray'])) {
                if (exp.isFolder(element)) {
                    exp.log(Messages.fo_moveUnsortedError);
                    return;
                } else {
                    if (elementPath[0] === newParentPath[0]) { return; }
                    var fileRoot = newParentPath[0];
                    if (files[fileRoot].indexOf(element) === -1) {
                        files[fileRoot].push(element);
                    }
                    return true;
                }
            }
            // Move to root
            var newName = exp.isFile(element) ?
                            exp.getAvailableName(newParent, Hash.createChannelId()) :
                            exp.isInTrashRoot(elementPath) ?
                              elementPath[1] : elementPath.pop();

            if (typeof(newParent[newName]) !== "undefined") {
                exp.log(Messages.fo_unavailableName);
                return;
            }
            newParent[newName] = element;
            return true;
        };

        // FORGET (move with href not path)
        exp.forget = function (href) {
            if (readOnly) { return; }

            var id = exp.getIdFromHref(href);
            if (!id) { return; }
            if (!loggedIn && !config.testMode) {
                // delete permanently
                spliceFileData(id);
                return true;
            }
            var paths = exp.findFile(id);
            exp.move(paths, [TRASH]);
            return true;
        };

        // REPLACE
        // If all the occurences of an href are in the trash, remove them and add the file in root.
        // This is use with setPadTitle when we open a stronger version of a deleted pad
        exp.restoreHref = function (href) {
            if (readOnly) { return; }

            var idO = exp.getIdFromHref(href);

            if (!idO || !exp.isFile(idO)) { return; }

            var paths = exp.findFile(idO);

            // Remove all the occurences in the trash
            // If all the occurences are in the trash or no occurence, add the pad to root
            var allInTrash = true;
            paths.forEach(function (p) {
                if (p[0] === TRASH) {
                    exp.delete(p, null, true); // 3rd parameter means skip "checkDeletedFiles"
                    return;
                }
                allInTrash = false;
            });
            if (allInTrash) {
                exp.add(idO);
            }
        };

        exp.add = function (id, path) {
            if (readOnly) { return; }

            if (!loggedIn && !config.testMode) { return; }
            id = Number(id);
            var data = files[FILES_DATA][id] || files[SHARED_FOLDERS][id];
            if (!data || typeof(data) !== "object") { return; }
            var newPath = path, parentEl;
            if (path && !Array.isArray(path)) {
                newPath = decodeURIComponent(path).split(',');
            }
            // Add to href array
            if (path && exp.isPathIn(newPath, ['hrefArray'])) {
                parentEl = exp.find(newPath);
                parentEl.push(id);
                return;
            }
            // Add to root if no path
            var filesList = exp.getFiles([ROOT, TRASH, 'hrefArray']);
            if (filesList.indexOf(id) === -1 && !newPath) {
                newPath = [ROOT];
            }
            // Add to root
            if (path && exp.isPathIn(newPath, [ROOT])) {
                parentEl = exp.find(newPath);
                if (parentEl) {
                    var newName = exp.getAvailableName(parentEl, Hash.createChannelId());
                    parentEl[newName] = id;
                    return;
                } else {
                    parentEl = exp.find([ROOT]);
                    newPath.slice(1).forEach(function (folderName) {
                        parentEl = parentEl[folderName] = parentEl[folderName] || {};
                    });
                    parentEl[Hash.createChannelId()] = id;
                }
            }
        };

        exp.setFolderData = function (path, key, value, cb) {
            if (readOnly) { return; }

            var folder = exp.find(path);
            if (!exp.isFolder(folder) || exp.isSharedFolder(folder)) { return; }
            if (!exp.hasFolderData(folder)) {
                var hashKey = "000" + Hash.createChannelId().slice(0, -3);
                folder[hashKey] = {
                    metadata: true
                };
            }
            exp.getFolderData(folder)[key] = value;
            cb();
        };

        /**
         * INTEGRITY CHECK
         */

        var onSync = function (next) {
            if (exp.rt) {
                exp.rt.sync();
                Realtime.whenRealtimeSyncs(exp.rt, next);
            } else {
                window.setTimeout(next, 1000);
            }
        };

        exp.migrateReadOnly = function (cb) {
            if (readOnly || !config.editKey) { return void cb({error: 'EFORBIDDEN'}); }
            if (files.version >= 2) { return void cb(); } // Already migrated, nothing to do
            files.migrateRo = 1;
            var next = function () {
                var copy = JSON.parse(JSON.stringify(files));
                exp.reencrypt(config.editKey, config.editKey, copy);
                setTimeout(function () {
                    if (files.version >= 2) {
                        // Already migrated by another user while we were re-encrypting
                        return void cb();
                    }
                    Object.keys(copy).forEach(function (k) {
                        files[k] = copy[k];
                    });
                    files.version = 2;
                    delete files.migrateRo;

                    onSync(cb);
                }, 1000);
            };
            onSync(next);
        };

        exp.migrate = function (cb) {
            if (readOnly) { return void cb(); }
            // Make sure unsorted doesn't exist anymore
            // Note: Unsorted only works with the old structure where pads are href
            // It should be called before the migration code
            var fixUnsorted = function () {
                if (!files[UNSORTED] || !files[OLD_FILES_DATA]) { return; }
                debug("UNSORTED still exists in the object, removing it...");
                var us = files[UNSORTED];
                if (us.length === 0) {
                    delete files[UNSORTED];
                    return;
                }
                us.forEach(function (el) {
                    if (typeof el !== "string") {
                        return;
                    }
                    var data = files[OLD_FILES_DATA].filter(function (x) {
                        return x.href === el;
                    });
                    if (data.length === 0) {
                        files[OLD_FILES_DATA].push({
                            href: el
                        });
                    }
                    return;
                });
                delete files[UNSORTED];
            };
            // mergeDrive...
            var migrateToNewFormat = function (todo) {
                if (!files[OLD_FILES_DATA]) {
                    return void todo();
                }
                try {
                    debug("Migrating file system...");
                    files.migrate = 1;
                    var next = function () {
                        var oldData = files[OLD_FILES_DATA].slice();
                        if (!files[FILES_DATA]) {
                            files[FILES_DATA] = {};
                        }
                        var newData = files[FILES_DATA];
                        //var oldFiles = oldData.map(function (o) { return o.href; });
                        oldData.forEach(function (obj) {
                            if (!obj || !obj.href) { return; }
                            var href = obj.href;
                            var id = Util.createRandomInteger();
                            var paths = exp.findFile(href);
                            var data = obj;
                            var key = Hash.createChannelId();
                            if (data) {
                                newData[id] = data;
                            } else {
                                newData[id] = {href: href};
                            }
                            paths.forEach(function (p) {
                                var parentPath = p.slice();
                                var okey = parentPath.pop(); // get the parent
                                var parent = exp.find(parentPath);
                                if (exp.isInTrashRoot(p)) {
                                    parent.element = id;
                                    newData[id].filename = p[1];
                                    return;
                                }
                                if (exp.isPathIn(p, ['hrefArray'])) {
                                    parent[okey] = id;
                                    return;
                                }
                                // else root or trash (not trashroot)
                                parent[key] = id;
                                newData[id].filename = okey;
                                delete parent[okey];
                            });
                        });
                        delete files[OLD_FILES_DATA];
                        delete files.migrate;
                        todo();
                    };
                    onSync(next);
                } catch(e) {
                    console.error(e);
                    todo();
                }
            };

            fixUnsorted();
            migrateToNewFormat(cb);
        };

        exp.fixFiles = function (silent) {
            // Explore the tree and check that everything is correct:
            //  * 'root', 'trash', 'unsorted' and 'filesData' exist and are objects
            //  * ROOT: Folders are objects, files are href
            //  * TRASH: Trash root contains only arrays, each element of the array is an object {element:.., path:..}
            //  * OLD_FILES_DATA: - Data (title, cdate, adte) are stored in filesData. filesData contains only href keys linking to object with title, cdate, adate.
            //                - Dates (adate, cdate) can be parsed/formatted
            //                - All files in filesData should be either in 'root', 'trash' or 'unsorted'. If that's not the case, copy the fily to 'unsorted'
            //  * TEMPLATE: Contains only files (href), and does not contains files that are in ROOT

            // We can't fix anything in read-only mode: abort
            if (readOnly) { return; }

            if (silent) { debug = function () {}; }

            var t0 = +new Date();
            debug("Cleaning file system...");

            var before = JSON.stringify(files);

            var fixRoot = function (elem) {
                if (typeof(files[ROOT]) !== "object") { debug("ROOT was not an object"); files[ROOT] = {}; }
                var element = elem || files[ROOT];
                if (!element) { return console.error("Invalid element in root"); }
                var nbMetadataFolders = 0;
                for (var el in element) {
                    if (element[el] === null) {
                        console.error('element[%s] is null', el);
                        delete element[el];
                        continue;
                    }
                    if (exp.isFolderData(element[el])) {
                        if (nbMetadataFolders !== 0) {
                            debug("Multiple metadata files in folder");
                            delete element[el];
                        }
                        nbMetadataFolders++;
                        continue;
                    }
                    if (!exp.isFile(element[el], true) && !exp.isFolder(element[el])) {
                        debug("An element in ROOT was not a folder nor a file. ", element[el]);
                        delete element[el];
                        continue;
                    }
                    if (exp.isFolder(element[el])) {
                        fixRoot(element[el]);
                        continue;
                    }
                    if (typeof element[el] === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Util.createRandomInteger();
                        var key = Hash.createChannelId();
                        files[FILES_DATA][id] = {
                            href: exp.cryptor.encrypt(element[el]),
                            filename: el
                        };
                        element[key] = id;
                        delete element[el];
                    }
                    if (typeof element[el] === "number") {
                        var data = files[FILES_DATA][element[el]];
                        if (!data) {
                            debug("An element in ROOT doesn't have associated data", element[el], el);
                            delete element[el];
                        }
                    }
                }
            };
            var fixTrashRoot = function () {
                if (sharedFolder) { return; }
                if (typeof(files[TRASH]) !== "object") { debug("TRASH was not an object"); files[TRASH] = {}; }
                var tr = files[TRASH];
                var toClean;
                var addToClean = function (obj, idx, el) {
                    if (typeof(obj) !== "object") { toClean.push(idx); return; }
                    if (!exp.isFile(obj.element, true) &&
                        !exp.isFolder(obj.element)) { toClean.push(idx); return; }
                    if (!Array.isArray(obj.path)) { toClean.push(idx); return; }
                    if (typeof obj.element === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Util.createRandomInteger();
                        files[FILES_DATA][id] = {
                            href: exp.cryptor.encrypt(obj.element),
                            filename: el
                        };
                        obj.element = id;
                    }
                    if (exp.isFolder(obj.element)) { fixRoot(obj.element); }
                    if (typeof obj.element === "number") {
                        var data = files[FILES_DATA][obj.element];
                        if (!data) {
                            debug("An element in TRASH doesn't have associated data", obj.element, el);
                            toClean.push(idx);
                        }
                    }

                };
                for (var el in tr) {
                    if (!Array.isArray(tr[el])) {
                        debug("An element in TRASH root is not an array. ", tr[el]);
                        delete tr[el];
                    } else if (tr[el].length === 0) {
                        debug("Empty array in TRASH root. ", tr[el]);
                        delete tr[el];
                    } else {
                        toClean = [];
                        for (var j=0; j<tr[el].length; j++) {
                            addToClean(tr[el][j], j, el);
                        }
                        for (var i = toClean.length-1; i>=0; i--) {
                            tr[el].splice(toClean[i], 1);
                        }
                    }
                }
            };
            var fixTemplate = function () {
                if (sharedFolder) { return; }
                if (!Array.isArray(files[TEMPLATE])) { debug("TEMPLATE was not an array"); files[TEMPLATE] = []; }
                var dedup = Util.deduplicateString(files[TEMPLATE]);
                if (dedup.length !== files[TEMPLATE].length) {
                    files[TEMPLATE] = dedup;
                }
                var us = files[TEMPLATE];
                var rootFiles = exp.getFiles([ROOT]);
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!exp.isFile(el, true) || rootFiles.indexOf(el) !== -1) {
                        toClean.push(el);
                        return;
                    }
                    if (typeof el === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Util.createRandomInteger();
                        files[FILES_DATA][id] = {
                            href: exp.cryptor.encrypt(el)
                        };
                        us[idx] = id;
                        return;
                    }
                    if (typeof el === "number") {
                        var data = files[FILES_DATA][el];
                        if (!data) {
                            debug("An element in TEMPLATE doesn't have associated data", el);
                            toClean.push(el);
                        }
                    }
                });
                toClean.forEach(function (el) {
                    var idx = us.indexOf(el);
                    if (idx !== -1) {
                        us.splice(idx, 1);
                    }
                });
            };
            var fixFilesData = function () {
                if (typeof files[FILES_DATA] !== "object") { debug("FILES_DATA was not an object"); files[FILES_DATA] = {}; }
                var fd = files[FILES_DATA];
                var rootFiles = exp.getFiles([ROOT, TRASH, 'hrefArray']);
                var root = exp.find([ROOT]);
                var toClean = [];
                for (var id in fd) {
                    if (String(id) !== String(Number(id))) {
                        debug("Invalid file ID in filesData.", id);
                        toClean.push(id);
                        continue;
                    }
                    id = Number(id);
                    var el = fd[id];

                    // Clean corrupted data
                    if (!el || typeof(el) !== "object") {
                        debug("An element in filesData was not an object.", el);
                        toClean.push(id);
                        continue;
                    }
                    // Clean missing href
                    if (!el.href && !el.roHref) {
                        debug("Removing an element in filesData with a missing href.", el);
                        toClean.push(id);
                        continue;
                    }

                    var decryptedHref;
                    try {
                        decryptedHref = el.href && ((el.href.indexOf('#') !== -1) ? el.href : exp.cryptor.decrypt(el.href));
                    } catch (e) {}

                    if (decryptedHref && decryptedHref.indexOf('#') === -1) {
                        // If we can't decrypt the href, it means we don't have the correct secondaryKey and we're in readOnly mode:
                        // abort now, we won't be able to fix anything anyway
                        continue;
                    }

                    var parsed = Hash.parsePadUrl(decryptedHref || el.roHref);
                    var secret;

                    // Clean invalid hash
                    if (!parsed.hash) {
                        debug("Removing an element in filesData with a invalid href.", el);
                        toClean.push(id);
                        continue;
                    }
                    // Clean invalid type
                    if (!parsed.type) {
                        debug("Removing an element in filesData with a invalid type.", el);
                        toClean.push(id);
                        continue;
                    }

                    // If we have an edit link, check the view link
                    if (decryptedHref && parsed.hashData.type === "pad" && parsed.hashData.version) {
                        if (parsed.hashData.mode === "view") {
                            el.roHref = decryptedHref;
                            delete el.href;
                        } else if (!el.roHref) {
                            secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                            el.roHref = '/' + parsed.type + '/#' + Hash.getViewHashFromKeys(secret);
                        } else {
                            var parsed2 = Hash.parsePadUrl(el.roHref);
                            if (!parsed2.hash || !parsed2.type) {
                                secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                                el.roHref = '/' + parsed.type + '/#' + Hash.getViewHashFromKeys(secret);
                            }
                        }
                    }
                    // v0 hashes don't support read-only
                    if (parsed.hashData.version === 0) {
                        delete el.roHref;
                    }

                    // Fix href
                    if (decryptedHref && decryptedHref.slice(0,1) !== '/') {
                        el.href = exp.cryptor.encrypt(Hash.getRelativeHref(decryptedHref));
                    }
                    // Fix creation time
                    if (!el.ctime) { el.ctime = el.atime; }
                    // Fix title
                    if (!el.title) { el.title = exp.getDefaultName(parsed); }
                    // Fix channel
                    if (!el.channel) {
                        try {
                            if (!secret) {
                                secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                            }
                            el.channel = secret.channel;
                            console.log(el);
                            debug('Adding missing channel in filesData ', el.channel);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    if ((loggedIn || config.testMode) && rootFiles.indexOf(id) === -1) {
                        debug("An element in filesData was not in ROOT, TEMPLATE or TRASH.", id, el);
                        var newName = Hash.createChannelId();
                        root[newName] = id;
                        continue;
                    }
                }
                toClean.forEach(function (id) {
                    spliceFileData(id);
                });
            };
            var fixSharedFolders = function () {
                if (sharedFolder) { return; }
                if (typeof(files[SHARED_FOLDERS]) !== "object") { debug("SHARED_FOLDER was not an object"); files[SHARED_FOLDERS] = {}; }
                var sf = files[SHARED_FOLDERS];
                var rootFiles = exp.getFiles([ROOT]);
                var root = exp.find([ROOT]);
                var parsed /*, secret */, el;
                for (var id in sf) {
                    el = sf[id];
                    id = Number(id);

                    var href;
                    try {
                        href = el.href && ((el.href.indexOf('#') !== -1) ? el.href : exp.cryptor.decrypt(el.href));
                    } catch (e) {}

                    // Fix undefined hash
                    parsed = Hash.parsePadUrl(href || el.roHref);
                    if (!parsed || !parsed.hash || parsed.hash === "undefined") {
                        delete sf[id];
                        continue;
                    }

                    // Fix shared folder not displayed in root
                    if (rootFiles.indexOf(id) === -1) {
                        console.log('missing' + id);
                        var newName = Hash.createChannelId();
                        root[newName] = id;
                    }
                }
            };
            var fixSharedFoldersTemp = function () {
                if (sharedFolder) { return; }
                if (typeof(files[SHARED_FOLDERS_TEMP]) !== "object") {
                    debug("SHARED_FOLDER_TEMP was not an object");
                    files[SHARED_FOLDERS_TEMP] = {};
                }
                // Remove deprecated shared folder if they were already added back
                var sft = files[SHARED_FOLDERS_TEMP];
                var sf = files[SHARED_FOLDERS];
                for (var id in sft) {
                    if (sf[id]) {
                        delete sft[id];
                    }
                }
            };


            var fixDrive = function () {
                Object.keys(files).forEach(function (key) {
                    if (key.slice(0,1) === '/') { delete files[key]; }
                });
            };

            fixRoot();
            fixTrashRoot();
            fixTemplate();
            fixFilesData();
            fixDrive();
            fixSharedFolders();
            fixSharedFoldersTemp();

            var ms = (+new Date() - t0) + 'ms';
            if (JSON.stringify(files) !== before) {
                debug("Your file system was corrupted. It has been cleaned so that the pads you visit can be stored safely.", ms);
                return;
            }
            debug("File system was clean.", ms);
        };

        return exp;
    };

    return module;
});
