// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/hyperscript.js',
    '/common/messenger-ui.js',
    '/customize/messages.js',
    '/common/common-interface.js',

    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
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
        common.setTabTitle(Messages.contacts);

        UI.removeLoadingScreen();
    });
});
