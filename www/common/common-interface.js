define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/customize/application_config.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/common/notify.js',
    '/common/visible.js',
    '/common/tippy.min.js',
    '/customize/pages.js',
    '/common/hyperscript.js',
    '/bower_components/bootstrap-tokenfield/dist/bootstrap-tokenfield.js',
    'css!/common/tippy.css',
], function ($, Messages, Util, AppConfig, Alertify, Notify, Visible, Tippy, Pages, h) {
    var UI = {};

    /*
     *  Alertifyjs
     */
    UI.Alertify = Alertify;

    // set notification timeout
    Alertify._$$alertify.delay = AppConfig.notificationTimeout || 5000;

    var findCancelButton = UI.findCancelButton = function (root) {
        if (root) {
            return $(root).find('button.cancel').last();
        }
        return $('button.cancel').last();
    };

    var findOKButton = UI.findOKButton = function (root) {
        if (root) {
            return $(root).find('button.ok').last();
        }
        return $('button.ok').last();
    };

    var listenForKeys = UI.listenForKeys = function (yes, no) {
        var handler = function (e) {
            switch (e.which) {
                case 27: // cancel
                    if (typeof(no) === 'function') { no(e); }
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

    var dialog = UI.dialog = {};

    var merge = function (a, b) {
        var c = {};
        if (a) {
            Object.keys(a).forEach(function (k) {
                c[k] = a[k];
            });
        }
        if (b) {
            Object.keys(b).forEach(function (k) {
                c[k] = b[k];
            });
        }
        return c;
    };

    dialog.selectable = function (value, opt) {
        var attrs = merge({
            type: 'text',
            readonly: 'readonly',
        }, opt);

        var input = h('input', attrs);
        $(input).val(value).click(function () {
            input.select();
        });
        return input;
    };

    dialog.okButton = function (content) {
        return h('button.ok', { tabindex: '2', }, content || Messages.okButton);
    };

    dialog.cancelButton = function (content) {
        return h('button.cancel', { tabindex: '1'}, content || Messages.cancelButton);
    };

    dialog.message = function (text) {
        return h('p.msg', text);
    };

    dialog.textInput = function (opt) {
        var attrs = merge({
            type: 'text',
            'class': 'cp-text-input',
        }, opt);
        return h('input', attrs);
    };

    dialog.nav = function (content) {
        return h('nav', content || [
            dialog.cancelButton(),
            dialog.okButton(),
        ]);
    };

    dialog.frame = function (content) {
        return h('div.alertify', [
            h('div.dialog', [
                h('div', content),
            ])
        ]);
    };

    UI.tokenField = function (target) {
        var t = {
            element: target || h('input'),
        };
        var $t = t.tokenfield = $(t.element).tokenfield();
        t.getTokens = function () {
            return $t.tokenfield('getTokens').map(function (token) {
                return token.value;
            });
        };

        t.preventDuplicates = function (cb) {
            $t.on('tokenfield:createtoken', function (ev) {
                var val;
                if (t.getTokens().some(function (t) {
                    if (t === ev.attrs.value) { return ((val = t)); }
                })) {
                    ev.preventDefault();
                    if (typeof(cb) === 'function') { cb(val); }
                }
            });
            return t;
        };

        t.setTokens = function (tokens) {
            $t.tokenfield('setTokens',
                tokens.map(function (token) {
                    return {
                        value: token,
                        label: token,
                    };
                }));
        };

        t.focus = function () {
            var $temp = $t.closest('.tokenfield').find('.token-input');
            $temp.css('width', '20%');
            $t.tokenfield('focusInput', $temp[0]);
        };

        return t;
    };

    dialog.tagPrompt = function (tags, cb) {
        var input = dialog.textInput();

        var tagger = dialog.frame([
            dialog.message('make some tags'), // TODO translate
            input,
            dialog.nav(),
        ]);

        var field = UI.tokenField(input).preventDuplicates(function (val) {
            UI.warn('Duplicate tag: ' + val); // TODO translate
        });

        var close = Util.once(function () {
            var $t = $(tagger).fadeOut(150, function () { $t.remove(); });
        });

        var listener = listenForKeys(function () {}, function () {
            close();
            stopListening(listener);
        });

        var CB = Util.once(cb);
        findOKButton(tagger).click(function () {
            var tokens = field.getTokens();
            close();
            CB(tokens);
        });
        findCancelButton(tagger).click(function () {
            close();
            CB(null);
        });

        // :(
        setTimeout(function () {
            field.setTokens(tags);
            field.focus();
        });

        return tagger;
    };

    UI.alert = function (msg, cb, force) {
        cb = cb || function () {};

        var message;
        if (typeof(msg) === 'string') {
            // sanitize
            if (!force) { msg = Util.fixHTML(msg); }
            message = dialog.message();
            message.innerHTML = msg;
        } else {
            message = dialog.message(msg);
        }

        var ok = dialog.okButton();
        var frame = dialog.frame([
            message,
            dialog.nav(ok),
        ]);

        var listener;
        var close = Util.once(function () {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
        });
        listener = listenForKeys(close, close);
        var $ok = $(ok).click(close);

        document.body.appendChild(frame);
        setTimeout(function () {
            $ok.focus();
            UI.notify();
            if (!document.hasFocus()) { window.focus(); }
        });
    };

    UI.prompt = function (msg, def, cb, opt, force) {
        cb = cb || function () {};
        opt = opt || {};

        var input = dialog.textInput();
        input.value = typeof(def) === 'string'? def: '';

        var message;
        if (typeof(msg) === 'string') {
            if (!force) { msg = Util.fixHTML(msg); }
            message = dialog.message();
            message.innerHTML = msg;
        } else {
            message = dialog.message(msg);
        }

        var ok = dialog.okButton(opt.ok);
        var cancel = dialog.cancelButton(opt.cancel);
        var frame = dialog.frame([
            message,
            input,
            dialog.nav([ cancel, ok, ]),
        ]);

        var listener;
        var close = Util.once(function () {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
        });

        var $ok = $(ok).click(function (ev) { cb(input.value, ev); });
        var $cancel = $(cancel).click(function (ev) { cb(null, ev); });
        listener = listenForKeys(function () { // yes
            close(); $ok.click();
        }, function () { // no
            close(); $cancel.click();
        });

        document.body.appendChild(frame);
        setTimeout(function () {
            input.select().focus();
            UI.notify();
            if (!document.hasFocus()) { window.focus(); }
        });
    };

    UI.confirm = function (msg, cb, opt, force) {
        cb = cb || function () {};
        opt = opt || {};

        var message;
        if (typeof(msg) === 'string') {
            if (!force) { msg = Util.fixHTML(msg); }
            message = dialog.message();
            message.innerHTML = msg;
        } else {
            message = dialog.message(msg);
        }

        var ok = dialog.okButton(opt.ok);
        var cancel = dialog.cancelButton(opt.cancel);

        var frame = dialog.frame([
            message,
            dialog.nav(opt.reverseOrder?
                [ok, cancel]: [cancel, ok]),
        ]);

        var listener;
        var close = Util.once(function () {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
        });

        var $ok = $(ok).click(function (ev) { close(); cb(true, ev); });
        var $cancel = $(cancel).click(function (ev) { close(); cb(false, ev); });

        if (opt.cancelClass) { $cancel.addClass(opt.cancelClass); }
        if (opt.okClass) { $ok.addClass(opt.okClass); }

        listener = listenForKeys(function () {
            $ok.click();
        }, function () {
            $cancel.click();
        });

        document.body.appendChild(frame);
        setTimeout(function () {
            UI.notify();
            if (typeof(opt.done) === 'function') {
                opt.done($ok.closest('.dialog'));
            }
            if (!document.hasFocus()) { window.focus(); }
        });
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
            'class': 'fa fa-circle-o-notch fa-spin fa-4x fa-fw',
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
    UI.addLoadingScreen = function (config) {
        config = config || {};
        var loadingText = config.loadingText;
        var hideTips = config.hideTips;
        var hideLogo = config.hideLogo;
        var $loading, $container;
        if ($('#' + LOADING).length) {
            $loading = $('#' + LOADING).show();
            if (loadingText) {
                $('#' + LOADING).find('p').text(loadingText);
            }
            $container = $loading.find('.loadingContainer');
        } else {
            $loading = $(Pages.loadingScreen());
            $container = $loading.find('.loadingContainer');
            if (hideLogo) {
                $loading.find('img').hide();
            } else {
                $loading.find('img').show();
            }
            var $spinner = $loading.find('.spinnerContainer');
            $spinner.show();
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
        if (!$('#' + LOADING).is(':visible')) { UI.addLoadingScreen({hideTips: true}); }
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

    var $defaultIcon = $('<span>', {"class": "fa fa-file-text-o"});
    UI.getIcon = function (type) {
        var $icon = $defaultIcon.clone();

        if (AppConfig.applicationsIcon && AppConfig.applicationsIcon[type]) {
            var appClass = ' cp-icon-color-'+type;
            $icon = $('<span>', {'class': 'fa ' + AppConfig.applicationsIcon[type] + appClass});
        }

        return $icon;
    };

    // Tooltips

    UI.clearTooltips = function () {
        // If an element is removed from the UI while a tooltip is applied on that element, the tooltip will get hung
        // forever, this is a solution which just searches for tooltips which have no corrisponding element and removes
        // them.
        var win;
        $('.tippy-popper').each(function (i, el) {
            win = win || $('#pad-iframe')[0].contentWindow;
            if (win.$('[aria-describedby=' + el.getAttribute('id') + ']').length === 0) {
                el.remove();
            }
        });
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
                dynamicTitle: true,
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
