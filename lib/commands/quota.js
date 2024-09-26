// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Quota = module.exports;

//const Util = require("../common-util");
const Keys = require("../keys");
const Https = require("https");
const Http = require("http");
const Util = require("../common-util");
const Stats = require("../stats");
const Admin = require("./admin-rpc.js");
const nThen = require('nthen');

var validLimitFields = ['limit', 'plan', 'note', 'users', 'origin'];

Quota.isValidLimit = function (o) {
    var valid = o && typeof(o) === 'object' &&
        typeof(o.limit) === 'number' &&
        typeof(o.plan) === 'string' &&
        typeof(o.note) === 'string' &&
        // optionally contains a 'users' array
        (Array.isArray(o.users) || typeof(o.users) === 'undefined') &&
        // check that the object contains only the expected fields
        !Object.keys(o).some(function (k) {
            return validLimitFields.indexOf(k) === -1;
        });

    return valid;
};

Quota.applyCustomLimits = function (Env) {
    // DecreedLimits > customLimits > serverLimits;

    // FIXME perform an integrity check on shared limits
    // especially relevant because we use Env.limits
    // when considering whether to archive inactive accounts

    // read custom limits from the Environment (taken from config)
    var customLimits = (function (custom) {
        var limits = {};
        Object.keys(custom).forEach(function (k) {
            var unsafeKey = Keys.canonicalize(k);
            if (!unsafeKey) { return; }
            limits[unsafeKey] = custom[k];
        });
        return limits;
    }(Env.customLimits || {}));

    Env.limits = Env.limits || {};
    Object.keys(customLimits).forEach(function (k) {
        if (!Quota.isValidLimit(customLimits[k])) { return; }
        Env.limits[k] = customLimits[k];
    });
    // console.log(Env.limits);
};

var isRemoteVersionNewer = function (local, remote) {
    try {
        local = local.split('.').map(Number);
        remote = remote.split('.').map(Number);
        for (var i = 0; i < 3; i++) {
            if (remote[i] < local[i]) { return false; }
            if (remote[i] > local[i]) { return true; }
        }
    } catch (err) {
        // if anything goes wrong just fall through and return false
        // false negatives are better than false positives
    }
    return false;
};

/*
var Assert = require("assert");
[
// remote versions
    ['4.5.0', '4.5.0', false], // equal semver should not prompt
    ['4.5.0', '4.5.1', true], // patch versions should prompt
    ['4.5.0', '4.6.0', true], // minor versions should prompt
    ['4.5.0', '5.0.0', true], // major versions should prompt
// local
    ['5.3.1', '4.9.0', false], // newer major should not prompt
    ['4.7.0', '4.6.0', false], // newer minor should not prompt
    ['4.7.0', '4.6.1', false], // newer patch should not prompt if other values are greater
].forEach(function (x) {
    var result = isRemoteVersionNewer(x[0], x[1]);
    Assert.equal(result, x[2]);
});
*/

// check if the remote endpoint reported an available server version
// which is newer than your current version (Env.version)
// if so, set Env.updateAvailable to the URL of its release notes
var checkUpdateAvailability = function (Env, json) {
    if (!(json && typeof(json.updateAvailable) === 'string' && typeof(json.version) === 'string')) { return; }
    // expects {updateAvailable: 'https://github.com/cryptpad/cryptpad/releases/4.7.0', version: '4.7.0'}
    // the version string is provided explicitly even though it could be parsed from GitHub's URL
    // this will allow old instances to understand responses of arbitrary URLs
    // as long as we keep using semver for 'version'
    if (!isRemoteVersionNewer(Env.version, json.version)) {
        Env.updateAvailable = undefined;
        return;
    }
    Env.updateAvailable = json.updateAvailable;
    Env.Log.info('AN_UPDATE_IS_AVAILABLE', {
        version: json.version,
        updateAvailable: json.updateAvaiable,
    });
};

var queryAccountServer = function (Env, cb) {
    var done = Util.once(Util.mkAsync(cb));

    var rawBody = Stats.instanceData(Env);

    let send = () => {
        Env.Log.info("SERVER_TELEMETRY", rawBody);
        var body = JSON.stringify(rawBody);

        var options = {
            host: 'accounts.cryptpad.fr',
            path: '/api/getauthorized',
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body)
            }
        };

        var req = Https.request(options, function (response) {
            if (!('' + response.statusCode).match(/^2\d\d$/)) {
                return void cb('SERVER ERROR ' + response.statusCode);
            }
            var str = '';

            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {
                try {
                    var json = JSON.parse(str);
                    checkUpdateAvailability(Env, json);
                    done(void 0, json);
                } catch (e) {
                    done(e);
                }
            });
        });

        req.on('error', function () {
            done();
        });

        req.end(body);
    };

    if (Env.provideAggregateStatistics) {
        let stats = {};
        nThen(waitFor => {
            Admin.getRegisteredUsers(Env, null, waitFor((err, data) => {
                if (err) { return; }
                stats.registered = data.users;
                if (Env.lastPingRegisteredUsers) {
                    stats.usersDiff = stats.registered - Env.lastPingRegisteredUsers;
                }
                Env.lastPingRegisteredUsers = stats.registered;
            }));
        }).nThen(() => {
            if (Env.maxConcurrentWs) {
                stats.maxConcurrentWs = Env.maxConcurrentWs;
                Env.maxConcurrentWs = 0;
            }
            if (Env.maxConcurrentUniqueWs) {
                stats.maxConcurrentUniqueIPs = Env.maxConcurrentUniqueWs;
                Env.maxConcurrentUniqueWs = 0;
            }
            if (Env.maxConcurrentRegUsers) {
                stats.maxConcurrentRegUsers = Env.maxConcurrentRegUsers;
                Env.maxConcurrentRegUsers = 0;
            }
            if (Env.maxActiveChannels) {
                stats.maxConcurrentChannels = Env.maxActiveChannels;
                Env.maxActiveChannels = 0;
            }
            rawBody.statistics = stats;
            send();
        });
        return;
    }
    send();
};
Quota.shouldContactServer = function (Env) {
    return !(Env.blockDailyCheck === true ||
        (
            typeof(Env.blockDailyCheck) === 'undefined' &&
            Env.adminEmail === false
            && Env.allowSubscriptions === false
        )
    );
};
Quota.pingAccountsDaily = function (Env, _cb) {
    var cb = Util.mkAsync(_cb);
    if (!Quota.shouldContactServer(Env)) { return void cb(); }
    queryAccountServer(Env, function (err) {
        cb(err);
    });
};

var queryQuotaServer = function (Env, cb) {
    var done = Util.once(Util.mkAsync(cb));

    var rawBody = Stats.instanceData(Env);
    Env.Log.info("QUOTA_UPDATE", rawBody);
    var body = JSON.stringify(rawBody);

    var options = {
        host: undefined,
        path: '/api/getquota',
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body)
        }
    };

    var H = Https;
    if (typeof(Env.accounts_api) === 'string') {
        try {
            let url = new URL(Env.accounts_api);
            if (!['https:', 'http:'].includes(url.protocol)) { throw new Error("INVALID_PROTOCOL"); }
            if (url.protocol === 'http:') { H = Http; }
            let port = Number(url.port);
            if (port && typeof(port) === 'number') { options.port = port; }
            options.host = url.hostname;
            Env.Log.info("USING_CUSTOM_ACCOUNTS_API", {
                value: Env.accounts_api,
            });
        } catch (err) {
            Env.Log.error("INVALID_CUSTOM_QUOTA_API", {
                error: err.message,
                value: Env.accounts_api,
            });
        }
    }

    var req = H.request(options, function (response) {
        if (!('' + response.statusCode).match(/^2\d\d$/)) {
            return void cb('SERVER ERROR ' + response.statusCode);
        }
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            try {
                var json = JSON.parse(str);
                // don't overwrite the limits with junk data
                if (json && json.message === 'EINVAL') { return void done(); }
                done(void 0, json);
            } catch (e) {
                done(e);
            }
        });
    });

    req.on('error', function (e) {
        Quota.applyCustomLimits(Env);
        done(e);
    });

    req.end(body);
};
Quota.queryQuotaServer = function (Env, cb) {
    Env.batchAccountQuery('', cb, function (done) {
        queryQuotaServer(Env, done);
    });
};
Quota.updateCachedLimits = function (Env, _cb) {
    var cb = Util.mkAsync(_cb);

    Quota.applyCustomLimits(Env);

    if (!Env.allowSubscriptions || !Env.accounts_api) { return void cb(); }
    Quota.queryQuotaServer(Env, function (err, json) {
        if (err) { return void cb(err); }
        if (!json) { return void cb(); }

        for (var k in json) {
            if (k.length === 44 && json[k]) {
                json[k].origin = 'remote';
            }
        }

        Env.limits = json;

        Quota.applyCustomLimits(Env);
        cb();
    });
};

// The limits object contains storage limits for all the publicKey that have paid
// To each key is associated an object containing the 'limit' value and a 'note' explaining that limit
Quota.getUpdatedLimit = function (Env, safeKey, cb) {
    Quota.updateCachedLimits(Env, function (err) {
        if (err) { return void cb(err); }

        var limit = Env.limits[safeKey];

        if (limit && typeof(limit.limit) === 'number') {
            return void cb(void 0, [limit.limit, limit.plan, limit.note]);
        }

        return void cb(void 0, [Env.defaultStorageLimit, '', '']);
    });
};

