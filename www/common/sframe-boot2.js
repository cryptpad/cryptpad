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

    // In the event that someone clicks a link in the iframe, it's going to cause the iframe
    // to navigate away from the pad which is going to be a mess. Instead we'll just reload
    // the top level and then it will be simply that a link doesn't work properly.
    window.onunload = function () {
        window.parent.location.reload();
    };

    // Make sure anything which might have leaked to the localstorage is always cleaned up.
    try { window.localStorage.clear(); } catch (e) { }
    try { window.sessionStorage.clear(); } catch (e) { }

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
