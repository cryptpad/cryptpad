define([
    '/customize/messages.js',
    '/common/common-util.js',
    '/customize/application_config.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Messages, Util, AppConfig, Alertify) {
    var $ = window.jQuery;

    var UI = {};

    /*
     *  Alertifyjs
     */
    UI.Alertify = Alertify;

    // set notification timeout
    Alertify._$$alertify.delay = AppConfig.notificationTimeout || 5000;

    var findCancelButton = UI.findCancelButton = function () {
        return $('button.cancel');
    };

    var findOKButton = UI.findOKButton = function () {
        return $('button.ok');
    };

    var listenForKeys = UI.listenForKeys = function (yes, no) {
        var handler = function (e) {
            switch (e.which) {
                case 27: // cancel
                    if (typeof(no) === 'function') { no(e); }
                    no();
                    break;
                case 13: // enter
                    if (typeof(yes) === 'function') { yes(e); }
                    break;
            }
        };

        $(window).keyup(handler);
        return handler;
    };

    var stopListening = UI.stopListening = function (handler) {
        $(window).off('keyup', handler);
    };

    UI.alert = function (msg, cb, force) {
        cb = cb || function () {};
        if (force !== true) { msg = Util.fixHTML(msg); }
        var close = function (e) {
            findOKButton().click();
        };
        var keyHandler = listenForKeys(close, close);
        Alertify.alert(msg, function (ev) {
            cb(ev);
            stopListening(keyHandler);
        });
        window.setTimeout(function () {
            findOKButton().focus();
        });
    };

    UI.prompt = function (msg, def, cb, opt, force) {
        opt = opt || {};
        cb = cb || function () {};
        if (force !== true) { msg = Util.fixHTML(msg); }

        var keyHandler = listenForKeys(function (e) { // yes
            findOKButton().click();
        }, function (e) { // no
            findCancelButton().click();
        });

        Alertify
            .defaultValue(def || '')
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .prompt(msg, function (val, ev) {
                cb(val, ev);
                stopListening(keyHandler);
            }, function (ev) {
                cb(null, ev);
                stopListening(keyHandler);
            });
    };

    UI.confirm = function (msg, cb, opt, force, styleCB) {
        opt = opt || {};
        cb = cb || function () {};
        if (force !== true) { msg = Util.fixHTML(msg); }

        var keyHandler = listenForKeys(function (e) {
            findOKButton().click();
        }, function (e) {
            findCancelButton().click();
        });

        Alertify
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .confirm(msg, function () {
                cb(true);
                stopListening(keyHandler);
            }, function () {
                cb(false);
                stopListening(keyHandler);
            });

        window.setTimeout(function () {
            var $ok = findOKButton();
            var $cancel = findCancelButton();
            if (opt.okClass) { $ok.addClass(opt.okClass); }
            if (opt.cancelClass) { $cancel.addClass(opt.cancelClass); }
            if (opt.reverseOrder) {
                $ok.insertBefore($ok.prev());
            }
            if (typeof(styleCB) === 'function') {
                styleCB($ok.closest('.dialog'));
            }
        }, 0);
    };

    UI.log = function (msg) {
        Alertify.success(Util.fixHTML(msg));
    };

    UI.warn = function (msg) {
        Alertify.error(Util.fixHTML(msg));
    };

    return UI;
});
