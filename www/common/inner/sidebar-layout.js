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
    h,
) {
    const Sidebar = {};


    Sidebar.create = function (common, app, $container) {
        const $leftside = $(h('div#cp-sidebarlayout-leftside')).appendTo($container);
        const $rightside = $(h('div#cp-sidebarlayout-rightside')).appendTo($container);
        const sidebar = {};
        const items = {};

        let blocks = sidebar.blocks = {};
        blocks.labelledInput = (label, input) => {
            let uid = Util.uid();
            let id = `cp-${app}-item-${uid}`;
            input.setAttribute('id', id);
            return [
                h('label', { for: id }, label),
                input,
            ];
        };
        blocks.button = (type, icon, text) => {
            type = type || 'primary';
            if (icon && icon.indexOf('-') !== -1) {
                let prefix = icon.slice(0, icon.indexOf('-'));
                icon = `${prefix} ${icon}`;
            }
            return h(`button.btn.btn-${type}`, [
                icon ? h('i', { 'class': icon }) : undefined,
                h('span', text)
            ]);
        }
        blocks.nav = (buttons) => {
            return h('nav', buttons);
        };
        blocks.form = (content, nav) => {
            return h('div.cp-sidebar-form', [content, nav]);
        };
        blocks.input = (attr) => {
            return h('input', attr);
        };
        blocks.text = (value) => {
            return h('span', value);
        };
        blocks.alert = function (type, big, content) {
            var isBigClass = big ? '.cp-sidebar-bigger-alert' : ''; // Add the class if we want a bigger font-size
            return h('div.alert.alert-' + type + isBigClass, content);
        };
        blocks.pre = (value) => {
            return h('pre', value);
        }
        
        blocks.textArea = function (attributes, value) {
            return h('textarea', attributes, value || '');
        };

        blocks.unorderedList = function (entries) {
            const ul = h('ul');
            entries.forEach(entry => {
                const li = h('li', [h('strong',  entry)]);
                ul.appendChild(li);
            });
            return ul;
        };
        
        
        blocks.checkbox = (key, label, state, opts, onChange) => {
            var box = UI.createCheckbox(`cp-${app}-${key}`, label, state, { label: { class: 'noTitle' } });
            if (opts && opts.spinner) {
                box.spinner = UI.makeSpinner($(box));
            }
            // Attach event listener for checkbox change
            $(box).on('change', function() {
                // Invoke the provided onChange callback function with the new checkbox state
                onChange(this.checked);
            });
            return box;
        };
        

        
        
        blocks.table = function (header, entries) {
            const table = h('table.cp-sidebar-list');
            if (header) {
                const headerValues = header.map(value => {
                    const lastWord = value.split(' ').pop(); // Extracting the last word
                    return h('th', { class: lastWord.toLowerCase() }, value); // Modified to use the last word
                });
                const headerRow = h('thead', h('tr', headerValues));
                table.appendChild(headerRow);
            }

            table.updateContent = (newEntries) => {
                $(table).find('tbody').remove();
                let bodyContent = [];
                newEntries.forEach(line => {
                    const row = h('tr', line.map(value => { return h('td', value); }));
                    bodyContent.push(row);
                });
                table.appendChild(h('tbody', bodyContent));
            };
            table.updateContent(entries);
        
            return table;
        };
        
        

        blocks.clickableButton = function (type, icon, text, callback) {
            var button = blocks.button(type, icon, text);
            var $button = $(button);
            button.spinner = h('span');
            var spinner = UI.makeSpinner($(button.spinner));

            Util.onClickEnter($button, function () {
                spinner.spin();
                $button.attr('disabled', 'disabled');
                callback(function (success) {
                    $button.removeAttr('disabled');
                    if (success) { return void spinner.done(); }
                    spinner.hide();
                });
            });
            return button;
        };

        blocks.box = (content, className) => {
            return h('div', { class: className }, content);
        };

        const keyToCamlCase = (key) => {
            return key.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
        };
        sidebar.addItem = (key, get, options) => {
            const safeKey = keyToCamlCase(key);
            get((content, config) => {
                config = config || {};
                options = options || {};
                const title = options.noTitle ? undefined : h('label.cp-item-label', {
                    id: `cp-${app}-${key}`
                }, Messages[`${app}_${safeKey}Title`] || key);
                const hint = options.noHint ? undefined : h('span.cp-sidebarlayout-description',
                    Messages[`${app}_${safeKey}Hint`] || 'Coming soon...');
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
            const state = data.getState();
            const key = data.key;
            const safeKey = keyToCamlCase(key);

            sidebar.addItem(key, function (cb) {
                var labelKey = `${app}_${safeKey}Label`;
                var titleKey = `${app}_${safeKey}Title`;
                var label = Messages[labelKey] || Messages[titleKey];
                var box = sidebar.blocks.checkbox(key, label, state, { spinner: true });
                var $cbox = $(box);
                var spinner = box.spinner;
                var $checkbox = $cbox.find('input').on('change', function() {
                    spinner.spin();
                    var val = $checkbox.is(':checked') || false;
                    $checkbox.attr('disabled', 'disabled');
                    data.query(val, function (state) {
                        spinner.done();
                        $checkbox[0].checked = state;
                        $checkbox.removeAttr('disabled');
                    });
                });
                cb(box);
            });
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
            cat.content.forEach(function (c) { $(items[c]).show(); });
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
                var isActive = key === active ? '.cp-leftside-active' : '';
                var item = h('li.cp-sidebarlayout-category'+isActive, {
                    'role': 'menuitem',
                    'tabindex': 0
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
                });

            });
            showCategories(categories[active]);
            $leftside.append(container);
        };

        sidebar.disableItem = (key) => {
            $(items[key]).remove();
            delete items[key];
        };

        return sidebar;
    };

    return Sidebar;
});
