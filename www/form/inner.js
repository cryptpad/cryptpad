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

    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/form/app-form.less',
], function (
    $,
    JSONSortify,
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
    Share, Access, Properties
    )
{
    var SaveAs = window.saveAs;
    var APP = window.APP = {
    };

    Messages.button_newform = "New Form"; // XXX
    Messages.form_invalid = "Invalid form";
    Messages.form_editBlock = "Edit options";

    Messages.form_newOption = "New option";

    Messages.form_default = "Your question here?";
    Messages.form_type_input = "Text"; // XXX
    Messages.form_type_radio = "Radio"; // XXX

    Messages.form_duplicates = "Duplicate entries have been removed";

    var makeFormSettings = function (framework) {
        // XXX
        // Button to set results as public
        // Checkbox to allow anonymous answers
        // Button to clear all answers?
    };

    var TYPES = {
        input: {
            get: function () {
                var tag = h('input');
                var $tag = $(tag);
                return {
                    tag: tag,
                    getValue: function () { return $tag.val(); },
                    //setValue: function (val) { $tag.val(val); }
                };
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
                    return UI.createRadio(name, 'cp-form-'+name+'-'+i,
                               data, false, { mark: {tabindex:1} });
                });
                var tag = h('div.radio-group', els);
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
                    edit: function (cb) {
                        var v = opts.values.slice();

                        var add = h('button.btn.btn-secondary', [
                            h('i.fa.fa-plus'),
                            h('span', Messages.tag_add)
                        ]);

                        // Show existing options
                        var getOption = function (val) {
                            var input = h('input', {value:val});
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
                    }
                    //setValue: function (val) {}
                };

            },
            icon: h('i.fa.fa-list-ul')
        }
    };

    var renderForm = function (content, editable) {

    };
    var updateForm = function (framework, content, editable) {
        var $container = $('div.cp-form-creator-content');

        var form = content.form;

        // XXX order array later
        var elements = Object.keys(form).map(function (uid) {
            var block = form[uid];
            var type = block.type;
            var model = TYPES[type];
            if (!model) { return; }
            var data = model.get(block.opts);
            var q = h('div.cp-form-block-question', block.q || Messages.form_default);
            var edit, editContainer;
            if (editable) {
                // Question

                var inputQ = h('input', {
                    value: block.q || Messages.form_default
                });
                var $inputQ = $(inputQ);
                var saveQ = h('button.btn.btn-primary', [
                    h('i.fa.fa-pencil.cp-form-edit'),
                    h('span.cp-form-save', Messages.settings_save)
                ]);
                var $saveQ = $(saveQ).click(function () {
                    var v = $inputQ.val();
                    if (!v || !v.trim() || v === block.q) { return; }
                    block.q = v.trim();
                    framework.localChange();
                    $saveQ.attr('disabled', 'disabled');
                    framework._.cpNfInner.chainpad.onSettle(function () {
                        $saveQ.removeAttr('disabled');
                        $saveQ.blur();
                        UI.log(Messages.saved);
                    });
                });
                var onBlur = function (e) {
                    if (e && e.relatedTarget && e.relatedTarget === saveQ) { return; }
                    $inputQ.val(block.q);
                };
                $inputQ.keydown(function (e) {
                    if (e.which === 13) { return void $saveQ.click(); }
                    if (e.which === 27) { return void $inputQ.blur(); }
                });
                $inputQ.blur(onBlur);
                q = h('div.cp-form-input-block', [inputQ, saveQ]);

                // Values
                if (data.edit) {
                    edit = h('button.btn.btn-primary.cp-form-edit-button', [
                        h('i.fa.fa-pencil'),
                        h('span', Messages.form_editBlock)
                    ]);
                    editContainer = h('div');
                    var onSave = function (newOpts) {
                        if (!newOpts) { // Cancel edit
                            $(editContainer).empty();
                            $edit.show();
                            $(data.tag).show();
                            return;
                        }
                        $(editContainer).empty();
                        block.opts = newOpts;
                        var $oldTag = $(data.tag);
                        framework._.cpNfInner.chainpad.onSettle(function () {
                            $edit.show();
                            UI.log(Messages.saved);
                            data = model.get(newOpts);
                            $oldTag.before(data.tag).remove();
                        });
                    };
                    var $edit = $(edit).click(function () {
                        $(data.tag).hide();
                        $(editContainer).append(data.edit(onSave));
                        $edit.hide();
                    });
                }
            }
            return h('div.cp-form-block', [
                q,
                h('div.cp-form-block-content', [
                    data.tag,
                    edit
                ]),
                editContainer
            ]);
        });

        $container.empty().append(elements);
    };

    var andThen = function (framework) {
        framework.start();
        var content = {};

        var $container = $('#cp-app-form-container');

        var makeFormCreator = function () {
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
                    framework.localChange();
                    updateForm(framework, content, true);
                });
                return btn;
            });
            var controlContainer = h('div.cp-form-creator-control', controls);

            var contentContainer = h('div.cp-form-creator-content');
            var div = h('div.cp-form-creator-container', [
                controlContainer,
                contentContainer,
            ]);
            return div;
        };

        $container.append(makeFormCreator());

        var sframeChan = framework._.sfCommon.getSframeChannel();
        var metadataMgr = framework._.cpNfInner.metadataMgr;
        var priv = metadataMgr.getPrivateData();
        APP.isEditor = Boolean(priv.form_public);

        framework.onReady(function (isNew) {
            var priv = metadataMgr.getPrivateData();
            if (APP.isEditor) {
                if (!content.form) {
                    content.form = {};
                    framework.localChange();
                }
                if (!content.answers || !content.answers.channel || !content.answers.publicKey) {
                    content.answers = {
                        channel: Hash.createChannelId(),
                        publicKey: priv.form_public
                    };
                    framework.localChange();
                }
            }

            if (!content.answers || !content.answers.channel || !content.answers.publicKey) {
                return void UI.errorLoadingScreen(Messages.form_invalid);
            }
            // XXX fetch answers and
            //  * viewers ==> check if you've already answered and show form (new or edit)
            //  * editors ==> show schema and warn users if existing questions already have answers
            if (APP.isEditor) {
                sframeChan.query("Q_FORM_FETCH_ANSWERS", {
                    channel: content.answers.channel,
                    publicKey: content.answers.publicKey
                }, function () {
                    updateForm(framework, content, true);

                });
                return;
            }
            updateForm(framework, content, false);

        });

        framework.onContentUpdate(function (newContent) {
            console.log(newContent);
            content = newContent;
        });

        framework.setContentGetter(function () {
            return content;
        });

    };

    Framework.create({
        toolbarContainer: '#cp-toolbar',
        contentContainer: '#cp-app-form-editor',
    }, andThen);
});
