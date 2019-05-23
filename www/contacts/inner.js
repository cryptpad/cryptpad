define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/common/messenger-ui.js',
    '/customize/messages.js',
    '/common/common-interface.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/contacts/app-contacts.less',
], function (
    $,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    MessengerUI,
    Messages,
    UI
    )
{
    var APP = {};

    var common;
    var sFrameChan;
    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        var toolbarElement = h('div#cp-toolbar.cp-toolbar-container');

        document.body.appendChild(toolbarElement);

        var appElement = h('div#cp-app-contacts-container');

        document.body.appendChild(appElement);

        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: $(toolbarElement),
            pageTitle: Messages.contacts_title,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();

        MessengerUI.create($(appElement), common);

        UI.removeLoadingScreen();

/*
        sFrameChan.query('Q_HEY_BUDDY', null, function (err, data) {
            if (!data) { return; }
            if (data.error) {
                UI.warn(data.error);
            } else {
                UI.log(data.response);
            }
        });*/
    });
});
