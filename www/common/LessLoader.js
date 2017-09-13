/*@flow*/
/*:: const define = () => {}; */
define([
    '/api/config'
], function (Config) { /*::});module.exports = (function() {
    const Config = (undefined:any);
    */

    var module = { exports: {} };
    var key = Config.requireConf.urlArgs;
    var localStorage = {};
    try {
        localStorage = window.localStorage || {};
        if (localStorage['LESS_CACHE'] !== key) {
            Object.keys(localStorage).forEach(function (k) {
                if (k.indexOf('LESS_CACHE|') !== 0) { return; }
                delete localStorage[k];
            });
            localStorage['LESS_CACHE'] = key;
        }
    } catch (e) {
        console.error(e);
        localStorage = {};
    }

    var cacheGet = function (k, cb) {
        if (window.cryptpadCache) { return void window.cryptpadCache.get(k, cb); }
        setTimeout(function () { cb(localStorage['LESS_CACHE|' + key + '|' + k]); })
    };
    var cachePut = function (k, v, cb) {
        if (window.cryptpadCache) { return void window.cryptpadCache.put(k, v, cb); }
        cb = cb || function () { };
        setTimeout(function () { localStorage['LESS_CACHE|' + key + '|' + k] = v; cb(); });
    };

    var fixURL = function (url, parent) {
        // data: blob: etc
        if (/^[a-zA-Z0-9]*:/.test(url)) { return url; }
        var ua = url.split('#');
        var mark = (ua[0].indexOf('?') !== -1) ? '&' : '?';
        ua[0] = ua[0] + mark + key;
        if (ua[0].indexOf(':') === -1 && ua[0].indexOf('/') && parent) {
            ua[0] = parent.replace(/\/[^\/]*$/, '/') + ua[0];
        }
        var out = ua.join('#');
        //console.log(url + "  -->  " + out);
        return out;
    };

    var inject = function (cssText, url) {
        var curStyle = document.createElement('style');
        curStyle.setAttribute('data-original-src', url);
        curStyle.type = 'text/css';
        curStyle.appendChild(document.createTextNode(cssText));
        if (!document.head) { throw new Error(); }
        document.head.appendChild(curStyle);
    };

    var fixAllURLs = function (source, parent) {
        var urlRegEx = /@import\s*("([^"]*)"|'([^']*)')|url\s*\(\s*(\s*"([^"]*)"|'([^']*)'|[^\)]*\s*)\s*\)/ig;
        var result, url;

        while (!!(result = urlRegEx.exec(source))) {
            url = result[3] || result[2] || result[5] || result[6] || result[4];
            var newUrl = fixURL(url, parent);
            var quoteLen = result[5] || result[6] ? 1 : 0;
            source = source.substr(0, urlRegEx.lastIndex - url.length - quoteLen - 1)
               + newUrl + source.substr(urlRegEx.lastIndex - quoteLen - 1);
            urlRegEx.lastIndex = urlRegEx.lastIndex + (newUrl.length - url.length);
        }

        return source;
    };

    var loadCSS = function (url, cb) {
        var xhr = new window.XMLHttpRequest();
        xhr.open("GET", fixURL(url), true);
        xhr.responseType = 'text';
        xhr.onload = function () {
            if (/^4/.test('' + this.status)) { return cb("error loading " + url); }
            cb(undefined, xhr.response);
        };
        xhr.send(null);
    };

    var lessEngine;
    var getLessEngine = function (cb) {
        if (lessEngine) {
            cb(lessEngine);
        } else {
            require(['/bower_components/less/dist/less.min.js'], function (Less) {
                lessEngine = Less;
                var doXHR = lessEngine.FileManager.prototype.doXHR;
                lessEngine.FileManager.prototype.doXHR = function (url, type, callback, errback) {
                    url = fixURL(url);
                    //console.log("xhr: " + url);
                    return doXHR(url, type, callback, errback);
                };
                cb(lessEngine);
            });
        }
    };

    var loadLess = function (url, cb) {
        getLessEngine(function (less) {
            less.render('@import (multiple) "' + url + '";', {}, function(err, css) {
                if (err) { return void cb(err); }
                cb(undefined, css.css);
            }, window.less);
        });
    };

    module.exports.load = function (url /*:string*/, cb /*:()=>void*/) {
        cacheGet(url, function (css) {
            if (css) {
                inject(css, url);
                return void cb();
            }
            console.log('CACHE MISS ' + url);
            ((/\.less([\?\#].*)?$/.test(url)) ? loadLess : loadCSS)(url, function (err, css) {
                var output = fixAllURLs(css, url);
                cachePut(url, output);
                inject(output, url);
                cb();
            });
        });
    };

    return module.exports;
})/*::()*/;
