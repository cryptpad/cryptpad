require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    'json.sortify'
], function (Cryptpad, Crypt, Sortify) {
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
    // If keepOld is true, obj1 values are kept in case of conflict in the ROOT object
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
                // CryptPad_RECENTPADS
                if (k === 'CryptPad_RECENTPADS') {
                    var old = obj1[k];
                    obj2[k].forEach(function (pad) {
                        if (!old.some(function (op) {
                            // TODO read-only links
                            return op.href === pad.href;
                        })) {
                            old.push(pad);
                        }
                    });
                    return;
                }
                var c = obj1[k].concat(obj2[k]);
                obj1[k] = deduplicate(c);
                return;
            }
            merge(obj1[k], obj2[k]);
        });
    };

    var mergeAnonDrive = exp.anonDriveIntoUser = function (proxy, cb) {
        // Make sure we have an FS_hash and we don't use it, otherwise just stop the migration and cb
        if (!localStorage.FS_hash || !Cryptpad.isLoggedIn()) {
            delete sessionStorage.migrateAnonDrive;
            if (typeof(cb) === "function") { cb(); }
        }
        // Get the content of FS_hash and then merge the objects, remove the migration key and cb
        var todo = function (err, doc) {
            if (err) { logError("Cannot migrate recent pads", err); return; }
            var parsed;
            try { parsed = JSON.parse(doc); } catch (e) { logError("Cannot parsed recent pads", e); }
            if (parsed) {
                merge(proxy, parsed, true);
            }
            if (typeof(cb) === "function") { cb(); }
        };
        Crypt.get(localStorage.FS_hash, todo);
    };

    return exp;
});
