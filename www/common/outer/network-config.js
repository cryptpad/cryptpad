define([
    '/api/config'
], function (ApiConfig) {
    var Config = {};

    Config.getWebsocketURL = function () {
        if (!ApiConfig.websocketPath) { return ApiConfig.websocketURL; }
        var path = ApiConfig.websocketPath;
        if (/^ws{1,2}:\/\//.test(path)) { return path; }

        var protocol = window.location.protocol.replace(/http/, 'ws');
        var host = window.location.host;
        var url = protocol + '//' + host + path;

        return url;
    };

    return Config;
});
