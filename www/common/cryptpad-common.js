define([
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Crypto, Alertify) {
/*  This file exposes functionality which is specific to Cryptpad, but not to
    any particular pad type. This includes functions for committing metadata
    about pads to your local storage for future use and improved usability.

    Additionally, there is some basic functionality for import/export.
*/
    var $ = window.jQuery;

    var common = {};

    var isArray = function (o) { return Object.prototype.toString.call(o) === '[object Array]'; };

    var getSecrets = common.getSecrets = function () {
        var secret = {};
        if (!/#/.test(window.location.href)) {
            secret.key = Crypto.genKey();
        } else {
            var hash = window.location.hash.slice(1);
            secret.channel = hash.slice(0, 32);
            secret.key = hash.slice(32);
        }
        return secret;
    };

    var storageKey = common.storageKey = 'CryptPad_RECENTPADS';
    //var timeframe = common.timeframe = 1000 * 60 * 60 * 24 * 30;

    /*
        the first time this gets called, your local storage will migrate to a
        new format. No more indices for values, everything is named now.

        * href
        * atime (access time)
        * title
        * ??? // what else can we put in here?
    */
    var migrateRecentPads = common.migrateRecentPads = function (pads) {
        return pads.map(function (pad) {
            if (isArray(pad)) {
                var href = pad[0];
                var hash;
                href.replace(/\#(.*)$/, function (a, h) {
                    hash = h;
                });

                return {
                    href: pad[0],
                    atime: pad[1],
                    title: pad[2] || hash && hash.slice(0,8),
                    ctime: pad[1],
                };
            } else if (typeof(pad) === 'object') {
                if (!pad.ctime) { pad.ctime = pad.atime; }
                if (!pad.title) {
                    pad.href.replace(/#(.*)$/, function (x, hash) {
                        pad.title = hash.slice(0,8);
                    });
                }
                return pad;
            } else {
                console.error("[Cryptpad.migrateRecentPads] pad had unexpected value");
                console.log(pad);
                return {};
            }
        });
    };

    /* fetch and migrate your pad history from localStorage */
    var getRecentPads = common.getRecentPads = function () {
        var recentPadsStr = localStorage[storageKey];

        var recentPads = [];
        if (recentPadsStr) {
            try {
                recentPads = JSON.parse(recentPadsStr);
            } catch (err) {
                // couldn't parse the localStorage?
                // just overwrite it.
            }
        }
        return migrateRecentPads(recentPads);
    };

    /* commit a list of pads to localStorage */
    var setRecentPads = common.setRecentPads = function (pads) {
        localStorage.setItem(storageKey, JSON.stringify(pads));
    };

    /* Sort pads according to how recently they were accessed */
    var mostRecent = common.mostRecent = function (a, b) {
        return new Date(b.atime).getTime() - new Date(a.atime).getTime();
    };

    var forgetPad = common.forgetPad = function (href) {
        var recentPads = getRecentPads().filter(function (pad) {
            return pad.href !== href;
        });
        setRecentPads(recentPads);
    };

    var rememberPad = common.rememberPad = window.rememberPad = function (title) {
        // bail out early
        if (!/#/.test(window.location.hash)) { return; }

        var pads = getRecentPads();

        var now = new Date();
        var href = window.location.href;

        var isUpdate = false;

        var out = pads.map(function (pad) {
            if (pad && pad.href === href) {
                isUpdate = true;
                // bump the atime
                pad.atime = now;

                pad.title = title;
            }
            return pad;
        });

        if (!isUpdate) {
            // href, atime, name
            out.push({
                href: href,
                atime: now,
                ctime: now,
                title: title || window.location.hash.slice(1,9),
            });
        }
        setRecentPads(out);
    };

    var setPadTitle = common.setPadTitle = function (name) {
        var href = window.location.href;
        var recent = getRecentPads();

        var renamed = recent.map(function (pad) {
            if (pad.href === href) {
                // update the atime
                pad.atime = new Date().toISOString();

                // set the name
                pad.title = name;
            }
            return pad;
        });

        setRecentPads(renamed);
    };

    var getPadTitle = common.getPadTitle = function () {
        var href = window.location.href;
        var hashSlice = window.location.hash.slice(1,9);
        var title = '';
        getRecentPads().some(function (pad) {
            if (pad.href === href) {
                title = pad.title || hashSlice;
                return true;
            }
        });
        return title;
    };

    var causesNamingConflict = common.causesNamingConflict = function (title) {
        var href = window.location.href;
        return getRecentPads().some(function (pad) {
            return pad.title === title &&
                pad.href !== href;
        });
    };

    var importContent = common.importContent = function (type, f) {
        return function () {
            var $files = $('<input type="file">').click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    var styleAlerts = common.styleAlerts = function (href) {
        href = href || '/customize/alertify.css';
        $('head').append($('<link>', {
            rel: 'stylesheet',
            id: 'alertifyCSS',
            href: href,
        }));
    };

    common.alert = function (msg, cb) {
        Alertify.alert(msg, cb);
    };

    common.prompt = function (msg, def, cb, opt) {
        opt = opt || {};
        Alertify
            .defaultValue(def || '')
            .okBtn(opt.ok || 'OK')
            .cancelBtn(opt.cancel || 'Cancel')
            .prompt(msg, function (val, ev) {
                cb(val, ev);
            }, function (ev) {
                cb(null, ev);
            });
    };

    common.confirm = function (msg, cb, opt) {
        opt = opt || {};
        Alertify
            .okBtn(opt.ok || 'OK')
            .cancelBtn(opt.cancel || 'Cancel')
            .confirm(msg, function () {
                cb(true);
            }, function () {
                cb(false);
            });
    };

    return common;
});
