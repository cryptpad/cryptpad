/*@flow*/
/*:: const define = () => {}; */
define([
    '/api/config',
    '/bower_components/less/dist/less.min.js'
], function (Config, Less) { /*::});module.exports = (function() {
    const Config = (undefined:any);
    const Less = (undefined:any);
    */

    var module = { exports: {} };
    var key = Config.requireConf.urlArgs;
    var localStorage;
    try {
        localStorage = window.localStorage || {};
    } catch (e) {
        console.error(e);
        localStorage = {};
    }

    var fixURL = function (url) {
        var mark = (url.indexOf('?') !== -1) ? '&' : '?';
        return url + mark + key;
    };

    var doXHR = Less.FileManager.prototype.doXHR;
    Less.FileManager.prototype.doXHR = function (url, type, callback, errback) {
        url = fixURL(url);
        //console.log("xhr: " + url);
        return doXHR(url, type, callback, errback);
    };

    var inject = function (cssText, url) {
        var curStyle = document.createElement('style');
        curStyle.setAttribute('data-original-src', url);
        curStyle.type = 'text/css';
        curStyle.appendChild(document.createTextNode(cssText));
        if (!document.head) { throw new Error(); }
        document.head.appendChild(curStyle);
    };

    var checkCache = function () {
        if (localStorage['LESS_CACHE'] === key) { return; }
        Object.keys(localStorage).forEach(function (k) {
            if (k.indexOf('LESS_CACHE|') !== 0) { return; }
            delete localStorage[k];
        });
        localStorage['LESS_CACHE'] = key;
    };

    module.exports.load = function (url /*:string*/, cb /*:()=>void*/) {
        checkCache();
        if (localStorage['LESS_CACHE|' + key + '|' + url]) {
            inject(localStorage['LESS_CACHE|' + key + '|' + url], url);
            cb();
            return;
        }
        Less.render('@import (multiple) "' + url + '";', {}, function(err, css) {
            if (err) {
                console.log(err);
                return;
            }
            localStorage['LESS_CACHE|' + key + '|' + url] = css.css;
            inject(css.css, url);
            cb();
        }, window.less);
    };

    return module.exports;
})/*::()*/;
