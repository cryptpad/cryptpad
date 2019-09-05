define([
    '/customize/application_config.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/common-feedback.js',
    '/customize/messages.js'
], function (AppConfig, Util, Hash, Realtime, Feedback, Messages) {
    var module = {};

    var clone = function (o) {
        try { return JSON.parse(JSON.stringify(o)); }
        catch (e) { return undefined; }
    };

    module.init = function (config, exp, files) {
        var removeOwnedChannel = config.removeOwnedChannel || function () {
            console.error("removeOwnedChannel was not provided");
        };
        var loggedIn = config.loggedIn;
        var sharedFolder = config.sharedFolder;
        var edPublic = config.edPublic;

        var ROOT = exp.ROOT;
        var FILES_DATA = exp.FILES_DATA;
        var OLD_FILES_DATA = exp.OLD_FILES_DATA;
        var UNSORTED = exp.UNSORTED;
        var TRASH = exp.TRASH;
        var TEMPLATE = exp.TEMPLATE;
        var SHARED_FOLDERS = exp.SHARED_FOLDERS;

        var debug = exp.debug;

        exp.setPadAttribute = function (href, attr, value, cb) {
            cb = cb || function () {};
            var id = exp.getIdFromHref(href);
            if (!id) { return void cb("E_INVAL_HREF"); }
            if (!attr || !attr.trim()) { return void cb("E_INVAL_ATTR"); }
            var data = exp.getFileData(id);
            data[attr] = clone(value);
            cb(null);
        };
        exp.getPadAttribute = function (href, attr, cb) {
            cb = cb || function () {};
            var id = exp.getIdFromHref(href);
            if (!id) { return void cb(null, undefined); }
            var data = exp.getFileData(id);
            cb(null, clone(data[attr]));
        };

        exp.pushData = function (data, cb) {
            if (typeof cb !== "function") { cb = function () {}; }
            var id = Util.createRandomInteger();
            files[FILES_DATA][id] = data;
            cb(null, id);
        };

        exp.pushSharedFolder = function (data, cb) {
            if (typeof cb !== "function") { cb = function () {}; }

            // Check if we already have this shared folder in our drive
            if (Object.keys(files[SHARED_FOLDERS]).some(function (k) {
                return files[SHARED_FOLDERS][k].channel === data.channel;
            })) {
                return void cb ('EEXISTS');
            }

            // Add the folder
            if (!loggedIn || config.testMode) {
                return void cb("EAUTH");
            }
            var id = Util.createRandomInteger();
            files[SHARED_FOLDERS][id] = data;
            cb(null, id);
        };

        // FILES DATA
        var spliceFileData = function (id) {
            delete files[FILES_DATA][id];
        };

        // Find files in FILES_DATA that are not anymore in the drive, and remove them from
        // FILES_DATA. If there are owned pads, remove them from server too.
        exp.checkDeletedFiles = function (cb) {
            if (!loggedIn && !config.testMode) { return void cb(); }

            var filesList = exp.getFiles([ROOT, 'hrefArray', TRASH]);
            var toClean = [];
            var ownedRemoved = [];
            exp.getFiles([FILES_DATA, SHARED_FOLDERS]).forEach(function (id) {
                if (filesList.indexOf(id) === -1) {
                    var fd = exp.isSharedFolder(id) ? files[SHARED_FOLDERS][id] : exp.getFileData(id);
                    var channelId = fd.channel;
                    // If trying to remove an owned pad, remove it from server also
                    if (!sharedFolder && fd.owners && fd.owners.indexOf(edPublic) !== -1
                        && channelId) {
                        if (channelId) { ownedRemoved.push(channelId); }
                        Feedback.send('REMOVE_OWNED_CHANNEL');
                        removeOwnedChannel(channelId, function (obj) {
                            if (obj && obj.error) {
                                // If the error is that the file is already removed, nothing to
                                // report, it's a normal behavior (pad expired probably)
                                if (obj.error.code === 'ENOENT') { return; }

                                // RPC may not be responding
                                // Send a report that can be handled manually
                                console.error(obj.error);
                                Feedback.send('ERROR_DELETING_OWNED_PAD=' + channelId + '|' + obj.error, true);
                            }
                        });
                        // Also remove the realtime channel for onlyoffice
                        if (fd.rtChannel) {
                            removeOwnedChannel(fd.rtChannel, function () {});
                        }
                        // XXX fd.lastVersion to delete the encrypted cp?
                    }
                    if (fd.lastVersion) { toClean.push(Hash.hrefToHexChannelId(fd.lastVersion)); }
                    if (fd.rtChannel) { toClean.push(fd.rtChannel); }
                    if (channelId) { toClean.push(channelId); }
                    if (exp.isSharedFolder(id)) {
                        delete files[SHARED_FOLDERS][id];
                    } else {
                        spliceFileData(id);
                    }
                }
            });
            if (!toClean.length) { return void cb(); }
            cb(null, toClean, ownedRemoved);
        };
        var deleteHrefs = function (ids) {
            ids.forEach(function (obj) {
                var idx = files[obj.root].indexOf(obj.id);
                files[obj.root].splice(idx, 1);
            });
        };
        var deleteMultipleTrashRoot = function (roots) {
            roots.forEach(function (obj) {
                var idx = files[TRASH][obj.name].indexOf(obj.el);
                files[TRASH][obj.name].splice(idx, 1);
            });
        };
        exp.deleteMultiplePermanently = function (paths, nocheck, cb) {
            var hrefPaths = paths.filter(function(x) { return exp.isPathIn(x, ['hrefArray']); });
            var rootPaths = paths.filter(function(x) { return exp.isPathIn(x, [ROOT]); });
            var trashPaths = paths.filter(function(x) { return exp.isPathIn(x, [TRASH]); });
            var allFilesPaths = paths.filter(function(x) { return exp.isPathIn(x, [FILES_DATA]); });

            if (!loggedIn && !config.testMode) {
                allFilesPaths.forEach(function (path) {
                    var id = path[1];
                    if (!id) { return; }
                    spliceFileData(id);
                });
                return void cb();
            }

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
            // Copy files data
            // We have to remove pads that are already in the current proxy to make sure
            // we won't create duplicates

            var toRemove = [];
            Object.keys(data).forEach(function (id) {
                id = Number(id);
                // Find and maybe update existing pads with the same channel id
                var d = data[id];
                var found = false;
                for (var i in files[FILES_DATA]) {
                    if (files[FILES_DATA][i].channel === d.channel) {
                        // Update href?
                        if (!files[FILES_DATA][i].href) { files[FILES_DATA][i].href = d.href; }
                        found = true;
                        break;
                    }
                }
                if (found) {
                    toRemove.push(id);
                    return;
                }
                files[FILES_DATA][id] = data[id];
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
            var id = exp.getIdFromHref(href);
            if (!id) { return; }
            if (!loggedIn && !config.testMode) {
                // delete permanently
                spliceFileData(id);
                return;
            }
            var paths = exp.findFile(id);
            exp.move(paths, [TRASH]);
        };

        // REPLACE
        // If all the occurences of an href are in the trash, remove them and add the file in root.
        // This is use with setPadTitle when we open a stronger version of a deleted pad
        exp.restoreHref = function (href) {
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
            // Add to root if path is ROOT or if no path
            var filesList = exp.getFiles([ROOT, TRASH, 'hrefArray']);
            if (path && exp.isPathIn(newPath, [ROOT]) || filesList.indexOf(id) === -1) {
                parentEl = exp.find(newPath || [ROOT]);
                if (parentEl) {
                    var newName = exp.getAvailableName(parentEl, Hash.createChannelId());
                    parentEl[newName] = id;
                    return;
                }
            }
        };

        exp.setFolderData = function (path, key, value, cb) {
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

        exp.migrate = function (cb) {
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
                    if (exp.rt) {
                        exp.rt.sync();
                        // TODO
                        Realtime.whenRealtimeSyncs(exp.rt, next);
                    } else {
                        window.setTimeout(next, 1000);
                    }
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

            if (silent) { debug = function () {}; }

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
                        files[FILES_DATA][id] = {href: element[el], filename: el};
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
                        files[FILES_DATA][id] = {href: obj.element, filename: el};
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
                files[TEMPLATE] = Util.deduplicateString(files[TEMPLATE].slice());
                var us = files[TEMPLATE];
                var rootFiles = exp.getFiles([ROOT]).slice();
                var toClean = [];
                us.forEach(function (el, idx) {
                    if (!exp.isFile(el, true) || rootFiles.indexOf(el) !== -1) {
                        toClean.push(el);
                    }
                    if (typeof el === "string") {
                        // We have an old file (href) which is not in filesData: add it
                        var id = Util.createRandomInteger();
                        files[FILES_DATA][id] = {href: el};
                        us[idx] = id;
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

                    var parsed = Hash.parsePadUrl(el.href || el.roHref);
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
                    if (el.href && parsed.hashData.type === "pad" && parsed.hashData.version) {
                        if (parsed.hashData.mode === "view") {
                            el.roHref = el.href;
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
                    if (el.href && /^https*:\/\//.test(el.href)) { el.href = Hash.getRelativeHref(el.href); }
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
                var parsed, secret, el;
                for (var id in sf) {
                    el = sf[id];
                    id = Number(id);

                    // Fix undefined hash
                    parsed = Hash.parsePadUrl(el.href || el.roHref);
                    secret = Hash.getSecrets('drive', parsed.hash, el.password);
                    if (!secret.keys) {
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

            if (JSON.stringify(files) !== before) {
                debug("Your file system was corrupted. It has been cleaned so that the pads you visit can be stored safely");
                return;
            }
            debug("File system was clean");
        };

        return exp;
    };

    return module;
});
