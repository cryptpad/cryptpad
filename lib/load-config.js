var config;
try {
    config = require("../config/config");
    if (config.adminEmail === 'i.did.not.read.my.config@cryptpad.fr') {
        console.log("You can configure the administrator email (adminEmail) in your config/config.js file");
    }
} catch (e) {
    console.log("You can customize the configuration by copying config/config.example.js to config/config.js");
    config = require("../config/config.example");
}
module.exports = config;

