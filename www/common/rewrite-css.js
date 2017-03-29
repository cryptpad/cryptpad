define([
    '/api/config',
], function (Config) {
    var urlArgs = Config && Config.requireConf && Config.requireConf.urlArgs;
    if (!urlArgs) { return; }
    document.querySelectorAll('link[rel="stylesheet"][data-rewrite-href]').forEach(function (e) {
        var href = e.getAttribute('data-rewrite-href');
		href += (/\?/.test(href)?'&':'?') + urlArgs;
        e.setAttribute('href', href);
    });
});

