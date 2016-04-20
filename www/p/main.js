require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/messages.js',
    '/common/crypto.js',
    '/common/RealtimeTextSocket.js',
    '/common/hyperjson.js',
    '/common/hyperscript.js',
    '/p/toolbar.js',
    '/common/cursor.js',
    '/common/json-ot.js',
    '/common/TypingTests.js',
    'json.sortify',
    '/common/TextPatcher.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Crypto, realtimeInput, Hyperjson, Hyperscript, Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var Ckeditor; // to be initialized later...
    var DiffDom = window.diffDOM;

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    window.Hyperjson = Hyperjson;

    var hjsonToDom = function (H) {
        return Hyperjson.callOn(H, Hyperscript);
    };

    var userName = Crypto.rand64(8),
        toolbar;

    var module = window.REALTIME_MODULE = {
        Hyperjson: Hyperjson,
        Hyperscript: Hyperscript,
        logFights: true,
        fights: [],
    };

    var isNotMagicLine = function (el) {
        // factor as:
        // return !(el.tagName === 'SPAN' && el.contentEditable === 'false');
        var filter = (el.tagName === 'SPAN' &&
            el.getAttribute('contentEditable') === 'false');
        if (filter) {
            console.log("[hyperjson.serializer] prevented an element" +
                "from being serialized:", el);
            return false;
        }
        return true;
    };

    /* catch `type="_moz"` before it goes over the wire */
    var brFilter = function (hj) {
        if (hj[1].type === '_moz') { hj[1].type = undefined; }
        return hj;
    };

    var stringifyDOM = module.stringifyDOM = function (dom) {
        return stringify(Hyperjson.fromDOM(dom, isNotMagicLine, brFilter));
    };

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

            var setEditable = function (bool) {
                // careful about putting attributes onto the DOM
                // they get put into the chain, and you can have trouble
                // getting rid of them later

                //inner.style.backgroundColor = bool? 'white': 'grey';
                inner.setAttribute('contenteditable', bool);
            };

            // don't let the user edit until the pad is ready
            setEditable(false);

            var diffOptions = {
                preDiffApply: function (info) {
                    /* DiffDOM will filter out magicline plugin elements
                        in practice this will make it impossible to use it
                        while someone else is typing, which could be annoying.

                        we should check when such an element is going to be
                        removed, and prevent that from happening. */
                    if (info.node && info.node.tagName === 'SPAN' &&
                        info.node.getAttribute('contentEditable') === "false") {
                        // it seems to be a magicline plugin element...
                        if (info.diff.action === 'removeElement') {
                            // and you're about to remove it...
                            // this probably isn't what you want

                            /*
                                I have never seen this in the console, but the
                                magic line is still getting removed on remote
                                edits. This suggests that it's getting removed
                                by something other than diffDom.
                            */
                            console.log("preventing removal of the magic line!");

                            // return true to prevent diff application
                            return true;
                        }
                    }

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

            var now = function () { return new Date().getTime(); };

            var realtimeOptions = {
                // configuration :D
                doc: inner,

                // provide initialstate...
                initialState: stringifyDOM(inner) || '{}',

                // really basic operational transform
                // reject patch if it results in invalid JSON
                transformFunction : JsonOT.validate,

                websocketURL: Config.websocketURL+'_old',

                // username
                userName: userName,

                // communication channel name
                channel: key.channel,

                // encryption key
                cryptKey: key.cryptKey
            };

            var DD = new DiffDom(diffOptions);

            // apply patches, and try not to lose the cursor in the process!
            var applyHjson = function (shjson) {
                var userDocStateDom = hjsonToDom(JSON.parse(shjson));

                /*  in the DOM contentEditable is "false"
                    while "contenteditable" is undefined.

                    When it goes over the wire, it seems hyperjson transforms it.
                    of course, hyperjson simply gets attributes from the DOM.

                    el.attributes returns 'contenteditable', so we have to correct for that

                    There are quite possibly all sorts of other attributes which might lose
                    information, and we won't know what they are until after we've lost them.

                    this comes from hyperscript line 101. FIXME maybe
                */
                userDocStateDom.setAttribute("contenteditable", "true"); // lol wtf
                var patch = (DD).diff(inner, userDocStateDom);
                (DD).apply(inner, patch);
            };

            var initializing = true;

            var onRemote = realtimeOptions.onRemote = function (info) {
                if (initializing) { return; }

                var shjson = info.realtime.getUserDoc();

                // remember where the cursor is
                cursor.update();

                // build a dom from HJSON, diff, and patch the editor
                applyHjson(shjson);

                var shjson2 = stringifyDOM(inner);
                if (shjson2 !== shjson) {
                    /* the client's browser made changes when pushing content
                       into the dom */
                    console.error("shjson2 !== shjson");
                    // push those changes back over the wire
                    module.realtimeInput.patchText(shjson2);

                    /*  pushing back over the wire is necessary, but it can
                        result in a feedback loop, which we call a browser
                        fight */
                    if (module.logFights) {
                        // what changed?
                        var op = TextPatcher.diff(shjson, shjson2);
                        // log the changes
                        TextPatcher.log(shjson, op);

                        var sop = JSON.stringify(op);

                        if (module.fights.indexOf(sop) === -1) {
                            module.fights.push(sop);
                            console.log("Found a new type of browser disagreement");
                        }
                    }
                }
            };

            var onInit = realtimeOptions.onInit = function (info) {
                var $bar = $('#pad-iframe')[0].contentWindow.$('#cke_1_toolbox');
                toolbar = info.realtime.toolbar = Toolbar.create($bar, userName, info.realtime);

                /* TODO handle disconnects and such*/
            };

            var onReady = realtimeOptions.onReady = function (info) {
                console.log("Unlocking editor");
                initializing = false;
                setEditable(true);

                var shjson = info.realtime.getUserDoc();

                applyHjson(shjson);
            };

            var onAbort = realtimeOptions.onAbort = function (info) {
                console.log("Aborting the session!");
                // stop the user from continuing to edit
                // by setting the editable to false
                setEditable(false);
                toolbar.failed();
            };

            var onLocal = realtimeOptions.onLocal = function () {
                if (initializing) { return; }
                var shjson = stringifyDOM(inner);
                rti.patchText(shjson);
            };

            var rti = module.realtimeInput = realtimeInput.start(realtimeOptions);

            /* hitting enter makes a new line, but places the cursor inside
                of the <br> instead of the <p>. This makes it such that you
                cannot type until you click, which is rather unnacceptable.
                If the cursor is ever inside such a <br>, you probably want
                to push it out to the parent element, which ought to be a
                paragraph tag. This needs to be done on keydown, otherwise
                the first such keypress will not be inserted into the P. */
            inner.addEventListener('keydown', cursor.brFix);

            var easyTest = window.easyTest = function () {
                cursor.update();
                var start = cursor.Range.start;
                var test = TypingTest.testInput(inner, start.el, start.offset, onLocal);
                // why twice?
                onLocale();
                return test;
            };

            editor.on('change', onLocal);
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
