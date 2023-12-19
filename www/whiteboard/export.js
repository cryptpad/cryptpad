// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
    '/lib/fabric.min.js',
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

            var w = 0;
            var h = 0;
            var MAX = 8192;
            canvas.forEachObject(function (obj) {
                var c = obj.getCoords();
                Object.keys(c).forEach(function (k) {
                    if (c[k].x > w) { w = c[k].x + 1; }
                    if (c[k].y > h) { h = c[k].y + 1; }
                });
            });
            // Empty documents are rendered as a 600x600 transparent PNG image
            w = w === 0 ? 600 : Math.min(w, MAX);
            h = h === 0 ? 600 : Math.min(h, MAX);
            canvas.setWidth(w);
            canvas.setHeight(h);
            canvas.calcOffset();
            canvas.renderAll();

            module.ext = '.png';
            canvas_node.toBlob(cb);
            /*
            module.ext = '.svg';
            cb(new Blob([canvas.toSVG()], {type: 'image/svg+xml'}));
            */
        });
    };

    return module;
});

