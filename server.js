const Server = require("cryptpad-server");
const { config, infra } = require('./lib/load-config');
process.env.STANDALONE = false;
Server.start(config, infra);
