/*
    globals process
*/
var Express = require('express');
var Http = require('http');
var Fs = require('fs');
var Path = require("path");
var nThen = require("nthen");
var Util = require("./lib/common-util");
var Default = require("./lib/defaults");

var config = require("./lib/load-config");
var Env = require("./lib/env").create(config);

var app = Express();

var fancyURL = function (domain, path) {
    try {
        if (domain && path) { return new URL(path, domain).href; }
        return new URL(domain);
    } catch (err) {}
    return false;
};

(function () {
    // you absolutely must provide an 'httpUnsafeOrigin' (a truthy string)
    if (typeof(Env.httpUnsafeOrigin) !== 'string' || !Env.httpUnsafeOrigin.trim()) {
        throw new Error("No 'httpUnsafeOrigin' provided");
    }
}());

var applyHeaderMap = function (res, map) {
    for (let header in map) {
        if (typeof(map[header]) === 'string') { res.setHeader(header, map[header]); }
    }
};

var EXEMPT = [
    /^\/common\/onlyoffice\/.*\.html.*/,
    /^\/(sheet|presentation|doc)\/inner\.html.*/,
    /^\/unsafeiframe\/inner\.html.*$/,
];

var cacheHeaders = function (Env, key, headers) {
    if (Env.DEV_MODE) { return; }
    Env[key] = headers;
};

var getHeaders = function (Env, type) {
    var key = type + 'HeadersCache';
    if (Env[key]) { return Env[key]; }

    var headers = {};

    var custom = config.httpHeaders;
    // if the admin provided valid http headers then use them
    if (custom && typeof(custom) === 'object' && !Array.isArray(custom)) {
        headers = Util.clone(custom);
    } else {
        // otherwise use the default
        headers = Default.httpHeaders(Env);
    }

    headers['Content-Security-Policy'] = type === 'office'?
        Default.padContentSecurity(Env):
        Default.contentSecurity(Env);

    if (Env.NO_SANDBOX) { // handles correct configuration for local development
    // https://stackoverflow.com/questions/11531121/add-duplicate-http-response-headers-in-nodejs
        headers["Cross-Origin-Resource-Policy"] = 'cross-origin';
        headers["Cross-Origin-Embedder-Policy"] = 'require-corp';
    }

    // Don't set CSP headers on /api/ endpoints
    // because they aren't necessary and they cause problems
    // when duplicated by NGINX in production environments
    if (type === 'api') {
        cacheHeaders(Env, key, headers);
        return headers;
    }

    headers["Cross-Origin-Resource-Policy"] = 'cross-origin';
    cacheHeaders(Env, key, headers);
    return headers;
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
    //console.log('PEWPEW', type, h);
    applyHeaderMap(res, h);
};

(function () {
if (!config.logFeedback) { return; }

const logFeedback = function (url) {
    url.replace(/\?(.*?)=/, function (all, fb) {
        if (!config.log) { return; }
        config.log.feedback(fb, '');
    });
};

app.head(/^\/common\/feedback\.html/, function (req, res, next) {
    logFeedback(req.url);
    next();
});
}());

const serveStatic = Express.static(Env.paths.blob, {
    setHeaders: function (res) {
        res.set('Access-Control-Allow-Origin', Env.enableEmbedding? '*': Env.permittedEmbedders);
        res.set('Access-Control-Allow-Headers', 'Content-Length');
        res.set('Access-Control-Expose-Headers', 'Content-Length');
    }
});

app.use('/blob', function (req, res, next) {
    if (req.method === 'HEAD') {
        return void serveStatic(req, res, next);
    }
    next();
});

app.use(function (req, res, next) {
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

// serve custom app content from the customize directory
// useful for testing pages customized with opengraph data
app.use(Express.static(Path.resolve('customize/www')));
app.use(Express.static(Path.resolve('www')));

// FIXME I think this is a regression caused by a recent PR
// correct this hack without breaking the contributor's intended behaviour.

var mainPages = config.mainPages || Default.mainPages();
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static(Path.resolve('customize')));
app.get(mainPagePattern, Express.static(Path.resolve('customize.dist')));

app.use("/blob", Express.static(Env.paths.blob, {
    maxAge: Env.DEV_MODE? "0d": "365d"
}));
app.use("/datastore", Express.static(Env.paths.data, {
    maxAge: "0d"
}));

app.use("/block", Express.static(Env.paths.block, {
    maxAge: "0d",
}));

app.use("/customize", Express.static(Path.resolve('customize')));
app.use("/customize", Express.static(Path.resolve('customize.dist')));
app.use("/customize.dist", Express.static(Path.resolve('customize.dist')));
app.use(/^\/[^\/]*$/, Express.static(Path.resolve('customize')));
app.use(/^\/[^\/]*$/, Express.static(Path.resolve('customize.dist')));

// if dev mode: never cache
var cacheString = function () {
    return (Env.FRESH_KEY? '-' + Env.FRESH_KEY: '') + (Env.DEV_MODE? '-' + (+new Date()): '');
};

var makeRouteCache = function (template, cacheName) {
    var cleanUp = {};
    var cache = Env[cacheName] = Env[cacheName] || {};

    return function (req, res) {
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
        cleanUp[cacheKey]();
        return void res.send(cache[cacheKey]);
    };
};

var serveConfig = makeRouteCache(function () {

    //console.log("server.js - sending serveConfig");
    var toSend ={
        requireConf: {
            waitSeconds: 600,
            urlArgs: 'ver=' + Env.version + cacheString(),
        },
        removeDonateButton: (Env.removeDonateButton === true),
        allowSubscriptions: (Env.allowSubscriptions === true),
        shouldUpdateNode: Env.shouldUpdateNode || undefined,
    };
    var envVariableArray = ["websocketPath", "httpUnsafeOrigin", "adminEmail",
        "inactiveTime", "supportMailbox", "defaultStorageLimit", "maxUploadSize",
        "premiumUploadSize", "restrictRegistration", "httpSafeOrigin", "enableEmbedding",
        "fileHost", "listMyInstance", "accounts_api", "bgBody", "darkBgBody", "bgAlert",
        "darkBgAlert", "brandColor", "darkBrandColor",  ];

    for ( var i = 0; i < envVariableArray.length; i++) {
        var currentVarName = envVariableArray[i];
        toSend[currentVarName] = Env[currentVarName];
    }
//console.log("server.js - serveConfig - toSend[bgAlert] : ",toSend["bgAlert"]);
    return [
        'define(function(){',
        'return ' + JSON.stringify(toSend, null, '\t'),
/*        'return ' + JSON.stringify({
            requireConf: {
                waitSeconds: 600,
                urlArgs: 'ver=' + Env.version + cacheString(),
            },
            removeDonateButton: (Env.removeDonateButton === true),
            allowSubscriptions: (Env.allowSubscriptions === true),
            websocketPath: Env.websocketPath,
            httpUnsafeOrigin: Env.httpUnsafeOrigin,
            adminEmail: Env.adminEmail,
            adminKeys: Env.admins,
            inactiveTime: Env.inactiveTime,
            supportMailbox: Env.supportMailbox,
            defaultStorageLimit: Env.defaultStorageLimit,
            maxUploadSize: Env.maxUploadSize,
            premiumUploadSize: Env.premiumUploadSize,
            restrictRegistration: Env.restrictRegistration,
            httpSafeOrigin: Env.httpSafeOrigin,
            enableEmbedding: Env.enableEmbedding,
            fileHost: Env.fileHost,
            shouldUpdateNode: Env.shouldUpdateNode || undefined,
            listMyInstance: Env.listMyInstance,
            accounts_api: Env.accounts_api,
        }, null, '\t'),*/
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
            curvePublic: Env.curvePublic, // XXX could be in api/config but issue with static config
            lastBroadcastHash: Env.lastBroadcastHash,
            surveyURL: Env.surveyURL,
            maintenance: maintenance
        }, null, '\t'),
        '});'
    ].join(';\n');
}, 'broadcastCache');

app.get('/api/config', serveConfig);
app.get('/api/broadcast', serveBroadcast);

var defineBlock = function (obj) {
    return `define(function (){
    return ${JSON.stringify(obj, null, '\t')};
});`;
};

app.get('/api/instance', function (req, res) { // XXX use caching?
    res.setHeader('Content-Type', 'text/javascript');
    res.send(defineBlock({
        name: Env.instanceName,
        description: Env.instanceDescription,
        location: Env.instanceJurisdiction,
        notice: Env.instanceNotice,
    }));
});

var four04_path = Path.resolve('customize.dist/404.html');
var fivehundred_path = Path.resolve('customize.dist/500.html');
var custom_four04_path = Path.resolve('customize/404.html');
var custom_fivehundred_path = Path.resolve('/customize/500.html');

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
    var Quota = require("./lib/commands/quota");
    Quota.updateCachedLimits(Env, (e) => {
        if (e) {
            Env.Log.warn('UPDATE_QUOTA_ERR', e);
            res.status(500);
            return void send500(res);
        }
        Env.Log.info('QUOTA_UPDATED', {});
        res.send();
    });
});

app.get('/api/profiling', function (req, res) {
    if (!Env.enableProfiling) { return void send404(res); }
    res.setHeader('Content-Type', 'text/javascript');
    res.send(JSON.stringify({
        bytesWritten: Env.bytesWritten,
    }));
});

app.use(function (req, res) {
    res.status(404);
    send404(res, custom_four04_path);
});

// default message for thrown errors in ExpressJS routes
app.use(function (err, req, res) {
    Env.Log.error('EXPRESSJS_ROUTING', {
        error: err.stack || err,
    });
    res.status(500);
    send500(res, custom_fivehundred_path);
});

var httpServer = Env.httpServer = Http.createServer(app);

nThen(function (w) {
    Fs.exists(Path.resolve("customize"), w(function (e) {
        if (e) { return; }
        console.log("CryptPad is customizable, see customize.dist/readme.md for details");
    }));
}).nThen(function (w) {
    httpServer.listen(Env.httpPort, Env.httpAddress, function(){
        var host = Env.httpAddress;
        var hostName = !host.indexOf(':') ? '[' + host + ']' : host;

        var port = Env.httpPort;
        var ps = port === 80? '': ':' + port;

        var roughAddress = 'http://' + hostName + ps;
        var betterAddress = fancyURL(Env.httpUnsafeOrigin);

        if (betterAddress) {
            console.log('Serving content for %s via %s.\n', betterAddress, roughAddress);
        } else {
            console.log('Serving content via %s.\n', roughAddress);
        }
        if (!Env.admins.length) {
            console.log("Your instance is not correctly configured for safe use in production.\nSee %s for more information.\n",
                fancyURL(Env.httpUnsafeOrigin, '/checkup/') || 'https://your-domain.com/checkup/'
            );
        }
    });

    if (Env.httpSafePort) {
        Http.createServer(app).listen(Env.httpSafePort, Env.httpAddress, w());
    }
}).nThen(function () {
    //var wsConfig = { server: httpServer };

    // Initialize logging then start the API server
    require("./lib/log").create(config, function (_log) {
        Env.Log = _log;
        config.log = _log;

        if (Env.shouldUpdateNode) {
            Env.Log.warn("NODEJS_OLD_VERSION", {
                message: `The CryptPad development team recommends using at least NodeJS v16.14.2`,
                currentVersion: process.version,
            });
        }

        if (Env.OFFLINE_MODE) { return; }
        if (Env.websocketPath) { return; }

        require("./lib/api").create(Env);
    });
});


