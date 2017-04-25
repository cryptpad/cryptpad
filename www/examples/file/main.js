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
        var readOnly = secret.keys && !secret.keys.editKeyStr;
        if (!secret.keys) {
            secret.keys = secret.key;
        }

        var $mt = $iframe.find('#encryptedFile');
        $mt.attr('src', './assets/image.png-encrypted');
        $mt.attr('data-crypto-key', 'TBo77200c0e/FdldQFcnQx4Y');
        $mt.attr('data-type', 'image/png');
        require(['/common/media-tag.js'], function (MediaTag) {
            MediaTag($mt[0]);
            Cryptpad.removeLoadingScreen();
                var configTb = {
                    displayed: ['useradmin', 'newpad'],
                    ifrw: ifrw,
                    common: Cryptpad
                };
                toolbar = Toolbar.create($bar, null, null, null, null, configTb);

        });

    };

    Cryptpad.ready(function (err, anv) {
        andThen();
        Cryptpad.reportAppUsage();
    });

    });
});
