/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
var Https = require('https');
var Fs = require('fs');
var WebSocketServer = require('ws').Server;
var NetfluxSrv = require('./node_modules/chainpad-server/NetfluxWebsocketSrv');
var Package = require('./package.json');
var Path = require("path");

var config = require('./config');
var websocketPort = config.websocketPort || config.httpPort;
var useSecureWebsockets = config.useSecureWebsockets || false;

// support multiple storage back ends
var Storage = require(config.storage||'./storage/file');

var app = Express();

var httpsOpts;

var DEV_MODE = !!process.env.DEV
if (DEV_MODE) {
    console.log("DEV MODE ENABLED");
}

const clone = (x) => (JSON.parse(JSON.stringify(x)));

var setHeaders = (function () {
    if (typeof(config.httpHeaders) !== 'object') { return function () {}; }

    const headers = clone(config.httpHeaders);
    if (config.contentSecurity) {
        headers['Content-Security-Policy'] = clone(config.contentSecurity);
    }
    const padHeaders = clone(headers);
    if (config.padContentSecurity) {
        padHeaders['Content-Security-Policy'] = clone(config.padContentSecurity);
    }
    if (Object.keys(headers).length) {
        return function (req, res) {
            const h = /^\/pad\/inner\.html.*/.test(req.url) ? padHeaders : headers;
            for (let header in h) { res.setHeader(header, h[header]); }
        };
    }
    return function () {};
}());

(function () {
if (!config.logFeedback) { return; }

const logFeedback = function (url) {
    url.replace(/\?(.*?)=/, function (all, fb) {
        console.log('[FEEDBACK] %s', fb);
    });
};

app.head(/^\/common\/feedback\.html/, function (req, res, next) {
    logFeedback(req.url);
    next();
});
}());

app.use(function (req, res, next) {
    setHeaders(req, res);
    if (/[\?\&]ver=[^\/]+$/.test(req.url)) { res.setHeader("Cache-Control", "max-age=31536000"); }
    next();
});

app.use(Express.static(__dirname + '/www'));

Fs.exists(__dirname + "/customize", function (e) {
    if (e) { return; }
    console.log("Cryptpad is customizable, see customize.dist/readme.md for details");
});

// FIXME I think this is a regression caused by a recent PR
// correct this hack without breaking the contributor's intended behaviour.

var mainPages = config.mainPages || ['index', 'privacy', 'terms', 'about', 'contact'];
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static(__dirname + '/customize.dist'));

app.use("/blob", Express.static(Path.join(__dirname, (config.blobPath || './blob'))));

app.use("/customize", Express.static(__dirname + '/customize'));
app.use("/customize", Express.static(__dirname + '/customize.dist'));
app.use(/^\/[^\/]*$/, Express.static('customize'));
app.use(/^\/[^\/]*$/, Express.static('customize.dist'));

if (config.privKeyAndCertFiles) {
    var privKeyAndCerts = '';
    config.privKeyAndCertFiles.forEach(function (file) {
        privKeyAndCerts = privKeyAndCerts + Fs.readFileSync(file);
    });
    var array = privKeyAndCerts.split('\n-----BEGIN ');
    for (var i = 1; i < array.length; i++) { array[i] = '-----BEGIN ' + array[i]; }
    var privKey;
    for (var i = 0; i < array.length; i++) {
        if (array[i].indexOf('PRIVATE KEY-----\n') !== -1) {
            privKey = array[i];
            array.splice(i, 1);
            break;
        }
    }
    if (!privKey) { throw new Error("cannot find private key"); }
    httpsOpts = {
        cert: array.shift(),
        key: privKey,
        ca: array
    };
}

app.get('/api/config', function(req, res){
    var host = req.headers.host.replace(/\:[0-9]+/, '');
    res.setHeader('Content-Type', 'text/javascript');
    res.send('define(' + JSON.stringify({
        requireConf: {
            waitSeconds: 60,
            urlArgs: 'ver=' + Package.version + (DEV_MODE? '-' + (+new Date()): ''),
        },
        removeDonateButton: (config.removeDonateButton === true),
        allowSubscriptions: (config.allowSubscriptions === true),

        websocketPath: config.useExternalWebsocket ? undefined : config.websocketPath,
        websocketURL:'ws' + ((useSecureWebsockets) ? 's' : '') + '://' + host + ':' +
            websocketPort + '/cryptpad_websocket',
    }) + ');');
});

var httpServer = httpsOpts ? Https.createServer(httpsOpts, app) : Http.createServer(app);

httpServer.listen(config.httpPort,config.httpAddress,function(){
    console.log('[%s] listening on port %s', new Date().toISOString(), config.httpPort);
});

var wsConfig = { server: httpServer };

var createSocketServer = function (err, rpc) {
    if(!config.useExternalWebsocket) {
        if (websocketPort !== config.httpPort) {
            console.log("setting up a new websocket server");
            wsConfig = { port: websocketPort};
        }
        var wsSrv = new WebSocketServer(wsConfig);
        Storage.create(config, function (store) {
            NetfluxSrv.run(store, wsSrv, config, rpc);
        });
    }
};

var loadRPC = function (cb) {
    config.rpc = typeof(config.rpc) === 'undefined'? './rpc.js' : config.rpc;

    if (typeof(config.rpc) === 'string') {
        // load pin store...
        var Rpc = require(config.rpc);
        Rpc.create(config, function (e, rpc) {
            if (e) { throw e; }
            cb(void 0, rpc);
        });
    } else {
        cb();
    }
};

loadRPC(createSocketServer);
