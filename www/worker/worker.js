var window = self;
var localStorage = {
    setItem: function (k, v) { localStorage[k] = v; },
    getItem: function (k) { return localStorage[k]; }
};

importScripts('/bower_components/requirejs/require.js');

require.config({
        // fix up locations so that relative urls work.
        baseUrl: '/',
        paths: { 
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
});

var i = 0;

onconnect = function(e) {
    console.log(e);
    var port = e.ports[0];
    console.log('here');
    require([
        '/customize/messages.js',
    ], function (Messages) {
        console.log(Messages);
            var n = i;
            port.postMessage({state: 'READY'});
            port.onmessage = function (e) {
                console.log('worker received');
                console.log(e.data);
                port.postMessage('hello CryptPad'+n+', ' + Messages.test);
            };
            i++;
    });
};
