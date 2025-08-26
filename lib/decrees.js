// SPDX-FileCopyrightText: 2025 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const Core = require("./commands/core");
const DecreesCore = require("./decrees-core");
const config = require('./load-config');

const Quota = require("./commands/quota");
const Keys = require("./keys");

const DECREE_NAME = 'decree.ndjson';

const {
    args_isBoolean,
    args_isString,
    args_isInteger,
    args_isPositiveInteger
} = DecreesCore.Utils;

// Toggles a simple boolean
const makeBooleanSetter = function (attr) {
    return function (Env, args) {
        if (!args_isBoolean(args)) {
            throw new Error('INVALID_ARGS');
        }
        var bool = args[0];
        if (bool === Env[attr]) { return false; }
        Env[attr] = bool;
        return true;
    };
};

const default_validator = function () { return true; };
const makeGenericSetter = function (attr, validator) {
    validator = validator || default_validator;
    return function (Env, args) {
        if (!validator(args)) {
            throw new Error("INVALID_ARGS");
        }
        var value = args[0];
        if (value === Env[attr]) { return false; }
        Env[attr] = value;
        return true;
    };
};

const makeIntegerSetter = function (attr) {
    return makeGenericSetter(attr, args_isInteger);
};

const makeTranslation = function (attr) {
    return function (Env, args) {
        if (!Array.isArray(args)) { throw new Error("INVALID_ARGS"); }
        var value = args[0];
        var state = Env[attr];

        if (typeof(value) === 'string') {
            if (state.default === value) { return false; }
            state.default = value;
            return true;
        }
        if (value && typeof(value) === 'object') {
            var changed = false;
            Object.keys(value).forEach(function (lang) {
                if (state[lang] === value[lang]) { return; }
                state[lang] = value[lang];
                changed = true;
            });
            return changed;
        }
        return false;
    };
};

/*  commands have a simple API:

* they receive the global Env and the arguments to be applied
* if the arguments are invalid the operation will not be applied
  * the command throws
* if the arguments are valid but do not result in a change, the operation is redundant.
  * return false
* if the arguments are valid and will result in a change, the operation should be applied
  * apply it
  * return true to indicate that it was applied

*/
const commands = {};

/*  Admin decrees which modify global server state

IMPLEMENTED:

RESTRICT_REGISTRATION(<boolean>)
RESTRICT_SSO_REGISTRATION(<boolean>)
UPDATE_DEFAULT_STORAGE(<number>)

// QUOTA MANAGEMENT
SET_QUOTA(<string:signkey>, limit)
RM_QUOTA(<string:signkey>)

// INACTIVITY
SET_INACTIVE_TIME
SET_ACCOUNT_RETENTION_TIME
SET_ARCHIVE_RETENTION_TIME

// UPLOADS
SET_MAX_UPLOAD_SIZE
SET_PREMIUM_UPLOAD_SIZE

// BACKGROUND PROCESSES
DISABLE_INTEGRATED_TASKS
DISABLE_INTEGRATED_EVICTION
ENABLE_PROFILING
SET_PROFILING_WINDOW

// BROADCAST
SET_LAST_BROADCAST_HASH
SET_SURVEY_URL
SET_MAINTENANCE

// EASIER CONFIG
SET_ADMIN_EMAIL
SET_SUPPORT_MAILBOX
SET_SUPPORT_KEYS

// COMMUNITY PARTICIPATION AND GOVERNANCE
CONSENT_TO_CONTACT
LIST_MY_INSTANCE
PROVIDE_AGGREGATE_STATISTICS
REMOVE_DONATE_BUTTON
BLOCK_DAILY_CHECK

// Customized instance info
SET_INSTANCE_JURISDICTION
SET_INSTANCE_DESCRIPTION
SET_INSTANCE_NAME
SET_INSTANCE_NOTICE

// bearer secret
SET_BEARER_SECRET

NOT IMPLEMENTED:

// RESTRICTED REGISTRATION
ADD_INVITE
REVOKE_INVITE
REDEEM_INVITE

DISABLE_EMBEDDING

// 2.0
Env.DEV_MODE || Env.FRESH_MODE,

ADD_ADMIN_KEY
RM_ADMIN_KEY

*/

// Maintenance: Empty string or an object with a start and end time
const isNumber = function (value) {
    return typeof(value) === "number" && !isNaN(value);
};
const args_isMaintenance = function (args) {
    return Array.isArray(args) && args[0] &&
        (args[0] === "" || (isNumber(args[0].end) && isNumber(args[0].start)));
};

// we anticipate that we'll add language-specific surveys in the future
// whenever that happens we can relax validation a bit to support more formats
const makeBroadcastSetter = function (attr, validation) {
    return function (Env, args) {
        if ((validation && !validation(args)) && !args_isString(args)) {
            throw new Error('INVALID_ARGS');
        }
        var str = args[0];
        if (str === Env[attr]) { return false; }
        Env[attr] = str;
        Env.broadcastCache = {};
        return true;
    };
};

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['DISABLE_EMBEDDING', [true]]], console.log)
commands.ENABLE_EMBEDDING = makeBooleanSetter('enableEmbedding');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['ENFORCE_MFA', [true]]], console.log)
commands.ENFORCE_MFA = makeBooleanSetter('enforceMFA');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['RESTRICT_REGISTRATION', [true]]], console.log)
commands.RESTRICT_REGISTRATION = makeBooleanSetter('restrictRegistration');
commands.RESTRICT_SSO_REGISTRATION = makeBooleanSetter('restrictSsoRegistration');
commands.DISABLE_STORE_INVITED_USERS = makeBooleanSetter('dontStoreInvitedUsers');
commands.DISABLE_STORE_SSO_USERS = makeBooleanSetter('dontStoreSSOUsers');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['DISABLE_INTEGRATED_EVICTION', [true]]], console.log)
commands.DISABLE_INTEGRATED_EVICTION = makeBooleanSetter('disableIntegratedEviction');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['DISABLE_INTEGRATED_TASKS', [true]]], console.log)
commands.DISABLE_INTEGRATED_TASKS = makeBooleanSetter('disableIntegratedTasks');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['CONSENT_TO_CONTACT', [true]]], console.log)
commands.CONSENT_TO_CONTACT = makeBooleanSetter('consentToContact');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['LIST_MY_INSTANCE', [true]]], console.log)
commands.LIST_MY_INSTANCE = makeBooleanSetter('listMyInstance');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['PROVIDE_AGGREGATE_STATISTICS', [true]]], console.log)
commands.PROVIDE_AGGREGATE_STATISTICS = makeBooleanSetter('provideAggregateStatistics');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['REMOVE_DONATE_BUTTON', [true]]], console.log)
commands.REMOVE_DONATE_BUTTON = makeBooleanSetter('removeDonateButton');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['BLOCK_DAILY_CHECK', [true]]], console.log)
commands.BLOCK_DAILY_CHECK = makeBooleanSetter('blockDailyCheck');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_LOGO_MIME', ['image/png']]], console.log)
commands.SET_LOGO_MIME = makeGenericSetter('logoMimeType', args_isString);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ACCENT_COLOR', ['#ff0073']]], console.log)
commands.SET_ACCENT_COLOR = makeGenericSetter('accentColor', args_isString);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['ENABLE_PROFILING', [true]]], console.log)
commands.ENABLE_PROFILING = makeBooleanSetter('enableProfiling');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_PROFILING_WINDOW', [10000]]], console.log)
commands.SET_PROFILING_WINDOW = makeGenericSetter('profilingWindow', args_isPositiveInteger);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_MAX_UPLOAD_SIZE', [50 * 1024 * 1024]]], console.log)
commands.SET_MAX_UPLOAD_SIZE = makeIntegerSetter('maxUploadSize');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_PREMIUM_UPLOAD_SIZE', [150 * 1024 * 1024]]], console.log)
commands.SET_PREMIUM_UPLOAD_SIZE = makeIntegerSetter('premiumUploadSize');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['UPDATE_DEFAULT_STORAGE', [100 * 1024 * 1024]]], console.log)
commands.UPDATE_DEFAULT_STORAGE = makeIntegerSetter('defaultStorageLimit');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INACTIVE_TIME', [90]]], console.log)
commands.SET_INACTIVE_TIME = makeIntegerSetter('inactiveTime');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ARCHIVE_RETENTION_TIME', [30]]], console.log)
commands.SET_ARCHIVE_RETENTION_TIME = makeIntegerSetter('archiveRetentionTime');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ACCOUNT_RETENTION_TIME', [365]]], console.log)
commands.SET_ACCOUNT_RETENTION_TIME = makeIntegerSetter('accountRetentionTime');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_ADMIN_EMAIL', ['admin@website.tld']]], console.log)
commands.SET_ADMIN_EMAIL = makeGenericSetter('adminEmail', args_isString);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_SUPPORT_MAILBOX', ["Tdz6+fE9N9XXBY93rW5qeNa/k27yd40c0vq7EJyt7jA="]]], console.log)
commands.SET_SUPPORT_MAILBOX = makeGenericSetter('supportMailbox', function (args) {
    return args_isString(args) && Core.isValidPublicKey(args[0]);
});
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_SUPPORT_KEYS', ["Tdz6+fE9N9XXBY93rW5qeNa/k27yd40c0vq7EJyt7jA=", "Tdz6+fE9N9XXBY93rW5qeNa/k27yd40c0vq7EJyt7jA="]]], console.log)


commands.DISABLE_APPS = function (Env, args) {
    if (!Array.isArray(args)) { throw new Error("INVALID_ARGS"); }
    if (JSON.stringify(args) === JSON.stringify(Env.appsToDisable)) { return false; }
    Env.appsToDisable = args;
    return true;
};

commands.SET_SUPPORT_KEYS = function (Env, args) {
    const curvePublic = args[0]; // Support mailbox key
    const edPublic = args[1]; // Support pin log
    const kemPublic = args[2]; // Support KEM key
    let validated = typeof(curvePublic) === "string" &&
                    (Core.isValidPublicKey(curvePublic) || !curvePublic) &&
                    typeof(edPublic) === "string" &&
                    (Core.isValidPublicKey(edPublic) || !edPublic);
    if (!validated) { throw new Error('INVALID_ARGS'); }
    if (Env.supportMailboxKey === curvePublic && Env.supportPinKey === edPublic && Env.supportMailboxKemKey === kemPublic) { return false; }
    Env.supportMailboxKey = curvePublic;
    Env.supportPinKey = edPublic;
    Env.supportMailboxKemKey = kemPublic;
    return true;
    };

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_PURPOSE', ["development"]]], console.log)
commands.SET_INSTANCE_PURPOSE = makeGenericSetter('instancePurpose', args_isString);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_JURISDICTION', ['France']]], console.log)
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_JURISDICTION', [{default:'France',de:'Frankreich'}]]], console.log)
commands.SET_INSTANCE_JURISDICTION = makeTranslation('instanceJurisdiction');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_NAME', ['My Personal CryptPad']]], console.log)
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_NAME', [{default:'My Personal CryptPad', fr: "Mon CryptPad personnel"}]]], console.log)
commands.SET_INSTANCE_NAME = makeTranslation('instanceName');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_DESCRIPTION', ['A personal instance, hosted for me and nobody else']]], console.log)
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_DESCRIPTION', [{default:'A personal server, not intended for public usage', fr: 'Un serveur personnel, non destiné à un usage public'}]]], console.log)
commands.SET_INSTANCE_DESCRIPTION = makeTranslation('instanceDescription');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_NOTICE', ['Our hosting costs have increased during the pandemic. Please consider donating!']]], console.log)
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_INSTANCE_NOTICE', [{default:'Our hosting costs have increased during the pandemic. Please consider donating!',fr:'Nos coûts d'hébergement ont augmenté pendant la pandémie. Veuillez envisager de faire un don !']]], console.log)
commands.SET_INSTANCE_NOTICE = makeTranslation('instanceNotice');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_LAST_BROADCAST_HASH', [hash]]], console.log)
commands.SET_LAST_BROADCAST_HASH = makeBroadcastSetter('lastBroadcastHash');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_SURVEY_URL', [url]]], console.log)
commands.SET_SURVEY_URL = makeBroadcastSetter('surveyURL');

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_MAINTENANCE', [{start: +Date, end: +Date}]]], console.log)
// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_MAINTENANCE', [""]]], console.log)
commands.SET_MAINTENANCE = makeBroadcastSetter('maintenance', args_isMaintenance);

// CryptPad_AsyncStore.rpc.send('ADMIN', [ 'ADMIN_DECREE', ['SET_QUOTA', ['[user@box:3000/VzeS4vP1DF+tXGuq1i50DKYuBL+09Yqy8kGxoUKRzhA=]', { limit: 2 * 1024 * 1024 * 1024, plan: 'buddy', note: "you're welcome" } ] ] ], console.log)
commands.SET_QUOTA = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 2) {
        throw new Error("INVALID_ARGS");
    }

    var unsafeKey = Keys.canonicalize(args[0]);
    if (!unsafeKey) {
        throw new Error("INVALID_ARGS");
    }

    // make sure you're not overwriting an existing limit
    //if (Env.customLimits[unsafeKey]) { throw new Error("EEXISTS"); }

    var limit = args[1];
    if (!Quota.isValidLimit(limit)) { // do we really want this?
        throw new Error("INVALID_ARGS");
    }

    limit.origin = 'decree';
    // map the new limit to the user's unsafeKey
    Env.customLimits[unsafeKey] = limit;
    Env.limits[unsafeKey] = limit;

    return true;
};

commands.RM_QUOTA = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 1) {
        throw new Error("INVALID_ARGS");
    }

    var unsafeKey = Keys.canonicalize(args[0]);
    if (!unsafeKey) {
        throw new Error("INVALID_ARGS");
    }
    if (!Env.customLimits[unsafeKey]) {
        throw new Error("ENOENT");
    }

    delete Env.customLimits[unsafeKey];
    delete Env.limits[unsafeKey];
    return true;
};

commands.ADD_INSTALL_TOKEN = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 1 || !args[0]) {
        throw new Error("INVALID_ARGS");
    }

    var token = args[0];

    Env.installToken = token;

    return true;
};
commands.ADD_ADMIN_KEY = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 1 || !args[0]) {
        throw new Error("INVALID_ARGS");
    }

    Env.admins = Env.admins || [];

    var key = Keys.canonicalize(args[0]);
    if (!key) { throw new Error("INVALID_KEY"); }

    if (Env.admins.includes(key)) { // Nothing to change
        return false;
    }

    Env.admins.push(key);
    Env.adminsData.push(args[0]);
    return true;
};
commands.RM_ADMIN_KEY = function (Env, args) {
    if (!Array.isArray(args) || args.length !== 1 || !args[0]) {
        throw new Error("INVALID_ARGS");
    }

    const key = Keys.canonicalize(args[0]);
    if (!key) { throw new Error("INVALID_KEY"); }

    Env.admins = Env.admins || [];
    if (!Env.admins.includes(key)) { // Nothing to change
        return false;
    }

    // NOTE prevent removing config.js hardcoded admin keys
    if (Array.isArray(config?.adminKeys) && config.adminKeys.includes(key)) {
        throw new Error("CANT_REMOVE_CONFIG");
    }

    let idx = Env.admins.indexOf(key);
    if (idx < 0) { return false; } // should never happen

    if (Env.admins.length === 1) { throw new Error("CANT_REMOVE_LAST_ADMIN"); }
    Env.admins.splice(idx, 1);
    Env.adminsData = Env.adminsData.filter(str => {
        const ed = Keys.canonicalize(str);
        if (!ed) { return true; }
        return ed !== key;
    });
    return true;
};

commands.PROOFS_MIGRATED = function (Env, args) {
    if (args !== 1) {
        throw new Error("INVALID_ARGS");
    }
    Env.proofsMigrated = true;
    return true;
};

commands.SET_BEARER_SECRET = function (Env, args) {
    if (!args_isString(args) || args.length !== 1 || !args[0]) {
        throw new Error("INVALID_ARGS");
    }

    var secret = args[0];
    if (secret === Env.bearerSecret) { return false; }
    Env.bearerSecret = secret;
    return true;
};


module.exports = DecreesCore.create(DECREE_NAME, commands);

