define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/pad/realtime-wysiwyg.js',
    '/common/messages.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/ckeditor/ckeditor.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function (Config, RTWysiwyg, Messages) {
    var Ckeditor = window.CKEDITOR;
    var Nacl = window.nacl;
    var $ = jQuery;

    var module = { exports: {} };

    var parseKey = function (str) {
        var array = Nacl.util.decodeBase64(str);
        var hash = Nacl.hash(array);
        return { lookupKey: hash.subarray(32), cryptKey: hash.subarray(0,32) };
    };

    var genKey = function () {
        return Nacl.util.encodeBase64(Nacl.randomBytes(18));
    };

    var userName = function () {
        return Nacl.util.encodeBase64(Nacl.randomBytes(8));
    };

    $(function () {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + genKey();
            return;
        }
        var key = parseKey(window.location.hash.substring(1));
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
                                userName(),
                                Nacl.util.encodeBase64(key.lookupKey).substring(0,10),
                                key.cryptKey);
            editor.on('change', function () { rtw.onEvent(); });
        });
    });
});
