define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/customize/application_config.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/common/notify.js',
    '/common/visible.js',
    '/common/tippy.min.js',
    'css!/common/tippy.css',
], function ($, Messages, Util, AppConfig, Alertify, Notify, Visible, Tippy) {

    var UI = {};

    /*
     *  Alertifyjs
     */
    UI.Alertify = Alertify;

    // set notification timeout
    Alertify._$$alertify.delay = AppConfig.notificationTimeout || 5000;

    var findCancelButton = UI.findCancelButton = function () {
        return $('button.cancel').last();
    };

    var findOKButton = UI.findOKButton = function () {
        return $('button.ok').last();
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
        var close = function () {
            findOKButton().click();
        };
        var keyHandler = listenForKeys(close, close);
        Alertify
            .okBtn(Messages.okButton || 'OK')
            .alert(msg, function (ev) {
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

        var keyHandler = listenForKeys(function () { // yes
            findOKButton().click();
        }, function () { // no
            findCancelButton().click();
        });

        // Make sure we don't call both the "yes" and "no" handlers if we use "findOKButton().click()"
        // in the callback
        var isClicked = false;

        Alertify
            .defaultValue(def || '')
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .prompt(msg, function (val, ev) {
                if (isClicked) { return; }
                isClicked = true;
                cb(val, ev);
                stopListening(keyHandler);
            }, function (ev) {
                if (isClicked) { return; }
                isClicked = true;
                cb(null, ev);
                stopListening(keyHandler);
            });
    };

    UI.confirm = function (msg, cb, opt, force, styleCB) {
        opt = opt || {};
        cb = cb || function () {};
        if (force !== true) { msg = Util.fixHTML(msg); }

        var keyHandler = listenForKeys(function () {
            findOKButton().click();
        }, function () {
            findCancelButton().click();
        });

        // Make sure we don't call both the "yes" and "no" handlers if we use "findOKButton().click()"
        // in the callback
        var isClicked = false;

        Alertify
            .okBtn(opt.ok || Messages.okButton || 'OK')
            .cancelBtn(opt.cancel || Messages.cancelButton || 'Cancel')
            .confirm(msg, function () {
                if (isClicked) { return; }
                isClicked = true;
                cb(true);
                stopListening(keyHandler);
            }, function () {
                if (isClicked) { return; }
                isClicked = true;
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

    /*
     *  spinner
     */
    UI.spinner = function (parent) {
        var $target = $('<span>', {
            'class': 'fa fa-spinner fa-pulse fa-4x fa-fw'
        }).hide();

        $(parent).append($target);

        return {
            show: function () {
                $target.css('display', 'inline');
                return this;
            },
            hide: function () {
                $target.hide();
                return this;
            },
            get: function () {
                return $target;
            },
        };
    };

    var LOADING = 'loading';

    var getRandomTip = function () {
        if (!Messages.tips || !Object.keys(Messages.tips).length) { return ''; }
        var keys = Object.keys(Messages.tips);
        var rdm = Math.floor(Math.random() * keys.length);
        return Messages.tips[keys[rdm]];
    };
    UI.addLoadingScreen = function (loadingText, hideTips) {
        var $loading, $container;
        if ($('#' + LOADING).length) {
            $loading = $('#' + LOADING).show();
            if (loadingText) {
                $('#' + LOADING).find('p').text(loadingText);
            }
            $container = $loading.find('.loadingContainer');
        } else {
            $loading = $('<div>', {id: LOADING});
            $container = $('<div>', {'class': 'loadingContainer'});
            $container.append('<img class="cryptofist" src="/customize/cryptofist_small.png" />');
            var $spinner = $('<div>', {'class': 'spinnerContainer'});
            UI.spinner($spinner).show();
            var $text = $('<p>').text(loadingText || Messages.loading);
            $container.append($spinner).append($text);
            $loading.append($container);
            $('body').append($loading);
        }
        if (Messages.tips && !hideTips) {
            var $loadingTip = $('<div>', {'id': 'loadingTip'});
            $('<span>', {'class': 'tips'}).text(getRandomTip()).appendTo($loadingTip);
            $loadingTip.css({
                'bottom': $('body').height()/2 - $container.height()/2 + 20 + 'px'
            });
            $('body').append($loadingTip);
        }
    };
    UI.removeLoadingScreen = function (cb) {
        $('#' + LOADING).fadeOut(750, cb);
        var $tip = $('#loadingTip').css('top', '')
        // loading.less sets transition-delay: $wait-time
        // and               transition: opacity $fadeout-time
            .css({
                'opacity': 0,
                'pointer-events': 'none',
            });
            setTimeout(function () {
                $tip.remove();
            }, 3750);
        // jquery.fadeout can get stuck
    };
    UI.errorLoadingScreen = function (error, transparent) {
        if (!$('#' + LOADING).is(':visible')) { UI.addLoadingScreen(undefined, true); }
        $('.spinnerContainer').hide();
        if (transparent) { $('#' + LOADING).css('opacity', 0.8); }
        $('#' + LOADING).find('p').html(error || Messages.error);
    };

    // Notify
    var notify = {};
    UI.unnotify = function () {
        if (notify.tabNotification &&
            typeof(notify.tabNotification.cancel) === 'function') {
            notify.tabNotification.cancel();
        }
    };

    UI.notify = function () {
        if (Visible.isSupported() && !Visible.currently()) {
            UI.unnotify();
            notify.tabNotification = Notify.tab(1000, 10);
        }
    };

    if (Visible.isSupported()) {
        Visible.onChange(function (yes) {
            if (yes) { UI.unnotify(); }
        });
    }

    UI.importContent = function (type, f, cfg) {
        return function () {
            var $files = $('<input>', {type:"file"});
            if (cfg && cfg.accept) {
                $files.attr('accept', cfg.accept);
            }
            $files.click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    var $fileIcon = $('<span>', {"class": "fa fa-file-text-o file icon"});
    var $fileAppIcon = $('<span>', {"class": "fa fa-file-text-o file icon fileColor"});
    var $padIcon = $('<span>', {"class": "fa fa-file-word-o file icon padColor"});
    var $codeIcon = $('<span>', {"class": "fa fa-file-code-o file icon codeColor"});
    var $slideIcon = $('<span>', {"class": "fa fa-file-powerpoint-o file icon slideColor"});
    var $pollIcon = $('<span>', {"class": "fa fa-calendar file icon pollColor"});
    var $whiteboardIcon = $('<span>', {"class": "fa fa-paint-brush whiteboardColor"});
    var $todoIcon = $('<span>', {"class": "fa fa-tasks todoColor"});
    var $contactsIcon = $('<span>', {"class": "fa fa-users friendsColor"});
    UI.getIcon = function (type) {
        var $icon;

        switch(type) {
            case 'pad': $icon = $padIcon.clone(); break;
            case 'file': $icon = $fileAppIcon.clone(); break;
            case 'code': $icon = $codeIcon.clone(); break;
            case 'slide': $icon = $slideIcon.clone(); break;
            case 'poll': $icon = $pollIcon.clone(); break;
            case 'whiteboard': $icon = $whiteboardIcon.clone(); break;
            case 'todo': $icon = $todoIcon.clone(); break;
            case 'contacts': $icon = $contactsIcon.clone(); break;
            default: $icon = $fileIcon.clone();
        }

        return $icon;
    };

    // Tooltips

    UI.clearTooltips = function () {
        $('.tippy-popper').remove();
    };

    UI.addTooltips = function () {
        var MutationObserver = window.MutationObserver;
        var addTippy = function (el) {
            if (el.nodeName === 'IFRAME') { return; }
            var delay = typeof(AppConfig.tooltipDelay) === "number" ? AppConfig.tooltipDelay : 500;
            Tippy(el, {
                position: 'bottom',
                distance: 0,
                performance: true,
                delay: [delay, 0]
            });
        };
        var $body = $('body');
        var $padIframe = $('#pad-iframe').contents().find('body');
        $('[title]').each(function (i, el) {
            addTippy(el);
        });
        $('#pad-iframe').contents().find('[title]').each(function (i, el) {
            addTippy(el);
        });
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    $body.find('[title]').each(function (i, el) {
                        addTippy(el);
                    });
                    if (!$padIframe.length) { return; }
                    $padIframe.find('[title]').each(function (i, el) {
                        addTippy(el);
                    });
                }
            });
        });
        observer.observe($('body')[0], {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true
        });
        if ($('#pad-iframe').length) {
            observer.observe($('#pad-iframe').contents().find('body')[0], {
                attributes: false,
                childList: true,
                characterData: false,
                subtree: true
            });
        }
    };

    return UI;
});
