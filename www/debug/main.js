// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
    '/common/sframe-common-outer.js',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-realtime.js',
    '/common/common-constants.js',
    '/common/common-interface.js',
], function (nThen, ApiConfig, $, RequireConfig, SFCommonO,
    Cryptpad, Util, Hash, Realtime, Constants, UI) {
    if (window.top !== window) {
        return void window.alert(`If you are seeing this message then somebody might be trying to compromise your CryptPad account. Please contact the CryptPad development team.`);
    }

    window.Cryptpad = {
        Common: Cryptpad,
        Util: Util,
        Hash: Hash,
        Realtime: Realtime,
        Constants: Constants,
        UI: UI
    };

    // Loaded in load #2
    nThen(function (waitFor) {
        $(waitFor());
    }).nThen(function (waitFor) {
        SFCommonO.initIframe(waitFor);
    }).nThen(function (/*waitFor*/) {
        var isDrive = false;
        var isMyDrive = false;
        if (!window.location.hash) {
            isDrive = true;
            isMyDrive = true;
        } else {
            var p = Hash.parsePadUrl('/debug/'+window.location.hash);
            if (p && p.hashData && p.hashData.app === 'drive') {
                isDrive = true;
            }
        }
        var addData = function (meta, Cryptpad) {
            if (isMyDrive) { window.location.hash = Cryptpad.userHash; }
            window.CryptPad_location.app = "debug";
            window.CryptPad_location.hash = Cryptpad.userHash;
            window.CryptPad_location.href = '/debug/#'+Cryptpad.userHash;
            meta.debugDrive = isDrive;
        };
        SFCommonO.start({
            noDrive: true,
            addData:addData
        });
    });
});
