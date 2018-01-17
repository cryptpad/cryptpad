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

    if (typeof(window.Symbol) !== 'function') {
        var idCounter = 0;
        var Symbol = window.Symbol = function Symbol(key) {
            return '__' + key + '_' + Math.floor(Math.random() * 1e9) + '_' + (++idCounter) + '__';
        };
        Symbol.iterator = Symbol('Symbol.iterator');
    }

    var failStore = function () {
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
