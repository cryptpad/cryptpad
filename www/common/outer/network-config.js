define([
    '/api/config'
], function (ApiConfig) {
    var Config = {};

    Config.getWebsocketURL = function (origin) {
        var path = ApiConfig.websocketPath || '/cryptpad_websocket';
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var l = window.location;
        if (origin && window && window.document) {
            l = document.createElement("a");
            l.href = origin;
        }
        var protocol = l.protocol.replace(/http/, 'ws');
        var host = l.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    return Config;
});
