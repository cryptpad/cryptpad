require.config({ paths: {
    'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify'
}});

define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/common/messages.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/bower_components/fabric.js/dist/fabric.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto, TextPatcher, JSONSortify, JsonOT, Cryptpad) {
    var saveAs = window.saveAs;

    var module = window.APP = { };
    var $ = module.$ = window.jQuery;
    var Fabric = module.Fabric = window.fabric;

    var secret = Cryptpad.getSecrets();
    /*
    var key;
    var channel = '';
    if (!/#/.test(window.location.href)) {
        key = Crypto.genKey();
    } else {
        var hash = window.location.hash.slice(1);
        channel = hash.slice(0, 32);
        key = hash.slice(32);
    }*/

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
        $canvas[0].toBlob(function (blob) {
            var defaultName = "pretty-picture.png";
            saveAs(blob, window.prompt("What would you like to name your image?",
                    defaultName) || "pretty-picture.png");
        });
    };

    var initializing = true;

    var config = module.config = {
        initialState: '{}',
        // TODO initialState ?
        websocketURL: Config.websocketURL,
        //userName: Crypto.rand64(8),
        channel: secret.channel,
        //cryptKey: key,
        crypto: Crypto.createEncryptor(secret.key),
        transformFunction: JsonOT.validate,
    };

    var onInit = config.onInit = function (info) {
        window.location.hash = info.channel + secret.key;
        $(window).on('hashchange', function() {
            window.location.reload();
        });
    };

    var onRemote = config.onRemote = function () {
        if (initializing) { return; }
        var userDoc = module.realtime.getUserDoc();
        canvas.loadFromJSON(userDoc);
        canvas.renderAll();
    };

    var onLocal = config.onLocal = function () {
        if (initializing) { return; }
        var content = JSONSortify(canvas.toDatalessJSON());
        module.patchText(content);
    };

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
