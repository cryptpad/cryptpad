define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js'
], function ($, Config, Realtime, Crypto, TextPatcher, Cryptpad) {

    var secret = Cryptpad.getSecrets();
    if (!secret.keys) {
        secret.keys = secret.key;
    }

    var module = window.APP = {
        TextPatcher: TextPatcher
    };

    var initializing = true;
    var $textarea = $('textarea');

    var config = module.config = {
        initialState: '',
        websocketURL: Config.websocketURL,
        validateKey: secret.keys.validateKey || undefined,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.keys),
    };

    var setEditable = function (bool) { $textarea.attr('disabled', !bool); };
    var canonicalize = function (text) { return text.replace(/\r\n/g, '\n'); };

    setEditable(false);

    config.onInit = function (info) {
        var editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
        Cryptpad.replaceHash(editHash);
        $(window).on('hashchange', function() {
            window.location.reload();
        });
    };

    config.onRemote = function () {
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

    config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        $textarea.val(realtime.getUserDoc());

        setEditable(true);
        initializing = false;
    };

    config.onAbort = function () {
        setEditable(false);
        window.alert("Server Connection Lost");
    };

    config.onConnectionChange = function (info) {
        if (info.state) {
            initializing = true;
        } else {
            setEditable(false);
            window.alert("Server Connection Lost. Trying to reconnect...");
        }
    };

    Realtime.start(config);

    ['cut', 'paste', 'change', 'keyup', 'keydown', 'select', 'textInput']
        .forEach(function (evt) {
            $textarea.on(evt, onLocal);
        });
});
