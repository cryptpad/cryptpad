// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
    '/bower_components/secure-fabric.js/dist/fabric.min.js',
], function () {
    var module = {};

    var Fabric = window.fabric;
    module.main = function (userDoc, cb) {
        var canvas_node = document.createElement('canvas');
        canvas_node.setAttribute('style', 'width:600px;height:600px;');
        canvas_node.setAttribute('width', '600');
        canvas_node.setAttribute('height', '600');
        var canvas = new Fabric.Canvas(canvas_node);
        var content = userDoc.content;
        canvas.loadFromJSON(content, function () {
            module.ext = '.svg';
            cb(canvas.toSVG());
        });
    };

    return module;
});

