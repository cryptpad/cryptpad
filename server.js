/*
    globals require console
*/
var Express = require('express');
var Http = require('http');
var Fs = require('fs');
var Package = require('./package.json');
var Path = require("path");
var nThen = require("nthen");
var Util = require("./lib/common-util");

var config = require("./lib/load-config");

var app = Express();

// mode can be FRESH (default), DEV, or PACKAGE

var FRESH_KEY = '';
var FRESH_MODE = true;
var DEV_MODE = false;
if (process.env.PACKAGE) {
// `PACKAGE=1 node server` uses the version string from package.json as the cache string
    console.log("PACKAGE MODE ENABLED");
    FRESH_MODE = false;
    DEV_MODE = false;
} else if (process.env.DEV) {
// `DEV=1 node server` will use a random cache string on every page reload
    console.log("DEV MODE ENABLED");
    FRESH_MODE = false;
    DEV_MODE = true;
} else {
// `FRESH=1 node server` will set a random cache string when the server is launched
// and use it for the process lifetime or until it is reset from the admin panel
    console.log("FRESH MODE ENABLED");
    FRESH_KEY = +new Date();
}

var configCache = {};
config.flushCache = function () {
    configCache = {};
    FRESH_KEY = +new Date();
    if (!(DEV_MODE || FRESH_MODE)) { FRESH_MODE = true; }
    if (!config.log) { return; }
    config.log.info("UPDATING_FRESH_KEY", FRESH_KEY);
};

const clone = (x) => (JSON.parse(JSON.stringify(x)));

var setHeaders = (function () {
    if (typeof(config.httpHeaders) !== 'object') { return function () {}; }

    const headers = clone(config.httpHeaders);
    if (config.contentSecurity) {
        headers['Content-Security-Policy'] = clone(config.contentSecurity);
        if (!/;$/.test(headers['Content-Security-Policy'])) { headers['Content-Security-Policy'] += ';' }
        if (headers['Content-Security-Policy'].indexOf('frame-ancestors') === -1) {
            // backward compat for those who do not merge the new version of the config
            // when updating. This prevents endless spinner if someone clicks donate.
            // It also fixes the cross-domain iframe.
            headers['Content-Security-Policy'] += "frame-ancestors *;";
        }
    }
    const padHeaders = clone(headers);
    if (config.padContentSecurity) {
        padHeaders['Content-Security-Policy'] = clone(config.padContentSecurity);
    }
    if (Object.keys(headers).length) {
        return function (req, res) {
            const h = [
                    /^\/pad\/inner\.html.*/,
                    /^\/common\/onlyoffice\/.*\/index\.html.*/,
                    /^\/(sheet|ooslide|oodoc)\/inner\.html.*/,
                ].some((regex) => {
                    return regex.test(req.url)
                }) ? padHeaders : headers;
            for (let header in h) { res.setHeader(header, h[header]); }
        };
    }
    return function () {};
}());

(function () {
if (!config.logFeedback) { return; }

const logFeedback = function (url) {
    url.replace(/\?(.*?)=/, function (all, fb) {
        config.log.feedback(fb, '');
    });
};

app.head(/^\/common\/feedback\.html/, function (req, res, next) {
    logFeedback(req.url);
    next();
});
}());

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
    next();
});

app.use(Express.static(__dirname + '/www'));

// FIXME I think this is a regression caused by a recent PR
// correct this hack without breaking the contributor's intended behaviour.

var mainPages = config.mainPages || ['index', 'privacy', 'terms', 'about', 'contact'];
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static(__dirname + '/customize'));
app.get(mainPagePattern, Express.static(__dirname + '/customize.dist'));

app.use("/blob", Express.static(Path.join(__dirname, (config.blobPath || './blob')), {
    maxAge: DEV_MODE? "0d": "365d"
}));
app.use("/datastore", Express.static(Path.join(__dirname, (config.filePath || './datastore')), {
    maxAge: "0d"
}));
app.use("/block", Express.static(Path.join(__dirname, (config.blockPath || '/block')), {
    maxAge: "0d",
}));

app.use("/customize", Express.static(__dirname + '/customize'));
app.use("/customize", Express.static(__dirname + '/customize.dist'));
app.use("/customize.dist", Express.static(__dirname + '/customize.dist'));
app.use(/^\/[^\/]*$/, Express.static('customize'));
app.use(/^\/[^\/]*$/, Express.static('customize.dist'));

var admins = [];
try {
    admins = (config.adminKeys || []).map(function (k) {
        k = k.replace(/\/+$/, '');
        var s = k.split('/');
        return s[s.length-1].replace(/-/g, '/');
    });
} catch (e) { console.error("Can't parse admin keys"); }

var serveConfig = (function () {
    // if dev mode: never cache
    var cacheString = function () {
        return (FRESH_KEY? '-' + FRESH_KEY: '') + (DEV_MODE? '-' + (+new Date()): '');
    };

    var template = function (host) {
        return [
            'define(function(){',
            'var obj = ' + JSON.stringify({
                requireConf: {
                    waitSeconds: 600,
                    urlArgs: 'ver=' + Package.version + cacheString(),
                },
                removeDonateButton: (config.removeDonateButton === true),
                allowSubscriptions: (config.allowSubscriptions === true),
                websocketPath: config.externalWebsocketURL,
                httpUnsafeOrigin: config.httpUnsafeOrigin.replace(/^\s*/, ''),
                adminEmail: config.adminEmail,
                adminKeys: admins,
                inactiveTime: config.inactiveTime,
                supportMailbox: config.supportMailboxPublicKey
            }, null, '\t'),
            'obj.httpSafeOrigin = ' + (function () {
                if (config.httpSafeOrigin) { return '"' + config.httpSafeOrigin + '"'; }
                if (config.httpSafePort) {
                    return "(function () { return window.location.origin.replace(/\:[0-9]+$/, ':" +
                        config.httpSafePort + "'); }())";
                }
                return 'window.location.origin';
            }()),
            'return obj',
            '});'
        ].join(';\n')
    };

    var cleanUp = {};

    return function (req, res) {
        var host = req.headers.host.replace(/\:[0-9]+/, '');
        res.setHeader('Content-Type', 'text/javascript');
        // don't cache anything if you're in dev mode
        if (DEV_MODE) {
            return void res.send(template(host));
        }
        // generate a lookup key for the cache
        var cacheKey = host + ':' + cacheString();
        // if there's nothing cached for that key...
        if (!configCache[cacheKey]) {
            // generate the response and cache it in memory
            configCache[cacheKey] = template(host);
            // and create a function to conditionally evict cache entries
            // which have not been accessed in the last 20 seconds
            cleanUp[cacheKey] = Util.throttle(function () {
                delete cleanUp[cacheKey];
                delete configCache[cacheKey];
            }, 20000);
        }

        // successive calls to this function
        cleanUp[cacheKey]();
        return void res.send(configCache[cacheKey]);
    };
}());

app.get('/api/config', serveConfig);

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

var httpServer = Http.createServer(app);

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

        console.log('[%s] server available http://%s%s', new Date().toISOString(), hostName, ps);
    });

    if (config.httpSafePort) {
        Http.createServer(app).listen(config.httpSafePort, config.httpAddress, w());
    }
}).nThen(function () {
    var wsConfig = { server: httpServer };

    // Initialize logging then start the API server
    require("./lib/log").create(config, function (_log) {
        config.log = _log;
        config.httpServer = httpServer;

        if (config.externalWebsocketURL) { return; }
        require("./lib/api").create(config);
    });
});


