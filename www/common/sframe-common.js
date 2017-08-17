define([
    '/bower_components/nthen/index.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/sframe-channel.js',
    '/common/sframe-common-title.js'

], function (nThen, CpNfInner, SFrameChannel, Title) {

    // Chainpad Netflux Inner
    var funcs = {};
    var ctx = {};

    funcs.startRealtime = function (options) {
        if (ctx.cpNfInner) { return ctx.cpNfInner; }
        options.sframeChan = ctx.sframeChan;
        ctx.cpNfInner = CpNfInner.start(options);
        return ctx.cpNfInner;
    };

    funcs.isLoggedIn = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getPrivateData().accountName;
    };

    funcs.setPadTitleInDrive = function (title, cb) {
        ctx.sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', title, function (err) {
            if (cb) { cb(err, title); }
        });
    };

    // Title module
    funcs.createTitle = Title.create;

    funcs.getDefaultTitle = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getMetadata().defaultTitle;
    };


    Object.freeze(funcs);
    return { create: function (cb) {
        nThen(function (waitFor) {
            SFrameChannel.create(window.top, waitFor(function (sfc) { ctx.sframeChan = sfc; }));
            // CpNfInner.start() should be here....
        }).nThen(function () {
            cb(funcs);
        });
    } };
});
