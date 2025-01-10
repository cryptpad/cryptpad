// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Path = require('node:path');
const nThen = require("nthen");
const Semaphore = require("saferphore");
const Logger = require("../lib/log");
const Pins = require("../lib/pins");
const config = require("../lib/load-config");
const BlobStorage = require("../lib/storage/blob");
const Store = require("../lib/storage/file");
const Fs = require('node:fs');
const Quota = require("../lib/commands/quota");
const Environment = require('../lib/env');
const Env = Environment.create(config);

const CSV = true;

config.logPath = false;
config.logToStdout = true;

const start = () => {
    let time = +new Date();
    let Log = {};
    let all = {};
    let blobStore, pinStore, store;
    nThen(w => {
        Logger.create(config, w(function (_log) {
            Env.Log = Log = _log;
        }));
    }).nThen(w => {
        config.getSession = function () {};
        Store.create(config, w(function (err, _store) {
            if (err) {
                w.abort();
                return void Log.error("ERR_PAD_STORE", err);
            }
            store = _store;
        }));
        BlobStorage.create(config, w(function (err, _store) {
            if (err) {
                w.abort();
                return void Log.error("ERR_BLOB_STORE", err);
            }
            blobStore = _store;
        }));
    }).nThen(w => {
        Quota.updateCachedLimits(Env, w((err) => {
            if (err) {
                return Env.Log.warn('UPDATE_QUOTA_ERR', err);
            }
            Env.Log.info('QUOTA_UPDATED', {});
        }));
    }).nThen(w => {
        Env.Log.info('START_LOADING_PINS');
        const handlePinLog = (content, id, next) => {
            const sema = Semaphore.create(20);
            const data = all[id] = {
                size: 0,
                n_pads: 0,
                n_blobs: 0,
                n_total: 0,
                first: content.first,
                last: content.latest
            };
            if (!content.user) {
                data.maybeTeam = true;
            }
            nThen(ww => {
                Object.keys(content.pins).forEach(id => {
                    sema.take(give => {
                        let addSize = ww(give((e, s) => {
                            if (typeof(s) !== "number") {
                                return; // XXX
                            }
                            data.size += s;
                            data.n_total++;
                            if (id.length === 32) {
                                data.n_pads++;
                            } else {
                                data.n_blobs++;
                            }
                        }));
                        if (id.length === 32) { // PAD
                            return store.getChannelSize(id, addSize);
                        }
                        blobStore.size(id, addSize);
                    });
                });
            }).nThen(() => {
                let key = id.replace(/-/g, '/');
                if (Env.limits[key]) {
                    let sub = Env.limits[key];
                    data.premium = sub?.plan;
                }
                Env.Log.info('PIN_LOG_HANDLED', key);
                next();
            });
        };

        Pins.load(w(() => {
            let duration = +new Date() - time;
            Env.Log.info('ALL_PINS_LOADED', duration);
        }), {
            pinPath: config.pinPath,
            handler: handlePinLog,
        });
    }).nThen(() => {
        if (!CSV) { return console.log(all); }
        let csv = `"User key","Premium plan","Bytes","Number pads","Number blobs","First activity","Last activity","May be a team"\n`;
        Object.keys(all).sort((a,b) => {
            return all[b].size - all[a].size;
        }).forEach(k => {
            const data = all[k];
            k = k.replace(/-/g, '/');
            let first = new Date(data.first).toISOString().slice(0,10);
            let last = new Date(data.last).toISOString().slice(0,10);
            let plan = data.premium || '';
            let t = String(!!data.maybeTeam);
            csv += `"${k}","${plan}","${data.size}","${data.n_pads}","${data.n_blobs}","${first}","${last}","${t}"\n`;
        });
        let filename = `../${new Date().toISOString().slice(0,10)}-stats.csv`;
        Fs.writeFile(filename, csv, err => {
            if (err) {
                console.error(err);
            } else {
                console.log('CSV available at', filename);
            }
        });
    });
};
start();
