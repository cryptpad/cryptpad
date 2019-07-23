define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-ui-elements.js',
    '/common/common-interface.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/share/app-share.less',
], function (
    $,
    nThen,
    SFCommon,
    UIElements,
    UI)
{
    var APP = window.APP = {};

    var init = false;
    var andThen = function (common) {
        if (init) { return; }
        init = true;

        var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();

        var hideShareDialog = function () {
            sframeChan.event('EV_SHARE_CLOSE');
        };

        var createShareDialog = function (data) {
            var priv = metadataMgr.getPrivateData();
            var hashes = priv.hashes;
            var origin = priv.origin;
            var pathname = priv.pathname;
            var f = (data && data.file) ? UIElements.createFileShareModal
                                          : UIElements.createShareModal;

            var friends = common.getFriends();

            var modal = f({
                origin: origin,
                pathname: pathname,
                password: priv.password,
                isTemplate: priv.isTemplate,
                hashes: hashes,
                common: common,
                title: data.title,
                friends: friends,
                onClose: function () {
                    hideShareDialog();
                },
                fileData: {
                    hash: hashes.fileHash,
                    password: priv.password
                }
            });
            $('button.cancel').click(); // Close any existing alertify
            UI.openCustomModal(UI.dialog.tabs(modal), {
                wide: Object.keys(friends).length !== 0
            });
        };
        sframeChan.on('EV_SHARE_REFRESH', function (data) {
            createShareDialog(data);
        });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.removeLoadingScreen();
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            var metadataMgr = common.getMetadataMgr();
            if (metadataMgr.getMetadataLazy() !== 'uninitialized') {
                andThen(common);
                return;
            }
            metadataMgr.onChange(function () {
                andThen(common);
            });
        });
    };
    main();
});
