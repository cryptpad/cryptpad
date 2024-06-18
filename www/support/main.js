// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
    '/common/outer/local-store.js',
    '/common/outer/login-block.js',
], function (nThen, ApiConfig, DomReady, SFCommonO, LocalStore, Block) {

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        SFCommonO.initIframe(waitFor);
    }).nThen(function (/*waitFor*/) {
        var category;
        if (window.location.hash) {
            category = window.location.hash.slice(1);
            window.location.hash = '';
        }
        var addData = function (obj) {
            if (category) { obj.category = category; }
            var hash = LocalStore.getBlockHash();

            if (!hash) { return; }
            var parsed = Block.parseBlockHash(hash);
            if (!parsed || !parsed.href) { return; }
            obj.blockLocation = parsed.href;
        };
        SFCommonO.start({
            noRealtime: true,
            addData: addData,
        });
    });
});
