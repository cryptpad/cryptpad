define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    'json.sortify',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    TextPatcher,
    JsonOT,
    Cryptpad,
    nThen,
    SFCommon,
    Sortify)
{
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var $body = $('body');
        var sframeChan = common.getSframeChannel();
        var filters = metadataMgr.getPrivateData().types;

        var hideFileDialog = function () {
            sframeChan.event('EV_FILE_PICKER_CLOSE');
        };
        var onFilePicked = function (data) {
            var parsed = Cryptpad.parsePadUrl(data.url);
            hideFileDialog();
            if (parsed.type === 'file') {
                var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
                var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
                sframeChan.event("EV_FILE_PICKED", {
                    type: parsed.type,
                    src: src,
                    key: parsed.hashData.key
                });
                return;
            }
            sframeChan.event("EV_FILE_PICKED", {
                type: parsed.type,
                href: data.url,
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
        var onSelect = function (url) {
            onFilePicked({url: url});
        };
        var data = {
            FM: APP.FM
        };
        var updateContainer;
        var createFileDialog = function () {
            var types = filters.types || [];
            // Create modal
            var $blockContainer = Cryptpad.createModal({
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
            if (types.indexOf('file') !== -1) {
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
                        var name = data.title || '?';
                        if (filter && name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                            return;
                        }
                        var $span = $('<span>', {
                            'class': 'cp-filepicker-content-element',
                            'title': name,
                        }).appendTo($container);
                        $span.append(Cryptpad.getFileIcon(data));
                        $span.append(name);
                        $span.click(function () {
                            if (typeof onSelect === "function") { onSelect(data.href); }
                        });
                    });
                    $input.focus();
                };
                common.getFilesList(filters, todo);
            };
            updateContainer();
        };
        sframeChan.on('EV_FILE_PICKER_REFRESH', function (newFilters) {
            console.log(Sortify(filters));
            console.log(Sortify(newFilters));
            if (Sortify(filters) !== Sortify(newFilters)) {
                $body.html('');
                filters = newFilters;
                return void createFileDialog();
            }
            updateContainer();
        });
        createFileDialog();

        Cryptpad.removeLoadingScreen();
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen({hideTips: true, hideLogo: true});
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            var metadataMgr = common.getMetadataMgr();
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
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
