// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/chainpad-crypto/crypto.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-icons.js',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'less!/secureiframe/app-secure.less',
], function (
    $,
    Crypto,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    h,
    Messages
)
{
    var APP = window.APP = {};

    var andThen = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();
        var $body = $('body');
        var displayed;

        var hideIframe = function () {
            if (!displayed) { return; }
            sframeChan.event('EV_SECURE_IFRAME_CLOSE');
        };

        var create = {};
        create['formGuestShare'] = function (data) {
            data = data || {};
            require(['/common/clipboard.js'], function (Clipboard) {
                var priv = metadataMgr.getPrivateData();
                var hashes = priv.hashes || {};
                var origin = priv.origin || '';
                var editUrl = hashes.editHash ?
                    (origin + Hash.hashToHref(hashes.editHash, 'form')) : '';
                var viewUrl = hashes.viewHash ?
                    (origin + Hash.hashToHref(hashes.viewHash, 'form')) : '';

                var showPublic = function () {
                    if (!viewUrl) { return void hideIframe(); }
                    var frame;
                    var modal = UI.dialog.customModal(h('div.cp-form-guest-share-modal', [
                        h('h4', Messages.form_guestPublicTitle),
                        h('p', Messages.form_guestPublicBody),
                        UI.dialog.selectableArea(viewUrl, {
                            id: 'cp-form-guest-public-link',
                            rows: 2
                        })
                    ]), {
                        onClose: function () {
                            if (displayed === frame) { hideIframe(); }
                        },
                        buttons: [{
                            className: 'cancel',
                            name: Messages.cancel,
                            onClick: function () {},
                            keys: [27]
                        }, {
                            className: 'primary',
                            name: Messages.form_geturl,
                            iconClass: 'copy',
                            onClick: function () {
                                Clipboard.copy(viewUrl, function (err) {
                                    if (err) { return void UI.warn(Messages.error); }
                                    UI.log(Messages.shareSuccess);
                                    hideIframe();
                                });
                                return true;
                            },
                            keys: [13]
                        }]
                    });
                    frame = UI.openCustomModal(modal);
                    displayed = frame;
                };

                var showAuthor = function () {
                    if (!editUrl) {
                        if (data.next === 'public') { return void showPublic(); }
                        if (data.next === 'preview') {
                            sframeChan.event('EV_OPEN_VIEW_URL');
                        }
                        return void hideIframe();
                    }
                    var frame;
                    var stay;
                    var modal = UI.dialog.customModal(h('div.cp-form-guest-share-modal', [
                        h('h4', Messages.form_guestAuthorTitle),
                        h('p', Messages.form_guestEditLinkDefinition),
                        h('p', data.stored ?
                            Messages.form_guestAuthorBodyStored : Messages.form_guestAuthorBody),
                        UI.dialog.selectableArea(editUrl, {
                            id: 'cp-form-guest-author-link',
                            rows: 2
                        })
                    ]), {
                        onClose: function () {
                            if (stay || displayed !== frame) { return; }
                            hideIframe();
                        },
                        buttons: [{
                            className: 'cancel',
                            name: Messages.cancel,
                            onClick: function () {},
                            keys: [27]
                        }, {
                            className: 'secondary',
                            name: Messages.form_guestAuthorCopy,
                            iconClass: 'copy',
                            onClick: function () {
                                Clipboard.copy(editUrl, function (err) {
                                    if (err) { return void UI.warn(Messages.error); }
                                    UI.log(Messages.form_guestAuthorCopied);
                                });
                                return true;
                            },
                            keys: []
                        }, {
                            className: 'primary',
                            name: data.next === 'public' ?
                                Messages.form_guestAuthorContinuePublic : Messages.continue,
                            onClick: function () {
                                if (data.next === 'public') {
                                    stay = true;
                                    if (frame && frame.closeModal) {
                                        frame.closeModal(showPublic);
                                    } else {
                                        showPublic();
                                    }
                                    return true;
                                }
                                if (data.next === 'preview') {
                                    sframeChan.event('EV_OPEN_VIEW_URL');
                                }
                            },
                            keys: [13]
                        }]
                    });
                    frame = UI.openCustomModal(modal);
                    displayed = frame;
                };
                showAuthor();
            });
        };

        // Share modal
        create['share'] = function (data) {
            var priv = metadataMgr.getPrivateData();
            var friends = common.getFriends();

            require(['/common/inner/share.js'], function (Share) {
                var f = (data && data.file) ? Share.getFileShareModal
                                              : Share.getShareModal;
                f(common, {
                    origin: priv.origin,
                    pathname: data.pathname || priv.pathname,
                    password: data.hashes ? '' : priv.password,
                    isTemplate: data.hashes ? false : priv.isTemplate,
                    hashes: data.hashes || priv.hashes,
                    common: common,
                    title: data.title,
                    auditorHash: data.auditorHash,
                    versionHash: data.versionHash,
                    friends: friends,
                    onClose: function () {
                        hideIframe();
                    },
                    fileData: {
                        hash: (data.hashes && data.hashes.fileHash) || priv.hashes.fileHash,
                        password: data.hashes ? '' :  priv.password
                    }
                }, function (e, modal) {
                    if (e) { console.error(e); }
                    displayed = modal;
                });
            });
        };

        // Properties modal
        create['properties'] = function () {
            require(['/common/inner/properties.js'], function (Properties) {
                Properties.getPropertiesModal(common, {
                    onClose: function () {
                        hideIframe();
                    }
                }, function (e, modal) {
                    if (e) { console.error(e); }
                    displayed = modal;
                });
            });
        };

        // Access modal
        create['access'] = function (data) {
            require(['/common/inner/access.js'], function (Access) {
                Access.getAccessModal(common, {
                    title: data.title,
                    onClose: function () {
                        hideIframe();
                    }
                }, function (e, modal) {
                    if (e) { console.error(e); }
                    displayed = modal;
                });
            });
        };

        // File uploader
        var onFilePicked = function (data) {
            var privateData = metadataMgr.getPrivateData();
            var parsed = Hash.parsePadUrl(data.url);
            if (displayed && displayed.hide) { displayed.hide(); }
            hideIframe();
            if (parsed.type === 'file') {
                var secret = Hash.getSecrets('file', parsed.hash, data.password);
                var fileHost = privateData.fileHost || privateData.origin;
                var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                var key = Hash.encodeBase64(secret.keys.cryptKey);
                sframeChan.event("EV_SECURE_ACTION", {
                    type: parsed.type,
                    fileType: data.fileType,
                    href: data.url,
                    src: src,
                    name: data.name,
                    key: key
                });
                return;
            }
            sframeChan.event("EV_SECURE_ACTION", {
                type: parsed.type,
                password: data.password,
                static: data.static,
                href: data.url,
                name: data.name
            });
        };
        var fmConfig = {
            body: $('body'),
            noHandlers: true,
            onUploaded: function (ev, data) {
                onFilePicked(data);
            }
        };
        APP.FM = common.createFileManager(fmConfig);
        create['filepicker'] = function (_filters) {
            var updateContainer = function () {};

            var filters = _filters;
            var types = filters.types || [];
            var data = {
                FM: APP.FM
            };

            // Create modal
            var modal = UI.createModal({
                $body: $body,
                onClose: function () {
                    hideIframe();
                }
            });
            displayed = modal;
            modal.show();

            // Set the fixed content
            modal.$modal.attr('id', 'cp-filepicker-dialog');
            var $block = modal.$modal.find('.cp-modal');

            // Description
            var text = Messages.filePicker_description;
            if (types && types.length === 1 && types[0] !== 'file') {
                text = Messages.selectTemplate;
            }
            $block.append(h('p', text));

            // Add filter input
            var $filter = $(h('p.cp-modal-form')).hide().appendTo($block);
            var to;
            var $input = $('<input>', {
                type: 'text',
                'class': 'cp-filepicker-filter',
                'placeholder': Messages.filePicker_filter
            }).appendTo($filter).on('keypress', function () {
                if (to) { window.clearTimeout(to); }
                to = window.setTimeout(updateContainer, 300);
            });

            // If file, display the upload button
            if (types.indexOf('file') !== -1) {
                var f = (filters && filters.filter) || {};
                delete data.accept;
                if (Array.isArray(f.fileType)) {
                    data.accept = f.fileType.map(function (val) {
                        if (/^[a-z]+\/$/.test(val)) {
                            val += '*';
                        }
                        return val;
                    });
                }
            }

            var $uploadButton = common.createButton('upload', false, data);
            $filter.append($uploadButton);
            if (!common.isLoggedIn()) {
                $uploadButton.prop('disabled', true)
                    .prop('title', Messages.upload_mustLogin);
            }

            var $container = $(h('span.cp-filepicker-content', [
                h('div.cp-loading-spinner-container', h('span.cp-spinner-main'))
            ])).appendTo($block);

            // Update the files list when needed
            updateContainer = function () {
                var filter = $input.val().trim();
                var todo = function (err, list) {
                    $filter.show();
                    if (err) { return void console.error(err); }
                    $container.html('');
                    Object.keys(list).forEach(function (id) {
                        var data = list[id];
                        var name = data.filename || data.title || data.name || '?';
                        if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                            return;
                        }
                        var $span = $('<span>', {
                            'class': 'cp-filepicker-content-element',
                            'title': Util.fixHTML(name),
                        }).appendTo($container);
                        $span.append(UI.getFileIcon(data));
                        $('<span>', {'class': 'cp-filepicker-content-element-name'}).text(name)
                            .appendTo($span);
                        if (data.static) { $span.attr('title', Util.fixHTML(data.href)); }
                        $span.click(function () {
                            if (typeof onFilePicked === "function") {
                                onFilePicked({url: data.href, name: name, static: data.static, password: data.password, fileType: data.fileType});
                            }
                        });

                        // Add thumbnail if it exists
                        common.displayThumbnail(data.href, data.channel, data.password, $span);
                    });
                    $input.focus();
                };
                common.getFilesList(filters, todo);
            };
            updateContainer();
        };

        sframeChan.on('EV_REFRESH', function (data) {
            if (!data) { return; }
            var type = data.modal;
            if (!create[type]) { return; }
            if (displayed && displayed.close) { displayed.close(); }
            else if (displayed && displayed.hide) { displayed.hide(); }
            $('button.cancel').click(); // Close any existing alertify
            displayed = undefined;
            create[type](data);
        });

        UI.removeLoadingScreen();
    };

    var main = function () {
        var common;
        var _andThen = Util.once(andThen);

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen({hideTips: true, hideLogo: true});
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            var metadataMgr = common.getMetadataMgr();
            if (metadataMgr.getMetadataLazy() !== 'uninitialized') {
                _andThen(common);
                return;
            }
            metadataMgr.onChange(function () {
                _andThen(common);
            });
        });
    };
    main();
});
