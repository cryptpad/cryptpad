// This is stage 1, it can be changed but you must bump the version of the project.
define([
    '/common/requireconfig.js'
], function (RequireConfig) {
    require.config(RequireConfig());

    // most of CryptPad breaks if you don't support isArray
    if (!Array.isArray) {
        Array.isArray = function(arg) { // CRYPTPAD_SHIM
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

    // file encryption/decryption won't work if you don't have Array.fill
    if (typeof(Array.prototype.fill) !== 'function') {
        Array.prototype.fill = function (x) { // CRYPTPAD_SHIM
            var i = 0;
            var l = this.length;
            for (;i < l; i++) { this[i] = x; }
            return this;
        };
    }

    // RPC breaks if you don't support Number.MAX_SAFE_INTEGER
    if (Number && !Number.MAX_SAFE_INTEGER) {
        Number.MAX_SAFE_INTEGER = 9007199254740991;
    }

    var failStore = function () {
        console.error(new Error('wut'));
        require(['jquery'], function ($) {
            $.ajax({
                type: 'HEAD',
                url: '/common/feedback.html?NO_LOCALSTORAGE=' + (+new Date()),
            });
        });
        window.alert("CryptPad needs localStorage to work. Try changing your cookie permissions, or using a different browser");
    };

    window.onerror = function (e) {
        if (/requirejs\.org/.test(e)) {
            console.log();
            console.error("Require.js threw a Script Error. This probably means you're missing a dependency for CryptPad.\nIt is recommended that the admin of this server runs `bower install && bower update` to get the latest code, then modify their cache version.\nBest of luck,\nThe CryptPad Developers");
            return void console.log();
        }
        if (window.CryptPad_loadingError) {
            window.CryptPad_loadingError(e);
        }
        throw e;
    };

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled rejection (promise: ', event.promise, ', reason: ', event.reason, ').');
    });

    try {
        var test_key = 'localStorage_test';
        var testval = Math.random().toString();
        localStorage.setItem(test_key, testval);
        if (localStorage.getItem(test_key) !== testval) {
            failStore();
        }
    } catch (e) { console.error(e); failStore(); }

    var called = false;
    var load = function () {
        if (called) { return; }
        called = true;
        require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
    };

    var urlArgs = RequireConfig().urlArgs;
    var sw = window.navigator.serviceWorker;
    // If the browser doesn't support service workers, just start loading normally
    if (!sw) { return void load(); }

    // TOFU
    // calling back 'true' means it's safe to proceed
    // otherwise load the old version
    var TOFU_KEY = 'TOFU_URL_ARGS';
    var checkVersion = function (msg, cb) {
        var newUrlArgs = urlArgs;
        var k = TOFU_KEY;
        try {
            var oldUrlArgs = localStorage.getItem(k);
            if (!oldUrlArgs) {
                //localStorage.setItem(k, newUrlArgs);
                return void cb(true);
            }
            if (oldUrlArgs === newUrlArgs) {
                return void cb(true);
            }
            // we don't have our fancy loading screen or other UI, so use window.confirm
            return void setTimeout(function () {
                var answer = window.confirm(msg);
                //localStorage.setItem(k, newUrlArgs);
                return void cb(answer);
            });
        } catch (err) {
            localStorage.removeItem(k);
            return void cb(false);
        }
    };

    var loadServiceWorker = function (args, offline) {
        var path = '/sw.js?' + args; // + (offline ? '&offline=1': ''); // XXX wrong way to do offline...
        try {
            sw
                .register(path, { scope: '/' })
                .then(function (reg) {
                    // XXX tell the service worker if it should stay offline...

                    localStorage.setItem(TOFU_KEY, args);
                    console.log("service-worker registered", reg);
                    load();
                })
                .catch(function (err) {
                    console.error(err);
                    load();
                });
        } catch (e) {
            console.error(e);
            load();
        }
    };

    var msg = "ok to load a new version of cryptpad (" + urlArgs + ")?";
    checkVersion(msg, function (consent) {
        var consentfulWorker = urlArgs;
        var offline = false;

        //console.log(urlArgs);
        if (!consent) {
            consentfulWorker = localStorage.getItem(TOFU_KEY);
            offline = true;
            //return void loadServiceWorker(localStorage.getItem(TOFU_KEY), true);
        } else {
            console.error("THE USER CONSENTED TO THE UPDATE");
        }
        window.consentfulWorker = consentfulWorker;

        loadServiceWorker(consentfulWorker, offline);
    });
});
