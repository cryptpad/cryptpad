// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/components/localforage/dist/localforage.min.js',
    '/common/cache-store.js',
    '/components/nthen/index.js',
], function (localForage, Cache, nThen) {
    nThen(function (w) {
        // Preserve crowdfunding keys across logout so counters survive session changes
        var crowdfundingEntries = Object.keys(localStorage).reduce(function (acc, k) {
            if (/^cp_crowdfunding_/.test(k)) { acc[k] = localStorage.getItem(k); }
            return acc;
        }, {});
        localStorage.clear();
        Object.keys(crowdfundingEntries).forEach(function (k) {
            try { localStorage.setItem(k, crowdfundingEntries[k]); } catch (e) {}
        });
        localForage.clear(w());
        Cache.clear(w());
    }).nThen(function () {
        window.location.href = '/login/';
    });
});
