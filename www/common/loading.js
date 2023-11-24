// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(function () {
try {
    var req = JSON.parse(decodeURIComponent(window.location.hash.substring(1)));
    var theme = req.theme;
    var os = req.themeOS;
    window.CryptPad_theme = theme || os;
    if ((theme || os) === 'dark') {
        var s = document.createElement('style');
        s.innerHTML = 'body { background: black; }';
        document.body.appendChild(s);
    }
} catch (e) { console.error(e); }
})();

require(['/customize/loading.js'], function (Loading) {
    Loading();
});
