(function () {
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

    var create = Module.create = function (msg, title, icon) {
        return new Notification(title,{
            // icon: icon,
            body: msg,
        });
    };

    var system = Module.system = function (msg, title, icon) {
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

    var tab = Module.tab = function (msg, frequency, count) {
        var original = document.title;
        var key = '_pendingTabNotification';

        var favicon = document.getElementById('favicon');
        if (favicon) {
            var main = favicon.getAttribute('href');
            var alt = favicon.getAttribute('data-alt-favicon');
        }

        var cancel = function () {
            // only run one tab notification at a time
            if (Module[key]) {
                window.clearInterval(Module[key]);
                document.title = original;
                if (favicon) {
                    favicon.setAttribute('href', main);
                }

                return true;
            }
            return false;
        };

        cancel();

        var step = function () {
            document.title = (document.title === original) ? msg : original;
            if (favicon) {
                favicon.setAttribute('href', favicon.getAttribute('href') === main? alt : main);
            }

            --count;
        };

        Module[key] = window.setInterval(function () {
            if (count > 0) { return step(); }
            cancel();
        }, frequency);
        step();

        return {
            cancel: cancel,
            original: original
        };
    };

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = Module;
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define(function () {
            return Module;
        });
    } else {
        window.Visible = Module;
    }
}());
