define(['/api/config'], function (ApiConfig) {
    var Module = {};

    var DEFAULT_MAIN = '/customize/main-favicon.png?' + ApiConfig.requireConf.urlArgs;
    var DEFAULT_ALT = '/customize/alt-favicon.png?' + ApiConfig.requireConf.urlArgs;

    var document = window.document;

    var isSupported = Module.isSupported = function () {
        return typeof(window.Notification) === 'function' && window.isSecureContext;
    };

    var hasPermission = Module.hasPermission = function () {
        return Notification.permission === 'granted';
    };

    var getPermission = Module.getPermission = function (f) {
        f = f || function () {};
        Notification.requestPermission(function (permission) {
            if (permission === "granted") { f(true); }
            else { f(false); }
        });
    };

    var create = Module.create = function (msg, title, icon) {
        if (document && !icon) {
            var favicon = document.getElementById('favicon');
            icon = favicon.getAttribute('data-main-favicon') || DEFAULT_ALT;
        } else if (!icon) {
            icon = DEFAULT_ALT;
        }

        return new Notification(title,{
            icon: icon,
            body: msg,
        });
    };

    Module.system = function (msg, title, icon) {
        // Let's check if the browser supports notifications
        if (!isSupported()) { return; /*console.log("Notifications are not supported");*/ }

        // Let's check whether notification permissions have already been granted
        else if (hasPermission()) {
            // If it's okay let's create a notification
            return create(msg, title, icon);
        }

        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== 'denied') {
            getPermission(function (state) {
                if (state) { create(msg, title, icon); }
            });
        }
    };

    var createFavicon = function () {
        if (!document) {
            return void console.error('document is not available in this context');
        }
        console.debug("creating favicon");
        var fav = document.createElement('link');
        var attrs = {
            id: 'favicon',
            type: 'image/png',
            rel: 'icon',
            'data-main-favicon': DEFAULT_MAIN,
            'data-alt-favicon': DEFAULT_ALT,
            href: DEFAULT_MAIN,
        };
        Object.keys(attrs).forEach(function (k) {
            fav.setAttribute(k, attrs[k]);
        });
        document.head.appendChild(fav);
    };

    if (document && !document.getElementById('favicon')) { createFavicon(); }

    Module.tab = function (frequency, count) {
        if (!document) {
            return void console.error('document is not available in this context');
        }
        var key = '_pendingTabNotification';

        var favicon = document.getElementById('favicon');

        var main = DEFAULT_MAIN;
        var alt = DEFAULT_ALT;

        if (favicon) {
            main = favicon.getAttribute('data-main-favicon') || DEFAULT_MAIN;
            alt = favicon.getAttribute('data-alt-favicon') || DEFAULT_ALT;
            favicon.setAttribute('href', main);
        }

        var cancel = function (pending) {
            // only run one tab notification at a time
            if (Module[key]) {
                window.clearInterval(Module[key]);
                if (favicon) {
                    favicon.setAttribute('href', pending? alt : main);
                }

                return true;
            }
            return false;
        };

        cancel();

        var step = function () {
            if (favicon) {
                favicon.setAttribute('href', favicon.getAttribute('href') === main? alt : main);
            }
            --count;
        };

        Module[key] = window.setInterval(function () {
            if (count > 0) { return step(); }
            cancel(true);

        }, frequency);
        step();

        return {
            cancel: cancel,
        };
    };

    return Module;
});
