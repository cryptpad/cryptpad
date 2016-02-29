define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/convert.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/common/json-ot.js',
    //'/bower_components/diff-dom/diffDOM.js',
    '/common/diffDOM.js',
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

            var inner = window.inner = documentBody;
            var cursor = window.cursor = Cursor(inner);

            var $textarea = $('#feedback');

            var diffOptions = {
                preDiffApply: function (info) {
                    var frame;

                    // no use trying to recover the cursor if it doesn't exist
                    if (!cursor.exists()) { return; }

                    info.frame = frame = cursor.inNode(info.node);

                    if (frame) {
                        var debug = info.debug = {
                            frame: frame,
                            action: info.diff.action,
                            cursorLength: cursor.getLength(),
                            node: info.node
                        };

                        if (info.diff.action === 'removeTextElement') {
                            // crap. there will be a text element removal.
                            // that's bad news.

                            if (frame === 1) {
                                // it's the starting element.


                            } else if (frame === 2) {
                                // it's the ending element.

                            } else {
                                // both were removed.
                                // there might not be much we can do

                                // the diff is going to run the following:
                                // info.node.parentNode.removeChild(node);
                            }

                            // avoid doing anything more?
                            // let the diff do its business.
                            return;
                        }

                        if (info.diff.oldValue) { debug.oldValue = info.diff.oldValue; }
                        if (info.diff.newValue) { debug.newValue = info.diff.newValue; }
                        if (typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                            var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);
                            debug.commonStart = pushes.commonStart;
                            debug.commonEnd = pushes.commonEnd;
                            debug.insert = pushes.insert;
                            debug.remove = pushes.remove;

                            if (frame & 1) {
                                // push cursor start if necessary
                                if (pushes.commonStart < cursor.Range.start.offset) {
                                    cursor.Range.start.offset += pushes.delta;
                                }
                            }
                            if (frame & 2) {
                                // push cursor end if necessary
                                if (pushes.commonStart < cursor.Range.end.offset) {
                                    cursor.Range.end.offset += pushes.delta;
                                }
                            }
                        }
                        console.log("###################################");
                        console.log(debug);

                        return;
                    } else {
                        console.log("###################################");
                        console.log(info.diff.action);
                        return;
                    }
                },
                postDiffApply: function (info) {
                    if (info.frame) {
                        if (info.node) {
                            if (info.frame & 1) { cursor.fixStart(info.node); }
                            if (info.frame & 2) { cursor.fixEnd(info.node); }
                        } else { console.error("info.node did not exist"); }

                        var sel = cursor.makeSelection();
                        var range = cursor.makeRange();

                        cursor.fixSelection(sel, range);
                    }
                }
            };

            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                var userDocStateDom = Convert.hjson.to.dom(JSON.parse(shjson));
                userDocStateDom.setAttribute("contentEditable", "true"); // lol wtf
                var DD = new DiffDom(diffOptions);
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
            };

            var onRemote = function (shjson) {
                // remember where the cursor is
                cursor.update();

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);
            };

            var onInit = function (info) { /* TODO initialize the toolbar */ };

            var realtimeOptions = {
                // configuration :D
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
            };

            var rti = window.rti = realtimeInput.start($textarea[0], // synced element
                                    Config.websocketURL, // websocketURL, ofc
                                    userName, // userName
                                    key.channel, // channelName
                                    key.cryptKey, // key
                                    realtimeOptions);

            $textarea.val(JSON.stringify(Convert.dom.to.hjson(inner)));

            editor.on('change', function () {
                var hjson = Convert.core.hyperjson.fromDOM(inner);

                $textarea.val(JSON.stringify(hjson));
                rti.bumpSharejs();
            });
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
