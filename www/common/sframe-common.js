define([
    'jquery',
    '/common/sframe-chainpad-netflux-inner.js',

], function ($, CpNfInner) {
    var common = {};
    var cpNfInner;

    // Chainpad Netflux Inner
    common.startRealtime = function (options) {
        if (cpNfInner) { return cpNfInner; }
        cpNfInner = CpNfInner.start(options);
        return cpNfInner;
    };


    common.isLoggedIn = function () {
        if (!cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return cpNfInner.metadataMgr.getPrivateData().accountName;
    };

    return common;
});
