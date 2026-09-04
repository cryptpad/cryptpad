// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/common-hash.js',
    '/common/sframe-common-outer.js',
    '/common/outer/rtchannel.js'
], function (nThen, ApiConfig, DomReady, Hash, SFCommonO, RTC) {

    var isIntegration = Boolean(window.CP_integration_outer);
    var integration = window.CP_integration_outer || {};

    // Loaded in load #2
    var hash, href, version;
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true, integration.pathname);
        href = obj.href;
        hash = obj.hash;
        var parsed = Hash.parsePadUrl(href);
        if (parsed && parsed.hashData) {
            var opts = parsed.getOptions();
            version = opts.versionHash;
        }
        if (isIntegration) {
            href = integration.href;
            hash = integration.hash;
        }
    }).nThen(function (/*waitFor*/) {
        var addData = function (obj) {
            let path = (integration && integration.pathname) || window.location.pathname;
            obj.ooType = path.replace(/^\//, '').replace(/\/$/, '');
            obj.ooVersionHash = version;
            obj.ooForceVersion = localStorage.CryptPad_ooVersion || "";
        };
        const channels = {};
        var getPropChannels = function () {
            return channels;
        };
        var addRpc = function (sframeChan, Cryptpad, Utils) {
            Cryptpad.otherPadAttrs = channels;

            sframeChan.on('Q_OO_SAVE', function (data, cb) {
                // Only called onReady when loading legacy checkpoints
                channels.rtChannel = data.channel;
                channels.lastVersion = data.url;
                if (data.hash) { channels.lastCpHash = data.hash; }
                Cryptpad.setPadAttribute('lastCpHash', data.hash, cb);
                Cryptpad.setPadAttribute('lastVersion', data.url, cb);
            });

            RTC.addRpc(sframeChan, Cryptpad, Utils, channels);

            // X2T
            sframeChan.on('Q_OO_CONVERT', function (obj, cb) {
                obj.modal = 'x2t';
                Utils.initUnsafeIframe(obj, cb);
            });

        };
        SFCommonO.start({
            hash: hash,
            href: href,
            type: 'oo',
            addData: addData,
            addRpc: addRpc,
            getPropChannels: getPropChannels, // XXX TODO
            messaging: true,
            useCreationScreen: !isIntegration,
            noDrive: true,
            integration: isIntegration,
            integrationUtils: integration.utils,
            integrationConfig: integration.config || {},
            initialState: integration.initialState || undefined
        });
    });
});
