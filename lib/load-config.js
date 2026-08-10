// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

let config;
const configPath = process.env.CRYPTPAD_CONFIG || "../config/config.js";
try {
    config = require(configPath);
} catch (e) {
    if (e instanceof SyntaxError) {
        console.error("config/config.js is faulty. See stacktrace below for more information. Terminating. \n");
        console.error(e.name + ": " + e.message);
        console.error(e.stack.split("\n\n")[0]);
        process.exit(1);
    } else {
        console.log("Config not found, loading the example config. You can customize the configuration by copying config/config.example.js to " + configPath);
    }
    config = require("../config/config.example");
}

let infra;
const infraPath = process.env.CRYPTPAD_CONFIG_INFRA || "../config/infra.js";
try {
    infra = require(infraPath);
} catch (e) {
    if (e instanceof SyntaxError) {
        console.error("config/infra.js is faulty. See stacktrace below for more information. Terminating. \n");
        console.error(e.name + ": " + e.message);
        console.error(e.stack.split("\n\n")[0]);
        process.exit(1);
    } else {
        console.log("Config not found, loading the example config. You can customize the configuration by copying config/infra.example.js to " + infraPath);
    }
    infra = require("../config/infra.example");
}

const isPositiveNumber = (n) => {
    return (!isNaN(n) && n >= 0);
};

if (!isPositiveNumber(config.inactiveTime)) {
    config.inactiveTime = 90;
}
if (!isPositiveNumber(config.archiveRetentionTime)) {
    config.archiveRetentionTime = 90;
}
if (!isPositiveNumber(config.maxUploadSize)) {
    config.maxUploadSize = 20 * 1024 * 1024;
}
if (!isPositiveNumber(config.defaultStorageLimit)) {
    config.defaultStorageLimit = 50 * 1024 * 1024;
}

// premiumUploadSize is worthless if it isn't a valid positive number
// or if it's less than the default upload size
if (!isPositiveNumber(config.premiumUploadSize) || config.premiumUploadSize < config.maxUploadSize) {
    delete config.premiumUploadSize;
}

module.exports = {
    config,
    infra
};
