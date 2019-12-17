define([
    '/api/config'
], function (ApiConfig) {
    var Config = {};

    Config.getWebsocketURL = function (origin) {
        if (!ApiConfig.websocketPath) { return ApiConfig.websocketURL; }
        var path = ApiConfig.websocketPath;
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var l = window.location;
        if (origin && window && window.document) {
            var l = document.createElement("a");
            l.href = origin;
        }
        var protocol = l.protocol.replace(/http/, 'ws');
        var host = l.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    return Config;
});
