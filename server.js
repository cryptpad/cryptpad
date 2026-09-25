// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Server = require("cryptpad-server");
const { config, infra } = require('./lib/load-config');
process.env.STANDALONE = false;
Server.start(config, infra);
