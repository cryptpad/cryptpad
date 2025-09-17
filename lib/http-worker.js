// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

const process = require("node:process");
const Http = require("node:http");
const Default = require("./defaults");
const Path = require("node:path");
const Fs = require("node:fs");
const nThen = require("nthen");
const Util = require("./common-util");
const Logger = require("./log");
const AuthCommands = require("./http-commands");
const MFA = require("./storage/mfa");
const Sessions = require("./storage/sessions");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const BlobStore = require("./storage/blob");
const BlockStore = require("./storage/block");
const plugins = require("./plugin-manager");
const gzipStatic = require('connect-gzip-static');
const CPCrypto = require('./crypto');

const DEFAULT_QUERY_TIMEOUT = 5000;
const PID = process.pid;

let SSOUtils = plugins.SSO && plugins.SSO.utils;

var Env = JSON.parse(process.env.Env);
let blobStore;
let cpcrypto;
Env.plugins = plugins;
const response = Util.response(function (errLabel, info) {
    if (!Env.Log) { return; }
    Env.Log.error(errLabel, info);
});

const guid = () => {
    return Util.guid(response._pending);
};

const sendMessage = Env.sendMessage = (msg, cb, opt) => {
    var txid = guid();
    var timeout = (opt && opt.timeout) || DEFAULT_QUERY_TIMEOUT;
    var obj = {
        pid: PID,
        txid: txid,
        content: msg,
    };
    response.expect(txid, cb, timeout);
    process.send(obj);
};
const Log = {};
Logger.levels.forEach(level => {
    Log[level] = function (tag, info) {
        sendMessage({
            command: 'LOG',
            level: level,
            tag: tag,
            info: info,
        }, (err) => {
            if (err) {
                return void console.error(new Error(err));
            }
        });
    };
});
Env.Log = Log;
Env.incrementBytesWritten = function () {};

const EVENTS = {};

EVENTS.ENV_UPDATE = function (data /*, cb */) {
    try {
        Env = JSON.parse(data);
        Env.blobStore = blobStore;
        Env.Log = Log;
        Env.plugins = plugins;
        Env.sendMessage = sendMessage;
        Env.incrementBytesWritten = function () {};
    } catch (err) {
        Log.error('HTTP_WORKER_ENV_UPDATE', Util.serializeError(err));
    }
};

EVENTS.FLUSH_CACHE = function (data) {
    if (typeof(data) !== 'number') {
        return Log.error('INVALID_FRESH_KEY', data);
    }

    Env.FRESH_KEY = data;
    [ 'configCache', 'broadcastCache', ].forEach(key => {
        Env[key] = {};
    });
    [ 'officeHeadersCache', 'standardHeadersCache', 'apiHeadersCache', ].forEach(key => {
        Env[key] = undefined;
    });
};

Object.keys(plugins || {}).forEach(name => {
    let plugin = plugins[name];
    if (!plugin.addHttpEvents) { return; }
    try {
        let events = plugin.addHttpEvents(Env);
        Object.keys(events || {}).forEach(cmd => {
            // Uppercase event name?
            if (cmd !== cmd.toUpperCase()) { return; }
            // Event is a function?
            if (typeof(events[cmd]) !== "function") { return; }
            // Event doesn't already exists?
            if (EVENTS[cmd]) { return; }
            EVENTS[cmd] = events[cmd];
        });
    } catch (e) {}
});

process.on('message', msg => {
    if (!(msg && msg.txid)) { return; }
    if (msg.type === 'REPLY') {
        var txid = msg.txid;
        return void response.handle(txid, [msg.error, msg.value]);
    } else if (msg.type === 'EVENT') {
        // response to event...
        // ie. Update Env, flush cache, etc.
        var ev = EVENTS[msg.command];
        if (typeof(ev) === 'function') {
            return void ev(msg.data, () => {});
        }
    }
    //console.error("UNHANDLED_MESSAGE", msg);
});


var applyHeaderMap = function (res, map) {
    for (let header in map) {
        if (typeof(map[header]) === 'string') { res.setHeader(header, map[header]); }
    }
};

var EXEMPT = [
    /^\/common\/onlyoffice\/.*\.html.*/,
    /^\/common\/onlyoffice\/dist\/.*\/sdkjs\/common\/spell\/spell\/spell.js.*/,  // OnlyOffice loads spell.wasm in a way that needs unsave-eval
    /^\/(sheet|presentation|doc)\/inner\.html.*/,
    /^\/unsafeiframe\/inner\.html.*$/,
];

var cacheHeaders = function (Env, key, headers) {
    if (Env.DEV_MODE) { return; }
    Env[key] = headers;
};

var getHeaders = function (Env, type) {
    var key = type + 'HeadersCache';
    if (Env[key]) { return Util.clone(Env[key]); }

    var headers = Default.httpHeaders(Env);

    var csp;
    if (type === 'office') {
        csp = Default.padContentSecurity(Env);
    } else {
        csp = Default.contentSecurity(Env);
    }
    headers['Content-Security-Policy'] = csp;
    headers["Cross-Origin-Resource-Policy"] = 'cross-origin';
    headers["Cross-Origin-Embedder-Policy"] = 'require-corp';
    cacheHeaders(Env, key, headers);

    // Don't set CSP headers on /api/ endpoints
    // because they aren't necessary and they cause problems
    // when duplicated by NGINX in production environments
    if (type === 'api') { delete headers['Content-Security-Policy']; }

    return Util.clone(headers);
};

var setHeaders = function (req, res) {
    var type;
    if (EXEMPT.some(regex => regex.test(req.url))) {
        type = 'office';
    } else if (/^\/api\/(broadcast|config)/.test(req.url)) {
        type = 'api';
    } else {
        type = 'standard';
    }

    var h = getHeaders(Env, type);

    // Allow main domain to load resources from the sandbox URL
    if (!Env.enableEmbedding && req.get('origin') === Env.httpUnsafeOrigin &&
        /^\/common\/onlyoffice\/dist\/.*\/fonts\/.*/.test(req.url)) {
        h['Access-Control-Allow-Origin'] = Env.httpUnsafeOrigin;
    }

    applyHeaderMap(res, h);
};

const Express = require("express");
Express.static.mime.define({'application/wasm': ['wasm']});
var app = Express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

(function () {
if (!Env.logFeedback) { return; }

const logFeedback = function (url) {
    url.replace(/\?(.*?)=/, function (all, fb) {
        Log.feedback(fb, '');
    });
};

app.head(/^\/common\/feedback\.html/, function (req, res, next) {
    logFeedback(req.url);
    next();
});
}());

const { createProxyMiddleware } = require("http-proxy-middleware");

var httpAddress = Env.httpAddress === '::' ? 'localhost' : Env.httpAddress;
var proxyTarget = new URL('', `ws:${httpAddress}`);
proxyTarget.port = Env.websocketPort;

const wsProxy = createProxyMiddleware({
    target: proxyTarget.href,
    ws: true,
    logLevel: 'error',
    onProxyReqWs: function (proxyReq, req) {
        proxyReq.setHeader('X-Real-Ip', req.socket.remoteAddress);
    },
    logProvider: (p) => {
        p.error = (data) => {
            if (/ECONNRESET/.test(data)) { return; }
            Env.Log.error('HTTP_PROXY_MIDDLEWARE', data);
        };
        return p;
    }
});

app.use('/cryptpad_websocket', wsProxy);

app.use('/ssoauth', (req, res, next) => {
    if (SSOUtils && req && req.body && req.body.SAMLResponse) {
        req.method = 'GET';

        let token = Util.uid();
        let smres = req.body.SAMLResponse;
        return SSOUtils.writeRequest(Env, {
            id: token,
            type: 'saml',
            content: smres
        }, (err) => {
            if (err) {
                Log.error('E_SSO_WRITE_REQ', err);
                return res.sendStatus(500);
            }
            let value = `samltoken="${token}"; SameSite=Strict; HttpOnly`;
            res.setHeader('Set-Cookie', value);
            next();
        });

    }
    next();
});

app.use('/blob', function (req, res, next) {
/*  Head requests are used to check the size of a blob.
    Clients can configure a maximum size to download automatically,
    and can manually click to download blobs which exceed that limit.  */
    const url = req.url;
    if (typeof(url) === "string" && Env.blobStore) {
        const s = url.split('/');
        if (s[1] && s[1].length === 2 && s[2] && s[2].length === Env.blobStore.BLOB_LENGTH) {
            Env.blobStore.updateActivity(s[2], () => {});
        }
    }
    if (req.method === 'HEAD') {
        Express.static(Path.resolve(Env.paths.blob), {
            setHeaders: function (res /*, path, stat */) {
                res.set('Access-Control-Allow-Origin', Env.enableEmbedding? '*': Env.permittedEmbedders);
                res.set('Access-Control-Allow-Headers', 'Content-Length');
                res.set('Access-Control-Expose-Headers', 'Content-Length');
            }
        })(req, res, next);
        return;
    }

/*  Some GET requests concern the whole file,
    others only target ranges, either:

    1. a two octet prefix which encodes the length of the metadata in octets
    2. the metadata itself, excluding the two preceding octets
*/

/*
    // Example code to demonstrate the types of requests which are handled
    if (req.method === 'GET') {
        if (!req.headers.range) {
            // metadata
        } else {
            // full request
        }
    }
*/

    next();
});

app.use(function (req, res, next) {
/*  These are pre-flight requests, through which the client
    confirms with the server that it is permitted to make the
    actual requests which will follow */
    if (req.method === 'OPTIONS' && /\/blob\//.test(req.url)) {
        res.setHeader('Access-Control-Allow-Origin', Env.enableEmbedding? '*': Env.permittedEmbedders);
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin');
        res.setHeader('Access-Control-Max-Age', 1728000);
        res.setHeader('Content-Type', 'application/octet-stream; charset=utf-8');
        res.setHeader('Content-Length', 0);
        res.statusCode = 204;
        return void res.end();
    }

    setHeaders(req, res);
    if (/[\?\&]ver=[^\/]+$/.test(req.url)) { res.setHeader("Cache-Control", "max-age=31536000"); }
    else { res.setHeader("Cache-Control", "no-cache"); }
    next();
});

Object.keys(plugins || {}).forEach(name => {
    let plugin = plugins[name];
    if (!plugin.addHttpEndpoints) { return; }
    plugin.addHttpEndpoints(Env, app);
});


// serve custom app content from the customize directory
// useful for testing pages customized with opengraph data
app.use(Express.static(Path.resolve('./customize/www')));
app.use(gzipStatic(Path.resolve('./www')));

app.use("/common", Express.static('./src/common'));

var mainPages = Env.mainPages || Default.mainPages();
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static('./customize'));
app.get(mainPagePattern, Express.static('./customize.dist'));

app.use("/blob", Express.static(Path.resolve(Env.paths.blob), {
    maxAge: Env.DEV_MODE? "0d": "365d"
}));
app.use("/datastore",
    (req, res, next) => {
        if (req.method === 'HEAD') {
            next();
        } else {
            res.status(403).end();
        }
    },
    Express.static(Env.paths.data, {
        maxAge: "0d"
    }
));

app.use('/block/', function (req, res, next) {
    var parsed = Path.parse(req.url);
    var name = parsed.name;
    // block access control only applies to files
    // identified by base64-encoded public keys
    // skip everything else, ie. /block/placeholder.txt
    if (/placeholder\.txt(\?.+)?/.test(parsed.base)) {
        return void next();
    }
    if (typeof(name) !== 'string' || name.length !== 44) {
        return void res.status(404).json({
            error: "INVALID_ID",
        });
    }

    var authorization = req.headers.authorization;

    var mfa_params, sso_params;
    nThen(function (w) {
        // First, check whether the block id in question has any MFA settings stored
        MFA.read(Env, name, w(function (err, content) {
            // ENOENT means there are no settings configured
            // it could be a 404 or an existing block without MFA protection
            // in either case you can abort and fall through
            // allowing the static webserver to handle either case
            if (err && err.code === 'ENOENT') {
                return;
            }

            // we're not expecting other errors. the sensible thing is to fail
            // closed - meaning assume some protection is in place but that
            // the settings couldn't be loaded for some reason. block access
            // to the resource, logging for the admin and responding to the client
            // with a vague error code
            if (err) {
                Log.error('GET_BLOCK_METADATA', err);
                return void res.status(500).json({
                    code: 500,
                    error: "UNEXPECTED_ERROR",
                });
            }

            // Otherwise, some settings were loaded correctly.
            // We're expecting stringified JSON, so try to parse it.
            // Log and respond with an error again if this fails.
            // If it parses successfully then fall through to the next block.
            try {
                mfa_params = JSON.parse(content);
            } catch (err2) {
                w.abort();
                Log.error("INVALID_BLOCK_METADATA", err2);
                return res.status(500).json({
                    code: 500,
                    error: "UNEXPECTED_ERROR",
                });
            }
        }));

        // Same for SSO settings
        if (!SSOUtils) { return; }
        SSOUtils.readBlock(Env, name, w(function (err, content) {
            if (err && (err.code === 'ENOENT' || err === 'ENOENT')) {
                return;
            }
            if (err) {
                Log.error('GET_BLOCK_METADATA', err);
                return void res.status(500).json({
                    code: 500,
                    error: "UNEXPECTED_ERROR",
                });
            }
            sso_params = content;
        }));
    }).nThen(function (w) {
        if (!mfa_params && !sso_params) {
            w.abort();
            next();
        }
    }).nThen(function (w) {
        // We should only be able to reach this logic
        // if we successfully loaded and parsed some JSON
        // representing the user's MFA and/or SSO settings.

        // Failures at this point relate to insufficient or incorrect authorization.
        // This function standardizes how we reject such requests.

        // So far the only additional factor which is supported is TOTP.
        // We specify what the method is to allow for future alternatives
        // and inform the client so they can determine how to respond
        // "401" means "Unauthorized"
        var no = function () {
            w.abort();
            res.status(401).json({
                sso: Boolean(sso_params),
                method: mfa_params && mfa_params.method,
                code: 401
            });
        };

        // if you are here it is because this block is protected by MFA or SSO.
        // they will need to provide a JSON Web Token, so we can reject them outright
        // if one is not present in their authorization header
        if (!authorization) { return void no(); }

        // The authorization header should be of the form
        // "Authorization: Bearer <SessionId>"
        // We can reject the request if it is malformed.
        let token = authorization.replace(/^Bearer\s+/, '').trim();
        if (!token) { return void no(); }

        Sessions.read(Env, name, token, function (err, contentStr) {
            if (err) {
                Log.error('SESSION_READ_ERROR', err);
                return res.status(401).json({
                    sso: Boolean(sso_params),
                    method: mfa_params && mfa_params.method,
                    code: 401,
                });
            }

            let content = Util.tryParse(contentStr);

            if (mfa_params && !content.mfa) { return void no(); }
            if (sso_params && !content.sso) { return void no(); }

            if (content.mfa && content.mfa.exp && (+new Date()) > content.mfa.exp) {
                Log.error("OTP_SESSION_EXPIRED", content.mfa);
                Sessions.delete(Env, name, token, function (err) {
                    if (err) {
                        Log.error('SESSION_DELETE_EXPIRED_ERROR', err);
                        return;
                    }
                    Log.info('SESSION_DELETE_EXPIRED', err);
                });
                return void no();
            }


            if (content.sso && content.sso.exp && (+new Date()) > content.sso.exp) {
                Log.error("SSO_SESSION_EXPIRED", content.sso);
                Sessions.delete(Env, name, token, function (err) {
                    if (err) {
                        Log.error('SSO_SESSION_DELETE_EXPIRED_ERROR', err);
                        return;
                    }
                    Log.info('SSO_SESSION_DELETE_EXPIRED', err);
                });
                return void no();
            }

            // Interpret the existence of a file in that location as the continued
            // validity of the session. Fall through and let the built-in webserver
            // handle the 404 or serving the file.
            next();
        });
    });
});

// TODO this would be a good place to update a block's atime
// in a manner independent of the filesystem. ie. for detecting and archiving
// inactive accounts in a way that will not be invalidated by other forms of access
// like filesystem backups.
app.use("/block", Express.static(Path.resolve(Env.paths.block), {
    maxAge: "0d",
}));
// In case of a 404 for the block, check if a placeholder exists
// and provide the result if that's the case
app.use("/block", (req, res, next) => {
    const url = req.url;
    if (typeof(url) === "string") {
        const s = url.split('/');
        if (s[1] && s[1].length === 2 && BlockStore.isValidKey(s[2])) {
            return BlockStore.readPlaceholder(Env, s[2], (content) => {
                res.status(404).json({
                    reason: content,
                    code: 404
                });
            });
        }
    }
    next();
});

app.use("/customize", Express.static('customize'));
app.use("/customize", Express.static('customize.dist'));
app.use("/customize.dist", Express.static('customize.dist'));
app.use(/^\/[^\/]*$/, Express.static('customize'));
app.use(/^\/[^\/]*$/, Express.static('customize.dist'));

// if dev mode: never cache
var cacheString = function () {
    return (Env.FRESH_KEY? '-' + Env.FRESH_KEY: '') + (Env.DEV_MODE? '-' + (+new Date()): '');
};

var makeRouteCache = function (template, cacheName) {
    var cleanUp = {};

    return function (req, res) {
        var cache = Env[cacheName] = Env[cacheName] || {};
        var host = req.headers.host.replace(/\:[0-9]+/, '');
        res.setHeader('Content-Type', 'text/javascript');
        // don't cache anything if you're in dev mode
        if (Env.DEV_MODE) {
            return void res.send(template(host));
        }
        // generate a lookup key for the cache
        var cacheKey = host + ':' + cacheString();

        // FIXME mutable
        // we must be able to clear the cache when updating any mutable key
        // if there's nothing cached for that key...
        if (!cache[cacheKey]) {
            // generate the response and cache it in memory
            cache[cacheKey] = template(host);
            // and create a function to conditionally evict cache entries
            // which have not been accessed in the last 20 seconds
            cleanUp[cacheKey] = Util.throttle(function () {
                delete cleanUp[cacheKey];
                delete cache[cacheKey];
            }, 20000);
        }

        // successive calls to this function
        if (typeof (cleanUp[cacheKey]) === "function") {
            cleanUp[cacheKey]();
        }
        return void res.send(cache[cacheKey]);
    };
};

var serveConfig = makeRouteCache(function () {
    // NOTE: we may extract JSON from this config using slice(27, -5)
    const ssoList = Env.sso && Env.sso.enabled && Array.isArray(Env.sso.list) &&
                    Env.sso.list.map(function (obj) { return obj.name; }) || [];
    const ssoCfg = (SSOUtils && ssoList.length) ? {
        force: (Env.sso && Env.sso.enforced && 1) || 0,
        password: (Env.sso && Env.sso.cpPassword && (Env.sso.forceCpPassword ? 2 : 1)) || 0,
        list: ssoList
    } : false;

    return [
        'define(function(){',
        'return ' + JSON.stringify({
            requireConf: {
                waitSeconds: 600,
                urlArgs: 'ver=' + Env.version + cacheString(),
            },
            removeDonateButton: (Env.removeDonateButton === true),
            accounts_api: Env.accounts_api,
            websocketPath: Env.websocketPath,
            httpUnsafeOrigin: Env.httpUnsafeOrigin,
            adminEmail: Env.adminEmail,
            adminKeys: Env.admins,
            moderatorKeys: Env.moderators,
            inactiveTime: Env.inactiveTime,
            supportMailbox: Env.supportMailbox,
            supportMailboxKey: Env.supportMailboxKey,
            defaultStorageLimit: Env.defaultStorageLimit,
            maxUploadSize: Env.maxUploadSize,
            premiumUploadSize: Env.premiumUploadSize,
            restrictRegistration: Env.restrictRegistration,
            appsToDisable: Env.appsToDisable,
            restrictSsoRegistration: Env.restrictSsoRegistration,
            httpSafeOrigin: Env.httpSafeOrigin,
            enableEmbedding: Env.enableEmbedding,
            fileHost: Env.fileHost,
            shouldUpdateNode: Env.shouldUpdateNode || undefined,
            listMyInstance: Env.listMyInstance,
            sso: ssoCfg,
            enforceMFA: Env.enforceMFA,
            onlyOffice: Env.onlyOffice
        }, null, '\t'),
        '});'
    ].join(';\n');
}, 'configCache');

var serveBroadcast = makeRouteCache(function () {
    var maintenance = Env.maintenance;
    if (maintenance && maintenance.end && maintenance.end < (+new Date())) {
        maintenance = undefined;
    }
    return [
        'define(function(){',
        'return ' + JSON.stringify({
            curvePublic: Env.curvePublic,
            lastBroadcastHash: Env.lastBroadcastHash,
            surveyURL: Env.surveyURL,
            maintenance: maintenance
        }, null, '\t'),
        '});'
    ].join(';\n');
}, 'broadcastCache');

app.get('/api/config', serveConfig);
app.get('/api/broadcast', serveBroadcast);

(function () {
let extensions = plugins._extensions;
let styles = plugins._styles;
let str = JSON.stringify(extensions);
let str2 = JSON.stringify(styles);
let js = `let extensions = ${str};
let styles = ${str2};
let lang = window.cryptpadLanguage;
let paths = [];
extensions.forEach(name => {
    paths.push(\`optional!/\${name}/extensions.js\`);
    paths.push(\`optional!json!/\${name}/translations/messages.json\`);
    const l = lang === "en" ? '' : \`\${lang}.\`;
    paths.push(\`optional!json!/\${name}/translations/messages.\${l}json\`);
});
styles.forEach(name => {
    paths.push(\`optional!less!/\${name}/style.less\`);
});
define(paths, function () {
    let args = Array.prototype.slice.apply(arguments);
    return args;
}, function () {
    // ignore missing files
});`;
app.get('/extensions.js', (req, res) => {
    res.setHeader('Content-Type', 'text/javascript');
    res.send(js);
});
})();

var Define = function (obj) {
    return `define(function (){
    return ${JSON.stringify(obj, null, '\t')};
});`;
};

app.get('/api/instance', function (req, res) {
    res.setHeader('Content-Type', 'text/javascript');
    res.send(Define({
        color: Env.accentColor,
        name: Env.instanceName,
        description: Env.instanceDescription,
        location: Env.instanceJurisdiction,
        notice: Env.instanceNotice,
    }));
});

var four04_path = Path.resolve('./customize.dist/404.html');
var fivehundred_path = Path.resolve('./customize.dist/500.html');
var custom_four04_path = Path.resolve('./customize/404.html');
var custom_fivehundred_path = Path.resolve('./customize/500.html');

var send404 = function (res, path) {
    if (!path && path !== four04_path) { path = four04_path; }
    Fs.exists(path, function (exists) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (exists) { return Fs.createReadStream(path).pipe(res); }
        send404(res);
    });
};
var send500 = function (res, path) {
    if (!path && path !== fivehundred_path) { path = fivehundred_path; }
    Fs.exists(path, function (exists) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (exists) { return Fs.createReadStream(path).pipe(res); }
        send500(res);
    });
};

app.get('/api/updatequota', function (req, res) {
    if (!Env.accounts_api) {
        res.status(404);
        return void send404(res);
    }
    sendMessage({
        command: 'UPDATE_QUOTA',
    }, (err) => {
        if (err) {
            res.status(500);
            return void send500(res);
        }
        res.send();
    });
});

app.get('/api/profiling', function (req, res) {
    if (!Env.enableProfiling) { return void send404(res); }
    sendMessage({
        command: 'GET_PROFILING_DATA',
    }, (err, value) => {
        if (err) {
            res.status(500);
            return void send500(res);
        }
        res.setHeader('Content-Type', 'text/javascript');
        res.send(JSON.stringify({
            bytesWritten: value,
        }));
    });
});

app.get('/api/logo', function (req, res) {
    let path = Path.resolve('./customize/CryptPad_logo_hero.svg');
    let base = Path.resolve('./customize.dist/CryptPad_logo_hero.svg');
    Fs.exists(path, function (exists) {
        res.setHeader('Content-Disposition', 'inline');
        if (exists) {
            let mime = Env.logoMimeType || 'image/svg+xml';
            res.setHeader('Content-Type', mime);
            return res.sendFile(path);
        }
        res.sendFile(base);
    });
});

app.post('/upload-blob', Express.json({limit:"500kb"}), (req, res) => {
    const { chunk, sig, edPublic } = req.body;
    if (!cpcrypto) {
        return void res.status(500).send({error: 'NOCRYPTO'});
    }

    const forbidden = reason => {
        return void res.status(403).send({error: reason});
    };

    try {
        // Check signature
        const sigu8 = Util.decodeBase64(sig);
        const vkey = Util.decodeBase64(edPublic);
        const ok = cpcrypto.open(sigu8, vkey);
        if (!ok) { return forbidden('INVALID_KEY'); }
        const cookie = Util.encodeUTF8(sigu8.subarray(64));
        // Check cookie
        const safeKey = Util.escapeKeyCharacters(edPublic);
        Env.blobStore.checkUploadCookie(safeKey, value => {
            if (value !== cookie) {
                return forbidden('INVALID_COOKIE');
            }
            // Upload chunk
            Env.blobStore.upload(safeKey, chunk, (err) => {
                if (err) {
                    return res.status(500).send({error: err});
                }
                // Get new cookie
                Env.blobStore.uploadCookie(safeKey, (err, _c) => {
                    if (err) {
                        return res.status(500).send({error: err});
                    }
                    res.status(200).send({
                        cookie: _c
                    });
                });
            });
        });

    } catch (e) {
        return void res.status(500).send({error: e.message});
    }
});

// This endpoint handles authenticated RPCs over HTTP
// via an interactive challenge-response protocol
app.use(Express.json());
app.post('/api/auth', function (req, res, next) {
    AuthCommands.handle(Env, req, res, next);
});


app.use(function (req, res /*, next */) {
    if (/^(\/favicon\.ico\/|.*\.js\.map|.*\/translations\/.*\.json)/.test(req.url)) {
        // ignore common 404s
    } else {
        Log.info('HTTP_404', req.url);
    }

    res.status(404);
    send404(res, custom_four04_path);
});

// default message for thrown errors in ExpressJS routes
app.use(function (err, req, res /*, next*/) {
    Log.error('EXPRESSJS_ROUTING', {
        error: err.stack || err,
    });
    res.status(500);
    send500(res, custom_fivehundred_path);
});

var server = Http.createServer(app);

nThen(function (w) {
    server.listen(Env.httpPort, Env.httpAddress, w());
    if (Env.httpSafePort) {
        let safeServer = Http.createServer(app);
        safeServer.listen(Env.httpSafePort, Env.httpAddress, w());
    }
    server.on('upgrade', function (req, socket, head) {
        // TODO warn admins that websockets should only be proxied in this way in a dev environment
        // in production it's more efficient to have your reverse proxy (NGINX) directly forward
        // websocket traffic to the correct port (Env.websocketPort)
        wsProxy.upgrade(req, socket, head);
    });

    var config = require("./load-config");
    BlobStore.create({
        blobPath: config.blobPath,
        blobStagingPath: config.blobStagingPath,
        archivePath: config.archivePath,
        getSession: function () {},
    }, w(function (err, blob) {
        if (err) { return; }
        Env.blobStore = blobStore = blob;
    }));
    CPCrypto.init(w(function (err, crypto) {
        cpcrypto = crypto;
    }));
}).nThen(function () {
    // TODO inform the parent process that this worker is ready
    Object.keys(Env.plugins || {}).forEach(name => {
        let plugin = plugins[name];
        if (!plugin.initialize) { return; }
        try { plugin.initialize(Env, "http-worker"); }
        catch (e) {}
    });
});

process.on('uncaughtException', function (err) {
    console.error('[%s] UNCAUGHT EXCEPTION IN HTTP WORKER', new Date());
    console.error(err);
    console.error("TERMINATING");
    process.exit(1);
});
