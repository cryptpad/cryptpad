define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/_socket/realtime-input.js',
    '/common/convert.js',
    '/_socket/toolbar.js',
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

    window.Convert = Convert;

    window.Toolbar = Toolbar;

    var userName = Crypto.rand64(8),
        toolbar;

    var module = {};

    var isNotMagicLine = function (el) {
        // factor as:
        // return !(el.tagName === 'SPAN' && el.contentEditable === 'false');
        var filter = (el.tagName === 'SPAN' && el.contentEditable === 'false');
        if (filter) {
            console.log("[hyperjson.serializer] prevented an element" +
                "from being serialized:", el);
            return false;
        }
        return true;
    };

    var setRandomizedInterval = function (func, target, range) {
        var timeout;
        var again = function () {
            setTimeout(function () {
                again();
                func();
            }, target - (range / 2) + Math.random() * range);
        };
        again();
        return {
            cancel: function () {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
            }
        };
    }

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
            // but we filter it now, so that's ok.
            removePlugins: 'resize'
        });

        editor.on('instanceReady', function (Ckeditor) {
            editor.execCommand('maximize');
            var documentBody = ifrw.$('iframe')[0].contentDocument.body;

            documentBody.innerHTML = Messages.initialState;

            var inner = window.inner = documentBody;
            var cursor = window.cursor = Cursor(inner);

            var $textarea = $('#feedback');

            var setEditable = function (bool) {
                // inner.style.backgroundColor = bool? 'unset': 'grey';
                inner.setAttribute('contenteditable', bool);
            };

            // don't let the user edit until the pad is ready
            setEditable(false);

            var diffOptions = {
                preDiffApply: function (info) {
                    /* TODO DiffDOM will filter out magicline plugin elements
                        in practice this will make it impossible to use it
                        while someone else is typing, which could be annoying

                        we should check when such an element is going to be
                        removed, and prevent that from happening. */

                    // no use trying to recover the cursor if it doesn't exist
                    if (!cursor.exists()) { return; }

                    /*  frame is either 0, 1, 2, or 3, depending on which
                        cursor frames were affected: none, first, last, or both
                    */
                    var frame = info.frame = cursor.inNode(info.node);

                    if (!frame) { return; }

                    if (typeof info.diff.oldValue === 'string' && typeof info.diff.newValue === 'string') {
                        var pushes = cursor.pushDelta(info.diff.oldValue, info.diff.newValue);

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

            var initializing = true;

            var assertStateMatches = function () {
                var userDocState = module.realtimeInput.realtime.getUserDoc();
                var currentState = $textarea.val();
                if (currentState !== userDocState) {
                    console.log({
                        userDocState: userDocState,
                        currentState: currentState
                    });
                    throw new Error("currentState !== userDocState");
                }
            };

            var updateDebugTextarea = function (shjson) {
                window.setTimeout(function () {
                    $textarea.val(shjson);
                }, 0);
            };

            var now = function () { return new Date().getTime() };

            var DD = new DiffDom(diffOptions);
            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                //setEditable(false);
                console.log(now());
                var userDocStateDom = Convert.hjson.to.dom(JSON.parse(shjson));
                userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
                console.log(now());
                //assertStateMatches();
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
                console.log(now());
                // push back to the textarea so we get a userDocState
                //setEditable(true);
            };

            var onRemote = function (info) {
                if (initializing) { return; }

                var shjson = info.realtime.getUserDoc();

                // remember where the cursor is
                cursor.update();

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);
                //updateDebugTextarea(shjson);
            };

            var onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox');
                toolbar = info.realtime.toolbar = Toolbar.create($bar, userName, info.realtime);
                /* TODO handle disconnects and such*/
            };

            var onReady = function (info) {
                console.log("Unlocking editor");
                initializing = false;
                setEditable(true);

                var shjson = info.realtime.getUserDoc();

                applyHjson(shjson);
            };

            var onAbort = function (info) {
                console.log("Aborting the session!");
                // stop the user from continuing to edit
                setEditable(false);
                // TODO inform them that the session was torn down
                toolbar.failed();
            };

            var realtimeOptions = {
                // configuration :D
                doc: inner,
                // first thing called
                onInit: onInit,

                onReady: onReady,

                // when remote changes occur
                onRemote: onRemote,

                // handle aborts
                onAbort: onAbort,

                // provide initialstate...
                initialState: JSON.stringify(Convert.core.hyperjson.fromDOM(inner, isNotMagicLine)),

                // really basic operational transform
                // reject patch if it results in invalid JSON
                transformFunction : JsonOT.validate,

                // websocketURL, ofc
                websocketURL: Config.websocketURL,

                // username
                userName: userName,

                // communication channel name
                channel: key.channel,

                // encryption key
                cryptKey: key.cryptKey
            };

            var rti = module.realtimeInput = window.rti = realtimeInput.start(realtimeOptions);

            var propogate = window.cryptpad_propogate = function () {
                var hjson = Convert.core.hyperjson.fromDOM(inner, isNotMagicLine);
                var shjson = JSON.stringify(hjson);

                if (!rti.propogate(shjson)) { return; }
                rti.onEvent(shjson);
            };

            var testInput = window.testInput = function (el, offset) {
                var i = 0,
                    j = offset,
                    input = "The quick red fox jumped over the lazy brown dog. ",
                    l = input.length,
                    errors = 0,
                    max_errors = 15,
                    interval;
                var cancel = function () {
                    //if (interval) { interval.cancel(); }
                };

                interval = setRandomizedInterval(function () {
                    propogate();
                    try {
                        el.replaceData(j, 0, input.charAt(i));
                    } catch (err) {
                        errors++;
                        if (errors >= max_errors) {
                            console.log("Max error number exceeded");
                            cancel();
                        }

                        console.error(err);
                        var next = document.createTextNode("-");
                        window.inner.appendChild(next);
                        el = next;
                        j = -1;
                    }
                    i = (i + 1) % l;
                    j++;
                }, 200, 50);

                return {
                    cancel: cancel
                };
            };

            var easyTest = window.easyTest = function () {
                cursor.update();
                var start = cursor.Range.start;
                var test = testInput(start.el, start.offset);
                propogate();
                return test;
            };

            editor.on('change', propogate);
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
