console.log('SW!');
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

self.tabs = {};
var findTab = function (port) {
    var tab;
    Object.keys(self.tabs).some(function (id) {
        if (self.tabs[id].port === port) {
            tab = port;
            return true;
        }
    });
    return tab;
};

var postMsg = function (client, data) {
    client.port.postMessage(data);
};

var debug = function (msg) { console.log(msg); };
// debug = function () {};

var init = function (client, cb) {
    debug('SharedW INIT');

    require([
        '/common/common-util.js',
        '/common/outer/worker-channel.js',
        '/common/outer/store-rpc.js'
    ], function (Util, Channel, Rpc) {
        debug('SharedW Required ressources loaded');
        var msgEv = Util.mkEvent();

        var postToClient = function (data) {
            postMsg(client, data);
        };
        Channel.create(msgEv, postToClient, function (chan) {
            debug('SharedW Channel created');

            var clientId = client.id;
            client.chan = chan;
            Object.keys(Rpc.queries).forEach(function (q) {
                if (q === 'CONNECT') { return; }
                if (q === 'JOIN_PAD') { return; }
                if (q === 'SEND_PAD_MSG') { return; }
                chan.on(q, function (data, cb) {
                    try {
                        Rpc.queries[q](clientId, data, cb);
                    } catch (e) {
                        console.error('Error in webworker when executing query ' + q);
                        console.error(e);
                        console.log(data);
                    }
                });
            });
            chan.on('CONNECT', function (cfg, cb) {
                debug('SharedW connecting to store...');
                if (self.store) {
                    debug('Store already exists!');
                    if (cfg.driveEvents) {
                        Rpc._subscribeToDrive(clientId);
                    }
                    if (cfg.messenger) {
                        Rpc._subscribeToMessenger(clientId);
                    }
                    return void cb(self.store);
                }

                debug('Loading new async store');
                // One-time initialization (init async-store)
                cfg.query = function (cId, cmd, data, cb) {
                    cb = cb || function () {};
                    self.tabs[cId].chan.query(cmd, data, function (err, data2) {
                        if (err) { return void cb({error: err}); }
                        cb(data2);
                    });
                };
                cfg.broadcast = function (excludes, cmd, data, cb) {
                    cb = cb || function () {};
                    Object.keys(self.tabs).forEach(function (cId) {
                        if (excludes.indexOf(cId) !== -1) { return; }
                        self.tabs[cId].chan.query(cmd, data, function (err, data2) {
                            if (err) { return void cb({error: err}); }
                            cb(data2);
                        });
                    });
                };
                Rpc.queries['CONNECT'](clientId, cfg, function (data) {
                    if (cfg.driveEvents) {
                        Rpc._subscribeToDrive(clientId);
                    }
                    if (cfg.messenger) {
                        Rpc._subscribeToMessenger(clientId);
                    }
                    if (data && data.state === "ALREADY_INIT") {
                        self.store = data.returned;
                        return void cb(data.returned);
                    }
                    self.store = data;
                    cb(data);
                });
            });
            chan.on('JOIN_PAD', function (data, cb) {
                client.channelId = data.channel;
                try {
                    Rpc.queries['JOIN_PAD'](clientId, data, cb);
                } catch (e) {
                    console.error('Error in webworker when executing query JOIN_PAD');
                    console.error(e);
                    console.log(data);
                }
            });
            chan.on('SEND_PAD_MSG', function (msg, cb) {
                var data = {
                    msg: msg,
                    channel: client.channelId
                };
                try {
                    Rpc.queries['SEND_PAD_MSG'](clientId, data, cb);
                } catch (e) {
                    console.error('Error in webworker when executing query SEND_PAD_MSG');
                    console.error(e);
                    console.log(data);
                }
            });
            cb();
        }, true);

        client.msgEv = msgEv;
    });
};

onconnect = function(e) {
    debug('New ShardWorker client');
    var port = e.ports[0];
    var cId = Number(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
    var client = self.tabs[cId] = {
        id: cId,
        port: port
    };

    port.onmessage = function (e) {
        if (e.data === "INIT") {
            if (client.init) { return; }
            client.init = true;
            init(client, function () {
                postMsg(client, 'SW_READY');
            });
        } else if (client && client.msgEv) {
            client.msgEv.fire(e);
        }
    };
};

self.tabs = {};
self.addEventListener('message', function (e) {
    var cId = e.source.id;
    if (e.data === "INIT") {
        if (tabs[cId]) { return; }
        tabs[cId] = {
            client: e.source
        };
        init(e.source, function () {
            postMsg(e.source, 'SW_READY');
        });
    } else if (self.tabs[cId] && self.tabs[cId].msgEv) {
        self.tabs[cId].msgEv.fire(e);
    }
});
self.addEventListener('install', function (e) {
    debug('V1 installing…');
    self.skipWaiting();
});

self.addEventListener('activate', function (e) {
    debug('V1 now ready to handle fetches!');
});



