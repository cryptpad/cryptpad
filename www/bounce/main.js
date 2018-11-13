define(['/api/config'], function (ApiConfig) {
    if (ApiConfig.httpSafeOrigin !== window.location.origin) {
        window.alert('The bounce application must only be used from the sandbox domain, ' +
            'please report this issue on https://github.com/xwiki-labs/cryptpad');
        return;
    }
    var bounceTo = decodeURIComponent(window.location.hash.slice(1));
    if (!bounceTo) {
        window.alert('The bounce application must only be used with a valid href to visit');
        return;
    }
    if (bounceTo.indexOf('javascript:') === 0 || // jshint ignore:line
        bounceTo.indexOf('vbscript:') === 0 || // jshint ignore:line
        bounceTo.indexOf('data:') === 0) {
        window.alert('Illegal bounce URL');
        return;
    }
    window.opener = null;
    window.location.href = bounceTo;
});
