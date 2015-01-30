define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/pad/realtime-wysiwyg.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/ckeditor/ckeditor.js',
], function (Config, RTWysiwyg, Messages, Crypto) {
    var Ckeditor = window.CKEDITOR;
    var $ = window.jQuery;

    $(function () {
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
            // This plugin inserts html crap into the document which is not part of the document
            // itself and causes problems when it's sent across the wire and reflected back.
            removePlugins: 'magicline'
        });
        editor.on('instanceReady', function () {
            editor.execCommand('maximize');
            var ifr = window.ifr = $('iframe')[0];
            ifr.contentDocument.body.innerHTML = Messages.initialState;

            var rtw =
                RTWysiwyg.start(Config.websocketURL,
                                Crypto.rand64(8),
                                key.channel,
                                key.cryptKey);
            editor.on('change', function () { rtw.onEvent(); });
        });
    });
});
