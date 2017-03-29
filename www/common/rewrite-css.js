define([
    '/api/config',
], function (Config) {
    if (!(Config && Config.requireConf && Config.requireConf.urlArgs)) { return; }

    document.querySelectorAll('link[rel="stylesheet"][data-rewrite-href]').forEach(function (e) {
        e.setAttribute('href', e.getAttribute('data-rewrite-href'));
    });
});

