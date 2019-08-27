define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    'json.sortify',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/filepicker/app-filepicker.less',
], function (
    $,
    Crypto,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util,
    Hash,
    Sortify,
    Messages)
{
    var APP = window.APP = {};

    var andThen = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var $body = $('body');
        var sframeChan = common.getSframeChannel();
        var filters = metadataMgr.getPrivateData().types;

        var hideFileDialog = function () {
            sframeChan.event('EV_FILE_PICKER_CLOSE');
        };
        var onFilePicked = function (data) {
            var parsed = Hash.parsePadUrl(data.url);
            hideFileDialog();
            if (parsed.type === 'file') {
                var secret = Hash.getSecrets('file', parsed.hash, data.password);
                var fileHost = privateData.fileHost || privateData.origin;
                var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                var key = Hash.encodeBase64(secret.keys.cryptKey);
                sframeChan.event("EV_FILE_PICKED", {
                    type: parsed.type,
                    src: src,
                    name: data.name,
                    key: key
                });
                return;
            }
            sframeChan.event("EV_FILE_PICKED", {
                type: parsed.type,
                href: data.url,
                name: data.name
            });
        };

        // File uploader
        var fmConfig = {
            body: $('body'),
            noHandlers: true,
            onUploaded: function (ev, data) {
                onFilePicked(data);
            }
        };
        APP.FM = common.createFileManager(fmConfig);

        // Create file picker
        var onSelect = function (url, name, password) {
            onFilePicked({url: url, name: name, password: password});
        };
        var data = {
            FM: APP.FM
        };
        var updateContainer;
        var createFileDialog = function () {
            var types = filters.types || [];
            // Create modal
            var $blockContainer = UIElements.createModal({
                id: 'cp-filepicker-dialog',
                $body: $body,
                onClose: hideFileDialog
            }).show();
            // Set the fixed content
            var $block = $blockContainer.find('.cp-modal');

            // Description
            var text = Messages.filePicker_description;
            if (types && types.length === 1 && types[0] !== 'file') {
                // Should be Templates
                text = Messages.selectTemplate;
            }
            var $description = $('<p>').text(text);
            $block.append($description);

            var $filter = $('<p>', {'class': 'cp-modal-form'}).appendTo($block);
            var to;
            $('<input>', {
                type: 'text',
                'class': 'cp-filepicker-filter',
                'placeholder': Messages.filePicker_filter
            }).appendTo($filter).on('keypress', function () {
                if (to) { window.clearTimeout(to); }
                to = window.setTimeout(updateContainer, 300);
            });

            //If file, display the upload button
            if (types.indexOf('file') !== -1 && common.isLoggedIn()) {
                $filter.append(common.createButton('upload', false, data));
            }

            var $container = $('<span>', {'class': 'cp-filepicker-content'}).appendTo($block);

            // Update the files list when needed
            updateContainer = function () {
                $container.html('');
                var $input = $filter.find('.cp-filepicker-filter');
                var filter = $input.val().trim();
                var todo = function (err, list) {
                    if (err) { return void console.error(err); }
                    Object.keys(list).forEach(function (id) {
                        var data = list[id];
                        var name = data.filename || data.title || '?';
                        if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                            return;
                        }
                        var $span = $('<span>', {
                            'class': 'cp-filepicker-content-element',
                            'title': name,
                        }).appendTo($container);
                        $span.append(UI.getFileIcon(data));
                        $('<span>', {'class': 'cp-filepicker-content-element-name'}).text(name)
                            .appendTo($span);
                        $span.click(function () {
                            if (typeof onSelect === "function") {
                                onSelect(data.href, name, data.password);
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
        sframeChan.on('EV_FILE_PICKER_REFRESH', function (newFilters) {
            if (Sortify(filters) !== Sortify(newFilters)) {
                $body.html('');
                filters = newFilters;
                return void createFileDialog();
            }
            updateContainer();
        });
        createFileDialog();

        UI.removeLoadingScreen();
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen({hideTips: true, hideLogo: true});
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            var metadataMgr = common.getMetadataMgr();
            if (metadataMgr.getMetadataLazy() !== 'uninitialized') {
                andThen(common);
                return;
            }
            metadataMgr.onChange(function () {
                andThen(common);
            });
        });
    };
    main();
});
