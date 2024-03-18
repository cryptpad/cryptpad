// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    'json.sortify',
    '/api/config',
    '/components/chainpad-crypto/crypto.js',
    '/common/sframe-app-framework.js',
    '/common/toolbar.js',
    '/form/export.js',
    '/form/condorcet.js',
    '/components/nthen/index.js',
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
    '/common/text-cursor.js',
    'cm/lib/codemirror',
    '/components/chainpad/chainpad.dist.js',
    'tui-date-picker',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/lib/datepicker/flatpickr.js',
    '/components/sortablejs/Sortable.min.js',

    'cm/addon/edit/closebrackets',
    'cm/addon/edit/matchbrackets',
    'cm/addon/display/placeholder',
    'cm/mode/gfm/gfm',
    'css!cm/lib/codemirror.css',

    '/components/file-saver/FileSaver.min.js',

    'css!/components/codemirror/lib/codemirror.css',
    'css!/components/codemirror/addon/dialog/dialog.css',
    'css!/components/codemirror/addon/fold/foldgutter.css',
    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/form/app-form.less',
], function (
    $,
    Sortify,
    ApiConfig,
    Crypto,
    Framework,
    Toolbar,
    Exporter,
    Condorcet,
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
    TextCursor,
    CMeditor,
    ChainPad,
    DatePicker,
    Share, Access, Properties,
    Flatpickr,
    Sortable
    )
{

    var APP = window.APP = {
        blocks: {}
    };

    var is24h = UIElements.is24h();
    var dateFormat = "Y-m-d H:i";
    var timeFormat = "H:i";

    var evCheckConditions = Util.mkEvent();
    var evShowConditions = Util.mkEvent();

    if (!is24h) {
        dateFormat = "Y-m-d h:i K";
        timeFormat = "h:i K";
    }

    // multi-line radio, checkboxes, and possibly other things have a max number of items
    // we'll consider increasing this restriction if people are unhappy with it
    // but as a general rule we expect users will appreciate having simpler questions
    var MAX_OPTIONS = 25;
    var MAX_ITEMS = 25;


    var getOptionValue = function (obj) {
        if (!Util.isObject(obj)) { return obj; }
        return obj.v;
    };
    var extractValues = function (values) {
        if (!Array.isArray(values)) { return []; }
        return values.map(getOptionValue);
    };

    var saveAndCancelOptions = function (cb) {
        var cancelBlock = h('button.btn.btn-default.cp-form-preview-button',[
                            h('i.fa.fa-eye'),
                            Messages.form_preview_button
                        ]);
        $(cancelBlock).click(function () { cb(undefined, true); });

        return cancelBlock;
    };
    var editTextOptions = function (opts, setCursorGetter, cb) {
        var evOnSave = Util.mkEvent();

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
                evOnSave.fire();
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
            typeSelect.onChange.reg(evOnSave.fire);
        }

        setCursorGetter(function () {
            return {};
        });

        var getSaveRes = function () {
            return {
                maxLength: getLengthVal ? getLengthVal() : undefined,
                required: opts.required ? true : false,
                type: typeSelect ? typeSelect.getValue() : undefined
            };
        };

        evOnSave.reg(function () {
            var res = getSaveRes();
            if (!res) { return; }
            cb(res);
        });

        var saveAndCancel = saveAndCancelOptions(cb);

        return [
            maxLength,
            type,
            saveAndCancel
        ];
    };

    var editDateOptions = function (cb) {
        var saveAndCancel = saveAndCancelOptions(cb);

        return [
            saveAndCancel
        ];
    };

    var editOptions = function (v, isDefaultOpts, setCursorGetter, cb, tmp) {
        var evOnSave = Util.mkEvent();

        var add = h('button.btn', [
            h('i.fa.fa-plus'),
            h('span', Messages.form_add_option)
        ]);
        var addItem = h('button.btn.btn-secondary', [
            h('i.fa.fa-plus'),
            h('span', Messages.form_add_item)
        ]);

        var cursor;
        if (tmp && tmp.cursor) {
            cursor = tmp.cursor;
        }

        // Checkbox: max options
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
            $(maxInput).on('input', function () {
                setTimeout(evOnSave.fire);
            });
        }

        // Poll: type (text/day/time)
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
        var getOption = function (val, placeholder, isItem, uid) {
            var input = h('input', {value:val});
            var $input = $(input);
            if (placeholder) {
                input.placeholder = val;
                input.value = '';
                $input.on('keypress', function () {
                    $input.removeAttr('placeholder');
                    $input.off('keypress');
                });
            }
            if (uid) { $input.data('uid', uid); }

            // If the input is a date, initialize flatpickr
                if (v.type === 'time') {
                    Flatpickr(input, {
                        disableMobile: true,
                        enableTime: true,
                        time_24hr: is24h,
                        dateFormat: dateFormat,
                        defaultDate: val ? new Date(val) : undefined
                    });
                } 

            // if this element was active before the remote change, restore cursor
            var setCursor = function () {
                if (v.type && v.type !== 'text') { return; }
                try {
                    var ops = ChainPad.Diff.diff(cursor.el, val);
                    ['start', 'end'].forEach(function (attr) {
                        cursor[attr] = TextCursor.transformCursor(cursor[attr], ops);
                    });
                } catch (e) { console.error(e); }
                input.selectionStart = cursor.start || 0;
                input.selectionEnd = cursor.end || 0;
                setTimeout(function () { input.focus(); });
            };

            if (cursor && cursor.uid === uid && Boolean(cursor.item) === Boolean(isItem)) {
                setCursor();
            }

            var del = h('button.btn.btn-danger-outline', h('i.fa.fa-times'));
            var formHandle;
            if (v.type !== 'time') {
                formHandle = h('span.cp-form-handle', [
                    h('i.fa.fa-ellipsis-v'),
                    h('i.fa.fa-ellipsis-v'),
                ]);
            }
            var el = h('div.cp-form-edit-block-input', [
                formHandle,
                input,
                del
            ]);
            $(del).click(function () {
                var $block = $(el).closest('.cp-form-edit-block');
                $(el).remove();
                // We've just deleted an item/option so we should be under the MAX limit and
                // we can show the "add" button again
                if (isItem && $addItem) { $addItem.show(); }
                if (!isItem && $add) {
                    $add.show();
                    if (v.type === "time") { $(addMultiple).show(); }
                }
                // decrement the max choices input when there are fewer options than the current maximum
                if (maxInput) {
                    var inputs = $block.find('input').length;
                    var $maxInput = $(maxInput);
                    var currentMax = Number($maxInput.val());
                    $maxInput.val(Math.min(inputs, currentMax));
                }

                evOnSave.fire();
            });

            if (!v.type || v.type === "text") {
                $input.keydown(function (e) {
                    try {
                        if (e.which === 13) {
                            var $line = $input.closest('.cp-form-edit-block-input');
                            if ($input.closest('.cp-form-edit-block')
                                    .find('.cp-form-edit-block-input').last()[0] === $line[0]) {
                                // If we're the last input, add a new one
                                if (isItem && $addItem && $addItem.is(':visible')) {
                                    $addItem.click();
                                }
                                if (!isItem && $add && $add.is(':visible')) { $add.click(); }
                            } else {
                                // Otherwise focus the next one
                                $line.next().find('input').focus();
                            }
                        }
                        if (e.which === 27 && !$(input).val()) {
                            $(del).click();
                        }
                    } catch (err) { console.error(err); }
                });
            }

            $(input).on('input', function () {
                evOnSave.fire();
            });

            return el;
        };
        var inputs = v.values.map(function (data) {
            return getOption(data.v, isDefaultOpts, false, data.uid);
        });
        inputs.push(add);

        var container = h('div.cp-form-edit-block', inputs);
        var $container = $(container);

        var sortableOption = Sortable.create(container, {
            direction: "vertical",
            handle: ".cp-form-handle",
            draggable: ".cp-form-edit-block-input",
            forceFallback: true,
            store: {
                set: function () {
                    evOnSave.fire();
                }
            }
        });

        var containerItems;
        if (v.items) {
            var inputsItems = v.items.map(function (itemData) {
                return getOption(itemData.v, isDefaultOpts, true, itemData.uid);
            });
            inputsItems.push(addItem);
            containerItems = h('div.cp-form-edit-block', inputsItems);
            Sortable.create(containerItems, {
                direction: "vertical",
                handle: ".cp-form-handle",
                draggable: ".cp-form-edit-block-input",
                forceFallback: true,
                store: {
                    set: function () {
                        evOnSave.fire();
                    }
                }
            });
        }

        // Calendar...
        var calendarView;
        if (v.type) { // Polls
            // Calendar inline for "day" type
            var calendarInput = h('input');
            calendarView = h('div', calendarInput);
            var calendarDefault = v.type === "day" ? extractValues(v.values).map(function (time) {
                if (!time) { return; }
                var d = new Date(time);
                if (!isNaN(d)) { return d; }
            }).filter(Boolean) : undefined;
            Flatpickr(calendarInput, {
                mode: 'multiple',
                inline: true,
                defaultDate: calendarDefault,
                appendTo: calendarView,
                onChange: function () {
                    evOnSave.fire();
                }
            });

            // Calendar popup for "time"
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
                    $add.before(getOption(date, false, false, Util.uid()));
                    var l = $container.find('input').length;
                    $(maxInput).attr('max', l);
                    if (l >= MAX_OPTIONS) {
                        $add.hide();
                        $(addMultiple).hide();
                        return true;
                    }
                });
                multiplePickr.clear();
                evOnSave.fire();
            });
        }

        var refreshView = function () {
            if (!v.type) { return; }
            var $calendar = $(calendarView);
            sortableOption.option("disabled", v.type !== "text");
            $container.toggleClass('cp-no-sortable', v.type !== "text");
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
                setTimeout(evOnSave.fire);
                if (val !== "text") {
                    $container.find('.cp-form-edit-block-input').remove();
                    var time, el;
                    if (val === "time") {
                        time = new Date();
                        time.setHours(14);
                        time.setMinutes(0);
                        time.setSeconds(0);
                        time.setMilliseconds(0);
                        el = getOption(+time, false, false, Util.uid());
                        $add.before(el);
                        $(el).find('input').focus();
                        return;
                    } else if (val === "day") {
                        time = new Date();
                        el = getOption(+time, false, false, Util.uid());
                        $add.before(el);
                        $(el).find('input').focus();

                        return;
                    } 
                    $(add).click();
                    return;
                } else {
                    var selectedDates = $(calendarView).find('input')[0]._flatpickr.selectedDates;
                    if ($container.find('input')[0] && $container.find('input')[0]._flatpickr) {
                        var dateInput = new Date(+$container.find('input').value);
                        $container.find('input').value = dateInput.toLocaleDateString();
                    } else if (selectedDates.length > 0) {
                        for (var i=0; i < selectedDates.length; i++ ) {
                            if (!$container.find('input')[i]) {
                                var element = getOption(selectedDates[i].toLocaleDateString(), true, false, Util.uid());
                                $add.before(element);
                                $(element).find('input').focus();
                            } else {
                                $container.find('input')[i].value = selectedDates[i].toLocaleDateString();
                            } 
                        }
                    } else if ($container.find('input')[0]) {
                        $container.find('input')[0].value = '';
                    }   
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
        $add = $(add);
        Util.onClickEnter($add, function () {
            var txt = v.type ? '' : Messages.form_newOption;
            var el = getOption(txt, true, false, Util.uid());
            $add.before(el);
            $(el).find('input').focus();
            var l = $container.find('input').length;
            $(maxInput).attr('max', l);
            if (l >= MAX_OPTIONS) { $add.hide(); }
        });

        // If multiline block, handle "Add item" button
        $addItem = $(addItem).click(function () {
            var el = getOption(Messages.form_newItem, true, true, Util.uid());
            $addItem.before(el);
            $(el).find('input').focus();
            if ($(containerItems).find('input').length >= MAX_ITEMS) { $addItem.hide(); }
        });
        if ($container.find('input').length >= MAX_OPTIONS) { $add.hide(); }
        if ($(containerItems).find('input').length >= MAX_ITEMS) { $addItem.hide(); }

        // Set cursor getter (to handle remote changes to the form)
        setCursorGetter(function () {
            var active = document.activeElement;
            var cursor = {};
            $container.find('input').each(function (i, el) {
                var val = $(el).val() || el.placeholder || '';
                if (el === active && !el._flatpickr) {
                    cursor.item = false;
                    cursor.uid= $(el).data('uid');
                    cursor.start = el.selectionStart;
                    cursor.end = el.selectionEnd;
                    cursor.el = val;
                }
            });
            if (v.items) {
                $(containerItems).find('input').each(function (i, el) {
                    var val = $(el).val() || el.placeholder || '';
                    if (el === active) {
                        cursor.item = true;
                        cursor.uid= $(el).data('uid');
                        cursor.start = el.selectionStart;
                        cursor.end = el.selectionEnd;
                        cursor.el = val;
                    }
                });
            }
            if (v.type === "time") {
                $container.find('input').each(function (i, el) {
                    var f = el._flatpickr;
                    if (!f || !f.isOpen) { return; }
                    var rect = el.getBoundingClientRect();
                    cursor = {
                        flatpickr: true,
                        val: +f.selectedDates[0],
                        y: rect && rect.y
                    };
                });
            }
            return {
                cursor: cursor
            };
        });

        var getSaveRes = function () {
            // Get values
            var values = [];
            if (v.type === "day") {
                var dayPickr = $(calendarView).find('input')[0]._flatpickr;
                values = dayPickr.selectedDates.map(function (date) {
                    return date.toLocaleDateString('EN-CA');
                    //return +date;
                });
            } else {
                $container.find('input').each(function (i, el) {
                    var val = ($(el).val() || el.placeholder || '').trim();
                    if (v.type === "day" || v.type === "time") {
                        var f = el._flatpickr;
                        if (f && f.selectedDates && f.selectedDates.length) {
                            val = +f.selectedDates[0];
                        }
                    }
                    var uid = $(el).data('uid');
                    var hasUid = values.some(function (i) { return i.uid === uid; });
                    if (hasUid) { uid = Util.uid(); }
                    values.push({
                        uid: uid,
                        v: val
                    });
                    if (hasUid) { $(el).data('uid', uid); }
                });
            }
            var res = { values: values };

            // If multiline block, get items
            if (v.items) {
                var items = [];
                $(containerItems).find('input').each(function (i, el) {
                    var val = ($(el).val() || el.placeholder || '').trim();
                    var uid = $(el).data('uid');
                    var hasUid = items.some(function (i) { return i.uid === uid; });
                    if (hasUid) { uid = Util.uid(); }
                    items.push({
                        uid: uid,
                        v: val
                    });
                    if (hasUid) { $(el).data('uid', uid); }
                });
                items = items.filter(Boolean);
                res.items = items;
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

        evOnSave.reg(function () {
            var res = getSaveRes();
            if (!res) { return; }
            cb(res);
        });

        var saveAndCancel = saveAndCancelOptions(cb);

        return [
            type,
            maxOptions,
            calendarView,
            h('div.cp-form-edit-options-block', [containerItems, container]),
            addMultiple,
            saveAndCancel
        ];
    };

    var getWeekDays = function (large) {
        var baseDate = new Date(2017, 0, 1); // just a Sunday
        var weekDays = [];
        for(var i = 0; i < 7; i++) {
            weekDays.push(baseDate.toLocaleDateString(undefined, { weekday: 'long' }));
            baseDate.setDate(baseDate.getDate() + 1);
        }
        if (!large) {
            weekDays = weekDays.map(function (day) { return day.slice(0,3); });
        }
        return weekDays.map(function (day) { return day.replace(/^./, function (str) { return str.toUpperCase(); }); });
    };

    // "resultsPageObj" is an object with "content" and "answers"
    // only available when viewing the Responses page
    var makePollTable = function (answers, opts, resultsPageObj) {
        // Sort date values
        if (opts.type !== "text") {
            opts.values.sort(function (_a, _b) {
                var a = getOptionValue(_a);
                var b = getOptionValue(_b);
                return +new Date(a) - +new Date(b);
            });
        }
        // Create first line with options
        var allDays = getWeekDays(true);
        var els = extractValues(opts.values).map(function (data) {
            var _date;
            if (opts.type === "day") {
                _date = new Date(data);
                data = _date.toLocaleDateString();
            }
            if (opts.type === "time") {
                _date = new Date(data);
                data = Flatpickr.formatDate(_date, timeFormat);
            }
            var day = _date && allDays[_date.getDay()];
            return h('div.cp-poll-cell.cp-form-poll-option', {
                title: data,
            }, [
                opts.type === 'day' ? h('span.cp-form-weekday', day) : undefined,
                opts.type === 'day' ? h('span.cp-form-weekday-separator', ' - ') : undefined,
                h('span', data)
            ]);
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
            var days = [h('div.cp-poll-cell.cp-poll-time-day')];
            var _days = {};
            extractValues(opts.values).forEach(function (d) {
                var date = new Date(d);
                var day = date.toLocaleDateString();
                _days[day] = {
                    n: (_days[day] && _days[day].n) || 0,
                    name: allDays[date.getDay()]
                };
                _days[day].n++;
            });
            Object.keys(_days).forEach(function (day) {
                days.push(h('div.cp-poll-cell.cp-poll-time-day', {
                    style: 'flex-grow:'+(_days[day].n - 1)+';'
                }, [
                    h('span.cp-form-weekday', _days[day].name),
                    h('span.cp-form-weekday-separator', ' - '),
                    h('span', day)
                ]));
            });
            var w = 200 + 105*(opts.values.length || 1);
            lines.unshift(h('div.cp-poll-time-day-container', {style: 'width:'+w+'px;'}, days));
            setTimeout(function () {
                var w2 = $('div.cp-form-poll-body').width();
                if (w < w2) { $('div.cp-poll-time-day-container').width(w2); }
                var cellWidth = $(lines).find('div.cp-poll-cell.cp-form-poll-option').first().width();
                $('div.cp-poll-cell.cp-poll-time-day').css('flex-basis', cellWidth);
            });
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
                var els = extractValues(opts.values).map(function (data) {
                    var res = values[data] || 0;
                    var v = (Number(res) === 1) ? h('i.fa.fa-check.cp-yes') : undefined;
                    var cell = h('div.cp-poll-cell.cp-form-poll-answer', {
                        'data-value': res
                    }, v);
                    return cell;
                });
                var nameCell;
                els.unshift(nameCell = h('div.cp-poll-cell.cp-poll-answer-name', {
                    title: Util.fixHTML(name)
                }, [
                    avatar,
                    h('span', name)
                ]));
                bodyEls.push(h('div', els));
                if (resultsPageObj && (APP.isEditor || APP.isAuditor)) {
                    $(nameCell).addClass('cp-clickable').click(function () {
                        resultsPageObj.answers._parsed = true;
                        APP.renderResults(resultsPageObj.content, resultsPageObj.answers, answerObj.curve);
                    });
                }
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
            extractValues(opts.values).forEach(function (data) {
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
        var totalEls = extractValues(opts.values).map(function (data) {
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
                    $total.find('[data-id="'+ (k.replace(/"/g, '\\"')) + '"]').addClass('cp-poll-best');
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

    var multiAnswerSubHeading = function (content) {
        return h('span.cp-charts-row', h('td.cp-charts-cell.cp-grid-sub-question', {
            colspan: 3,
            style: 'font-weight: bold;',
        }, content));
    };

    var getEmpty = function (empty) {
        if (!empty) { return; }
        var msg = UI.setHTML(h('span.cp-form-results-empty-text'), Messages._getKey('form_notAnswered', [empty]));
        return multiAnswerSubHeading(msg);
    };

    var barGraphic = function (itemScale) {
        return h('span.cp-bar-container', h('div.cp-bar', {
            style: 'width: ' + (itemScale * 100) + '%',
        }, ' '));
    };

    var barRow = function (value, count, max, showBar) {
        return h('div.cp-charts-row', [
            h('span.cp-value', value),
            h('span.cp-count', count),
            showBar? barGraphic((count / max)): undefined,
        ]);
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

    var getSections = function (content) {
        var uids = Object.keys(content.form).filter(function (uid) {
            return content.form[uid].type === 'section';
        });
        return uids;
    };
    var getFullOrder = function (content) {
        var order = content.order.slice();
        getSections(content).forEach(function (uid) {
            var block = content.form[uid];
            if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
            var idx = order.indexOf(uid);
            if (idx === -1) { return; }
            idx++;
            block.opts.questions.forEach(function (el, i) {
                order.splice(idx+i, 0, el);
            });
        });
        return order;
    };

    var getBlockAnswers = function (answers, uid, filterCurve) {
        if (!answers) { return; }
        return Object.keys(answers || {}).map(function (key) {
            var user = key.split('|')[0];
            if (filterCurve && user === filterCurve) {
                var obj = answers[key];
                // Only hide the current response (APP.editingUid), not all our responses
                if (APP.editingUid && Util.find(obj, ['msg', '_uid']) === APP.editingUid) {
                    return;
                }
            }
            try {
                return {
                    curve: user,
                    user: answers[key].msg._userdata,
                    results: answers[key].msg[uid],
                    time: answers[key].time
                };
            } catch (e) { console.error(e); }
        }).filter(Boolean).sort(function (obj1, obj2) {
            return obj1.time - obj2.time;
        });
    };

    // When there is a change to the form, we need to check if we can still add
    // conditions to the different sections
    evShowConditions.reg(function () {
        (APP.formBlocks || []).forEach(function (block) {
            if (!block || !block.updateState) { return; }
            block.updateState();
        });
    });
    // When a section contains a condition that is now invalid (the question has been moved
    // or deleted locally), we need to redraw the list of conditions for this section
    evCheckConditions.reg(function (_uid) {
        (APP.formBlocks || []).some(function (block) {
            if (block.uid && block.uid !== _uid) { return; }
            if (!block || !block.updateState) { return; }
            return block.updateState(true, _uid);
        });
    });

    var linkClickHandler = function (ev) {
        ev.preventDefault();
        var href = ($(this).attr('href') || '').trim();
        if (!href) { return; }
        APP.common.openUnsafeURL(href);
    };

    var STATIC_TYPES = {
        md: {
            defaultOpts: {
                text: Messages.form_description_default
            },
            get: function (opts) {
                if (!opts) { opts = Util.clone(STATIC_TYPES.md.defaultOpts); }
                var tag = h('div', {
                    id: 'form'+Util.uid()
                }, opts.text);
                var $tag = $(tag);
                DiffMd.apply(DiffMd.render(opts.text || ''), $tag, APP.common);
                $tag.find('a').click(linkClickHandler);

                var cursorGetter;
                return {
                    tag: tag,
                    edit: function (cb, tmp) {
                        // Cancel changes
                        var cancelBlock = saveAndCancelOptions(cb);

                        var text = opts.text;
                        var cursor;
                        if (tmp && tmp.cursor) {
                            cursor = tmp.cursor;
                        }

                        var block, editor;
                        if (tmp && tmp.block) {
                            block = tmp.block;
                            editor = tmp.editor;
                        }

                        var cm;
                        if (!block || !editor) {
                            var t = h('textarea');
                            block = h('div.cp-form-edit-options-block', [t]);
                            cm = SFCodeMirror.create("gfm", CMeditor, t);
                            editor = cm.editor;
                            editor.setOption('lineNumbers', true);
                            editor.setOption('lineWrapping', true);
                            editor.setOption('styleActiveLine', true);
                            editor.setOption('readOnly', false);
                        }

                        setTimeout(function () {
                            editor.focus();
                            if (!(tmp && tmp.editor)) {
                                editor.setValue(text);
                            } else {
                                SFCodeMirror.setValueAndCursor(editor, editor.getValue(), text);
                            }
                            editor.refresh();
                            editor.save();
                            editor.focus();
                        });

                        if (APP.common && !(tmp && tmp.block) && cm) {
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

                        var getContent = function () {
                            return {
                                text: editor.getValue()
                            };
                        };

                        if (tmp && tmp.onChange) {
                            editor.off('change', tmp.onChange);
                        }
                        var on = function () {
                            cb(getContent());
                        };
                        editor.on('change', on);

                        cursorGetter = function () {
                            if (document.activeElement && block.contains(document.activeElement)) {
                                cursor = {
                                    start: editor.getCursor('from'),
                                    end: editor.getCursor('to')
                                };
                            }
                            return {
                                cursor: cursor,
                                block: block,
                                editor: editor,
                                onChange: on
                            };
                        };

                        return [
                            block,
                            cancelBlock
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
        section: {
            defaultOpts: {
                questions: []
            },
            get: function (opts, a, n, ev, data) {
                var sortable = h('div.cp-form-section-sortable');
                var tag = h('div.cp-form-section-edit', [
                    sortable
                ]);
                if (!APP.isEditor) {
                    return {
                        tag: tag,
                        noViewMode: true
                    };
                }

                var block = data.block;
                if (!opts) { opts = block.opts = Util.clone(STATIC_TYPES.section.defaultOpts); }
                var content = data.content;
                var uid = data.uid;
                var form = content.form;
                var framework = APP.framework;
                var tmp = data.tmp;

                var getConditionsValues = function () {
                    var order = getFullOrder(content);
                    var blockIdx = order.indexOf(uid);
                    var blocks = order.slice(0, blockIdx); // Get all previous questions
                    var values = blocks.map(function(uid) {
                        var block = form[uid];
                        var type = block.type;
                        if (['radio', 'checkbox'].indexOf(type) === -1) { return; }
                        var obj = {
                            uid: uid,
                            type: type,
                            q: block.q || Messages.form_default
                        };
                        var val;
                        if (type === 'radio') {
                            val = block.opts ? block.opts.values
                                             : Util.clone(APP.TYPES.radio.defaultOpts.values);
                        }
                        if (type === 'checkbox') {
                            val = block.opts ? block.opts.values
                                             : Util.clone(APP.TYPES.checkbox.defaultOpts.values);
                        }
                        obj.values = extractValues(val);
                        return obj;
                    }).filter(Boolean);
                    return values;
                };
                var addCondition = h('button.btn.btn-secondary', [
                    h('i.fa.fa-plus'),
                    h('span', Messages.form_conditional_add)
                ]);
                var $addC = $(addCondition);
                var getConditions;
                var getAddAndButton = function ($container, rules) {
                    var btn = h('button.btn.btn-secondary.cp-form-add-and', [
                        h('i.fa.fa-plus'),
                        h('span', Messages.form_conditional_addAnd)
                    ]);
                    $(btn).click(function () {
                        getConditions($container, true, rules, undefined);
                    });
                    $container.append(btn);
                    return;
                };
                var values = getConditionsValues();
                getConditions = function ($container, isNew, rules, condition) {
                    condition = condition || {};
                    condition.uid = condition.uid || Util.uid();

                    var content = h('div.cp-form-condition', {
                        'data-uid': condition.uid,
                    });
                    var $content = $(content);

                    var qSelect, iSelect, vSelect;
                    var onChange = function (resetV) {
                        var w = block.opts.when = block.opts.when || [];

                        if (qSelect) { condition.q = qSelect.getValue(); }
                        if (iSelect) { condition.is = Number(iSelect.getValue()); }
                        if (resetV) { delete condition.v; }
                        else if (vSelect) { condition.v = vSelect.getValue(); }

                        if (isNew) {
                            if (!Array.isArray(rules)) { // new set of rules (OR)
                                rules = [condition];
                                w.push(rules);
                                getAddAndButton($container, rules);
                            } else {
                                rules.push(condition);
                            }
                            isNew = false;
                        }

                        framework.localChange();
                    };

                    onChange();

                    var qOptions = values.map(function (obj) {
                        return {
                            tag: 'a',
                            attributes: {
                                'class': 'cp-form-condition-question',
                                'data-value': obj.uid,
                                'href': '#',
                            },
                            content: obj.q
                        };
                    });
                    var qConfig = {
                        text: Messages.form_condition_q, // Button initial text
                        options: qOptions, // Entries displayed in the menu
                        isSelect: true,
                        caretDown: true,
                        buttonCls: 'btn btn-secondary'
                    };
                    qSelect = UIElements.createDropdown(qConfig);
                    qSelect[0].dropdown = qSelect;
                    $(qSelect).attr('data-drop', 'q');

                    var isOn = !condition || condition.is !== 0;
                    var iOptions = [{
                        tag: 'a',
                        attributes: {
                            'data-value': 1,
                            'href': '#',
                        },
                        content: Messages.form_condition_is
                    }, {
                        tag: 'a',
                        attributes: {
                            'data-value': 0,
                            'href': '#',
                        },
                        content: Messages.form_condition_isnot
                    }];
                    var iConfig = {
                        options: iOptions, // Entries displayed in the menu
                        isSelect: true,
                        caretDown: true,
                        buttonCls: 'btn btn-default'
                    };
                    iSelect = UIElements.createDropdown(iConfig);
                    iSelect[0].dropdown = iSelect;
                    iSelect.setValue(isOn ? 1 : 0, undefined, true);
                    $(iSelect).attr('data-drop', 'i').hide();
                    iSelect.onChange.reg(function () { onChange(); });

                    var remove = h('button.btn.btn-danger-alt.cp-condition-remove', [
                        h('i.fa.fa-times.nomargin')
                    ]);
                    $(remove).on('click', function () {
                        var w = block.opts.when = block.opts.when || [];
                        var deleteRule = false;
                        if (rules.length === 1) {
                            var rIdx = w.indexOf(rules);
                            w.splice(rIdx, 1);
                            deleteRule = true;
                        } else {
                            var idx = rules.indexOf(condition);
                            rules.splice(idx, 1);
                        }
                        framework.localChange();
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            if (deleteRule) {
                                $content.closest('.cp-form-condition-rule').remove();
                                return;
                            }
                            $content.remove();
                        });
                    });

                    $content.append(qSelect).append(iSelect).append(remove);
                    if ($container.find('button.cp-form-add-and').length) {
                        $container.find('button.cp-form-add-and').before($content);
                    } else {
                        $container.append($content);
                    }

                    qSelect.onChange.reg(function (prettyVal, val, init) {
                        qSelect.find('button').removeClass('btn-secondary')
                            .addClass('btn-default');
                        onChange(!init);
                        $(iSelect).show();
                        var res, type;
                        values.some(function (obj) {
                            if (String(obj.uid) === String(val)) {
                                res = obj.values;
                                type = obj.type;
                                return true;
                            }
                        });

                        var $selDiv = $(iSelect);
                        if (type === 'checkbox') {
                            $selDiv.find('[data-value="0"]').text(Messages.form_condition_hasnot);
                            $selDiv.find('[data-value="1"]').text(Messages.form_condition_has);
                        } else {
                            $selDiv.find('[data-value="0"]').text(Messages.form_condition_isnot);
                            $selDiv.find('[data-value="1"]').text(Messages.form_condition_is);
                        }
                        iSelect.setValue(iSelect.getValue(), undefined, true);

                        $content.find('.cp-form-condition-values').remove();
                        if (!res) { return; }
                        var vOptions = res.map(function (str) {
                            return {
                                tag: 'a',
                                attributes: {
                                    'class': 'cp-form-condition-value',
                                    'data-value': str,
                                    'href': '#',
                                },
                                content: str
                            };
                        });
                        var vConfig = {
                            text: Messages.form_condition_v, // Button initial text
                            options: vOptions, // Entries displayed in the menu
                            //left: true, // Open to the left of the button
                            //container: $(type),
                            isSelect: true,
                            caretDown: true,
                            buttonCls: 'btn btn-secondary'
                        };
                        vSelect = UIElements.createDropdown(vConfig);
                        vSelect[0].dropdown = vSelect;
                        vSelect.addClass('cp-form-condition-values').attr('data-drop', 'v');
                        $content.append(vSelect).append(remove);

                        vSelect.onChange.reg(function () {
                            vSelect.find('button').removeClass('btn-secondary')
                                .addClass('btn-default');
                            $(remove).off('click').click(function () {
                                var w = block.opts.when = block.opts.when || [];
                                var deleteRule = false;
                                if (rules.length === 1) {
                                    var rIdx = w.indexOf(rules);
                                    w.splice(rIdx, 1);
                                    deleteRule = true;
                                } else {
                                    var idx = rules.indexOf(condition);
                                    rules.splice(idx, 1);
                                }
                                framework.localChange();
                                framework._.cpNfInner.chainpad.onSettle(function () {
                                    if (deleteRule) {
                                        $content.closest('.cp-form-condition-rule').remove();
                                        return;
                                    }
                                    $content.remove();
                                });
                            }).appendTo($content);
                            onChange();
                        });

                        if (condition && condition.v && init) {
                            vSelect.setValue(condition.v, undefined, true);
                            vSelect.onChange.fire(condition.v, condition.v);
                        }

                        if (!tmp || tmp.uid !== condition.uid) { return; }
                        if (tmp.type === 'v') {
                            vSelect.click();
                        }
                    });
                    if (condition && condition.q) {
                        qSelect.setValue(condition.q, undefined, true);
                        qSelect.onChange.fire(condition.q, condition.q, true);
                    }

                    if (!tmp || tmp.uid !== condition.uid) { return; }

                    if (tmp.type === 'q') { qSelect.click(); }
                    else if (tmp.type === 'i') { iSelect.click(); }
                };

                var conditionalDiv = h('div.cp-form-conditional', [
                    h('div.cp-form-conditional-hint', Messages.form_conditional),
                    addCondition
                ]);
                var $condition = $(conditionalDiv).prependTo(tag);
                var redraw = function () {
                    var w = block.opts.when = block.opts.when || [];
                    w.forEach(function (rules) {
                        var rulesC = h('div.cp-form-condition-rule');
                        var $rulesC = $(rulesC);
                        getAddAndButton($rulesC, rules);
                        rules.forEach(function (obj) {
                            getConditions($rulesC, false, rules, obj);
                        });
                        $addC.before($rulesC);
                    });
                };
                redraw();

                var hintDiv = h('div.cp-form-conditional-hint', [
                    h('div.cp-form-conditional-hint', Messages.form_conditional_hint)
                ]);
                var $hint = $(hintDiv).prependTo(tag);

                $addC.click(function () {
                    var rulesC = h('div.cp-form-condition-rule');
                    var $rulesC = $(rulesC);
                    getConditions($rulesC, true);
                    $addC.before($rulesC);
                });

                var cursorGetter = function () {
                    var $activeDrop = $condition.find('.cp-dropdown-content:visible').first();
                    if (!$activeDrop.length) { return; }
                    var uid = $activeDrop.closest('.cp-form-condition').attr('data-uid');
                    var type = $activeDrop.closest('.cp-dropdown-container').attr('data-drop');
                    var $btn = $activeDrop.closest('.cp-dropdown-container').find('button');
                    var y = $btn && $btn.length && $btn[0].getBoundingClientRect().y;
                    return {
                        uid: uid,
                        type: type,
                        y: y
                    };
                };

                Sortable.create(sortable, {
                    group: {
                        name: 'nested',
                        put: function (to, from, el) {
                            // Make sure sections dan't be dropped into other sections
                            return $(el).attr('data-type') !== 'section';
                        }
                    },
                    direction: "vertical",
                    filter: "input, button, .CodeMirror, .cp-form-type-sort, .cp-form-block-type.editable",
                    preventOnFilter: false,
                    draggable: ".cp-form-block",
                    //forceFallback: true,
                    fallbackTolerance: 5,
                    onStart: function () {
                        var $container = $('div.cp-form-creator-content');
                        $container.find('.cp-form-creator-add-inline').remove();
                    },
                    store: {
                        set: function (s) {
                            opts.questions = s.toArray();
                            setTimeout(APP.framework.localChange);
                            if (APP.updateAddInline) { APP.updateAddInline(); }
                        }
                    }
                });

                // If "needRedraw" is false, we only want to know if we can add conditions and
                // if we can't, make sure we delete incomplete conditions before hiding the button
                // If "needRedraw" is true, it means we ant to redraw a section because some
                // conditions are invalid
                var updateState = function (needRedraw, _uid) {
                    if (needRedraw && uid !== _uid) { return; }

                    values = getConditionsValues();
                    var available = values.length;
                    if (available) {
                        $condition.show();
                        $hint.hide();
                    } else {
                        $condition.hide();
                        $hint.show();
                    }

                    if (needRedraw) {
                        $condition.find('.cp-form-condition-rule').remove();
                        redraw();
                        return true;
                    } else {
                        if (available) {
                            // Questions may have moved. We need to redraw our dropdowns
                            // to make sure we use the correct list
                            $condition.find('.cp-form-condition').each(function (i, el) {
                                // Update question dropdown
                                var $q = $(el).find('.cp-dropdown-container[data-drop="q"]');
                                var drop = $q[0] && $q[0].dropdown;
                                if (!drop) { return; }
                                var qOptions = values.map(function (obj) {
                                    return {
                                        tag: 'a',
                                        attributes: {
                                            'class': 'cp-form-condition-question',
                                            'data-value': obj.uid,
                                            'href': '#',
                                        },
                                        content: obj.q
                                    };
                                });
                                var val = drop.getValue();
                                drop.setOptions(qOptions);
                                drop.setValue(val);

                                // Update values dropdown
                                var $v = $(el).find('.cp-dropdown-container[data-drop="v"]');
                                if (!$v.length) { return; }
                                var dropV = $v[0] && $v[0].dropdown;
                                if (!dropV) { return; }
                                var res;
                                values.some(function (obj) {
                                    if (String(obj.uid) === String(val)) {
                                        res = obj.values;
                                        //var type = obj.type;
                                        return true;
                                    }
                                });
                                var vOptions = res.map(function (str) {
                                    return {
                                        tag: 'a',
                                        attributes: {
                                            'class': 'cp-form-condition-value',
                                            'data-value': str,
                                            'href': '#',
                                        },
                                        content: str
                                    };
                                });
                                var valV = dropV.getValue();
                                dropV.setOptions(vOptions);
                                if (valV && res.indexOf(valV) === -1) {
                                    dropV.setValue('', Messages.form_condition_v);
                                    dropV.onChange.fire();
                                    dropV.find('button').removeClass('btn-default')
                                        .addClass('btn-secondary');
                                }
                            });
                        } else {
                            // We don't have invalid condition but we may have incomplete
                            // conditions to delete
                            block.opts.when = [];
                            $condition.find('.cp-form-condition-rule').remove();
                        }
                    }
                };
                updateState();

                return {
                    updateState: updateState,
                    tag: tag,
                    noViewMode: true,
                    getCursor: cursorGetter,
                };
            },
            printResults: function () { return; },
            icon: h('i.cptools.cptools-form-conditional')
        },
    };

    var arrayMax = function (A) {
        return Array.isArray(A)? Math.max.apply(null, A): NaN;
    };

    var renderTally = function (tally, empty, showBar) {
        var rows = [];
        var counts = Util.values(tally);
        var max = arrayMax(counts);
        if (empty) { rows.push(getEmpty(empty)); }
        Object.keys(tally).forEach(function (value) {
            var itemCount = tally[value];
            var itemScale = (itemCount / max);

            rows.push(h('div.cp-charts-row', [
                h('span.cp-value', {'title': value}, value),
                h('span.cp-count', itemCount),
                showBar? barGraphic(itemScale): undefined,
            ]));
        });
        return rows;
    };

    var getSortedKeys = function (answers) {
        return Object.keys(answers).sort(function (uid1, uid2) {
            return (answers[uid1].time || 0) - (answers[uid2].time || 0);
        });
    };

    var TYPES = APP.TYPES = {
        input: {
            defaultOpts: {
                type: 'text'
            },
            get: function (opts, a, n, evOnChange) {
                if (!opts) { opts = Util.clone(TYPES.input.defaultOpts); }
                // Messages.form_input_ph_email.form_input_ph_url
                var tag = h('input', {
                    type: opts.type,
                    step: "any",
                    placeholder: Messages['form_input_ph_'+opts.type] || ''
                });
                var $tag = $(tag);
                $tag.on('change keypress keydown', Util.throttle(function () {
                    evOnChange.fire();
                }, 500));
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    isEmpty: function () { return !$tag.val().trim(); },
                    getValue: function () {
                        //var invalid = $tag.is(':invalid');
                        //if (invalid) { return; }
                        return $tag.val();
                    },
                    setValue: function (val) { $tag.val(val); },
                    setEditable: function (state) {
                        if (state) { $tag.removeAttr('disabled'); }
                        else { $tag.attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editTextOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    reset: function () { $tag.val(''); }
                };
            },
            printResults: function (answers, uid) { // results text
                var results = [];
                var empty = 0;
                var tally = {};

                var isEmpty = function (answer) {
                    return !answer || !answer.trim();
                };

                getSortedKeys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (isEmpty(answer)) { return empty++; }
                    Util.inc(tally, answer);
                });
                //var counts = Util.values(tally);
                //var max = arrayMax(counts);

                //if (max < 2) { // there are no duplicates, so just return text
                    results.push(getEmpty(empty));
                    getSortedKeys(answers).forEach(function (author) {
                        var obj = answers[author];
                        var answer = obj.msg[uid];
                        if (!answer || !answer.trim()) { return empty++; }
                        results.push(h('div.cp-charts-row', h('span.cp-value', answer)));
                    });
                    return h('div.cp-form-results-contained', h('div.cp-charts.cp-text-table', results));
                //}
            },
            icon: h('i.cptools.cptools-form-text')
        },
        textarea: {
            defaultOpts: {
                maxLength: 1000
            },
            get: function (opts, a, n, evOnChange) {
                if (!opts || typeof(opts.maxLength) === "undefined") { opts = Util.clone(TYPES.textarea.defaultOpts); }
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
                    isEmpty: function () { return !$text.val().trim(); },
                    getValue: function () { return $text.val().slice(0, opts.maxLength); },
                    setValue: function (val) {
                        $text.val(val);
                        updateChar();
                    },
                    setEditable: function (state) {
                        if (state) { $(tag).find('textarea').removeAttr('disabled'); }
                        else { $(tag).find('textarea').attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editTextOptions(v, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    reset: function () { $text.val(''); }
                };
            },
            printResults: function (answers, uid) { // results textarea
                var results = [];
                var empty = 0;
                getSortedKeys(answers).forEach(function (author) { // TODO deduplicate these
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !answer.trim()) { return empty++; }
                    results.push(h('div.cp-charts-row', h('span.cp-value', answer)));
                });
                results.unshift(getEmpty(empty));

                return h('div.cp-form-results-contained', h('div.cp-charts.cp-text-table', results));
            },
            icon: h('i.cptools.cptools-form-paragraph')
        },
        radio: {
            compatible: ['radio', 'checkbox', 'sort'],
            defaultOpts: {
                values: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, a, n, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.radio.defaultOpts); }
                if (!Array.isArray(opts.values)) { return; }
                var name = Util.uid();
                var els = extractValues(opts.values).map(function (data, i) {
                    var radio = UI.createRadio(name, 'cp-form-'+name+'-'+i,
                               data, false, {});
                    $(radio).find('input').data('val', data);
                    return radio;
                });
                var tag = h('div.radio-group.cp-form-type-radio', els);
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                $(tag).find('input[type="radio"]').on('change', function () {
                    evOnChange.fire(false, false, true);
                });
                return {
                    tag: tag,
                    isEmpty: function () { return !this.getValue(); },
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
                    setEditable: function (state) {
                        if (state) { $(tag).find('input').removeAttr('disabled'); }
                        else { $(tag).find('input').attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
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
            printResults: function (answers, uid, form, content) {
                // results radio
                var empty = 0;
                var count = {};

                var opts = form[uid].opts || Util.clone(TYPES.radio.defaultOpts);
                extractValues(opts.values).forEach(function (v) { count[v] = 0; });

                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !answer.trim || !answer.trim()) { return empty++; }
                    Util.inc(count, answer);
                });

                var showBars = Boolean(content);
                var rendered = renderTally(count, empty, showBars);
                return h('div.cp-charts.cp-bar-table', rendered);
            },
            icon: h('i.cptools.cptools-form-list-radio')
        },
        multiradio: {
            compatible: ['multiradio', 'multicheck'],
            defaultOpts: {
                items: [1,2].map(function (i) {
                    return {
                        //uid: Util.uid(),
                        v: Messages._getKey('form_defaultItem', [i])
                    };
                }),
                values: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, a, n, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.multiradio.defaultOpts); }
                if (!Array.isArray(opts.items) || !Array.isArray(opts.values)) { return; }
                var lines = opts.items.map(function (itemData) {
                    if (!itemData.uid) {
                        itemData.uid = Util.uid();
                        if (APP.isEditor) { APP.framework.localChange(); }
                    }
                    var name = itemData.uid;
                    var item = itemData.v;
                    var els = extractValues(opts.values).map(function (data, i) {
                        var radio = UI.createRadio(name, 'cp-form-'+name+'-'+i,
                                   '', false, {});
                        $(radio).find('input').data('uid', name);
                        $(radio).find('input').data('val', data);
                        return radio;
                    });
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    return h('div.radio-group', {'data-uid':name}, els);
                });
                var header = extractValues(opts.values).map(function (v) {
                    return h('span', {
                        title: Util.fixHTML(v)
                    }, v);
                });
                header.unshift(h('span'));
                var elh = h('span');
                elh.innerHTML = '&nbsp;';
                header.unshift(elh);
                lines.unshift(h('div.cp-form-multiradio-header', header));

                var tag = h('div.cp-form-multiradio-container',
                            h('div.radio-group.cp-form-type-multiradio', lines)
                          );
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                var $tag = $(tag);
                $tag.find('input[type="radio"]').on('change', function () {
                    evOnChange.fire();
                });
                return {
                    tag: tag,
                    isEmpty: function () {
                        var v = this.getValue();
                        return !Object.keys(v).length || Object.keys(v).some(function (uid) {
                            return !v[uid];
                        });
                    },
                    getValue: function () {
                        var res = {};
                        var l = lines.slice(1);
                        l.forEach(function (el) {
                            var $el = $(el);
                            var uid = $el.attr('data-uid');
                            $el.find('input').each(function (i, input) {
                                var $i = $(input);
                                if (res[uid]) { return; }
                                res[uid] = undefined;
                                if (Util.isChecked($i)) { res[uid] = $i.data('val'); }
                            });
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    setEditable: function (state) {
                        if (state) { $tag.find('input').removeAttr('disabled'); }
                        else { $tag.find('input').attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
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
            printResults: function (answers, uid, form, content) {
                // results multiradio
                var structure = form[uid];
                if (!structure) { return; }
                var opts = structure.opts || Util.clone(TYPES.multiradio.defaultOpts);
                var results = [];
                var empty = 0;
                var count = {};

                var showBars = Boolean(content);
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (!answer || !Object.keys(answer).length) { return empty++; }
                    //count[answer] = count[answer] || {};
                    Object.keys(answer).forEach(function (q_uid) {
                        var c = count[q_uid];
                        if (!c) {
                            count[q_uid] = c = {};
                            extractValues(opts.values).forEach(function (v) { c[v] = 0; });
                        }
                        var res = answer[q_uid];
                        if (!res || !res.trim || !res.trim()) { return; }
                        Util.inc(c, res);
                    });
                });

                var max = 0;
                var count_keys = Object.keys(count);
                count_keys.forEach(function (q_uid) {
                    var counts = Object.values(count[q_uid]);
                    counts.push(max);
                    max = arrayMax(counts);
                });

                results.push(getEmpty(empty));
                count_keys.forEach(function (q_uid) {
                    var q = findItem(opts.items, q_uid);
                    var c = count[q_uid];
                    results.push(multiAnswerSubHeading(q));
                    Object.keys(c).forEach(function (res) {
                        results.push(barRow(res, c[res], max, showBars));
                    });
                });

                return h('div.cp-charts.cp-bar-table', results);
            },
            exportCSV: function (answer, form) {
                var opts = form.opts || {};
                var q = form.q || Messages.form_default;
                if (answer === false) {
                    return (opts.items || []).map(function (obj) {
                        return q + ' | ' + obj.v;
                    });
                }
                if (!answer) { return ['']; }
                return (opts.items || []).map(function (obj) {
                    var uid = obj.uid;
                    return String(answer[uid] || '');
                });
            },
            icon: h('i.cptools.cptools-form-grid-radio')
        },
        date: {
            defaultOpts: {
                type: 'date',
            },
            get: function (opts, a, n, evOnChange) {
                opts = Util.clone(TYPES.date.defaultOpts);

                var tag = h('input');

                var picker = Flatpickr(tag, {
                    disableMobile: true,
                    enableTime: true,
                    time_24hr: is24h,
                    dateFormat: dateFormat,
                });

                var $tag = $(tag);
                $tag.on('change keypress', Util.throttle(function () {
                    evOnChange.fire();
                }, 500));


                return {
                    tag: tag,
                    isEmpty: function () { return !$tag.val().trim(); },
                    getValue: function () {
                        var d = DatePicker.parseDate(tag.value);
                        return +d;
                    },
                    setValue: function (val) {
                        picker.setDate(new Date(val), false);
                    },
                    setEditable: function (state) {
                        if (state) { $tag.removeAttr('disabled'); }
                        else { $tag.attr('disabled', 'disabled'); }
                    },
                    edit: function (cb) {

                        return editDateOptions(cb);
                    },
                    reset: function () { $tag.val(''); }
                };
            },
            printResults: function (answers, uid) { // results text
                var results = [];
                var empty = 0;

                var isEmpty = function (answer) {
                    return !answer;
                };

                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (isEmpty(answer)) { return empty++; }
                });
                results.push(getEmpty(empty));

                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = Flatpickr.formatDate(new Date(obj.msg[uid]), dateFormat);
                    if (isEmpty(answer)) { return empty++; }
                    results.push(h('div.cp-charts-row', h('span.cp-value', answer)));
                });
                return h('div.cp-form-results-contained', h('div.cp-charts.cp-text-table', results));
            },
            exportCSV: function (answer, form) {
                if (answer === false) { return [form.q]; }
                return answer ? [new Date(answer).toISOString()]
                              : [''];
            },
            icon: h('i.cp-calendar-active.fa.fa-calendar')
        },
        checkbox: {
            compatible: ['radio', 'checkbox', 'sort'],
            defaultOpts: {
                max: 3,
                values: [1, 2, 3].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, a, n, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.checkbox.defaultOpts); }
                if (!Array.isArray(opts.values)) { return; }
                var name = Util.uid();
                var els = extractValues(opts.values).map(function (data, i) {
                    var cbox = UI.createCheckbox('cp-form-'+name+'-'+i,
                               data, false, {});
                    $(cbox).find('input').data('val', data);
                    return cbox;
                });
                if (!opts.max) { opts.max = TYPES.checkbox.defaultOpts.max; }
                var tag = h('div', [
                    h('div.cp-form-max-options', Messages._getKey('form_maxOptions', [opts.max])),
                    h('div.radio-group.cp-form-type-checkbox', els)
                ]);
                var $tag = $(tag);
                var checkDisabled = function () {
                    var selected = $tag.find('input:checked').length;
                    if (selected >= opts.max) {
                        $tag.find('input:not(:checked)').attr('disabled', 'disabled');
                    } else {
                        $tag.find('input').removeAttr('disabled');
                    }
                };
                $tag.find('input').on('change', function () {
                    checkDisabled();
                    evOnChange.fire(false, false, true);
                });
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    isEmpty: function () {
                        var v = this.getValue();
                        return !v.length;
                    },
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
                    reset: function () {
                        $(tag).find('input').removeAttr('checked');
                        checkDisabled();
                    },
                    setEditable: function (state) {
                        if (state) { checkDisabled(); }
                        else { $tag.find('input').attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
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
                        checkDisabled();
                    }
                };

            },
            printResults: function (answers, uid, form, content) {
                // results checkbox
                var empty = 0;
                var count = {};

                var opts = form[uid].opts || Util.clone(TYPES.checkbox.defaultOpts);
                extractValues(opts.values || []).forEach(function (v) { count[v] = 0; });

                var showBars = Boolean(content);
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (answer && typeof(answer) === "string") { answer = [answer]; }
                    if (!Array.isArray(answer) || !answer.length) { return empty++; }
                    answer.forEach(function (val) {
                        Util.inc(count, val);
                    });
                });

                var rendered = renderTally(count, empty, showBars);
                return h('div.cp-charts.cp-bar-table', rendered);
            },
            icon: h('i.cptools.cptools-form-list-check')
        },
        multicheck: {
            compatible: ['multiradio', 'multicheck'],
            defaultOpts: {
                max: 3,
                items: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultItem', [i])
                    };
                }),
                values: [1,2,3].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, a, n, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.multicheck.defaultOpts); }
                if (!Array.isArray(opts.items) || !Array.isArray(opts.values)) { return; }
                var lines = opts.items.map(function (itemData) {
                    var name = itemData.uid;
                    var item = itemData.v;
                    var els = extractValues(opts.values).map(function (data, i) {
                        var cbox = UI.createCheckbox('cp-form-'+name+'-'+i,
                                   '', false, {});
                        $(cbox).find('input').data('uid', name);
                        $(cbox).find('input').data('val', data);
                        return cbox;
                    });
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    els.unshift(h('div.cp-form-multiradio-item', item));
                    return h('div.radio-group', {'data-uid':name}, els);
                });

                if (!opts.max) { opts.max = TYPES.multicheck.defaultOpts.max; }

                var checkDisabled = function (l) {
                    var selected = $(l).find('input:checked').length;
                    if (selected >= opts.max) {
                        $(l).find('input:not(:checked)').attr('disabled', 'disabled');
                    } else {
                        $(l).find('input').removeAttr('disabled');
                    }
                };

                lines.forEach(function (l) {
                    $(l).find('input').on('change', function () {
                        checkDisabled(l);
                        evOnChange.fire();
                    });
                });

                var header = extractValues(opts.values).map(function (v) {
                    return h('span', {
                        title: Util.fixHTML(v)
                    }, v);
                });
                header.unshift(h('span'));
                var elh = h('span');
                elh.innerHTML = '&nbsp;';
                header.unshift(elh);
                lines.unshift(h('div.cp-form-multiradio-header', header));

                var tag = h('div.cp-form-multiradio-container',
                            h('div.radio-group.cp-form-type-multiradio', lines)
                          );
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };
                return {
                    tag: tag,
                    isEmpty: function () {
                        var v = this.getValue();
                        return Object.keys(v).some(function (uid) {
                            return !v[uid].length;
                        });
                    },
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
                    reset: function () {
                        $(tag).find('input').removeAttr('checked');
                        lines.forEach(checkDisabled);
                    },
                    setEditable: function (state) {
                        if (state) { lines.forEach(checkDisabled); }
                        else { $(tag).find('input').attr('disabled', 'disabled'); }
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
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
                        lines.forEach(checkDisabled);
                    }
                };

            },
            printResults: function (answers, uid, form, content ) {
                // results multicheckbox
                var structure = form[uid];
                if (!structure) { return; }
                var opts = structure.opts || Util.clone(TYPES.multicheck.defaultOpts);
                var results = [];
                var empty = 0;
                var count = {};
                var showBars = Boolean(content);

                var isEmpty = function (answer) {
                    if (!answer) { return true; }
                    return !Object.keys(answer).some(function (k) {
                        var A = answer[k];
                        return Array.isArray(A) && A.length;
                    });
                };

                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (isEmpty(answer)) { return empty++; }
                    Object.keys(answer).forEach(function (q_uid) {
                        var c = count[q_uid];
                        if (!c) {
                            count[q_uid] = c = {};
                            extractValues(opts.values || []).forEach(function (v) { c[v] = 0; });
                        }
                        var res = answer[q_uid];
                        if (res && typeof(res) === "string") { res = [res]; }
                        if (!Array.isArray(res) || !res.length) { return; }
                        res.forEach(function (v) {
                            Util.inc(c, v);
                        });
                    });
                });

                var max = 0;
                var count_keys = Object.keys(count);
                count_keys.forEach(function (q_uid) {
                    var counts = Object.values(count[q_uid]);
                    counts.push(max);
                    max = arrayMax(counts);
                });

                results.push(getEmpty(empty));
                count_keys.forEach(function (q_uid) {
                    var q = findItem(opts.items, q_uid);
                    var c = count[q_uid];
                    results.push(multiAnswerSubHeading(q));
                    Object.keys(c).forEach(function (res) {
                        results.push(barRow(res, c[res], max, showBars));
                    });
                });

                return h('div.cp-charts.cp-bar-table', results);
            },
            exportCSV: function (answer, form) {
                var opts = form.opts || {};
                var q = form.q || Messages.form_default;
                if (answer === false) {
                    return (opts.items || []).map(function (obj) {
                        return q + ' | ' + obj.v;
                    });
                }
                if (!answer) { return ['']; }
                return (opts.items || []).map(function (obj) {
                    var uid = obj.uid;
                    return String(answer[uid] || '');
                });
            },
            icon: h('i.cptools.cptools-form-grid-check')
        },
        sort: {
            compatible: ['radio', 'checkbox', 'sort'],
            defaultOpts: {
                values: [1,2].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, a, n, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.sort.defaultOpts); }
                if (!Array.isArray(opts.values)) { return; }
                var map = {};
                var invMap = {};
                var sorted = false;
                if (!APP.isEditor) {
/*  There is probably a more reliable check for this, but if we always
    shuffle the values then authors reorder the results in the data structure
    every time they reload. If multiple authors are present then this leads
    to fights over what the content should be, which tends to trick chainpad
    into concatenating strings, which quickly turns the sortable list
    into complete nonsense.
*/
                    Util.shuffleArray(opts.values);
                }
                var els = extractValues(opts.values).map(function (data) {
                    var uid = Util.uid();
                    map[uid] = data;
                    invMap[data] = uid;
                    var div = h('div.cp-form-type-sort', {'data-id': uid}, [
                        h('span.cp-form-handle', [
                            h('i.fa.fa-ellipsis-v'),
                            h('i.fa.fa-ellipsis-v'),
                        ]),
                        h('span.cp-form-sort-order', '?'),
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
                var reorder = function (reset) {
                    $tag.find('.cp-form-type-sort').each(function (i, el) {
                        $(el).find('.cp-form-sort-order').text(reset ? '?' : i+1);
                    });
                    sorted = !reset;
                };
                var cursorGetter;
                var setCursorGetter = function (f) { cursorGetter = f; };

                var sortable = Sortable.create(tag, {
                    direction: "vertical",
                    draggable: ".cp-form-type-sort",
                    forceFallback: true,
                    store: {
                        set: function () {
                            reorder();
                            evOnChange.fire();
                        }
                    }
                });
                var sortNode = function (order) {
                    order.forEach(function (uid) {
                        $tag.append($tag.find('[data-id="'+uid+'"]'));
                    });
                };

                return {
                    tag: tag,
                    isEmpty: function () { return !this.getValue(); },
                    getValue: function () {
                        if (!sorted) { return; }
                        return sortable.toArray().map(function (id) {
                            return map[id];
                        });
                    },
                    reset: function () {
                        Util.shuffleArray(opts.values);
                        var toSort = extractValues(opts.values).map(function (val) {
                            return invMap[val];
                        });
                        sortNode(toSort);
                        reorder(true);
                    },
                    setEditable: function (state) {
                        sortable.options.disabled = !state;
                        $(tag).toggleClass('cp-form-disabled', !state);
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
                    },
                    getCursor: function () { return cursorGetter(); },
                    setValue: function (val) {
                        if (!Array.isArray(val)) { val = []; }
                        var toSort = val.map(function (val) {
                            return invMap[val];
                        });
                        sortNode(toSort);
                        reorder();
                    },

                };

            },
            printResults: function (answers, uid, form, content) {
                // results sort
                var opts = form[uid].opts || Util.clone(TYPES.sort.defaultOpts);
                var l = (opts.values || []).length;
                var empty = 0;
                var count = {};
                extractValues(opts.values || []).forEach(function (v) { count[v] = 0; });
                var showBars = Boolean(content);
                Object.keys(answers).forEach(function (author) {
                    var obj = answers[author];
                    var answer = obj.msg[uid];
                    if (answer && typeof(answer) === "string") { answer = [answer]; }
                    if (!Array.isArray(answer) || !answer.length) { return empty++; }
                    answer.forEach(function (el, i) {
                        var score = l - i;
                        Util.inc(count, el, score);
                    });
                });
                var rendered = renderTally(count, empty, showBars);
                return h('div.cp-charts.cp-bar-table', rendered);
            },
            icon: h('i.cptools.cptools-form-list-ordered')
        },
        poll: {
            defaultOpts: {
                type: 'text', // Text or Days or Time
                values: [1, 2, 3].map(function (i) {
                    return {
                        uid: Util.uid(),
                        v: Messages._getKey('form_defaultOption', [i])
                    };
                })
            },
            get: function (opts, answers, username, evOnChange) {
                var isDefaultOpts = !opts;
                if (!opts) { opts = Util.clone(TYPES.poll.defaultOpts); }
                if (!Array.isArray(opts.values)) { return; }

                if (APP.isEditor) { answers = {}; }
                var lines = makePollTable(answers, opts, false);

                var disabled = false;
                // Add form
                var addLine = extractValues(opts.values).map(function (data) {
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
                        if (disabled) { return; }
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
                    setEditable: function (state) {
                        disabled = !state;
                        $tag.toggleClass('cp-form-disabled', disabled);
                    },
                    edit: function (cb, tmp) {
                        var v = Util.clone(opts);
                        return editOptions(v, isDefaultOpts, setCursorGetter, cb, tmp);
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
            printResults: function (answers, uid, form, content) {
                var opts = form[uid].opts || Util.clone(TYPES.poll.defaultOpts);
                var _answers = getBlockAnswers(answers, uid);

                // If content is defined, we'll be able to click on a row to display
                // all the answers of this user
                var lines = makePollTable(_answers, opts, content);

                var total = makePollTotal(_answers, opts);
                if (total) { lines.push(h('div', total)); }

                return h('div.cp-form-type-poll', lines);
            },
            exportCSV: function (answer, form) {
                var opts = form.opts || Util.clone(TYPES.poll.defaultOpts);
                var q = form.q || Messages.form_default;
                if (answer === false) {
                    var cols = extractValues(opts.values).map(function (key) {
                        if (opts.type === 'time') {
                            return q + ' | ' + new Date(+key).toISOString();
                        }
                        return q + ' | ' + key;
                    });
                    return cols;
                }
                if (!answer || !answer.values) {
                    var empty = opts.values.map(function () { return ''; });
                    empty.unshift('');
                    return empty;
                }
                var res = extractValues(opts.values).map(function (key) {
                    return answer.values[key] || '';
                });
                return res;
            },
            icon: h('i.cptools.cptools-form-poll')
        },
    };

    var getDay = function (d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    };

    var ONE_DAY = 1000 *  60 * 60 * 24;

    var getDayArray = function (a, b) {
        // coerce inputs to numbers
        var r_a = +getDay(new Date(a));
        var r_b = +getDay(new Date(b));
        var A = [ r_a ];
        var next = r_a + ONE_DAY;
        while (next <= r_b) {
            A.push(next);
            next += ONE_DAY;
        }
        return A;
    };

    Messages.form_timelineLabel = "{0} ({1})"; // TODO investigate whether this needs translation

    var makeTimeline = APP.makeTimeline = function (answers) {
        // Randomly changing date of answers to get a more realistic example of timeline
        var tally = {};

        //var answersByTime = {};
        Object.keys(answers).forEach(function (curve) {
            var obj = answers[curve];
            Object.keys(obj).forEach(function (uid) {
                var day = getDay(new Date(obj[uid].time));
                Util.inc(tally, +day);
            });
        });

        var times = Object.keys(tally).map(Number).filter(Boolean);

        var max_count = arrayMax(Util.values(tally));

        var min_day = Math.min.apply(null, times);
        var max_day = arrayMax(times);
        var days = getDayArray(new Date(min_day), new Date(max_day));

        if (days.length < 2) { return; }

        return h('div.timeline-container', {
            //style: 'width: 100%; height: 200px;',


        }, h('table.cp-charts.column.cp-chart-timeline.cp-chart-table',
                h('tbody', days.map(function (time) {
                    var count = tally[time] || 0;
                    var percent = count / max_count;
                    var date = new Date(time).toLocaleDateString();

                    var bar = h('td', {
                        style: '--size: ' + Number(percent).toFixed(2),
                        //"data-tippy-placement": "top",
                        title: Messages._getKey('form_timelineLabel', [date, count])
                    });
                    //var dateEl = h('th', { scope: "row" }, date);

                    return h('tr', bar/* dateEl*/ );
                }))
            )
        );
    };

    var parseAnswers = function (answers) {
        var _answers = {};
        Object.keys(answers || {}).forEach(function (curve) {
            var all = answers[curve];
            Object.keys(all || {}).forEach(function (uid) {
                _answers[curve + '|' + uid] = all[uid];
            });
        });
        return _answers;
    };

    var getAnswersLength = function (answers) {
        return Object.values(answers || {}).reduce(function (size, obj) {
            return size + Object.keys(obj).length;
        }, 0);
    };

    var renderResults = APP.renderResults = function (content, answers, showUser) {
        var $container = $('div.cp-form-creator-results').empty().css('display', '');

        var framework = APP.framework;

        var title = framework._.title.title || framework._.title.defaultTitle;
        var titleDiv = h('h1.cp-form-view-title', title);
        $container.append(titleDiv);

        var answerCount = getAnswersLength(answers);

        if (!answerCount) {
            $container.append(h('div.alert.alert-info', Messages.form_results_empty));
            return;
        }

        var heading = h('h2#cp-title', Messages._getKey('form_totalResponses', [answerCount]));
        $(heading).appendTo($container);
        var timeline = h('div.cp-form-creator-results-timeline');
        var $timeline = $(timeline).appendTo($container);
        $timeline.append(makeTimeline(answers));
        var controls = h('div.cp-form-creator-results-controls');
        var $controls = $(controls).appendTo($container);
        var results = h('div.cp-form-creator-results-content');
        var $results = $(results).appendTo($container);

        var options = [{
            tag: 'a',
            attributes: {'class': 'cp-form-export-csv fa fa-table'},
            content: h('span', Messages.form_exportCSV),
            action: function () {
                var csv = Exporter.results(content, answers, TYPES, getFullOrder(content));
                if (!csv) { return void UI.warn(Messages.error); }
                var suggestion = APP.framework._.title.suggestTitle('cryptpad-document');
                var title = Util.fixFileName(suggestion) + '.csv';
                window.saveAs(new Blob([csv], {
                    type: 'text/csv'
                }), title);
            },
        }, {
            tag: 'a',
            attributes: {'class': 'cp-form-export-json cptools cptools-code'},
            content: h('span', Messages.form_exportJSON),
            action: function () {
                var arr = Exporter.results(content, answers, TYPES, getFullOrder(content), "json");
                if (!arr) { return void UI.warn(Messages.error); }
                window.saveAs(new Blob([arr], {
                    type: 'application/json'
                }), title+".json");
            },
        }];
        var dropdownExport = {
            buttonContent: [
                h('i.fa.fa-download'),
                h('span', Messages.exportButton)
            ],
            buttonCls: 'btn btn-primary',
            options: options, // Entries displayed in the menu
            common: framework._.sfCommon
        };
        var $exp = UIElements.createDropdown(dropdownExport);
        $exp.appendTo($controls);

        // Export in "sheet"
        var export2Button = h('button.btn.btn-primary', [
            h('i.fa.fa-file-excel-o'),
            Messages.form_exportSheet
        ]);
        $(export2Button).appendTo($controls);
        $(export2Button).click(function () {
            var arr = Exporter.results(content, answers, TYPES, getFullOrder(content), "array");
            if (!arr) { return void UI.warn(Messages.error); }
            var sframeChan = framework._.sfCommon.getSframeChannel();
            var title = framework._.title.title || framework._.title.defaultTitle;
            sframeChan.event('EV_EXPORT_SHEET', {
                title: title,
                content: arr
            });
        });

        APP.common.getPadMetadata({channel: content.answers.channel}, function (md) {
            var owners = md.owners;
            if (!Array.isArray(owners) || !owners.length) { return; }
            var owned = APP.common.isOwned(owners);
            if (!owned) { return; }
            var button = h('button.btn.btn-danger.cp-form-results-delete', Messages.form_deleteAll);
            UI.confirmButton(button, {classes:'danger'}, function () {
                var sframeChan = framework._.sfCommon.getSframeChannel();
                sframeChan.query('Q_FORM_DELETE_ALL_ANSWERS', {
                    channel: content.answers.channel,
                    teamId: typeof(owned) === "number" ? owned : undefined
                }, function (err, obj) {
                    if (err || (obj && obj.error)) { return void UI.warn(Messages.error); }
                    APP.getResults();
                });
            });
            $controls.append(button);
        });

        var summary = true;
        var form = content.form;

        var switchMode = h('button.btn.btn-secondary', Messages.form_showIndividual);
        $controls.hide().append(switchMode);


        var show = function (answers, header) {

            var order = getFullOrder(content);
            var elements = order.map(function (uid) {
                var block = form[uid];
                var type = block.type;
                var model = TYPES[type];
                if (!model || !model.printResults) { return; }

                // Only use content if we're not viewing individual answers
                var _answers = parseAnswers(answers);
                var print = model.printResults(_answers, uid, form, !header && {
                    content: content,
                    answers: answers
                });


                var showCondorcetWinner = function(answers, opts, condorcetMethod, uid) {

                    var _answers = parseAnswers(answers);

                    var optionArray = [];
                    opts.values.forEach(function (option) {
                        optionArray.push(option.v);
                    });

                    var listOfLists = [];
                    Object.keys(_answers).forEach(function(a) {
                        if (_answers[a].msg[uid]) {
                            listOfLists.push(_answers[a].msg[uid]);
                        }
                    });
                    try {
                        if (listOfLists.length) {
                            return Condorcet.showCondorcetWinner(condorcetMethod, optionArray, listOfLists);
                        }
                    } catch (e) {
                        console.error(e);
                        return [];
                    }
                };

                var condorcetWinnerDiv = h('div.cp-form-block-content');
                var condorcetMethod = 'schulze';
                try {
                if (type === "sort" && summary) {
                    var calculateCondorcet = function() {
                        var condorcetResults = h('span');
                        var c = showCondorcetWinner(answers, block.opts, condorcetMethod, uid);
                        if (!c) { return; }
                        var condorcetWinner = c[0];
                        var rankedResults = c[1];
                        if (!condorcetWinner || !condorcetResults) { return; }
                        if (condorcetWinner.length > 1) {
                            condorcetResults.append(h('span', condorcetWinner.join(', ')));
                        } else if (condorcetWinner.length === 1 ) {
                            condorcetResults.append(h('span', condorcetWinner));
                        } else {
                            condorcetResults.append(h('span', Messages.form_noCondorcetWinner));
                        }
                        var detailedResults = rankedResults.reverse().map(function(result) {
                            if (result.length > 1) {
                                return result[1].join(', ') + ' : ' + result[0];
                            } else {
                                return result[1] + ' : ' + result[0];
                            }
                        });
                        return [condorcetResults, detailedResults];
                    };

                    var dropdownOpts = [{
                        key: 'schulze',
                        str: Messages.form_condorcetSchulze
                    }, {
                        key: 'ranked',
                        str: Messages.form_condorcetRanked
                    }];

                    var options = dropdownOpts.map(function (t) {
                        return {
                            tag: 'a',
                            attributes: {
                                'class': 'cp-form-type-value',
                                'data-value': t.key,
                                'href': '#',
                            },
                            content: t.str
                        };
                    });
                    var dropdownConfig = {
                        text: '', // Button initial text
                        options: options,
                        isSelect: true,
                        caretDown: true,
                        buttonCls: 'btn btn-secondary'
                    };
                    var typeSelect = UIElements.createDropdown(dropdownConfig);
                    typeSelect.setValue(condorcetMethod);
                    var evOnChange = Util.mkEvent();
                    typeSelect.onChange.reg(evOnChange.fire);

                    var method = h('div.cp-dropdown-container', typeSelect[0]);

                    condorcetWinnerDiv = h('div.cp-form-edit-type');
                    var detailsContainer, condorcetWinner;

                    var condorcetResult = calculateCondorcet();
                    if (condorcetResult) {
                        condorcetWinner = h('span#cp-condorcet-winner', condorcetResult[0]);
                        detailsContainer = h('details#cp-condorcet-details', [
                            h('summary', Messages.form_showDetails),
                            Messages.form_condorcetExtendedDisplay,
                            h('div', condorcetResult[1].join(', '))
                        ]);
                    }

                    evOnChange.reg(function () {
                        $('#cp-condorcet-winner').empty();
                        $('#cp-condorcet-details').empty();
                        condorcetMethod = typeSelect.getValue();
                        var condorcetResult = calculateCondorcet();
                        if (!condorcetResult || !condorcetResult[0] || !condorcetResult[1]) {
                            return;
                        }
                        $('#cp-condorcet-winner').replaceWith(h('span#cp-condorcet-winner', condorcetResult[0]));
                        $('#cp-condorcet-details').replaceWith(h('details#cp-condorcet-details', [
                            h('summary', Messages.form_showDetails),
                            Messages.form_condorcetExtendedDisplay,
                            h('div', condorcetResult[1].join(', '))
                        ]));
                    });

                    condorcetWinnerDiv.append(h('div.cp-form-result-details', [
                        h('span', Messages.form_showCondorcetMethod),
                        method,
                        h('span', Messages.form_showCondorcetWinner, condorcetWinner),
                        detailsContainer
                    ]));

                }
                } catch (err) {
                    console.error(err);
                }


                var q = h('div.cp-form-block-question', block.q || Messages.form_default);
//Messages.form_type_checkbox.form_type_input.form_type_md.form_type_multicheck.form_type_multiradio.form_type_poll.form_type_radio.form_type_sort.form_type_textarea.form_type_section.form_type_date
                return h('div.cp-form-block', [
                    h('div.cp-form-block-type', [
                        TYPES[type].icon.cloneNode(),
                        h('span', Messages['form_type_'+type])
                    ]),
                    q,
                    h('div.cp-form-block-content', print),
                    condorcetWinnerDiv,
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

            var els = [];

            // Get all responses
            var allUnsorted = {};
            Object.keys(answers).forEach(function (curve) {
                var userAnswers = answers[curve];
                Object.keys(userAnswers).forEach(function (uid) {
                    allUnsorted[curve + '|' + uid] = userAnswers[uid];
                });
            });
            // Sort them by date and print
            getSortedKeys(allUnsorted).forEach(function (curveUid) {
                var obj = allUnsorted[curveUid];
                var uid = curveUid.split('|')[1];
                var curve = curveUid.split('|')[0];
                var answer = obj.msg;
                var date = new Date(obj.time).toLocaleString();
                var text, warning, badge;
                if (!answer._userdata || (!answer._userdata.name && !answer._userdata.curvePublic)) {
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
                    res[curve] = {};
                    res[curve][uid] = obj;
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
                if (showUser === curve) {
                    setTimeout(function () {
                        showUser = undefined;
                        $(viewButton).click();
                    });
                }
                els.push(div);
            });
            $results.append(els);
        });
        if (showUser) {
            $s.click();
        }
    };

    var addResultsButton = function (framework, content, answers) {
        var sframeChan = framework._.sfCommon.getSframeChannel();
        var $container = $('.cp-forms-results-participant');
        var l = getAnswersLength(answers);
        var $res = $(h('button.btn.btn-default.cp-toolbar-form-button', [
            h('i.fa.fa-bar-chart'),
            h('span.cp-button-name', Messages._getKey('form_results', [l])),
        ]));
        var it = setInterval(function () {
            sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                var answers = obj && obj.results;
                var l = getAnswersLength(answers);
                $res.find('span.cp-button-name').text(Messages._getKey('form_results', [l]));
            });
        }, 30000);
        $res.click(function () {
            $res.attr('disabled', 'disabled');
            sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                var answers = obj && obj.results;
                if (answers) { APP.answers = answers; }
                $res.removeAttr('disabled');
                $('body').addClass('cp-app-form-results');
                renderResults(content, answers);
                $res.remove();
                clearInterval(it);
                var $editor = $(h('button.btn.btn-default', [
                    h('i.fa.fa-pencil'),
                    h('span.cp-button-name', Messages.form_editor)
                ]));
                $editor.click(function () {
                    $('body').removeClass('cp-app-form-results');
                    $editor.remove();
                    sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                        var answers = obj && obj.results;
                        addResultsButton(framework, content, answers);
                    });
                });
                $container.prepend($editor);
            });

        });
        $container.prepend($res);
    };

    var getLogo = function () {
        var logo = h('div.cp-form-view-logo', [
            h('img', {
                src:'/customize/CryptPad_logo_grey.svg?'+ApiConfig.requireConf.urlArgs,
                alt:'CryptPad_logo'
            }),
            h('span', 'CryptPad')
        ]);
        $(logo).click(function () {
            APP.framework._.sfCommon.gotoURL('/');
        });
        var footer = h('div.cp-form-view-footer', [logo]);
        return footer;
    };

    var updateForm;
    var showAnsweredPage = function (framework, content, answers) {
        var $formContainer = $('div.cp-form-creator-content').hide();
        var $resContainer = $('div.cp-form-creator-results').hide();
        var $container = $('div.cp-form-creator-answered').empty().css('display', '');
        APP.inAnsweredPage = true;

        if (APP.answeredInForm) {
            $container.hide();
            $formContainer.css('display', '');
        } else if (APP.answeredInResponses) {
            $container.hide();
            $resContainer.css('display', '');
        }

        // If responses are public, show button to view them
        var responses;
        if (content.answers.privateKey) {
            var l = getAnswersLength(answers);
            responses = h('button.btn.btn-secondary', [
                h('i.fa.fa-bar-chart'),
                h('span.cp-button-name', Messages._getKey('form_viewAllAnswers', [l]))
            ]);
            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                var answers = obj && obj.results;
                var l = getAnswersLength(answers);
                $(responses).find('.cp-button-name').text(Messages._getKey('form_viewAllAnswers', [l]));
            });
            $(responses).click(function () {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                    APP.answeredInResponses = true;
                    var answers = obj && obj.results;
                    if (answers) { APP.answers = answers; }
                    $('body').addClass('cp-app-form-results');
                    APP.inAnsweredPage = false;
                    renderResults(content, answers);
                    $container.hide();
                });
            });
        }

        var newAnswer;
        if (content.answers.multiple) {
            newAnswer = h('button.btn.btn-primary', [
                h('i.fa.fa-plus'),
                h('span', Messages.form_answer_new)
            ]);
            $(newAnswer).click(function () {
                $formContainer.css('display', '');
                $container.hide();
                delete APP.editingUid;
                delete APP.hasAnswered;
                APP.answeredInForm = true;
                APP.inAnsweredPage = false;
                updateForm(framework, content, false);
            });
        }

        var description = h('div.cp-form-creator-results-description#cp-form-response-msg');
        if (content.answers.msg) {
            var $desc = $(description);
            DiffMd.apply(DiffMd.render(content.answers.msg), $desc, APP.common);
            $desc.find('a').click(linkClickHandler);
        }

        var entries = [];
        var sorted = Object.keys(answers).sort(function (uid1, uid2) {
            return answers[uid1]._time - answers[uid2]._time;
        });
        sorted.forEach(function (uid) {
            var answer = answers[uid];
            
            var viewOnly = content.answers.cantEdit || APP.isClosed;

            var action = h(viewOnly ? 'button.btn.btn-secondary' : 'button.btn.btn-primary', [
                viewOnly ? h('i.fa.fa-bar-chart') : h('i.fa.fa-pencil'),
                h('span', viewOnly ? Messages.form_viewAnswer : Messages.form_editAnswer)
            ]);

            $(action).click(function () {
                $formContainer.css('display', '');
                $container.hide();
                APP.answeredInForm = true;
                APP.editingUid = uid;
                APP.editingTime = answer._time;
                APP.inAnsweredPage = false;
                updateForm(framework, content, false, answer);
                if (viewOnly) {
                    $formContainer.find('.cp-form-send-container .cp-open').hide();
                    if (Array.isArray(APP.formBlocks)) {
                        APP.formBlocks.forEach(function (b) {
                            if (!b.setEditable) { return; }
                            b.setEditable(false);
                        });
                    }
                }
            });

            var date = new Date(answer._time).toLocaleString();

            var del;
            var canDelete = !viewOnly && content.answers.version >= 2;
            if (answer._hash && canDelete) {
                del = h('button.btn.btn-danger', [
                    h('i.fa.fa-trash-o'),
                    h('span', Messages.kanban_delete)
                ]);
                $(del).click(function () {
                    var sframeChan = framework._.sfCommon.getSframeChannel();
                    sframeChan.query("Q_FORM_DELETE_ANSWER", {
                        channel: content.answers.channel,
                        uid: uid
                    }, function (err, obj) {
                        if (obj && obj.error) {
                            console.error(obj.error);
                            return void UI.warn(Messages.error);
                        }
                        framework._.sfCommon.gotoURL();
                    });
                });
            }

            var name = (answer._isAnon || !answer._userdata || !answer._userdata.name) ?
                            Messages.anonymous : Util.fixHTML(answer._userdata.name);
            entries.push(h('div.cp-form-submit-actions', [
                h('span.cp-form-submit-time', date),
                h('span.cp-form-submit-time', '-'),
                h('span.cp-form-submit-time', name),
                h('span.cp-form-submit-action', action),
                h('span.cp-form-submit-del', del),
            ]));
        });

        var table = h('div.cp-form-submit-table', entries);


        var title = framework._.title.title || framework._.title.defaultTitle;

        $container.append(h('div.cp-form-submit-success', [
            h('h3.cp-form-view-title', title),
            description,
            h('div', Messages.form_alreadyAnsweredMult),
            table,
            h('div.cp-form-submit-success-actions', [
                newAnswer,
                responses || undefined
            ])
        ]));
        $container.append(getLogo());
    };

    var getFormResults = function () {
        if (!Array.isArray(APP.formBlocks)) { return; }
        var results = {};
        APP.formBlocks.some(function (data) {
            if (!data.getValue) { return; }
            results[data.uid] = data.getValue();
        });
        return results;
    };

    var getSectionFromQ = function (content, uid) {
        var arr = content.order;
        var idx = content.order.indexOf(uid);
        var sectionUid;
        if (idx === -1) { // If it's not in the main array, check in sections
            getSections(content).some(function (_uid) {
                var block = content.form[_uid];
                if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
                var _idx = block.opts.questions.indexOf(uid);
                if (_idx !== -1) {
                    arr = block.opts.questions;
                    sectionUid = _uid;
                    idx = _idx;
                    return true;
                }
            });
        }

        return {
            uid: sectionUid,
            arr: arr,
            idx: idx
        };
    };
    var removeQuestion = function (content, uid) {
        delete content.form[uid];
        var idx = content.order.indexOf(uid);
        if (idx !== -1) {
            content.order.splice(idx, 1);
        } else {
            getSections(content).some(function (_uid) {
                var block = content.form[_uid];
                if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
                var _idx = block.opts.questions.indexOf(uid);
                if (_idx !== -1) {
                    block.opts.questions.splice(_idx, 1);
                    return true;
                }
            });
        }
    };

    var checkResults = {};
    var checkCondition = function (block) {
        if (!block || block.type !== 'section') { return; }
        if (!block.opts || !Array.isArray(block.opts.questions) || !block.opts.when) {
            return true;
        }

        // This function may be called multiple times synchronously to check the conditions
        // of multiple sections. These sections may require the result of the same question
        // so we store the results in an object outside.
        // To make sure the results are cleared on the next change in the form, we
        // clear it just after the current synchronous actions are done.
        setTimeout(function () { checkResults = {}; });

        var results = checkResults;
        var findResult = function (uid) {
            if (results.hasOwnProperty(uid)) { return results[uid]; }
            APP.formBlocks.some(function (data) {
                if (!data.getValue) { return; }
                if (data.uid === String(uid)) {
                    results[uid] = data.getValue();
                    return true;
                }
            });
            return results[uid];
        };
        var w = block.opts.when;
        return !w.length || w.some(function (rules) {
            return rules.every(function (rule) {
                var res = findResult(rule.q);
                // Checkbox
                if (Array.isArray(res)) {
                    var idx = res.indexOf(rule.v);
                    return rule.is ? idx !== -1 : idx === -1;
                }
                // Radio
                return rule.is ? res === rule.v : res !== rule.v;
            });
        });
    };

    var makeFormControls = function (framework, content, evOnChange) {
        var loggedIn = framework._.sfCommon.isLoggedIn();
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var user = metadataMgr.getUserData();

        if (!loggedIn && !content.answers.anonymous) { return; }

        var $anonName;
        var anonRadioOn = UI.createRadio('cp-form-anon', 'cp-form-anon-on',
                Messages.form_anonymousBox, false, {
                    input: { value: 1 },
                });
        var anonOffContent = h('span');
        var anonRadioOff = UI.createRadio('cp-form-anon', 'cp-form-anon-off',
                anonOffContent, false, {
                    input: { value: 0 },
                });
        var radioContainer = h('div.cp-form-required-radio', [
            Messages.form_answerChoice,
            anonRadioOn,
            anonRadioOff,
        ]);
        var $radio = $(radioContainer);


        if (content.answers.makeAnonymous) {
            // If we make all answers anonymous, hide the checkbox and display a message
            $radio.hide();
            $(anonRadioOn).find('input').prop('checked', true);
            setTimeout(function () {
                // We need to wait for cbox to be added into the DOM before using .after()
                $radio.after(h('div.alert.alert-info', Messages.form_anonAnswer));
            });
        } else if (content.answers.anonymous) {
            // Answers aren't anonymous and guests are allowed
            // Guests can set a username and logged in users can answer anonymously
            if (!loggedIn) {
                $(anonOffContent).append(h('span.cp-form-anon-answer-input', [
                    Messages.form_answerAs,
                    h('input', {
                        value: (typeof(APP.cantAnon) === "string" && APP.cantAnon)
                                || user.name || '',
                        placeholder: Messages.form_anonName
                    })
                ]));
                $anonName = $(anonOffContent).find('input');
                var $off = $(anonRadioOff).find('input[type="radio"]');
                $anonName.on('click input', function () {
                    if (!Util.isChecked($off)) { $off.prop('checked', true); }
                });
            }
            if (APP.cantAnon) {
                // You've already answered with your credentials
                $(anonRadioOn).find('input').attr('disabled', 'disabled');
                $(anonRadioOff).find('input[type="radio"]').prop('checked', true);
            } else if (APP.editingUid) {
                // We're edting and we can answer anonymously: our previous answer is anonymous
                $(anonRadioOn).find('input[type="radio"]').prop('checked', true);
            }
            if (!$anonName) {
                $(anonOffContent).append(h('div.cp-form-anon-answer-input', [
                    Messages.form_answerAs,
                    h('span.cp-form-anon-answer-registered', user.name || Messages.anonymous)
                ]));
            }
            if (!$radio.find('input[type="radio"]:checked').length) {
                $radio.addClass('cp-radio-required');
                $radio.find('input[type="radio"]').on('change', function () {
                    $radio.removeClass('cp-radio-required');
                });
            }
        } else {
            // Answers don't have to be anonymous and only logged in users can answer
            // ==> they have to answer with their keys so we know their name too
            $(anonRadioOn).find('input').attr('disabled', 'disabled');
            $(anonRadioOff).find('input[type="radio"]').prop('checked', true);
            setTimeout(function () {
                // We need to wait for cbox to be added into the DOM before using .after()
                if (content.answers.cantEdit) { return; }
                $radio.after(h('div.alert.alert-info', Messages.form_authAnswer));
            });
            $(anonOffContent).append(h('div.cp-form-anon-answer-input', [
                Messages.form_answerAs,
                h('span.cp-form-anon-answer-registered', user.name || Messages.anonymous)
            ]));
        }

        var send = h('button.cp-open.btn.btn-primary', APP.hasAnswered ? Messages.form_update : Messages.form_submit);
        var reset = h('button.cp-open.cp-reset-button.btn.btn-danger-alt', Messages.form_reset);
        var $reset = $(reset).click(function () {
            if (!Array.isArray(APP.formBlocks)) { return; }
            APP.formBlocks.forEach(function (data) {
                if (typeof(data.reset) === "function") { data.reset(); }
            });
            $(reset).attr('disabled', 'disabled');
            evOnChange.fire();
        });
        var $send = $(send).click(function () {
            if (!$radio.find('input[type="radio"]:checked').length) {
                return UI.warn(Messages.error);
            }

            var results = getFormResults();
            if (!results) { return; }

            $send.attr('disabled', 'disabled');

            var wantName = Util.isChecked($(anonRadioOff).find('input[type="radio"]'));

            var user = metadataMgr.getUserData();
            if (wantName && !content.answers.makeAnonymous) {
                results._userdata = loggedIn ? {
                    avatar: user.avatar,
                    name: user.name,
                    notifications: user.notifications,
                    curvePublic: user.curvePublic,
                    profile: user.profile
                } : {
                    name: $anonName ? $anonName.val() : user.name
                };
            }

            var uid = APP.editingUid;
            if (uid) { results._uid = uid; }
            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query('Q_FORM_SUBMIT', {
                mailbox: content.answers,
                results: results,
                anonymous: content.answers.makeAnonymous || !loggedIn
                            || (!wantName && !APP.cantAnon) // use ephemeral keys
            }, function (err, data) {
                $send.attr('disabled', 'disabled');
                if (err || (data && data.error)) {
                    if (data.error === "EANSWERED") {
                        return void UI.warn(Messages.form_answered);
                    }
                    console.error(err || data.error);
                    return void UI.warn(Messages.error);
                }
                delete APP.editingUid;
                delete APP.editingTime;
                if (results._userdata && loggedIn) {
                    $(anonRadioOn).find('input').attr('disabled', 'disabled');
                    $(anonRadioOff).find('input[type="radio"]').prop('checked', true);
                    APP.cantAnon = true;
                }
                evOnChange.fire(false, true);
                window.onbeforeunload = undefined;

                $send.removeAttr('disabled');
                $send.text(Messages.form_update);
                APP.answeredInForm = false;

                APP.getMyAnswers();

                // TODO show the author that they can "mute" the pad
                var priv = metadataMgr.getPrivateData();
                sframeChan.query('Q_CONTACT_OWNER', {
                    send: true,
                    anon: true,
                    query: "FORM_RESPONSE",
                    msgData: { channel: priv.channel }
                }, function (err, obj) {
                    if (err || !obj || !obj.state) { return console.error('ENOTIFY'); }
                });
            });
        });

        if (APP.hasAnswered && content.answers.cantEdit || APP.isClosed) {
            $radio.hide();
            $send.hide();
            $reset.hide();
        }

        if (APP.isClosed) {
            send = undefined;
            reset = undefined;
        }

        var errors = h('div.cp-form-invalid-warning');
        var $errors = $(errors);
        var invalid = h('div.cp-form-invalid-warning');
        var $invalid = $(invalid);
        if (evOnChange) {
            var origin, priv;
            if (APP.common) {
                priv = metadataMgr.getPrivateData();
                origin = priv.origin;
            }

            var gotoQuestion = function (el) {
                var $el = $(el).closest('.cp-form-block');
                var number = $el.find('.cp-form-block-question-number').text();
                var a = h('a', {
                    href: origin + '#' + Messages._getKey('form_invalidQuestion', [number])
                }, Messages._getKey('form_invalidQuestion', [number]));
                $(a).click(function (e) {
                    e.preventDefault();
                    if (!$el.is(':visible')) {
                        var pages = $el.closest('.cp-form-page').index();
                        if (APP.refreshPage) { APP.refreshPage(pages, 'required'); }
                    }
                    $el[0].scrollIntoView();
                });
                return h('li', a);
            };

            // Check invalid inputs
            evOnChange.reg(function () {
                var $container = $('div.cp-form-creator-content');
                var $inputs = $container.find('input:invalid');
                if (!$inputs.length) {
                    $send.text(APP.hasAnswered ? Messages.form_update : Messages.form_submit);
                    return void $invalid.empty();
                }
                $send.text(APP.hasAnswered ? Messages.form_updateWarning : Messages.form_submitWarning);
                var lis = [];
                $inputs.each(function (i, el) {
                    lis.push(gotoQuestion(el));
                });
                var list = h('ul', lis);
                var content = [
                    h('span', Messages.form_invalidWarning),
                    list
                ];
                $invalid.empty().append(content);
            });
            // Check empty required questions
            evOnChange.reg(function () {
                if (!Array.isArray(APP.formBlocks)) { return; }
                var form = content.form;
                var errorBlocks = APP.formBlocks.filter(function (data) {
                    var uid = data.uid;
                    var block = form[uid];
                    if (!data.isEmpty) { return; }
                    if (!block) { return; }
                    if (!block.opts || !block.opts.required) { return; }
                    // Don't require questions that are in a hidden section
                    var section = getSectionFromQ(content, uid);
                    if (section.uid) {
                        // Check if section is hidden
                        var sBlock = form[section.uid];
                        var visible = checkCondition(sBlock);
                        if (!visible) { return; }
                    }


                    var isEmpty = data.isEmpty();
                    var $el = $(data.tag).closest('.cp-form-block');
                    $el.find('.cp-form-required-tag').toggleClass('cp-is-empty', isEmpty);
                    return isEmpty;
                });
                if (!errorBlocks.length) {
                    $send.removeAttr('disabled');
                    return void $errors.empty();
                }
                $send.attr('disabled', 'disabled');
                var lis = [];
                errorBlocks.forEach(function (data) {
                    lis.push(gotoQuestion(data.tag));
                });
                var list = h('ul', lis);
                var divContent = [
                    h('div.alert.alert-danger', [
                        Messages.form_requiredWarning,
                        list
                    ])
                ];
                $errors.empty().append(divContent);
            });
            evOnChange.fire(true);
        }

        return h('div.cp-form-send-container', [
            errors,
            invalid,
            h('div.cp-form-anon-answer', [
                radioContainer
            ]),
            reset, send
        ]);
    };
    updateForm = function (framework, content, editable, answers, temp) {
        var $container = $('div.cp-form-creator-content');
        if (!$container.length) { return; } // Not ready

        var form = content.form;
        $('body').find('.flatpickr-calendar').remove();

        APP.formBlocks = [];

        var color = content.answers.color || 'nocolor';
        var $body = $('body');
        $body[0].classList.forEach(function (cls) {
            if (/^cp-form-palette/.test(cls)) {
                $body.removeClass(cls);
            }
        });
        $body.addClass('cp-form-palette-'+color);

        $container.attr('class', 'cp-form-creator-content'+(APP.isEditor? ' cp-form-iseditor': ''));

        if (APP.isClosed && content.answers.privateKey && !APP.isEditor && !APP.hasAnswered) {
            var sframeChan = framework._.sfCommon.getSframeChannel();
            sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, obj) {
                var answers = obj && obj.results;
                if (answers) { APP.answers = answers; }
                $('body').addClass('cp-app-form-results');
                $('.cp-toolbar-form-button').remove();
                renderResults(content, answers);
            });
            return;
        }

        var evOnChange = Util.mkEvent();
        if (!APP.isEditor) {
            var _answers = Util.clone(answers || {});
            delete _answers._hash;
            delete _answers._proof;
            delete _answers._userdata;
            evOnChange.reg(function (noBeforeUnload, isSave) {
                if (noBeforeUnload) { return; }
                $container.find('.cp-reset-button').removeAttr('disabled');
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


        var getFormCreator = function (uid, inSection) {
            if (!APP.isEditor) { return; }
            var full = !uid;
            var addControl = function (type) {
                if (type === "section" && inSection) { return; }

                var btn = h('button.btn.btn-secondary', {
                    title: full ? '' : Messages['form_type_'+type],
                    'data-type': type
                }, [
                    (TYPES[type] || STATIC_TYPES[type]).icon.cloneNode(),
                    full ? h('span', Messages['form_type_'+type]) : undefined
                ]);
                $(btn).click(function () {
                    // Get the array in which we want to create the new block
                    // and the position in this array
                    var arr = content.order;
                    var idx = content.order.indexOf(uid);
                    if (!full) {
                        if (inSection) {
                            var section = content.form[uid];
                            section.opts = section.opts || STATIC_TYPES.section.opts;
                            arr = section.opts.questions;
                        } else {
                            var obj = getSectionFromQ(content, uid);
                            arr = obj.arr;
                            idx = obj.idx;
                        }
                    }

                    var _uid = Util.uid();

                    // Make sure we can't create a section inside another one
                    if (type === 'section' && arr !== content.order) { return; }

                    var model = TYPES[type] || STATIC_TYPES[type];
                    if (!model) { return; }
                    content.form[_uid] = {
                        //q: Messages.form_default,
                        opts: model.defaultOpts ? Util.clone(model.defaultOpts) : undefined,
                        type: type,
                    };
                    if (full || inSection) {
                        arr.push(_uid);
                    } else {
                        arr.splice(idx, 0, _uid);
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

        var updateAddInline = APP.updateAddInline = function () {
            $container.find('.cp-form-creator-add-inline').remove();
            // Add before existing question
            $container.find('.cp-form-block:not(.nodrag)').each(function (i, el) {
                var $el = $(el);
                var uid = $el.attr('data-id');
                $el.before(getFormCreator(uid));
            });
            // Add to the end of a section
            $container.find('.cp-form-section-sortable').each(function (i, el) {
                var $el = $(el);
                var uid = $el.closest('.cp-form-block').attr('data-id');
                $el.append(getFormCreator(uid, true));
            });
        };


        var elements = [];
        var n = 1; // Question number

        var order = getFullOrder(content);

        order.forEach(function (uid) {
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
                var _ans = parseAnswers(APP.answers);
                _answers = getBlockAnswers(_ans, uid, !editable && user.curvePublic);
                name = user.name;
            }

            var data = model.get(block.opts, _answers, name, evOnChange, {
                block: block,
                content: content,
                uid: uid,
                tmp: temp && temp[uid]
            });

            if (!data) { return; }
            data.uid = uid;
            if (answers && answers[uid] && data.setValue) { data.setValue(answers[uid]); }

            if (data.pageBreak && !editable) {
                elements.push(data);
                return;
            }
            if (data.noViewMode && !editable) {
                elements.push(data);
                return;
            }

            var requiredTag;
            if (block.opts && block.opts.required) {
                requiredTag = h('span.cp-form-required-tag', Messages.form_required_on);
            }

            var dragHandle;
            var q = h('div.cp-form-block-question', [
                h('span.cp-form-block-question-number', (n++)+'.'),
                h('span.cp-form-block-question-text', block.q || Messages.form_default),
                requiredTag
            ]);
            // Static blocks don't have questions ("q" is not used) so we can decrement n
            if (isStatic) { n--; }

            var editButtons, editContainer;

            APP.formBlocks.push(data);

            var previewDiv = h('div.cp-form-preview', Messages.form_preview_button);

            // Required radio displayed only for types that have an "isEmpty" function
            var requiredDiv;
            if (APP.isEditor && !isStatic && data.isEmpty) {
                if (!block.opts) { block.opts = Util.clone(TYPES[type].defaultOpts); }
                var isRequired = Boolean(block.opts.required);
                var radioOn = UI.createRadio('cp-form-required-'+uid, 'cp-form-required-on',
                        Messages.form_required_on, isRequired, {
                            input: { value: 1 },
                        });
                var radioOff = UI.createRadio('cp-form-required-'+uid, 'cp-form-required-off',
                        Messages.form_required_off, !isRequired, {
                            input: { value: 0 },
                        });
                var radioContainer = h('div.cp-form-required-radio', [
                    h('span', Messages.form_required_answer),
                    radioOff,
                    radioOn
                ]);
                requiredDiv = h('div.cp-form-required', [
                    radioContainer
                ]);
                $(radioContainer).find('input[type="radio"]').on('change', function() {
                    var val = $('input:radio[name="cp-form-required-'+uid+'"]:checked').val();
                    val = Number(val) || 0;
                    block.opts.required = Boolean(val);
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                    });
                });
            }

            if (APP.isEditor && type === "section") {
                data.editing = true;
            }


            var changeType;
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
                var fakeEdit = h('span');
                var del = h('button.btn.btn-danger-alt', [
                    h('i.fa.fa-trash-o'),
                    h('span', Messages.form_delete)
                ]);
                UI.confirmButton(del, {
                    classes: 'btn-danger',
                    new: true
                }, function () {
                    removeQuestion(content, uid);
                    $('.cp-form-block[data-id="'+uid+'"]').remove();
                    framework.localChange();
                    updateAddInline();
                });

                editButtons = h('div.cp-form-edit-buttons-container', [ fakeEdit, del ]);

                changeType = h('div.cp-form-block-type', [
                    model.icon.cloneNode(),
                    h('span', Messages['form_type_'+type])
                ]);

                // Values
                if (data.edit) {
                    var edit = h('button.btn.btn-default.cp-form-edit-button', [
                        h('i.fa.fa-pencil'),
                        h('span', Messages.form_editBlock)
                    ]);
                    var copy = h('button.btn.btn-default.cp-form-copy-button', [
                        h('i.fa.fa-copy'),
                        h('span', Messages.duplicate)
                    ]);
                    $(copy).click(function() {
                        if (!APP.isEditor) { return; }
                        var arr = content.order;
                        var idx = content.order.indexOf(uid);
                        var _uid;
                        var obj = getSectionFromQ(content, uid);
                        arr = obj.arr;
                        idx = obj.idx;
                        _uid = Util.uid();

                        var opts = Util.clone(content.form[uid].opts);
                        if (type === 'multiradio' || type === 'multicheck') {
                            var itemKeys = Util.getKeysArray(content.form[uid].opts.items.length);
                            var valueKeys = Util.getKeysArray(content.form[uid].opts.values.length);
                            opts.items = itemKeys.map(function (i) {
                                    return {
                                        uid: Util.uid(),
                                        v: content.form[uid].opts.items[i].v
                                    };
                            });
                            opts.values = valueKeys.map(function (i) {
                                    return {
                                        uid: Util.uid(),
                                        v: content.form[uid].opts.values[i].v
                                    };
                            });
                        }
                        
                        content.form[_uid] = {
                            q: content.form[uid].q,
                            opts: opts,
                            type: type,
                        };

                        arr.splice(idx, 0, _uid);
                        framework.localChange();
                        updateForm(framework, content, true);
                    });

                    var copydelContainer = h('div', [copy, del]);
                    editButtons = h('div.cp-form-edit-buttons-container', [ edit, copydelContainer]);
                    editContainer = h('div');
                    if (type === 'poll' && block.opts.values.length === 0) {
                        $(editButtons).addClass('cp-empty-poll-edit-buttons');
                    }
                    var onSave = function (newOpts, close) {
                        if (close) { // Cancel edit
                            data.editing = false;
                            $(editContainer).empty();
                            var $oldTag = $(data.tag);
                            $(edit).show();
                            $(copy).show();
                            $(previewDiv).show();
                            $(requiredDiv).hide();

                            $(editButtons).find('.cp-form-preview-button').remove();

                            var _ans = parseAnswers(APP.answers);
                            _answers = getBlockAnswers(_ans, uid);

                            data = model.get(block.opts, _answers, null, evOnChange);
                            if (!data) { data = {}; }
                            $oldTag.before(data.tag).remove();
                            return;
                        }
                        if (!newOpts) {
                            // invalid options, nothing to save
                            return;
                        }
                        block.opts = newOpts;
                        framework.localChange();
                    };
                    var onEdit = function (tmp) {
                        data.editing = true;
                        $(requiredDiv).show();
                        $(previewDiv).hide();
                        $(data.tag).hide();
                        $(editContainer).append(data.edit(onSave, tmp, framework));

                        $(editContainer).find('.cp-form-preview-button').prependTo(editButtons);

                        $(edit).hide();
                        $(copy).hide();
                    };
                    $(edit).click(function () {
                        onEdit();
                    });
                    $(requiredDiv).hide();

                    // If we were editing this field, recover our unsaved changes
                    if (temp && temp[uid]) {
                        onEdit(temp[uid]);
                    }

                    if (Array.isArray(model.compatible)) {
                        changeType = h('div.cp-form-block-type.editable', [
                            model.icon.cloneNode(),
                            h('span', Messages['form_type_'+type]),
                            h('i.fa.fa-caret-down')
                        ]);
                        $(changeType).click(function () {
                            var name = Util.uid();
                            var els = model.compatible.map(function (data, i) {
                                var text = Messages['form_type_'+data];
                                if (!text) { return; }
                                var radio = UI.createRadio(name, 'cp-form-changetype-'+i,
                                           text, data===type, {});
                                $(radio).find('input').data('val', data);
                                return radio;
                            });
                            var tag = h('div.radio-group', els);
                            var changeTypeContent = [
                                APP.answers && Object.keys(APP.answers).length ?
                                    h('div.alert.alert-warning', Messages.form_corruptAnswers) :
                                    undefined,
                                h('p', Messages.form_changeTypeConfirm),
                                tag
                            ];
                            UI.confirm(changeTypeContent, function (yes) {
                                if (!yes) { return; }
                                var res;
                                els.some(function (el) {
                                    var $i = $(el).find('input');
                                    if (Util.isChecked($i)) {
                                        res = $i.data('val');
                                        return true;
                                    }
                                });
                                if (res === type || !TYPES[res]) { return; }
                                var oldOpts = model.defaultOpts || {};
                                model = TYPES[res];
                                Object.keys(oldOpts).forEach(function (v) {
                                    var opts = model.defaultOpts || {};
                                    if (!opts[v]) { delete (block.opts || {})[v]; }
                                });
                                type = res;
                                if (!data) { data = {}; }
                                block.type = res;

                                framework.localChange();
                                var wasEditing = data.editing;
                                onSave(null, true);
                                var $oldTag = $(data.tag);
                                framework._.cpNfInner.chainpad.onSettle(function () {
                                    $(changeType).find('span').text(Messages['form_type_'+type]);
                                    data = model.get(block.opts, _answers, null, evOnChange);
                                    $oldTag.before(data.tag).remove();
                                    if (wasEditing) { $(edit).click(); }
                                });
                            });
                        });
                    }
                }
            }
            var editableCls = editable ? ".editable" : "";
            elements.push(h('div.cp-form-block'+editableCls, {
                'data-id':uid,
                'data-type':type
            }, [
                APP.isEditor ? dragHandle : undefined,
                changeType,
                isStatic ? undefined : q,
                h('div.cp-form-block-content', [
                    APP.isEditor && !isStatic ? requiredDiv : undefined,
                    APP.isEditor && !isStatic ? previewDiv : undefined,
                    data.tag,
                    editContainer,
                    editButtons
                ]),
            ]));
        });

        if (APP.isEditor) {
            elements.push(getFormCreator());
        }

        var _content = elements;
        if (!editable) {
            _content = [];
            var pgcontent = [];
            var pg = [];
            var div = h('div.cp-form-page');
            var pages = 1;
            var wasPage = false;
            elements.forEach(function (obj, i) {
                if (obj && obj.pageBreak) {
                    if (i === 0) { return; } // Can't start with a page break
                    if (i === (elements.length - 1)) { return; } // Can't end with a page break
                    if (wasPage) { return; } // Prevent double page break
                    _content.push(div);
                    pgcontent.push(pg);
                    pages++;
                    div = h('div.cp-form-page');
                    pg = [];
                    wasPage = true;
                    return;
                }
                if (form[obj.uid] && form[obj.uid].type === 'section') {
                    return;
                }
                pg.push(obj);
                wasPage = false;
                $(div).append(obj);
            });
            _content.push(div);
            pgcontent.push(pg);
            if (pages > 1) {
                var checkEmptyPages = function() {
                    getSections(content).forEach(function (uid) {
                        var block = content.form[uid];
                        var condition = Boolean(checkCondition(block));
                        block.opts.questions.forEach(function(uid){
                            form[uid].visible = condition;
                        });
                    });

                    
                    var shownContent = [];
                    var shownPages = [];
                    pgcontent.forEach(function(page) {
                        var visible = page.some(function(q) {
                            return form[$(q).attr('data-id')] && form[$(q).attr('data-id')].visible !== false;
                        });
                        page.empty = !visible;
                        if (visible) {
                            shownContent.push(page);
                            shownPages.push(_content[pgcontent.indexOf(page)]);
                        }
                    });
                    return [shownContent, shownPages];
                };

                var pageContainer = h('div.cp-form-page-container');
                
                var $page = $(pageContainer);
                _content.push(pageContainer);
                var refreshPage = APP.refreshPage = function (current, direction) {
                    $page.empty();
                    if (!current || current < 1) { current = 1; }

                    var checkPages = checkEmptyPages();
                    var shownContent = checkPages[0];
                    var shownPages = checkPages[1];
                    var shownLength = shownContent.length;

                    if (pgcontent[(current - 1)] && pgcontent[current-1].empty) {
                        if (direction === 'next') {
                            current++;
                            while (pgcontent[current-1].empty) {
                                current++;
                            }
                        } else if (direction === 'prev') {
                            current--;
                            while (pgcontent[current-1].empty) {
                                current--;
                            }
                        } else if (direction === 'required') {
                            current = shownContent.indexOf(_content[current]);
                        }
                    }

                    var state = h('span', Messages._getKey('form_page', [shownPages.indexOf(_content[current-1])+1, shownLength]));
                    evOnChange.reg(function(){
                        var checkPages = checkEmptyPages();
                        var shownContent = checkPages[0];
                        var shownPages = checkPages[1];
                        var shownLength = shownContent.length;
                        $(state).text(Messages._getKey('form_page', [shownPages.indexOf(_content[current-1])+1, shownLength]));
                    });
                    var left = h('button.btn.btn-secondary.cp-prev', [
                        h('i.fa.fa-arrow-left'),
                    ]);
                    var right = h('button.btn.btn-secondary.cp-next', [
                        h('i.fa.fa-arrow-right'),
                    ]);

                    if (shownPages.indexOf(_content[current-1])+1 === shownContent.length) { $(right).css('visibility', 'hidden'); }
                    if (current === 1) { $(left).css('visibility', 'hidden'); }

                    $(left).click(function () {
                        refreshPage(current - 1, 'prev');
                    });
                    $(right).click(function () {
                        refreshPage(current + 1, 'next');
                    });
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

        if (APP.responseDiv) { $(APP.responseDiv).detach(); }
        $container.empty().append(_content);

        if (editable) {
            var responseMsg = h('div.cp-form-response-msg-container');
            var $responseMsg = $(responseMsg).appendTo($container);
            var refreshResponse = function () {
                var text = Messages.form_addMsg;
                var btn = h('button.btn.btn-secondary.cp-form-response-button', text);
                $(btn).click(function () {
                    if (!APP.responseDiv) { APP.getResponseMsgEditor(true); }
                    $responseMsg.append(APP.responseDiv);
                    $(btn).hide();
                }).hide();
                $responseMsg.append(btn);

                if (content.answers.msg || APP.responseDiv) {
                    if (!APP.responseDiv) { APP.getResponseMsgEditor(); }
                    $responseMsg.append(APP.responseDiv);

                    if (!temp || !temp.response || !temp.response.cursor) { return; }
                    var editor = APP.responseEditor;
                    var c = temp.response.cursor;
                    var from = c.from;
                    var to = c.to;
                    editor.setSelection(from, to);
                    editor.refresh();
                    editor.save();
                    editor.focus();
                    return;
                }
                $(btn).show();
            };
            refreshResponse();
        }


        getSections(content).forEach(function (uid) {
            var block = content.form[uid];
            if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
            var $block = $container.find('.cp-form-block[data-id="'+uid+'"] .cp-form-section-sortable');
            block.opts.questions.forEach(function (_uid) {
                $container.find('.cp-form-block[data-id="'+_uid+'"]').appendTo($block);
            });
        });
        updateAddInline();

        // Fix cursor in conditions dropdown
        // If we had a condition dropdown displayed, we're going to make sure
        // it doesn't move on the screen after the redraw
        // To do so, we need to adjust the "scrollTop" value saved before redrawing
        getSections(content).some(function (uid) {
            if (!temp) { return true; }
            var block = content.form[uid];
            if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
            var $block = $container.find('.cp-form-block[data-id="'+uid+'"] .cp-form-section-sortable');

            if (temp && temp[uid]) {
                var tmp = temp[uid];
                var u = tmp.uid;
                var t = tmp.type;
                var $c = $block.closest('.cp-form-block').find('.cp-form-condition[data-uid="'+u+'"]');
                var $b = $c.find('[data-drop="'+t+'"]').find('button');
                var pos = $b && $b.length && $b[0].getBoundingClientRect().y;
                // If we know the old position of the button and the new one, we can fix the scroll
                // accordingly
                if (typeof(pos) === "number" && typeof(tmp.y) === "number") {
                    var diff = pos - tmp.y;
                    APP.sTop += diff;
                }
                return true;
            }
        });
        // Fix cursor with flatpickr
        APP.formBlocks.some(function (b) {
            if (!temp) { return true; }
            var uid = b.uid;
            var block = form[uid];
            if (!block) { return; }
            if (block.type !== "poll") { return; }
            var opts = block.opts;
            if (!opts) { return; }
            if (opts.type !== "time") { return; }
            var tmp = temp[uid];
            if (!tmp || !tmp.cursor || !tmp.cursor.flatpickr) { return; }
            var $block = $container.find('.cp-form-block[data-id="'+uid+'"]');
            var $i = $block.find('.flatpickr-input[value="'+tmp.cursor.val+'"]');
            if (!$i.length) { return; }
            APP.afterScroll = function () {
                $i[0]._flatpickr.open();
                delete APP.afterScroll;
            };
            var pos = $i && $i.length && $i[0].getBoundingClientRect().y;
            if (typeof(pos) === "number" && typeof(tmp.cursor.y) === "number") {
                var diff = pos - tmp.cursor.y;
                APP.sTop += diff;
            }
            return true;
        });

        if (editable) {
            if (APP.mainSortable) { APP.mainSortable.destroy(); }
            var grabHandle;
            if (window.matchMedia("(pointer: coarse)").matches) {
                grabHandle = '.cp-form-block-drag-handle';
            } else {
                grabHandle = null;
            }
            APP.mainSortable = Sortable.create($container[0], {
                handle: grabHandle,
                group: 'nested',
                direction: "vertical",
                filter: "input, button, .CodeMirror, .cp-form-type-sort, .cp-form-block-type.editable",
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
                        setTimeout(framework.localChange);
                        updateAddInline();
                    }
                }
            });
            return;
        }

        // In view mode, hide sections when conditions aren't met
        evOnChange.reg(function (reset, save, condition) {
            if (!reset && !condition) { return; }
            getSections(content).forEach(function (uid) {
                var block = content.form[uid];
                if (block.type !== 'section') { return; }
                if (!block.opts || !Array.isArray(block.opts.questions) || !block.opts.when) {
                    return;
                }
                var show = checkCondition(block);
                block.opts.questions.forEach(function (_uid) {
                    $container.find('.cp-form-block[data-id="'+_uid+'"]').toggle(show);
                });
            });
        });

        // If the form is already submitted, show an info message
        var lastTime = (answers && answers._time) || APP.editingTime;
        if (APP.hasAnswered && lastTime) {
            $container.prepend(h('div.alert.alert-info',
                Messages._getKey('form_alreadyAnswered', [
                    new Date(lastTime).toLocaleString()])));
        }

        if (APP.isClosed || (APP.hasAnswered && content.answers.cantEdit)) {
            APP.formBlocks.forEach(function (b) {
                if (!b.setEditable) { return; }
                b.setEditable(false);
            });
        }

        var loggedIn = framework._.sfCommon.isLoggedIn();

        // In view mode, add "Submit" and "reset" buttons
        APP.cantAnon = Object.keys(answers || {}).length && !answers._isAnon;
        if (!loggedIn && answers && answers._userdata && answers._userdata.name) {
            APP.cantAnon = answers._userdata.name;
        }
        $container.append(makeFormControls(framework, content, evOnChange));

        // In view mode, tell the user if answers are forced to be anonymous or authenticated
        var infoTxt;
        if (content.answers.makeAnonymous) {
            infoTxt = Messages.form_anonAnswer;
        } else if (!content.answers.anonymous && loggedIn && !content.answers.cantEdit) {
            infoTxt = Messages.form_authAnswer;
        }
        if (infoTxt) {
            $container.prepend(h('div.alert.alert-info', infoTxt));
        }

        if (!loggedIn && !content.answers.anonymous) {
            APP.formBlocks.forEach(function (b) {
                if (!b.setEditable) { return; }
                b.setEditable(false);
            });
        }

        // Embed mode is enforced so we add the title at the top and a CryptPad logo
        // at the bottom
        var title = framework._.title.title || framework._.title.defaultTitle;
        $container.prepend(h('h1.cp-form-view-title', title));
        $container.append(getLogo());

        if (!answers) {
            $container.find('.cp-reset-button').attr('disabled', 'disabled');
        }
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
        if (APP.responseEditor && APP.responseEditor.hasFocus()) {
            var editor = APP.responseEditor;
            temp.response = {
                cursor: {
                    from: editor.getCursor('from'),
                    to: editor.getCursor('to'),
                }
            };
        }
        return temp;
    };

    var andThen = function (framework) {
        framework.start();
        APP.framework = framework;
        var evOnChange = Util.mkEvent();
        var content = {};

        APP.common = framework._.sfCommon;
        var sframeChan = framework._.sfCommon.getSframeChannel();
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var user = metadataMgr.getUserData();

        var priv = metadataMgr.getPrivateData();
        APP.isEditor = Boolean(priv.form_public);
        var $body = $('body');

        if (priv.devMode) {
            MAX_OPTIONS = 10000;
            MAX_ITEMS = 10000;
        }


        var $toolbarContainer = $('#cp-toolbar');

        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'pad']);
        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
        $toolbarContainer.after(helpMenu.menu);
        framework._.toolbar.$drawer.append($helpMenuButton);
        if (!APP.isEditor && !priv.form_auditorKey) {
            $(helpMenu.menu).hide();
        }

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

        var initializeAnswers = function() {
            // Initialize the answers properties if they do not exist yet
            if (!APP.isEditor) { return; }
            var priv = metadataMgr.getPrivateData();
            if (content.answers && content.answers.channel && content.answers.publicKey === priv.form_public && content.answers.validateKey) { return; }
            // Don't override other settings (anonymous, makeAnonymous, etc.) from templates
            content.answers = content.answers || {};
            content.answers.channel = Hash.createChannelId();
            content.answers.publicKey = priv.form_public;
            content.answers.validateKey = priv.form_answerValidateKey;
            content.answers.version = 2;
            framework.localChange();
        };

        var makeFormSettings = function () {
            var previewBtn = h('button.btn.btn-primary', [
                h('i.fa.fa-eye'),
                Messages.form_preview
            ]);
            var participantBtn = h('button.btn.btn-primary',[
                h('i.fa.fa-link'),
                Messages.form_geturl
            ]);
            var preview = h('div.cp-forms-results-participant', [previewBtn, participantBtn]);
            $(previewBtn).click(function () {
                sframeChan.event('EV_OPEN_VIEW_URL');
            });
            $(participantBtn).click(function () {
                sframeChan.query('Q_COPY_VIEW_URL', null, function (err, success) {
                    if (success) { return void UI.log(Messages.shareSuccess); }
                    UI.warn(Messages.error);
                });
            });

            // Private / public status
            var resultsType = h('div.cp-form-results-type-container');
            var resultsStr = h('div');
            var $results = $(resultsType);
            var refreshPublic = function () {
                $results.empty();
                var makePublic = h('button.btn.btn-secondary', Messages.form_makePublic);
                var makePublicDiv = h('div.cp-form-actions', makePublic);
                if (content.answers.privateKey) { makePublicDiv = undefined; }
                var publicText = content.answers.privateKey ? Messages.form_isPublic : Messages.form_isPrivate;
                $results.append(h('span.cp-form-results-type', publicText));
                $(resultsStr).text(publicText);
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


            // Make answers anonymous
            var anonContainer = h('div.cp-form-anon-container');
            var anonStr = h('div');
            var $anon = $(anonContainer);
            var $anonStr = $(anonStr);
            var refreshAnon = function () {
                $anon.empty();
                var anonymous = content.answers.makeAnonymous;
                if (anonymous) { $anonStr.text(Messages.form_anonymized); }
                else { $anonStr.text(''); }
                var cbox = UI.createCheckbox('cp-form-make-anon',
                           Messages.form_makeAnon, anonymous, {});
                var radioContainer = h('div.cp-form-anon-radio', [cbox]);
                var $r = $(radioContainer).find('input').on('change', function() {
                    var val = Util.isChecked($r);
                    content.answers.makeAnonymous = val;
                    if (val) { $anonStr.text(Messages.form_anonymized); }
                    else { $anonStr.text(''); }
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                    });
                });
                $anon.append(h('div.cp-form-actions', radioContainer));
            };
            refreshAnon();


            // Mute form responses
            var notifContainer = h('div.cp-form-anon-container');
            var notifStr = h('div');
            var $notif = $(notifContainer);
            var $notifStr = $(notifStr);
            var refreshNotif = APP.refreshNotif = function () {
                $notif.empty();
                if (typeof(APP.isOwned) === "undefined") { return; }
                if (!APP.common.isLoggedIn()) { return; }
                if (APP.isOwned !== true) { return; }
                var metadataMgr = APP.common.getMetadataMgr();
                var priv = metadataMgr.getPrivateData();
                var isMuted = priv.isChannelMuted;
                var cbox = UI.createCheckbox('cp-form-muted',
                           Messages.form_allowNotifications, !isMuted, {});

                if (!isMuted) { $notifStr.text(Messages.form_allowNotifications); }
                else { $notifStr.text(''); }
                var radioContainer = h('div.cp-form-mute-radio', [cbox]);
                var $r = $(radioContainer).find('input').on('change', function() {
                    var val = Util.isChecked($r);
                    sframeChan.query('Q_FORM_MUTE', {
                        muted: !val
                    }, function (err, res) {
                        err = err || (res && res.error);
                        if (err) { return void UI.warn(Messages.error); }
                        UI.log(Messages.saved);
                        if (val) { $notifStr.text(Messages.form_allowNotifications); }
                        else { $notifStr.text(''); }
                    });
                });
                $anon.append(h('div.cp-form-actions', radioContainer));
            };
            refreshNotif();

            // Allow guest(anonymous) answers
            var privacyContainer = h('div.cp-form-privacy-container');
            var privacyStr = h('div');
            var $privacy = $(privacyContainer);
            var $privacyStr = $(privacyStr);
            var refreshPrivacy = function () {
                $privacy.empty();

                var updateStr = function (val) {
                    $privacyStr.empty().append([
                        h('span.cp-form-setting-title', Messages.form_anonymous),
                        h('br'),
                        h('span', Messages['form_anonymous_'+ (val ? 'on' : 'off')])
                    ]);
                };

                var anonymous = content.answers.anonymous;
                var radioOn = UI.createRadio('cp-form-privacy', 'cp-form-privacy-on',
                        Messages.form_anonymous_on, Boolean(anonymous), {
                            input: { value: 1 },
                        });
                var radioOff = UI.createRadio('cp-form-privacy', 'cp-form-privacy-off',
                        Messages.form_anonymous_off, !anonymous, {
                            input: { value: 0 },
                        });
                var radioContainer = h('div.cp-form-privacy-radio', [radioOn, radioOff]);
                updateStr(anonymous);
                $(radioContainer).find('input[type="radio"]').on('change', function() {
                    var val = $('input:radio[name="cp-form-privacy"]:checked').val();
                    val = Number(val) || 0;
                    content.answers.anonymous = Boolean(val);
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                        updateStr(val);
                    });
                });
                $privacy.append(h('div.cp-form-status.cp-form-setting-title', Messages.form_anonymous));
                $privacy.append(h('div.cp-form-actions', radioContainer));
            };
            refreshPrivacy();

            // Allow responses edition
            var editableContainer = h('div.cp-form-editable-container');
            var editableStr = h('div');
            var $editable = $(editableContainer);
            var $editableStr = $(editableStr);
            var refreshEditable = function () {
                $editable.empty();

                var canDelete = content.answers.version >= 2;

                var updateStr = function (edit, mult) {
                    var key = '';
                    if (!edit && !mult) { key = 'editable_off'; }
                    if (edit && !mult) { key = 'editable_on_del'; }
                    if (!edit && mult) { key = 'multiple'; }
                    if (edit && mult) { key = 'multiple_edit'; }
                    $editableStr.empty().append([
                        h('span.cp-form-setting-title', Messages.form_editable_str),
                        h('br'),
                        h('span', Messages['form_'+key])
                    ]);
                };

                var editable = !content.answers.cantEdit;
                var mult = !!content.answers.multiple;
                var radioOn = UI.createRadio('cp-form-editable', 'cp-form-editable-on',
                        Messages.form_editable_off, !editable && !mult, {
                            input: { value: 0 },
                        });
                var editableOnStr = canDelete ? Messages.form_editable_on_del
                                              : Messages.form_editable_on;
                var radioOff = UI.createRadio('cp-form-editable', 'cp-form-editable-off',
                        editableOnStr, editable && !mult, {
                            input: { value: 1 },
                        });

                var radioMult = UI.createRadio('cp-form-editable', 'cp-form-editable-mult',
                        Messages.form_multiple, mult && !editable, {
                            input: { value: 2 },
                        });
                var radioMultEdit = UI.createRadio('cp-form-editable', 'cp-form-editable-multedit',
                        Messages.form_multiple_edit, mult && editable, {
                            input: { value: 3 },
                        });
                var radioContainer = h('div.cp-form-editable-radio', [radioOn, radioOff, radioMult, radioMultEdit]);
                updateStr(editable, mult);
                $(radioContainer).find('input[type="radio"]').on('change', function() {
                    var val = $('input:radio[name="cp-form-editable"]:checked').val();
                    val = Number(val) || 0;

                    content.answers.cantEdit = val === 0 || val === 2;
                    content.answers.multiple = val === 2 || val === 3;
                    if (canDelete) {
                        APP.common.getPadMetadata({channel: content.answers.channel}, function (md) {
                            var owners = md.owners;
                            if (!Array.isArray(owners) || !owners.length) { return; }
                            var owned = APP.common.isOwned(owners);
                            if (!owned) { return; }
                            sframeChan.query('Q_SET_PAD_METADATA', {
                                channel: content.answers.channel,
                                command: 'ALLOW_LINE_DELETION',
                                value: [val === 1 || val === 3],
                                teamId: owned !== true && Number(owned)
                            }, function (err, res) {
                                err = err || (res && res.error);
                                if (err) { console.error(err); }
                            });
                        });
                    }
                    framework.localChange();
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        UI.log(Messages.saved);
                        updateStr(!content.answers.cantEdit, content.answers.multiple);
                    });
                });
                $editable.append(h('div.cp-form-status.cp-form-setting-title', Messages.form_editable_str));
                $editable.append(h('div.cp-form-actions', radioContainer));
            };
            refreshEditable();

            // End date / Closed state
            var endDateContainer = h('div.cp-form-status-container');
            var endDateStr = h('div');
            var $endDate = $(endDateContainer);
            var $endDateStr = $(endDateStr);
        
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

                $endDateStr.text(text);

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
                        disableMobile: true,
                        enableTime: true,
                        time_24hr: is24h,
                        dateFormat: dateFormat,
                        minDate: new Date()
                    });
                    var save = h('button.btn.btn-primary', Messages.settings_save);
                    $(save).click(function () {
                        if (datePicker.value === '') {
                            return void refreshEndDate();
                        }
                        var d = DatePicker.parseDate(datePicker.value);
                        content.answers.endDate = +d;
                        framework.localChange();
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            refreshEndDate();
                        });
                    });
                    var cancel = h('button.btn.btn-danger', h('i.fa.fa-times.nomargin'));
                    $(cancel).click(function () {
                        refreshEndDate();
                    });
                    var confirmContent = h('div', [
                        h('div.cp-form-input-block', [datePicker, save, cancel]),
                    ]);
                    $button.after(confirmContent);
                    $button.remove();
                    picker.open();
                });

                $endDate.append(h('div.cp-form-status', text));
                $endDate.append(h('div.cp-form-actions', button));

            };
            refreshEndDate();

            var colorLine1 = h('div');
            var colorLine2 = h('div');
            var colorContainer = h('div.cp-form-color-container', [
                colorLine1,
                colorLine2
            ]);
            var colorTheme = h('div.cp-form-color-theme-container', [
                h('span', Messages.form_colors),
                colorContainer
            ]);
            var $colors = $(colorContainer);
            var refreshColorTheme = function () {
                $(colorLine1).empty();
                $(colorLine2).empty();
                var palette = ['nocolor'];
                for (var i=1; i<=8; i++) { palette.push('color'+i); }
                var color = content.answers.color || 'nocolor';
                var selectedColor = color;
                var currentContainer = colorLine1;
                palette.forEach(function (_color, i) {
                    if (i === 5) { currentContainer = colorLine2; }
                    var $color = $(h('span.cp-form-palette.fa'));
                    $color.addClass('cp-form-palette-'+(_color || 'nocolor'));
                    if (selectedColor === _color) { $color.addClass('fa-check'); }
                    $color.click(function () {
                        if (_color === selectedColor) { return; }
                        content.answers.color = _color;
                        framework.localChange();
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            UI.log(Messages.saved);
                            selectedColor = _color;
                            $colors.find('.cp-form-palette').removeClass('fa-check');
                            $color.addClass('fa-check');

                            var $body = $('body');
                            $body[0].classList.forEach(function (cls) {
                                if (/^cp-form-palette/.test(cls)) {
                                    $body.removeClass(cls);
                                }
                            });
                            $body.addClass('cp-form-palette-'+_color);
                        });
                    }).appendTo(currentContainer);
                });
            };
            refreshColorTheme();

            evOnChange.reg(initializeAnswers);
            evOnChange.reg(refreshPublic);
            evOnChange.reg(refreshPrivacy);
            evOnChange.reg(refreshAnon);
            evOnChange.reg(refreshNotif);
            evOnChange.reg(refreshEditable);
            evOnChange.reg(refreshEndDate);
            evOnChange.reg(refreshColorTheme);


            var modal = UI.createModal({
                id: 'cp-form-settings',
                $body: $('body')
            });
            var $modal = modal.$modal;
            $modal.find('.cp-modal').append([
                h('h2', [
                    h('i.fa.fa-wrench'),
                    h('span', Messages.form_settingsButton)
                ]),
                endDateContainer,
                anonContainer,
                notifContainer,
                resultsType,
                privacyContainer,
                editableContainer,
            ]);
            var modalBtn = h('button.btn.btn-secondary', [
                h('i.fa.fa-wrench'),
                h('span', Messages.form_settingsButton)
            ]);
            $(modalBtn).click(function () {
                setTimeout(function () {
                    modal.show();
                });
            });

            var previewSettings = h('div.cp-form-settings-preview', [
                modalBtn,
                endDateStr,
                anonStr,
                notifStr,
                resultsStr,
                privacyStr,
                editableStr
            ]);

            return [
                preview,
                previewSettings,
                colorTheme
            ];
        };

        var checkIntegrity = function (getter) {
            if (!content.order || !content.form) { return; }
            var changed = false;
            var deduplicate = [];
            // Check if the questions in the lists (content.order or sections) exist in
            // content.form and remove duplicates
            var check1 = function (arr) {
                arr.forEach(function (uid) {
                    if (!content.form[uid] || deduplicate.indexOf(uid) !== -1) {
                        var idx = arr.indexOf(uid);
                        arr.splice(idx, 1);
                        changed = true;
                        return;
                    }
                    deduplicate.push(uid);
                });
            };
            check1(content.order);
            getSections(content).forEach(function (uid) {
                var block = content.form[uid];
                if (!block.opts || !Array.isArray(block.opts.questions)) { return; }
                check1(block.opts.questions);
            });

            // Make sure all the questions are displayed in the main list or a section and add
            // the missing ones
            Object.keys(content.form).forEach(function (uid) {
                var idx = deduplicate.indexOf(uid);
                if (idx === -1) {
                    changed = true;
                    content.order.push(uid);
                }
            });

            // Check if conditions on sections are valid
            var order = getFullOrder(content);
            getSections(content).forEach(function (uid) {
                var block = content.form[uid];
                if (!block.opts || !Array.isArray(block.opts.when)) { return; }
                var sectionIdx = order.indexOf(uid);
                if (sectionIdx === -1) { return; }
                var available = order.slice(0, sectionIdx);
                var errors = false;
                block.opts.when.forEach(function (rules) {
                    if (!Array.isArray(rules)) {
                        var idx = block.opts.when.indexOf(rules);
                        block.opts.when.splice(idx, 1);
                        errors = true;
                        return;
                    }
                    rules.forEach(function (obj) {
                        if (!obj.q) { return; }
                        var idx = available.indexOf(String(obj.q));
                        // If this question doesn't exist before the section, remove the condition
                        if (idx === -1) {
                            var cIdx = rules.indexOf(obj);
                            rules.splice(cIdx, 1);
                            errors = true;
                            return;
                        }
                    });
                    if (!rules.length) {
                        var rIdx = block.opts.when.indexOf(rules);
                        block.opts.when.splice(rIdx, 1);
                        errors = true;
                    }
                });
                if (errors) {
                    evCheckConditions.fire(uid);
                    changed = true;
                }
            });

            evShowConditions.fire();

            // Migrate opts.values from string to object
            if (!content.version) {
                Object.keys(content.form).forEach(function (uid) {
                    var block = content.form[uid];
                    var values = Util.find(block, ['opts', 'values']);
                    if (!Array.isArray(values)) { return; }
                    if (block.opts.type === 'day') { return; }
                    block.opts.values = values.map(function (data) {
                        if (Util.isObject(data)) { return data; }
                        return {
                            uid: Util.uid(),
                            v: data || Messages.form_newOption
                        };
                    });
                });
                content.version = 1;
                changed = true;
            }


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

            var contentContainer = h('div.cp-form-creator-content' + (APP.isEditor ? '.cp-form-iseditor' : ''));
            var resultsContainer = h('div.cp-form-creator-results');
            var answeredContainer = h('div.cp-form-creator-answered', {
                style: 'display: none;'
            });
            var div = h('div.cp-form-creator-container', [
                controlContainer,
                contentContainer,
                resultsContainer,
                answeredContainer,
                fillerContainer
            ]);
            return div;
        };

        var endDateEl = h('div.alert.alert-warning.cp-burn-after-reading');
        var endDate;
        var endDateTo;

        // numbers greater than this overflow the maximum delay for a setTimeout
        // which results in it being executed immediately (oops)
        // https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#maximum_delay_value
        var MAX_TIMEOUT_DELAY = 2147483647;
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
                // calculate how many ms in the future the poll will be closed
                var diff = (endDate - +new Date() + 100);
                // if that value would overflow, then check again in a day
                // (if the tab is still open)
                if (diff > MAX_TIMEOUT_DELAY) {
                    endDateTo = setTimeout(function () {
                        refreshEndDateBanner(true);
                    }, 1000 * 3600 * 24);
                    return;
                }

                endDateTo = setTimeout(function () {
                    refreshEndDateBanner(true);
                    $('.cp-form-send-container').find('.cp-open').hide();
                }, diff);
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

        framework.onReady(function (isNew) {
            var priv = metadataMgr.getPrivateData();
            if (APP.isEditor) {
                framework.feedback('FORM_EDITOR');
            } else if (!APP.isEditor && priv.form_auditorKey) {
                framework.feedback('FORM_AUDITOR');
            } else {
                framework.feedback('FORM_PARTICIPANT');
            }

            APP.common.getPadMetadata({channel: priv.channel}, function (md) {
                var owners = md.owners;
                if (!Array.isArray(owners) || !owners.length) {
                    APP.isOwned = false;
                } else {
                    APP.isOwned = APP.common.isOwned(owners);
                }
                if (APP.refreshNotif) { APP.refreshNotif(); }
            });

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
                initializeAnswers();
                checkIntegrity();
            }
            if (isNew && content.answers && typeof(content.answers.anonymous) === "undefined") {
                content.answers.anonymous = true;
            }

            sframeChan.event('EV_FORM_PIN', {channel: content.answers.channel});

            var $container = $('#cp-app-form-container');
            $container.append(makeFormCreator());

            if (!content.answers || !content.answers.channel || !content.answers.publicKey || !content.answers.validateKey) {
                return void UI.errorLoadingScreen(Messages.form_invalid);
            }

            var getResults = APP.getResults = function (key) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey,
                    privateKey: key,
                    cantEdit: content.answers.cantEdit
                }, function (err, obj) {
                    var answers = obj && obj.results;
                    if (answers) { APP.answers = answers; }
                    if (key) { $body.addClass('cp-app-form-results'); }
                    renderResults(content, answers);
                });
            };
            if (priv.form_auditorKey) {
                APP.isAuditor = true;
                getResults(priv.form_auditorKey);
                return;
            }

            if (APP.isEditor) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    validateKey: content.answers.validateKey,
                    publicKey: content.answers.publicKey,
                    cantEdit: content.answers.cantEdit
                }, function (err, obj) {
                    var answers = obj && obj.results;
                    addResultsButton(framework, content, answers);
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

            var getMyAnswers = APP.getMyAnswers = function () {
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
                    checkIntegrity(false);
                    var answers;
                    if (obj && !obj.error && Object.keys(obj).length) {
                        answers = obj;
                        APP.hasAnswered = answers;
                        // If we have a non-anon answer, we can't answer anonymously later
                        showAnsweredPage(framework, content, APP.hasAnswered);
                        return;
                    }
                    updateForm(framework, content, false, answers);
                });
            };

            // If the results are public and there is at least one doodle, fetch the results now
            if (content.answers.privateKey && Object.keys(content.form).some(function (uid) {
                    return content.form[uid].type === "poll";
                })) {
                getMyAnswers = APP.getMyAnswers = function () {
                    sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                        channel: content.answers.channel,
                        validateKey: content.answers.validateKey,
                        publicKey: content.answers.publicKey,
                        privateKey: content.answers.privateKey,
                        cantEdit: content.answers.cantEdit
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
                        var myAnswers = {};
                        var curve1 = user.curvePublic;
                        var curve2 = obj && obj.myKey; // Anonymous answer key
                        if (answers) {
                            var myAnonAnswersObj = answers[curve2];
                            if (Object.keys(myAnonAnswersObj || {}).length) {
                                Object.keys(myAnonAnswersObj).forEach(function (uid) {
                                    myAnswers[uid] = myAnonAnswersObj[uid].msg;
                                    myAnswers[uid]._isAnon = true;
                                });
                            }
                            var myAnswersObj = answers[curve1];
                            if (Object.keys(myAnswersObj || {}).length) {
                                Object.keys(myAnswersObj).forEach(function (uid) {
                                    myAnswers[uid] = myAnswersObj[uid].msg;
                                    myAnswers[uid]._isAnon = false;
                                });
                            }
                            APP.hasAnswered = Object.keys(myAnswers).length ? myAnswers : undefined;
                            if (APP.hasAnswered) {
                                return void showAnsweredPage(framework, content, APP.hasAnswered);
                            }
                        }

                        updateForm(framework, content, false, myAnswers);
                    });
                };
            }

            getMyAnswers();

        });

        APP.getResponseMsgEditor = function (focus) {
            var t = h('textarea');
            var p = h('p.cp-form-response-msg-hint', Messages.form_responseMsg);

            var preview = h('button.btn.btn-default.cp-form-preview-button',[
                h('i.fa.fa-eye'),
                h('span', Messages.form_preview_button)
            ]);
            var edit = h('button.btn.btn-default.cp-form-edit-button', [
                h('i.fa.fa-pencil'),
                h('span', Messages.form_editBlock)
            ]);
            var del = h('button.btn.btn-danger-alt', [
                h('i.fa.fa-trash-o'),
                h('span', Messages.form_delete)
            ]);
            var editButtons = h('div.cp-form-edit-buttons-container', [ preview, edit, del ]);

            var editDiv, previewDiv;
            var div = h('div.cp-form-block.editable.nodrag', [
                h('div.cp-form-block-content', [
                    p,
                    editDiv = h('div.cp-form-response-modal', t),
                    previewDiv = h('div.cp-form-response-preview#cp-response-preview'),
                    editButtons
                ]),
            ]);
            var cm = APP.responseCM = SFCodeMirror.create("gfm", CMeditor, t);
            var editor = APP.responseEditor = cm.editor;

            var markdownTb = APP.common.createMarkdownToolbar(editor, {
                embed: function (mt) {
                    editor.focus();
                    editor.replaceSelection($(mt)[0].outerHTML);
                }
            });
            var $tb = $(markdownTb.toolbar).insertAfter($(p));

            var $edit = $(editDiv);
            var $preview = $(previewDiv);
            var $p = $(preview);
            var $e = $(edit);
            var previewState = true;

            var updatePreview = function () {
                if (!previewState) { return; }
                DiffMd.apply(DiffMd.render(content.answers.msg), $preview, APP.common);
                $preview.find('a').click(linkClickHandler);
            };

            $e.click(function () {
                previewState = false;
                $p.show();
                $e.hide();
                $edit.show();
                $preview.hide();
                editor.refresh();
                $tb.show();
            });
            APP.$e = $e;
            APP.$p = $p;
            $p.click(function () {
                previewState = true;
                updatePreview();

                $e.show();
                $p.hide();
                $edit.hide();
                $preview.show();
                $tb.hide();
            });
            if (focus) { $e.click(); }
            else { $p.click(); }


            $(del).click(function () {
                content.answers.msg = '';
                editor.setValue('');
                framework.localChange();
                $(APP.responseDiv).detach();
                $('.cp-form-response-button').show();
            });

            cm.configureTheme(APP.common, function () {});
            editor.setOption('lineNumbers', true);
            editor.setOption('lineWrapping', true);
            editor.setOption('styleActiveLine', true);
            editor.setOption('readOnly', false);
            setTimeout(function () {
                editor.setValue(content.answers.msg || '');
                editor.refresh();
                editor.save();
                if (!focus) { return; }
                editor.focus();
            });
            APP.responseDiv = div;

            editor.on('change', function () {
                content.answers.msg = editor.getValue();
                framework.localChange();
            });
            evOnChange.reg(function () {
                if (!APP.responseCM) { return; }
                APP.responseCM.contentUpdate({content: content.answers.msg});
                framework.localChange();
                updatePreview();
            });
        };

        // Disable flatpickr click propagation
        var MutationObserver = window.MutationObserver;
        var onFlatPickr = function (el) {
            $(el).on('mousedown mouseup click', function (e) {
                e.stopPropagation();
            });
        };
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node;
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('flatpickr-calendar')) {
                        onFlatPickr(node);
                    }
                }
            });
        });
        observer.observe($('body')[0], {
            childList: true,
            subtree: false
        });

        // Only redraw once every 500ms on remote change.
        // If we try to redraw in the first 500ms following a redraw, we'll
        // redraw again when the timer allows it. If we call "redrawRemote"
        // repeatedly, we'll only "redraw" once with the latest content.
        var _redraw = Util.notAgainForAnother(function (framework, content) {
            var answers, temp;
            if (!APP.isEditor) {
                answers = getFormResults(true);
                if (answers) { answers._isAnon = !APP.cantAnon; }
            } else { temp = getTempFields(); }
            if (APP.inAnsweredPage) {
                return void APP.getMyAnswers();
            }
            updateForm(framework, content, APP.isEditor, answers, temp);
        }, 500);
        var redrawTo;
        var redrawRemote = function () {
            var $main = $('.cp-form-creator-container');
            var args = Array.prototype.slice.call(arguments);
            APP.sTop = $main.scrollTop();
            var until = _redraw.apply(null, args);
            if (until) {
                clearTimeout(redrawTo);
                redrawTo = setTimeout(function (){
                    APP.sTop = $main.scrollTop();
                    _redraw.apply(null, args);
                    $main.scrollTop(APP.sTop);
                    if (typeof(APP.afterScroll) === "function") { APP.afterScroll(); }
                }, until+1);
                return;
            }
            // Only restore scroll if we were able to redraw
            $main.scrollTop(APP.sTop);
            if (typeof(APP.afterScroll) === "function") { APP.afterScroll(); }
        };
        framework.onContentUpdate(function (newContent) {
            content = newContent;
            evOnChange.fire();
            refreshEndDateBanner();

            redrawRemote(framework, content);
        });

        framework.setContentGetter(function () {
            checkIntegrity(true);
            return content;
        });

        framework.setFileImporter({ accept: ['.json'] }, function (newContent) {
            var parsed = JSON.parse(newContent || {});
            parsed.answers = content.answers;
            return parsed;
        });

        framework.setFileExporter(['.json'], function(cb, ext) {
            Exporter.main(content, cb, ext);
        }, true);


    };

    Framework.create({
        toolbarContainer: '#cp-toolbar',
        contentContainer: '#cp-app-form-editor',
    }, andThen);
});
