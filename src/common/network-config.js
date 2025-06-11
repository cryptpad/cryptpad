// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

(() => {
const factory = (ApiConfig = {}) => {
    var Config = {};

    Config.setCustomize = data => {
        ApiConfig = data.ApiConfig;
    };

    Config.getWebsocketURL = function (origin) {
        var path = ApiConfig.websocketPath || '/cryptpad_websocket';
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var l = new URL(origin || globalThis?.location?.href || ApiConfig.httpUnsafeOrigin);
        if (origin) {
            l.href = origin;
        }
        var protocol = l.protocol.replace(/http/, 'ws');
        var host = l.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    return Config;
};

if (typeof(module) !== 'undefined' && module.exports) {
    module.exports = factory();
} else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
    define([
        '/api/config'
    ], factory);
} else {
    // unsupported initialization
}

})();
