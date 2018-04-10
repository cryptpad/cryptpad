/* jshint ignore:start */

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
var id = Math.floor(Math.random()*100000);

onconnect = function(e) {
    console.log(e);
    console.log(i);
    var port = e.ports[0];
    console.log('here');
    //require([
    //    '/common/outer/async-store.js'
    //], function (Store) {
            //console.log(Store);
            console.log(self.Proxy);
            var n = i;
            port.postMessage({state: 'READY'});
            port.onmessage = function (e) {
                console.log('worker received');
                console.log(e.data);
                port.postMessage('hello CryptPad'+n);
                port.postMessage('This is '+id);
            };
            /*var data = {
                query: function (cmd, data, cb) {
                    console.log(cmd, data);
                },
                userHash: '/1/edit/RuTAa+HmbtSUqCWPAEXqPQ/WxOd8thjW3l7Bnkkfn9alSTB/',
                anonHash: '/1/edit/GT+hupjbbJqo9JIld-G8Rw/onfiJqWbpB0sAb-1sB6VhE+v/',
                localToken: 4915598039548860,
                language: 'fr',
            };
            Store.init(data, function (ret) {
                console.log(ret);
                console.log("Store is connected");
                Store.get(['cryptpad.username'], function (val) {
                    port.postMessage(val);
                });
                port.postMessage('Store is connected!');
                port.postMessage('Your username is ' + ret.store.proxy['cryptpad.username']);
            });*/
            i++;
    //});
};
