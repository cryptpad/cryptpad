// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
    '/common/sframe-common-codemirror.js',
], function (SFCodeMirror) {
    var module = {};

    module.main = function (userDoc, cb) {
        var mode = userDoc.highlightMode || 'gfm';
        var content = userDoc.content;
        module.ext = SFCodeMirror.getContentExtension(mode);
        cb(SFCodeMirror.fileExporter(content));
    };

    return module;
});

