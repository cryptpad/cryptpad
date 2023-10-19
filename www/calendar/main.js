// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    var hash, href;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true);
        href = obj.href;
        hash = obj.hash;
    }).nThen(function (/*waitFor*/) {
        var addData = function (meta, Cryptpad, user, Utils) {
            if (hash) {
                var parsed = Utils.Hash.parsePadUrl(href);
                if (parsed.hashData && parsed.hashData.newPadOpts) {
                    meta.calendarOpts  = Utils.Hash.decodeDataOptions(parsed.hashData.newPadOpts);
                }
            }
            meta.calendarHash = hash;
        };
        SFCommonO.start({
            addData: addData,
            hash: hash,
            href: href,
            noRealtime: true,
            cache: true,
        });
    });
});
