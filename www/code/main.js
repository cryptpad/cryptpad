define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/code/rt_codemirror.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Config, RTCode, Messages, Crypto) {
    var $ = window.jQuery;
    var ifrw = $('#pad-iframe')[0].contentWindow;

    $(function () {
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        if (window.location.href.indexOf('#') === -1) {
            window.location.href = window.location.href + '#' + Crypto.genKey();
            return;
        }

        var andThen = function (CMeditor) {
            var key = Crypto.parseKey(window.location.hash.substring(1));
            var editor = CMeditor.fromTextArea($('#pad-iframe').contents().find('#editor1')[0], {
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

            var rtw =
                RTCode.start(ifrw,
                                Config.websocketURL,
                                Crypto.rand64(8),
                                key.channel,
                                key.cryptKey);
            editor.on('change', function() {
                editor.save();
                rtw.onEvent();
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
