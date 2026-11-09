// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Eviction = require("cryptpad-server/build/eviction");
const mainConfig = require("../lib/load-config");

Eviction.prepareEnv(mainConfig, (err, Env) => {
    if (err) {
        return console.error('EVICTION_PREPARE_ENV_ERROR', err);
    }

    // Set DRY_RUN to true to run the script without deleting anything. A log file
    // will be created.
    Env.DRY_RUN = false;

    Eviction.archived(Env, (err, report) => {
        if (!report) { return; }
        Env.Log.info('EVICT_ARCHIVED_FINAL_REPORT', report);
        process.exit(0);
    });

});
