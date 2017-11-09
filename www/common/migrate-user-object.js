define([], function () {
    // Start migration check
    // Versions:
    // 1: migrate pad attributes
    // 2: migrate indent settings (codemirror)

    return function (userObject, Cryptpad) {
        var version = userObject.version || 0;

        // DEPRECATED
        // Migration 1: pad attributes moved to filesData
        var migratePadAttributesToData = function () {
            return true;
        };
        if (version < 1) {
            migratePadAttributesToData();
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



        // Migration 4: allowUserFeedback to settings
        var migrateLanguage = function () {
            var settings = userObject.settings = userObject.settings || {};
            if (typeof(userObject['allowUserFeedback']) !== "undefined") {
                settings.general = settings.general || {};
                settings.general.allowUserFeedback = userObject['allowUserFeedback'];
                delete userObject['allowUserFeedback'];
            }
        };
        if (version < 4) {
            migrateLanguage();
            Cryptpad.feedback('Migrate-4', true);
            userObject.version = version = 4;
        }
    };
});
