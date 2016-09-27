/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
var Https = require('https');
var Fs = require('fs');
var WebSocketServer = require('ws').Server;
var NetfluxSrv = require('./NetfluxWebsocketSrv');
var WebRTCSrv = require('./WebRTCSrv');

var config = require('./config');
config.websocketPort = config.websocketPort || config.httpPort;

// support multiple storage back ends
var Storage = require(config.storage||'./storage/mongo');

var app = Express();
app.use(Express.static(__dirname + '/www'));

Fs.exists(__dirname + "/customize", function (e) {
    if (e) { return; }
    console.log("Cryptpad is customizable, see customize.dist/readme.md for details");
});

app.use("/customize", Express.static(__dirname + '/customize'));
app.use("/customize", Express.static(__dirname + '/customize.dist'));
app.use(/^\/[^\/]*$/, Express.static('customize'));
app.use(/^\/[^\/]*$/, Express.static('customize.dist'));

var httpsOpts;
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
        websocketURL:'ws' + ((httpsOpts) ? 's' : '') + '://' + host + ':' +
            config.websocketPort + '/cryptpad_websocket',
        webrtcURL:'ws' + ((httpsOpts) ? 's' : '') + '://' + host + ':' +
            config.websocketPort + '/cryptpad_webrtc',
    }) + ');');
});

var httpServer = httpsOpts ? Https.createServer(httpsOpts, app) : Http.createServer(app);

httpServer.listen(config.httpPort,config.httpAddress,function(){
    console.log('listening on %s',config.httpPort);
});

var wsConfig = { server: httpServer };
if (config.websocketPort !== config.httpPort) {
    console.log("setting up a new websocket server");
    wsConfig = { port: config.websocketPort};
}
var wsSrv = new WebSocketServer(wsConfig);
Storage.create(config, function (store) {
    console.log('DB connected');
    NetfluxSrv.run(store, wsSrv, config);
    WebRTCSrv.run(wsSrv);
});