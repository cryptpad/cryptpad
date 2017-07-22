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
