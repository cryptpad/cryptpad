define([], function () {
    // Start migration check
    // Versions:
    // 1: migrate pad attributes
    // 2: migrate indent settings (codemirror)

    return function (userObject, Cryptpad) {
        var version = userObject.version || 0;

        // Migration 1: pad attributes moved to filesData
        var migratePadAttributesToData = function () {
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
            migratePadAttributesToData();
            Cryptpad.feedback('Migrate-1', true);
            userObject.version = version = 1;
        }

        // Migration 2: global attributes from root to 'settings' subobjects
        var migrateAttributes = function () {
            var drawer = 'cryptpad.userlist-drawer';
            var polls = 'cryptpad.hide_poll_text';
            var indentKey = 'cryptpad.indentUnit';
            var useTabsKey = 'cryptpad.indentWithTabs';
            var settings = userObject.settings = userObject.settings || {};
            if (typeof(userObject[indentKey]) !== "undefined") {
                settings.codemirror = settings.codemirror || {};
                settings.codemirror.indentUnit = userObject[indentKey];
                delete userObject[indentKey];
            }
            if (typeof(userObject[useTabsKey]) !== "undefined") {
                settings.codemirror = settings.codemirror || {};
                settings.codemirror.indentWithTabs = userObject[useTabsKey];
                delete userObject[useTabsKey];
            }
            if (typeof(userObject[drawer]) !== "undefined") {
                settings.toolbar = settings.toolbar || {};
                settings.toolbar['userlist-drawer'] = userObject[drawer];
                delete userObject[drawer];
            }
            if (typeof(userObject[polls]) !== "undefined") {
                settings.poll = settings.poll || {};
                settings.poll['hide-text'] = userObject[polls];
                delete userObject[polls];
            }
        };
        if (version < 2) {
            migrateAttributes();
            Cryptpad.feedback('Migrate-2', true);
            userObject.version = version = 2;
        }



        // Migration 3: language from localStorage to settings
        var migrateLanguage = function () {
            if (!localStorage.CRYPTPAD_LANG) { return; }
            var l = localStorage.CRYPTPAD_LANG;
            userObject.settings.language = l;
        };
        if (version < 3) {
            migrateLanguage();
            Cryptpad.feedback('Migrate-3', true);
            userObject.version = version = 3;
        }
    };
});
