define([], function () {
    // Start migration check
    // Versions:
    // 1: migrate pad attributes
    // 2: migrate indent settings (codemirror)

    return function (userObject, Cryptpad) {
        var version = userObject.version || 0;

        // Migration 1: pad attributes moved to filesData
        var migrateAttributes = function () {
            var files = userObject && userObject.drive;
            if (!files) { return; }

            var migratePadAttributes = function (el, id, parsed) {
                // Migrate old pad attributes
                ['userid', 'previewMode'].forEach(function (attr) {
                    var key = parsed.hash + '.' + attr;
                    var key2 = parsed.hash.slice(0,-1) + '.' + attr;// old pads not ending with /
                    if (typeof(files[key]) !== "undefined" || typeof(files[key2]) !== "undefined") {
                        console.log("Migrating pad attribute", attr, "for pad", id);
                        el[attr] = files[key] || files[key2];
                        delete files[key];
                        delete files[key2];
                    }
                });
            };
            var filesData = files.filesData;
            if (!filesData) { return; }

            var el, parsed;
            for (var id in filesData) {
                id = Number(id);
                el = filesData[id];
                parsed = el.href && Cryptpad.parsePadUrl(el.href);
                if (!parsed) { continue; }
                migratePadAttributes(el, id, parsed);
            }
            // Migration done
        };
        if (version < 1) {
            migrateAttributes();
            Cryptpad.feedback('Migrate-1', true);
            userObject.version = version = 1;
        }


        // Migration 2: indentation settings for CodeMirror moved from root to 'settings'
        var migrateIndent = function () {
            var indentKey = 'cryptpad.indentUnit';
            var useTabsKey = 'cryptpad.indentWithTabs';
            userObject.settings = userObject.settings || {};
            if (userObject[indentKey]) {
                userObject.settings.indentUnit = userObject[indentKey];
                delete userObject[indentKey];
            }
            if (userObject[useTabsKey]) {
                userObject.settings.indentWithTabs = userObject[useTabsKey];
                delete userObject[useTabsKey];
            }
        };
        if (version < 2) {
            migrateIndent();
            Cryptpad.feedback('Migrate-2', true);
            userObject.version = version = 2;
        }
    };
});
