define([
    'realtime-wysiwyg',
    'bower/jquery/dist/jquery.min',
    'bower/ckeditor/ckeditor',
    'bower/tweetnacl/nacl-fast.min'
], function (RTWysiwyg) {
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
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + genKey();
        }
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        var key = parseKey(window.location.hash.substring(1));
        var editor = Ckeditor.replace('editor1', {
            removeButtons: 'Source,Maximize',
        });
        editor.on('instanceReady', function () {
            //editor.execCommand('maximize');
            var ifr = window.ifr = $('iframe')[0];
            ifr.contentDocument.body.innerHTML = '<p>It works!</p>';

            var rtw =
                RTWysiwyg.start(window.location.href.replace(/#.*$/, '').replace(/^http/, 'ws'),
                                userName(),
                                {},
                                Nacl.util.encodeBase64(key.lookupKey).substring(0,10),
                                key.cryptKey);
            editor.on('change', function () { rtw.onEvent(); });
        });
    });
});
