define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad, Visible, Notify) {
    var Messages = Cryptpad.Messages;
    window.Nacl = window.nacl;
    $(function () {

    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $iframe = $('#pad-iframe').contents();

    Cryptpad.addLoadingScreen();

    var andThen = function () {
        var $bar = $iframe.find('.toolbar-container');
        var secret = Cryptpad.getSecrets();

        if (secret.keys) { throw new Error("You need a hash"); } // TODO

        var cryptKey = secret.key;
        var fileId = secret.file;
        var hexFileName = Cryptpad.base64ToHex(fileId);
        var type = secret.type;

// Test hash:
// #/2/K6xWU-LT9BJHCQcDCT-DcQ/TBo77200c0e-FdldQFcnQx4Y/image-png

        var $mt = $iframe.find('#encryptedFile');
        $mt.attr('src', '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName);
        $mt.attr('data-crypto-key', cryptKey);
        $mt.attr('data-type', type);
        require(['/common/media-tag.js'], function (MediaTag) {
            MediaTag($mt[0]);
            Cryptpad.removeLoadingScreen();
            var configTb = {
                displayed: ['useradmin', 'newpad'],
                ifrw: ifrw,
                common: Cryptpad
            };
            Toolbar.create($bar, null, null, null, null, configTb);
        });
    };

    Cryptpad.ready(function (err, anv) {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
