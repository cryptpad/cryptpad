var Netflux = require("netflux-websocket");
var WebSocket = require("ws"); // jshint ignore:line
var nThen = require("nthen");

var Util = require("../../www/common/common-util");

var Nacl = require("tweetnacl");

var Client = module.exports;

var createNetwork = Client.createNetwork = function (url, cb) {
    var CB = Util.once(cb);

    var info = {};

    Netflux.connect(url, function (url) {
        // this websocket seems to never close properly if the error is
        // ECONNREFUSED
        info.websocket = new WebSocket(url)
        .on('error', function (err) {
            CB(err);
        })
        .on('close', function (/* err */) {
            delete info.websocket;
        });
        return info.websocket;
    }).then(function (network) {
        info.network = network;
        CB(void 0, info);
    }, function (err) {
        CB(err);
    });
};

var die = function (client) {
    var disconnect = Util.find(client, ['config', 'network', 'disconnect']);
    if (typeof(disconnect) === 'function') {
        disconnect();
    } else {
        console.error("disconnect was not a function");
    }
    var close = Util.find(client, ['config', 'websocket', 'close']);
    if (typeof(close) === 'function') {
        client.config.websocket.close();
    } else {
        console.error("close was not a function");
    }
};

Client.create = function (config, cb) {
    if (typeof(config) === 'function') {
        cb = config;
        config = {};
    }
    var client = {
        config: config,
    };
    var CB = Util.once(function (err, arg) {
        if (err) { die(client); }
        cb(err, arg);
    });

    client.shutdown = function () {
        die(client);
    };

    nThen(function (w) {
        if (config.network) { return; }
        // connect to the network...
        createNetwork('ws://localhost:3000/cryptpad_websocket', w(function (err, info) {
            if (err) {
                w.abort();
                return void CB(err);
            }
            config.network = info.network;
            config.websocket = info.websocket;
        }));
    }).nThen(function (w) {
        // make sure the network has a historyKeeper id on it
        // we're responsible for adding it
        if (config.network.historyKeeper) { return; }
        var channel = Util.uint8ArrayToHex(Nacl.randomBytes(16));
        config.network.join(channel).then(w(function (wc) {
            wc.members.some(function (member) {
                if (member.length !== 16) { return; }
                config.network.historyKeeper = member;
                return true;
            });
            wc.leave();
        }), function (err) {
            w.abort();
            CB(err);
        });
    }).nThen(function () {
        CB(void 0, client);
    });
};

