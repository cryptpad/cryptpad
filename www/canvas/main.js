require.config({ paths: {
    'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify'
}});

define([
    '/api/config?cb=' + Math.random().toString(16).substring(2),
    '/common/RealtimeTextarea.js',
    '/common/messages.js',
    '/common/crypto.js',
    '/common/TextPatcher.js',
    '/bower_components/fabric.js/dist/fabric.min.js',
    'json.sortify',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Config, Realtime, Messages, Crypto, TextPatcher, Fabric, JSONSortify) { 
    var module = window.APP = { };
    var $ = module.$ = window.jQuery;
    var Fabric = module.Fabric = window.fabric;

    $(window).on('hashchange', function() {
        window.location.reload();
    });
    if (window.location.href.indexOf('#') === -1) {
        window.location.href = window.location.href + '#' + Crypto.genKey();
        return;
    }

    /* Initialize Fabric */
    var canvas = module.canvas = new Fabric.Canvas('canvas');
    var $canvas = $('canvas');

    var $width = $('#width');
    var updateBrushWidth = function () {
        canvas.freeDrawingBrush.width = Number($width.val());
    };
    updateBrushWidth();

    $width.on('change', updateBrushWidth);

    var palette = ['red', 'blue', 'green', 'white', 'black', 'purple', 'gray'];
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

    var key = Crypto.parseKey(window.location.hash.substring(1));
    var initializing = true;

    var config = module.config = {
        websocketURL: Config.websocketURL + '_old',
        userName: Crypto.rand64(8),
        channel: key.channel,
        cryptKey: key.cryptKey
    };

    var onInit = config.onInit = function (info) { };

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
    };

    var rt = Realtime.start(config);

    canvas.on('mouse:up', onLocal);

    $('#clear').on('click', function () {
        canvas.clear();
    });


});
