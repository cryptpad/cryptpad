// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/requireconfig.js', 
    '/customize/application_config.js'
], function (RequireConfig, AppConfig) {

    // if an AppConfig.defaultDarkTheme variable is added to application_config.js and set to true, this sets the theme to dark by default irrespective of browser settings
    var checkDefaultDarkTheme = function () {
        if (AppConfig.defaultDarkTheme) {
            return 'dark';
        }
        var isDarkOS = function () {
            try {
                return window.matchMedia('(prefers-color-scheme: dark)').matches;
            } catch (e) { return false; }
        };
        return isDarkOS() ? 'dark' : 'light';
    };
    var os = checkDefaultDarkTheme();

    try {
        var flush = window.CryptPad_flushCache = function () {
            Object.keys(localStorage).forEach(function (k) {
                if (k.indexOf('CRYPTPAD_CACHE|') !== 0 && k.indexOf('LESS_CACHE') !== 0) { return; }
                delete localStorage[k];
            });
        };

        var key = 'CRYPTPAD_STORE|colortheme';
        window.CryptPad_theme = localStorage[key] || os;
        if (!localStorage[key]) {
            // We're using OS theme, check if we need to change
            if (os !== localStorage[key+'_default']) {
                console.warn('New OS theme, flush cache');
                flush();
                localStorage[key+'_default'] = os;
            }
        }
        if (window.CryptPad_theme === 'dark') {
            var s = document.createElement('style');
            s.innerHTML = 'body { background: black; }';
            document.body.appendChild(s);
        }
    } catch (e) { console.error(e); }



    // This is stage 1, it can be changed but you must bump the version of the project.
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
            console.error("Require.js threw a Script Error. This probably means you're missing a dependency for CryptPad.\nIt is recommended that the admin of this server runs `npm install && npm run install:components` to get the latest code.\nBest of luck,\nThe CryptPad Developers");
            return void console.log();
        }
        if (window.CryptPad_loadingError) {
            window.CryptPad_loadingError(e);
        }
        throw e;
    };

    try {
        var test_key = 'localStorage_test';
        var testval = Math.random().toString();
        localStorage.setItem(test_key, testval);
        if (localStorage.getItem(test_key) !== testval) {
            failStore();
        }
    } catch (e) { console.error(e); failStore(); }

    if (typeof(Promise) !== 'function') {
        return void setTimeout(function () {
            var s = "Internet Explorer is not supported anymore, including by Microsoft.\n\nMost of CryptPad's collaborative functionality requires a modern browser to work.\n\nWe recommend Mozilla Firefox.";
            window.alert(s);
        });
    }
    require([document.querySelector('script[data-bootload]').getAttribute('data-bootload')]);
});
