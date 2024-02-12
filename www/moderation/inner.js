// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/customize/application_config.js',
    '/components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-signing-keys.js',
    '/support/ui.js',
    '/common/clipboard.js',
    'json.sortify',

    'css!/lib/datepicker/flatpickr.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/moderation/app-moderation.less',
], function (
    $,
    ApiConfig,
    AppConfig,
    Crypto,
    Toolbar,
    nThen,
    SFCommon,
    h,
    Messages,
    UI,
    UIElements,
    Util,
    Hash,
    Keys,
    Support,
    Clipboard,
    Sortify,
    )
{
    var APP = {
        'instanceStatus': {}
    };

    var Nacl = window.nacl;
    var common;
    var sFrameChan;

// XXX

    var andThen = function () {


    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.supportPage,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-content-container');
        APP.$toolbar = $('#cp-toolbar');
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (waitFor) {
        if (!common.isAdmin()) { return; } // XXX moderator
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        common.setTabTitle(Messages.supportPage);

        if (!common.isAdmin()) {
            return void UI.errorLoadingScreen(Messages.admin_authError || '403 Forbidden');
        }

        APP.privateKey = privateData.supportPrivateKey;
        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;
        APP.support = Support.create(common, true);

        UI.removeLoadingScreen();

    });
});
