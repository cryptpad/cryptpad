var Express = require('express');
var Http = require('http');
var WebSocketServer = require('ws').Server;
var ChainPadSrv = require('./ChainPadSrv');
var Storage = require('./Storage');

var config = {
    httpPort: 3000,
    mongoUri: "mongodb://demo_user:demo_password@ds027769.mongolab.com:27769/demo_database",
    mongoCollectionName: 'cryptpad'
};

var app = Express();
app.use(Express.static(__dirname + '/www'));

var httpServer = Http.createServer(app);
httpServer.listen(config.httpPort);
console.log('listening on port ' + config.httpPort);

var wsSrv = new WebSocketServer({server: httpServer});
Storage.create(config, function (store) {
    console.log('DB connected');
    ChainPadSrv.create(wsSrv, store);
});
