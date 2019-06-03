/* jslint node: true */
"use strict";
var config;
var configPath = process.env.CRYPTPAD_CONFIG || "../config/config";
try {
    config = require(configPath);
    if (config.adminEmail === 'i.did.not.read.my.config@cryptpad.fr') {
        console.log("You can configure the administrator email (adminEmail) in your config/config.js file");
    }
} catch (e) {
    console.log("Config not found, loading the example config. You can customize the configuration by copying config/config.example.js to " + configPath);
    config = require("../config/config.example");
}
module.exports = config;

