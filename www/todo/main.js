define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/toolbar2.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',

    //'/common/media-tag.js',
    //'/bower_components/file-saver/FileSaver.min.js',

    //'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less/cryptpad.less',
], function ($, Crypto, realtimeInput, Toolbar, Cryptpad /*, Visible, Notify*/) {
    var Messages = Cryptpad.Messages;
    //var saveAs = window.saveAs;
    //var Nacl = window.nacl;

    var APP = window.APP = {};

    $(function () {

    var andThen = function () {
        var ifrw = $('#pad-iframe')[0].contentWindow;
        var $iframe = $('#pad-iframe').contents();
        var $body = $iframe.find('body');

        $body.on('dragover', function (e) { e.preventDefault(); });
        $body.on('drop', function (e) { e.preventDefault(); });

        Cryptpad.addLoadingScreen();

        var Title;

        var uploadMode = false;

        var $bar = $iframe.find('.toolbar-container');

        var secret;
        var hexFileName;
        if (window.location.hash) {
            secret = Cryptpad.getSecrets();
            if (!secret.keys) { throw new Error("You need a hash"); } // TODO
            hexFileName = Cryptpad.base64ToHex(secret.channel);
        } else {
            uploadMode = true;
        }

        Title = Cryptpad.createTitle({}, function(){}, Cryptpad);

        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade'];
        if (secret && hexFileName) {
            displayed.push('fileshare');
        }

        var configTb = {
            displayed: displayed,
            ifrw: ifrw,
            common: Cryptpad,
            //hideDisplayName: true,
            $container: $bar,
        };

        if (uploadMode) {
            displayed.push('pageTitle');
            configTb.pageTitle = Messages.upload_title;
        }

        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar

        // we're in upload mode
        Cryptpad.removeLoadingScreen();
    };

    Cryptpad.ready(function () {
        andThen();
        //Cryptpad.reportAppUsage();
    });

    });
});
