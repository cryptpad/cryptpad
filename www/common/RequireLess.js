// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/LessLoader.js'
], function (LessLoader) {
    var api = {};
    api.normalize = function(name, normalize) {
        return normalize(name);
    };
    api.load = function(cssId, req, load /*, config */) {
        LessLoader.load(cssId, load);
    };
    return api;
});
