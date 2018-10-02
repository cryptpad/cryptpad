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

    Notifier.notify = function (data) {
        if (Visible.isSupported() && !Visible.currently()) {
            if (data) {
                var title = data.title;
                if (document.title) { title += ' (' + document.title + ')'; }
                Notify.system(data.msg, title);
                return;
            }
            Notifier.unnotify();
            notify.tabNotification = Notify.tab(1000, 10);
        }
    };

    Notifier.getPermission = function () {
        if (Notify.isSupported()) {
            Notify.getPermission();
        }
    };

    if (Visible.isSupported()) {
        Visible.onChange(function (yes) {
            if (yes) { Notifier.unnotify(); }
        });
    }

    return Notifier;
});
