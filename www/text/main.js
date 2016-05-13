define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/realtime-input.js',
    '/common/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Crypto, TextPatcher) { 
    var $ = window.jQuery;

    var key;
    var channel = '';
    if (window.location.href.indexOf('#') === -1) {
        key = Crypto.genKey();
    } else {
        var hash = window.location.hash.substr(1);
        channel = hash.substr(0, 32);
        key = hash.substr(32);
    }

    var module = window.APP = {
        TextPatcher: TextPatcher
    };

    var userName = module.userName = Crypto.rand64(8);

    var initializing = true;
    var $textarea = $('textarea');

    var config = module.config = {
        initialState: '',
        textarea: $textarea[0],
        websocketURL: Config.websocketURL,
        userName: userName,
        channel: channel,
        cryptKey: key,
        crypto: Crypto,
    };

    var setEditable = function (bool) { $textarea.attr('disabled', !bool); };
    var canonicalize = function (text) { return text.replace(/\r\n/g, '\n'); };

    setEditable(false);

    var onInit = config.onInit = function (info) {
        window.location.hash = info.channel + key;
        $(window).on('hashchange', function() {
            window.location.reload();
        });
    };

    var onRemote = config.onRemote = function (info) {
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        var content = canonicalize($textarea.val());

        var op = TextPatcher.diff(content, userDoc);
        var elem = $textarea[0];

        var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
            return TextPatcher.transformCursor(elem[attr], op);
        });

        $textarea.val(userDoc);
        elem.selectionStart = selects[0];
        elem.selectionEnd = selects[1];
    };

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }
        module.patchText(canonicalize($textarea.val()));
    };

    var onReady = config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        $textarea.val(realtime.getUserDoc());

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {
        $textarea.attr('disabled', true);
        window.alert("Server Connection Lost");
    };

    var rt = Realtime.start(config);

    ['cut', 'paste', 'change', 'keyup', 'keydown', 'select', 'textInput']
        .forEach(function (evt) {
            $textarea.on(evt, onLocal);
        });
});
