define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/convert.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/common/json-ot.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Crypto, realtimeInput, Convert, Toolbar, Cursor, JsonOT) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor; // to be initialized later...
    var DiffDom = window.diffDOM;
    var userName = Crypto.rand64(8),
        toolbar;

    var andThen = function (Ckeditor) {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + Crypto.genKey();
            return;
        }

        var fixThings = false;
        var key = Crypto.parseKey(window.location.hash.substring(1));
        var editor = window.editor = Ckeditor.replace('editor1', {
            // https://dev.ckeditor.com/ticket/10907
            needsBrFiller: fixThings,
            needsNbspFiller: fixThings,
            removeButtons: 'Source,Maximize',
            // magicline plugin inserts html crap into the document which is not part of the
            // document itself and causes problems when it's sent across the wire and reflected back
            removePlugins: 'magicline,resize'
        });

        editor.on('instanceReady', function (Ckeditor) {
            editor.execCommand('maximize');
            var documentBody = ifrw.$('iframe')[0].contentDocument.body;

            documentBody.innerHTML = Messages.initialState;

            var inner = documentBody;
            window.inner = inner;
            var cursor = window.cursor = Cursor(inner);

            var $textarea = $('#feedback');

            var applyHjson = function (shjson) {
                var userDocStateDom = Convert.hjson.to.dom(JSON.parse(shjson));
                userDocStateDom.setAttribute("contentEditable", "true"); // lol wtf
                var patch = (new DiffDom()).diff(inner, userDocStateDom);
                (new DiffDom()).apply(inner, patch);
            };

            var onRemote = function (shjson) {
                // remember where the cursor is
                cursor.update()

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);

                // 1 if start is lost, 2 if end is lost, 3 if both, else 0
                var cursorState = cursor.isLost();
                if (cursorState) {
                    console.log("cursor is lost!");
                    cursor.find();

                    // pass in the cursorState so we don't try to recover nodes
                    // which weren't lost to begin with
                    // TODO recover doesn't handle its arguments correctly
                    // so for now just pass in 3 :(
                    cursor.recover(3||cursorState);

                    cursorState = cursor.isLost();
                    if (cursorState) {
                        console.log("cursor is STILL lost after trying to recover");
                    } else {
                        console.log("recovered the cursor!");
                    }
                } else {
                    // cursor is not lost
                    console.log("cursor retained");
                }
            };

            var onInit = function (info) { /* TODO initialize the toolbar */ };

            var rti = realtimeInput.start($textarea[0], // synced element
                                    Config.websocketURL, // websocketURL, ofc
                                    userName, // userName
                                    key.channel, // channelName
                                    key.cryptKey, // key
                                    { // configuration :D
                                        doc: inner,
                                        // first thing called
                                        onInit: onInit,

                                        onReady: function (info) {
                                            applyHjson($textarea.val());
                                            $textarea.trigger('keyup');
                                        },
                                        // when remote changes occur
                                        onRemote: onRemote,
                                        // really basic operational transform
                                        transformFunction : JsonOT.validate
                                        // pass in websocket/netflux object TODO
                                    });

            $textarea.val(JSON.stringify(Convert.dom.to.hjson(inner)));

            editor.on('change', function () {
                var hjson = Convert.core.hyperjson.fromDOM(inner);

                $textarea.val(JSON.stringify(hjson));
                rti.bumpSharejs();
            });

            // a mouseup or keyup might change the cursor but not the contents
/*          ['mouseup', 'keyup'].forEach(function (type) {
                editor.document.on(type, function (e) {
                    // when this is the case, update the cursor
                    //cursor.update();
                });
            }); */
        });
    };

    var interval = 100;
    var first = function () {
        Ckeditor = ifrw.CKEDITOR;
        if (Ckeditor) {
            andThen(Ckeditor);
        } else {
            console.log("Ckeditor was not defined. Trying again in %sms",interval);
            setTimeout(first, interval);
        }
    };

    $(first);
});
