define([
    '/common/common-feedback.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
], function (Feedback, Hash, Util, nThen) {
    // Start migration check
    // Versions:
    // 1: migrate pad attributes
    // 2: migrate indent settings (codemirror)

    return function (userObject, cb, progress) {
        var version = userObject.version || 0;

        nThen(function () {
            // DEPRECATED
            // Migration 1: pad attributes moved to filesData
            var migratePadAttributesToData = function () {
                return true;
            };
            if (version < 1) {
                migratePadAttributesToData();
            }
        }).nThen(function () {
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
                Feedback.send('Migrate-2', true);
                userObject.version = version = 2;
            }
        }).nThen(function () {
            // Migration 3: language from localStorage to settings
            var migrateLanguage = function () {
                if (!localStorage.CRYPTPAD_LANG) { return; }
                var l = localStorage.CRYPTPAD_LANG;
                userObject.settings.language = l;
            };
            if (version < 3) {
                migrateLanguage();
                Feedback.send('Migrate-3', true);
                userObject.version = version = 3;
            }
        }).nThen(function () {
            // Migration 4: allowUserFeedback to settings
            var migrateFeedback = function () {
                var settings = userObject.settings = userObject.settings || {};
                if (typeof(userObject['allowUserFeedback']) !== "undefined") {
                    settings.general = settings.general || {};
                    settings.general.allowUserFeedback = userObject['allowUserFeedback'];
                    delete userObject['allowUserFeedback'];
                }
            };
            if (version < 4) {
                migrateFeedback();
                Feedback.send('Migrate-4', true);
                userObject.version = version = 4;
            }
        }).nThen(function () {
            // Migration 5: dates to Number
            var migrateDates = function () {
                var data = userObject.drive && userObject.drive.filesData;
                if (data) {
                    for (var id in data) {
                        if (typeof data[id].ctime !== "number") {
                            data[id].ctime = +new Date(data[id].ctime);
                        }
                        if (typeof data[id].atime !== "number") {
                            data[id].atime = +new Date(data[id].atime);
                        }
                    }
                }
            };
            if (version < 5) {
                migrateDates();
                Feedback.send('Migrate-5', true);
                userObject.version = version = 5;
            }
        }).nThen(function (waitFor) {
            var addChannelId = function () {
                var data = userObject.drive.filesData;
                var el, parsed;
                var n = nThen(function () {});
                var padsLength = Object.keys(data).length;
                Object.keys(data).forEach(function (k, i) {
                    n = n.nThen(function (w) {
                        setTimeout(w(function () {
                            el = data[k];
                            parsed = Hash.parsePadUrl(el.href);
                            if (!el.href) { return; }
                            if (!el.channel) {
                                var secret = Hash.getSecrets(parsed.type, parsed.hash, el.password);
                                el.channel = secret.channel;
                                progress(6, Math.round(100*i/padsLength));
                                console.log('Adding missing channel in filesData ', el.channel);
                            }
                        }));
                    });
                });
                n.nThen(waitFor());
            };
            if (version < 6) {
                addChannelId();
                Feedback.send('Migrate-6', true);
                userObject.version = version = 6;
            }
        /*}).nThen(function (waitFor) {
            // Test progress bar in the loading screen
            var i = 0;
            var w = waitFor();
            var it = setInterval(function () {
                i += 5;
                if (i >= 100) { w(); clearInterval(it); i = 100;}
                progress(0, i);
            }, 500);
            progress(0, 0);*/
        }).nThen(function () {
            cb();
        });
    };
});
