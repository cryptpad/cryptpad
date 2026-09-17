// Docker overrides

let config = {};
try {
    config = require('./config');
} catch (e) {
    config = require('./config.example');
};
config.installMethod = "docker";
module.exports = config;
