define([
    '/api/config'
], function (ApiConfig) {
    var out = {
        // fix up locations so that relative urls work.
        baseUrl: window.location.pathname,
        paths: { 
            // json plugin
            text: '/bower_components/requirejs-plugins/lib/text',
            json: '/bower_components/requirejs-plugins/src/json',
            // jquery declares itself as literally "jquery" so it cannot be pulled by path :(
            "jquery": "/bower_components/jquery/dist/jquery.min",
            // json.sortify same
            "json.sortify": "/bower_components/json.sortify/dist/JSON.sortify",
            //"pdfjs-dist/build/pdf": "/bower_components/pdfjs-dist/build/pdf",
            //"pdfjs-dist/build/pdf.worker": "/bower_components/pdfjs-dist/build/pdf.worker"
            cm: '/bower_components/codemirror'
        },
        map: {
            '*': {
                'css': '/bower_components/require-css/css.js',
                'less': '/common/RequireLess.js',
            }
        }
    };
    Object.keys(ApiConfig.requireConf).forEach(function (k) { out[k] = ApiConfig.requireConf[k]; });
    return function () {
        return JSON.parse(JSON.stringify(out));
    };
});
