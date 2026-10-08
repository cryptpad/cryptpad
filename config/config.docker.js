// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Docker overrides

let config = {};
try {
    config = require('./config');
} catch (e) {
    config = require('./config.example');
};
config.installMethod = "docker";
module.exports = config;
