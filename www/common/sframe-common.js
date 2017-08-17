define([
    '/bower_components/nthen/index.js',
    '/common/sframe-chainpad-netflux-inner.js',
    '/common/sframe-channel.js',
    '/common/sframe-common-title.js',
    '/common/metadata-manager.js',

], function (nThen, CpNfInner, SFrameChannel, Title, MetadataMgr) {

    // Chainpad Netflux Inner
    var funcs = {};
    var ctx = {};

    funcs.startRealtime = function (options) {
        if (ctx.cpNfInner) { return ctx.cpNfInner; }
        options.sframeChan = ctx.sframeChan;
        options.metadataMgr = ctx.metadataMgr;
        ctx.cpNfInner = CpNfInner.start(options);
        ctx.cpNfInner.metadataMgr.onChangeLazy(options.onLocal);
        return ctx.cpNfInner;
    };

    funcs.isLoggedIn = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getPrivateData().accountName;
    };

    var titleUpdated;
    funcs.updateTitle = function (title, cb) {
        ctx.metadataMgr.updateTitle(title);
        titleUpdated = cb;
    };

    // Title module
    funcs.createTitle = Title.create;

    funcs.getDefaultTitle = function () {
        if (!ctx.cpNfInner) { throw new Error("cpNfInner is not ready!"); }
        return ctx.cpNfInner.metadataMgr.getMetadata().defaultTitle;
    };

    funcs.setDisplayName = function (name, cb) {
        ctx.sframeChan.query('Q_SETTINGS_SET_DISPLAY_NAME', name, function (err) {
            if (cb) { cb(err); }
        });
    };

    Object.freeze(funcs);
    return { create: function (cb) {
        nThen(function (waitFor) {
            SFrameChannel.create(window.top, waitFor(function (sfc) { ctx.sframeChan = sfc; }));
            // CpNfInner.start() should be here....
        }).nThen(function () {
            ctx.metadataMgr = MetadataMgr.create(ctx.sframeChan);
            ctx.metadataMgr.onTitleChange(function (title) {
                ctx.sframeChan.query('Q_SET_PAD_TITLE_IN_DRIVE', title, function (err) {
                    if (err) { return; }
                    if (titleUpdated) { titleUpdated(undefined, title); }
                });
            });
            cb(funcs);
        });
    } };
});
