var Express = require('express');
var Http = require('http');
var WebSocketServer = require('ws').Server;
var ChainPadSrv = require('./ChainPadSrv');
var Storage = require('./Storage');

var config = require('./config');
config.websocketPort = config.websocketPort || config.httpPort;

var app = Express();
app.use(Express.static(__dirname + '/www'));

app.get('/api/config', function(req, res){
    var host = req.headers.host.replace(/\:[0-9]+/, '');
    res.setHeader('Content-Type', 'text/javascript');
    res.send('define(' + JSON.stringify({
        websocketURL:'ws://' + host + ':' + config.websocketPort + '/cryptpad_websocket'
    }) + ');');
});

var httpServer = Http.createServer(app);
httpServer.listen(config.httpPort);
console.log('listening on port ' + config.httpPort);

var wsConfig = { server: httpServer };
if (config.websocketPort !== config.httpPort) {
    wsConfig = { port: config.websocketPort };
}

var wsSrv = new WebSocketServer(wsConfig);
Storage.create(config, function (store) {
    console.log('DB connected');
    ChainPadSrv.create(wsSrv, store);
});
