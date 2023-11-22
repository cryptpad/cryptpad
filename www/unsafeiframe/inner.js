// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/components/chainpad-crypto/crypto.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-util.js',
    //'/common/common-hash.js',
    //'/common/hyperscript.js',
    //'json.sortify',
    //'/customize/messages.js',
], function (
    $,
    Crypto,
    nThen,
    SFCommon,
    UI,
    UIElements,
    Util /*,
    Hash,
    h,
    Sortify,
    Messages */)
{
    var APP = window.APP = {};

    var andThen = function (common) {
        //var metadataMgr = common.getMetadataMgr();
        var sframeChan = common.getSframeChannel();
        //var $body = $('body');
        //var displayed;

        var create = {};

        var x2t;
        var onConvert = function (obj, cb) {
            x2t.convert(obj, cb);
        };
        create['x2t'] = function (obj, cb) {
            if (x2t) { return void onConvert(obj, cb); }
            require(['/common/outer/x2t.js'], function (X2T) {
                x2t = X2T.start();
                onConvert(obj, cb);
            });
        };

        sframeChan.on('Q_COMMAND', function (data, cb) {
            if (!data) { return; }
            var type = data.modal;
            if (!create[type]) { return; }
            create[type](data, cb);
        });

        UI.removeLoadingScreen();
    };

    var main = function () {
        var common;
        var _andThen = Util.once(andThen);

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen({hideTips: true, hideLogo: true});
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            var metadataMgr = common.getMetadataMgr();
            if (metadataMgr.getMetadataLazy() !== 'uninitialized') {
                _andThen(common);
                return;
            }
            metadataMgr.onChange(function () {
                _andThen(common);
            });
        });
    };
    main();
});
