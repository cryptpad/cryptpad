require.config({ paths: {
    'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify'
}});

define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    'fabric.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
    //'/customize/pad.js'
], function (Config, Realtime, Crypto, TextPatcher, JSONSortify, JsonOT, Cryptpad) {
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var module = window.APP = { };
    var $ = module.$ = window.jQuery;
    var Fabric = module.Fabric = window.fabric;

    var secret = Cryptpad.getSecrets();

    /* Initialize Fabric */
    var canvas = module.canvas = new Fabric.Canvas('canvas');
    var $canvas = $('canvas');

    var $width = $('#width');
    var updateBrushWidth = function () {
        canvas.freeDrawingBrush.width = Number($width.val());
    };
    updateBrushWidth();

    $width.on('change', updateBrushWidth);

    var palette = ['red', 'blue', 'green', 'white', 'black', 'purple',
        'gray', 'beige', 'brown', 'cyan', 'darkcyan', 'gold', 'yellow', 'pink'];
    var $colors = $('#colors');
    $colors.html(function (i, val) {
        return palette.map(function (c) {
                return "<span class='palette' style='background-color:"+c+"'></span>";
            }).join("");
    });

    $('.palette').on('click', function () {
        var color = $(this).css('background-color');
        canvas.freeDrawingBrush.color = color;
    });

    var setEditable = function (bool) {
        canvas.isDrawingMode = bool;
        $canvas.css('border-color', bool? 'black': 'red');
    };

    var saveImage = module.saveImage = function () {
        var defaultName = "pretty-picture.png";
        Cryptpad.prompt(Messages.exportPrompt, defaultName, function (filename) {
            if (!(typeof(filename) === 'string' && filename)) { return; }
            $canvas[0].toBlob(function (blob) {
                saveAs(blob, filename);
            });
        });
    };

    var initializing = true;

    var config = module.config = {
        initialState: '{}',
        websocketURL: Cryptpad.getWebsocketURL(),
        validateKey: secret.keys.validateKey,
        readOnly: false, // TODO, support read-only
        channel: secret.channel,
        crypto: Crypto.createEncryptor(secret.keys),
        transformFunction: JsonOT.transform,
    };

    var editHash;
    var onInit = config.onInit = function (info) {
        editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
        Cryptpad.replaceHash(editHash);
    };

    // used for debugging, feel free to remove
    var Catch = function (f) {
        return function () {
            try {
                f();
            } catch (e) {
                console.error(e);
            }
        };
    };

    var onRemote = config.onRemote = Catch(function () {
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();

        canvas.loadFromJSON(userDoc);
        canvas.renderAll();
    });

    var onLocal = config.onLocal = Catch(function () {
        if (initializing) { return; }
        var content = JSONSortify(canvas.toDatalessJSON());
        module.patchText(content);
    });

    var onReady = config.onReady = function (info) {
        var realtime = module.realtime = info.realtime;
        module.patchText = TextPatcher.create({
            realtime: realtime
        });

        setEditable(true);
        initializing = false;
        onRemote();
    };

    var onAbort = config.onAbort = function (info) {
        setEditable(false);
        window.alert("Server Connection Lost");

        if (window.confirm("Would you like to save your image?")) {
            saveImage();
        }
    };

    var rt = Realtime.start(config);

    canvas.on('mouse:up', onLocal);

    $('#clear').on('click', function () {
        canvas.clear();
    });

    $('#save').on('click', function () {
        saveImage();
    });
});
