// This is stage 1, it can be changed but you must bump the version of the project.
// Note: This must only be loaded from inside of a sandbox-iframe.
define(['/common/requireconfig.js'], function (RequireConfig) {
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
            setItem: function (k, v) { fakeStorage[k] = v; return v; }
        };
        return fakeStorage;
    };
    window.__defineGetter__('localStorage', function () { return mkFakeStore(); });
    window.__defineGetter__('sessionStorage', function () { return mkFakeStore(); });

    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
