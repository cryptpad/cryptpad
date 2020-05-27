if (!document.querySelector("#alertifyCSS")) {
    // Prevent alertify from injecting CSS, we create our own in alertify.less.
    // see: https://github.com/alertifyjs/alertify.js/blob/v1.0.11/src/js/alertify.js#L414
    var head = document.getElementsByTagName("head")[0];
    var css = document.createElement("span");
    css.id = "alertifyCSS";
    css.setAttribute('data-but-why', 'see: common-interface.js');
    head.insertBefore(css, head.firstChild);
}
define([
    'jquery',
    '/customize/messages.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-notifier.js',
    '/customize/application_config.js',
    '/bower_components/alertifyjs/dist/js/alertify.js',
    '/common/tippy/tippy.min.js',
    '/common/hyperscript.js',
    '/customize/loading.js',
    '/common/test.js',

    '/common/jquery-ui/jquery-ui.min.js',
    '/bower_components/bootstrap-tokenfield/dist/bootstrap-tokenfield.js',
    'css!/common/tippy/tippy.css',
    'css!/common/jquery-ui/jquery-ui.min.css'
], function ($, Messages, Util, Hash, Notifier, AppConfig,
            Alertify, Tippy, h, Loading, Test) {
    var UI = {};

    /*
     *  Alertifyjs
     */
    UI.Alertify = Alertify;

    // set notification timeout
    Alertify._$$alertify.delay = AppConfig.notificationTimeout || 5000;

    var setHTML = UI.setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };

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

    UI.removeModals = function () {
        $('div.alertify').remove();
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
            $(el || window).off('keydown', handler);
        };

        $(el || window).keydown(handler);
        return handler;
    };
    var customListenForKeys = function (keys, cb, el) {
        if (!keys || !keys.length || typeof cb !== "function") { return; }
        var handler = function (e) {
            e.stopPropagation();
            keys.some(function (k) {
                // k is number or array
                // if it's an array, it should be [keyCode, "{ctrl|alt|shift|meta}"]
                if (Array.isArray(k) && e.which === k[0] && e[k[1] + 'Key']) {
                    cb();
                    return true;
                }
                if (e.which === k && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
                    cb();
                    return true;
                }
            });
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

    dialog.selectableArea = function (value, opt) {
        var attrs = merge({
            readonly: 'readonly',
        }, opt);

        var input = h('textarea', attrs);
        $(input).val(value).click(function () {
            input.select();
        });
        return input;
    };

    dialog.okButton = function (content, classString) {
        var sel = typeof(classString) === 'string'? 'button.ok.' + classString:'button.ok.primary';
        return h(sel, { tabindex: '2', }, content || Messages.okButton);
    };

    dialog.cancelButton = function (content, classString) {
        var sel = typeof(classString) === 'string'? 'button.' + classString:'button.cancel';
        return h(sel, { tabindex: '1'}, content || Messages.cancelButton);
    };

    dialog.message = function (text) {
        return h('p.msg', text);
    };

    dialog.textInput = function (opt) {
        var attrs = merge({
            type: 'text',
            'class': 'cp-text-input',
        }, opt);
        return h('p.msg', h('input', attrs));
    };

    dialog.textTypeInput = function (dropdown) {
        var attrs = {
            type: 'text',
            'class': 'cp-text-type-input',
        };
        return h('p.msg.cp-alertify-type-container', h('div.cp-alertify-type', [
            h('input', attrs),
            dropdown // must be a "span"
        ]));
    };

    dialog.nav = function (content) {
        return h('nav', content || [
            dialog.cancelButton(),
            dialog.okButton(),
        ]);
    };

    dialog.frame = function (content, opt) {
        opt = opt || {};
        var cls = opt.wide ? '.wide' : '';
        var frame = h('div.alertify', {
            tabindex: 1,
        }, [
            h('div.dialog', [
                h('div'+cls, content),
            ])
        ]);
        var $frame = $(frame);
        frame.closeModal = function (cb) {
            frame.closeModal = function () {}; // Prevent further calls
            $frame.fadeOut(150, function () {
                $frame.detach();
                if (typeof(cb) === "function") { cb(); }
            });
        };
        return $frame.click(function (e) {
            $frame.find('.cp-dropdown-content').hide();
            e.stopPropagation();
        })[0];
    };

    /**
     * tabs is an array containing objects
     * each object must have the following attributes:
     *  - title: String
     *  - content: DOMElement
     */
    dialog.tabs = function (tabs) {
        var contents = [];
        var titles = [];
        var active = 0;
        tabs.forEach(function (tab, i) {
            if (!(tab.content || tab.disabled) || !tab.title) { return; }
            var content = h('div.alertify-tabs-content', tab.content);
            var title = h('span.alertify-tabs-title'+ (tab.disabled ? '.disabled' : ''), tab.title);
            if (tab.icon) {
                var icon = h('i', {class: tab.icon});
                $(title).prepend(' ').prepend(icon);
            }
            $(title).click(function () {
                if (tab.disabled) { return; }
                var old = tabs[active];
                if (old.onHide) { old.onHide(); }
                titles.forEach(function (t) { $(t).removeClass('alertify-tabs-active'); });
                contents.forEach(function (c) { $(c).removeClass('alertify-tabs-content-active'); });
                if (tab.onShow) {
                    tab.onShow();
                }
                $(title).addClass('alertify-tabs-active');
                $(content).addClass('alertify-tabs-content-active');
                active = i;
            });
            titles.push(title);
            contents.push(content);
            if (tab.active && !tab.disabled) { active = i; }
        });
        if (contents.length) {
            $(contents[active]).addClass('alertify-tabs-content-active');
            $(titles[active]).addClass('alertify-tabs-active');
        }
        return h('div.alertify-tabs', [
            h('div.alertify-tabs-titles', titles),
            h('div.alertify-tabs-contents', contents),
        ]);
    };

    UI.tokenField = function (target, autocomplete) {
        var t = {
            element: target || h('input'),
        };
        var $t = t.tokenfield = $(t.element).tokenfield({
            autocomplete: {
                source: autocomplete,
                delay: 100
            },
            showAutocompleteOnFocus: false
        });

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
                // Close the suggest list when a token is added because we're going to wipe the input
                var $input = $t.closest('.tokenfield').find('.token-input');
                $input.autocomplete('close');

                var val;
                ev.attrs.value = ev.attrs.value.toLowerCase();
                if (t.getTokens(true).some(function (t) {
                    if (t === ev.attrs.value) {
                        ev.preventDefault();
                        return ((val = t));
                    }
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

    dialog.tagPrompt = function (tags, existing, cb) {
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

        var field = UI.tokenField(input, existing).preventDuplicates(function (val) {
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

    dialog.getButtons = function (buttons, onClose) {
        if (!buttons) { return; }
        if (!Array.isArray(buttons)) { return void console.error('Not an array'); }
        if (!buttons.length) { return; }
        var navs = [];
        buttons.forEach(function (b) {
            if (!b.name || !b.onClick) { return; }
            var button = h('button', { tabindex: '1', 'class': b.className || '' }, b.name);
            var todo = function () {
                var noClose = b.onClick();
                if (noClose) { return; }
                var $modal = $(button).parents('.alertify').first();
                if ($modal.length && $modal[0].closeModal) {
                    $modal[0].closeModal(function () {
                        if (onClose) {
                            onClose();
                        }
                    });
                }
            };
            if (b.confirm) {
                UI.confirmButton(button, {
                    classes: 'danger',
                    divClasses: 'left'
                }, todo);
            } else {
                $(button).click(function () {
                    todo();
                });
            }
            if (b.keys && b.keys.length) { $(button).attr('data-keys', JSON.stringify(b.keys)); }
            navs.push(button);
        });
        return dialog.nav(navs);
    };
    dialog.customModal = function (msg, opt) {
        var force = false;
        if (typeof(opt) === 'object') {
            force = opt.force || false;
        } else if (typeof(opt) === 'boolean') {
            force = opt;
        }
        if (typeof(opt) !== 'object') {
            opt = {};
        }

        var message;
        if (typeof(msg) === 'string') {
            // sanitize
            if (!force) { msg = Util.fixHTML(msg); }
            message = dialog.message();
            message.innerHTML = msg;
        } else {
            message = dialog.message(msg);
        }

        var frame = h('div', [
            message,
            dialog.getButtons(opt.buttons, opt.onClose)
        ]);

        if (opt.forefront) { $(frame).addClass('forefront'); }
        return frame;
    };
    UI.openCustomModal = function (content, opt) {
        var frame = dialog.frame([
            content
        ], opt);
        $(frame).find('button[data-keys]').each(function (i, el) {
            var keys = JSON.parse($(el).attr('data-keys'));
            customListenForKeys(keys, function () {
                if (!$(el).is(':visible')) { return; }
                $(el).click();
            }, frame);
        });
        document.body.appendChild(frame);
        $(frame).focus();
        setTimeout(function () {
            Notifier.notify();
        });
        return frame;
    };

    UI.createModal = function (cfg) {
        var $body = cfg.$body || $('body');
        var $blockContainer = cfg.id && $body.find('#'+cfg.id);
        if (!$blockContainer || !$blockContainer.length) {
            var id = '';
            if (cfg.id) { id = '#'+cfg.id; }
            $blockContainer = $(h('div.cp-modal-container'+id, {
                tabindex: 1
            }));
        }
        var deleted = false;
        var hide = function () {
            if (deleted) { return; }
            $blockContainer.hide();
            if (!cfg.id) {
                deleted = true;
                $blockContainer.remove();
            }
            if (cfg.onClose) { cfg.onClose(); }
        };
        $blockContainer.html('').appendTo($body);
        var $block = $(h('div.cp-modal')).appendTo($blockContainer);
        $(h('span.cp-modal-close.fa.fa-times', {
            title: Messages.filePicker_close
        })).click(hide).appendTo($block);
        $body.click(hide);
        $block.click(function (e) {
            e.stopPropagation();
        });
        $body.keydown(function (e) {
            if (e.which === 27) {
                hide();
            }
        });
        return {
            $modal: $blockContainer,
            show: function () {
                $blockContainer.css('display', 'flex');
            },
            hide: hide
        };
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
        listener = listenForKeys(close, close, frame);
        var $ok = $(ok).click(close);

        document.body.appendChild(frame);
        setTimeout(function () {
            $ok.focus();
            Notifier.notify();
        });

        return {
            element: frame,
            delete: close
        };
    };

    UI.prompt = function (msg, def, cb, opt, force) {
        cb = cb || function () {};
        opt = opt || {};

        var inputBlock = opt.password ? UI.passwordInput() :
                            (opt.typeInput ? dialog.textTypeInput(opt.typeInput) : dialog.textInput());
        var input = $(inputBlock).is('input') ? inputBlock : $(inputBlock).find('input')[0];
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
            inputBlock,
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

        var ok = dialog.okButton(opt.ok, opt.okClass);
        var cancel = dialog.cancelButton(opt.cancel, opt.cancelClass);

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
        }, frame);

        document.body.appendChild(frame);
        setTimeout(function () {
            Notifier.notify();
            $(frame).find('.ok').focus();
            if (typeof(opt.done) === 'function') {
                opt.done($ok.closest('.dialog'));
            }
        });
    };
    UI.confirmButton = function (originalBtn, config, _cb) {
        config = config || {};
        var cb = Util.once(Util.mkAsync(_cb));
        var classes = 'btn ' + (config.classes || 'btn-primary');

        var button = h('button', {
            "class": classes,
            title: config.title || ''
        }, Messages.areYouSure);
        var $button = $(button);

        var div = h('div', {
            "class": config.classes || ''
        });
        var timer = h('div.cp-button-timer', div);

        var content = h('div.cp-button-confirm', [
            button,
            timer
        ]);
        if (config.divClasses) {
            $(content).addClass(config.divClasses);
        }

        var to;

        var done = function (res) {
            if (res) { cb(res); }
            clearTimeout(to);
            $(content).detach();
            $(originalBtn).show();
        };

        $button.click(function () {
            done(true);
        });

        var TIMEOUT = 3000;
        var INTERVAL = 10;
        var i = 1;

        var todo = function () {
            var p = 100 * ((TIMEOUT - (i * INTERVAL)) / TIMEOUT);
            if (i++ * INTERVAL >= TIMEOUT) {
                done(false);
                return;
            }
            $(div).css('width', p+'%');
            to = setTimeout(todo, INTERVAL);
        };

        $(originalBtn).addClass('cp-button-confirm-placeholder').click(function () {
            i = 1;
            to = setTimeout(todo, INTERVAL);
            $(originalBtn).hide().after(content);
        });

        return {
            reset: function () {
                done(false);
            }
        };
    };


    UI.proposal = function (content, cb) {
        var buttons = [{
            name: Messages.friendRequest_later,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.friendRequest_accept,
            onClick: function () {
                cb(true);
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.friendRequest_decline,
            onClick: function () {
                cb(false);
            },
            keys: [[13, 'ctrl']]
        }];
        var modal = dialog.customModal(content, {buttons: buttons});
        UI.openCustomModal(modal);
        return modal;
    };

    UI.log = function (msg) {
        Alertify.success(Util.fixHTML(msg));
    };

    UI.warn = function (msg) {
        Alertify.error(Util.fixHTML(msg));
    };

    UI.passwordInput = function (opts, displayEye) {
        opts = opts || {};
        var attributes = merge({
            type: 'password'
        }, opts);

        var input = h('input.cp-password-input', attributes);
        var eye = h('span.fa.fa-eye.cp-password-reveal');

        var $eye = $(eye);
        var $input = $(input);

        if (displayEye) {
            $eye.mousedown(function () {
                $input.prop('type', 'text');
                $input.focus();
            }).mouseup(function(){
                $input.prop('type', 'password');
                $input.focus();
            }).mouseout(function(){
                $input.prop('type', 'password');
                $input.focus();
            });
        } else {
            $eye.click(function () {
                if ($eye.hasClass('fa-eye')) {
                    $input.prop('type', 'text');
                    $input.focus();
                    $eye.removeClass('fa-eye').addClass('fa-eye-slash');
                    return;
                }
                $input.prop('type', 'password');
                $input.focus();
                $eye.removeClass('fa-eye-slash').addClass('fa-eye');
            });
        }

        return h('span.cp-password-container', [
            input,
            eye
        ]);
    };

    UI.createHelper = function (href, text) {
        var q = h('a.fa.fa-question-circle', {
            style: 'text-decoration: none !important;',
            title: text,
            href: href,
            target: "_blank",
            'data-tippy-placement': "right"
        });
        return q;
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

    var loading = {
        error: false,
        driveState: 0,
        padState: 0
    };
    UI.addLoadingScreen = function (config) {
        config = config || {};
        var loadingText = config.loadingText;
        var todo = function () {
            var $loading = $('#' + LOADING);
            $loading.css('display', '');
            $loading.removeClass('cp-loading-hidden');
            $('.cp-loading-spinner-container').show();
            if (!config.noProgress && !$loading.find('.cp-loading-progress').length) {
                var progress = h('div.cp-loading-progress', [
                    h('p.cp-loading-progress-drive'),
                    h('p.cp-loading-progress-pad')
                ]);
                $(progress).hide();
                $loading.find('.cp-loading-container').append(progress);
            } else if (config.noProgress) {
                $loading.find('.cp-loading-progress').remove();
            }
            if (loadingText) {
                $('#' + LOADING).find('#cp-loading-message').show().text(loadingText);
            } else {
                $('#' + LOADING).find('#cp-loading-message').hide().text('');
            }
            loading.error = false;
        };
        if ($('#' + LOADING).length) {
            todo();
        } else {
            Loading();
            todo();
        }
    };
    UI.updateLoadingProgress = function (data, isDrive) {
        var $loading = $('#' + LOADING);
        if (!$loading.length || loading.error) { return; }
        $loading.find('.cp-loading-progress').show();
        var $progress;
        if (isDrive) {
            // Drive state
            if (loading.driveState === -1) { return; } // Already loaded
            $progress = $loading.find('.cp-loading-progress-drive');
            if (!$progress.length) { return; } // Can't find the box to display data

            // If state is -1, remove the box, drive is loaded
            if (data.state === -1) {
                loading.driveState = -1;
                $progress.remove();
            } else {
                if (data.state < loading.driveState) { return; } // We should not display old data
                // Update the current state
                loading.driveState = data.state;
                data.progress = data.progress || 100;
                data.msg = Messages['loading_drive_'+ Math.floor(data.state)] || '';
                $progress.html(data.msg);
                if (data.progress) {
                    $progress.append(h('div.cp-loading-progress-bar', [
                        h('div.cp-loading-progress-bar-value', {style: 'width:'+data.progress+'%;'})
                    ]));
                }
            }
        } else {
            // Pad state
            if (loading.padState === -1) { return; } // Already loaded
            $progress = $loading.find('.cp-loading-progress-pad');
            if (!$progress.length) { return; } // Can't find the box to display data

            // If state is -1, remove the box, pad is loaded
            if (data.state === -1) {
                loading.padState = -1;
                $progress.remove();
            } else {
                if (data.state < loading.padState) { return; } // We should not display old data
                // Update the current state
                loading.padState = data.state;
                data.progress = data.progress || 100;
                data.msg = Messages['loading_pad_'+data.state] || '';
                $progress.html(data.msg);
                if (data.progress) {
                    $progress.append(h('div.cp-loading-progress-bar', [
                        h('div.cp-loading-progress-bar-value', {style: 'width:'+data.progress+'%;'})
                    ]));
                }
            }
        }
    };
    UI.removeLoadingScreen = function (cb) {
        // Release the test blocker, hopefully every test has been registered.
        // This test is created in sframe-boot2.js
        cb = cb || function () {};
        if (Test.__ASYNC_BLOCKER__) { Test.__ASYNC_BLOCKER__.pass(); }

        $('#' + LOADING).addClass("cp-loading-hidden");
        setTimeout(cb, 750);
        loading.error = false;
        var $tip = $('#cp-loading-tip').css('top', '')
        // loading.less sets transition-delay: $wait-time
        // and               transition: opacity $fadeout-time
            .css({
                'opacity': 0,
                'pointer-events': 'none',
            });
        window.setTimeout(function () {
            $tip.remove();
        }, 3750);
        // jquery.fadeout can get stuck
    };
    UI.errorLoadingScreen = function (error, transparent, exitable) {
        var $loading = $('#' + LOADING);
        if (!$loading.is(':visible') || $loading.hasClass('cp-loading-hidden')) {
            UI.addLoadingScreen({hideTips: true});
        }
        loading.error = true;
        $loading.find('.cp-loading-progress').remove();
        $('.cp-loading-spinner-container').hide();
        $('#cp-loading-tip').remove();
        if (transparent) { $loading.css('opacity', 0.9); }
        var $error = $loading.find('#cp-loading-message').show();
        if (error instanceof Element) {
            $error.html('').append(error);
        } else {
            $error.html(error || Messages.error);
        }
        if (exitable) {
            $(window).focus();
            $(window).keydown(function (e) {
                if (e.which === 27) {
                    $loading.hide();
                    loading.error = false;
                    if (typeof(exitable) === "function") { exitable(); }
                }
            });
        }
    };

    var $defaultIcon = $('<span>', {"class": "fa fa-file-text-o"});
    UI.getIcon = function (type) {
        var $icon = $defaultIcon.clone();

        if (AppConfig.applicationsIcon && AppConfig.applicationsIcon[type]) {
            var icon = AppConfig.applicationsIcon[type];
            var font = icon.indexOf('cptools') === 0 ? 'cptools' : 'fa';
            if (type === 'fileupload') { type = 'file'; }
            if (type === 'folderupload') { type = 'file'; }
            var appClass = ' cp-icon cp-icon-color-'+type;
            $icon = $('<span>', {'class': font + ' ' + icon + appClass});
        }

        return $icon;
    };
    UI.getFileIcon = function (data) {
        var $icon = UI.getIcon();
        if (!data) { return $icon; }
        var href = data.href || data.roHref;
        var type = data.type;
        if (!href && !type) { return $icon; }

        if (!type) { type = Hash.parsePadUrl(href).type; }
        $icon = UI.getIcon(type);

        return $icon;
    };

    // Tooltips

    UI.clearTooltips = function () {
        // If an element is removed from the UI while a tooltip is applied on that element, the tooltip will get hung
        // forever, this is a solution which just searches for tooltips which have no corrisponding element and removes
        // them.
        $('.tippy-popper').each(function (i, el) {
            if (el._tippy && el._tippy.reference && document.body.contains(el._tippy.reference)) {
                el._tippy.destroy();
                el.remove();
                return;
            }
            if ($('[aria-describedby=' + el.getAttribute('id') + ']').length === 0) {
                el.remove();
            }
        });
    };

    var delay = typeof(AppConfig.tooltipDelay) === "number" ? AppConfig.tooltipDelay : 500;
    $.extend(true, Tippy.defaults, {
        placement: 'bottom',
        performance: true,
        delay: [delay, 0],
        //sticky: true,
        theme: 'cryptpad',
        arrow: true,
        maxWidth: '200px',
        flip: true,
        popperOptions: {
            modifiers: {
                preventOverflow: { boundariesElement: 'window' }
            }
        },
        //arrowType: 'round',
        dynamicTitle: false,
        arrowTransform: 'scale(2)',
        zIndex: 100000001
    });
    UI.addTooltips = function () {
        var MutationObserver = window.MutationObserver;
        var addTippy = function (i, el) {
            if (el._tippy) { return; }
            if (!el.getAttribute('title')) { return; }
            if (el.nodeName === 'IFRAME') { return; }
            var opts = {
                distance: 15
            };
            Array.prototype.slice.apply(el.attributes).filter(function (obj) {
                return /^data-tippy-/.test(obj.name);
            }).forEach(function (obj) {
                opts[obj.name.slice(11)] = obj.value;
            });
            if (!el.getAttribute('data-cptippy-html') && !el.fixHTML) {
                el.setAttribute('title', Util.fixHTML(el.getAttribute('title'))); // fixHTML
                el.fixHTML = true; // Don't clean HTML twice on the same element
            }
            Tippy(el, opts);
        };
        // This is the robust solution to remove dangling tooltips
        // The mutation observer does not always find removed nodes.
        //setInterval(UI.clearTooltips, delay);

        $('[title]').each(addTippy);
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === "childList") {
                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        if ($(mutation.addedNodes[i]).attr('title')) {
                            addTippy(0, mutation.addedNodes[i]);
                        }
                        $(mutation.addedNodes[i]).find('[title]').each(addTippy);
                    }

                    if (mutation.removedNodes.length !== 0) {
                        UI.clearTooltips();
                    }
                }
                if (mutation.type === "attributes" && mutation.attributeName === "title") {
                    mutation.target.fixHTML = false;
                    addTippy(0, mutation.target);
                }
            });
        });
        observer.observe($('body')[0], {
            attributes: true,
            childList: true,
            characterData: false,
            subtree: true
        });
    };

    UI.createCheckbox = function (id, labelTxt, checked, opts) {
        opts = opts|| {};
        // Input properties
        var inputOpts = {
            type: 'checkbox',
            id: id
        };
        if (checked) { inputOpts.checked = 'checked'; }
        $.extend(inputOpts, opts.input || {});

        // Label properties
        var labelOpts = {};
        $.extend(labelOpts, opts.label || {});
        if (labelOpts.class) { labelOpts.class += ' cp-checkmark'; }

        // Mark properties
        var markOpts = { tabindex: 0 };
        $.extend(markOpts, opts.mark || {});

        var input = h('input', inputOpts);
        var $input = $(input);
        var mark = h('span.cp-checkmark-mark', markOpts);
        var $mark = $(mark);
        var label = h('span.cp-checkmark-label', labelTxt);

        $mark.keydown(function (e) {
            if (e.which === 32) {
                e.stopPropagation();
                e.preventDefault();
                $input.prop('checked', !$input.is(':checked'));
                $input.change();
            }
        });

        $input.change(function () { $mark.focus(); });

        return h('label.cp-checkmark', labelOpts, [
            input,
            mark,
            label
        ]);
    };

    UI.createRadio = function (name, id, labelTxt, checked, opts) {
        opts = opts|| {};
        // Input properties
        var inputOpts = {
            type: 'radio',
            id: id,
            name: name
        };
        if (checked) { inputOpts.checked = 'checked'; }
        $.extend(inputOpts, opts.input || {});

        // Label properties
        var labelOpts = {};
        $.extend(labelOpts, opts.label || {});
        if (labelOpts.class) { labelOpts.class += ' cp-checkmark'; }

        // Mark properties
        var markOpts = { tabindex: 0 };
        $.extend(markOpts, opts.mark || {});

        var input = h('input', inputOpts);
        var mark = h('span.cp-radio-mark', markOpts);
        var label = h('span.cp-checkmark-label', labelTxt);

        $(mark).keydown(function (e) {
            if (e.which === 32) {
                e.stopPropagation();
                e.preventDefault();
                if ($(input).is(':checked')) { return; }
                $(input).prop('checked', !$(input).is(':checked'));
                $(input).change();
            }
        });

        $(input).change(function () { $(mark).focus(); });

        var radio =  h('label', labelOpts, [
            input,
            mark,
            label
        ]);

        $(radio).addClass('cp-radio');

        return radio;
    };

    var corner = {
        queue: [],
        state: false
    };
    UI.cornerPopup = function (text, actions, footer, opts) {
        opts = opts || {};

        var dontShowAgain = h('div.cp-corner-dontshow', [
            h('span.fa.fa-times'),
            Messages.dontShowAgain
        ]);

        var popup = h('div.cp-corner-container', [
            setHTML(h('div.cp-corner-text'), text),
            h('div.cp-corner-actions', actions),
            setHTML(h('div.cp-corner-footer'), footer),
            opts.dontShowAgain ? dontShowAgain : undefined
        ]);

        var $popup = $(popup);

        if (opts.hidden) {
            $popup.addClass('cp-minimized');
        }
        if (opts.big) {
            $popup.addClass('cp-corner-big');
        }
        if (opts.alt) {
            $popup.addClass('cp-corner-alt');
        }

        var hide = function () {
            $popup.hide();
        };
        var show = function () {
            $popup.show();
        };
        var deletePopup = function () {
            $popup.remove();
            if (!corner.queue.length) {
                // Make sure no other popup is displayed in the next 5s
                setTimeout(function () {
                    if (corner.queue.length) {
                        $('body').append(corner.queue.pop());
                        return;
                    }
                    corner.state = false;
                }, 5000);
                return;
            }
            setTimeout(function () {
                $('body').append(corner.queue.pop());
            }, 5000);
        };

        $(dontShowAgain).click(function () {
            deletePopup();
            if (typeof(opts.dontShowAgain) === "function") {
                opts.dontShowAgain();
            }
        });

        if (corner.state) {
            corner.queue.push(popup);
        } else {
            corner.state = true;
            $('body').append(popup);
        }

        return {
            popup: popup,
            hide: hide,
            show: show,
            delete: deletePopup
        };
    };

    UI.makeSpinner = function ($container) {
        var $ok = $('<span>', {'class': 'fa fa-check', title: Messages.saved}).hide();
        var $spinner = $('<span>', {'class': 'fa fa-spinner fa-pulse'}).hide();

        var state = false;
        var to;

        var spin = function () {
            clearTimeout(to);
            state = true;
            $ok.hide();
            $spinner.show();
        };
        var hide = function () {
            clearTimeout(to);
            state = false;
            $ok.hide();
            $spinner.hide();
        };
        var done = function () {
            clearTimeout(to);
            state = false;
            $ok.show();
            $spinner.hide();
            to = setTimeout(function () {
                $ok.hide();
            }, 500);
        };

        if ($container && $container.append) {
            $container.append($ok);
            $container.append($spinner);
        }

        return {
            getState: function () { return state; },
            ok: $ok[0],
            spinner: $spinner[0],
            spin: spin,
            hide: hide,
            done: done
        };
    };

    UI.createContextMenu = function (menu) {
        var $menu = $(menu).appendTo($('body'));

        var display = function (e) {
            $menu.css({ display: "block" });
            var h = $menu.outerHeight();
            var w = $menu.outerWidth();
            var wH = window.innerHeight;
            var wW = window.innerWidth;
            if (h > wH) {
                $menu.css({
                    top: '0px',
                    bottom: ''
                });
            } else if (e.pageY + h <= wH) {
                $menu.css({
                    top: e.pageY+'px',
                    bottom: ''
                });
            } else {
                $menu.css({
                    bottom: '0px',
                    top: ''
                });
            }
            if(w > wW) {
                $menu.css({
                    left: '0px',
                    right: ''
                });
            } else if (e.pageX + w <= wW) {
                $menu.css({
                    left: e.pageX+'px',
                    right: ''
                });
            } else {
                $menu.css({
                    left: '',
                    right: '0px',
                });
            }
        };

        var hide = function () {
            $menu.hide();
        };
        var remove = function () {
            $menu.remove();
        };

        $('body').click(hide);

        return {
            menu: menu,
            show: display,
            hide: hide,
            remove: remove
        };
    };

    /*  Given two jquery objects (a 'button' and a 'drawer')
        add handlers to make it such that clicking the button
        displays the drawer contents, and blurring the button
        hides the drawer content. Used for toolbar buttons at the moment.
    */
    UI.createDrawer = function ($button, $content) {
        $button.click(function () {
            $content.toggle();
            $button.removeClass('cp-toolbar-button-active');
            if ($content.is(':visible')) {
                $button.addClass('cp-toolbar-button-active');
                $content.focus();
                var wh = $(window).height();
                var topPos = $button[0].getBoundingClientRect().bottom;
                $content.css('max-height', Math.floor(wh - topPos - 1)+'px');
            }
        });
        var onBlur = function (e) {
            if (e.relatedTarget) {
                var $relatedTarget = $(e.relatedTarget);

                if ($relatedTarget.is('.cp-toolbar-drawer-button')) { return; }
                if ($relatedTarget.parents('.cp-toolbar-drawer-content').length) {
                    $relatedTarget.blur(onBlur);
                    return;
                }
            }
            $button.removeClass('cp-toolbar-button-active');
            $content.hide();
        };
        $content.blur(onBlur).appendTo($button);
        $('body').keydown(function (e) {
            if (e.which === 27) {
                $content.blur();
            }
        });
    };

    return UI;
});
