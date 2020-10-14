/*jshint esversion: 6 */
/* globals Buffer*/
const Quota = module.exports;

//const Util = require("../common-util");
const Keys = require("../keys");
const Package = require('../../package.json');
const Https = require("https");
const Util = require("../common-util");

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

/*
Env = {
    myDomain,
    mySubdomain,
    adminEmail,
    Package.version,

};
*/
var queryAccountServer = function (Env, cb) {
    var done = Util.once(Util.mkAsync(cb));

    var body = JSON.stringify({
        domain: Env.myDomain,
        subdomain: Env.mySubdomain || null,
        adminEmail: Env.adminEmail,
        version: Package.version
    });
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
                // don't overwrite the limits with junk data
                if (json && json.message === 'EINVAL') { return void cb(); }
                done(void 0, json);
            } catch (e) {
                done(e);
            }
        });
    });

    req.on('error', function (e) {
        Quota.applyCustomLimits(Env);
        if (!Env.myDomain) { return done(); }
        // only return an error if your server allows subscriptions
        done(e);
    });

    req.end(body);
};

Quota.queryAccountServer = function (Env, cb) {
    Env.batchAccountQuery('', cb, function (done) {
        queryAccountServer(Env, done);
    });
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

Quota.updateCachedLimits = function (Env, _cb) {
    var cb = Util.mkAsync(_cb);

    Quota.applyCustomLimits(Env);

    if (!Quota.shouldContactServer(Env)) { return void cb(); }
    Quota.queryAccountServer(Env, function (err, json) {
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

