require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/common/fileObject.js',
    'json.sortify'
], function (Cryptpad, Crypt, FO, Sortify) {
    var exp = {};

    var getType = function (el) {
        if (el === null) { return "null"; }
        return Array.isArray(el) ? "array" : typeof(el);
    };

    var findAvailableKey = function (obj, key) {
        if (typeof (obj[key]) === "undefined") { return key; }
        var i = 1;
        var nkey = key;
        while (typeof (obj[nkey]) !== "undefined") {
            nkey = key + '_' + i;
            i++;
        }
        return nkey;
    };

    var copy = function (el) {
        if (typeof (el) !== "object") { return el; }
        return JSON.parse(JSON.stringify(el));
    };

    var deduplicate = function (array) {
        var a = array.slice();
        for(var i=0; i<a.length; i++) {
            for(var j=i+1; j<a.length; j++) {
                if(a[i] === a[j] || (
                    typeof(a[i]) === "object" && Sortify(a[i]) === Sortify(a[j])))
                    a.splice(j--, 1);
            }
        }
        return a;
    };

    // Merge obj2 into obj1
    // If keepOld is true, obj1 values are kept in case of conflicti
    // Not used ATM
    var merge = function (obj1, obj2, keepOld) {
        if (typeof (obj1) !== "object" || typeof (obj2) !== "object") { return; };
        Object.keys(obj2).forEach(function (k) {
            var v = obj2[k];
            // If one of them is not an object or if we have a map and a array, don't override, create a new key
            if (!obj1[k] || typeof(obj1[k]) !== "object" || typeof(obj2[k]) !== "object" ||
                    (getType(obj1[k]) !== getType(obj2[k]))) {
                // We don't want to override the values in the object (username, preferences)
                // These values should be the ones stored in the first object
                if (keepOld) { return; }
                if (obj1[k] === obj2[k]) { return; }
                var nkey = findAvailableKey(obj1, k);
                obj1[nkey] = copy(obj2[k]);
                return;
            }
            // Else, they're both maps or both arrays
            if (getType(obj1[k]) === "array" && getType(obj2[k]) === "array") {
                var c = obj1[k].concat(obj2[k]);
                obj1[k] = deduplicate(c);
                return;
            }
            merge(obj1[k], obj2[k], keepOld);
        });
    };

    var createFromPath = function (proxy, oldFo, path, href) {
        var root = proxy.drive;

        var error = function (msg) {
            console.error(msg || "Unable to find that path", path);
        };

        if (path[0] === FO.TRASH && path.length === 4) {
            href = oldFo.getTrashElementData(path);
            path.pop();
        }

        var p, next, nextRoot;
        path.forEach(function (p, i) {
            if (!root) { return; }
            if (typeof(p) === "string") {
                if (getType(root) !== "object") { root = undefined; error(); return; }
                if (i === path.length - 1) {
                    root[findAvailableKey(root, p)] = href;
                    return;
                }
                next = getType(path[i+1]);
                nextRoot = getType(root[p]);
                if (nextRoot !== "undefined") {
                    if (next === "string" && nextRoot === "object" || next === "number" && nextRoot === "array") {
                        root = root[p];
                        return;
                    }
                    p = findAvailableKey(root, p);
                }
                if (next === "number") {
                    root[p] = [];
                    root = root[p];
                    return;
                }
                root[p] = {};
                root = root[p];
                return;
            }
            // Path contains a non-string element: it's an array index
            if (typeof(p) !== "number") { root = undefined; error(); return; }
            if (getType(root) !== "array") { root = undefined; error(); return; }
            if (i === path.length - 1) {
                if (root.indexOf(href) === -1) { root.push(href); }
                return;
            }
            next = getType(path[i+1]);
            if (next === "number") {
                error('2 consecutives arrays in the user object');
                root = undefined;
                //root.push([]);
                //root = root[root.length - 1];
                return;
            }
            root.push({});
            root = root[root.length - 1];
            return;
        });
    };

    var mergeAnonDrive = exp.anonDriveIntoUser = function (proxy, cb) {
        // Make sure we have an FS_hash and we don't use it, otherwise just stop the migration and cb
        if (!localStorage.FS_hash || !Cryptpad.isLoggedIn()) {
            if (typeof(cb) === "function") { cb(); }
        }
        // Get the content of FS_hash and then merge the objects, remove the migration key and cb
        var todo = function (err, doc) {
            if (err) { console.error("Cannot migrate recent pads", err); return; }
            var parsed;
            try { parsed = JSON.parse(doc); } catch (e) { logError("Cannot parsed recent pads", e); }
            if (parsed) {
                //merge(proxy, parsed, true);
                var oldFo = FO.init(parsed.drive, {
                    Cryptpad: Cryptpad
                });
                var newData = Cryptpad.getStore().getProxy();
                var newFo = newData.fo;
                var newRecentPads = proxy.drive[Cryptpad.storageKey];
                var newFiles = newFo.getFilesDataFiles();
                var oldFiles = oldFo.getFilesDataFiles();
                oldFiles.forEach(function (href) {
                    // Do not migrate a pad if we already have it, it would create a duplicate in the drive
                    if (newFiles.indexOf(href) !== -1) { return; }
                    // If we have a stronger version, do not add the current href
                    if (Cryptpad.findStronger(href, newRecentPads)) { return; }
                    // If we have a weaker version, replace the href by the new one
                    // NOTE: if that weaker version is in the trash, the strong one will be put in unsorted
                    var weaker = Cryptpad.findWeaker(href, newRecentPads);
                    if (weaker) {
                        newFo.replaceHref(weaker, href);
                        return;
                    }
                    // Here it means we have a new href, so we should add it to the drive at its old location
                    var paths = oldFo.findFile(href);
                    if (paths.length === 0) { return; }
                    createFromPath(proxy, oldFo, paths[0], href);
                    // Also, push the file data in our array
                    var data = oldFo.getFileData(href);
                    if (data) {
                        newRecentPads.push(data);
                    }
                });
            }
            if (typeof(cb) === "function") { cb(); }
        };
        Crypt.get(localStorage.FS_hash, todo);
    };

    return exp;
});
