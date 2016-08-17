define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js',
    '/slide/slide.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Crypto, TextPatcher, Cryptpad, Slide) {
    var $ = window.jQuery;

    /*
        TODO
        * patch in changes using DiffDOM
        * predraw some things in case they use external assets
        * strip out script tags?
        * better CSS
        * use codemirror instead of a text editor
        * add ability to link to a rendered slide
        * ui hint for escaping presentation mode
    */

    var secret = Cryptpad.getSecrets();

    var module = window.APP = {
        TextPatcher: TextPatcher,
        Slide: Slide,
    };

    var userName = module.userName = Crypto.rand64(8);

    var initializing = true;
    var $textarea = $('textarea');

    var $modal = $('#modal');
    var $content = $('#content');
    Slide.setModal($modal, $content);

    var $present = $('#present').click(function () {
        Slide.show(true, $textarea.val());
        Cryptpad.log("Hit ESC to exit presentation mode");
    });

    var config = module.config = {
        initialState: '',
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.key),
    };

    var setEditable = function (bool) { $textarea.attr('disabled', !bool); };
    var canonicalize = function (text) { return text.replace(/\r\n/g, '\n'); };

    setEditable(false);

    var onInit = config.onInit = function (info) {
        window.location.hash = info.channel + secret.key;
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        Cryptpad.getPadTitle(function (err, title) {
            if (err) {
                console.error(err);
                console.log("Couldn't get pad title");
                return;
            }
            document.title = title || window.location.hash.slice(1, 9);
            Cryptpad.rememberPad(title, function (err, data) {
                if (err) {
                    console.log("Couldn't remember pad");
                    console.error(err);
                }
            });
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

        Slide.update(content);
    };

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }
        var content = canonicalize($textarea.val());
        module.patchText(content);
        Slide.update(content);
    };

    var onReady = config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        var content = canonicalize(realtime.getUserDoc());
        $textarea.val(content);

        Slide.update(content);

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
