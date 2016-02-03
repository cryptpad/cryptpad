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

            var $textarea = $('#feedback'),
                $problem = $('#problemo');

            var debug = function (info) {
                $problem.text(JSON.stringify(info,null,2));
            };

            var vdom1 = Convert.dom.to.vdom(inner);

            var cursor = {
                startEl: null,
                startOffset: 0,
                endEl: null,
                endOffset: 0
            };

            var getCursor = function () {
                // where is your cursor?
                // TODO optimize this if it works
                var sel = editor.getSelection(); // { rev, document, root, isLocked, _ }

                var element = sel.getStartElement();
                var ranges = sel.getRanges();

                if (!ranges.length) { return; }
                var range = ranges[0]; // {startContainer, startOffset, endContainer, endOffset, collapsed, document, root}

                cursor.startEl = range.startContainer;
                cursor.startOffset = range.startOffset;

                cursor.endEl = range.endContainer;
                cursor.endOffset = range.endOffset;

                debug(cursor);
            };

            window.rangeElements = {};

            var setCursor = function () {
                try {
                    var sel = editor.getSelection(); // { rev, document, root, isLocked, _ }

                    // correct the cursor after doing dom stuff
                //    sel.selectElement(element);
                    var ranges = sel.getRanges();
                    if (!ranges.length) { return; }
                    var range = ranges[0]; // {startContainer, startOffset, endContainer, endOffset, collapsed, document, root}

                    range.setStart(cursor.startEl, cursor.startOffset);
                    range.setEnd(cursor.endEl, cursor.endOffset);
                    sel.selectRanges([range]);
                    /* FIXME TODO
                        This fails because the element that we're operating on
                        can stop existing because vdom determines that we should
                        get rid of it. if it doesn't exist anymore, we should
                        walk up the tree or something. Or just not try to
                        relocate the cursor. Default behaviour might be ok.
                        DONT FIGHT THE DOM
                    */
                } catch (err) {
                    console.log("junk cursor:");
                    console.log(cursor);
                    debug(cursor);
                    console.error(err);
                    console.error(err.stack);
                }
            };

            var applyHjson = function (shjson) {
                // before integrating external changes, check in your own
                vdom1 = Convert.dom.to.vdom(inner);

                // remember where the cursor is
                getCursor()

                // the authoritative document is hyperjson, parse it
                var authDoc = JSON.parse(shjson);
                // use the authdoc to construct a second vdom
                var vdom2 = Convert.hjson.to.vdom(authDoc);
                // diff it against your version
                var patches = Vdom.diff(vdom1, vdom2);

                // apply the resulting patches               
                Vdom.patch(inner, patches);

                // put the cursor back where you left it
                setCursor();
            };

            window.rti = realtimeInput.start($textarea[0], // synced element
                                    Config.websocketURL, // websocketURL, ofc
                                    Crypto.rand64(8), // userName
                                    key.channel, // channelName
                                    key.cryptKey, // key
                                    { // configuration :D
                                        doc: inner,

                                        onReady: function (info) {
                                            applyHjson($textarea.val());
                                            $textarea.trigger('keyup');
                                        },

                                        onRemote: applyHjson,

                                        transformFunction : function (text, toTransform, transformBy) {
                                            /* FIXME 
                                                operational transform on json shouldn't be in all editors
                                                just those transmitting/expecting JSON
                                            */
                                            false && console.log({
                                                text: text,
                                                toTransform: toTransform,
                                                transformBy: transformBy
                                            });

                                            // returning **null** breaks out of the loop
                                            // which transforms conflicting operations
                                            // in theory this should prevent us from producing bad JSON
                                            return null;
                                        }
                                        /*
                                            FIXME NOT A REAL FUNCTION WONT WORK
                                            transformFunction: function (state0str, toTransform, transformBy) {
                                                var state1A = JSON.parse(Operation.apply(state0str, transformBy));
                                                var state1B = JSON.parse(Operation.apply(state0str, toTransform));
                                                var state0  = JSON.parse(state0str);
                                            }
                                        */
                                    });

            $(inner).on('keyup', function () {
                getCursor();
            });

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
                getCursor()
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
