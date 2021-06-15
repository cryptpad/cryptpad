/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
var Fs = require('fs');
var Path = require("path");
var nThen = require("nthen");
var Util = require("./lib/common-util");
var Default = require("./lib/defaults");
var Keys = require("./lib/keys");

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
    if (!Env.httpUnsafeOrigin || typeof(Env.httpUnsafeOrigin) !== 'string') {
        throw new Error("No 'httpUnsafeOrigin' provided");
    }

    // fall back to listening on a local address
    // if httpAddress is not a string
    if (typeof(config.httpAddress) !== 'string') {
        config.httpAddress = '127.0.0.1';
    }

    // listen on port 3000 if a valid port number was not provided
    if (typeof(config.httpPort) !== 'number' || config.httpPort > 65535) {
        config.httpPort = 3000;
    }

    if (typeof(Env.httpSafeOrigin) !== 'string') {
        Env.NO_SANDBOX = true;
        if (typeof(config.httpSafePort) !== 'number') {
            config.httpSafePort = config.httpPort + 1;
        }
    }
}());

var applyHeaderMap = function (res, map) {
    for (let header in map) { res.setHeader(header, map[header]); }
};

var setHeaders = (function () {
    // load the default http headers unless the admin has provided their own via the config file
    var headers;

    var custom = config.httpHeaders;
    // if the admin provided valid http headers then use them
    if (custom && typeof(custom) === 'object' && !Array.isArray(custom)) {
        headers = Util.clone(custom);
    } else {
        // otherwise use the default
        headers = Default.httpHeaders();
    }

    // next define the base Content Security Policy (CSP) headers
    if (typeof(config.contentSecurity) === 'string') {
        headers['Content-Security-Policy'] = config.contentSecurity;
        if (!/;$/.test(headers['Content-Security-Policy'])) { headers['Content-Security-Policy'] += ';' }
        if (headers['Content-Security-Policy'].indexOf('frame-ancestors') === -1) {
            // backward compat for those who do not merge the new version of the config
            // when updating. This prevents endless spinner if someone clicks donate.
            // It also fixes the cross-domain iframe.
            headers['Content-Security-Policy'] += "frame-ancestors *;";
        }
    } else {
        // use the default CSP headers constructed with your domain
        headers['Content-Security-Policy'] = Default.contentSecurity(Env.httpUnsafeOrigin);
    }

    const padHeaders = Util.clone(headers);
    if (typeof(config.padContentSecurity) === 'string') {
        padHeaders['Content-Security-Policy'] = config.padContentSecurity;
    } else {
        padHeaders['Content-Security-Policy'] = Default.padContentSecurity(Env.httpUnsafeOrigin);
    }
    if (Object.keys(headers).length) {
        return function (req, res) {
            // apply a bunch of cross-origin headers for XLSX export in FF and printing elsewhere
            applyHeaderMap(res, {
                "Cross-Origin-Opener-Policy": /^\/sheet\//.test(req.url)? 'same-origin': '',
            });

            if (Env.NO_SANDBOX) { // handles correct configuration for local development
            // https://stackoverflow.com/questions/11531121/add-duplicate-http-response-headers-in-nodejs
                applyHeaderMap(res, {
                    "Cross-Origin-Resource-Policy": 'cross-origin',
                    "Cross-Origin-Embedder-Policy": 'require-corp',
                });
            }

            // Don't set CSP headers on /api/ endpoints
            // because they aren't necessary and they cause problems
            // when duplicated by NGINX in production environments
            if (/^\/api\/(broadcast|config)/.test(req.url)) { return; }

            applyHeaderMap(res, {
                "Cross-Origin-Resource-Policy": 'cross-origin',
            });

            // targeted CSP, generic policies, maybe custom headers
            const h = [
                    /^\/common\/onlyoffice\/.*\/index\.html.*/,
                    /^\/(sheet|presentation|doc)\/inner\.html.*/,
                ].some((regex) => {
                    return regex.test(req.url);
                }) ? padHeaders : headers;
            applyHeaderMap(res, h);
        };
    }
    return function () {};
}());

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

app.use('/blob', function (req, res, next) {
    if (req.method === 'HEAD') {
        Express.static(Path.join(__dirname, Env.paths.blob), {
            setHeaders: function (res, path, stat) {
                res.set('Access-Control-Allow-Origin', '*');
                res.set('Access-Control-Allow-Headers', 'Content-Length');
                res.set('Access-Control-Expose-Headers', 'Content-Length');
            }
        })(req, res, next);
        return;
    }
    next();
});

app.use(function (req, res, next) {
    if (req.method === 'OPTIONS' && /\/blob\//.test(req.url)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range');
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

app.use(Express.static(__dirname + '/www'));

// FIXME I think this is a regression caused by a recent PR
// correct this hack without breaking the contributor's intended behaviour.

var mainPages = config.mainPages || Default.mainPages();
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static(__dirname + '/customize'));
app.get(mainPagePattern, Express.static(__dirname + '/customize.dist'));

app.use("/blob", Express.static(Path.join(__dirname, Env.paths.blob), {
    maxAge: Env.DEV_MODE? "0d": "365d"
}));
app.use("/datastore", Express.static(Path.join(__dirname, Env.paths.data), {
    maxAge: "0d"
}));
app.use("/block", Express.static(Path.join(__dirname, Env.paths.block), {
    maxAge: "0d",
}));

app.use("/customize", Express.static(__dirname + '/customize'));
app.use("/customize", Express.static(__dirname + '/customize.dist'));
app.use("/customize.dist", Express.static(__dirname + '/customize.dist'));
app.use(/^\/[^\/]*$/, Express.static('customize'));
app.use(/^\/[^\/]*$/, Express.static('customize.dist'));

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

var serveConfig = makeRouteCache(function (host) {
    return [
        'define(function(){',
        'var obj = ' + JSON.stringify({
            requireConf: {
                waitSeconds: 600,
                urlArgs: 'ver=' + Env.version + cacheString(),
            },
            removeDonateButton: (Env.removeDonateButton === true),
            allowSubscriptions: (Env.allowSubscriptions === true),
            websocketPath: config.externalWebsocketURL,
            httpUnsafeOrigin: Env.httpUnsafeOrigin,
            adminEmail: Env.adminEmail,
            adminKeys: Env.admins,
            inactiveTime: Env.inactiveTime,
            supportMailbox: Env.supportMailbox,
            defaultStorageLimit: Env.defaultStorageLimit,
            maxUploadSize: Env.maxUploadSize,
            premiumUploadSize: Env.premiumUploadSize,
            restrictRegistration: Env.restrictRegistration,
        }, null, '\t'),
        'obj.httpSafeOrigin = ' + (function () {
            if (Env.httpSafeOrigin) { return '"' + Env.httpSafeOrigin + '"'; }
            if (config.httpSafePort) {
                return "(function () { return window.location.origin.replace(/\:[0-9]+$/, ':" +
                    config.httpSafePort + "'); }())";
            }
            return 'window.location.origin';
        }()),
        'return obj',
        '});'
    ].join(';\n')
}, 'configCache');

var serveBroadcast = makeRouteCache(function (host) {
    var maintenance = Env.maintenance;
    if (maintenance && maintenance.end && maintenance.end < (+new Date())) {
        maintenance = undefined;
    }
    return [
        'define(function(){',
        'return ' + JSON.stringify({
            lastBroadcastHash: Env.lastBroadcastHash,
            surveyURL: Env.surveyURL,
            maintenance: maintenance
        }, null, '\t'),
        '});'
    ].join(';\n')
}, 'broadcastCache');

app.get('/api/config', serveConfig);
app.get('/api/broadcast', serveBroadcast);

var four04_path = Path.resolve(__dirname + '/customize.dist/404.html');
var custom_four04_path = Path.resolve(__dirname + '/customize/404.html');

var send404 = function (res, path) {
    if (!path && path !== four04_path) { path = four04_path; }
    Fs.exists(path, function (exists) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        if (exists) { return Fs.createReadStream(path).pipe(res); }
        send404(res);
    });
};

app.use(function (req, res, next) {
    res.status(404);
    send404(res, custom_four04_path);
});

var httpServer = Env.httpServer = Http.createServer(app);

nThen(function (w) {
    Fs.exists(__dirname + "/customize", w(function (e) {
        if (e) { return; }
        console.log("Cryptpad is customizable, see customize.dist/readme.md for details");
    }));
}).nThen(function (w) {
    httpServer.listen(config.httpPort,config.httpAddress,function(){
        var host = config.httpAddress;
        var hostName = !host.indexOf(':') ? '[' + host + ']' : host;

        var port = config.httpPort;
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

    if (config.httpSafePort) {
        Http.createServer(app).listen(config.httpSafePort, config.httpAddress, w());
    }
}).nThen(function () {
    var wsConfig = { server: httpServer };

    // Initialize logging then start the API server
    require("./lib/log").create(config, function (_log) {
        Env.Log = _log;
        config.log = _log;

        if (Env.OFFLINE_MODE) { return; }
        if (config.externalWebsocketURL) { return; }

        require("./lib/api").create(Env);
    });
});


