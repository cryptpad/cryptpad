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

    var failStore = function () {
        if (document.cookie.indexOf('test=') === 0) {
            // We're testing in safari and safaridriver runs everything in a private window
            // However, for our tests nothing lasts more than a single page load so we can
            // stub the localStorage

            // This is shamelessly copy/pasted from sframe-boot2.js :(
            var mkFakeStore = function () {
                var fakeStorage = {
                    getItem: function (k) { return fakeStorage[k]; },
                    setItem: function (k, v) { fakeStorage[k] = v; return v; },
                    removeItem: function (k) { delete fakeStorage[k]; }
                };
                return fakeStorage;
            };
            window.__defineGetter__('localStorage', function () { return mkFakeStore(); });
            window.__defineGetter__('sessionStorage', function () { return mkFakeStore(); });
            return;
        }
        console.error(new Error('wut'));
        require(['jquery'], function ($) {
            $.ajax({
                type: 'HEAD',
                url: '/common/feedback.html?NO_LOCALSTORAGE=' + (+new Date()),
            });
        });
        window.alert("CryptPad needs localStorage to work, try a different browser");
    };

    try {
        var test_key = 'localStorage_test';
        var testval = Math.random().toString();
        localStorage.setItem(test_key, testval);
        if (localStorage.getItem(test_key) !== testval) {
            failStore();
        }
    } catch (e) { console.error(e); failStore(); }

    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
