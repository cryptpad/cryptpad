define([
    'realtime-wysiwyg',
    'messages',
    'bower/jquery/dist/jquery.min',
    'bower/ckeditor/ckeditor',
    'bower/tweetnacl/nacl-fast.min',
], function (RTWysiwyg, Messages) {
    var Ckeditor = window.CKEDITOR;
    var Nacl = window.nacl;
    var $ = jQuery;

    var module = {exports: {}};

    var parseParameters = function (str) {
        var result = {};
        var components = str.split('&');
        for (var i = 0; i < components.length; i++) {
            var kv = components[i].split('=');
            result[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }

        return result;
    }

    var parseKey = function (str) {
        var array = Nacl.util.decodeBase64(str);
        var hash = Nacl.hash(array);
        return {lookupKey: hash.subarray(32), cryptKey: hash.subarray(0, 32)};
    };

    var genKey = function () {
        return Nacl.util.encodeBase64(Nacl.randomBytes(18));
    };

    var userName = function () {
        return Nacl.util.encodeBase64(Nacl.randomBytes(8));
    };

    return function (url) {
        if (!url) {
            url = 'api/config?cb=' + Math.random().toString(16).substring(2)
        }

        require([url], function (Config) {
            $(function () {
                var params;

                if (window.location.href.indexOf('#') === -1) {
                    window.location.href = window.location.href + '#key=' + genKey();
                }
                else {
                    params = parseParameters(window.location.href.substring(window.location.href.indexOf('#') + 1));
                    if (!params.key) {
                        window.location.href = window.location.href + '&key=' + genKey();
                    }
                }
                $(window).on('hashchange', function () {
                    window.location.reload();
                });
                var key = parseKey(params.key);
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
                            Nacl.util.encodeBase64(key.lookupKey).substring(0, 10),
                            key.cryptKey);
                    editor.on('change', function () {
                        rtw.onEvent();
                    });
                });
            });
        });
    };
});
