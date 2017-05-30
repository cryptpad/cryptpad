define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
    '/common/cryptpad-common.js',
    //'/common/visible.js',
    //'/common/notify.js',
    'pdfjs-dist/build/pdf',
    'pdfjs-dist/build/pdf.worker',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad /*, Visible, Notify*/) {
    //var Messages = Cryptpad.Messages;
    //var saveAs = window.saveAs;
    //window.Nacl = window.nacl;
    $(function () {

    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $iframe = $('#pad-iframe').contents();

    Cryptpad.addLoadingScreen();

    var andThen = function () {
        var $bar = $iframe.find('.toolbar-container');
        var secret = Cryptpad.getSecrets();

        if (!secret.keys) { throw new Error("You need a hash"); } // TODO

        var cryptKey = secret.keys && secret.keys.fileKeyStr;
        var fileId = secret.channel;
        var hexFileName = Cryptpad.base64ToHex(fileId);
        var type = "image/png";

        var parsed = Cryptpad.parsePadUrl(window.location.href);
        var defaultName = Cryptpad.getDefaultName(parsed);

        var getTitle = function () {
            var pad = Cryptpad.getRelativeHref(window.location.href);
            var fo = Cryptpad.getStore().getProxy().fo;
            var data = fo.getFileData(pad);
            return data ? data.title : undefined;
        };

        var updateTitle = function (newTitle) {
            var title = document.title = newTitle;
            $bar.find('.' + Toolbar.constants.title).find('span.title').text(title);
            $bar.find('.' + Toolbar.constants.title).find('input').val(title);
        };

        var suggestName = function () {
            return document.title || getTitle() || '';
        };

        var renameCb = function (err, title) {
            document.title = title;
        };

        var $mt = $iframe.find('#encryptedFile');
        $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
        $mt.attr('data-crypto-key', 'cryptpad:'+cryptKey);
        // $mt.attr('data-type', type);

        $(window.document).on('decryption', function (e) {
            var decrypted = e.originalEvent;
            var metadata = decrypted.metadata;

            if (decrypted.callback) { decrypted.callback(); }
            //console.log(metadata);
            //console.log(defaultName);
            if (!metadata || metadata.name !== defaultName) { return; }
            var title = document.title = metadata.name;
            updateTitle(title || defaultName);
        })
        .on('decryptionError', function (e) {
            var error = e.originalEvent;
            Cryptpad.alert(error.message);
        })
        .on('decryptionProgress', function (e) {
            var progress = e.originalEvent;
            console.log(progress.percent);
        });

        require(['/common/media-tag.js'], function (MediaTag) {
            var configTb = {
                displayed: ['useradmin', 'share', 'newpad'],
                ifrw: ifrw,
                common: Cryptpad,
                title: {
                    onRename: renameCb,
                    defaultName: defaultName,
                    suggestName: suggestName
                },
                share: {
                    secret: secret,
                    channel: hexFileName
                }
            };
            Toolbar.create($bar, null, null, null, null, configTb);

            updateTitle(Cryptpad.initialName || getTitle() || defaultName);

            /**
             * Allowed mime types that have to be set for a rendering after a decryption.
             *
             * @type       {Array}
             */
            const allowedMediaTypes = [
                'image/png',
                'image/jpeg',
                'image/jpg',
                'image/gif',
                'audio/mp3',
                'audio/ogg',
                'audio/wav',
                'audio/webm',
                'video/mp4',
                'video/ogg',
                'video/webm',
                'application/pdf',
                'application/dash+xml',
                'download'
            ];

            MediaTag.CryptoFilter.setAllowedMediaTypes(allowedMediaTypes);

            MediaTag($mt[0]);

            Cryptpad.removeLoadingScreen();
        });
    };

    Cryptpad.ready(function () {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
