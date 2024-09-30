// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

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
    '/components/alertify.js/dist/js/alertify.js',
    '/lib/tippy/tippy.min.js',
    '/common/hyperscript.js',
    '/customize/loading.js',
    //'/common/test.js',

    '/lib/jquery-ui/jquery-ui.min.js', // autocomplete widget
    '/components/bootstrap-tokenfield/dist/bootstrap-tokenfield.js',
    'css!/lib/tippy/tippy.css',
    'css!/lib/jquery-ui/jquery-ui.min.css'
], function ($, Messages, Util, Hash, Notifier, AppConfig,
            Alertify, Tippy, h, Loading/*, Test */) {
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

    UI.getDisplayName = function (name) {
        return (typeof(name) === 'string'? name: "").trim() || Messages.anonymous;
    };

    // FIXME almost everywhere this is used would also be
    // a good candidate for sframe-common's getMediatagFromHref
    UI.mediaTag = function (src, key) {
        return h('media-tag', {
            src: src,
            'data-crypto-key': 'cryptpad:' + key,
        });
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
                    $(el || window).off('keydown', handler);
                    break;
                case 13: // enter
                    if (typeof(yes) === 'function') { yes(e); }
                    $(el || window).off('keydown', handler);
                    break;
            }
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
        var sel = typeof(classString) === 'string'? 'button.ok.' + classString:'button.btn.ok.primary';
        return h(sel, content || Messages.okButton);
    };

    dialog.cancelButton = function (content, classString) {
        var sel = typeof(classString) === 'string'? 'button.' + classString:'button.btn.cancel';
        return h(sel, content || Messages.cancelButton);
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
            var title = h('span.alertify-tabs-title'+ (tab.disabled ? '.disabled' : ''), h('span.tab-title-text',{id: 'cp-tab-' + tab.title.toLowerCase(), 'aria-hidden':"true"}, tab.title));
            $(title).attr('tabindex', '0');
            if (tab.icon) {
                var icon = h('i', {class: tab.icon, 'aria-labelledby': 'cp-tab-' + tab.title.toLowerCase()});
                $(title).prepend(' ').prepend(icon);
            }

            Util.onClickEnter($(title), function (event) {
                event.preventDefault();
                event.stopPropagation();
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

        var $input = $root.find('.token-input');
        $input.attr('tabindex', 0);

        var $button = $(h('button.btn.btn-primary', [
            h('i.fa.fa-plus'),
            h('span', Messages.tag_add)
        ]));


        Util.onClickEnter($button, function (e) {
            $t.tokenfield('createToken', $input.val());
            e.stopPropagation();
        });

        var $container = $(h('span.cp-tokenfield-container'));
        var $form = $(h('span.cp-tokenfield-form'));
        $container.insertAfter($input);

        // Fix the UI to keep the "add" or "edit" button at the correct location
        var isEdit = false;
        var called = false;
        var resetUI = function () {
            called = true;
            setTimeout(function () {
                $container.find('.tokenfield-empty').remove();
                var $tokens = $root.find('.token').prependTo($container);
                if (!$tokens.length) {
                    $container.prepend(h('span.tokenfield-empty', Messages.kanban_noTags));
                }
                $tokens.find('.close').attr('tabindex', 0).on('keydown', e => {
                    e.stopPropagation();
                });
                $tokens.find('.token-label').attr('tabindex', 0).on('keydown', function (e) {
                    if (e.which === 13 || e.which === 32) {
                        $(this).dblclick();
                    }
                    e.stopPropagation();
                });
                $form.append($input);
                $form.append($button);
                if (isEdit) { $button.find('span').text(Messages.tag_edit); }
                else { $button.find('span').text(Messages.add); }
                $container.append($form);
                isEdit = false;
                called = false;
            });
        };
        resetUI();

        const focusInput = () => {
            let active = document.activeElement;
            if ($.contains($container[0], active)) {
                setTimeout(() => {
                    $input.focus();
                });
            }
        };

        $t.on('tokenfield:removedtoken', function () {
            resetUI();
            focusInput();
        });
        $t.on('tokenfield:editedtoken', function () {
            resetUI();
            focusInput();
        });
        $t.on('tokenfield:createdtoken', function () {
            $input.val('');
            resetUI();
            focusInput();
        });
        $t.on('tokenfield:edittoken', function () {
            isEdit = true;
        });

        // Fix UI issue where the input could go outside of the container
        var MutationObserver = window.MutationObserver;
        var observer = new MutationObserver(function(mutations) {
            if (called) { return; }
            mutations.forEach(function(mutation) {
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    if (mutation.addedNodes[i].classList &&
                        mutation.addedNodes[i].classList.contains('token-input')) {
                        resetUI();
                        break;
                    }
                }
            });
        });
        observer.observe($root[0], {
            childList: true,
            subtree: false
        });

        $t.on('tokenfield:removetoken', function () {
            $input.focus();
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

        $t.closest('.tokenfield').removeClass('form-control');
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
            dialog.message([ Messages.tags_add ]),
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
        $(tagger).on('keydown', function (e) {
            if (e.which === 27) {
                $cancel.click();
                return;
            }
            if (e.which === 13) {
                $ok.click();
            }
        });

        $(tagger).on('click submit', function (e) {
            e.stopPropagation();
        });

        document.body.appendChild(tagger);
        // :(
        setTimeout(function () {
            field.setTokens(tags);
            field.focus();
        });

        var $field = field.tokenfield.closest('.tokenfield').find('.token-input');
        $field.on('keypress', function (e) {
            if (!$field.val() && e.which === 13) { return void $ok.click(); }
        });
        $field.on('keydown', function (e) {
            if (!$field.val() && e.which === 27) { return void $cancel.click(); }
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
            var button = h('button', { 'class': b.className || '' }, [
                b.iconClass ? h('i' + b.iconClass) : undefined,
                b.name
            ]);
            button.classList.add('btn');
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
                Util.onClickEnter($(button), function (e) {
                    e.stopPropagation();
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

        var cls = opt.scrollable ? '.cp-alertify-scrollable' : '';
        var frame = h('div'+cls, [
            message,
            dialog.getButtons(opt.buttons, opt.onClose)
        ]);
        if (opt.forefront) { $(frame).addClass('forefront'); }
        return frame;
    };

    let addTabListener = UI.addTabListener = frame => {
        // find focusable elements
        let modalElements = $(frame).find('a, button, input, [tabindex]:not([tabindex="-1"]), textarea').filter(':visible').filter(':not(:disabled)');

        if (modalElements.length === 0) {
            // there are no focusable elements -> nothing to do for us here
            return;
        }

        // intialize with focus on first element
        modalElements[0].focus();

        $(frame).on('keydown', function (e) {
            modalElements = $(frame).find('a, button, input, [tabindex]:not([tabindex="-1"]), textarea').filter(':visible').filter(':not(:disabled)'); // for modals with dynamic content

            if (e.which === 9) { // Tab
                if (e.shiftKey) {
                    // On the first element, shift+tab goes to last
                    if (document.activeElement === modalElements[0]) {
                        e.preventDefault();
                        modalElements[modalElements.length - 1].focus();
                    }
                } else {
                    // On the last element, tab goes to first
                    if (document.activeElement === modalElements[modalElements.length - 1]) {
                        e.preventDefault();
                        modalElements[0].focus();
                    }
                }
            }
        });

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

        addTabListener(frame);

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
                addTabListener($blockContainer);
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
        ], opt);

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

        addTabListener(frame);
        return {
            element: frame,
            delete: close
        };
    };

    UI.prompt = function (msg, def, cb, opt, force) {
        cb = cb || function () {};
        opt = opt || {};

        var inputBlock = opt.password ? UI.passwordInput() :
                            (opt.typeInput ? dialog.textTypeInput(opt.typeInput) : dialog.textInput(opt && opt.inputOpts));
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
            addTabListener(frame);
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
        ], opt);

        var listener;
        var close = Util.once(function (bool, ev) {
            $(frame).fadeOut(150, function () { $(this).remove(); });
            stopListening(listener);
            cb(bool, ev);
        });

        var $ok = $(ok).click(function (ev) { close(true, ev); });
        var $cancel = $(cancel).click(function (ev) { close(false, ev); });

        document.body.appendChild(frame);

        addTabListener(frame);

        listener = listenForKeys(function () {
            // Only trigger OK if cancel is not focused
            if (document.activeElement === $cancel[0]) {
                return void $cancel.click();
            }
            $ok.click();
        }, function () {
            $cancel.click();
        }, frame);

        setTimeout(function () {
            Notifier.notify();
            $(frame).find('.ok').focus();
            if (typeof(opt.done) === 'function') {
                opt.done($ok.closest('.dialog'));
            }
        });
    };
    // TODO: make it such that the confirmButton's width does not change
    UI.confirmButton = function (originalBtn, config, _cb) {
        config = config || {};
        var cb = Util.mkAsync(_cb);
        if (!config.multiple) {
            cb = Util.once(cb);
        }
        var classes = 'btn ' + (config.classes || 'btn-primary');
        var newCls = config.new ? '.new' : '';

        var button = h('button', {
            "class": classes,
            title: config.title || ''
        }, Messages.areYouSure);
        var $button = $(button);

        var div = h('div', {
            "class": config.classes || ''
        });
        var timer = h('div.cp-button-timer', div);

        var content = h('div.cp-button-confirm'+newCls, [
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

        $button.click(function (e) {
            e.stopPropagation();
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

        var newCls2 = config.new ? 'new' : '';
        $(originalBtn).addClass('cp-button-confirm-placeholder').addClass(newCls2).on('click keydown', function (e) {
            if (e.type === 'click' || (e.type === 'keydown' && e.key === 'Enter')) {
                e.stopPropagation();
                // If we have a validation function, continue only if it's true
                if (config.validate && !config.validate()) { return; }
                i = 1;
                to = setTimeout(todo, INTERVAL);
                $(originalBtn).hide().after(content);
                $(button).focus();
            }
        });


        return {
            reset: function () {
                done(false);
            }
        };
    };


    UI.proposal = function (content, cb) {
        var clicked = false;
        var buttons = [{
            name: Messages.friendRequest_later,
            onClick: function () {
                if (clicked) { return; }
                clicked = true;
            },
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.friendRequest_accept,
            onClick: function () {
                if (clicked) { return; }
                clicked = true;
                cb(true);
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.friendRequest_decline,
            onClick: function () {
                if (clicked) { return; }
                clicked = true;
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
            type: 'password',
            tabindex: '0',
            autocomplete: 'one-time-code', // https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete#values
        }, opts);

        var input = h('input.cp-password-input', attributes);
        var eye = h('span.fa.fa-eye.cp-password-reveal', {
            tabindex: 0
        });

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
            Util.onClickEnter($eye, function (e) {
                e.stopPropagation();
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
            'data-cptippy-html': true,
            style: 'text-decoration: none !important;',
            title: text,
            href: href,
            target: "_blank",
            'data-tippy-placement': "right",
            'aria-label': Messages.help_genericMore //TBC XXX
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

    UI.addLoadingScreen = function (config) {
        config = config || {};
        var loadingText = config.loadingText;
        var todo = function () {
            var $loading = $('#' + LOADING);
            // Show the loading screen
            $loading.css('display', '');
            $loading.removeClass('cp-loading-hidden');
            $loading.removeClass('cp-loading-transparent');
            if (config.newProgress) {
                var progress = h('div.cp-loading-progress', [
                    h('p.cp-loading-progress-list'),
                    h('p.cp-loading-progress-container')
                ]);
                $loading.find('.cp-loading-spinner-container').after(progress);
            }
            if (!$loading.find('.cp-loading-progress').length) {
                // Add spinner
                $('.cp-loading-spinner-container').show();
            }
            // Add loading text
            if (loadingText) {
                $('#' + LOADING).find('#cp-loading-message').show().text(loadingText);
            } else {
                $('#' + LOADING).find('#cp-loading-message').hide().text('');
            }
        };
        if ($('#' + LOADING).length) {
            todo();
        } else {
            Loading();
            todo();
        }

        $('html').toggleClass('cp-loading-noscroll', true);
        // Remove the inner placeholder (iframe)
        $('#placeholder').remove();
    };
    UI.updateLoadingProgress = function (data) {
        if (window.CryptPad_updateLoadingProgress) {
            window.CryptPad_updateLoadingProgress(data);
        }
    };
    UI.removeLoadingScreen = function (cb) {
        // Release the test blocker, hopefully every test has been registered.
        // This test is created in sframe-boot2.js
        cb = cb || function () {};
        //if (Test.__ASYNC_BLOCKER__) { Test.__ASYNC_BLOCKER__.pass(); }

        var $loading = $('#' + LOADING);
        $loading.addClass("cp-loading-hidden"); // Hide the loading screen
        $loading.find('.cp-loading-progress').remove(); // Remove the progress list
        setTimeout(cb, 750);
        $('head > link[href^="/customize/src/pre-loading.css"]').remove();
        $('html').toggleClass('cp-loading-noscroll', false);
    };
    UI.errorLoadingScreen = function (error, transparent, exitable) {
        if (error === 'Error: XDR encoding failure') {
            console.warn(error);
            return;
        }

        var $loading = $('#' + LOADING);
        if (!$loading.is(':visible') || $loading.hasClass('cp-loading-hidden')) {
            UI.addLoadingScreen();
        }
        // Remove the progress list
        $loading.find('.cp-loading-progress').remove();
        // Hide the spinner
        $('.cp-loading-spinner-container').hide();
        $loading.removeClass('cp-loading-transparent');
        if (transparent) { $loading.addClass('cp-loading-transparent'); }

        // Add the error message
        var $error = $loading.find('#cp-loading-message').show();
        if (error instanceof Element) {
            $error.html('').append(error);
        } else {
            $error.html(error || Messages.error);
        }
        $error.find('a[href]').click(function (e) {
            e.preventDefault();
            var href = $(this).prop('href');
            if (!href) { return; }
            if (e && e.ctrlKey) {
                window.open('/bounce/#'+encodeURIComponent(href));
                return;
            }
            window.parent.location = href;
        });
        if (exitable) {
            // if true or function, ALSO add a button to leave
            $(window).focus();
            $(window).keydown(function (e) { // what if they don't have a keyboard?
                if (e.which === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Function: call the function (should be a redirect)
                    if (typeof(exitable) === "function") { return void exitable(); }
                    // Otherwise remove the loading screen
                    $loading.hide();
                    $('html').toggleClass('cp-loading-noscroll', false);
                }
            });
        }
    };

    UI.getNewIcon = function (type) {
        var icon = h('i.fa.fa-file-text-o');

        if (AppConfig.applicationsIcon && AppConfig.applicationsIcon[type]) {
            icon = AppConfig.applicationsIcon[type];
            var font = icon.indexOf('cptools') === 0 ? 'cptools' : 'fa';
            if (type === 'fileupload') { type = 'file'; }
            if (type === 'folderupload') { type = 'file'; }
            if (type === 'link') { type = 'drive'; }
            var appClass = ' cp-icon cp-icon-color-'+type;
            icon = h('i', {'class': font + ' ' + icon + appClass});
        }

        return icon;
    };
    var $defaultIcon = $('<span>', {"class": "fa fa-file-text-o"});
    UI.getIcon = function (type) {
        var $icon = $defaultIcon.clone();

        if (AppConfig.applicationsIcon && AppConfig.applicationsIcon[type]) {
            var icon = AppConfig.applicationsIcon[type];
            var font = icon.indexOf('cptools') === 0 ? 'cptools' : 'fa';
            if (type === 'fileupload') { type = 'file'; }
            if (type === 'folderupload') { type = 'file'; }
            if (type === 'link') { type = 'drive'; }
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
        if (data.static) { type = 'link'; }
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

    UI.clearTooltipsDelay = function () {
        setTimeout(UI.clearTooltips, 500);
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
        var markOpts = { tabindex: 0, role: 'checkbox', 'aria-checked': checked, 'aria-labelledby': inputOpts.id + '-label' };
        $.extend(markOpts, opts.mark || {});

        var input = h('input', inputOpts);
        var $input = $(input);
        var mark = h('span.cp-checkmark-mark', markOpts);
        var $mark = $(mark);
        var label = h('span.cp-checkmark-label', {id: inputOpts.id + '-label'}, labelTxt);

        $mark.keydown(function (e) {
            if ($input.is(':disabled')) { return; }
            if (e.which === 32 || e.which === 13){
                e.stopPropagation();
                e.preventDefault();
                $input.prop('checked', !$input.is(':checked'));
                $input.change();
            }
        });

        $input.change(function () {
            if (!opts.labelAlt) { return; }
            if ($input.is(':checked') !== checked) {
                $(label).text(opts.labelAlt);
                $mark.attr('aria-checked', 'true');
            } else {
                $(label).text(labelTxt);
                $mark.attr('aria-checked', 'false');
            }
        });

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
        var $input = $(input);
        var mark = h('span.cp-radio-mark', markOpts);
        var label = h('span.cp-checkmark-label', labelTxt);

        $(mark).keydown(function (e) {
            if ($input.is(':disabled')) { return; }
            if (e.which === 13 || e.which === 32) {
                e.stopPropagation();
                e.preventDefault();
                if ($input.is(':checked')) { return; }
                $input.prop('checked', !$input.is(':checked'));
                $input.change();
            }
        });

        $input.change(function () { $(mark).focus(); });

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

        var footerSel = 'div.cp-corner-footer';
        var popup = h('div.cp-corner-container', [
            setHTML(h('div.cp-corner-text'), text),
            h('div.cp-corner-actions', actions),
            (typeof(footer) === 'string'?
                setHTML(h(footerSel), footer):
                h(footerSel, footer)),
            opts.dontShowAgain ? dontShowAgain : undefined
        ]);

        var $popup = $(popup);

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

/*  QR code generation is synchronous once the library is loaded
    so this could be syncronous if we load the library separately. */
    UI.createQRCode = function (data, _cb) {
        var cb = Util.once(Util.mkAsync(_cb || Util.noop));
        require(['/lib/qrcode.min.js'], function () {
            var div = h('div');
            /*var code =*/ new window.QRCode(div, data);
            cb(void 0, div);
        }, function (err) {
            cb(err);
        });
    };


    UI.getOTPScreen = function (cb, exitable, err) {
        var btn, input;
        var error;
        if (err) {
            error = h('p.cp-password-error', Messages.settings_otp_invalid);
        }
        var block = h('div#cp-loading-password-prompt', [
            error,
            h('p.cp-password-info', Messages.loading_enter_otp),
            h('p.cp-password-form', [
                input = h('input', {
                    placeholder: Messages.settings_otp_code,
                    autocomplete: 'off',
                    autocorrect: 'off',
                    autocapitalize: 'off',
                    spellcheck: false,
                }),
                btn = h('button.btn.btn-primary', Messages.ui_confirm)
            ]),
            UI.setHTML(h('p.cp-password-recovery'), Messages.loading_recover)
        ]);
        var $input = $(input);
        var $btn = $(btn).click(function () {
            var val = $input.val();
            if (!val) { return void UI.getOTPScreen(cb, exitable, 'INVALID_CODE'); }
            cb(val);
        });
        $(input).on('keydown', function (e) {
            if (e.which !== 13) { return; } // enter
            $btn.click();
        });
        UI.errorLoadingScreen(block, false, exitable);
        // set the user's cursor in the OTP input field
        $(block).find('.cp-password-form input').focus();

    };

    UI.getDestroyedPlaceholderMessage = (code, isAccount, isTemplate) => {
        var account = {
            ARCHIVE_OWNED: Messages.dph_account_destroyed,
            INACTIVE: Messages.dph_account_inactive,
            MODERATION_ACCOUNT: Messages.dph_account_moderated,
            MODERATION_BLOCK: Messages.dph_account_moderated,
            PASSWORD_CHANGE: Messages.dph_account_pw,
        };
        var template = {
            ARCHIVE_OWNED: Messages.dph_tmp_destroyed,
            MODERATION_PAD: Messages.dph_tmp_moderated,
            MODERATION_ACCOUNT: Messages.dph_tmp_moderated_account,
            PASSWORD_CHANGE: Messages.dph_tmp_pw
        };
        var pad = {
            ARCHIVE_OWNED: Messages.dph_pad_destroyed,
            INACTIVE: Messages.dph_pad_inactive,
            MODERATION_PAD: Messages.dph_pad_moderated,
            MODERATION_DESTROY: Messages.dph_pad_moderated,
            MODERATION_ACCOUNT: Messages.dph_pad_moderated_account,
            PASSWORD_CHANGE: Messages.dph_pad_pw
        };
        var msg = pad[code];
        if (isAccount) {
            msg = account[code];
        } else if (isTemplate) {
            msg = template[code];
        }
        if (!msg) { msg = Messages.dph_default; }
        return msg;
    };
    UI.getDestroyedPlaceholder = function (reason, isAccount) {
        if (typeof(reason) !== "string") { return; }
        var split = reason.split(':');
        var code = split[0]; // Generated code
        var input = split[1]; // User/admin manual input
        var text = UI.getDestroyedPlaceholderMessage(code, isAccount);
        var reasonBlock = input ? h('p', Messages._getKey('dph_reason', [input])) : undefined;
        return h('div', [
            h('p', text),
            reasonBlock
        ]);
    };

    return UI;
});
