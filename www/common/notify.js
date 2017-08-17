(function () {
    var Mod = function (ApiConfig) {
        var requireConf;
        if (ApiConfig && ApiConfig.requireConf) {
            requireConf = ApiConfig.requireConf;
        }
        var urlArgs = typeof(requireConf.urlArgs) === 'string'? '?' + urlArgs: '';

    var Module = {};

    var isSupported = Module.isSupported = function () {
        return typeof(window.Notification) === 'function';
    };

    var hasPermission = Module.hasPermission = function () {
        return Notification.permission === 'granted';
    };

    var getPermission = Module.getPermission = function (f) {
        Notification.requestPermission(function (permission) {
            if (permission === "granted") { f(true); }
            else { f(false); }
        });
    };

    var create = Module.create = function (msg, title) {
        return new Notification(title,{
            // icon: icon,
            body: msg,
        });
    };

    Module.system = function (msg, title, icon) {
        // Let's check if the browser supports notifications
        if (!isSupported()) { console.log("Notifications are not supported"); }

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

    var DEFAULT_MAIN = '/customize/main-favicon.png' + urlArgs;
    var DEFAULT_ALT = '/customize/alt-favicon.png' + urlArgs;

    var createFavicon = function () {
        console.log("creating favicon");
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

    if (!document.getElementById('favicon')) { createFavicon(); }

    Module.tab = function (frequency, count) {
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
    };

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = Mod();
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define(['/api/config'], Mod);
    } else {
        window.Visible = Mod();
    }
}());
