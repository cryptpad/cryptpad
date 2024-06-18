// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/components/localforage/dist/localforage.min.js',
    '/common/outer/cache-store.js',
    '/components/nthen/index.js',
], function (localForage, Cache, nThen) {
    nThen(function (w) {
        localStorage.clear();
        localForage.clear(w());
        Cache.clear(w());
    }).nThen(function () {
        window.location.href = '/login/';
    });
});
