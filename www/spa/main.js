// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    '/common/requireconfig.js',
    '/common/dom-ready.js',
    'jquery'
], function (nThen, ApiConfig, RequireConfig, DomReady, $) {

    // Loaded in load #2
    var hash, href;
    var requireConfig = RequireConfig();
    var urlArgs = requireConfig.urlArgs;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        // XXX make sure workers are allowed
        var worker = new SharedWorker('/common/outer/sharedworker.js?' + urlArgs);
    }).nThen(function () {
        var requireConfig = RequireConfig();
        var pathname = '/drive/'; // XXX
        var $i = $('<iframe>').attr('id', 'sbox-iframe').attr('src', pathname + '?' + urlArgs);
        $i.attr('allowfullscreen', 'true');
        $('iframe-placeholder').after($i).remove();
    });
});
