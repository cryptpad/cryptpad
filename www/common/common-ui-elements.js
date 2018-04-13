define([
    'jquery',
    '/api/config',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-language.js',
    '/common/common-interface.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/hyperscript.js',
    '/common/media-tag.js',
    '/common/clipboard.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/bower_components/nthen/index.js',
], function ($, Config, Util, Hash, Language, UI, Constants, Feedback, h, MediaTag, Clipboard,
             Messages, AppConfig, NThen) {
    var UIElements = {};

    // Configure MediaTags to use our local viewer
    if (MediaTag && MediaTag.PdfPlugin) {
        MediaTag.PdfPlugin.viewer = '/common/pdfjs/web/viewer.html';
    }

    UIElements.updateTags = function (common, href) {
        var sframeChan = common.getSframeChannel();
        sframeChan.query('Q_TAGS_GET', href || null, function (err, res) {
            if (err || res.error) {
                if (res.error === 'NO_ENTRY') {
                    UI.alert(Messages.tags_noentry);
                }
                return void console.error(err || res.error);
            }
            UI.dialog.tagPrompt(res.data, function (tags) {
                if (!Array.isArray(tags)) { return; }
                sframeChan.event('EV_TAGS_SET', {
                    tags: tags,
                    href: href,
                });
            });
        });
    };

    var importContent = function (type, f, cfg) {
        return function () {
            var $files = $('<input>', {type:"file"});
            if (cfg && cfg.accept) {
                $files.attr('accept', cfg.accept);
            }
            $files.click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    var getPropertiesData = function (common, cb) {
        var data = {};
        NThen(function (waitFor) {
            common.getPadAttribute('href', waitFor(function (err, val) {
                var base = common.getMetadataMgr().getPrivateData().origin;

                var parsed = Hash.parsePadUrl(val);
                if (parsed.hashData.mode === "view") {
                    data.roHref = base + val;
                    return;
                }

                // We're not in a read-only pad
                data.href = base + val;
                // Get Read-only href
                if (parsed.hashData.type !== "pad") { return; }
                var i = data.href.indexOf('#') + 1;
                var hBase = data.href.slice(0, i);
                var hrefsecret = Hash.getSecrets(parsed.type, parsed.hash);
                if (!hrefsecret.keys) { return; }
                var viewHash = Hash.getViewHashFromKeys(hrefsecret.channel, hrefsecret.keys);
                data.roHref = hBase + viewHash;
            }));
            common.getPadAttribute('atime', waitFor(function (err, val) {
                data.atime = val;
            }));
            common.getPadAttribute('ctime', waitFor(function (err, val) {
                data.ctime = val;
            }));
            common.getPadAttribute('tags', waitFor(function (err, val) {
                data.tags = val;
            }));
            common.getPadAttribute('owners', waitFor(function (err, val) {
                data.owners = val;
            }));
            common.getPadAttribute('expire', waitFor(function (err, val) {
                data.expire = val;
            }));
        }).nThen(function () {
            cb(void 0, data);
        });
    };
    var getRightsProperties = function (common, data, cb) {
        var $d = $('<div>');
        if (!data) { return void cb(void 0, $d); }

        $('<label>', {'for': 'cp-app-prop-owners'}).text(Messages.creation_owners)
            .appendTo($d);
        var owners = Messages.creation_noOwner;
        var edPublic = common.getMetadataMgr().getPrivateData().edPublic;
        var owned = false;
        if (data.owners && data.owners.length) {
            if (data.owners.indexOf(edPublic) !== -1) {
                owners = Messages.yourself;
                owned = true;
            } else {
                owners = Messages.creation_ownedByOther;
            }
        }
        $d.append(UI.dialog.selectable(owners, {
            id: 'cp-app-prop-owners',
        }));
        /* TODO
        if (owned) {
            var $deleteOwned = $('button').text(Messages.fc_delete_owned).click(function () {
            });
            $d.append($deleteOwned);
        }*/

        var expire = Messages.creation_expireFalse;
        if (data.expire && typeof (data.expire) === "number") {
            expire = new Date(data.expire).toLocaleString();
        }
        $('<label>', {'for': 'cp-app-prop-expire'}).text(Messages.creation_expiration)
            .appendTo($d);
        $d.append(UI.dialog.selectable(expire, {
            id: 'cp-app-prop-expire',
        }));
        cb(void 0, $d);
    };
    var getPadProperties = function (common, data, cb) {
        var $d = $('<div>');
        if (!data || (!data.href && !data.roHref)) { return void cb(void 0, $d); }

        if (data.href) {
            $('<label>', {'for': 'cp-app-prop-link'}).text(Messages.editShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.href, {
                id: 'cp-app-prop-link',
            }));
        }

        if (data.roHref) {
            $('<label>', {'for': 'cp-app-prop-rolink'}).text(Messages.viewShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.roHref, {
                id: 'cp-app-prop-rolink',
            }));
        }

        if (data.tags && Array.isArray(data.tags)) {
            $('<label>', {'for': 'cp-app-prop-tags'}).text(Messages.fm_prop_tagsList).appendTo($d);
            $d.append(UI.dialog.selectable(data.tags.join(', '), {
                id: 'cp-app-prop-tags',
            }));
        }

        $('<label>', {'for': 'cp-app-prop-ctime'}).text(Messages.fm_creation)
            .appendTo($d);
        $d.append(UI.dialog.selectable(new Date(data.ctime).toLocaleString(), {
            id: 'cp-app-prop-ctime',
        }));

        $('<label>', {'for': 'cp-app-prop-atime'}).text(Messages.fm_lastAccess)
            .appendTo($d);
        $d.append(UI.dialog.selectable(new Date(data.atime).toLocaleString(), {
            id: 'cp-app-prop-atime',
        }));

        if (common.isLoggedIn() && AppConfig.enablePinning) {
            // check the size of this file...
            common.getFileSize(data.href, function (e, bytes) {
                if (e) {
                    // there was a problem with the RPC
                    console.error(e);

                    // but we don't want to break the interface.
                    // continue as if there was no RPC
                    return void cb(void 0, $d);
                }
                var KB = Util.bytesToKilobytes(bytes);

                var formatted = Messages._getKey('formattedKB', [KB]);
                $('<br>').appendTo($d);

                $('<label>', {
                    'for': 'cp-app-prop-size'
                }).text(Messages.fc_sizeInKilobytes).appendTo($d);

                $d.append(UI.dialog.selectable(formatted, {
                    id: 'cp-app-prop-size',
                }));
                cb(void 0, $d);
            });
        } else {
            cb(void 0, $d);
        }
    };
    UIElements.getProperties = function (common, data, cb) {
        var c1;
        var c2;
        NThen(function (waitFor) {
            getPadProperties(common, data, waitFor(function (e, c) {
                c1 = c[0];
            }));
            getRightsProperties(common, data, waitFor(function (e, c) {
                c2 = c[0];
            }));
        }).nThen(function () {
            var tabs = UI.dialog.tabs([{
                title: Messages.fc_prop,
                content: c1
            }, {
                title: Messages.creation_propertiesTitle,
                content: c2
            }]);
            cb (void 0, $(tabs));
        });
    };

    UIElements.createShareModal = function (config) {
        var origin = config.origin;
        var pathname = config.pathname;
        var hashes = config.hashes;
        var common = config.common;

        // Share link tab
        var link = h('div.cp-share-modal', [
            h('label', Messages.share_linkAccess),
            h('br'),
            h('input#cp-share-editable-true.cp-share-editable-value', {
                type: 'radio',
                name: 'cp-share-editable',
                value: 1,
            }),
            h('label', { 'for': 'cp-share-editable-true' }, Messages.share_linkEdit),
            h('input#cp-share-editable-false.cp-share-editable-value', {
                type: 'radio',
                name: 'cp-share-editable',
                value: 0
            }),
            h('label', { 'for': 'cp-share-editable-false' }, Messages.share_linkView),
            h('br'),
            h('br'),
            h('label', Messages.share_linkOptions),
            h('br'),
            h('input#cp-share-embed', {
                type: 'checkbox',
                name: 'cp-share-embed'
            }),
            h('label', { 'for': 'cp-share-embed' }, Messages.share_linkEmbed),
            h('br'),
            h('input#cp-share-present', {
                type: 'checkbox',
                name: 'cp-share-present'
            }),
            h('label', { 'for': 'cp-share-present' }, Messages.share_linkPresent),
            h('br'),
            h('br'),
            UI.dialog.selectable('', { id: 'cp-share-link-preview' })
        ]);
        if (!hashes.editHash) {
            $(link).find('#cp-share-editable-false').attr('checked', true);
            $(link).find('#cp-share-editable-true').removeAttr('checked').attr('disabled', true);
        }
        var saveValue = function () {
            var edit = Util.isChecked($(link).find('#cp-share-editable-true'));
            var embed = Util.isChecked($(link).find('#cp-share-embed'));
            var present = Util.isChecked($(link).find('#cp-share-present'));
            common.setAttribute(['general', 'share'], {
                edit: edit,
                embed: embed,
                present: present
            });
        };
        var getLinkValue = function (initValue) {
            var val = initValue || {};
            var edit = initValue ? val.edit : Util.isChecked($(link).find('#cp-share-editable-true'));
            var embed = initValue ? val.embed : Util.isChecked($(link).find('#cp-share-embed'));
            var present = initValue ? val.present : Util.isChecked($(link).find('#cp-share-present'));

            var hash = (edit && hashes.editHash) ? hashes.editHash : hashes.viewHash;
            var href = origin + pathname + '#' + hash;
            var parsed = Hash.parsePadUrl(href);
            return origin + parsed.getUrl({embed: embed, present: present});
        };
        $(link).find('#cp-share-link-preview').val(getLinkValue());
        $(link).find('input[type="radio"], input[type="checkbox"]').on('change', function () {
            $(link).find('#cp-share-link-preview').val(getLinkValue());
        });
        var linkButtons = [{
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                saveValue();
                var v = getLinkValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.share_linkOpen,
            onClick: function () {
                saveValue();
                var v = getLinkValue();
                window.open(v);
            },
            keys: [[13, 'ctrl']]
        }];
        var frameLink = UI.dialog.customModal(link, {buttons: linkButtons});

        // Embed tab
        var getEmbedValue = function () {
            var hash = hashes.viewHash || hashes.editHash;
            var href = origin + pathname + '#' + hash;
            var parsed = Hash.parsePadUrl(href);
            var url = origin + parsed.getUrl({embed: true, present: true});
            return '<iframe src="' + url + '"></iframe>';
        };
        var embed = h('div.cp-share-modal', [
            h('h3', Messages.viewEmbedTitle),
            h('p', Messages.viewEmbedTag),
            h('br'),
            UI.dialog.selectable(getEmbedValue())
        ]);
        var embedButtons = [{
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                var v = getEmbedValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameEmbed = UI.dialog.customModal(embed, { buttons: embedButtons});

        // Create modal
        var tabs = [{
            title: Messages.share_linkCategory,
            content: frameLink
        }, {
            title: Messages.share_embedCategory,
            content: frameEmbed
        }];
        if (typeof(AppConfig.customizeShareOptions) === 'function') {
            AppConfig.customizeShareOptions(hashes, tabs, {
                type: 'DEFAULT',
                origin: origin,
                pathname: pathname
            });
        }
        common.getAttribute(['general', 'share'], function (err, val) {
            val = val || {};
            if (val.edit === false) {
                $(link).find('#cp-share-editable-false').prop('checked', true);
            }
            else { $(link).find('#cp-share-editable-true').prop('checked', true); }
            if (val.embed) { $(link).find('#cp-share-embed').prop('checked', true); }
            if (val.present) { $(link).find('#cp-share-present').prop('checked', true); }
            $(link).find('#cp-share-link-preview').val(getLinkValue(val));
        });
        common.getMetadataMgr().onChange(function () {
            hashes = common.getMetadataMgr().getPrivateData().availableHashes;
            $(link).find('#cp-share-link-preview').val(getLinkValue());
        });
        return tabs;
    };
    UIElements.createFileShareModal = function (config) {
        var origin = config.origin;
        var pathname = config.pathname;
        var hashes = config.hashes;
        var common = config.common;

        if (!hashes.fileHash) { throw new Error("You must provide a file hash"); }
        var url = origin + pathname + '#' + hashes.fileHash;


        // Share link tab
        var link = h('div.cp-share-modal', [
            UI.dialog.selectable('', { id: 'cp-share-link-preview' })
        ]);
        var getLinkValue = function () { return url; };
        $(link).find('#cp-share-link-preview').val(getLinkValue());
        var linkButtons = [{
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                var v = getLinkValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameLink = UI.dialog.customModal(link, {buttons: linkButtons});

        // Embed tab
        var embed = h('div.cp-share-modal', [
            h('h3', Messages.fileEmbedTitle),
            h('p', Messages.fileEmbedScript),
            h('br'),
            UI.dialog.selectable(common.getMediatagScript()),
            h('p', Messages.fileEmbedTag),
            h('br'),
            UI.dialog.selectable(common.getMediatagFromHref(url)),
        ]);
        var embedButtons = [{
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_mediatagCopy,
            onClick: function () {
                var v = common.getMediatagFromHref(url);
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameEmbed = UI.dialog.customModal(embed, { buttons: embedButtons});

        // Create modal
        var tabs = [{
            title: Messages.share_linkCategory,
            content: frameLink
        }, {
            title: Messages.share_embedCategory,
            content: frameEmbed
        }];
        if (typeof(AppConfig.customizeShareOptions) === 'function') {
            AppConfig.customizeShareOptions(hashes, tabs, {
                type: 'FILE',
                origin: origin,
                pathname: pathname
            });
        }
        return tabs;
    };

    UIElements.createButton = function (common, type, rightside, data, callback) {
        var AppConfig = common.getAppConfig();
        var button;
        var sframeChan = common.getSframeChannel();
        var appType = (common.getMetadataMgr().getMetadata().type || 'pad').toUpperCase();
        switch (type) {
            case 'export':
                button = $('<button>', {
                    'class': 'fa fa-download cp-toolbar-icon-export',
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.exportButton));

                button.click(common.prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    'class': 'fa fa-upload cp-toolbar-icon-import',
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.importButton));
                /*if (data.types) {
                    // New import button in the toolbar
                    var importFunction = {
                        template: function () {
                            UIElements.openTemplatePicker(common, true);
                        },
                        file: function (cb) {
                            importContent('text/plain', function (content, file) {
                                cb(content, file);
                            }, {accept: data ? data.accept : undefined})
                        }
                    };
                    var toImport = [];
                    Object.keys(data.types).forEach(function (importType) {
                        if (!importFunction[importType] || !data.types[importType]) { return; }
                        var option = h('button', importType);
                        $(option).click(function () {
                            importFunction[importType](data.types[importType]);
                        });
                        toImport.push(options);
                    });

                    button.click(common.prepareFeedback(type));

                    if (toImport.length === 1) {
                        button.click(function () { $(toImport[0]).click(); });
                    } else {
                        Cryptpad.alert(h('p.cp-import-container', toImport));
                    }
                }
                else if (callback) {*/
                    // Old import button, used in settings
                    button
                    .click(common.prepareFeedback(type))
                    .click(importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
                //}
                break;
            case 'upload':
                button = $('<button>', {
                    'class': 'btn btn-primary new',
                    title: Messages.uploadButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload'})).append(' '+Messages.uploadButton);
                if (!data.FM) { return; }
                var $input = $('<input>', {
                    'type': 'file',
                    'style': 'display: none;'
                }).on('change', function (e) {
                    var file = e.target.files[0];
                    var ev = {
                        target: data.target
                    };
                    if (data.filter && !data.filter(file)) {
                        return;
                    }
                    if (data.transformer) {
                        data.transformer(file, function (newFile) {
                            data.FM.handleFile(newFile, ev);
                            if (callback) { callback(); }
                        });
                        return;
                    }
                    data.FM.handleFile(file, ev);
                    if (callback) { callback(); }
                });
                if (data.accept) { $input.attr('accept', data.accept); }
                button.click(function () { $input.click(); });
                break;
            case 'importtemplate':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = $('<button>', {
                    'class': 'fa fa-upload cp-toolbar-icon-import',
                    title: Messages.template_import,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.template_import));
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    UIElements.openTemplatePicker(common, true);
                });
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = $('<button>', {
                    title: Messages.saveTemplateButton,
                    class: 'fa fa-bookmark cp-toolbar-icon-template'
                });
                if (data.rt) {
                    button
                    .click(function () {
                        var title = data.getTitle() || document.title;
                        var todo = function (val) {
                            if (typeof(val) !== "string") { return; }
                            var toSave = data.rt.getUserDoc();
                            if (val.trim()) {
                                val = val.trim();
                                title = val;
                                try {
                                    var parsed = JSON.parse(toSave);
                                    var meta;
                                    if (Array.isArray(parsed) && typeof(parsed[3]) === "object") {
                                        meta = parsed[3].metadata; // pad
                                    } else if (parsed.info) {
                                        meta = parsed.info; // poll
                                    } else {
                                        meta = parsed.metadata;
                                    }
                                    if (typeof(meta) === "object") {
                                        meta.title = val;
                                        meta.defaultTitle = val;
                                        delete meta.users;
                                    }
                                    toSave = JSON.stringify(parsed);
                                } catch(e) {
                                    console.error("Parse error while setting the title", e);
                                }
                            }
                            sframeChan.query('Q_SAVE_AS_TEMPLATE', {
                                title: title,
                                toSave: toSave
                            }, function () {
                                UI.alert(Messages.templateSaved);
                                Feedback.send('TEMPLATE_CREATED');
                            });
                        };
                        UI.prompt(Messages.saveTemplatePrompt, title, todo);
                    });
                }
                break;
            case 'forget':
                button = $('<button>', {
                    title: Messages.forgetButtonTitle,
                    'class': "fa fa-trash cp-toolbar-icon-forget"
                });
                callback = typeof callback === "function" ? callback : function () {};
                button
                .click(common.prepareFeedback(type))
                .click(function() {
                    var msg = common.isLoggedIn() ? Messages.forgetPrompt : Messages.fm_removePermanentlyDialog;
                    UI.confirm(msg, function (yes) {
                        if (!yes) { return; }
                        sframeChan.query('Q_MOVE_TO_TRASH', null, function (err) {
                            if (err) { return void callback(err); }
                            var cMsg = common.isLoggedIn() ? Messages.movedToTrash : Messages.deleted;
                            var msg = common.fixLinks($('<div>').html(cMsg));
                            UI.alert(msg);
                            callback();
                            return;
                        });
                    });
                });
                break;
            case 'present':
                button = $('<button>', {
                    title: Messages.presentButtonTitle,
                    'class': "fa fa-play-circle cp-toolbar-icon-present", // used in slide.js
                });
                break;
            case 'preview':
                button = $('<button>', {
                    title: Messages.previewButtonTitle,
                    'class': "fa fa-eye cp-toolbar-icon-preview",
                });
                break;
            case 'print':
                button = $('<button>', {
                    title: Messages.printButtonTitle,
                    'class': "fa fa-print cp-toolbar-icon-print",
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.printText));
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                button = $('<button>', {
                    title: Messages.historyButton,
                    'class': "fa fa-history cp-toolbar-icon-history",
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.historyText));
                if (data.histConfig) {
                    button
                    .click(common.prepareFeedback(type))
                    .on('click', function () {
                        common.getHistory(data.histConfig);
                    });
                }
                break;
            case 'more':
                button = $('<button>', {
                    title: Messages.moreActions,
                    'class': "cp-toolbar-drawer-button fa fa-ellipsis-h",
                });
                break;
            case 'mediatag':
                button = $('<button>', {
                    'class': 'fa fa-picture-o cp-toolbar-icon-mediatag',
                    title: Messages.filePickerButton,
                })
                .click(common.prepareFeedback(type));
                break;
            case 'savetodrive':
                button = $('<button>', {
                    'class': 'fa fa-cloud-upload cp-toolbar-icon-savetodrive',
                    title: Messages.canvas_saveToDrive,
                })
                .click(common.prepareFeedback(type));
                break;
            case 'hashtag':
                button = $('<button>', {
                    'class': 'fa fa-hashtag cp-toolbar-icon-hashtag',
                    title: Messages.tags_title,
                })
                .click(common.prepareFeedback(type))
                .click(function () { UIElements.updateTags(common, null); });
                break;
            case 'toggle':
                button = $('<button>', {
                    'class': 'fa fa-caret-down cp-toolbar-icon-toggle',
                });
                window.setTimeout(function () {
                    button.attr('title', data.title);
                });
                var updateIcon = function (isVisible) {
                    button.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    if (!isVisible) { button.addClass('fa-caret-down'); }
                    else { button.addClass('fa-caret-up'); }
                };
                button.click(function (e) {
                    data.element.toggle();
                    var isVisible = data.element.is(':visible');
                    if (callback) { callback(isVisible); }
                    if (isVisible) {
                        button.addClass('cp-toolbar-button-active');
                        if (e.originalEvent) { Feedback.send('TOGGLE_SHOW_' + appType); }
                    } else {
                        button.removeClass('cp-toolbar-button-active');
                        if (e.originalEvent) { Feedback.send('TOGGLE_HIDE_' + appType); }
                    }
                    updateIcon(isVisible);
                });
                updateIcon(data.element.is(':visible'));
                break;
            case 'properties':
                button = $('<button>', {
                    'class': 'fa fa-info-circle cp-toolbar-icon-properties',
                    title: Messages.propertiesButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'})
                .text(Messages.propertiesButton))
                .click(common.prepareFeedback(type))
                .click(function () {
                    getPropertiesData(common, function (e, data) {
                        if (e) { return void console.error(e); }
                        UIElements.getProperties(common, data, function (e, $prop) {
                            if (e) { return void console.error(e); }
                            UI.alert($prop[0], undefined, true);
                        });
                    });
                });
                break;
            default:
                data = data || {};
                var icon = data.icon || "fa-question";
                button = $('<button>', {
                    'class': "fa " + icon,
                })
                .click(common.prepareFeedback(data.name || 'DEFAULT'));
                if (data.title) { button.attr('title', data.title); }
                if (data.style) { button.attr('style', data.style); }
                if (data.id) { button.attr('id', data.id); }
                if (data.hiddenReadOnly) { button.addClass('cp-hidden-if-readonly'); }
                if (data.name) {
                    button.addClass('cp-toolbar-icon-'+data.name);
                    button.click(common.prepareFeedback(data.name));
                }
                if (data.text) {
                    $('<span>', {'class': 'cp-toolbar-drawer-element'}).text(data.text)
                        .appendTo(button);
                }
        }
        if (rightside) {
            button.addClass('cp-toolbar-rightside-button');
        }
        return button;
    };

    var createMdToolbar = function (common, editor) {
        var $toolbar = $('<div>', {
            'class': 'cp-markdown-toolbar'
        });
        var clean = function (str) {
            return str.replace(/^(\n)+/, '').replace(/(\n)+$/, '');
        };
        var actions = {
            'bold': {
                expr: '**{0}**',
                icon: 'fa-bold'
            },
            'italic': {
                expr: '_{0}_',
                icon: 'fa-italic'
            },
            'strikethrough': {
                expr: '~~{0}~~',
                icon: 'fa-strikethrough'
            },
            'heading': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '# '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-header'
            },
            'link': {
                expr: '[{0}](http://)',
                icon: 'fa-link'
            },
            'quote': {
                apply: function (str) {
                    return '\n\n'+str.split('\n').map(function (line) {
                        return '> '+line;
                    }).join('\n')+'\n\n';
                },
                icon: 'fa-quote-right'
            },
            'nlist': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '1. '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ol'
            },
            'list': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '* '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ul'
            },
            'check': {
                apply: function (str) {
                    return '\n' + clean(str).split('\n').map(function (line) {
                        return '* [ ] ' + line;
                    }).join('\n') + '\n';
                },
                icon: 'fa-check-square-o'
            },
            'code': {
                apply: function (str) {
                    if (str.indexOf('\n') !== -1) {
                        return '\n```\n' + clean(str) + '\n```\n';
                    }
                    return '`' + str + '`';
                },
                icon: 'fa-code'
            }
        };
        var onClick = function () {
            var type = $(this).attr('data-type');
            var texts = editor.getSelections();
            var newTexts = texts.map(function (str) {
                str = str || Messages.mdToolbar_defaultText;
                if (actions[type].apply) {
                    return actions[type].apply(str);
                }
                return actions[type].expr.replace('{0}', str);
            });
            editor.replaceSelections(newTexts, 'around');
            editor.focus();
        };
        for (var k in actions) {
            $('<button>', {
                'data-type': k,
                'class': 'fa ' + actions[k].icon,
                title: Messages['mdToolbar_' + k] || k
            }).click(onClick).appendTo($toolbar);
        }
        $('<button>', {
            'class': 'fa fa-question cp-markdown-help',
            title: Messages.mdToolbar_help
        }).click(function () {
            var href = Messages.mdToolbar_tutorial;
            common.openUnsafeURL(href);
        }).appendTo($toolbar);
        return $toolbar;
    };
    UIElements.createMarkdownToolbar = function (common, editor) {
        var readOnly = common.getMetadataMgr().getPrivateData().readOnly;
        if (readOnly) {
            return {
                toolbar: $(),
                button: $(),
                setState: function () {}
            };
        }

        var $toolbar = createMdToolbar(common, editor);
        var cfg = {
            title: Messages.mdToolbar_button,
            element: $toolbar
        };
        var onClick = function (visible) {
            common.setAttribute(['general', 'markdown-help'], visible, function (e) {
                if (e) { return void console.error(e); }
            });
        };

        var $toolbarButton = common.createButton('toggle', true, cfg, onClick);
        var tbState = true;
        common.getAttribute(['general', 'markdown-help'], function (e, data) {
            if (e) { return void console.error(e); }
            if ($(window).height() < 800 && $(window).width() < 800) { return; }
            if (data === true && $toolbarButton.length && tbState) {
                $toolbarButton.click();
            }
        });

        // setState provides the ability to disable the toolbar and the button in case we don't
        // have the markdown editor available (in code we can switch mode, in poll we can publish)
        var setState = function (state) {
            tbState = state;
            if (!state) {
                $toolbar.hide();
                $toolbarButton.hide();
                return;
            }
            common.getAttribute(['general', 'markdown-help'], function (e, data) {
                if (e) { return void console.error(e); }
                if ($(window).height() < 800 && $(window).width() < 800) { return; }
                if (data === true && $toolbarButton) {
                    // Show the toolbar using the button to make sure the icon in the button is
                    // correct (caret-down / caret-up)
                    $toolbar.hide();
                    $toolbarButton.click();
                    return;
                }
                $toolbar.show();
                $toolbarButton.click();
            });
            $toolbarButton.show();
        };

        return {
            toolbar: $toolbar,
            button: $toolbarButton,
            setState: setState
        };
    };

    UIElements.createHelpMenu = function (common, categories) {
        var type = common.getMetadataMgr().getMetadata().type || 'pad';

        var setHTML = function (e, html) {
            e.innerHTML = html;
            return e;
        };

        var elements = [];
        if (Messages.help && Messages.help.generic) {
            Object.keys(Messages.help.generic).forEach(function (el) {
                elements.push(setHTML(h('li'), Messages.help.generic[el]));
            });
        }
        if (categories) {
            categories.forEach(function (cat) {
                var msgs = Messages.help[cat];
                if (msgs) {
                    Object.keys(msgs).forEach(function (el) {
                        elements.push(setHTML(h('li'), msgs[el]));
                    });
                }
            });
        }

        var text = h('p.cp-help-text', [
            h('h1', Messages.help.title),
            h('ul', elements)
        ]);

        common.fixLinks(text);

        var closeButton = h('span.cp-help-close.fa.fa-window-close');
        var $toolbarButton = common.createButton('', true, {
            title: Messages.hide_help_button,
            text: Messages.help_button,
            name: 'help'
        }).addClass('cp-toolbar-button-active');
        var help = h('div.cp-help-container', [
            closeButton,
            text
        ]);

        var toggleHelp = function (forceClose) {
            if ($(help).hasClass('cp-help-hidden')) {
                if (forceClose) { return; }
                common.setAttribute(['hideHelp', type], false);
                $toolbarButton.addClass('cp-toolbar-button-active');
                $toolbarButton.attr('title', Messages.hide_help_button);
                return void $(help).removeClass('cp-help-hidden');
            }
            $toolbarButton.removeClass('cp-toolbar-button-active');
            $toolbarButton.attr('title', Messages.show_help_button);
            $(help).addClass('cp-help-hidden');
            common.setAttribute(['hideHelp', type], true);
        };

        $(closeButton).click(function () { toggleHelp(true); });
        $toolbarButton.click(function () {
            toggleHelp();
        });

        common.getAttribute(['hideHelp', type], function (err, val) {
            if ($(window).height() < 800 && $(window).width() < 800) { return void toggleHelp(true); }
            if (val === true) { toggleHelp(true); }
        });

        return {
            menu: help,
            button: $toolbarButton,
            text: text
        };
    };

    // Avatars

    // Enable mediatags
    $(window.document).on('decryption', function (e) {
        var decrypted = e.originalEvent;
        if (decrypted.callback) {
            var cb = decrypted.callback;
            cb(function (mediaObject) {
                var root = mediaObject.element;
                if (!root) { return; }

                if (mediaObject.type === 'image') {
                    $(root).data('blob', decrypted.blob);
                }

                if (mediaObject.type !== 'download') { return; }

                var metadata = decrypted.metadata;

                var title = '';
                var size = 0;
                if (metadata && metadata.name) {
                    title = metadata.name;
                }

                if (decrypted.blob) {
                    size = decrypted.blob.size;
                }

                var sizeMb = Util.bytesToMegabytes(size);

                var $btn = $(root).find('button');
                $btn.addClass('btn btn-success')
                    .attr('type', 'download')
                    .html(function () {
                        var text = Messages.download_mt_button + '<br>';
                        if (title) {
                            text += '<b>' + Util.fixHTML(title) + '</b><br>';
                        }
                        if (size) {
                            text += '<em>' + Messages._getKey('formattedMB', [sizeMb]) + '</em>';
                        }
                        return text;
                    });
            });
        }
    });

    UIElements.displayMediatagImage = function (Common, $tag, cb) {
        if (!$tag.length || !$tag.is('media-tag')) { return void cb('NOT_MEDIATAG'); }
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    if (mutation.addedNodes.length > 1 ||
                        mutation.addedNodes[0].nodeName !== 'IMG') {
                        return void cb('NOT_IMAGE');
                    }
                    var $image = $tag.find('img');
                    var onLoad = function () {
                        var img = new Image();
                        img.onload = function () {
                            var _cb = cb;
                            cb = $.noop;
                            _cb(null, $image, img);
                        };
                        img.src = $image.attr('src');
                    };
                    if ($image[0].complete) { onLoad(); }
                    $image.on('load', onLoad);
                }
            });
        });
        observer.observe($tag[0], {
            attributes: false,
            childList: true,
            characterData: false
        });
        MediaTag($tag[0]);
    };

    var emoji_patt = /([\uD800-\uDBFF][\uDC00-\uDFFF])/;
    var isEmoji = function (str) {
      return emoji_patt.test(str);
    };
    var emojiStringToArray = function (str) {
      var split = str.split(emoji_patt);
      var arr = [];
      for (var i=0; i<split.length; i++) {
        var char = split[i];
        if (char !== "") {
          arr.push(char);
        }
      }
      return arr;
    };
    var getFirstEmojiOrCharacter = function (str) {
      if (!str || !str.trim()) { return '?'; }
      var emojis = emojiStringToArray(str);
      return isEmoji(emojis[0])? emojis[0]: str[0];
    };
    UIElements.displayAvatar = function (Common, $container, href, name, cb) {
        var displayDefault = function () {
            var text = getFirstEmojiOrCharacter(name);
            var $avatar = $('<span>', {'class': 'cp-avatar-default'}).text(text);
            $container.append($avatar);
            if (cb) { cb(); }
        };
        if (!window.Symbol) { return void displayDefault(); } // IE doesn't have Symbol
        if (!href) { return void displayDefault(); }

        var centerImage = function ($img, $image, img) {
            var w = img.width;
            var h = img.height;
            if (w>h) {
                $image.css('max-height', '100%');
                $img.css('flex-direction', 'column');
                if (cb) { cb($img); }
                return;
            }
            $image.css('max-width', '100%');
            $img.css('flex-direction', 'row');
            if (cb) { cb($img); }
        };

        var parsed = Hash.parsePadUrl(href);
        if (parsed.type !== "file" || parsed.hashData.type !== "file") {
            var $img = $('<media-tag>').appendTo($container);
            var img = new Image();
            $(img).attr('src', href);
            img.onload = function () {
                centerImage($img, $(img), img);
                $(img).appendTo($img);
            };
            return;
        }
        var secret = Hash.getSecrets('file', parsed.hash);
        if (secret.keys && secret.channel) {
            var cryptKey = secret.keys && secret.keys.fileKeyStr;
            var hexFileName = Util.base64ToHex(secret.channel);
            var src = Hash.getBlobPathFromHex(hexFileName);
            Common.getFileSize(href, function (e, data) {
                if (e) {
                    displayDefault();
                    return void console.error(e);
                }
                if (typeof data !== "number") { return void displayDefault(); }
                if (Util.bytesToMegabytes(data) > 0.5) { return void displayDefault(); }
                var $img = $('<media-tag>').appendTo($container);
                $img.attr('src', src);
                $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
                UIElements.displayMediatagImage(Common, $img, function (err, $image, img) {
                    if (err) { return void console.error(err); }
                    centerImage($img, $image,  img);
                });
            });
        }
    };

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    UIElements.createUsageBar = function (common, cb) {
        if (AppConfig.hideUsageBar) { return cb('USAGE_BAR_HIDDEN'); }
        if (!common.isLoggedIn()) { return cb("NOT_LOGGED_IN"); }
        // getPinnedUsage updates common.account.usage, and other values
        // so we can just use those and only check for errors
        var $container = $('<span>', {'class':'cp-limit-container'});
        var todo = function (err, data) {
            if (err || !data) { return void console.error(err || 'No data'); }

            var usage = data.usage;
            var limit = data.limit;
            var plan = data.plan;
            $container.html('');
            var unit = Util.magnitudeOfBytes(limit);

            usage = unit === 'GB'? Util.bytesToGigabytes(usage):
                Util.bytesToMegabytes(usage);
            limit = unit === 'GB'? Util.bytesToGigabytes(limit):
                Util.bytesToMegabytes(limit);

            var $limit = $('<span>', {'class': 'cp-limit-bar'}).appendTo($container);
            var quota = usage/limit;
            var $usage = $('<span>', {'class': 'cp-limit-usage'}).css('width', quota*100+'%');

            var urls = common.getMetadataMgr().getPrivateData().accounts;
            var makeDonateButton = function () {
                $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: urls.donateURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.supportCryptpad).appendTo($container);
            };

            var makeUpgradeButton = function () {
                $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: urls.upgradeURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.upgradeAccount).appendTo($container);
            };

            if (!Config.removeDonateButton) {
                if (!common.isLoggedIn() || !Config.allowSubscriptions) {
                    // user is not logged in, or subscriptions are disallowed
                    makeDonateButton();
                } else if (!plan) {
                    // user is logged in and subscriptions are allowed
                    // and they don't have one. show upgrades
                    makeUpgradeButton();
                } else {
                    // they have a plan. show nothing
                }
            }

            var prettyUsage;
            var prettyLimit;

            if (unit === 'GB') {
                prettyUsage = Messages._getKey('formattedGB', [usage]);
                prettyLimit = Messages._getKey('formattedGB', [limit]);
            } else {
                prettyUsage = Messages._getKey('formattedMB', [usage]);
                prettyLimit = Messages._getKey('formattedMB', [limit]);
            }

            if (quota < 0.8) { $usage.addClass('cp-limit-usage-normal'); }
            else if (quota < 1) { $usage.addClass('cp-limit-usage-warning'); }
            else { $usage.addClass('cp-limit-usage-above'); }
            var $text = $('<span>', {'class': 'cp-limit-usage-text'});
            $text.text(usage + ' / ' + prettyLimit);
            $limit.append($usage).append($text);
        };

        var updateUsage = Util.notAgainForAnother(function () {
            common.getPinUsage(todo);
        }, LIMIT_REFRESH_RATE);

        setInterval(function () {
            updateUsage();
        }, LIMIT_REFRESH_RATE * 3);

        updateUsage();
        cb(null, $container);
    };

    // Create a button with a dropdown menu
    // input is a config object with parameters:
    //  - container (optional): the dropdown container (span)
    //  - text (optional): the button text value
    //  - options: array of {tag: "", attributes: {}, content: "string"}
    //
    // allowed options tags: ['a', 'hr', 'p']
    UIElements.createDropdown = function (config) {
        if (typeof config !== "object" || !Array.isArray(config.options)) { return; }
        if (config.feedback && !config.common) { return void console.error("feedback in a dropdown requires sframe-common"); }

        var isElement = function (o) {
            return /HTML/.test(Object.prototype.toString.call(o)) &&
                typeof(o.tagName) === 'string';
        };
        var allowedTags = ['a', 'p', 'hr'];
        var isValidOption = function (o) {
            if (typeof o !== "object") { return false; }
            if (isElement(o)) { return true; }
            if (!o.tag || allowedTags.indexOf(o.tag) === -1) { return false; }
            return true;
        };

        // Container
        var $container = $(config.container);
        var containerConfig = {
            'class': 'cp-dropdown-container'
        };
        if (config.buttonTitle) {
            containerConfig.title = config.buttonTitle;
        }

        if (!config.container) {
            $container = $('<span>', containerConfig);
        }

        // Button
        var $button = $('<button>', {
            'class': ''
        }).append($('<span>', {'class': 'cp-dropdown-button-title'}).html(config.text || ""));
        /*$('<span>', {
            'class': 'fa fa-caret-down',
        }).appendTo($button);*/

        // Menu
        var $innerblock = $('<div>', {'class': 'cp-dropdown-content'});
        if (config.left) { $innerblock.addClass('cp-dropdown-left'); }

        config.options.forEach(function (o) {
            if (!isValidOption(o)) { return; }
            if (isElement(o)) { return $innerblock.append($(o)); }
            $('<' + o.tag + '>', o.attributes || {}).html(o.content || '').appendTo($innerblock);
        });

        $container.append($button).append($innerblock);

        var value = config.initialValue || '';

        var setActive = function ($el) {
            if ($el.length !== 1) { return; }
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            $el.addClass('cp-dropdown-element-active');
            var scroll = $el.position().top + $innerblock.scrollTop();
            if (scroll < $innerblock.scrollTop()) {
                $innerblock.scrollTop(scroll);
            } else if (scroll > ($innerblock.scrollTop() + 280)) {
                $innerblock.scrollTop(scroll-270);
            }
        };

        var hide = function () {
            window.setTimeout(function () { $innerblock.hide(); }, 0);
        };

        var show = function () {
            $innerblock.show();
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            if (config.isSelect && value) {
                var $val = $innerblock.find('[data-value="'+value+'"]');
                setActive($val);
                $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
            }
            if (config.feedback) { Feedback.send(config.feedback); }
        };

        $container.click(function (e) {
            e.stopPropagation();
            var state = $innerblock.is(':visible');
            $('.cp-dropdown-content').hide();
            try {
                $('iframe').each(function (idx, ifrw) {
                    $(ifrw).contents().find('.cp-dropdown-content').hide();
                });
            } catch (er) {
                // empty try catch in case this iframe is problematic (cross-origin)
            }
            if (state) {
                hide();
                return;
            }
            show();
        });

        if (config.isSelect) {
            var pressed = '';
            var to;
            $container.keydown(function (e) {
                var $value = $innerblock.find('[data-value].cp-dropdown-element-active');
                if (e.which === 38) { // Up
                    if ($value.length) {
                        var $prev = $value.prev();
                        setActive($prev);
                    }
                }
                if (e.which === 40) { // Down
                    if ($value.length) {
                        var $next = $value.next();
                        setActive($next);
                    }
                }
                if (e.which === 13) { //Enter
                    if ($value.length) {
                        $value.click();
                        hide();
                    }
                }
                if (e.which === 27) { // Esc
                    hide();
                }
            });
            $container.keypress(function (e) {
                window.clearTimeout(to);
                var c = String.fromCharCode(e.which);
                pressed += c;
                var $value = $innerblock.find('[data-value^="'+pressed+'"]:first');
                if ($value.length) {
                    setActive($value);
                    $innerblock.scrollTop($value.position().top + $innerblock.scrollTop());
                }
                to = window.setTimeout(function () {
                    pressed = '';
                }, 1000);
            });

            $container.setValue = function (val, name) {
                value = val;
                var $val = $innerblock.find('[data-value="'+val+'"]');
                var textValue = name || $val.html() || val;
                $button.find('.cp-dropdown-button-title').html(textValue);
            };
            $container.getValue = function () {
                return value || '';
            };
        }

        return $container;
    };

    UIElements.createUserAdminMenu = function (Common, config) {
        var metadataMgr = Common.getMetadataMgr();

        var displayNameCls = config.displayNameCls || 'cp-toolbar-user-name';
        var $displayedName = $('<span>', {'class': displayNameCls});

        var accountName = metadataMgr.getPrivateData().accountName;
        var origin = metadataMgr.getPrivateData().origin;
        var padType = metadataMgr.getMetadata().type;

        var $userName = $('<span>');
        var options = [];
        if (config.displayNameCls) {
            var $userAdminContent = $('<p>');
            if (accountName) {
                var $userAccount = $('<span>').append(Messages.user_accountName + ': ');
                $userAdminContent.append($userAccount).append(Util.fixHTML(accountName));
                $userAdminContent.append($('<br>'));
            }
            if (config.displayName && !AppConfig.disableProfile) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ');
                $userName.append($displayedName);
            }
            $userAdminContent.append($userName);
            options.push({
                tag: 'p',
                attributes: {'class': 'cp-toolbar-account'},
                content: $userAdminContent.html()
            });
        }
        if (padType !== 'drive') {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/drive/',
                    'class': 'fa fa-hdd-o'
                },
                content: h('span', Messages.login_accessDrive)
            });
        }
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls + ' fa fa-user'},
                content: h('span', Messages.user_rename)
            });
        }
        if (accountName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-profile fa fa-user-circle'},
                content: h('span', Messages.profileButton)
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-settings fa fa-cog'},
                content: h('span', Messages.settingsButton)
            });
        }
        // Add login or logout button depending on the current status
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-logout fa fa-sign-out'},
                content: h('span', Messages.logoutButton)
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-login fa fa-sign-in'},
                content: h('span', Messages.login_login)
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-register fa fa-user-plus'},
                content: h('span', Messages.login_register)
            });
        }
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        //var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon);//.append($userbig);
        if (accountName) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            feedback: "USER_ADMIN",
            common: Common
        };
        var $userAdmin = UIElements.createDropdown(dropdownConfigUser);

        /*
        // Uncomment these lines to have a language selector in the admin menu
        // FIXME clicking on the inner menu hides the outer one
        var $lang = UIElements.createLanguageSelector(Common);
        $userAdmin.find('.cp-dropdown-content').append($lang);
        */

        var $displayName = $userAdmin.find('.'+displayNameCls);

        var $avatar = $userAdmin.find('> button .cp-dropdown-button-title');
        var loadingAvatar;
        var to;
        var oldUrl = '';
        var updateButton = function () {
            var myData = metadataMgr.getUserData();
            if (!myData) { return; }
            if (loadingAvatar) {
                // Try again in 200ms
                window.clearTimeout(to);
                to = window.setTimeout(updateButton, 200);
                return;
            }
            loadingAvatar = true;
            var newName = myData.name;
            var url = myData.avatar;
            $displayName.text(newName || Messages.anonymous);
            if (accountName && oldUrl !== url) {
                $avatar.html('');
                UIElements.displayAvatar(Common, $avatar, url,
                        newName || Messages.anonymous, function ($img) {
                    oldUrl = url;
                    $userAdmin.find('> button').removeClass('cp-avatar');
                    if ($img) { $userAdmin.find('> button').addClass('cp-avatar'); }
                    loadingAvatar = false;
                });
                return;
            }
            loadingAvatar = false;
        };
        metadataMgr.onChange(updateButton);
        updateButton();

        $userAdmin.find('a.cp-toolbar-menu-logout').click(function () {
            Common.logout(function () {
                window.parent.location = origin+'/';
            });
        });
        $userAdmin.find('a.cp-toolbar-menu-settings').click(function () {
            if (padType) {
                window.open(origin+'/settings/');
            } else {
                window.parent.location = origin+'/settings/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-profile').click(function () {
            if (padType) {
                window.open(origin+'/profile/');
            } else {
                window.parent.location = origin+'/profile/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-login').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/login/';
            });
        });
        $userAdmin.find('a.cp-toolbar-menu-register').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/register/';
            });
        });

        return $userAdmin;
    };

    // Provide $container if you want to put the generated block in another element
    // Provide $initBlock if you already have the menu block and you want the content inserted in it
    UIElements.createLanguageSelector = function (common, $container, $initBlock) {
        var options = [];
        var languages = Messages._languages;
        var keys = Object.keys(languages).sort();
        keys.forEach(function (l) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'cp-language-value',
                    'data-value': l,
                    'href': '#',
                },
                content: languages[l] // Pretty name of the language value
            });
        });
        var dropdownConfig = {
            text: Messages.language, // Button initial text
            options: options, // Entries displayed in the menu
            //left: true, // Open to the left of the button
            container: $initBlock, // optional
            isSelect: true,
            common: common
        };
        var $block = UIElements.createDropdown(dropdownConfig);
        $block.attr('id', 'cp-language-selector');

        if ($container) {
            $block.appendTo($container);
        }

        Language.initSelector($block, common);

        return $block;
    };

    UIElements.createModal = function (cfg) {
        var $body = cfg.$body || $('body');
        var $blockContainer = $body.find('#'+cfg.id);
        if (!$blockContainer.length) {
            $blockContainer = $('<div>', {
                'class': 'cp-modal-container',
                tabindex: 1,
                'id': cfg.id
            });
        }
        var hide = function () {
            if (cfg.onClose) { return void cfg.onClose(); }
            $blockContainer.hide();
        };
        $blockContainer.html('').appendTo($body);
        var $block = $('<div>', {'class': 'cp-modal'}).appendTo($blockContainer);
        $('<span>', {
            'class': 'cp-modal-close fa fa-times',
            'title': Messages.filePicker_close
        }).click(hide).appendTo($block);
        $body.click(hide);
        $block.click(function (e) {
            e.stopPropagation();
        });
        $body.keydown(function (e) {
            if (e.which === 27) {
                hide();
            }
        });
        return $blockContainer;
    };

    UIElements.createNewPadModal = function (common) {
        var $modal = UIElements.createModal({
            id: 'cp-app-toolbar-creation-dialog',
            $body: $('body')
        });
        var $title = $('<h3>').text(Messages.fm_newFile);
        var $description = $('<p>').html(Messages.creation_newPadModalDescription);
        $modal.find('.cp-modal').append($title);
        $modal.find('.cp-modal').append($description);

        var $advanced;

        var $advancedContainer = $('<div>');
        var priv = common.getMetadataMgr().getPrivateData();
        var c = (priv.settings.general && priv.settings.general.creation) || {};
        if (AppConfig.displayCreationScreen && common.isLoggedIn() && c.skip) {
            $advanced = $('<input>', {
                type: 'checkbox',
                checked: 'checked',
                id: 'cp-app-toolbar-creation-advanced'
            }).appendTo($advancedContainer);
            $('<label>', {
                for: 'cp-app-toolbar-creation-advanced'
            }).text(Messages.creation_newPadModalAdvanced).appendTo($advancedContainer);
            $description.append('<br>');
            $description.append(Messages.creation_newPadModalDescriptionAdvanced);
        }

        var $container = $('<div>');
        var i = 0;
        AppConfig.availablePadTypes.forEach(function (p) {
            if (p === 'drive') { return; }
            if (p === 'contacts') { return; }
            if (p === 'todo') { return; }
            if (p === 'file') { return; }
            if (!common.isLoggedIn() && AppConfig.registeredOnlyTypes &&
                AppConfig.registeredOnlyTypes.indexOf(p) !== -1) { return; }
            var $element = $('<li>', {
                'class': 'cp-icons-element',
                'id': 'cp-newpad-icons-'+ (i++)
            }).prepend(UI.getIcon(p)).appendTo($container);
            $element.append($('<span>', {'class': 'cp-icons-name'})
                .text(Messages.type[p]));
            $element.attr('data-type', p);
            $element.click(function () {
                $modal.hide();
                if ($advanced && Util.isChecked($advanced)) {
                    common.sessionStorage.put(Constants.displayPadCreationScreen, true, function (){
                        common.openURL('/' + p + '/');
                    });
                    return;
                }
                common.sessionStorage.put(Constants.displayPadCreationScreen, "", function () {
                    common.openURL('/' + p + '/');
                });
            });
        });

        var selected = -1;
        var next = function () {
            selected = ++selected % 5;
            $container.find('.cp-icons-element-selected').removeClass('cp-icons-element-selected');
            $container.find('#cp-newpad-icons-'+selected).addClass('cp-icons-element-selected');
        };

        $modal.off('keydown');
        $modal.keydown(function (e) {
            if (e.which === 9) {
                e.preventDefault();
                e.stopPropagation();
                next();
                return;
            }
            if (e.which === 13) {
                if ($container.find('.cp-icons-element-selected').length === 1) {
                    $container.find('.cp-icons-element-selected').click();
                }
                return;
            }
            if (e.which === 32 && $advanced) {
                $advanced.prop('checked', !$advanced.prop('checked'));
                $modal.focus();
                e.stopPropagation();
                e.preventDefault();
            }
        });


        $modal.find('.cp-modal').append($container).append($advancedContainer);
        window.setTimeout(function () {
            $modal.show();
            $modal.focus();
        });
    };

    UIElements.initFilePicker = function (common, cfg) {
        var onSelect = cfg.onSelect || $.noop;
        var sframeChan = common.getSframeChannel();
        sframeChan.on("EV_FILE_PICKED", function (data) {
            onSelect(data);
        });
    };
    UIElements.openFilePicker = function (common, types) {
        var sframeChan = common.getSframeChannel();
        sframeChan.event("EV_FILE_PICKER_OPEN", types);
    };

    UIElements.openTemplatePicker = function (common, force) {
        var metadataMgr = common.getMetadataMgr();
        var type = metadataMgr.getMetadataLazy().type;
        var sframeChan = common.getSframeChannel();
        var focus;

        var pickerCfgInit = {
            types: [type],
            where: ['template'],
            hidden: true
        };
        var pickerCfg = {
            types: [type],
            where: ['template'],
        };
        var onConfirm = function (yes) {
            if (!yes) {
                if (focus) { focus.focus(); }
                return;
            }
            delete pickerCfg.hidden;
            common.openFilePicker(pickerCfg);
            var first = true; // We can only pick a template once (for a new document)
            var fileDialogCfg = {
                onSelect: function (data) {
                    if (data.type === type && first) {
                        UI.addLoadingScreen({hideTips: true});
                        sframeChan.query('Q_TEMPLATE_USE', data.href, function () {
                            first = false;
                            UI.removeLoadingScreen();
                            Feedback.send('TEMPLATE_USED');
                        });
                        if (focus) { focus.focus(); }
                        return;
                    }
                }
            };
            common.initFilePicker(fileDialogCfg);
        };

        sframeChan.query("Q_TEMPLATE_EXIST", type, function (err, data) {
            if (data) {
                common.openFilePicker(pickerCfgInit);
                focus = document.activeElement;
                if (force) { return void onConfirm(true); }
                UI.confirm(Messages.useTemplate, onConfirm, {
                    ok: Messages.useTemplateOK,
                    cancel: Messages.useTemplateCancel,
                });
            } else if (force) {
                UI.alert(Messages.template_empty);
            }
        });
    };

    UIElements.setExpirationValue = function (val, $expire) {
        if (val && typeof (val) === "number") {
            $expire.find('#cp-creation-expire').attr('checked', true).trigger('change');
            $expire.find('#cp-creation-expire-true').attr('checked', true);
            if (val % (3600 * 24 * 30) === 0) {
                $expire.find('#cp-creation-expire-unit').val("month");
                $expire.find('#cp-creation-expire-val').val(val / (3600 * 24 * 30));
                return;
            }
            if (val % (3600 * 24) === 0) {
                $expire.find('#cp-creation-expire-unit').val("day");
                $expire.find('#cp-creation-expire-val').val(val / (3600 * 24));
                return;
            }
            if (val % 3600 === 0) {
                $expire.find('#cp-creation-expire-unit').val("hour");
                $expire.find('#cp-creation-expire-val').val(val / 3600);
                return;
            }
            // if we're here, it means we don't have a valid value so we should check unlimited
            $expire.find('#cp-creation-expire-false').attr('checked', true);
        }
    };
    UIElements.getPadCreationScreen = function (common, cfg, cb) {
        if (!common.isLoggedIn()) { return void cb(); }
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var type = metadataMgr.getMetadataLazy().type;

        var $body = $('body');
        var $creationContainer = $('<div>', { id: 'cp-creation-container' }).appendTo($body);
        var urlArgs = (Config.requireConf && Config.requireConf.urlArgs) || '';
        var l = h('div.cp-creation-logo', h('img', { src: '/customize/alt-favicon.png?' + urlArgs }));
        $(l).appendTo($creationContainer);
        var $creation = $('<div>', { id: 'cp-creation', tabindex: 1 }).appendTo($creationContainer);

        // Title
        var colorClass = 'cp-icon-color-'+type;
        //$creation.append(h('h2.cp-creation-title', Messages.newButtonTitle));
        $creation.append(h('h3.cp-creation-title', Messages['button_new'+type]));
        //$creation.append(h('h2.cp-creation-title.'+colorClass, Messages.newButtonTitle));

        // Deleted pad warning
        if (metadataMgr.getPrivateData().isDeleted) {
            $creation.append(h('div.cp-creation-deleted-container',
                h('div.cp-creation-deleted', Messages.creation_404)
            ));
        }

        var origin = common.getMetadataMgr().getPrivateData().origin;
        var createHelper = function (href, text) {
            var q = h('a.cp-creation-help.fa.fa-question-circle', {
                title: text,
                href: origin + href,
                target: "_blank",
                'data-tippy-placement': "right"
            });
            return q;
        };

        // Owned pads
        // Default is Owned pad
        var owned = h('div.cp-creation-owned', [
            h('label.cp-checkmark', [
                h('input', {
                    type: 'checkbox',
                    id: 'cp-creation-owned',
                    checked: 'checked'
                }),
                h('span.cp-checkmark-mark'),
                Messages.creation_owned
            ]),
            createHelper('/faq.html#keywords-owned', Messages.creation_owned1)
        ]);

        // Life time
        var expire = h('div.cp-creation-expire', [
            h('label.cp-checkmark', [
                h('input', {
                    type: 'checkbox',
                    id: 'cp-creation-expire'
                }),
                h('span.cp-checkmark-mark'),
                Messages.creation_expire
            ]),
            h('span.cp-creation-expire-picker.cp-creation-slider', [
                h('input#cp-creation-expire-val', {
                    type: "number",
                    min: 1,
                    max: 100,
                    value: 3
                }),
                h('select#cp-creation-expire-unit', [
                    h('option', { value: 'hour' }, Messages.creation_expireHours),
                    h('option', { value: 'day' }, Messages.creation_expireDays),
                    h('option', {
                        value: 'month',
                        selected: 'selected'
                    }, Messages.creation_expireMonths)
                ])
            ]),
            createHelper('/faq.html#keywords-expiring', Messages.creation_expire2),
        ]);

        var templates = h('div.cp-creation-template', [
            h('div.cp-creation-template-container', [
                h('span.fa.fa-circle-o-notch.fa-spin.fa-4x.fa-fw')
            ])
        ]);

        var settings = h('div.cp-creation-remember', [
            h('label.cp-checkmark', [
                h('input', {
                    type: 'checkbox',
                    id: 'cp-creation-remember'
                }),
                h('span.cp-checkmark-mark'),
                Messages.creation_saveSettings
            ]),
            createHelper('/settings/#creation', Messages.creation_settings),
            h('div.cp-creation-remember-help.cp-creation-slider', [
                h('span.fa.fa-exclamation-circle.cp-creation-warning'),
                Messages.creation_rememberHelp
            ])
        ]);

        var createDiv = h('div.cp-creation-create');
        var $create = $(createDiv);

        $(h('div#cp-creation-form', [
            owned,
            expire,
            settings,
            templates,
            createDiv
        ])).appendTo($creation);

        // Display templates
        var selected = 0;
        sframeChan.query("Q_CREATE_TEMPLATES", type, function (err, res) {
            if (!res.data || !Array.isArray(res.data)) {
                return void console.error("Error: get the templates list");
            }
            var data = res.data.slice().sort(function (a, b) {
                if (a.used === b.used) {
                    // Sort by name
                    if (a.name === b.name) { return 0; }
                    return a.name < b.name ? -1 : 1;
                }
                return b.used - a.used;
            }).slice(0, 2);
            data.unshift({
                name: Messages.creation_newTemplate,
                id: -1,
                icon: h('span.fa.fa-bookmark')
            });
            data.unshift({
                name: Messages.creation_noTemplate,
                id: 0,
                icon: h('span.fa.fa-file')
            });
            var $container = $(templates).find('.cp-creation-template-container').html('');
            data.forEach(function (obj, idx) {
                var name = obj.name;
                var $span = $('<span>', {
                    'class': 'cp-creation-template-element',
                    'title': name,
                }).appendTo($container);
                $span.data('id', obj.id);
                if (idx === 0) { $span.addClass('cp-creation-template-selected'); }
                $span.append(obj.icon || UI.getFileIcon({type: type}));
                $('<span>', {'class': 'cp-creation-template-element-name'}).text(name)
                    .appendTo($span);
                $span.click(function () {
                    $container.find('.cp-creation-template-selected')
                        .removeClass('cp-creation-template-selected');
                    $span.addClass('cp-creation-template-selected');
                    selected = idx;
                });

                // Add thumbnail if it exists
                if (obj.thumbnail) {
                    common.addThumbnail(obj.thumbnail, $span, function () {});
                }
            });
        });
        // Change template selection when Tab is pressed
        var next = function (revert) {
            var max = $creation.find('.cp-creation-template-element').length;
            selected = revert ?
                        (--selected < 0 ? max-1 : selected) :
                        ++selected % max;
            $creation.find('.cp-creation-template-element')
                .removeClass('cp-creation-template-selected');
            $($creation.find('.cp-creation-template-element').get(selected))
                .addClass('cp-creation-template-selected');
        };


        // Display expiration form when checkbox checked
        $creation.find('#cp-creation-expire').on('change', function () {
            if ($(this).is(':checked')) {
                $creation.find('.cp-creation-expire-picker:not(.active)').addClass('active');
                $creation.find('.cp-creation-expire:not(.active)').addClass('active');
                $creation.find('#cp-creation-expire-val').focus();
                return;
            }
            $creation.find('.cp-creation-expire-picker').removeClass('active');
            $creation.find('.cp-creation-expire').removeClass('active');
            $creation.focus();
        });

        // Display settings help when checkbox checked
        $creation.find('#cp-creation-remember').on('change', function () {
            if ($(this).is(':checked')) {
                $creation.find('.cp-creation-remember-help:not(.active)').addClass('active');
                return;
            }
            $creation.find('.cp-creation-remember-help').removeClass('active');
            $creation.focus();
        });

        // Keyboard shortcuts
        $creation.find('#cp-creation-expire-val').keydown(function (e) {
            if (e.which === 9) {
                e.stopPropagation();
            }
        });
        $creation.find('#cp-creation-expire-unit').keydown(function (e) {
            if (e.which === 9 && e.shiftKey) {
                e.stopPropagation();
            }
        });


        // Initial values
        if (!cfg.owned && typeof cfg.owned !== "undefined") {
            $creation.find('#cp-creation-owned').prop('checked', false);
        }
        if (cfg.skip) {
            $creation.find('#cp-creation-remember').prop('checked', true).trigger('change');
        }
        UIElements.setExpirationValue(cfg.expire, $creation);

        // Create the pad
        var getFormValues = function () {
            // Type of pad
            var ownedVal = $('#cp-creation-owned').is(':checked') ? 1 : 0;
            // Life time
            var expireVal = 0;
            if($('#cp-creation-expire').is(':checked')) {
                var unit = 0;
                switch ($('#cp-creation-expire-unit').val()) {
                    case "hour" : unit = 3600;           break;
                    case "day"  : unit = 3600 * 24;      break;
                    case "month": unit = 3600 * 24 * 30; break;
                    default: unit = 0;
                }
                expireVal = ($('#cp-creation-expire-val').val() || 0) * unit;
            }

            var $template = $creation.find('.cp-creation-template-selected');
            var templateId = $template.data('id') || undefined;

            return {
                owned: ownedVal,
                expire: expireVal,
                templateId: templateId
            };
        };
        var create = function () {
            var val = getFormValues();

            var skip = $('#cp-creation-remember').is(':checked');
            common.setAttribute(['general', 'creation', 'skip'], skip, function (e) {
                if (e) { return void console.error(e); }
            });
            common.setAttribute(['general', 'creation', 'noTemplate'], skip, function (e) {
                if (e) { return void console.error(e); }
            });

            common.setAttribute(['general', 'creation', 'owned'], val.owned, function (e) {
                if (e) { return void console.error(e); }
            });
            common.setAttribute(['general', 'creation', 'expire'], val.expire, function (e) {
                if (e) { return void console.error(e); }
            });

            $creationContainer.remove();
            common.createPad(val, function () {
                cb();
            });
        };


        var $button = $('<button>').text(Messages.creation_create).appendTo($create);
        $button.addClass('cp-creation-button-selected');
        $button.click(function () {
            create();
        });

        $creation.keydown(function (e) {
            if (e.which === 9) {
                e.preventDefault();
                e.stopPropagation();
                next(e.shiftKey);
                return;
            }
            if (e.which === 13) {
                $button.click();
                return;
            }
        });
        $creation.focus();
    };

    UIElements.onServerError = function (common, err, toolbar, cb) {
        if (["EDELETED", "EEXPIRED"].indexOf(err.type) === -1) { return; }
        var msg = err.type;
        if (err.type === 'EEXPIRED') {
            msg = Messages.expiredError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
        } else if (err.type === 'EDELETED') {
            msg = Messages.deletedError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
        }
        if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        UI.errorLoadingScreen(msg, true, true);
        (cb || function () {})();
    };

    return UIElements;
});
