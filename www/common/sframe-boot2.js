// This is stage 1, it can be changed but you must bump the version of the project.
// Note: This must only be loaded from inside of a sandbox-iframe.
define([
    '/common/requireconfig.js',
    //'/common/test.js'
], function (RequireConfig /*, Test */) {
    require.config(RequireConfig());

    // most of CryptPad breaks if you don't support isArray
    if (!Array.isArray) {
        Array.isArray = function(arg) { // CRYPTPAD_SHIM
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }

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

    window.CRYPTPAD_INSIDE = true;

    // This test is for keeping the testing infrastructure operating
    // until all tests have been registered.
    // This test is completed in common-interface.js
    //Test(function (t) { Test.__ASYNC_BLOCKER__ = t; });

    window.onerror = function (e) {
        if (/requirejs\.org/.test(e)) {
            console.log();
            console.error("Require.js threw a Script Error. This probably means you're missing a dependency for CryptPad.\nIt is recommended that the admin of this server runs `bower install && bower update` to get the latest code, then modify their cache version.\nBest of luck,\nThe CryptPad Developers");
            return void console.log();
        }
        if (window.CryptPad_loadingError) {
            return void window.CryptPad_loadingError(e);
        }
        throw e;
    };

    if (typeof(Promise) !== 'function') {
        return void setTimeout(function () {
            var s = "Internet Explorer is not supported anymore, including by Microsoft.\n\nMost of CryptPad's collaborative functionality requires a modern browser to work.\n\nWe recommend Mozilla Firefox.";
            window.alert(s);
        });
    }

    var caughtEval;
    try {
        eval('true'); // jshint ignore:line
    } catch (err) { caughtEval = true; }

    if (!/^\/(sheet|doc|presentation)/.test(window.location.pathname) && !caughtEval) {
        return void setTimeout(function () {
            window.alert("aborting because eval should not be permitted.");
        });
    }
    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
