// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
], function () {
    var module = {
        ext: '.json'
    };

    module.main = function (userDoc, cb) {
        var content = userDoc.content;
        cb(new Blob([JSON.stringify(content, 0, 2)], {
            type: 'application/json',
        }));
    };

    return module;
});

