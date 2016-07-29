define([
    '/customize/messages.js',
    '/customize/store.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Store, Crypto, Alertify) {
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

    var getHash = common.getHash = function () {
        return window.location.hash.slice(1);
    };

    var setPadAttribute = common.setPadAttribute = function (attr, value, cb) {
        Store.set([getHash(), attr].join('.'), value, function (err, data) {
            cb(err, data);
        });
    };

    var getPadAttribute = common.getPadAttribute = function (attr, cb) {
        Store.get([getHash(), attr].join('.'), function (err, data) {
            cb(err, data);
        });
    };

    /* fetch and migrate your pad history from localStorage */
    var getRecentPads = common.getRecentPads = function (cb) {
        Store.get(storageKey, function (err, recentPads) {
            if (isArray(recentPads)) {
                cb(void 0, migrateRecentPads(recentPads));
                return;
            }
            cb(void 0, []);
        });
    };

    /* commit a list of pads to localStorage */
    var setRecentPads = common.setRecentPads = function (pads, cb) {
        Store.set(storageKey, pads, function (err, data) {
            cb(err, data);
        });
    };

    /* Sort pads according to how recently they were accessed */
    var mostRecent = common.mostRecent = function (a, b) {
        return new Date(b.atime).getTime() - new Date(a.atime).getTime();
    };

    var forgetPad = common.forgetPad = function (href, cb) {
        var hash;
        href.replace(/#(.*)$/, function (x, h) { hash = h; });
        if (!hash) {
            return;
        }

        getRecentPads(function (err, recentPads) {
            console.log(recentPads);
            setRecentPads(recentPads.filter(function (pad) {
                if (pad.href !== href) {
                    return true;
                }
            }), function (err, data) {
                if (err) {
                    cb(err);
                    return;
                }

                Store.keys(function (err, keys) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    var toRemove = keys.filter(function (k) {
                        return k.indexOf(hash) === 0;
                    });

                    Store.removeBatch(toRemove, function (err, data) {
                        cb(err, data);
                    });
                });
            });
        });
    };

    var makePad = function (href, title) {
        var now = new Date();
        return {
            href: href,
            atime: now,
            ctime: now,
            title: title || window.location.hash.slice(1, 9),
        };
    };

    var rememberPad = common.rememberPad = window.rememberPad = function (title, cb) {
        // bail out early
        if (!/#/.test(window.location.hash)) { return; }

        getRecentPads(function (err, pads) {
            if (err) {
                cb(err);
                return;
            }

            //var pads = getRecentPads();

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
                // href, ctime, atime, title
                out.push(makePad(href, title));
            }
            setRecentPads(out, function (err, data) {
                cb(err, data);
            });
        });
    };

    var setPadTitle = common.setPadTitle = function (name, cb) {
        var href = window.location.href;

        getRecentPads(function (err, recent) {
            if (err) {
                cb(err);
                return;
            }

            var contains;

            var renamed = recent.map(function (pad) {
                if (pad.href === href) {
                    contains = true;
                    // update the atime
                    pad.atime = new Date().toISOString();

                    // set the name
                    pad.title = name;
                }
                return pad;
            });

            if (!contains) {
                renamed.push(makePad(href, name));
            }

            setRecentPads(renamed, function (err, data) {
                cb(err, data);
            });
        });
    };

    var getPadTitle = common.getPadTitle = function (cb) {
        var href = window.location.href;
        var hashSlice = window.location.hash.slice(1,9);
        var title = '';

        getRecentPads(function (err, pads) {
            if (err) {
                cb(err);
                return;
            }
            pads.some(function (pad) {
                if (pad.href === href) {
                    title = pad.title || hashSlice;
                    return true;
                }
            });

            cb(void 0, title);
        });
    };

    var causesNamingConflict = common.causesNamingConflict = function (title, cb) {
        var href = window.location.href;

        getRecentPads(function (err, pads) {
            if (err) {
                cb(err);
                return;
            }
            var conflicts = pads.some(function (pad) {
                return pad.title === title &&
                    pad.href !== href;
            });
            cb(void 0, conflicts);
        });
    };


    var fixFileName = common.fixFileName = function (filename) {
        return filename.replace(/ /g, '-').replace(/\//g, '_');
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
        var $link = $('link[href="/customize/alertify.css"]');
        if ($link.length) { return; }

        href = href || '/customize/alertify.css';
        $('head').append($('<link>', {
            rel: 'stylesheet',
            id: 'alertifyCSS',
            href: href,
        }));
    };

    var findCancelButton = common.findCancelButton = function () {
        return $('button.cancel');
    };

    var findOKButton = common.findOKButton = function () {
        return $('button.ok');
    };

    var listenForKeys = function (yes, no) {
        var handler = function (e) {
            switch (e.which) {
                case 27: // cancel
                    if (typeof(no) === 'function') { no(e); }
                    no();
                    break;
                case 13: // enter
                    if (typeof(yes) === 'function') { yes(e); }
                    break;
            }
        };

        $(window).keyup(handler);
        return handler;
    };

    var stopListening = function (handler) {
        $(window).off('keyup', handler);
    };

    common.alert = function (msg, cb) {
        cb = cb || function () {};
        var keyHandler = listenForKeys(function (e) { // yes
            findOKButton().click();
        });
        Alertify.alert(msg, function (ev) {
            cb(ev);
            stopListening(keyHandler);
        });
    };

    common.prompt = function (msg, def, cb, opt) {
        opt = opt || {};
        cb = cb || function () {};

        var keyHandler = listenForKeys(function (e) { // yes
            findOKButton().click();
        }, function (e) { // no
            findCancelButton().click();
        });

        Alertify
            .defaultValue(def || '')
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .prompt(msg, function (val, ev) {
                cb(val, ev);
                stopListening(keyHandler);
            }, function (ev) {
                cb(null, ev);
                stopListening(keyHandler);
            });
    };

    common.confirm = function (msg, cb, opt) {
        opt = opt || {};
        cb = cb || function () {};
        var keyHandler = listenForKeys(function (e) {
            findOKButton().click();
        }, function (e) {
            findCancelButton().click();
        });

        Alertify
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .confirm(msg, function () {
                cb(true);
                stopListening(keyHandler);
            }, function () {
                cb(false);
                stopListening(keyHandler);
            });
    };

    common.log = function (msg) {
        Alertify.success(msg);
    };

    common.warn = function (msg) {
        Alertify.error(msg);
    };

    return common;
});
