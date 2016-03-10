define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config,
    RTText, // RTText
    Messages,
    Crypto) {

    var $ = window.jQuery;

    var $textarea = $('input');

    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    var initialState = Messages.initialState;

    $textarea.val(initialState);

    var key = Crypto.parseKey(window.location.hash.substring(1));

    var config = {
        textarea: $textarea[0],
        websocketURL: Config.websocketURL,
        userName: Crypto.rand64(8),
        channel: key.channel,
        cryptKey: key.cryptKey
    };

    var rttext = RTText.start(config);
});
