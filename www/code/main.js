define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
//    '/code/rt_codemirror.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/TextPatcher.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Config, /*RTCode,*/ Messages, Crypto, Realtime, TextPatcher) {
    var $ = window.jQuery;
    var module = window.APP = {};
    var ifrw = module.ifrw = $('#pad-iframe')[0].contentWindow;

    $(function () {
        var userName = Crypto.rand64(8);

        var key;
        var channel = '';
        var hash = false;
        if (!/#/.test(window.location.href)) {
            key = Crypto.genKey();
        } else {
            hash = window.location.hash.slice(1);
            channel = hash.slice(0, 32);
            key = hash.slice(32);
        }

        var config = {
            //initialState: Messages.codeInitialState,
            userName: userName,
            websocketURL: Config.websocketURL,
            channel: channel,
            cryptKey: key,
            crypto: Crypto,
        };

        var andThen = function (CMeditor) {
            var $pad = $('#pad-iframe');
            var $textarea = $pad.contents().find('#editor1');

            var editor = module.editor = CMeditor.fromTextArea($textarea[0], {
                lineNumbers: true,
                lineWrapping: true,
                autoCloseBrackets: true,
                matchBrackets : true,
                showTrailingSpace : true,
                styleActiveLine : true,
                search: true,
                highlightSelectionMatches: {showToken: /\w+/},
                extraKeys: {"Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); }},
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                mode: "javascript"
            });

            // TODO lock editor until chain is synced
            // then unlock
            var setEditable = function () { };
            var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

            var initializing = true;

            var onInit = config.onInit = function (info) {
                window.location.hash = info.channel + key;
                var realtime = module.realtime = info.realtime;
                module.patchText = TextPatcher.create({
                    realtime: realtime,
                    logging: true,
                    //initialState: Messages.codeInitialState
                });


                if (!hash) {
                    editor.setValue(Messages.codeInitialState);
                    module.patchText(Messages.codeInitialState);
                    module.patchText(Messages.codeInitialState);
                    editor.setValue(Messages.codeInitialState);
                }

                //$(window).on('hashchange', function() { window.location.reload(); });
            };

            var onReady = config.onReady = function (info) {
                console.log("READY!");

                var userDoc = module.realtime.getUserDoc();

                editor.setValue(userDoc);

                initializing = false;
            };

            var onRemote = config.onRemote = function (info) {
                if (initializing) { return; }
                console.log("REMOTE");

                var oldDoc = $textarea.val();
                var userDoc = module.realtime.getUserDoc();

                $textarea.val(userDoc);
                editor.setValue(userDoc);

                editor.save();

                // check cursor
                // apply changes to textarea
                // replace cursor
            };

            var onLocal = config.onLocal = function () {
                if (initializing) { return; }
                console.log("LOCAL");
                module.patchText(canonicalize($textarea.val()));
                editor.save();
            };

            var onAbort = config.onAbort = function (info) {
                // TODO  alert the user
                // inform of network disconnect
                window.alert("Network Connection Lost!");
            };

            var realtime = module.realtime = Realtime.start(config);

            editor.on('change', onLocal);

            ['keydown', /*'keyup',*/ 'select', 'mousedown', 'mouseup', 'click'].forEach(function (evt) {
                $textarea.on(evt, function () {
                    onRemote();
                    onLocal();
                });
                // onLocal?
            });

        };

        var interval = 100;

        var first = function () {
            if (ifrw.CodeMirror) {
                // it exists, call your continuation
                andThen(ifrw.CodeMirror);
            } else {
                console.log("CodeMirror was not defined. Trying again in %sms", interval);
                // try again in 'interval' ms
                setTimeout(first, interval);
            }
        };

        first();
    });
});
