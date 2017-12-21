define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-notifier.js',
    '/customize/application_config.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/common/tippy.min.js',
    '/customize/pages.js',
    '/common/hyperscript.js',
    '/common/test.js',

    '/bower_components/bootstrap-tokenfield/dist/bootstrap-tokenfield.js',
    'css!/common/tippy.css',
], function ($, Messages, Util, Hash, Notifier, AppConfig,
            Alertify, Tippy, Pages, h, Test) {
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

    var listenForKeys = UI.listenForKeys = function (yes, no, el) {
        var handler = function (e) {
            e.stopPropagation();
            switch (e.which) {
                case 27: // cancel
                    if (typeof(no) === 'function') { no(e); }
                    break;
                case 13: // enter
                    if (typeof(yes) === 'function') { yes(e); }
                    break;
            }
        };

        $(el || window).keydown(handler);
        return handler;
    };

    var stopListening = UI.stopListening = function (handler) {
        if (!handler) { return; } // we don't want to stop all the 'keyup' listeners
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
        return h('div.alertify', {
            tabindex: 1,
        }, [
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

        t.getTokens = function (ignorePending) {
            var tokens = $t.tokenfield('getTokens').map(function (token) {
                return token.value.toLowerCase();
            });
            if (ignorePending) { return tokens; }

            var $pendingEl = $($t.parent().find('.token-input')[0]);
            var val = ($pendingEl.val() || "").trim();
            if (val && tokens.indexOf(val) === -1) {
                return tokens.concat(val);
            }
            return tokens;
        };

        var $root = $t.parent();
        $t.on('tokenfield:removetoken', function () {
            $root.find('.token-input').focus();
        });

        t.preventDuplicates = function (cb) {
            $t.on('tokenfield:createtoken', function (ev) {
                var val;
                ev.attrs.value = ev.attrs.value.toLowerCase();
                if (t.getTokens(true).some(function (t) {
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
                        value: token.toLowerCase(),
                        label: token.toLowerCase(),
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
            dialog.message([
                Messages.tags_add,
                h('br'),
                Messages.tags_searchHint,
            ]),
            input,
            h('center', h('small', Messages.tags_notShared)),
            dialog.nav(),
        ]);

        var field = UI.tokenField(input).preventDuplicates(function (val) {
            UI.warn(Messages._getKey('tags_duplicate', [val]));
        });

        var listener;
        var close = Util.once(function (result, ev) {
            ev.stopPropagation();
            ev.preventDefault();
            var $frame = $(tagger).fadeOut(150, function () {
                stopListening(listener);
                $frame.remove();
                cb(result, ev);
            });
        });

        var $ok = findOKButton(tagger).click(function (e) {
            var tokens = field.getTokens();
            close(tokens, e);
        });
        var $cancel = findCancelButton(tagger).click(function (e) {
            close(null, e);
        });
        listener = listenForKeys(function () {
            $ok.click();
        }, function () {
            $cancel.click();
        }, tagger);

        $(tagger).on('click submit', function (e) {
            e.stopPropagation();
        });

        document.body.appendChild(tagger);
        // :(
        setTimeout(function () {
            field.setTokens(tags);
            field.focus();
        });

        return tagger;
    };

    UI.alert = function (msg, cb, opt) {
        var force = false;
        if (typeof(opt) === 'object') {
            force = opt.force || false;
        } else if (typeof(opt) === 'boolean') {
            force = opt;
        }
        if (typeof(opt) !== 'object') {
            opt = {};
        }
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

        if (opt.forefront) { $(frame).addClass('forefront'); }
        var listener;
        var close = Util.once(function () {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
            cb();
        });
        listener = listenForKeys(close, close, ok);
        var $ok = $(ok).click(close);

        document.body.appendChild(frame);
        setTimeout(function () {
            $ok.focus();
            Notifier.notify();
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
        var close = Util.once(function (result, ev) {
            var $frame = $(frame).fadeOut(150, function () {
                stopListening(listener);
                $frame.remove();
                cb(result, ev);
            });
        });

        var $ok = $(ok).click(function (ev) { close(input.value, ev); });
        var $cancel = $(cancel).click(function (ev) { close(null, ev); });
        listener = listenForKeys(function () { // yes
            $ok.click();
        }, function () { // no
            $cancel.click();
        }, input);

        document.body.appendChild(frame);
        setTimeout(function () {
            $(input).select().focus();
            Notifier.notify();
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
        var close = Util.once(function (bool, ev) {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
            cb(bool, ev);
        });

        var $ok = $(ok).click(function (ev) { close(true, ev); });
        var $cancel = $(cancel).click(function (ev) { close(false, ev); });

        if (opt.cancelClass) { $cancel.addClass(opt.cancelClass); }
        if (opt.okClass) { $ok.addClass(opt.okClass); }

        listener = listenForKeys(function () {
            $ok.click();
        }, function () {
            $cancel.click();
        }, ok);

        document.body.appendChild(frame);
        setTimeout(function () {
            Notifier.notify();
            $(frame).find('.ok').focus();
            if (typeof(opt.done) === 'function') {
                opt.done($ok.closest('.dialog'));
            }
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

    var LOADING = 'cp-loading';

    var getRandomTip = function () {
        if (!Messages.tips || !Object.keys(Messages.tips).length) { return ''; }
        var keys = Object.keys(Messages.tips);
        var rdm = Math.floor(Math.random() * keys.length);
        return Messages.tips[keys[rdm]];
    };
    UI.addLoadingScreen = function (config) {
        config = config || {};
        var loadingText = config.loadingText;
        var hideTips = config.hideTips || AppConfig.hideLoadingScreenTips;
        var hideLogo = config.hideLogo;
        var $loading, $container;
        if ($('#' + LOADING).length) {
            $loading = $('#' + LOADING).show();
            if (loadingText) {
                $('#' + LOADING).find('p').text(loadingText);
            }
            $container = $loading.find('.cp-loading-container');
        } else {
            $loading = $(Pages.loadingScreen());
            $container = $loading.find('.cp-loading-container');
            if (hideLogo) {
                $loading.find('img').hide();
            } else {
                $loading.find('img').show();
            }
            var $spinner = $loading.find('.cp-loading-spinner-container');
            $spinner.show();
            $('body').append($loading);
        }
        if (Messages.tips && !hideTips) {
            var $loadingTip = $('<div>', {'id': 'cp-loading-tip'});
            $('<span>', {'class': 'tips'}).text(getRandomTip()).appendTo($loadingTip);
            $loadingTip.css({
                'bottom': $('body').height()/2 - $container.height()/2 + 20 + 'px'
            });
            $('body').append($loadingTip);
        }
    };
    UI.removeLoadingScreen = function (cb) {
        // Release the test blocker, hopefully every test has been registered.
        // This test is created in sframe-boot2.js
        if (Test.__ASYNC_BLOCKER__) { Test.__ASYNC_BLOCKER__.pass(); }

        $('#' + LOADING).fadeOut(750, cb);
        var $tip = $('#cp-loading-tip').css('top', '')
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
        $('.cp-loading-spinner-container').hide();
        if (transparent) { $('#' + LOADING).css('opacity', 0.8); }
        $('#' + LOADING).find('p').html(error || Messages.error);
    };

    var $defaultIcon = $('<span>', {"class": "fa fa-file-text-o"});
    UI.getIcon = function (type) {
        var $icon = $defaultIcon.clone();

        if (AppConfig.applicationsIcon && AppConfig.applicationsIcon[type]) {
            var appClass = ' cp-icon cp-icon-color-'+type;
            $icon = $('<span>', {'class': 'fa ' + AppConfig.applicationsIcon[type] + appClass});
        }

        return $icon;
    };
    UI.getFileIcon = function (data) {
        var $icon = UI.getIcon();
        if (!data) { return $icon; }
        var href = data.href;
        if (!href) { return $icon; }

        var type = Hash.parsePadUrl(href).type;
        $icon = UI.getIcon(type);

        return $icon;
    };

    // Tooltips

    UI.clearTooltips = function () {
        // If an element is removed from the UI while a tooltip is applied on that element, the tooltip will get hung
        // forever, this is a solution which just searches for tooltips which have no corrisponding element and removes
        // them.
        $('.tippy-popper').each(function (i, el) {
            if ($('[aria-describedby=' + el.getAttribute('id') + ']').length === 0) {
                el.remove();
            }
        });
    };

    UI.addTooltips = function () {
        var MutationObserver = window.MutationObserver;
        var delay = typeof(AppConfig.tooltipDelay) === "number" ? AppConfig.tooltipDelay : 500;
        var addTippy = function (i, el) {
            if (el.nodeName === 'IFRAME') { return; }
            Tippy(el, {
                position: 'bottom',
                distance: 0,
                performance: true,
                dynamicTitle: true,
                delay: [delay, 0],
                sticky: true
            });
        };
        // This is the robust solution to remove dangling tooltips
        // The mutation observer does not always find removed nodes.
        setInterval(UI.clearTooltips, delay);
        var checkRemoved = function (x) {
            var out = false;
            $(x).find('[aria-describedby]').each(function (i, el) {
                var id = el.getAttribute('aria-describedby');
                if (id.indexOf('tippy-tooltip-') !== 0) { return; }
                out = true;
            });
            return out;
        };
        $('[title]').each(addTippy);
        var observer = new MutationObserver(function(mutations) {
            var removed = false;
            mutations.forEach(function(mutation) {
                if (mutation.type === "childList") {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        $(mutation.addedNodes[i]).find('[title]').each(addTippy);
                    }
                    for (var j = 0; j < mutation.removedNodes.length; j++) {
                        removed |= checkRemoved(mutation.removedNodes[j]);
                    }
                }
                if (mutation.type === "attributes" && mutation.attributeName === "title") {
                    addTippy(0, mutation.target);
                }
            });
            if (removed) { UI.clearTooltips(); }
        });
        observer.observe($('body')[0], {
            attributes: true,
            childList: true,
            characterData: false,
            subtree: true
        });
    };

    return UI;
});
