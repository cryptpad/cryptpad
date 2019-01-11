define([
    '/customize/messages.js',
    '/customize/application_config.js'
], function (Messages, AppConfig) {
    var Feedback = {};

    Feedback.init = function (state) {
        Feedback.state = state;
    };

    var randomToken = function () {
        return Math.random().toString(16).replace(/0./, '');
    };
    var ajax = function (url, cb) {
        var http = new XMLHttpRequest();
        http.open('HEAD', url);
        http.onreadystatechange = function() {
            if (this.readyState === this.DONE) {
                if (cb) { cb(); }
            }
        };
        http.send();
    };
    Feedback.send = function (action, force, cb) {
        if (typeof(cb) !== 'function') { cb = function () {}; }
        if (AppConfig.disableFeedback) { return void cb(); }
        if (!action) { return void cb(); }
        if (force !== true) {
            if (!Feedback.state) { return void cb(); }
        }

        var href = '/common/feedback.html?' + action + '=' + randomToken();
        ajax(href, cb);
    };

    Feedback.reportAppUsage = function () {
        var pattern = window.location.pathname.split('/')
            .filter(function (x) { return x; }).join('.');
        if (/^#\/1\/view\//.test(window.location.hash)) {
            Feedback.send(pattern + '_VIEW');
        } else {
            Feedback.send(pattern);
        }
    };

    Feedback.reportScreenDimensions = function () {
        var h = window.innerHeight;
        var w = window.innerWidth;
        Feedback.send('DIMENSIONS:' + h + 'x' + w);
    };
    Feedback.reportLanguage = function () {
        Feedback.send('LANG_' + Messages._languageUsed);
    };


    return Feedback;
});
