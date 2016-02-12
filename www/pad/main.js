define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/pad/realtime-wysiwyg.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, RTWysiwyg, Messages, Crypto) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor = ifrw.CKEDITOR;

    var andThen = function () {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + Crypto.genKey();
            return;
        }
        var key = Crypto.parseKey(window.location.hash.substring(1));
        var editor = Ckeditor.replace('editor1', {
            removeButtons: 'Source,Maximize',
            // magicline plugin inserts html crap into the document which is not part of the
            // document itself and causes problems when it's sent across the wire and reflected back
            removePlugins: 'magicline,resize'
        });
        editor.on('instanceReady', function () {
            editor.execCommand('maximize');

            // (contenteditable) iframe in an iframe
            ifrw.$('iframe')[0].contentDocument.body.innerHTML = Messages.initialState;

            var rtw =
                RTWysiwyg.start(ifrw, // window
                                Config.websocketURL, // websocketUrl
                                Crypto.rand64(8), // userName
                                key.channel, // channel
                                key.cryptKey); // cryptKey
            editor.on('change', function () { rtw.onEvent(); });
        });
        window.editor = editor;
        window.RTWysiwyg = RTWysiwyg;
    };

    var interval = 100;
    var first = function () {
        // FIXME assignment in conditional
        if (Ckeditor = ifrw.CKEDITOR) {
            andThen();
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);
});
