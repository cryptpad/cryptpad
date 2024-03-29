// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/*@flow*/
/*::
const define = (x:any, y:any) => {};
const require = define;
*/
define([
    '/api/config',
    '/api/instance',
    '/components/nthen/index.js'
], function (Config, Instance, nThen) { /*::});module.exports = (function() {
    const Config = (undefined:any);
    const nThen = (undefined:any);
    */

    var module = { exports: {} };
    var key = Config.requireConf.urlArgs;
    var localStorage = {};
    if (!window.cryptpadCache) {
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
    }

    var cacheGet = function (k, cb) {
        if (window.cryptpadCache) { return void window.cryptpadCache.get(k, cb); }
        setTimeout(function () { cb(localStorage['LESS_CACHE|' + key + '|' + k]); });
    };
    var cachePut = function (k, v, cb) {
        if (window.cryptpadCache) { return void window.cryptpadCache.put(k, v, cb); }
        setTimeout(function () {
            try {
                localStorage['LESS_CACHE|' + key + '|' + k] = v;
            } catch (err) {
                console.error(err);
            }
            if (cb) { cb(); }
        });
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
        ua[0] = ua[0].replace(/^\/\.\.\//, '/');
        var out = ua.join('#');
        //console.log(url + "  -->  " + out);
        return out;
    };

    var inject = function (cssText /*:string*/, url) {
        var curStyle = document.createElement('style');
        curStyle.setAttribute('data-original-src', url);
        curStyle.type = 'text/css';
        curStyle.appendChild(document.createTextNode(cssText));
        if (!document.head) { throw new Error(); }
        document.head.appendChild(curStyle);
    };

    var fixAllURLs = function (source /*:string*/, parent) {
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

    var COLORTHEME = '/customize/src/less2/include/colortheme.less';
    var COLORTHEME_DARK = '/customize/src/less2/include/colortheme-dark.less';
    var getColortheme = function () {
        return window.CryptPad_theme;
    };
    var getColorthemeURL = function () {
        if (window.CryptPad_theme === 'dark') { return COLORTHEME_DARK; }
        return COLORTHEME;
    };
    var isForcedColortheme = url => {
        return url === COLORTHEME+'?force' || url === COLORTHEME_DARK+'?force';
    };

    var lessEngine;
    var tempCache = { key: Math.random() };
    var getLessEngine = function (cb) {
        if (lessEngine) {
            cb(lessEngine);
        } else {
            require(['/lib/less.min.js'], function (Less) {
                if (lessEngine) { return void cb(lessEngine); }
                lessEngine = Less;
                Less.functions.functionRegistry.add('LessLoader_currentFile', function () {
                    return new Less.tree.UnicodeDescriptor('"' +
                        fixURL(this.currentFileInfo.filename) + '"');
                });
                var doXHR = lessEngine.FileManager.prototype.doXHR;
                lessEngine.FileManager.prototype.doXHR = function (url, type, callback, errback) {
                    //console.error(url, COLORTHEME);
                    var col = false;
                    var _url = url;
                    if (url === COLORTHEME) {
                        col = true;
                        url = getColorthemeURL();
                        //console.warn(url);
                    } else if (isForcedColortheme(url)) {
                        col = true;
                    }
                    url = fixURL(url);
                    var cached = tempCache[_url];
                    if (cached && cached.res) {
                        var res = cached.res;
                        return void setTimeout(function () { callback(res[0], res[1]); });
                    }
                    if (cached) { return void cached.queue.push(callback); }
                    cached = tempCache[_url] = { queue: [ callback ], res: undefined };
                    return doXHR(url, type, function (text, lastModified) {
                        if (col) {
                            //console.warn(text, lastModified);
                            if (getColortheme() === "custom") {
                                // TODO COLOR: append custom theme here
                                var custom = [
                                    '@cryptpad_text_col: #FF0000;'
                                ].join('\n');
                                text += '\n'+custom;
                            }
                            if (Instance && Instance.color) {
                                let pattern = /_color_brand: ([0-9a-zA-Z#]+);/gm;
                                text = text.replace(pattern, `_color_brand: ${Instance.color};`);
                            }
                        }
                        cached.res = [ text, lastModified ];
                        var queue = cached.queue;
                        cached.queue = [];
                        queue.forEach(function (f) {
                            setTimeout(function () { f(text, lastModified); });
                        });
                    }, errback);
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

    var loadSubmodulesAndInject = function (css, url, cb, stack) {
        inject(css, url);
        nThen(function (w) {
            css.replace(/\-\-LessLoader_require\:\s*"([^"]*)"\s*;/g, function (all, u) {
                u = u.replace(/\?.*$/, '');
                module.exports.load(u, w(), stack);
                return '';
            });
        }).nThen(function () { cb(); });
    };

    var idx = 0;
    module.exports.load = function (url /*:string*/, cb /*:()=>void*/, stack /*:?Array<string>*/) {
        var btime = stack ? null : +new Date();
        stack = stack || [];
        if (stack.indexOf(url) > -1) { return void cb(); }
        var timeout = setTimeout(function () { console.log('failed', url); }, 10000);
        var done = function () {
            clearTimeout(timeout);
            if (btime) {
                console.info("Compiling [" + url + "] took " + (+new Date() - btime) + "ms");
            }
            cb();
        };
        stack.push(url);
        if (window.CryptPad_updateLoadingProgress) {
            window.CryptPad_updateLoadingProgress({
                type: 'less',
                progress: 4*idx++
            });
        }
        cacheGet(url, function (css) {
            if (css) { return void loadSubmodulesAndInject(css, url, done, stack); }
            console.debug('CACHE MISS ' + url);
            ((/\.less([\?\#].*)?$/.test(url)) ? loadLess : loadCSS)(url, function (err, css) {
                if (!css) {
                    if (window.CryptPad_loadingError) {
                        window.CryptPad_loadingError('LESS: ' + (err && err.message));
                    }
                    return void console.error(err);
                }
                var output = fixAllURLs(css, url);
                cachePut(url, output);
                loadSubmodulesAndInject(output, url, done, stack);
            });
        });
    };

    return module.exports;
})/*::()*/;
