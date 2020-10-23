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
var Default = require("./lib/defaults");
var Keys = require("./lib/keys");

var config = require("./lib/load-config");
var Env = require("./lib/env").create(config);

var app = Express();

(function () {
    // you absolutely must provide an 'httpUnsafeOrigin'
    if (typeof(config.httpUnsafeOrigin) !== 'string') {
        throw new Error("No 'httpUnsafeOrigin' provided");
    }

    config.httpUnsafeOrigin = config.httpUnsafeOrigin.trim();
    if (typeof(config.httpSafeOrigin) === 'string') {
        config.httpSafeOrigin = config.httpSafeOrigin.trim().replace(/\/$/, '');
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

    if (typeof(config.httpSafeOrigin) !== 'string') {
        if (typeof(config.httpSafePort) !== 'number') {
            config.httpSafePort = config.httpPort + 1;
        }

        if (Env.DEV_MODE) { return; }
        console.log(`
    m     m   mm   mmmmm  mm   m mmmmm  mm   m   mmm    m
    #  #  #   ##   #   "# #"m  #   #    #"m  # m"   "   #
    " #"# #  #  #  #mmmm" # #m #   #    # #m # #   mm   #
     ## ##"  #mm#  #   "m #  # #   #    #  # # #    #
     #   #  #    # #    " #   ## mm#mm  #   ##  "mmm"   #
`);

        console.log("\nNo 'httpSafeOrigin' provided.");
        console.log("Your configuration probably isn't taking advantage of all of CryptPad's security features!");
        console.log("This is acceptable for development, otherwise your users may be at risk.\n");

        console.log("Serving sandboxed content via port %s.\nThis is probably not what you want for a production instance!\n", config.httpSafePort);
    }
}());

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
        headers['Content-Security-Policy'] = Default.contentSecurity(config.httpUnsafeOrigin);
    }

    const padHeaders = Util.clone(headers);
    if (typeof(config.padContentSecurity) === 'string') {
        padHeaders['Content-Security-Policy'] = config.padContentSecurity;
    } else {
        padHeaders['Content-Security-Policy'] = Default.padContentSecurity(config.httpUnsafeOrigin);
    }
    if (Object.keys(headers).length) {
        return function (req, res) {
            const h = [
                    ///^\/pad\/inner\.html.*/,
                    /^\/common\/onlyoffice\/.*\/index\.html.*/,
                    /^\/(sheet|ooslide|oodoc)\/inner\.html.*/,
                ].some((regex) => {
                    return regex.test(req.url);
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
        if (!config.log) { return; }
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

var mainPages = config.mainPages || Default.mainPages();
var mainPagePattern = new RegExp('^\/(' + mainPages.join('|') + ').html$');
app.get(mainPagePattern, Express.static(__dirname + '/customize'));
app.get(mainPagePattern, Express.static(__dirname + '/customize.dist'));

app.use("/blob", Express.static(Path.join(__dirname, (config.blobPath || './blob')), {
    maxAge: Env.DEV_MODE? "0d": "365d"
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

var serveConfig = (function () {
    // if dev mode: never cache
    var cacheString = function () {
        return (Env.FRESH_KEY? '-' + Env.FRESH_KEY: '') + (Env.DEV_MODE? '-' + (+new Date()): '');
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
                httpUnsafeOrigin: config.httpUnsafeOrigin,
                adminEmail: Env.adminEmail,
                adminKeys: Env.admins,
                inactiveTime: Env.inactiveTime,
                supportMailbox: Env.supportMailbox,
                maxUploadSize: Env.maxUploadSize,
                premiumUploadSize: Env.premiumUploadSize,
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
        if (Env.DEV_MODE) {
            return void res.send(template(host));
        }
        // generate a lookup key for the cache
        var cacheKey = host + ':' + cacheString();

        // FIXME mutable
        // we must be able to clear the cache when updating any mutable key
        // if there's nothing cached for that key...
        if (!Env.configCache[cacheKey]) {
            // generate the response and cache it in memory
            Env.configCache[cacheKey] = template(host);
            // and create a function to conditionally evict cache entries
            // which have not been accessed in the last 20 seconds
            cleanUp[cacheKey] = Util.throttle(function () {
                delete cleanUp[cacheKey];
                delete Env.configCache[cacheKey];
            }, 20000);
        }

        // successive calls to this function
        cleanUp[cacheKey]();
        return void res.send(Env.configCache[cacheKey]);
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

        console.log('[%s] server available http://%s%s', new Date().toISOString(), hostName, ps);
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

        if (config.externalWebsocketURL) { return; }

        require("./lib/api").create(Env);
    });
});


