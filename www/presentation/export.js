// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([], function () {
    var module = {
        ext: '.pptx', // default
        exts: ['.pptx']
    };

    module.main = function (userDoc, cb, ext, sframeChan, padData) {
        sframeChan.query('Q_OOIFRAME_OPEN', {
            json: userDoc,
            type: 'presentation',
            padData: padData
        }, function (err, u8) {
            if (!u8) { return void cb(''); }
            var ext;
            if (typeof(u8) === "string") { ext = '.bin'; } // x2t not supported
            var blob = new Blob([u8], {type: "application/bin;charset=utf-8"});
            cb(blob, ext);
        }, {
            timeout: 600000,
            raw: true
        });
    };

    return module;
});

