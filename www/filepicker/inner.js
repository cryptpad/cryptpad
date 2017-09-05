define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    TextPatcher,
    JsonOT,
    Cryptpad,
    nThen,
    SFCommon)
{
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
    };

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (common) {
        //var metadataMgr = common.getMetadataMgr();
        var $body = $('body');
        var sframeChan = common.getSframeChannel();

        var onFilePicked = function (data) {
            var parsed = Cryptpad.parsePadUrl(data.url);
            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
            sframeChan.event("EV_FILE_PICKED", {
                src: src,
                key: parsed.hashData.key
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
        var createFileDialog = function (cfg) {
            var sframeChan = common.getSframeChannel();
            var updateContainer;
            var hideFileDialog = function () {
                sframeChan.event('EV_FILE_PICKER_CLOSE');
            };
            // Create modal
            var $blockContainer = Cryptpad.createModal({
                id: 'cp-filepicker-dialog',
                $body: $body,
                onClose: hideFileDialog
            }).show();
            // Set the fixed content
            var $block = $blockContainer.find('.cp-modal');
            var $description = $('<p>').text(Messages.filePicker_description);
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
            $filter.append(common.createButton('upload', false, data, function () {
                hideFileDialog();
            }));
            var $container = $('<span>', {'class': 'cp-filepicker-content'}).appendTo($block);
            // Update the files list when needed
            updateContainer = function () {
                $container.html('');
                var filter = $filter.find('.cp-filepicker-filter').val().trim();
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
                            hideFileDialog();
                        });
                    });
                };
                common.getFilesList(todo);
            };
            updateContainer();
            sframeChan.on('EV_FILE_PICKER_REFRESH', updateContainer);
        };
        createFileDialog();

        Cryptpad.removeLoadingScreen();
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(common);
        });
    };
    main();
});
