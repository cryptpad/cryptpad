define([
    'jquery',
    'json.sortify',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/sframe-app-framework.js',
    '/common/toolbar.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/clipboard.js',
    '/common/inner/common-mediatag.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/lib/datepicker/flatpickr.js',
    '/bower_components/sortablejs/Sortable.min.js',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/form/app-form.less',
], function (
    $,
    Sortify,
    Crypto,
    Framework,
    Toolbar,
    nThen,
    SFCommon,
    Util,
    Hash,
    UI,
    UIElements,
    Clipboard,
    MT,
    h,
    Messages,
    AppConfig,
    Share, Access, Properties,
    Flatpickr,
    Sortable
    )
{
    var APP = window.APP = {
    };

    var is24h = false;
    var dateFormat = "Y-m-d H:i";
    try {
        is24h = !new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' }).format(0).match(/AM/);
    } catch (e) {}
    if (!is24h) { dateFormat = "Y-m-d h:i K"; }

    Messages.button_newform = "New Form"; // XXX
    Messages.form_invalid = "Invalid form";
    Messages.form_editBlock = "Edit options";
    Messages.form_editQuestion = "Edit question";
    Messages.form_editMax = "Max selectable options";
    Messages.form_editType = "Options type";

    Messages.form_poll_text = "Text";
    Messages.form_poll_day = "Day";
    Messages.form_poll_time = "Time";

    Messages.form_default = "Your question here?";
    Messages.form_type_input = "Text"; // XXX
    Messages.form_type_radio = "Radio"; // XXX
    Messages.form_type_multiradio = "Multiline Radio"; // XXX
    Messages.form_type_checkbox = "Checkbox"; // XXX
    Messages.form_type_multicheck = "Multiline Checkbox"; // XXX
    Messages.form_type_poll = "Poll"; // XXX

    Messages.form_duplicates = "Duplicate entries have been removed";
    Messages.form_maxOptions = "{0} answer(s) max";

    Messages.form_submit = "Submit";
    Messages.form_update = "Update";
    Messages.form_reset = "Reset";
    Messages.form_sent = "Sent";
    Messages.form_delete = "Delete block";

    Messages.form_cantFindAnswers = "Unable to retrieve your existing answers for this form.";

    Messages.form_viewResults = "Go to responses";
    Messages.form_viewCreator = "Go to form creator";

    Messages.form_notAnswered = "And <b>{0}</b> empty answers";

    Messages.form_makePublic = "Make public";
    Messages.form_makePublicWarning = "Are you sure you want to make the results of this form public? This can't be undone.";
    Messages.form_isPublic = "Results are public";
    Messages.form_isPrivate = "Results are private";

    Messages.form_open = "Open";
    Messages.form_setEnd = "Set closing date";
    Messages.form_removeEnd = "Remove closing date";
    Messages.form_isOpen = "This form is open";
    Messages.form_isClosed = "This form was closed on {0}";
    Messages.form_willClose = "This form will close on {0}";

    Messages.form_defaultOption = "Option {0}";
    Messages.form_defaultItem = "Item {0}";
    Messages.form_newOption = "New option";
    Messages.form_newItem = "New item";
    Messages.form_add_option = "Add option";
    Messages.form_add_item = "Add item";


    var MAX_OPTIONS = 10; // XXX
    var MAX_ITEMS = 10; // XXX

    var editOptions = function (v, setCursorGetter, cb, tmp) {
        var add = h('button.btn.btn-secondary', [
            h('i.fa.fa-plus'),
            h('span', Messages.form_add_option)
        ]);
        var addItem = h('button.btn.btn-secondary', [
            h('i.fa.fa-plus'),
            h('span', Messages.form_add_item)
        ]);

        var cursor;
        if (tmp && tmp.content && Sortify(v) === Sortify(tmp.old)) {
            v = tmp.content;
            cursor = tmp.cursor;
        }

        var maxOptions, maxInput;
        if (typeof(v.max) === "number") {
            maxInput = h('input', {
                type:"number",
                value: v.max,
                min: 1,
                max: v.values.length
            });
            maxOptions = h('div.cp-form-edit-max-options', [
                h('span', Messages.form_editMax),
                maxInput
            ]);
        }

        var type, typeSelect;
        if (v.type) {
            var options = ['text', 'day', 'time'].map(function (t) {
                return {
                    tag: 'a',
                    attributes: {
                        'class': 'cp-form-type-value',
                        'data-value': t,
                        'href': '#',
                    },
                    content: Messages['form_poll_'+t]
                };
            });
            var dropdownConfig = {
                text: '', // Button initial text
                options: options, // Entries displayed in the menu
                //left: true, // Open to the left of the button
                //container: $(type),
                isSelect: true,
                caretDown: true,
                buttonCls: 'btn btn-secondary'
            };
            typeSelect = UIElements.createDropdown(dropdownConfig);
            typeSelect.setValue(v.type);

            type = h('div.cp-form-edit-type', [
                h('span', Messages.form_editType),
                typeSelect[0]
            ]);
        }

        // Show existing options
        var $add, $addItem;
        var getOption = function (val, isItem, uid) {
            var input = h('input', {value:val});
            if (uid) { $(input).data('uid', uid); }

            // If the input is a date, initialize flatpickr
            if (v.type && v.type !== 'text') {
                if (v.type === 'time') {
                    Flatpickr(input, {
                        enableTime: true,
                        time_24hr: is24h,
                        dateFormat: dateFormat,
                    });
                } else if (v.type === 'day') { Flatpickr(input); }
            }

            // if this element was active before the remote change, restore cursor
            var setCursor = function () {
                if (v.type !== 'text') { return; }
                input.selectionStart = cursor.start || 0;
                input.selectionEnd = cursor.end || 0;
                setTimeout(function () { input.focus(); });
            };
            if (isItem) {
                if (cursor && cursor.uid === uid && cursor.item) { setCursor(); }
            } else {
                if (cursor && cursor.el === val && !cursor.item) { setCursor(); }
            }

            var del = h('button.btn.btn-danger', h('i.fa.fa-times'));
            var el = h('div.cp-form-edit-block-input', [ input, del ]);
            $(del).click(function () {
                $(el).remove();
                // We've just deleted an item/option so we should be under the MAX limit and
                // we can show the "add" button again
                if (isItem && $addItem) { $addItem.show(); }
                if (!isItem && $add) { $add.show(); }
            });
            return el;
        };
        var inputs = v.values.map(function (val) { return getOption(val, false); });
        inputs.push(add);

        var container = h('div.cp-form-edit-block', inputs);
        var $container = $(container);

        var containerItems;
        if (v.items) {
            var inputsItems = v.items.map(function (itemData) {
                return getOption(itemData.v, true, itemData.uid);
            });
            inputsItems.push(addItem);
            containerItems = h('div.cp-form-edit-block', inputsItems);
        }

        // Doodle type change: empty current values and change input types?
        if (typeSelect) {
            typeSelect.onChange.reg(function (prettyVal, val) {
                $container.find('input').each(function (i, input) {
                    if (!input._flatpickr && val !== 'text') {
                        input.value = "";
                    }

                    if (input._flatpickr) {
                        input._flatpickr.destroy();
                        delete input._flatpickr;
                    }
                    if (val === 'time') {
                        Flatpickr(input, {
                            enableTime: true,
                            time_24hr: is24h,
                            dateFormat: dateFormat,
                        });
                    }
                    if (val === 'day') {
                        Flatpickr(input, {
                            time_24hr: is24h,
                        });
                    }
                });
            });
        }

        // "Add option" button handler
        $add = $(add).click(function () {
            $add.before(getOption(Messages.form_newOption, false));
            var l = $container.find('input').length;
            $(maxInput).attr('max', l);
            if (l >= MAX_OPTIONS) { $add.hide(); }
        });
        // If multiline block, handle "Add item" button
        $addItem = $(addItem).click(function () {
            $addItem.before(getOption(Messages.form_newItem, true, Util.uid()));
            if ($(containerItems).find('input').length >= MAX_ITEMS) { $addItem.hide(); }
        });
        if ($container.find('input').length >= MAX_OPTIONS) { $add.hide(); }
        if ($(containerItems).find('input').length >= MAX_ITEMS) { $addItem.hide(); }

        // Cancel changes
        var cancelBlock = h('button.btn.btn-secondary', Messages.cancel);
        $(cancelBlock).click(function () { cb(); });

        // Set cursor getter (to handle remote changes to the form)
        setCursorGetter(function () {
            var values = [];
            var active = document.activeElement;
            var cursor = {};
            $container.find('input').each(function (i, el) {
                if (el === active && !el._flatpickr) {
                    cursor.el= $(el).val();
                    cursor.start = el.selectionStart;
                    cursor.end = el.selectionEnd;
                }
                values.push($(el).val());
            });
            var _content = {values: values};

            if (maxInput) {
                _content.max = Number($(maxInput).val()) || 1;
            }

            if (typeSelect) {
                _content.type = typeSelect.getValue();
            }

            if (v.items) {
                var items = [];
                $(containerItems).find('input').each(function (i, el) {
                    if (el === active) {
                        cursor.item = true;
                        cursor.uid= $(el).data('uid');
                        cursor.start = el.selectionStart;
                        cursor.end = el.selectionEnd;
                    }
                    items.push({
                        uid: $(el).data('uid'),
                        v: $(el).val()
                    });
                });
                _content.items = items;
            }
            return {
                old: (tmp && tmp.old) || v,
                content: _content,
                cursor: cursor
            };
        });

        // Save changes
        var saveBlock = h('button.btn.btn-primary', [
            h('i.fa.fa-floppy-o'),
            h('span', Messages.settings_save)
        ]);
        $(saveBlock).click(function () {
            $(saveBlock).attr('disabled', 'disabled');

            // Get values
            var values = [];
            var duplicates = false;
            $container.find('input').each(function (i, el) {
                var val = $(el).val().trim();
                if (values.indexOf(val) === -1) { values.push(val); }
                else { duplicates = true; }
            });
            var res = { values: values };

            // If multiline block, get items
            if (v.items) {
                var items = [];
                $(containerItems).find('input').each(function (i, el) {
                    var val = $(el).val().trim();
                    var uid = $(el).data('uid');
                    if (!items.some(function (i) { return i.uid === uid; })) {
                        items.push({
                            uid: $(el).data('uid'),
                            v: val
                        });
                    }
                    else { duplicates = true; }
                });
                res.items = items;
            }

            // Show duplicates warning
            if (duplicates) {
                UI.warn(Messages.form_duplicates);
            }

            // If checkboxes, get the maximum number of values the users can select
            if (maxInput) {
                var maxVal = Number($(maxInput).val());
                if (isNaN(maxVal)) { maxVal = values.length; }
                res.max = maxVal;
            }

            if (typeSelect) {
                res.type = typeSelect.getValue();
            }

            cb(res);
        });

        return [
            type,
            maxOptions,
            h('div.cp-form-edit-options-block', [containerItems, container]),
            h('div', [cancelBlock, saveBlock])
        ];
    };

    var makePollTable = function (answers, opts) {
        // Create first line with options
        var els = opts.values.map(function (data) {
            if (opts.type === "day") {
                var _date = new Date(data);
                data = _date.toLocaleDateString();
            }
            return h('div.cp-poll-cell.cp-form-poll-option', data);
        });
        // Insert axis switch button
        var switchAxis = h('button.btn', [
            h('i.fa.fa-exchange'),
        ]);
        els.unshift(h('div.cp-poll-cell.cp-poll-switch', switchAxis));
        var lines = [h('div', els)];

        // Add answers
        if (Array.isArray(answers)) {
            answers.forEach(function (answer) {
                if (!answer.name || !answer.values) { return; }
                var _name = answer.name;
                var values = answer.values || {};
                var els = opts.values.map(function (data) {
                    var res = values[data] || 0;
                    var v = (Number(res) === 1) ? h('i.fa.fa-check.cp-yes') : undefined;
                    var cell = h('div.cp-poll-cell.cp-form-poll-answer', {
                        'data-value': res
                    }, v);
                    return cell;
                });
                els.unshift(h('div.cp-poll-cell.cp-poll-answer-name', _name));
                lines.push(h('div', els));
            });
        }

        var $s = $(switchAxis).click(function () {
            $s.closest('.cp-form-type-poll').toggleClass('cp-form-poll-switch');
        });

        return lines;
    };

    var getEmpty = function (empty) {
        if (empty) {
            return UI.setHTML(h('div.cp-form-results-type-text-empty'), Messages._getKey('form_notAnswered', [empty]));
        }
    };

    var findItem = function (items, uid) {
        if (!Array.isArray(items)) { return; }
        var res;
        items.some(function (item) {
            if (item.uid === uid) {
                res = item.v;
                return true;
            }
        });
        return res;
    };

    var getBlockAnswers = function (answers, uid, filterCurve) {
        return Object.keys(answers || {}).map(function (user) {
            if (filterCurve && user === filterCurve) { return; }
            try {
                return answers[user].msg[uid];
            } catch (e) { console.error(e); }
        }).filter(Boolean);
    };

    var TYPES = {
        input: {
            get: function () {
                var tag = h('input');
                var $tag = $(tag);
                return {
                    tag: tag,
                    getValue: function () { return $tag.val(); },
                    setValue: function (val) { $tag.val(val); },
                    reset: function () { $tag.val(''); }
                };
            },
            printResults: function (answers, uid) {
                var results = [];
                var empty = 0;
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !answer.trim()) { return empty++; }
                    results.push(h('div.cp-form-results-type-text-data', answer));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-text', results);
            },
            icon: h('i.fa.fa-font')
        },
        radio: {
            defaultOpts: {
                values: [1,2].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts) {
                if (!opts) { opts = TYPES.radio.defaultOpts; }
                if (!Array.isArray(opts.values)) { return; }
                var name = Util.uid();
                var els = opts.values.map(function (data, i) {
                    var radio = UI.createRadio(name, 'cp-form-'+name+'-'+i,
                               data, false, { mark: { tabindex:1 } });
                    $(radio).find('input').data('val', data);
                    return radio;
                });
                var tag = h('div.radio-group.cp-form-type-radio', els);
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res;
                        els.some(function (el) {
                            var $i = $(el).find('input');
                            if (Util.isChecked($i)) {
                                res = $i.data('val');
                                return true;
                            }
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        this.reset();
                        els.some(function (el) {
                            var $el = $(el).find('input');
                            if ($el.data('val') === val) {
                                $el.prop('checked', true);
                                return true;
                            }
                        });
                    }
                };

            },
            printResults: function (answers, uid) {
                var results = [];
                var empty = 0;
                var count = {};
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !answer.trim()) { return empty++; }
                    count[answer] = count[answer] || 0;
                    count[answer]++;
                });
                Object.keys(count).forEach(function (value) {
                    results.push(h('div.cp-form-results-type-radio-data', [
                        h('span.cp-value', value),
                        h('span.cp-count', count[value])
                    ]));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-radio', results);
            },
            icon: h('i.fa.fa-list-ul')
        },
        multiradio: {
            defaultOpts: {
                items: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultItem', [i])
                    };
                }),
                values: [1,2].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts) {
                if (!opts) { opts = TYPES.multiradio.defaultOpts; }
                if (!Array.isArray(opts.items) || !Array.isArray(opts.values)) { return; }
                var lines = opts.items.map(function (itemData) {
                    var name = itemData.uid;
                    var item = itemData.v;
                    var els = opts.values.map(function (data, i) {
                        var radio = UI.createRadio(name, 'cp-form-'+name+'-'+i,
                                   '', false, { mark: { tabindex:1 } });
                        $(radio).find('input').data('uid', name);
                        $(radio).find('input').data('val', data);
                        return radio;
                    });
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    return h('div.radio-group', {'data-uid':name}, els);
                });
                var header = opts.values.map(function (v) { return h('span', v); });
                header.unshift(h('span'));
                lines.unshift(h('div.cp-form-multiradio-header', header));

                var tag = h('div.radio-group.cp-form-type-multiradio', lines);
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res = {};
                        var l = lines.slice(1);
                        l.forEach(function (el) {
                            var $el = $(el);
                            var uid = $el.attr('data-uid');
                            $el.find('input').each(function (i, input) {
                                var $i = $(input);
                                if (res[uid]) { return; }
                                if (Util.isChecked($i)) { res[uid] = $i.data('val'); }
                            });
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        this.reset();
                        Object.keys(val || {}).forEach(function (uid) {
                            $(tag).find('[name="'+uid+'"]').each(function (i, el) {
                                if ($(el).data('val') !== val[uid]) { return; }
                                $(el).prop('checked', true);
                            });
                        });
                    }
                };

            },
            printResults: function (answers, uid, form) {
                var structure = form[uid];
                if (!structure) { return; }
                var results = [];
                var empty = 0;
                var count = {};
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !Object.keys(answer).length) { return empty++; }
                    //count[answer] = count[answer] || {};
                    Object.keys(answer).forEach(function (q_uid) {
                        var c = count[q_uid] = count[q_uid] || {};
                        var res = answer[q_uid];
                        if (!res || !res.trim()) { return; }
                        c[res] = c[res] || 0;
                        c[res]++;
                    });
                });
                Object.keys(count).forEach(function (q_uid) {
                    var q = findItem(structure.opts.items, q_uid);
                    var c = count[q_uid];
                    var values = Object.keys(c).map(function (res) {
                        return h('div.cp-form-results-type-radio-data', [
                            h('span.cp-value', res),
                            h('span.cp-count', c[res])
                        ]);
                    });
                    results.push(h('div.cp-form-results-type-multiradio-data', [
                        h('span.cp-mr-q', q),
                        h('span.cp-mr-value', values)
                    ]));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-radio', results);
            },
            icon: h('i.fa.fa-list-ul')
        },
        checkbox: {
            defaultOpts: {
                max: 3,
                values: [1, 2, 3].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts) {
                if (!opts) { opts = TYPES.checkbox.defaultOpts; }
                if (!Array.isArray(opts.values)) { return; }
                var name = Util.uid();
                var els = opts.values.map(function (data, i) {
                    var cbox = UI.createCheckbox('cp-form-'+name+'-'+i,
                               data, false, { mark: { tabindex:1 } });
                    $(cbox).find('input').data('val', data);
                    return cbox;
                });
                var tag = h('div', [
                    h('div.cp-form-max-options', Messages._getKey('form_maxOptions', [opts.max])),
                    h('div.radio-group.cp-form-type-checkbox', els)
                ]);
                var $tag = $(tag);
                $tag.find('input').on('change', function () {
                    var selected = $tag.find('input:checked').length;
                    if (selected >= opts.max) {
                        $tag.find('input:not(:checked)').attr('disabled', 'disabled');
                    } else {
                        $tag.find('input').removeAttr('disabled');
                    }
                });
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res = [];
                        els.forEach(function (el) {
                            var $i = $(el).find('input');
                            if (Util.isChecked($i)) {
                                res.push($i.data('val'));
                            }
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        this.reset();
                        if (!Array.isArray(val)) { return; }
                        els.forEach(function (el) {
                            var $el = $(el).find('input');
                            if (val.indexOf($el.data('val')) !== -1) {
                                $el.prop('checked', true);
                            }
                        });
                    }
                };

            },
            printResults: function (answers, uid) {
                var results = [];
                var empty = 0;
                var count = {};
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!Array.isArray(answer) || !answer.length) { return empty++; }
                    answer.forEach(function (val) {
                        count[val] = count[val] || 0;
                        count[val]++;
                    });
                });
                Object.keys(count).forEach(function (value) {
                    results.push(h('div.cp-form-results-type-radio-data', [
                        h('span.cp-value', value),
                        h('span.cp-count', count[value])
                    ]));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-radio', results);
            },
            icon: h('i.fa.fa-check-square-o')
        },
        multicheck: {
            defaultOpts: {
                max: 3,
                items: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultItem', [i])
                    };
                }),
                values: [1,2,3].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts) {
                if (!opts) { opts = TYPES.multicheck.defaultOpts; }
                if (!Array.isArray(opts.items) || !Array.isArray(opts.values)) { return; }
                var lines = opts.items.map(function (itemData) {
                    var name = itemData.uid;
                    var item = itemData.v;
                    var els = opts.values.map(function (data, i) {
                        var cbox = UI.createCheckbox('cp-form-'+name+'-'+i,
                                   '', false, { mark: { tabindex:1 } });
                        $(cbox).find('input').data('uid', name);
                        $(cbox).find('input').data('val', data);
                        return cbox;
                    });
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    return h('div.radio-group', {'data-uid':name}, els);
                });

                lines.forEach(function (l) {
                    $(l).find('input').on('change', function () {
                        var selected = $(l).find('input:checked').length;
                        if (selected >= opts.max) {
                            $(l).find('input:not(:checked)').attr('disabled', 'disabled');
                        } else {
                            $(l).find('input').removeAttr('disabled');
                        }
                    });
                });

                var header = opts.values.map(function (v) { return h('span', v); });
                header.unshift(h('span'));
                lines.unshift(h('div.cp-form-multiradio-header', header));

                var tag = h('div.radio-group.cp-form-type-multiradio', lines);
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res = {};
                        var l = lines.slice(1);
                        l.forEach(function (el) {
                            var $el = $(el);
                            var uid = $el.attr('data-uid');
                            res[uid] = [];
                            $el.find('input').each(function (i, input) {
                                var $i = $(input);
                                if (Util.isChecked($i)) { res[uid].push($i.data('val')); }
                            });
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        this.reset();
                        Object.keys(val || {}).forEach(function (uid) {
                            if (!Array.isArray(val[uid])) { return; }
                            $(tag).find('[data-uid="'+uid+'"] input').each(function (i, el) {
                                if (val[uid].indexOf($(el).data('val')) === -1) { return; }
                                $(el).prop('checked', true);
                            });
                        });
                    }
                };

            },
            printResults: function (answers, uid, form) {
                var structure = form[uid];
                if (!structure) { return; }
                var results = [];
                var empty = 0;
                var count = {};
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !Object.keys(answer).length) { return empty++; }
                    Object.keys(answer).forEach(function (q_uid) {
                        var c = count[q_uid] = count[q_uid] || {};
                        var res = answer[q_uid];
                        if (!Array.isArray(res) || !res.length) { return; }
                        res.forEach(function (v) {
                            c[v] = c[v] || 0;
                            c[v]++;
                        });
                    });
                });
                Object.keys(count).forEach(function (q_uid) {
                    var q = findItem(structure.opts.items, q_uid);
                    var c = count[q_uid];
                    var values = Object.keys(c).map(function (res) {
                        return h('div.cp-form-results-type-radio-data', [
                            h('span.cp-value', res),
                            h('span.cp-count', c[res])
                        ]);
                    });
                    results.push(h('div.cp-form-results-type-multiradio-data', [
                        h('span.cp-mr-q', q),
                        h('span.cp-mr-value', values)
                    ]));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-radio', results);
            },
            icon: h('i.fa.fa-list-ul')
        },
        poll: {
            defaultOpts: {
                type: 'text', // Text or Days or Time
                values: [1, 2, 3].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts, answers, username) {
                if (!opts) { opts = TYPES.poll.defaultOpts; }
                if (!Array.isArray(opts.values)) { return; }

                var lines = makePollTable(answers, opts);

                // Add form
                // XXX only if not already answered!
                var addLine = opts.values.map(function (data) {
                    var cell = h('div.cp-poll-cell.cp-form-poll-choice', [
                        h('i.fa.fa-times.cp-no'),
                        h('i.fa.fa-check.cp-yes'),
                        h('i.fa.fa-question.cp-maybe'),
                    ]);
                    var $c = $(cell);
                    $c.data('option', data);
                    var val = 0;
                    $c.attr('data-value', val);
                    $c.click(function () {
                        val = (val+1)%3;
                        $c.attr('data-value', val);
                    });
                    cell._setValue = function (v) {
                        val = v;
                        $c.attr('data-value', val);
                    };
                    return cell;
                });
                // Name input
                var nameInput = h('input', { value: username });
                addLine.unshift(h('div.cp-poll-cell', nameInput));
                // XXX Submit button here?
                lines.push(h('div', addLine));



                var tag = h('div.cp-form-type-poll', lines);
                var $tag = $(tag);

                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res = {};
                        var name = $(nameInput).val().trim() || Messages.anonymous;
                        $tag.find('.cp-form-poll-choice').each(function (i, el) {
                            var $el = $(el);
                            res[$el.data('option')] = $el.attr('data-value');
                        });
                        return {
                            name: name,
                            values: res
                        };
                    },
                    reset: function () {
                        $tag.find('.cp-form-poll-choice').attr('data-value', 0);
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (res) {
                        this.reset();
                        if (!res || !res.values || !res.name) { return; }
                        var val = res.values;
                        $(nameInput).val(res.name);
                        $tag.find('.cp-form-poll-choice').each(function (i, el) {
                            if (!el._setValue) { return; }
                            var $el = $(el);
                            console.log(el, $el.data('option'), val);
                            el._setValue(val[$el.data('option')] || 0);
                        });
                    }
                };

            },
            printResults: function (answers, uid, form) {
                var _answers = getBlockAnswers(answers, uid);
                var lines = makePollTable(_answers, form[uid].opts);
                return h('div.cp-form-type-poll', lines);
            },
            icon: h('i.fa.fa-check-square-o')
        },
    };

    var renderResults = function (content, answers) {
        var $container = $('div.cp-form-creator-results').empty();
        var form = content.form;
        var elements = content.order.map(function (uid) {
            var block = form[uid];
            var type = block.type;
            var model = TYPES[type];
            if (!model || !model.printResults) { return; }
            var print = model.printResults(answers, uid, form);

            var q = h('div.cp-form-block-question', block.q || Messages.form_default);
            return h('div.cp-form-block', [
                h('div.cp-form-block-type', [
                    TYPES[type].icon.cloneNode(),
                    h('span', Messages['form_type_'+type])
                ]),
                q,
                h('div.cp-form-block-content', print),
            ]);
        });
        $container.append(elements);
    };

    var getFormResults = function () {
        if (!Array.isArray(APP.formBlocks)) { return; }
        var results = {};
        APP.formBlocks.forEach(function (data) {
            results[data.uid] = data.getValue();
        });
        return results;
    };
    var makeFormControls = function (framework, content, update) {
        var send = h('button.cp-open.btn.btn-primary', update ? Messages.form_update : Messages.form_submit);
        var reset = h('button.cp-open.btn.btn-danger-alt', Messages.form_reset);
        $(reset).click(function () {
            if (!Array.isArray(APP.formBlocks)) { return; }
            APP.formBlocks.forEach(function (data) {
                if (typeof(data.reset) === "function") { data.reset(); }
            });
        });
        var $send = $(send).click(function () {
            $send.attr('disabled', 'disabled');
            var results = getFormResults();
            if (!results) { return; }
            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query('Q_FORM_SUBMIT', {
                mailbox: content.answers,
                results: results
            }, function (err, data) {
                $send.attr('disabled', 'disabled');
                if (err || (data && data.error)) {
                    console.error(err || data.error);
                    return void UI.warn(Messages.error);
                }
                $send.removeAttr('disabled');
                UI.alert(Messages.form_sent);
                $send.text(Messages.form_update);
            });
        });

        var viewResults;
        if (content.answers.privateKey) {
            viewResults = h('button.btn.btn-primary', [
                h('span.cp-app-form-button-results', Messages.form_viewResults),
            ]);
            var sframeChan = framework._.sfCommon.getSframeChannel();
            var $v = $(viewResults).click(function () {
                $v.attr('disabled', 'disabled');
                sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, answers) {
                    if (answers) { APP.answers = answers; }
                    $v.removeAttr('disabled');
                    $('body').addClass('cp-app-form-results');
                    renderResults(content, answers);
                });
            });
        }

        if (APP.isClosed) {
            send = undefined;
            reset = undefined;
        }

        return h('div.cp-form-send-container', [send, reset, viewResults]);
    };
    var updateForm = function (framework, content, editable, answers, temp) {
        var $container = $('div.cp-form-creator-content');
        if (!$container.length) { return; } // Not ready

        var form = content.form;

        APP.formBlocks = [];

        // XXX order array later
        var elements = content.order.map(function (uid) {
            var block = form[uid];
            var type = block.type;
            var model = TYPES[type];
            if (!model) { return; }

            var _answers, name;
            if (type === 'poll') {
                var metadataMgr = framework._.cpNfInner.metadataMgr;
                var user = metadataMgr.getUserData();
                // If we are a participant, our results shouldn't be in the table but in the
                // editable part: remove them from _answers
                _answers = getBlockAnswers(APP.answers, uid, !editable && user.curvePublic);
                name = user.name;
            }

            var data = model.get(block.opts, _answers, name);
            if (!data) { return; }
            data.uid = uid;
            if (answers && answers[uid]) { data.setValue(answers[uid]); }

            var q = h('div.cp-form-block-question', block.q || Messages.form_default);
            var editButtons, editContainer;

            APP.formBlocks.push(data);

            if (editable) {
                // Question

                var inputQ = h('input', {
                    value: block.q || Messages.form_default
                });
                var $inputQ = $(inputQ);
                var saveQ = h('button.btn.btn-primary.small', [
                    h('i.fa.fa-pencil.cp-form-edit'),
                    h('span.cp-form-edit', Messages.form_editQuestion),
                    h('i.fa.fa-floppy-o.cp-form-save'),
                    h('span.cp-form-save', Messages.settings_save)
                ]);
                var dragHandle = h('i.fa.fa-arrows-v.cp-form-block-drag');

                var $saveQ = $(saveQ).click(function () {
                    if (!$(q).hasClass('editing')) {
                        $(q).addClass('editing');
                        $inputQ.focus();
                        return;
                    }
                    var v = $inputQ.val();
                    if (!v || !v.trim()) { return void UI.warn(Messages.error); }
                    block.q = v.trim();
                    framework.localChange();
                    $saveQ.attr('disabled', 'disabled');
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        $(q).removeClass('editing');
                        $saveQ.removeAttr('disabled');
                        $inputQ.blur();
                        UI.log(Messages.saved);
                    });
                });
                var onCancelQ = function (e) {
                    if (e && e.relatedTarget && e.relatedTarget === saveQ) { return; }
                    $inputQ.val(block.q || Messages.form_default);
                    if (!e) { $inputQ.blur(); }
                    $(q).removeClass('editing');
                };
                $inputQ.keydown(function (e) {
                    if (e.which === 13) { return void $saveQ.click(); }
                    if (e.which === 27) { return void onCancelQ(); }
                });
                $inputQ.focus(function () {
                    $(q).addClass('editing');
                });
                $inputQ.blur(onCancelQ);
                q = h('div.cp-form-input-block', [inputQ, saveQ, dragHandle]);

                // Delete question
                var edit;
                var del = h('button.btn.btn-danger', [
                    h('i.fa.fa-trash-o'),
                    h('span', Messages.form_delete)
                ]);
                UI.confirmButton(del, {
                    classes: 'btn-danger',
                    new: true
                }, function () {
                    delete content.form[uid];
                    var idx = content.order.indexOf(uid);
                    content.order.splice(idx, 1);
                    $('.cp-form-block[data-id="'+uid+'"]').remove();
                    framework.localChange();
                });

                // Values
                if (data.edit) {
                    edit = h('button.btn.btn-primary.cp-form-edit-button', [
                        h('i.fa.fa-pencil'),
                        h('span', Messages.form_editBlock)
                    ]);
                    editContainer = h('div');
                    var onSave = function (newOpts) {
                        data.editing = false;
                        if (!newOpts) { // Cancel edit
                            $(editContainer).empty();
                            $(editButtons).show();
                            $(data.tag).show();
                            return;
                        }
                        $(editContainer).empty();
                        block.opts = newOpts;
                        framework.localChange();
                        var $oldTag = $(data.tag);
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            $(editButtons).show();
                            UI.log(Messages.saved);
                            var _answers = getBlockAnswers(APP.answers, uid);
                            data = model.get(newOpts, _answers);
                            if (!data) { data = {}; }
                            $oldTag.before(data.tag).remove();
                        });
                    };
                    var onEdit = function (tmp) {
                        data.editing = true;
                        $(data.tag).hide();
                        $(editContainer).append(data.edit(onSave, tmp));
                        $(editButtons).hide();
                    };
                    $(edit).click(function () {
                        onEdit();
                    });

                    // If we were editing this field, recover our unsaved changes
                    if (temp && temp[uid]) {
                        setTimeout(function () {
                            onEdit(temp[uid]);
                        });
                    }
                }

                editButtons = h('div.cp-form-edit-buttons-container', [
                    edit, del
                ]);
            }
            var editableCls = editable ? ".editable" : "";
            return h('div.cp-form-block'+editableCls, {
                'data-id':uid
            }, [
                q,
                h('div.cp-form-block-content', [
                    data.tag,
                    editButtons
                ]),
                editContainer
            ]);
        });

        $container.empty().append(elements);

        if (editable) {
            Sortable.create($container[0], {
                direction: "vertical",
                filter: "input, button",
                preventOnFilter: false,
                store: {
                    set: function (s) {
                        content.order = s.toArray();
                        framework.localChange();
                    }
                }
            });
            return;
        }

        // In view mode, add "Submit" and "reset" buttons
        $container.append(makeFormControls(framework, content, Boolean(answers)));
    };

    var getTempFields = function () {
        if (!Array.isArray(APP.formBlocks)) { return; }
        var temp = {};
        APP.formBlocks.forEach(function (data) {
            if (data.editing) {
                var cursor = data.getCursor && data.getCursor();
                temp[data.uid] = cursor;
            }
        });
        return temp;
    };

    var andThen = function (framework) {
        framework.start();
        var content = {};

        var sframeChan = framework._.sfCommon.getSframeChannel();
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var user = metadataMgr.getUserData();

        var priv = metadataMgr.getPrivateData();
        APP.isEditor = Boolean(priv.form_public);
        var $body = $('body');

        var $toolbarContainer = $('#cp-toolbar');
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'pad']);
        $toolbarContainer.after(helpMenu.menu);


        var makeFormSettings = function () {
            var makePublic = h('button.btn.btn-primary', Messages.form_makePublic);
            if (content.answers.privateKey) { makePublic = undefined; }
            var publicText = content.answers.privateKey ? Messages.form_isPublic : Messages.form_isPrivate;
            var resultsType = h('div.cp-form-results-type-container', [
                h('span.cp-form-results-type', publicText),
                makePublic
            ]);
            var $makePublic = $(makePublic).click(function () {
                UI.confirm(Messages.form_makePublicWarning, function (yes) {
                    if (!yes) { return; }
                    content.answers.privateKey = priv.form_private;
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                        $makePublic.remove();
                        $(resultsType).find('.cp-form-results-type').text(Messages.form_isPublic);
                    });
                });
            });

            // End date / Closed state
            var endDateContainer = h('div.cp-form-status-container');
            var $endDate = $(endDateContainer);
            var refreshEndDate = function () {
                $endDate.empty();

                var endDate = content.answers.endDate;
                var date = new Date(endDate).toLocaleString();
                var now = +new Date();
                var text = Messages.form_isOpen;
                var buttonTxt = Messages.form_setEnd;
                if (endDate <= now) {
                    text = Messages._getKey('form_isClosed', [date]);
                    buttonTxt = Messages.form_open;
                } else if (endDate > now) {
                    text = Messages._getKey('form_willClose', [date]);
                    buttonTxt = Messages.form_removeEnd;
                }

                var button = h('button.btn.btn-secondary', buttonTxt);

                var $button = $(button).click(function () {
                    $button.attr('disabled', 'disabled');
                    // If there is an end date, remove it
                    if (endDate) {
                        delete content.answers.endDate;
                        framework.localChange();
                        refreshEndDate();
                        return;
                    }
                    // Otherwise add it
                    var datePicker = h('input');
                    var picker = Flatpickr(datePicker, {
                        enableTime: true,
                        time_24hr: is24h,
                        dateFormat: dateFormat,
                        minDate: new Date()
                    });
                    var save = h('button.btn.btn-primary', Messages.settings_save);
                    $(save).click(function () {
                        var d = picker.parseDate(datePicker.value);
                        content.answers.endDate = +d;
                        framework.localChange();
                        refreshEndDate();
                    });
                    var confirmContent = h('div', [
                        h('div', Messages.form_setEnd),
                        h('div.cp-form-input-block', [datePicker, save]),
                    ]);
                    $button.after(confirmContent);
                    $button.remove();
                });

                $endDate.append(h('div.cp-form-status', text));
                $endDate.append(h('div.cp-form-actions', button));

            };
            refreshEndDate();


            var viewResults = h('button.btn.btn-primary', [
                h('span.cp-app-form-button-results', Messages.form_viewResults),
                h('span.cp-app-form-button-creator', Messages.form_viewCreator),
            ]);
            var $v = $(viewResults).click(function () {
                if ($body.hasClass('cp-app-form-results')) {
                    $body.removeClass('cp-app-form-results');
                    return;
                }
                $v.attr('disabled', 'disabled');
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey
                }, function (err, answers) {
                    if (answers) { APP.answers = answers; }
                    $v.removeAttr('disabled');
                    $body.addClass('cp-app-form-results');
                    renderResults(content, answers);
                });

            });
            return [
                endDateContainer,
                resultsType,
                viewResults,
            ];

            // XXX
            // Button to set results as public
            // Checkbox to allow anonymous answers
            // Button to clear all answers?
        };

        var checkIntegrity = function (getter) {
            if (!content.order || !content.form) { return; }
            var changed = false;
            content.order.forEach(function (uid) {
                if (!content.form[uid]) {
                    var idx = content.order.indexOf(uid);
                    content.order.splice(idx, 1);
                    changed = true;
                }
            });
            Object.keys(content.form).forEach(function (uid) {
                var idx = content.order.indexOf(uid);
                if (idx === -1) {
                    changed = true;
                    content.order.push(uid);
                }
            });

            if (!getter && changed) { framework.localChange(); }
        };

        var makeFormCreator = function () {

            var controlContainer;
            if (APP.isEditor) {
                var controls = Object.keys(TYPES).map(function (type) {

                    var btn = h('button.btn', [
                        TYPES[type].icon.cloneNode(),
                        h('span', Messages['form_type_'+type])
                    ]);
                    $(btn).click(function () {
                        var uid = Util.uid();
                        content.form[uid] = {
                            //q: Messages.form_default,
                            //opts: opts
                            type: type,
                        };
                        content.order.push(uid);
                        framework.localChange();
                        updateForm(framework, content, true);
                    });
                    return btn;
                });

                var settings = makeFormSettings();

                controlContainer = h('div.cp-form-creator-control', [
                    h('div.cp-form-creator-settings', settings),
                    h('div.cp-form-creator-types', controls)
                ]);
            }

            var contentContainer = h('div.cp-form-creator-content');
            var resultsContainer = h('div.cp-form-creator-results');
            var div = h('div.cp-form-creator-container', [
                controlContainer,
                contentContainer,
                resultsContainer
            ]);
            return div;
        };

        var endDateEl = h('div.alert.alert-warning.cp-burn-after-reading');
        var endDate;
        var endDateTo;
        var refreshEndDateBanner = function (force) {
            if (APP.isEditor) { return; }
            var _endDate = content.answers.endDate;
            if (_endDate === endDate && !force) { return; }
            endDate = _endDate;
            var date = new Date(endDate).toLocaleString();
            var text = Messages._getKey('form_isClosed', [date]);
            if (endDate > +new Date()) {
                text = Messages._getKey('form_willClose', [date]);
            }
            if ($('.cp-help-container').length && endDate) {
                $(endDateEl).text(text);
                $('.cp-help-container').before(endDateEl);
            } else {
                $(endDateEl).remove();
            }

            APP.isClosed = endDate && endDate < (+new Date());
            clearTimeout(endDateTo);
            if (!APP.isClosed && endDate) {
                setTimeout(function () {
                    refreshEndDateBanner(true);
                    $('.cp-form-send-container').find('.cp-open').remove();
                },(endDate - +new Date() + 100));
            }
        };

        framework.onReady(function () {
            var priv = metadataMgr.getPrivateData();

            if (APP.isEditor) {
                if (!content.form) {
                    content.form = {};
                    framework.localChange();
                }
                if (!content.order) {
                    content.order = [];
                    framework.localChange();
                }
                if (!content.answers || !content.answers.channel || !content.answers.publicKey || !content.answers.validateKey) {
                    content.answers = {
                        channel: Hash.createChannelId(),
                        publicKey: priv.form_public,
                        validateKey: priv.form_answerValidateKey
                    };
                    framework.localChange();
                }
            }

            sframeChan.event('EV_FORM_PIN', {channel: content.answers.channel});

            var $container = $('#cp-app-form-container');
            $container.append(makeFormCreator());

            if (!content.answers || !content.answers.channel || !content.answers.publicKey || !content.answers.validateKey) {
                return void UI.errorLoadingScreen(Messages.form_invalid);
            }
            // XXX fetch answers and
            //  * viewers ==> check if you've already answered and show form (new or edit)
            //  * editors ==> show schema and warn users if existing questions already have answers

            if (priv.form_auditorKey) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey,
                    privateKey: priv.form_auditorKey
                }, function (err, obj) {
                    if (obj) { APP.answers = obj; }
                    $body.addClass('cp-app-form-results');
                    renderResults(content, obj);
                });
                return;
            }

            if (APP.isEditor) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey
                }, function (err, obj) {
                    if (obj) { APP.answers = obj; }
                    checkIntegrity(false);
                    updateForm(framework, content, true);

                });
                return;
            }

            refreshEndDateBanner();

            // If the results are public and there is at least one doodle, fetch the results now
            if (content.answers.privateKey && Object.keys(content.form).some(function (uid) {
                    return content.form[uid].type === "poll";
                })) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey,
                    privateKey: content.answers.privateKey,
                }, function (err, obj) {
                    if (obj) { APP.answers = obj; }
                    checkIntegrity(false);
                    var myAnswers;
                    if (user.curvePublic && obj && obj[user.curvePublic]) { // XXX ANONYMOUS
                        myAnswers = obj[user.curvePublic].msg;
                    }
                    updateForm(framework, content, false, myAnswers);
                });
                return;
            }

            sframeChan.query("Q_FETCH_MY_ANSWERS", {
                channel: content.answers.channel,
                validateKey: content.answers.validateKey,
                publicKey: content.answers.publicKey
            }, function (err, obj) {
                if (obj && obj.error) {
                    UI.warn(Messages.form_cantFindAnswers);
                }
                var answers;
                if (obj && !obj.error) { answers = obj; }
                checkIntegrity(false);
                updateForm(framework, content, false, answers);
            });

        });

        framework.onContentUpdate(function (newContent) {
            console.log(newContent);
            content = newContent;
            refreshEndDateBanner();
            var answers, temp;
            if (!APP.isEditor) { answers = getFormResults(); }
            else { temp = getTempFields(); }
            updateForm(framework, content, APP.isEditor, answers, temp);
        });

        framework.setContentGetter(function () {
            checkIntegrity(true);
            return content;
        });

    };

    Framework.create({
        toolbarContainer: '#cp-toolbar',
        contentContainer: '#cp-app-form-editor',
    }, andThen);
});
