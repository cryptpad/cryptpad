/* jshint ignore:start */
importScripts('/bower_components/requirejs/require.js');

window = self;
localStorage = {
    setItem: function (k, v) { localStorage[k] = v; },
    getItem: function (k) { return localStorage[k]; }
};

self.tabs = {};

var postMsg = function (client, data) {
    client.postMessage(data);
};

var debug = function (msg) { console.log(msg); };
// debug = function () {};

var init = function (client, cb) {
    debug('SW INIT');
    require.config({
        waitSeconds: 600
    });

    require(['/api/config?cb=' + (+new Date()).toString(16)], function (ApiConfig) {
        if (ApiConfig.requireConf) { require.config(ApiConfig.requireConf); }
        require([
            '/common/requireconfig.js'
        ], function (RequireConfig) {
            require.config(RequireConfig());
            require([
                '/common/common-util.js',
                '/common/outer/worker-channel.js',
                '/common/outer/store-rpc.js'
            ], function (Util, Channel, SRpc) {
                debug('SW Required ressources loaded');
                var msgEv = Util.mkEvent();

                if (!self.Rpc) {
                    self.Rpc = SRpc();
                }
                var Rpc = self.Rpc;

                var postToClient = function (data) {
                    postMsg(client, data);
                };
                Channel.create(msgEv, postToClient, function (chan) {
                    debug('SW Channel created');

                    var clientId = client.id;
                    self.tabs[clientId].chan = chan;
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
                            if (q === "DISCONNECT") {
                                console.log('Deleting existing store!');
                                delete self.Rpc;
                                delete self.store;
                            }
                        });
                    });
                    chan.on('CONNECT', function (cfg, cb) {
                        debug('SW Connect callback');
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
                        self.tabs[clientId].channelId = data.channel;
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
                            channel: self.tabs[clientId].channelId
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

                self.tabs[client.id].msgEv = msgEv;

                self.tabs[client.id].close = function () {
                    Rpc._removeClient(client.id);
                };
            });
        });
    });
};

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
    } else if (e.data === "CLOSE") {
        if (tabs[cId] && tabs[cId].close) {
            console.log('leave');
            tabs[cId].close();
        }
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


