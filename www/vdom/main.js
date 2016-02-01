define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/convert.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Crypto, realtimeInput, Convert) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor = ifrw.CKEDITOR;

    var Vdom = Convert.core.vdom,
        Hyperjson = Convert.core.hyperjson;

    window.Hyperjson = Hyperjson;

    var andThen = function () {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + Crypto.genKey();
            return;
        }

        var fixThings = false;
        var key = Crypto.parseKey(window.location.hash.substring(1));
        var editor = Ckeditor.replace('editor1', {
            // https://dev.ckeditor.com/ticket/10907
            needsBrFiller: fixThings,
            needsNbspFiller: fixThings,
            removeButtons: 'Source,Maximize',
            // magicline plugin inserts html crap into the document which is not part of the
            // document itself and causes problems when it's sent across the wire and reflected back
            removePlugins: 'magicline,resize'
        });

        window.editor = editor;
        editor.on('instanceReady', function () {
            editor.execCommand('maximize');
            ifrw.$('iframe')[0].contentDocument.body.innerHTML = Messages.initialState;

            var inner = ifrw.$('iframe')[0].contentDocument.body;
            window.inner = inner;

            var $textarea = $('#feedback');

            var vdom1 = Convert.dom.to.vdom(inner);

            var onChange = function (shjson) {
                var authDoc = JSON.parse(shjson);
                var vdom2 = Convert.hjson.to.vdom(authDoc);
                var patches = Vdom.diff(vdom1, vdom2);
                Vdom.patch(inner, patches);
                // try resyncing the dom?
                vdom1 = Convert.dom.to.vdom(inner);
                // vdom1 = vdom2;
            };

            window.rti = realtimeInput.start($textarea[0],
                                    Config.websocketURL,
                                    Crypto.rand64(8),
                                    key.channel,
                                    key.cryptKey,
                                    inner,
                                    onChange);

            $textarea.val(JSON.stringify(Convert.dom.to.hjson(inner)));

            editor.on('change', function () {
                var hjson = Hyperjson.fromDOM(inner);
                /*
                hjson = Hyperjson.callOn(hjson, function (a, b, c) {
                    Object.keys(b).forEach(function (k) {
                        if (a === "BR" && b[k] === '_moz') {
                            delete b[k];
                        }
                    });
                    return [a,b,c];
                });*/

                $textarea.val(JSON.stringify(hjson));
                rti.bumpSharejs();
            });
        });
    };

    var interval = 100;
    var first = function () {
        if (Ckeditor = ifrw.CKEDITOR) {
            andThen();
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);
});
