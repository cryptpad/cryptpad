// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/nthen/index.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/customize/messages.js',
    '/common/hyperscript.js',
], function(
    $,
    nThen,
    UI,
    UIElements,
    Util,
    Hash,
    Messages,
    h
) {
    const Sidebar = {};

    Sidebar.create = function (common, app, $container) {
        const $leftside = $(h('div#cp-sidebarlayout-leftside')).appendTo($container);
        const $rightside = $(h('div#cp-sidebarlayout-rightside')).appendTo($container);
        const sidebar = {
            $leftside,
            $rightside
        };
        const items = {};

        let blocks = sidebar.blocks = {};
        blocks.labelledInput = (label, input, inputBlock) => {
            let uid = Util.uid();
            let id = `cp-${app}-item-${uid}`;
            input.setAttribute('id', id);
            let labelElement = h('label', { for: id }, label);
            return h('div', { class: 'cp-labelled-input' }, [
                labelElement,
                inputBlock || input
            ]);
        };

        blocks.icon = (icon) => {
            let s = icon.split(' ');
            let cls;
            if (s.length > 1) {
                cls = '.' + s.join('.');
            } else {
                let prefix = icon.slice(0, icon.indexOf('-'));
                cls = `.${prefix}.${icon}`;
            }
            return h(`i${cls}`);
        };
        blocks.button = (type, icon, text) => {
            type = type || 'primary';
            return h(`button.btn.btn-${type}`, [
                icon ? blocks.icon(icon) : undefined,
                h('span', text)
            ]);
        };
        blocks.nav = (buttons) => {
            return h('nav', buttons);
        };
        blocks.form = (content, nav) => {
            return h('div.cp-sidebar-form', [content, nav]);
        };
        blocks.input = (attr) => {
            return h('input', attr);
        };
        blocks.inputButton = (input, button, opts) => {
            if (opts.onEnterDelegate) {
                $(input).on('keypress', e => {
                    if (e.which === 13) {
                        $(button).click();
                    }
                });
            }
            return h('div.cp-sidebar-input-block', [input, button]);
        };
        blocks.code = val => {
            return h('code', val);
        };
        blocks.inline = (value, className) => {
            let attr = {};
            if (className) { attr.class = className; }
            return h('span', attr, value);
        };
        blocks.block = (content, className) => {
            let attr = {};
            if (className) { attr.class = className; }
            return h('div', attr, content);
        };
        blocks.paragraph = (content) => {
            return h('p', content);
        };

        blocks.alert = function (type, big, content) {
            var isBigClass = big ? '.cp-sidebar-bigger-alert' : ''; // Add the class if we want a bigger font-size
            return h('div.alert.alert-' + type + isBigClass, content);
        };

        blocks.alertHTML = function (message, element) {
            return h('span', [
                UIElements.setHTML(h('p'), message),
                element
        ]);
        };
        blocks.pre = (value) => {
            return h('pre', value);
        };

        blocks.textarea = function (attributes, value) {
            return h('textarea', attributes, value || '');
        };

        blocks.unorderedList = function (entries) {
            const ul = h('ul');

            ul.updateContent = (entries) => {
                ul.innerHTML = '';
                entries.forEach(entry => {
                    const li = h('li', entry);
                    ul.appendChild(li);
                });
            };
            ul.updateContent(entries);

            return ul;
        };

        blocks.checkbox = (key, label, state, opts, onChange) => {
            var box = UI.createCheckbox(`cp-${app}-${key}`, label, state, { label: { class: 'noTitle' } });
            if (opts && opts.spinner) {
                box.spinner = UI.makeSpinner($(box));
            }
            if (typeof(onChange) === "function"){
                $(box).find('input').on('change', function() {
                    onChange(this.checked);
                });
            }
            return box;
        };

        blocks.table = function (header, entries) {
            const table = h('table.cp-sidebar-table');
            if (header) {
                const headerValues = header.map(value => {
                    const lastWord = value.split(' ').pop(); // Extracting the last word
                    return h('th', { class: lastWord.toLowerCase() }, value); // Modified to use the last word
                });
                const headerRow = h('thead', h('tr', headerValues));
                table.appendChild(headerRow);
            }

            let getRow = line => {
                return h('tr', line.map(value => {
                    if (typeof(value) === "object" && value.content) {
                        return h('td', value.attr || {}, value.content);
                    }
                    return h('td', value);
                }));
            };
            table.updateContent = (newEntries) => {
                $(table).show().find('tbody').remove();
                if (!newEntries.length) {
                    return void $(table).hide();
                }
                let bodyContent = [];
                newEntries.forEach(line => {
                    const row = getRow(line);
                    bodyContent.push(row);
                });
                table.appendChild(h('tbody', bodyContent));
            };
            table.updateContent(entries);
            table.addLine = (line) => {
                const row = getRow(line);
                $(table).find('tbody').append(row);
            };

            return table;
        };

        blocks.link = function (text, url, isSafe) {
            var link = h('a', { href: url }, text);
            $(link).click(function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                if (isSafe) {
                    common.openURL(url);
                } else {
                    common.openUnsafeURL(url);
                }
            });
            return link;
        };

        blocks.activeButton = function (type, icon, text, callback, keepEnabled) {
            var button = blocks.button(type, icon, text);
            var $button = $(button);
            button.spinner = h('span');
            var spinner = UI.makeSpinner($(button.spinner));

            Util.onClickEnter($button, function () {
                spinner.spin();
                if (!keepEnabled) { $button.attr('disabled', 'disabled'); }
                let done = success => {
                    $button.removeAttr('disabled');
                    if (success) { return void spinner.done(); }
                    spinner.hide();
                };
                // The callback can be synchrnous or async, handle "done" in both ways
                let success = callback(done); // Async
                if (typeof(success) === "boolean") { done(success); } // Sync
            });
            return button;
        };

        const keyToCamlCase = (key) => {
            return key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        };
        blocks.activeCheckbox = (data) => {
            const state = data.getState();
            const key = data.key;
            const safeKey = keyToCamlCase(key);
            var labelKey = `${app}_${safeKey}Label`;
            var titleKey = `${app}_${safeKey}Title`;
            var label = Messages[labelKey] || Messages[titleKey];
            var box = blocks.checkbox(key, label, state, { spinner: true }, checked => {
                var $cbox = $(box);
                var $checkbox = $cbox.find('input');
                let spinner = box.spinner;
                spinner.spin();
                $checkbox.attr('disabled', 'disabled');
                var val = !!checked;
                data.query(val, function (state) {
                    spinner.done();
                    $checkbox[0].checked = state;
                    $checkbox.removeAttr('disabled');
                });
            });
            return box;
        };

        sidebar.addItem = (key, get, options) => {
            const safeKey = keyToCamlCase(key);
            get((content) => {
                if (content === false) { return; }
                options = options || {};
                const title = options.noTitle ? undefined : h('label.cp-item-label', {
                    id: `cp-${app}-${key}`
                }, Messages[`${app}_${safeKey}Title`] || key);
                const hint = options.noHint ? undefined : h('span.cp-sidebarlayout-description',
                    Messages[`${app}_${safeKey}Hint`] || 'Coming soon...');
                if (hint && options.htmlHint) {
                    hint.innerHTML = Messages[`${app}_${safeKey}Hint`];
                }
                const div = h(`div.cp-sidebarlayout-element`, {
                    'data-item': key,
                    style: 'display:none;'
                }, [
                    title,
                    hint,
                    content
                ]);
                items[key] = div;
                $rightside.append(div);
            });
        };

        sidebar.addCheckboxItem = (data) => {
            const key = data.key;
            let box = blocks.activeCheckbox(data);
            sidebar.addItem(key, function (cb) {
                cb(box);
            }, data.options);
        };

        var hideCategories = function () {
            Object.keys(items).forEach(key => { $(items[key]).hide(); });
        };
        var showCategories = function (cat) {
            if (!cat || !Array.isArray(cat.content)) {
                console.error("Invalid category", cat);
                return UI.warn(Messages.error);
            }
            hideCategories();
            cat.content.forEach(function (c) {
                // Show and reorder for this category
                $(items[c]).show().appendTo($rightside);
            });
        };
        /*
        categories = {
            key1: {
                icon: 'fa fa-user',
                content: [ 'item1', 'item2' ]
            }
            key2: {
                icon: 'fa fa-bell',
                onClick: function () {}
            }
        }
        */
        sidebar.makeLeftside = (categories) => {
            $leftside.html('');
            let container = h('div.cp-sidebarlayout-categories', { role: 'menu' });
            var metadataMgr = common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            var active = privateData.category || '';
            if (active.indexOf('-') !== -1) { active = active.split('-')[0]; }

            Object.keys(categories).forEach(function (key, i) {
                if (!active && !i) { active = key; }
                var category = categories[key];
                var icon;
                if (category.icon) { icon = h('span', { class: category.icon }); }
                var item = h('li.cp-sidebarlayout-category', {
                    'role': 'menuitem',
                    'tabindex': 0,
                    'data-category': key
                }, [
                    icon,
                    Messages[`${app}_cat_${key}`] || key,
                ]);
                var $item = $(item).appendTo(container);
                Util.onClickEnter($item, function () {
                    if (!Array.isArray(category.content) && category.onClick) {
                        category.onClick();
                        return;
                    }
                    active = key;
                    common.setHash(key);
                    $(container).find('.cp-leftside-active').removeClass('cp-leftside-active');
                    $(item).addClass('cp-leftside-active');
                    showCategories(category);
                    if (category.onOpen) { category.onOpen(); }
                });

            });
            common.setHash(active);

            setTimeout(() => { sidebar.openCategory(active); });
            $leftside.append(container);
        };

        sidebar.openCategory = name => {
            $(`.cp-sidebarlayout-category[data-category="${name}"]`).click();
        };
        sidebar.deleteCategory = name => {
            $(`.cp-sidebarlayout-category[data-category="${name}"]`).remove();
        };

        sidebar.disableItem = (key) => {
            $(items[key]).remove();
            delete items[key];
        };

        return sidebar;
    };

    return Sidebar;
});
