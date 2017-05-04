define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify) {
    var Messages = Cryptpad.Messages;
    var saveAs = window.saveAs;
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
// Test hash:
// #/2/K6xWU-LT9BJHCQcDCT-DcQ/TBo77200c0e-FdldQFcnQx4Y/

        var parsed = Cryptpad.parsePadUrl(window.location.href);
        var defaultName = Cryptpad.getDefaultName(parsed);

        var getTitle = function () {
            var pad = Cryptpad.getRelativeHref(window.location.href);
            var fo = Cryptpad.getStore().getProxy().fo;
            var data = fo.getFileData(pad);
            return data ? data.title : undefined;
        };

        var updateTitle = function (newTitle) {
            Cryptpad.renamePad(newTitle, function (err, data) {
                if (err) {
                    console.log("Couldn't set pad title");
                    console.error(err);
                    return;
                }
                document.title = newTitle;
                $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);
                $bar.find('.' + Toolbar.constants.title).find('input').val(data);
            });
        };

        var suggestName = function () {
            return document.title || getTitle() || '';
        };

        var renameCb = function (err, title) {
            document.title = title;
        };

        var $mt = $iframe.find('#encryptedFile');
        $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
        $mt.attr('data-crypto-key', 'salsa20poly1305:'+cryptKey);
        $mt.attr('data-type', type);

        require(['/common/media-tag.js'], function (MediaTag) {
            console.log(MediaTag);
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
            var $rightside = $bar.find('.' + Toolbar.constants.rightside);

            updateTitle(Cryptpad.initialName || getTitle() || defaultName);

            var mt = MediaTag($mt[0]);

            Cryptpad.removeLoadingScreen();
        });
    };

    Cryptpad.ready(function (err, anv) {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
