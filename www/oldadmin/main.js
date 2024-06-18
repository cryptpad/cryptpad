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

    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        SFCommonO.initIframe(waitFor);
    }).nThen(function (/*waitFor*/) {
        var addRpc = function (sframeChan, Cryptpad/*, Utils*/) {
            // Adding a new avatar from the profile: pin it and store it in the object
            sframeChan.on('Q_ADMIN_MAILBOX', function (data, cb) {
                Cryptpad.addAdminMailbox(data, cb);
            });
            sframeChan.on('Q_ADMIN_RPC', function (data, cb) {
                Cryptpad.adminRpc(data, cb);
            });
            sframeChan.on('Q_UPDATE_LIMIT', function (data, cb) {
                Cryptpad.updatePinLimit(function (e) {
                    cb({error: e});
                });
            });
        };
        var category;
        if (window.location.hash) {
            category = window.location.hash.slice(1);
            window.location.hash = '';
        }
        var addData = function (obj) {
            if (category) { obj.category = category; }
        };
        SFCommonO.start({
            noRealtime: true,
            addRpc: addRpc,
            addData: addData
        });
    });
});
