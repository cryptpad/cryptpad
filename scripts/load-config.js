var config;
try {
    config = require("../config/config");
} catch (e) {
    config = require("../config/config.example");
}
module.exports = config;
