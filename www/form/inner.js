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
    '/common/diffMarked.js',
    '/common/sframe-common-codemirror.js',
    'cm/lib/codemirror',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/lib/datepicker/flatpickr.js',
    '/bower_components/sortablejs/Sortable.min.js',

    'cm/addon/display/placeholder',
    'cm/mode/gfm/gfm',
    'css!cm/lib/codemirror.css',

    'css!/bower_components/codemirror/lib/codemirror.css',
    'css!/bower_components/codemirror/addon/dialog/dialog.css',
    'css!/bower_components/codemirror/addon/fold/foldgutter.css',
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
    DiffMd,
    SFCodeMirror,
    CMeditor,
    Share, Access, Properties,
    Flatpickr,
    Sortable
    )
{
    var APP = window.APP = {
    };

    var is24h = false;
    var dateFormat = "Y-m-d H:i";
    var timeFormat = "H:i";
    try {
        is24h = !new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' }).format(0).match(/AM/);
    } catch (e) {}
    is24h = false;
    if (!is24h) {
        dateFormat = "Y-m-d h:i K";
        timeFormat = "h:i K";
    }

    var MAX_OPTIONS = 15; // XXX
    var MAX_ITEMS = 10; // XXX

    var saveAndCancelOptions = function (getRes, cb) {
        // Cancel changes
        var cancelBlock = h('button.btn.btn-secondary', Messages.cancel);
        $(cancelBlock).click(function () { cb(); });

        // Save changes
        var saveBlock = h('button.btn.btn-primary', [
            h('i.fa.fa-floppy-o'),
            h('span', Messages.settings_save)
        ]);

        $(saveBlock).click(function () {
            $(saveBlock).attr('disabled', 'disabled');
            cb(getRes());
        });

        return h('div.cp-form-edit-save', [cancelBlock, saveBlock]);
    };
    var editTextOptions = function (opts, setCursorGetter, cb, tmp) {
        if (tmp && tmp.content && Sortify(opts) === Sortify(tmp.old)) {
            opts = tmp.content;
        }

        var maxLength, getLengthVal;
        if (opts.maxLength) {
            var lengthInput = h('input', {
                type:"number",
                value: opts.maxLength,
                min: 100,
                max: 5000
            });
            maxLength = h('div.cp-form-edit-max-options', [
                h('span', Messages.form_editMaxLength),
                lengthInput
            ]);
            getLengthVal = function () {
                var val = Number($(lengthInput).val()) || 1000;
                if (val < 1) { val = 1; }
                if (val > 5000) { val = 5000; }
                return val;
            };

            var $l = $(lengthInput).on('input', Util.throttle(function () {
                $l.val(getLengthVal());
            }, 500));

        }

        var type, typeSelect;
        if (opts.type) {
            // Messages.form_text_text.form_text_number.form_text_url.form_text_email
            var options = ['text', 'number', 'url', 'email'].map(function (t) {
                return {
                    tag: 'a',
                    attributes: {
                        'class': 'cp-form-type-value',
                        'data-value': t,
                        'href': '#',
                    },
                    content: Messages['form_text_'+t]
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
            typeSelect.setValue(opts.type);

            type = h('div.cp-form-edit-type', [
                h('span', Messages.form_textType),
                typeSelect[0]
            ]);
        }

        setCursorGetter(function () {
            return {
                old: (tmp && tmp.old) || opts,
                content: {
                    maxLength: getLengthVal ? getLengthVal() : undefined,
                    type: typeSelect ? typeSelect.getValue() : undefined
                }
            };
        });

        var getSaveRes = function () {
            return {
                maxLength: getLengthVal ? getLengthVal() : undefined,
                type: typeSelect ? typeSelect.getValue() : undefined
            };
        };
        var saveAndCancel = saveAndCancelOptions(getSaveRes, cb);

        return [
            maxLength,
            type,
            saveAndCancel
        ];
    };
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
            // Messages.form_poll_text.form_poll_day.form_poll_time
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
        var addMultiple;
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
                        defaultDate: val ? new Date(val) : undefined
                    });
                } else if (v.type === 'day') {
                    /*Flatpickr(input, {
                        defaultDate: val ? new Date(val) : undefined
                    });*/
                }
            }

            // if this element was active before the remote change, restore cursor
            var setCursor = function () {
                if (v.type && v.type !== 'text') { return; }
                input.selectionStart = cursor.start || 0;
                input.selectionEnd = cursor.end || 0;
                setTimeout(function () { input.focus(); });
            };
            if (isItem) {
                if (cursor && cursor.uid === uid && cursor.item) { setCursor(); }
            } else {
                if (cursor && cursor.el === val && !cursor.item) { setCursor(); }
            }

            var del = h('button.btn.btn-danger-outline', h('i.fa.fa-times'));
            var el = h('div.cp-form-edit-block-input', [
                h('span.cp-form-handle', [
                    h('i.fa.fa-ellipsis-v'),
                    h('i.fa.fa-ellipsis-v'),
                ]),
                input,
                del
            ]);
            $(del).click(function () {
                $(el).remove();
                // We've just deleted an item/option so we should be under the MAX limit and
                // we can show the "add" button again
                if (isItem && $addItem) { $addItem.show(); }
                if (!isItem && $add) {
                    $add.show();
                    if (v.type === "time") { $(addMultiple).show(); }
                }
            });
            return el;
        };
        var inputs = v.values.map(function (val) { return getOption(val, false); });
        inputs.push(add);

        var container = h('div.cp-form-edit-block', inputs);
        var $container = $(container);

        Sortable.create(container, {
            direction: "vertical",
            handle: ".cp-form-handle",
            draggable: ".cp-form-edit-block-input",
            forceFallback: true,
        });

        var containerItems;
        if (v.items) {
            var inputsItems = v.items.map(function (itemData) {
                return getOption(itemData.v, true, itemData.uid);
            });
            inputsItems.push(addItem);
            containerItems = h('div.cp-form-edit-block', inputsItems);
            Sortable.create(containerItems, {
                direction: "vertical",
                handle: ".cp-form-handle",
                draggable: ".cp-form-edit-block-input",
                forceFallback: true,
            });
        }

        // Calendar...
        var calendarView;
        if (v.type) {
            var calendarInput = h('input');
            calendarView = h('div', calendarInput);
            var calendarDefault = v.type === "day" ? v.values.map(function (time) {
                if (!time) { return; }
                var d = new Date(time);
                if (!isNaN(d)) { return d; }
            }).filter(Boolean) : undefined;
            Flatpickr(calendarInput, {
                mode: 'multiple',
                inline: true,
                defaultDate: calendarDefault,
                appendTo: calendarView
            });
        }

        // Calendar time
        if (v.type) {
            var multipleInput = h('input', {placeholder: Messages.form_addMultipleHint});
            var multipleClearButton = h('button.btn', Messages.form_clear);
            var addMultipleButton = h('button.btn', [
                h('i.fa.fa-plus'),
                h('span', Messages.form_addMultiple)
            ]);
            addMultiple = h('div.cp-form-multiple-picker', { style: "display: none;" }, [
                multipleInput,
                addMultipleButton,
                multipleClearButton
            ]);
            var multiplePickr = Flatpickr(multipleInput, {
                mode: 'multiple',
                enableTime: true,
                dateFormat: dateFormat,
            });
            $(multipleClearButton).click(function () {
                multiplePickr.clear();
            });
            $(addMultipleButton).click(function () {
                multiplePickr.selectedDates.some(function (date) {
                    $add.before(getOption(date, false));
                    var l = $container.find('input').length;
                    $(maxInput).attr('max', l);
                    if (l >= MAX_OPTIONS) {
                        $add.hide();
                        $(addMultiple).hide();
                        return true;
                    }
                });
                multiplePickr.clear();
            });
        }

        var refreshView = function () {
            if (!v.type) { return; }
            var $calendar = $(calendarView);
            if (v.type !== "day") {
                $calendar.hide();
                $container.show();
                var l = $container.find('input').length;
                if (v.type === "time" && l < MAX_OPTIONS) {
                    $(addMultiple).show();
                } else {
                    $(addMultiple).hide();
                }
            } else {
                $(addMultiple).hide();
                $calendar.show();
                $container.hide();
            }
        };
        refreshView();

        // Doodle type change: empty current values and change input types?
        if (typeSelect) {
            typeSelect.onChange.reg(function (prettyVal, val) {
                v.type = val;
                refreshView();
                if (val !== "text") {
                    $container.find('.cp-form-edit-block-input').remove();
                    $(add).click();
                    return;
                }
                $container.find('input').each(function (i, input) {
                    if (input._flatpickr) {
                        input._flatpickr.destroy();
                        delete input._flatpickr;
                    }
                });
            });
        }

        // "Add option" button handler
        $add = $(add).click(function () {
            var txt = v.type ? '' : Messages.form_newOption;
            $add.before(getOption(txt, false));
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
            if (v.type === "day") {
                var dayPickr = $(calendarView).find('input')[0]._flatpickr;
                values = dayPickr.selectedDates.map(function (date) {
                    return +date;
                });
            }
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

        var getSaveRes = function () {
            // Get values
            var values = [];
            var duplicates = false;
            if (v.type === "day") {
                var dayPickr = $(calendarView).find('input')[0]._flatpickr;
                values = dayPickr.selectedDates.map(function (date) {
                    return +date;
                });
            } else {
                $container.find('input').each(function (i, el) {
                    var val = $(el).val().trim();
                    if (v.type === "day" || v.type === "time") {
                        var f = el._flatpickr;
                        if (f && f.selectedDates && f.selectedDates.length) {
                            val = +f.selectedDates[0];
                        }
                    }
                    if (val && values.indexOf(val) === -1) { values.push(val); }
                    else { duplicates = true; }
                });
            }
            values = values.filter(Boolean); // Block empty or undeinfed options
            if (!values.length) {
                return void UI.warn(Messages.error);
            }
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

            return res;
        };

        var saveAndCancel = saveAndCancelOptions(getSaveRes, cb);

        return [
            type,
            maxOptions,
            calendarView,
            h('div.cp-form-edit-options-block', [containerItems, container]),
            addMultiple,
            saveAndCancel
        ];
    };

    var makePollTable = function (answers, opts) {
        // Sort date values
        if (opts.type !== "text") {
            opts.values.sort(function (a, b) {
                return +new Date(a) - +new Date(b);
            });
        }
        // Create first line with options
        var els = opts.values.map(function (data) {
            if (opts.type === "day") {
                var _date = new Date(data);
                data = _date.toLocaleDateString();
            }
            if (opts.type === "time") {
                var _dateT = new Date(data);
                data = Flatpickr.formatDate(_dateT, timeFormat);
            }
            return h('div.cp-poll-cell.cp-form-poll-option', {
                title: Util.fixHTML(data)
            }, data);
        });
        // Insert axis switch button
        var switchAxis = h('button.btn.btn-default', [
            Messages.form_poll_switch,
            h('i.fa.fa-exchange'),
        ]);
        els.unshift(h('div.cp-poll-cell.cp-poll-switch', switchAxis));
        var lines = [h('div', els)];

        // Add an initial row to "time" values containing the days
        if (opts.type === "time") {
            var days = [h('div.cp-poll-cell')];
            var _days = {};
            opts.values.forEach(function (d) {
                var date = new Date(d);
                var day = date.toLocaleDateString();
                _days[day] = _days[day] || 0;
                _days[day]++;
            });
            Object.keys(_days).forEach(function (day) {
                days.push(h('div.cp-poll-cell.cp-poll-time-day', {
                    style: 'flex-grow:'+(_days[day]-1)+';'
                }, day));
            });
            lines.unshift(h('div', days));
        }

        // Add answers
        var bodyEls = [];
        if (Array.isArray(answers)) {
            answers.forEach(function (answerObj) {
                var answer = answerObj.results;
                if (!answer || !answer.values) { return; }
                var name = Util.find(answerObj, ['user', 'name']) || answer.name || Messages.anonymous;
                var avatar = h('span.cp-avatar');
                APP.common.displayAvatar($(avatar), Util.find(answerObj, ['user', 'avatar']), name);
                var values = answer.values || {};
                var els = opts.values.map(function (data) {
                    var res = values[data] || 0;
                    var v = (Number(res) === 1) ? h('i.fa.fa-check.cp-yes') : undefined;
                    var cell = h('div.cp-poll-cell.cp-form-poll-answer', {
                        'data-value': res
                    }, v);
                    return cell;
                });
                els.unshift(h('div.cp-poll-cell.cp-poll-answer-name', {
                    title: Util.fixHTML(name)
                }, [
                    avatar,
                    h('span', name)
                ]));
                bodyEls.push(h('div', els));
            });
        }
        var body = h('div.cp-form-poll-body', bodyEls);
        lines.push(body);

        var $s = $(switchAxis).click(function () {
            $s.closest('.cp-form-type-poll').toggleClass('cp-form-poll-switch');
        });

        return lines;
    };
    var makePollTotal = function (answers, opts, myLine, evOnChange) {
        if (!Array.isArray(answers)) { return; }
        var totals = {};
        var myTotals = {};
        var updateMyTotals = function () {
            if (!myLine) { return; }
            opts.values.forEach(function (data) {
                myLine.some(function (el) {
                    if ($(el).data('option') !== data) { return; }
                    var res = Number($(el).attr('data-value')) || 0;
                    if (res === 1) {
                        myTotals[data] = {
                            y: 1,
                            m: 0
                        };
                    }
                    else if (res === 2) {
                        myTotals[data] = {
                            y: 0,
                            m: 1
                        };
                    } else {
                        delete myTotals[data];
                    }
                    return true;
                });

            });
        };
        var totalEls = opts.values.map(function (data) {
            var y = 0; // Yes
            var m = 0; // Maybe
            answers.forEach(function (answerObj) {
                var answer = answerObj.results;
                if (!answer || !answer.values) { return; }
                var values = answer.values || {};
                var res = Number(values[data]) || 0;
                if (res === 1) { y++; }
                else if (res === 2) { m++; }
            });
            totals[data] = {
                y: y,
                m: m
            };

            return h('div.cp-poll-cell', {
                'data-id': data
            }, [
                h('span.cp-form-total-yes', y),
                h('span.cp-form-total-maybe', '('+m+')'),
            ]);
        });

        totalEls.unshift(h('div.cp-poll-cell', Messages.form_pollTotal));
        var total = h('div.cp-poll-total', totalEls);
        var $total = $(total);
        var refreshBest = function () {
            var totalMax = {
                value: 0,
                data: []
            };
            Object.keys(totals).forEach(function (k) {
                var obj = Util.clone(totals[k]);
                if (myTotals[k]) {
                    obj.y += myTotals[k].y || 0;
                    obj.m += myTotals[k].m || 0;
                }
                if (obj.y === totalMax.value) {
                    totalMax.data.push(k);
                } else if (obj.y > totalMax.value) {
                    totalMax.value = obj.y;
                    totalMax.data = [k];
                }
            });
            if (totalMax.value) {
                $total.find('[data-id]').removeClass('cp-poll-best');
                totalMax.data.forEach(function (k) {
                    $total.find('[data-id="'+k+'"]').addClass('cp-poll-best');
                });
            }
        };
        refreshBest();

        if (myLine && evOnChange) {
            var updateValues = function () {
                totalEls.forEach(function (cell) {
                    var $c = $(cell);
                    var data = $c.attr('data-id');
                    if (!data) { return; }
                    var y = totals[data].y + ((myTotals[data] || {}).y || 0);
                    var m = totals[data].m + ((myTotals[data] || {}).m || 0);
                    $c.find('.cp-form-total-yes').text(y);
                    $c.find('.cp-form-total-maybe').text('('+m+')');
                });
            };
            evOnChange.reg(function () {
                updateMyTotals();
                updateValues();
                refreshBest();
            });
        }


        return total;
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
        if (!answers) { return; }
        return Object.keys(answers || {}).map(function (user) {
            if (filterCurve && user === filterCurve) { return; }
            try {
                return {
                    user: answers[user].msg._userdata,
                    results: answers[user].msg[uid]
                };
            } catch (e) { console.error(e); }
        }).filter(Boolean);
    };

    var STATIC_TYPES = {
        md: {
            defaultOpts: {
                text: Messages.form_description_default
            },
            get: function (opts) {
                if (!opts) { opts = STATIC_TYPES.md.defaultOpts; }
                var tag = h('div', {
                    id: 'form'+Util.uid()
                }, opts.text);
                var $tag = $(tag);
                DiffMd.apply(DiffMd.render(opts.text || ''), $tag, APP.common);
                var cursorGetter;
                return {
                    tag: tag,
                    edit: function (cb, tmp) {
                        var t = h('textarea');
                        var block = h('div.cp-form-edit-options-block', [t]);
                        var cm = SFCodeMirror.create("gfm", CMeditor, t);
                        var editor = cm.editor;
                        editor.setOption('lineNumbers', true);
                        editor.setOption('lineWrapping', true);
                        editor.setOption('styleActiveLine', true);
                        editor.setOption('readOnly', false);

                        var text = opts.text;
                        var cursor;
                        if (tmp && tmp.content && tmp.old.text === text) {
                            text = tmp.content.text;
                            cursor = tmp.cursor;
                        }

                        setTimeout(function () {
                            editor.setValue(text);
                            if (cursor) {
                                if (Sortify(cursor.start) === Sortify(cursor.end)) {
                                    editor.setCursor(cursor.start);
                                } else {
                                    editor.setSelection(cursor.start, cursor.end);
                                }
                            }
                            editor.refresh();
                            editor.save();
                            editor.focus();
                        });
                        if (APP.common) {
                            var markdownTb = APP.common.createMarkdownToolbar(editor, {
                                embed: function (mt) {
                                    editor.focus();
                                    editor.replaceSelection($(mt)[0].outerHTML);
                                }
                            });
                            $(block).prepend(markdownTb.toolbar);
                            $(markdownTb.toolbar).show();
                            cm.configureTheme(APP.common, function () {});
                        }
                        // Cancel changes
                        var cancelBlock = h('button.btn.btn-secondary', Messages.cancel);
                        $(cancelBlock).click(function () {
                            cb();
                        });
                        // Save changes
                        var saveBlock = h('button.btn.btn-primary', [
                            h('i.fa.fa-floppy-o'),
                            h('span', Messages.settings_save)
                        ]);

                        var getContent = function () {
                            return {
                                text: editor.getValue()
                            };
                        };
                        $(saveBlock).click(function () {
                            $(saveBlock).attr('disabled', 'disabled');
                            cb(getContent());
                        });

                        cursorGetter = function () {
                            if (document.activeElement && block.contains(document.activeElement)) {
                                cursor = {
                                    start: editor.getCursor('from'),
                                    end: editor.getCursor('to')
                                };
                            }
                            return {
                                old: opts,
                                content: getContent(),
                                cursor: cursor
                            };
                        };

                        return [
                            block,
                            h('div.cp-form-edit-save', [cancelBlock, saveBlock])
                        ];
                    },
                    getCursor: function () { return cursorGetter(); },
                };
            },
            printResults: function () { return; },
            icon: h('i.cptools.cptools-form-paragraph')
        },
        page: {
            get: function () {
                var tag = h('div.cp-form-page-break-edit', [
                    h('i.cptools.cptools-form-page-break'),
                    h('span', Messages.form_type_page)
                ]);
                return {
                    tag: tag,
                    pageBreak: true
                };
            },
            printResults: function () { return; },
            icon: h('i.cptools.cptools-form-page-break')
        },
    };

    var TYPES = {
        input: {
            defaultOpts: {
                type: 'text'
            },
            get: function (opts, a, n, evOnChange) {
                if (!opts) { opts = TYPES.input.defaultOpts; }
                // Messages.form_input_ph_email.form_input_ph_url
                var tag = h('input', {
                    type: opts.type,
                    placeholder: Messages['form_input_ph_'+opts.type] || ''
                });
                var $tag = $(tag);
                $tag.on('change keypress', Util.throttle(function () {
                    evOnChange.fire();
                }, 500));
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        //var invalid = $tag.is(':invalid');
                        //if (invalid) { return; }
                        return $tag.val();
                    },
                    setValue: function (val) { $tag.val(val); },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editTextOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
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
            icon: h('i.cptools.cptools-form-text')
        },
        textarea: {
            defaultOpts: {
                maxLength: 1000
            },
            get: function (opts, a, n, evOnChange) {
                if (!opts) { opts = TYPES.textarea.defaultOpts; }
                var text = h('textarea', {maxlength: opts.maxLength});
                var $text = $(text);
                var charCount = h('div.cp-form-type-textarea-charcount');
                var updateChar = function () {
                    var l = $text.val().length;
                    if (l > opts.maxLength) {
                        $text.val($text.val().slice(0, opts.maxLength));
                        l = $text.val().length;
                    }
                    $(charCount).text(Messages._getKey('form_maxLength', [
                        $text.val().length,
                        opts.maxLength
                    ]));
                };
                updateChar();
                var tag = h('div.cp-form-type-textarea', [
                    text,
                    charCount
                ]);

                var evChange = Util.throttle(function () {
                    evOnChange.fire();
                }, 500);

                $text.on('change keypress keyup keydown', function () {
                    setTimeout(updateChar);
                    evChange();
                });
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () { return $text.val().slice(0, opts.maxLength); },
                    setValue: function (val) {
                        $text.val(val);
                        updateChar();
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editTextOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    reset: function () { $text.val(''); }
                };
            },
            printResults: function (answers, uid) {
                var results = [];
                var empty = 0;
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !answer.trim()) { return empty++; }
                    results.push(h('div.cp-form-results-type-textarea-data', answer));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-text', results);
            },
            icon: h('i.cptools.cptools-form-paragraph')
        },
        radio: {
            defaultOpts: {
                values: [1,2].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts, a, n, evOnChange) {
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
                $(tag).find('input[type="radio"]').on('change', function () {
                    evOnChange.fire();
                });
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
            icon: h('i.cptools.cptools-form-list-radio')
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
            get: function (opts, a, n, evOnChange) {
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
                $(tag).find('input[type="radio"]').on('change', function () {
                    evOnChange.fire();
                });
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
                var opts = structure.opts || TYPES.multiradio.defaultOpts;
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
                    var q = findItem(opts.items, q_uid);
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
            icon: h('i.cptools.cptools-form-grid-radio')
        },
        checkbox: {
            defaultOpts: {
                max: 3,
                values: [1, 2, 3].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts, a, n, evOnChange) {
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
                    evOnChange.fire();
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
            icon: h('i.cptools.cptools-form-list-check')
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
            get: function (opts, a, n, evOnChange) {
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
                        evOnChange.fire();
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
                var opts = structure.opts || TYPES.multicheck.defaultOpts;
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
                    var q = findItem(opts.items, q_uid);
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
            icon: h('i.cptools.cptools-form-grid-check')
        },
        sort: {
            defaultOpts: {
                values: [1,2].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts, a, n, evOnChange) {
                if (!opts) { opts = TYPES.sort.defaultOpts; }
                if (!Array.isArray(opts.values)) { return; }
                var map = {};
                var invMap = {};
                var els = opts.values.map(function (data, i) {
                    var uid = Util.uid();
                    map[uid] = data;
                    invMap[data] = uid;
                    var div = h('div.cp-form-type-sort', {'data-id': uid}, [
                        h('span.cp-form-handle', [
                            h('i.fa.fa-ellipsis-v'),
                            h('i.fa.fa-ellipsis-v'),
                        ]),
                        h('span.cp-form-sort-order', (i+1)),
                        h('span', data)
                    ]);
                    $(div).data('val', data);
                    return div;
                });
                var tag = h('div.cp-form-type-sort-container', [
                    h('div.cp-form-sort-hint', Messages._getKey('form_sort_hint', [els.length])),
                    els
                ]);
                var $tag = $(tag);
                var reorder = function () {
                    $tag.find('.cp-form-type-sort').each(function (i, el) {
                        $(el).find('.cp-form-sort-order').text(i+1);
                    });
                };
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };

                var sortable = Sortable.create(tag, {
                    direction: "vertical",
                    draggable: ".cp-form-type-sort",
                    forceFallback: true,
                    store: {
                        set: function () {
                            evOnChange.fire();
                            reorder();
                        }
                    }
                });

                $(tag).find('input[type="radio"]').on('change', function () {
                    evOnChange.fire();
                });
                return {
                    tag: tag,
                    getValue: function () {
                        return sortable.toArray().map(function (id) {
                            return map[id];
                        });
                    },
                    reset: function () {
                        var toSort = (opts.values).map(function (val) {
                            return invMap[val];
                        });
                        sortable.sort(toSort);
                        reorder();
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        var toSort = (val || []).map(function (val) {
                            return invMap[val];
                        });
                        sortable.sort(toSort);
                        reorder();
                    }
                };

            },
            printResults: function (answers, uid, form) {
                var opts = form[uid].opts || TYPES.sort.defaultOpts;
                var l = (opts.values || []).length;
                var results = [];
                var empty = 0;
                var count = {};
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!Array.isArray(answer) || !answer.length) { return empty++; }
                    answer.forEach(function (el, i) {
                        var score = l - i;
                        count[el] = (count[el] || 0) + score;
                    });
                });
                var sorted = Object.keys(count).sort(function (a, b) {
                    return count[b] - count[a];
                });
                sorted.forEach(function (value) {
                    results.push(h('div.cp-form-results-type-radio-data', [
                        h('span.cp-value', value),
                        h('span.cp-count', count[value])
                    ]));
                });
                results.push(getEmpty(empty));

                return h('div.cp-form-results-type-radio', results);
            },
            icon: h('i.cptools.cptools-form-list-ordered')
        },
        poll: {
            defaultOpts: {
                type: 'text', // Text or Days or Time
                values: [1, 2, 3].map(function (i) {
                    return Messages._getKey('form_defaultOption', [i]);
                })
            },
            get: function (opts, answers, username, evOnChange) {
                if (!opts) { opts = TYPES.poll.defaultOpts; }
                if (!Array.isArray(opts.values)) { return; }

                var lines = makePollTable(answers, opts);

                // Add form
                var addLine = opts.values.map(function (data) {
                    var cell = h('div.cp-poll-cell.cp-form-poll-choice', [
                        h('i.fa.fa-times.cp-no'),
                        h('i.fa.fa-check.cp-yes'),
                        h('i.cptools.cptools-form-poll-maybe.cp-maybe'),
                    ]);
                    var $c = $(cell);
                    $c.data('option', data);
                    var val = 0;
                    $c.attr('data-value', val);
                    $c.click(function () {
                        val = (val+1)%3;
                        $c.attr('data-value', val);
                        evOnChange.fire();
                    });
                    cell._setValue = function (v) {
                        val = v;
                        $c.attr('data-value', val);
                    };
                    return cell;
                });
                // Name input
                //var nameInput = h('input', { value: username || Messages.anonymous });
                var nameInput = h('span.cp-poll-your-answers', Messages.form_pollYourAnswers);
                addLine.unshift(h('div.cp-poll-cell', nameInput));
                lines.push(h('div', addLine));

                var total = makePollTotal(answers, opts, addLine, evOnChange);
                if (total) { lines.push(h('div', total)); }

                var pollHint = UI.setHTML(h('div.cp-form-poll-hint'), Messages.form_poll_hint);
                var classes = [
                    'fa fa-check cp-yes',
                    'fa fa-times cp-no',
                    'cptools cptools-form-poll-maybe cp-maybe',
                ];
                $(pollHint).find('i').each(function (index) {
                    this.setAttribute('class', classes[index]);
                });

                var tag = h('div.cp-form-type-poll-container', [
                    pollHint,
                    h('div.cp-form-type-poll', lines)
                ]);
                var $tag = $(tag);

                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    getValue: function () {
                        var res = {};
                        $tag.find('.cp-form-poll-choice').each(function (i, el) {
                            var $el = $(el);
                            res[$el.data('option')] = $el.attr('data-value');
                        });
                        return {
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
                        if (!res || !res.values) { return; }
                        var val = res.values;
                        $tag.find('.cp-form-poll-choice').each(function (i, el) {
                            if (!el._setValue) { return; }
                            var $el = $(el);
                            el._setValue(val[$el.data('option')] || 0);
                        });
                    }
                };

            },
            printResults: function (answers, uid, form) {
                var opts = form[uid].opts || TYPES.poll.defaultOpts;
                var _answers = getBlockAnswers(answers, uid);
                var lines = makePollTable(_answers, opts);

                var total = makePollTotal(_answers, opts);
                if (total) { lines.push(h('div', total)); }

                return h('div.cp-form-type-poll', lines);
            },
            icon: h('i.cptools.cptools-form-poll')
        },
    };

    var renderResults = function (content, answers) {
        var $container = $('div.cp-form-creator-results').empty();

        if (!Object.keys(answers || {}).length) {
            $container.append(h('div.alert.alert-info', Messages.form_results_empty));
            return;
        }

        var controls = h('div.cp-form-creator-results-controls');
        var $controls = $(controls).appendTo($container);
        var results = h('div.cp-form-creator-results-content');
        var $results = $(results).appendTo($container);


        var summary = true;
        var form = content.form;

        var switchMode = h('button.btn.btn-primary', Messages.form_showIndividual);
        $controls.hide().append(switchMode);

        var show = function (answers, header) {
            var elements = content.order.map(function (uid) {
                var block = form[uid];
                var type = block.type;
                var model = TYPES[type];
                if (!model || !model.printResults) { return; }
                var print = model.printResults(answers, uid, form);

                var q = h('div.cp-form-block-question', block.q || Messages.form_default);

//Messages.form_type_checkbox.form_type_input.form_type_md.form_type_multicheck.form_type_multiradio.form_type_poll.form_type_radio.form_type_sort.form_type_textarea
                return h('div.cp-form-block', [
                    h('div.cp-form-block-type', [
                        TYPES[type].icon.cloneNode(),
                        h('span', Messages['form_type_'+type])
                    ]),
                    q,
                    h('div.cp-form-block-content', print),
                ]);
            });
            $results.empty().append(elements);
            if (header) { $results.prepend(header); }
        };
        show(answers);

        if (APP.isEditor || APP.isAuditor) { $controls.show(); }

        var $s = $(switchMode).click(function () {
            $results.empty();
            if (!summary) {
                $s.text(Messages.form_showIndividual);
                summary = true;
                show(answers);
                return;
            }
            summary = false;
            $s.text(Messages.form_showSummary);

            var origin, priv;
            if (APP.common) {
                var metadataMgr = APP.common.getMetadataMgr();
                priv = metadataMgr.getPrivateData();
                origin = priv.origin;
            }
            var getHref = function (hash) {
                if (APP.common) {
                    return origin + Hash.hashToHref(hash, 'profile');
                }
                return '#';
            };

            var els = Object.keys(answers).map(function (curve) {
                var obj = answers[curve];
                var answer = obj.msg;
                var date = new Date(obj.time).toLocaleString();
                var text, warning, badge;
                if (!answer._userdata || !answer._userdata.name) {
                    text = Messages._getKey('form_answerAnonymous', [date]);
                } else {
                    var ud = answer._userdata;
                    var user;
                    if (ud.profile) {
                        if (priv && priv.friends[curve]) {
                            badge = h('span.cp-form-friend', [
                                h('i.fa.fa-address-book'),
                                Messages._getKey('isContact', [ud.name || Messages.anonymous])
                            ]);
                        }
                        user = h('a', {
                            href: getHref(ud.profile) // Only used visually
                        }, Util.fixHTML(ud.name || Messages.anonymous));
                        if (curve !== ud.curvePublic) {
                            warning = h('span.cp-form-warning', Messages.form_answerWarning);
                        }
                    } else {
                        user = h('b', Util.fixHTML(ud.name || Messages.anonymous));
                    }
                    text = Messages._getKey('form_answerName', [user.outerHTML, date]);
                }
                var span = UI.setHTML(h('span'), text);
                var viewButton = h('button.btn.btn-secondary.small', Messages.form_viewButton);
                var div = h('div.cp-form-individual', [span, viewButton, warning, badge]);
                $(viewButton).click(function () {
                    var res = {};
                    res[curve] = obj;
                    var back = h('button.btn.btn-secondary.small', Messages.form_backButton);
                    $(back).click(function () {
                        summary = true;
                        $s.click();
                    });
                    var header = h('div.cp-form-individual', [
                        span.cloneNode(true),
                        back
                    ]);
                    show(res, header);
                });
                $(div).find('a').click(function (e) {
                    e.preventDefault();
                    APP.common.openURL(Hash.hashToHref(ud.profile, 'profile'));
                });
                return div;
            });
            $results.append(els);
        });
    };

    var addResultsButton = function (framework, content) {
        var $res = $(h('button.cp-toolbar-appmenu', [
            h('i.fa.fa-bar-chart'),
            h('span.cp-button-name', Messages.form_results)
        ]));
        $res.click(function () {
            $res.attr('disabled', 'disabled');
            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                var answers = obj && obj.results;
                if (answers) { APP.answers = answers; }
                $res.removeAttr('disabled');
                $('body').addClass('cp-app-form-results');
                renderResults(content, answers);
                $res.remove();
                var $editor = $(h('button.cp-toolbar-appmenu', [
                    h('i.fa.fa-pencil'),
                    h('span.cp-button-name', APP.isEditor ? Messages.form_editor : Messages.form_form)
                ]));
                $editor.click(function () {
                    $('body').removeClass('cp-app-form-results');
                    $editor.remove();
                    addResultsButton(framework, content);
                });
                framework._.toolbar.$bottomL.append($editor);
            });

        });
        framework._.toolbar.$bottomL.append($res);
    };

    var getFormResults = function () {
        if (!Array.isArray(APP.formBlocks)) { return; }
        var results = {};
        APP.formBlocks.forEach(function (data) {
            if (!data.getValue) { return; }
            results[data.uid] = data.getValue();
        });
        return results;
    };
    var makeFormControls = function (framework, content, update, evOnChange) {
        var loggedIn = framework._.sfCommon.isLoggedIn();
        var metadataMgr = framework._.cpNfInner.metadataMgr;

        if (!loggedIn && !content.answers.anonymous) { return; }

        var cbox;
        cbox = UI.createCheckbox('cp-form-anonymous',
                   Messages.form_anonymousBox, true, { mark: { tabindex:1 } });
        if (loggedIn) {
            if (!content.answers.anonymous || APP.cantAnon) {
                $(cbox).hide().find('input').attr('disabled', 'disabled').prop('checked', false);
            }
        }

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

            var user = metadataMgr.getUserData();
            if (!Util.isChecked($(cbox).find('input'))) {
                results._userdata = loggedIn ? {
                    avatar: user.avatar,
                    name: user.name,
                    notifications: user.notifications,
                    curvePublic: user.curvePublic,
                    profile: user.profile
                } : { name: user.name };
            }

            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query('Q_FORM_SUBMIT', {
                mailbox: content.answers,
                results: results,
                anonymous: !loggedIn || Util.isChecked($(cbox).find('input'))
            }, function (err, data) {
                $send.attr('disabled', 'disabled');
                if (err || (data && data.error)) {
                    if (data.error === "EANSWERED") {
                        return void UI.warn(Messages.form_answered);
                    }
                    console.error(err || data.error);
                    return void UI.warn(Messages.error);
                }
                evOnChange.fire(false, true);
                window.onbeforeunload = undefined;
                if (!update && content.answers.privateKey) {
                    // Add results button
                    addResultsButton(framework, content);
                }
                $send.removeAttr('disabled');
                UI.alert(Messages.form_sent);
                $send.text(Messages.form_update);
            });
        });

        if (APP.isClosed) {
            send = undefined;
            reset = undefined;
        }

        var invalid = h('div.cp-form-invalid-warning');
        var $invalid = $(invalid);
        if (evOnChange) {
            var origin, priv;
            if (APP.common) {
                priv = metadataMgr.getPrivateData();
                origin = priv.origin;
            }
            evOnChange.reg(function () {
                var $container = $('div.cp-form-creator-content');
                var $inputs = $container.find('input:invalid');
                if (!$inputs.length) {
                    $send.text(update ? Messages.form_update : Messages.form_submit);
                    return void $invalid.empty();
                }
                $send.text(update ? Messages.form_updateWarning : Messages.form_submitWarning);
                var lis = [];
                $inputs.each(function (i, el) {
                    var $el = $(el).closest('.cp-form-block');
                    var number = $el.find('.cp-form-block-question-number').text();
                    var a = h('a', {
                        href: origin + '#' + Messages._getKey('form_invalidQuestion', [number])
                    }, Messages._getKey('form_invalidQuestion', [number]));
                    $(a).click(function (e) {
                        e.preventDefault();
                        if (!$el.is(':visible')) {
                            var pages = $el.closest('.cp-form-page').index();
                            if (APP.refreshPage) { APP.refreshPage(pages + 1); }
                        }
                        $el[0].scrollIntoView();
                    });
                    var li = h('li', a);
                    lis.push(li);
                });
                var list = h('ul', lis);
                var content = [
                    h('span', Messages.form_invalidWarning),
                    list
                ];
                $invalid.empty().append(content);
            });
            evOnChange.fire(true);
        }

        return h('div.cp-form-send-container', [
            invalid,
            cbox ? h('div.cp-form-anon-answer', cbox) : undefined,
            reset, send
        ]);
    };
    var updateForm = function (framework, content, editable, answers, temp) {
        var $container = $('div.cp-form-creator-content');
        if (!$container.length) { return; } // Not ready

        var form = content.form;

        APP.formBlocks = [];

        var evOnChange = Util.mkEvent();
        if (!APP.isEditor) {
            var _answers = Util.clone(answers || {});
            delete _answers._proof;
            delete _answers._userdata;
            evOnChange.reg(function (noBeforeUnload, isSave) {
                if (noBeforeUnload) { return; }
                var results = getFormResults();
                if (isSave) {
                    answers = Util.clone(results || {});
                    _answers = Util.clone(answers);
                }
                if (!answers || Sortify(_answers) !== Sortify(results)) {
                    window.onbeforeunload = function () {
                        return true;
                    };
                } else {
                    window.onbeforeunload = undefined;
                }
            });
        }


        var getFormCreator = function (uid) {
            if (!APP.isEditor) { return; }
            var full = !uid;
            var idx = content.order.indexOf(uid);
            var addControl = function (type) {
                var btn = h('button.btn.btn-secondary', {
                    title: full ? '' : Messages['form_type_'+type]
                }, [
                    (TYPES[type] || STATIC_TYPES[type]).icon.cloneNode(),
                    full ? h('span', Messages['form_type_'+type]) : undefined
                ]);
                $(btn).click(function () {
                    var uid = Util.uid();
                    content.form[uid] = {
                        //q: Messages.form_default,
                        //opts: opts
                        type: type,
                    };
                    if (full) {
                        content.order.push(uid);
                    } else {
                        content.order.splice(idx, 0, uid);
                    }
                    framework.localChange();
                    updateForm(framework, content, true);
                });
                return btn;
            };

            var controls = Object.keys(TYPES).map(addControl);
            var staticControls = Object.keys(STATIC_TYPES).map(addControl);

            var buttons = h('div.cp-form-creator-control-inline', [
                h('div.cp-form-creator-types', controls),
                h('div.cp-form-creator-types', staticControls)
            ]);
            var add = h('div', [h('i.fa.fa-plus')]);
            if (!full) {
                add = h('button.btn.cp-form-creator-inline-add', {
                    title: Messages.tag_add
                }, [
                    h('i.fa.fa-plus.add-open'),
                    h('i.fa.fa-times.add-close')
                ]);
                var $b = $(buttons).hide();
                $(add).click(function () {
                    $b.toggle();
                    $(add).toggleClass('displayed');
                });
            }
            else {
                $(add).append(h('span', Messages.tag_add));
            }

            var inlineCls = full ? '-full' : '-inline';
            return h('div.cp-form-creator-add'+inlineCls, [
                add,
                buttons
            ]);

        };

        var updateAddInline = function () {
            $container.find('.cp-form-creator-add-inline').remove();
            $container.find('.cp-form-block').each(function (i, el) {
                var $el = $(el);
                var uid = $el.attr('data-id');
                $el.before(getFormCreator(uid));
            });
        };


        var elements = [];
        var n = 1; // Question number
        content.order.forEach(function (uid) {
            var block = form[uid];
            var type = block.type;
            var model = TYPES[type] || STATIC_TYPES[type];
            var isStatic = Boolean(STATIC_TYPES[type]);
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

            var data = model.get(block.opts, _answers, name, evOnChange);
            if (!data) { return; }
            data.uid = uid;
            if (answers && answers[uid] && data.setValue) { data.setValue(answers[uid]); }

            if (data.pageBreak && !editable) {
                elements.push(data);
                return;
            }


            var dragHandle;
            var q = h('div.cp-form-block-question', [
                h('span.cp-form-block-question-number', (n++)+'.'),
                h('span', block.q || Messages.form_default)
            ]);
            // Static blocks don't have questions ("q" is not used) so we can decrement n
            if (isStatic) { n--; }

            var editButtons, editContainer;

            APP.formBlocks.push(data);

            if (editable) {
                // Drag handle
                dragHandle = h('span.cp-form-block-drag-handle', [
                    h('i.fa.fa-ellipsis-h'),
                    h('i.fa.fa-ellipsis-h'),
                ]);

                // Question
                var inputQ = h('input', {
                    value: block.q || Messages.form_default
                });
                var $inputQ = $(inputQ);

                var saving = false;
                var cancel = false;
                var onSaveQ = function (e) {
                    if (cancel) {
                        cancel = false;
                        return;
                    }
                    var v = $inputQ.val();
                    if (!v || !v.trim()) { return void UI.warn(Messages.error); }
                    // Don't save if no change
                    if (v.trim() === block.q) {
                        $(q).removeClass('editing');
                        if (!e) { $inputQ.blur(); }
                        return;
                    }
                    if (saving && !e) { return; } // Prevent spam Enter
                    block.q = v.trim();
                    framework.localChange();
                    saving = true;
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        saving = false;
                        $(q).removeClass('editing');
                        if (!e) { $inputQ.blur(); }
                        UI.log(Messages.saved);
                    });
                };
                var onCancelQ = function () {
                    $inputQ.val(block.q || Messages.form_default);
                    cancel = true;
                    $inputQ.blur();
                    $(q).removeClass('editing');
                };
                $inputQ.keydown(function (e) {
                    if (e.which === 13) { return void onSaveQ(); }
                    if (e.which === 27) { return void onCancelQ(); }
                });
                $inputQ.focus(function () {
                    $(q).addClass('editing');
                });
                $inputQ.blur(onSaveQ);
                q = h('div.cp-form-input-block', [inputQ]);

                // Delete question
                var edit = h('span');
                var del = h('button.btn.btn-danger-alt', [
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
                    updateAddInline();
                });

                // Values
                if (data.edit) {
                    edit = h('button.btn.btn-default.cp-form-edit-button', [
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
                            _answers = getBlockAnswers(APP.answers, uid);
                            data = model.get(newOpts, _answers, null, evOnChange);
                            if (!data) { data = {}; }
                            $oldTag.before(data.tag).remove();
                        });
                    };
                    var onEdit = function (tmp) {
                        data.editing = true;
                        $(data.tag).hide();
                        $(editContainer).append(data.edit(onSave, tmp, framework));
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
            elements.push(h('div.cp-form-block'+editableCls, {
                'data-id':uid
            }, [
                APP.isEditor ? dragHandle : undefined,
                isStatic ? undefined : q,
                h('div.cp-form-block-content', [
                    data.tag,
                    editButtons
                ]),
                editContainer
            ]));
        });

        if (APP.isEditor) {
            elements.push(getFormCreator());
        }

        var _content = elements;
        if (!editable) {
            _content = [];
            var div = h('div.cp-form-page');
            var pages = 1;
            var wasPage = false;
            elements.forEach(function (obj, i) {
                if (obj && obj.pageBreak) {
                    if (i === 0) { return; } // Can't start with a page break
                    if (i === (elements.length - 1)) { return; } // Can't end with a page break
                    if (wasPage) { return; } // Prevent double page break
                    _content.push(div);
                    pages++;
                    div = h('div.cp-form-page');
                    wasPage = true;
                    return;
                }
                wasPage = false;
                $(div).append(obj);
            });
            _content.push(div);

            if (pages > 1) {
                var pageContainer = h('div.cp-form-page-container');
                var $page = $(pageContainer);
                _content.push(pageContainer);
                var refreshPage = APP.refreshPage = function (current) {
                    $page.empty();
                    if (!current || current < 1) { current = 1; }
                    if (current > pages) { current = pages; }
                    var left = h('button.btn.btn-secondary.cp-prev', [
                        h('i.fa.fa-arrow-left'),
                    ]);
                    var state = h('span', Messages._getKey('form_page', [current, pages]));
                    var right = h('button.btn.btn-secondary.cp-next', [
                        h('i.fa.fa-arrow-right'),
                    ]);
                    if (current === pages) { $(right).css('visibility', 'hidden'); }
                    if (current === 1) { $(left).css('visibility', 'hidden'); }
                    $(left).click(function () { refreshPage(current - 1); });
                    $(right).click(function () { refreshPage(current + 1); });
                    $page.append([left, state, right]);
                    $container.find('.cp-form-page').hide();
                    $($container.find('.cp-form-page').get(current-1)).show();
                    if (current !== pages) {
                        $container.find('.cp-form-send-container').hide();
                    } else {
                        $container.find('.cp-form-send-container').show();
                    }
                };
                setTimeout(refreshPage);
            }
        }

        $container.empty().append(_content);
        updateAddInline();

        if (editable) {
            APP.mainSortable = Sortable.create($container[0], {
                direction: "vertical",
                filter: "input, button, .CodeMirror, .cp-form-type-sort",
                preventOnFilter: false,
                draggable: ".cp-form-block",
                //forceFallback: true,
                fallbackTolerance: 5,
                onStart: function () {
                    $container.find('.cp-form-creator-add-inline').remove();
                },
                store: {
                    set: function (s) {
                        content.order = s.toArray();
                        framework.localChange();
                        updateAddInline();
                    }
                }
            });
            return;
        }

        // In view mode, add "Submit" and "reset" buttons
        $container.append(makeFormControls(framework, content, Boolean(answers), evOnChange));
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
        var evOnChange = Util.mkEvent();
        var content = {};

        APP.common = framework._.sfCommon;
        var sframeChan = framework._.sfCommon.getSframeChannel();
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var user = metadataMgr.getUserData();

        var priv = metadataMgr.getPrivateData();
        APP.isEditor = Boolean(priv.form_public);
        var $body = $('body');

        var $toolbarContainer = $('#cp-toolbar');
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'pad']);
        $toolbarContainer.after(helpMenu.menu);
        framework._.toolbar.$drawer.append(helpMenu.button);

        var offlineEl = h('div.alert.alert-danger.cp-burn-after-reading', Messages.disconnected);
        framework.onEditableChange(function (editable) {
            if (editable) {
                if (APP.mainSortable) {
                    APP.mainSortable.options.disabled = false;
                }
                if (!APP.isEditor) { $(offlineEl).remove(); }
                $body.removeClass('cp-form-readonly');
                $('.cp-form-creator-settings').find('input, button').removeAttr('disabled');
            } else {
                if (APP.mainSortable) {
                    APP.mainSortable.options.disabled = true;
                }
                if (!APP.isEditor) { $('.cp-help-container').before(offlineEl); }
                $body.addClass('cp-form-readonly');
                $('.cp-form-creator-settings').find('input, button').attr('disabled', 'disabled');
            }
        });

        if (!APP.isEditor) {
            framework._.toolbar.alone();
            $('.cp-toolbar-icon-history').hide();
            $('.cp-toolbar-icon-snapshots').hide();
        }

        var makeFormSettings = function () {
            // Private / public status
            var resultsType = h('div.cp-form-results-type-container');
            var $results = $(resultsType);
            var refreshPublic = function () {
                $results.empty();
                var makePublic = h('button.btn.btn-secondary', Messages.form_makePublic);
                var makePublicDiv = h('div.cp-form-actions', makePublic);
                if (content.answers.privateKey) { makePublicDiv = undefined; }
                var publicText = content.answers.privateKey ? Messages.form_isPublic : Messages.form_isPrivate;
                $results.append(h('span.cp-form-results-type', publicText));
                $results.append(makePublicDiv);
                var $makePublic = $(makePublic).click(function () {
                    UI.confirm(Messages.form_makePublicWarning, function (yes) {
                        if (!yes) { return; }
                        $makePublic.attr('disabled', 'disabled');
                        var priv = metadataMgr.getPrivateData();
                        content.answers.privateKey = priv.form_private;
                        framework.localChange();
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            UI.log(Messages.saved);
                            refreshPublic();
                        });
                    });
                });
            };
            refreshPublic();

            // Allow anonymous answers
            var privacyContainer = h('div.cp-form-privacy-container');
            var $privacy = $(privacyContainer);
            var refreshPrivacy = function () {
                $privacy.empty();
                var anonymous = content.answers.anonymous;
                var radioOn = UI.createRadio('cp-form-privacy', 'cp-form-privacy-on',
                        Messages.form_anonymous_on, Boolean(anonymous), {
                            input: { value: 1 },
                            mark: { tabindex:1 }
                        });
                var radioOff = UI.createRadio('cp-form-privacy', 'cp-form-privacy-off',
                        Messages.form_anonymous_off, !anonymous, {
                            input: { value: 0 },
                            mark: { tabindex:1 }
                        });
                var radioContainer = h('div.cp-form-privacy-radio', [radioOn, radioOff]);
                $(radioContainer).find('input[type="radio"]').on('change', function() {
                    var val = $('input:radio[name="cp-form-privacy"]:checked').val();
                    val = Number(val) || 0;
                    content.answers.anonymous = Boolean(val);
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                    });
                });
                $privacy.append(h('div.cp-form-status', Messages.form_anonymous));
                $privacy.append(h('div.cp-form-actions', radioContainer));
            };
            refreshPrivacy();

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
                    picker.open();
                });

                $endDate.append(h('div.cp-form-status', text));
                $endDate.append(h('div.cp-form-actions', button));

            };
            refreshEndDate();


            evOnChange.reg(refreshPublic);
            evOnChange.reg(refreshPrivacy);
            evOnChange.reg(refreshEndDate);

            return [
                endDateContainer,
                privacyContainer,
                resultsType,
            ];
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
            var fillerContainer;
            if (APP.isEditor) {
                var settings = makeFormSettings();

                controlContainer = h('div.cp-form-creator-control', [
                    h('div.cp-form-creator-settings', settings),
                ]);
                fillerContainer = h('div.cp-form-filler-container');
            }

            var contentContainer = h('div.cp-form-creator-content');
            var resultsContainer = h('div.cp-form-creator-results');
            var div = h('div.cp-form-creator-container', [
                controlContainer,
                contentContainer,
                resultsContainer,
                fillerContainer
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

        var showAnonBlockedAlert = function () {
            var content = UI.setHTML(h('span.cp-anon-blocked-msg'), Messages.form_anonymous_blocked);
            $(content).find('a').click(function (ev) {
                ev.preventDefault();
                var href = ($(this).attr('href') || '').replace(/\//g, '');
                APP.common.setLoginRedirect(href || 'login');
            });
            UI.alert(content);
        };

        framework.onReady(function () {
            var priv = metadataMgr.getPrivateData();

            if (APP.isEditor) {
                if (!content.form) {
                    content.form = {
                        "1": { type: 'md' },
                        "2": { type: 'radio' }
                    };
                    framework.localChange();
                }
                if (!content.order) {
                    content.order = ["1", "2"];
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
                checkIntegrity();
            }

            sframeChan.event('EV_FORM_PIN', {channel: content.answers.channel});

            var $container = $('#cp-app-form-container');
            $container.append(makeFormCreator());

            if (!content.answers || !content.answers.channel || !content.answers.publicKey || !content.answers.validateKey) {
                return void UI.errorLoadingScreen(Messages.form_invalid);
            }

            var getResults = function (key) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey,
                    privateKey: key
                }, function (err, obj) {
                    var answers = obj && obj.results;
                    if (answers) { APP.answers = answers; }
                    $body.addClass('cp-app-form-results');
                    renderResults(content, answers);
                });
            };
            if (priv.form_auditorKey) {
                APP.isAuditor = true;
                getResults(priv.form_auditorKey);
                return;
            }

            if (APP.isEditor) {
                addResultsButton(framework, content);
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey
                }, function (err, obj) {
                    var answers = obj && obj.results;
                    if (answers) { APP.answers = answers; }
                    checkIntegrity(false);
                    updateForm(framework, content, true);
                });
                return;
            }

            refreshEndDateBanner();

            var loggedIn = framework._.sfCommon.isLoggedIn();
            if (!loggedIn && !content.answers.anonymous) {
                showAnonBlockedAlert();
            }

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
                    var answers = obj && obj.results;
                    if (answers) { APP.answers = answers; }

                    if (obj && obj.noDriveAnswered) {
                        // No drive mode already answered: can't answer again
                        if (answers) {
                            $body.addClass('cp-app-form-results');
                            renderResults(content, answers);
                        } else {
                            return void UI.errorLoadingScreen(Messages.form_answered);
                        }
                        return;
                    }
                    checkIntegrity(false);
                    var myAnswers;
                    var curve1 = user.curvePublic;
                    var curve2 = obj && obj.myKey; // Anonymous answer key
                    if (answers) {
                        var myAnswersObj = answers[curve1] || answers[curve2] || undefined;
                        if (myAnswersObj) {
                            myAnswers = myAnswersObj.msg;
                        }
                    }
                    // If we have a non-anon answer, we can't answer anonymously later
                    if (answers[curve1]) { APP.cantAnon = true; }

                    // Add results button
                    if (myAnswers) { addResultsButton(framework, content); }

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
                    if (obj.error === "EANSWERED") {
                        // No drive mode already answered: can't answer again
                        if (content.answers.privateKey) {
                            return void getResults(content.answers.privateKey);
                        }
                        // Here, we know results are private so we can use an error screen
                        return void UI.errorLoadingScreen(Messages.form_answered);
                    }
                    UI.warn(Messages.form_cantFindAnswers);
                }
                var answers;
                if (obj && !obj.error) {
                    answers = obj;
                    // If we have a non-anon answer, we can't answer anonymously later
                    if (!obj._isAnon) { APP.cantAnon = true; }

                    // Add results button
                    if (content.answers.privateKey) { addResultsButton(framework, content); }
                }
                checkIntegrity(false);
                updateForm(framework, content, false, answers);
            });

        });

        framework.onContentUpdate(function (newContent) {
            content = newContent;
            evOnChange.fire();
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
