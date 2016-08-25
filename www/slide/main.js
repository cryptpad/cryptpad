define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/customize/messages.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js',
    '/slide/slide.js',
    '/common/notify.js',
    '/common/visible.js',
    '/common/clipboard.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Realtime, Crypto, TextPatcher, Cryptpad, Slide, Notify, Visible, Clipboard) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;

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

    Cryptpad.styleAlerts();

    var secret = Cryptpad.getSecrets();

    var module = window.APP = {
        TextPatcher: TextPatcher,
        Slide: Slide,
    };

    var initializing = true;
    var $textarea = $('textarea');

    var suggestName = function () {
        var title = '';
        var patt = /^#\s+(.*)\s*$/;
        $textarea.val().split("\n").some(function (line) {
            if (!patt.test(line)) { return; }
            line.replace(patt, function (a, b) {
                title = b;
            });
            return true;
        });
        return title;
    };

    var unnotify = function () {
        if (!(module.tabNofification &&
            typeof(module.tabNofification.cancel) === 'function')) { return; }
        module.tabNofification.cancel();
    };

    var notify = function () {
        if (!(Visible.isSupported() && !Visible.currently())) { return; }
        unnotify();
        module.tabNofification = Notify.tab(document.title, 1000, 10);
    };

    var $modal = $('#modal');
    var $content = $('#content');
    Slide.setModal($modal, $content);

    var config = module.config = {
        initialState: '',
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.key),
    };

    var setEditable = function (bool) { $textarea.attr('disabled', !bool); };
    var canonicalize = function (text) { return text.replace(/\r\n/g, '\n'); };

    setEditable(false);

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }
        var content = canonicalize($textarea.val());
        module.patchText(content);
        Slide.update(content);
    };

    var Button = function (opt) {
        return $('<button>', opt);
    };

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

        var $bar = $('#bar');

        var $present = Button({
            id: 'present',
            'class': 'present button action',
            title: 'enter presentation mode',
        })
        .text("PRESENT")
        .click(function () {
            Slide.show(true, $textarea.val());
            Cryptpad.log("Hit ESC to exit presentation mode");
        });

        var $forget = Button({
            id: 'forget',
            'class': 'forget button action',
            title: Messages.forgetButtonTitle,
        })
        .text(Messages.forgetButton)
        .click(function () {
            var href = window.location.href;
            Cryptpad.confirm(Messages.forgetPrompt, function (yes) {
                if (!yes) { return; }
                Cryptpad.forgetPad(href, function (err) {
                    if (err) {
                        console.log("unable to forget pad");
                        console.log(err);
                        return;
                    }
                    document.title = window.location.hash.slice(1,9);
                });
            });
        });

        var $rename = Button({
            id: 'rename',
            'class': 'rename button action',
            title: Messages.renameButtonTitle,
        })
        .text(Messages.renameButton)
        .click(function () {
            var suggestion = suggestName();
            Cryptpad.prompt(Messages.renamePrompt,
                suggestion, function (title, ev) {
                if (title === null) { return; }
                Cryptpad.causesNamingConflict(title, function (err, conflicts) {
                    if (conflicts) {
                        Cryptpad.alert(Messages.renameConflict);
                        return;
                    }
                    Cryptpad.setPadTitle(title, function (err) {
                        if (err) {
                            console.log("unable to set pad title");
                            console.error(err);
                            return;
                        }
                        document.title = title;
                    });
                });
            });
        });

        var $import = Button({
            id: 'import',
            'class': 'import button action',
            title: Messages.importButtonTitle,
        })
        .text(Messages.importButton)
        .click(Cryptpad.importContent('text/plain', function (content, file) {
            $textarea.val(content);
            onLocal();
        }));

        var $export = Button({
            id: 'export',
            'class': 'export button action',
            title: Messages.exportButtonTitle,
        })
        .text(Messages.exportButton)
        .click(function () {
            var text = $textarea.val();
            var title = Cryptpad.fixFileName(suggestName()) + '.txt';

            Cryptpad.prompt(Messages.exportPrompt, title, function (filename) {
                if (filename === null) { return; }
                var blob = new Blob([text], {
                    type: 'text/plain;charset=utf-8',
                });
                saveAs(blob, filename);
            });
        });

        var $share = Button({
            id: 'share',
            'class': 'export button action',
            title: 'copy url', // TODO translate
        })
        .text('SHARE')
        .click(function () {
            var text = window.location.href;
            var success = Clipboard.copy(text);
            if (success) {
                Cryptpad.log("copied URL to clipboard");
                return;
            }
            Cryptpad.warn("failed to copy URL to clipboard");
        });

        $bar
            .append($present)
            .append($forget)
            .append($rename)
            .append($import)
            .append($export)
            .append($share);
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

        notify();
    };

    var onReady = config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        var content = canonicalize(realtime.getUserDoc());

        $textarea.val(content);

        Slide.update(content);

        if (Visible.isSupported()) {
            Visible.onChange(function (yes) {
                if (yes) { unnotify(); }
            });
        }

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {
        $textarea.attr('disabled', true);
        Cryptpad.alert("Server Connection Lost");
    };

    Cryptpad.ready(function () {
        var rt = Realtime.start(config);
    });

    ['cut', 'paste', 'change', 'keyup', 'keydown', 'select', 'textInput']
        .forEach(function (evt) {
            $textarea.on(evt, onLocal);
        });
});
