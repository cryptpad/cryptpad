define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/code/rt_codemirror.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/realtime-input.js',
    '/common/TextPatcher.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Config, RTCode, Messages, Crypto, Realtime, TextPatcher) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var module = {};

    $(function () {
        var userName = Crypto.rand64(8);

        var key;
        var channel = '';
        if (!/#/.test(window.location.href)) {
            key = Crypto.genKey();
        } else {
            var hash = window.location.hash.slice(1);
            channel = hash.slice(0, 32);
            key = hash.slice(32);
        }

        var config = {
            userName: userName,
            websocketURL: Config.websocketURL,
            channel: channel,
            cryptKey: key,
            crypto: Crypto,
        };

        var andThen = function (CMeditor) {
            var $pad = $('#pad-iframe');
            var $textarea = $pad.contents().find('#editor1');

            var editor = CMeditor.fromTextArea($textarea[0], {
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
            editor.setValue(Messages.codeInitialState);

            // TODO lock editor until chain is synced
            // then unlock
            var setEditable = function () { };

            var initializing = true;

            var onInit = config.onInit = function (info) {
                window.location.hash = info.channel + key;
                var realtime = info.realtime;
                module.patchText = TextPatcher.create({
                    realtime: realtime,
                    logging: true,
                });
                $(window).on('hashchange', function() {
                    window.location.reload();
                });
            };

            var onReady = config.onReady = function (info) {
                console.log("READY!");
                
                initializing = false;
            };

            var onRemote = config.onRemote = function (info) {
                if (initializing) { return; }
                // check cursor
                // apply changes to textarea
                // replace cursor
            };

            var onLocal = config.onLocal = function () {
                editor.save();
                //rtw.onEvent();
            };

            var onAbort = config.onAbort = function (info) {
                // TODO  alert the user
                // inform of network disconnect
            };

            var realtime = module.realtime = Realtime.start(config);

            editor.on('change', onLocal);
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
