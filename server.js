// SPDX-FileCopyrightText: 2026 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Server = require("cryptpad-server");
const Eviction = require("cryptpad-server/build/eviction");
const { config, infra } = require('./lib/load-config');
process.env.STANDALONE = false;

const runEviction = (cb) => {
    Eviction.prepareEnv({
        config, infra, myId: 'eviction'
    }, (err, Env) => {
        if (err) {
            console.error('EVICTION_PREPARE_ENV_ERROR', err);
            return void cb();
        }

        Env.DRY_RUN = false;
        Eviction(Env, (err, report) => {
            if (err) { Env.Log.error('EVICT_INACTIVE_MAIN_ERROR', err); }
            if (report) {
                Env.Log.info('EVICT_INACTIVE_FINAL_REPORT', report);
            }
            cb();
        });
    });
};

const initEviction = () => {
    const ONE_DAY = 24 * 1000 * 60 * 60;
    const disableIntegratedEviction = typeof(config.disableIntegratedEviction) === 'undefined'? true: config.disableIntegratedEviction;
    if (disableIntegratedEviction) { return; }

    let active = false;
    let lastEviction = +new Date();

    setInterval(() => {
        if (active) { return; }

        // Evict inactive data once per day
        const now = +new Date();
        if ((now - ONE_DAY) < lastEviction) { return; }

        // Start eviction
        active = true;
        runEviction(() => {
            active = false;
            lastEviction = now;
        });
    }, 60 * 1000);
};
initEviction();

Server.start(config, infra);
