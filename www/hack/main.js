define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto) { 
    var $ = window.jQuery;
    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var key = Crypto.parseKey(window.location.hash.substring(1));

    var $textarea = $('textarea'),
        $run = $('#run');

    /*
        onRemote
        onInit
        onReady
        onAbort
        transformFunction
    */

    var config = {};
    var initializing = true;

    $textarea.attr('disabled', true);

    var onInit = config.onInit = function (info) { };

    var onRemote = config.onRemote = function (contents) {
        if (initializing) { return; }
        // TODO do something on external messages
        // http://webdesign.tutsplus.com/tutorials/how-to-display-update-notifications-in-the-browser-tab--cms-23458
    };

    var onReady = config.onReady = function (info) {
        initializing = false;
        $textarea.attr('disabled', false);
    };

    var onAbort = config.onAbort = function (info) {
        $textarea.attr('disabled', true);
        window.alert("Server Connection Lost");
    };

    var rt = Realtime.start($textarea[0], // window
        Config.websocketURL, // websocketUrl
        Crypto.rand64(8), // userName
        key.channel, // channel
        key.cryptKey,
        config); // cryptKey

    $run.click(function (e) {
        e.preventDefault();
        var content = $textarea.val();

        try {
            eval(content); // jshint ignore:line
        } catch (err) {
            // FIXME don't use alert, make an errorbox
            window.alert(err.message);
            console.error(err);
        }
    });
});
