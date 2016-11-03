require.config({ paths: { 'json.sortify': '/bower_components/json.sortify/dist/JSON.sortify' } });
define([
    '/customize/messages.js?app=pad',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/toolbar.js',
    '/common/cursor.js',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/TypingTests.js',
    'json.sortify',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    '/common/cryptpad-common.js',
    '/common/visible.js',
    '/common/notify.js',
    '/bower_components/file-saver/FileSaver.min.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
    '/customize/pad.js'
], function (Messages, Crypto, realtimeInput, Hyperjson,
    Toolbar, Cursor, JsonOT, TypingTest, JSONSortify, TextPatcher, Cryptpad,
    Visible, Notify) {
    var $ = window.jQuery;
    var saveAs = window.saveAs;
    var $iframe = $('#pad-iframe').contents();
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var files = {
        root: {
            "Directory 1": {
                "Dir A": {
                    "File a": "#hash_a",
                    "File b": "#hash_b"
                },
                "Dir B": {},
                "File A": "#hash_A"
            },
            "Directory 2": {
                "File B": "#hash_B",
                "File C": "#hash_C"
            }
        },
        trash: {
            "File Z": "#hash_Z"
        }
    };

    var $tree = $iframe.find("#tree");
    var $content = $iframe.find("#content");
    var $folderIcon = $('<span>', {
        "class": "fa fa-folder folder",
        style: "font-family: FontAwesome"
    });
    var $fileIcon = $('<span>', {
        "class": "fa fa-file file",
        style: "font-family: FontAwesome"
    });

    var displayDirectory = function (name, root) {
        $content.html("");
        var $title = $('<h1>').text(name);
        var $dirContent = $('<div>', {id: "folderContent"});
        var $list = $('<ul>').appendTo($dirContent);
        // display sub directories
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) === "string") { return; }
            var $name = $('<span>').text(key).prepend($folderIcon.clone());
            var $element = $('<li>').append($name).click(function () {
                displayDirectory(key, root[key]);
            });
            $element.appendTo($list);
        });
        // display files
        Object.keys(root).forEach(function (key) {
            if (typeof(root[key]) !== "string") { return; }
            var $name = $('<span>').text(key).prepend($fileIcon.clone());
            var $element = $('<li>').append($name).click(function () {
                window.location.hash = root[key];
            });
            $element.appendTo($list);
        });
        $content.append($title).append($dirContent);
    };

    var createTree = function (root, $container) {
        if (Object.keys(root).length === 0) { return; }
        var $list = $('<ul>').appendTo($container);
        Object.keys(root).forEach(function (key) {
            // Do not display files in the menu
            if (typeof(root[key]) === "string") { return; }
            var $name = $('<span>').text(key).click(function () {
                displayDirectory(key, root[key]);
            });
            var $element = $('<li>').append($name);
            $element.appendTo($list);
            createTree(root[key], $element[0]);
        });
    };
    createTree(files.root, $tree);
});
