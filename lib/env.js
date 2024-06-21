// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const { existsSync, readdirSync }  = require('node:fs');

const Crypto = require('crypto');
const WriteQueue = require("./write-queue");
const BatchRead = require("./batch-read");

const Keys = require("./keys");
const Core = require("./commands/core");

const Quota = require("./commands/quota");
const Util = require("./common-util");
const Package = require("../package.json");
const Default = require("./defaults");
const Path = require("path");

const plugins = require('./plugin-manager');

const Nacl = require("tweetnacl/nacl-fast");

var canonicalizeOrigin = function (s) {
    if (typeof(s) === 'undefined') { return; }
    return (s || '').trim().replace(/\/+$/, '');
};

var isValidPort = function (p) {
    return typeof(p) === 'number' && p < 65535;
};

var deriveSandboxOrigin = function (unsafe, port) {
    var url = new URL(unsafe);
    url.port = port;
    return url.origin;
};

var isRecentVersion = function () {
    var R = Default.recommendedVersion;
    var V = process.version;
    if (typeof(V) !== 'string') { return false; }
    var parts = V.replace(/^v/, '').split('.').map(Number);
    if (parts.length < 3) { return false; }
    if (!parts.every(n => typeof(n) === 'number' && !isNaN(n))) {
        return false;
    }
    if (parts[0] < R[0]) { return false; }
    if (parts[0] > R[0]) { return true; }

    // v16
    if (parts[1] < R[1]) { return false; }
    if (parts[1] > R[1]) { return true; }
    if (parts[2] >= R[2]) { return true; }

    return false;
};

const getInstalledOOVersions = function() {
    if (!existsSync('www/common/onlyoffice/dist')) {
        return [];
    }

    return readdirSync('www/common/onlyoffice/dist');
};

module.exports.create = function (config) {
    var httpUnsafeOrigin = canonicalizeOrigin(config.httpUnsafeOrigin);

    var httpSafeOrigin;
    var NO_SANDBOX = false;
    var httpSafePort;
    var httpPort = isValidPort(config.httpPort)? config.httpPort: 3000;

    if (typeof(config.httpSafeOrigin) !== 'string') {
        NO_SANDBOX = true;
        if (typeof(config.httpSafePort) !== 'number') { httpSafePort = httpPort + 1; }
        httpSafeOrigin = deriveSandboxOrigin(httpUnsafeOrigin, httpSafePort);
    } else {
        httpSafeOrigin = canonicalizeOrigin(config.httpSafeOrigin);
    }

    if (typeof(config.websocketPort) !== 'number') {
        config.websocketPort = 3003;
    }

    var permittedEmbedders = config.permittedEmbedders;
    if (typeof(permittedEmbedders) === 'string') {
        permittedEmbedders = permittedEmbedders.trim();
    }

    const curve = Nacl.box.keyPair();

    const Env = {
        plugins: plugins,
        logFeedback: Boolean(config.logFeedback),
        mainPages: config.mainPages || Default.mainPages(),

        protocol: new URL(httpUnsafeOrigin).protocol,

        fileHost: config.fileHost || undefined,
        NO_SANDBOX: NO_SANDBOX,
        httpSafePort: httpSafePort,
        websocketPort: config.websocketPort,

        accounts_api: config.accounts_api || undefined, // this simplifies integration with an accounts page

        shouldUpdateNode: !isRecentVersion(),

        version: Package.version,
        installMethod: config.installMethod || undefined,

        httpUnsafeOrigin: httpUnsafeOrigin,
        httpSafeOrigin: httpSafeOrigin,
        permittedEmbedders: typeof(permittedEmbedders) === 'string' && permittedEmbedders? permittedEmbedders: httpSafeOrigin,

        removeDonateButton: config.removeDonateButton,
        httpPort: isValidPort(config.httpPort)? config.httpPort: 3000,
        httpAddress: typeof(config.httpAddress) === 'string'? config.httpAddress: 'localhost',
        websocketPath: config.externalWebsocketURL,
        logIP: config.logIP,

        OFFLINE_MODE: false,
        FRESH_KEY: '',
        FRESH_MODE: true,
        DEV_MODE: false,
        configCache: {},
        broadcastCache: {},

        officeHeadersCache: undefined,
        standardHeadersCache: undefined,
        apiHeadersCache: undefined,

        flushCache: function () {
            Env.FRESH_KEY = +new Date();
            if (!(Env.DEV_MODE || Env.FRESH_MODE)) { Env.FRESH_MODE = true; }
            Env.cacheFlushed.fire();
            if (!Env.Log) { return; }
            Env.Log.info("UPDATING_FRESH_KEY", Env.FRESH_KEY);
        },

        Log: undefined,
        // store
        id: Crypto.randomBytes(8).toString('hex'),

        launchTime: +new Date(),

        enableProfiling: false,
        profilingWindow: 10000,
        bytesWritten: 0,

        inactiveTime: config.inactiveTime,
        archiveRetentionTime: config.archiveRetentionTime,
        accountRetentionTime: config.accountRetentionTime,

        adminEmail: config.adminEmail,
        supportMailbox: config.supportMailboxPublicKey,
        supportMailboxKey: undefined,

        metadata_cache: {},
        channel_cache: {},
        cache_checks: {},

        queueStorage: WriteQueue(),
        queueDeletes: WriteQueue(),
        queueValidation: WriteQueue(),
        queueMetadata: WriteQueue(),

        batchIndexReads: BatchRead("HK_GET_INDEX"),
        batchMetadata: BatchRead('GET_METADATA'),
        batchRegisteredUsers: BatchRead("GET_REGISTERED_USERS"),
        batchDiskUsage: BatchRead('GET_DISK_USAGE'),
        batchUserPins: BatchRead('LOAD_USER_PINS'),
        batchTotalSize: BatchRead('GET_TOTAL_SIZE'),
        batchAccountQuery: BatchRead("QUERY_ACCOUNT_SERVER"),

        intervals: {},
        maxUploadSize: config.maxUploadSize || (20 * 1024 * 1024),
        premiumUploadSize: false, // overridden below...
        Sessions: {},
        paths: {},
        //msgStore: config.store,

        // /api/broadcast
        lastBroadcastHash: '',
        surveyURL: undefined,
        maintenance: undefined,

        netfluxUsers: {},

        pinStore: undefined,

        limits: {},
        admins: [],
        installToken: undefined,
        WARN: function (e, output) { // TODO deprecate this
            if (!Env.Log) { return; }
            if (e && output) {
                Env.Log.warn(e, {
                    output: output,
                    message: String(e),
                    stack: new Error(e).stack,
                });
            }
        },

        // as of 4.14.0 you need to opt-in to remote embedding.
        enableEmbedding: false,

/*  FIXME restrictRegistration is initialized as false and then overridden by admin decree
    There is a narrow window in which someone could register before the server updates this value.
    See also the cached 'restrictRegistration' value in server.js#serveConfig
*/
        restrictRegistration: false,
        allowSubscriptions: config.allowSubscriptions === true,
        blockDailyCheck: config.blockDailyCheck === true,

        consentToContact: false,
        listMyInstance: false,
        provideAggregateStatistics: false,
        updateAvailable: undefined,

        instanceName: {},
        instanceDescription: {},
        instanceJurisdiction: {},
        instanceNotice: {},

        myDomain: config.myDomain,
        mySubdomain: config.mySubdomain, // only exists for the accounts integration
        customLimits: {},
        // FIXME this attribute isn't in the default conf
        // but it is referenced in Quota
        domain: config.domain,

        maxWorkers: undefined,
        disableIntegratedTasks: config.disableIntegratedTasks || false,
        disableIntegratedEviction: typeof(config.disableIntegratedEviction) === 'undefined'? true: config.disableIntegratedEviction,
        lastEviction: +new Date(),
        evictionReport: {},
        commandTimers: {},

        sso: config.sso,
        enforceMFA: config.enforceMFA,

        onlyOffice: {
            availableVersions: getInstalledOOVersions()
        },

        // initialized as undefined
        bearerSecret: void 0,
        curvePrivate: curve.secretKey,
        curvePublic: Nacl.util.encodeBase64(curve.publicKey),

        selfDestructTo: {},
    };

    (function () {
        var max = config.maxWorkers;
        // if the supplied value is not a positive number, leave maxWorkers undefined
        // one worker will be created for each CPU core
        if (typeof(max) !== 'number' || isNaN(max) || max < 1) { return; }
        Env.maxWorkers = max;
    }());

    (function () {
    // mode can be FRESH (default), DEV, or PACKAGE
        if (process.env.PACKAGE) {
        // `PACKAGE=1 node server` uses the version string from package.json as the cache string
            //console.log("PACKAGE MODE ENABLED");
            Env.FRESH_MODE = false;
            Env.DEV_MODE = false;
        } else if (process.env.DEV) {
        // `DEV=1 node server` will use a random cache string on every page reload
            //console.log("DEV MODE ENABLED");
            Env.FRESH_MODE = false;
            Env.DEV_MODE = true;
        } else {
        // `FRESH=1 node server` will set a random cache string when the server is launched
        // and use it for the process lifetime or until it is reset from the admin panel
            //console.log("FRESH MODE ENABLED");
            Env.FRESH_KEY = +new Date();
        }

        // Offline mode is mostly for development. It lets us test clientside cache and offline support
        if (process.env.OFFLINE) { Env.OFFLINE_MODE = true; }
    }());

    Env.checkCache = function (channel) {
        var f = Env.cache_checks[channel] || Util.throttle(function () {
            delete Env.cache_checks[channel];
            if (Env.channel_cache[channel]) { return; }
            delete Env.metadata_cache[channel];
        }, 30000);
        f();
    };

    (function () {
        var custom = config.customLimits;
        if (!custom) { return; }

        var stored = Env.customLimits;

        Object.keys(custom).forEach(function (k) {
            var unsafeKey = Keys.canonicalize(k);

            if (!unsafeKey) {
                console.log("INVALID_CUSTOM_LIMIT_ID", {
                    message: "A custom quota upgrade was provided via your config with an invalid identifier. It will be ignored.",
                    key: k,
                    value: custom[k],
                });
                return;
            }

            if (stored[unsafeKey]) {
                console.log("INVALID_CUSTOM_LIMIT_DUPLICATED", {
                    message: "A duplicated custom quota upgrade was provided via your config which would have overridden an existing value. It will be ignored.",
                    key: k,
                    value: custom[k],
                });
                return;
            }

            if (!Quota.isValidLimit(custom[k])) {
                console.log("INVALID_CUSTOM_LIMIT_VALUE", {
                    message: "A custom quota upgrade was provided via your config with an invalid value. It will be ignored.",
                    key: k,
                    value: custom[k],
                });
                return;
            }

            var limit = stored[unsafeKey] = Util.clone(custom[k]);
            limit.origin = 'config';
        });
    }());

    (function () {
        var pes = config.premiumUploadSize;
        if (!isNaN(pes) && pes >= Env.maxUploadSize) {
            Env.premiumUploadSize = pes;
        }
    }());

    var paths = Env.paths;

    var keyOrDefaultString = function (key, def) {
        return Path.resolve(typeof(config[key]) === 'string'? config[key]: def);
    };

    Env.incrementBytesWritten = function (n) {
        if (!Env.enableProfiling) { return; }
        if (!n || typeof(n) !== 'number' || n < 0) { return; }
        Env.bytesWritten += n;
        setTimeout(function () {
            Env.bytesWritten -= n;
        }, Env.profilingWindow);
    };

    paths.pin = keyOrDefaultString('pinPath', './pins');
    paths.block = keyOrDefaultString('blockPath', './block');
    paths.data = keyOrDefaultString('filePath', './datastore');
    paths.staging = keyOrDefaultString('blobStagingPath', './blobstage');
    paths.blob = keyOrDefaultString('blobPath', './blob');
    paths.decree = keyOrDefaultString('decreePath', './data/');
    paths.base = keyOrDefaultString('base', './data');
    paths.archive = keyOrDefaultString('archivePath', './data/archive');
    paths.task = keyOrDefaultString('taskPath', './tasks');

    Env.defaultStorageLimit = typeof(config.defaultStorageLimit) === 'number' && config.defaultStorageLimit >= 0?
        config.defaultStorageLimit:
        Core.DEFAULT_LIMIT;

    try {
        Env.admins = (config.adminKeys || []).map(function (k) {
            try {
                return Keys.canonicalize(k);
            } catch (err) {
                return;
            }
        }).filter(Boolean);
    } catch (e) {
        console.error("Can't parse admin keys. Please update or fix your config.js file!");
    }

    try {
        let moderators = require('./commands/moderators').getKeysSync(Env);
        Env.moderators = moderators.map(safeKey => {
            return Util.unescapeKeyCharacters(safeKey);
        }) || [];
    } catch (e) {
        console.log(e);
        console.error("Can't parse support keys.");
    }

    Env.envUpdated = Util.mkEvent();
    Env.cacheFlushed = Util.mkEvent();

    return Env;
};

// don't serialize these things
const BAD = [
    'Log',
    'envUpdated',
    'cacheFlushed',
    'evictionReports',
    'commandTimers',
    'metadata_cache',
    'channel_cache',
    'cache_checks',
    'intervals',
    'Sessions',
    'netfluxUsers',
    'limits',
    'customLimits',
    'scheduleDecree',

    'httpServer',

    'pinStore',
    'msgStore',
    'store',
    'blobStore',
];

module.exports.serialize = function (Env) {
    return JSON.stringify(Env, function (key, value) {
        if (value === Env) { return value; }
        if (BAD.includes(key)) { return; }

        if (typeof(value) === 'function') { return; }
        //console.log('serializing', { key, value, });
        if (Util.isCircular(value)) { return; }
        return value;
    });
};
