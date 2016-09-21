require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify'} });
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
    'json.sortify',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Messages, Realtime, Crypto, TextPatcher, Cryptpad, Slide, Notify, Visible, Clipboard, JSONSortify) {
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

    var APP = window.APP = {
        TextPatcher: TextPatcher,
        Slide: Slide,
    };

    var Stringify = APP.Stringify = JSONSortify;

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
        if (!(APP.tabNofification &&
            typeof(APP.tabNofification.cancel) === 'function')) { return; }
        APP.tabNofification.cancel();
    };

    var notify = function () {
        if (!(Visible.isSupported() && !Visible.currently())) { return; }
        unnotify();
        APP.tabNofification = Notify.tab(1000, 10);
    };

    var $modal = $('#modal');
    var $content = $('#content');
    Slide.setModal($modal, $content);

    var config = APP.config = {
        initialState: '{}',
        websocketURL: Config.websocketURL,
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.key),
    };

    var setEditable = function (bool) { $textarea.attr('disabled', !bool); };
    var canonicalize = function (text) { return text.replace(/\r\n/g, '\n'); };

    setEditable(false);

    var safelyParseContent = function (S, k, first) {
        if (!first) { return JSON.parse(S); }
        try { return JSON.parse(S); }
        catch (err) {
            console.log("Migrating text content to object form");
            var O = {};
            O[k] = S;
            return O;
        }
    };

    var getUserObj = function (rt) {
        return safelyParseContent(rt.getUserDoc(), 'content');
    };

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }

        var textContent = canonicalize($textarea.val());

        var userObj = getUserObj(APP.realtime);

        userObj.content = textContent;

        var content = Stringify(userObj);

        APP.patchText(content);
        Slide.update(textContent);
    };

    var Button = function (opt) {
        return $('<button>', opt);
    };

    var onInit = config.onInit = function (info) {
        window.location.hash = Cryptpad.getHashFromKeys(info.channel, secret.key);
        $(window).on('hashchange', function() {
            window.location.reload();
        });
        Cryptpad.getPadTitle(function (err, title) {
            if (err) {
                console.error(err);
                console.log("Couldn't get pad title");
                return;
            }
            document.title = APP.title = title || info.channel.slice(0, 8);
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
            title: Messages.presentButtonTitle,
        })
        .text(Messages.presentButton)
        .click(function () {
            Slide.show(true, $textarea.val());
            Cryptpad.log(Messages.presentSuccess);
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
                    var parsed = Cryptpad.parsePadUrl(href);
                    document.title = APP.title = Cryptpad.getDefaultName(parsed, []);
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
                        document.title = APP.title = title;
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
            'class': 'share button action',
            title: Messages.shareButtonTitle,
        })
        .text(Messages.shareButton)
        .click(function () {
            var text = window.location.href;
            var success = Clipboard.copy(text);
            if (success) {
                Cryptpad.log(Messages.shareSuccess);
                return;
            }
            Cryptpad.warn(Messages.shareFailed);
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
        var userObj = getUserObj(APP.realtime);
        var userDoc = userObj.content;

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
        var realtime = APP.realtime = info.realtime;
        APP.patchText = TextPatcher.create({
            realtime: realtime
        });

        var userObj = getUserObj(APP.realtime);
        var content = canonicalize(userObj.content || '');

        $textarea.val(content);

        Slide.update(content);

        if (Visible.isSupported()) {
            Visible.onChange(function (yes) {
                if (yes) { unnotify(); }
            });
        }

        Slide.onChange(function (o, n, l) {
            if (n !== null) {
                document.title = APP.title + ' (' + (++n) + '/' + l +  ')';
                return;
            }
            console.log("Exiting presentation mode");
            document.title = APP.title;
        });

        setEditable(true);
        initializing = false;
    };

    var onAbort = config.onAbort = function (info) {
        $textarea.attr('disabled', true);
        Cryptpad.alert(Messages.common_connectionLost);
    };

    Cryptpad.ready(function () {
        var rt = Realtime.start(config);
    });

    ['cut', 'paste', 'change', 'keyup', 'keydown', 'select', 'textInput']
        .forEach(function (evt) {
            $textarea.on(evt, onLocal);
        });
});
