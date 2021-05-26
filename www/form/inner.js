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

    '/bower_components/sortablejs/Sortable.min.js',

    '/bower_components/file-saver/FileSaver.min.js',
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
    Sortable
    )
{
    var SaveAs = window.saveAs;
    var APP = window.APP = {
    };

    Messages.button_newform = "New Form"; // XXX
    Messages.form_invalid = "Invalid form";
    Messages.form_editBlock = "Edit options";
    Messages.form_editQuestion = "Edit question";

    Messages.form_newOption = "New option";

    Messages.form_default = "Your question here?";
    Messages.form_type_input = "Text"; // XXX
    Messages.form_type_radio = "Radio"; // XXX

    Messages.form_duplicates = "Duplicate entries have been removed";

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

    var editOptions = function (v, setCursorGetter, cb, tmp) {
        var add = h('button.btn.btn-secondary', [
            h('i.fa.fa-plus'),
            h('span', Messages.tag_add)
        ]);

        var cursor;
        if (tmp && tmp.content && Sortify(v) === Sortify(tmp.old)) {
            v = tmp.content.values;
            cursor = tmp.cursor;
        }

        // Show existing options
        var getOption = function (val) {
            var input = h('input', {value:val});

            // if this element was active before the remote change, restore cursor
            if (cursor && cursor.el === val) {
                input.selectionStart = cursor.start || 0;
                input.selectionEnd = cursor.end || 0;
                setTimeout(function () { input.focus(); });
            }

            var del = h('button.btn.btn-danger', h('i.fa.fa-times'));
            var el = h('div.cp-form-edit-block-input', [ input, del ]);
            $(del).click(function () { $(el).remove(); });
            return el;
        };
        var inputs = v.map(getOption);
        inputs.push(add);
        var container = h('div.cp-form-edit-block', inputs);

        // Add option
        var $add = $(add).click(function () {
            $add.before(getOption(Messages.form_newOption));
        });

        // Cancel changes
        var cancelBlock = h('button.btn.btn-secondary', Messages.cancel);
        $(cancelBlock).click(function () { cb(); });

        // Set cursor getter (to handle remote changes to the form)
        setCursorGetter(function () {
            var values = [];
            var active = document.activeElement;
            var cursor = {};
            $(container).find('input').each(function (i, el) {
                if (el === active) {
                    cursor.el= $(el).val();
                    cursor.start = el.selectionStart;
                    cursor.end = el.selectionEnd;
                }
                values.push($(el).val());
            });
            return {
                old: v,
                content: {values: values},
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
            var values = [];
            var duplicates = false;
            $(container).find('input').each(function (i, el) {
                var val = $(el).val().trim();
                if (values.indexOf(val) === -1) { values.push(val); }
                else { duplicates = true; }
            });
            if (duplicates) {
                UI.warn(Messages.form_duplicates);
            }
            cb({values: values});
        });

        return [
            container,
            h('div', [cancelBlock, saveBlock])
        ];
    };

    var getEmpty = function (empty) {
        if (empty) {
            return UI.setHTML(h('div.cp-form-results-type-text-empty'), Messages._getKey('form_notAnswered', [empty]));
        }
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
                values: ["Option 1", "Option 2"] // XXX?
            },
            get: function (opts) {
                if (!opts) { opts = TYPES.radio.defaultOpts; }
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
                        els.some(function (el, i) {
                            if (Util.isChecked($(el).find('input'))) {
                                res = opts.values[i];
                            }
                        });
                        return res;
                    },
                    reset: function () { $(tag).find('input').removeAttr('checked'); },
                    edit: function (cb, tmp) {
                        var v = opts.values.slice();
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
        }
    };

    var renderResults = function (content, answers) {
        var $container = $('div.cp-form-creator-results').empty();
        var form = content.form;
        var elements = content.order.map(function (uid) {
            var block = form[uid];
            var type = block.type;
            var model = TYPES[type];
            if (!model || !model.printResults) { return; }
            var print = model.printResults(answers, uid);

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
        var send = h('button.btn.btn-primary', update ? Messages.form_update : Messages.form_submit);
        var reset = h('button.btn.btn-danger-alt', Messages.form_reset);
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
                UI.alert(Messages.form_sent);
                $send.text(Messages.form_update);
            });
        });

        if (content.answers.privateKey) {
            var viewResults = h('button.btn.btn-primary', [
                h('span.cp-app-form-button-results', Messages.form_viewResults),
            ]);
            var sframeChan = framework._.sfCommon.getSframeChannel();
            var $v = $(viewResults).click(function () {
                $v.attr('disabled', 'disabled');
                sframeChan.query("Q_FORM_FETCH_ANSWERS", content.answers, function (err, answers) {
                    $v.removeAttr('disabled');
                    $('body').addClass('cp-app-form-results');
                    renderResults(content, answers);
                });
            });
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

            var data = model.get(block.opts);
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
                            data = model.get(newOpts);
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

        var priv = metadataMgr.getPrivateData();
        APP.isEditor = Boolean(priv.form_public);
        var $body = $('body');

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
                    $v.removeAttr('disabled');
                    $body.addClass('cp-app-form-results');
                    renderResults(content, answers);
                });

            });
            return [
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

        framework.onReady(function (isNew) {
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
