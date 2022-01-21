define(['/api/config'], function (ApiConfig) {
    var reject = function () {
        window.close();
    };
    if (ApiConfig.httpSafeOrigin !== window.location.origin) {
        window.alert('The bounce application must only be used from the sandbox domain, ' +
            'please report this issue on https://github.com/xwiki-labs/cryptpad');
        return;
    }
    if (typeof(URL) !== 'function') {
        window.alert("Your browser does not support functionality this page requires");
        return void reject();
    }

    window.opener = null;

    var host;
    try {
        host = new URL('', ApiConfig.httpUnsafeOrigin);
    } catch (err) {
        window.alert("This server is configured incorrectly. Its administrator should check its diagnostics page");
        return void reject();
    }

    var target;
    try {
        var bounceTo = decodeURIComponent(window.location.hash.slice(1));
        target = new URL(bounceTo, ApiConfig.httpUnsafeOrigin);
    } catch (err) {
        console.error(err);
        window.alert('The bounce application must only be used with a valid href to visit');
        return void reject();
    }

    var go = function () {
        window.location.href = target.href;
    };

    if (target.host === host.host) { return void go(); }

    require([
        '/customize/messages.js',
    ], function (Messages) {
        Messages.bounce_confirm = 'You are about to leave {0}\n\nAre you sure you want to visit "{1}"?'; // XXX
        Messages.bounce_danger = 'It looks like someone is trying to trick you into visiting a dangerous link.\n\n("{0}")\n\nBe careful!'; // XXX

        if (['javascript:', 'vbscript:', 'data:', 'blob:'].includes(target.protocol)) {
            window.alert(Messages._getKey('bounce_danger', [target.href]));
            return void reject();
        }

        var question = Messages._getKey('bounce_confirm', [host.hostname, target.href]);
        var answer = window.confirm(question);
        if (answer) { return void go(); }
        reject();
    });
});
