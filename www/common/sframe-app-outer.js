// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js'
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    var isIntegration = Boolean(window.CP_integration_outer);
    var integration = window.CP_integration_outer || {};

    var hash, href;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true, integration.pathname);
        href = obj.href;
        hash = obj.hash;
        if (isIntegration) {
            href = integration.href;
            hash = integration.hash;
        }
    }).nThen(function (/*waitFor*/) {
        SFCommonO.start({
            cache: !isIntegration,
            noDrive: true,
            hash: hash,
            href: href,
            useCreationScreen: !isIntegration,
            messaging: true,
            integration: isIntegration,
            integrationUtils: integration.utils,
            integrationConfig: integration.config || {},
            initialState: integration.initialState || undefined
        });
    });
});
