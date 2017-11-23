define([
    '/common/visible.js',
    '/common/notify.js'
], function (Visible, Notify) {
    var Notifier = {};

    var notify = {};
    Notifier.unnotify = function () {
        if (notify.tabNotification &&
            typeof(notify.tabNotification.cancel) === 'function') {
            notify.tabNotification.cancel();
        }
    };

    Notifier.notify = function () {
        if (Visible.isSupported() && !Visible.currently()) {
            Notifier.unnotify();
            notify.tabNotification = Notify.tab(1000, 10);
        }
    };

    if (Visible.isSupported()) {
        Visible.onChange(function (yes) {
            if (yes) { Notifier.unnotify(); }
        });
    }

    return Notifier;
});
