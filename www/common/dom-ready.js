// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define(function () {
    return {
        onReady: function (cb) {
            if (document.readyState === 'complete') { return void cb(); }
            document.onreadystatechange = function () {
                if (document.readyState === 'complete') { cb(); }
            };
        }
    };
});
