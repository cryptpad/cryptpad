/* jshint ignore:start */
importScripts('/bower_components/requirejs/require.js');
require.config({
        // fix up locations so that relative urls work.
        baseUrl: '/',
        paths: { 
            // jquery declares itself as literally "jquery" so it cannot be pulled by path :(
            "jquery": "/bower_components/jquery/dist/jquery.min",
            // json.sortify same
            "json.sortify": "/bower_components/json.sortify/dist/JSON.sortify",
            cm: '/bower_components/codemirror'
        },
        map: {
            '*': {
                'css': '/bower_components/require-css/css.js',
                'less': '/common/RequireLess.js',
            }
        }
});

window = self;
localStorage = {
    setItem: function (k, v) { localStorage[k] = v; },
    getItem: function (k) { return localStorage[k]; }
};
require([
    '/common/common-util.js',
    '/common/outer/worker-channel.js',
    '/common/outer/store-rpc.js'
], function (Util, Channel, Rpc) {
    var msgEv = Util.mkEvent();

    Channel.create(msgEv, postMessage, function (chan) {
        console.log('ww ready');
        Object.keys(Rpc.queries).forEach(function (q) {
            if (q === 'CONNECT') { return; }
            chan.on(q, function (data, cb) {
                try {
                    Rpc.queries[q](data, cb);
                } catch (e) {
                    console.error('Error in webworker when executing query ' + q);
                    console.error(e);
                    console.log(data);
                }
            });
        });
        chan.on('CONNECT', function (cfg, cb) {
            console.log('onConnect');
            // load Store here, with cfg, and pass a "query" (chan.query)
            cfg.query = function (cmd, data, cb) {
                chan.query(cmd, data, function (err, data) {
                    if (err) { return void cb({error: err}); }
                    cb(data);
                });
            };
            Rpc.queries['CONNECT'](cfg, cb);
        });
    }, true);

    onmessage = function (e) {
        msgEv.fire(e);
    };
});
