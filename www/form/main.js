// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/components/nthen/index.js',
    '/api/config',
    '/common/dom-ready.js',
    '/common/sframe-common-outer.js',
], function (nThen, ApiConfig, DomReady, SFCommonO) {

    var href, hash;
    // Loaded in load #2
    nThen(function (waitFor) {
        DomReady.onReady(waitFor());
    }).nThen(function (waitFor) {
        var obj = SFCommonO.initIframe(waitFor, true);
        href = obj.href;
        hash = obj.hash;
    }).nThen(function (/*waitFor*/) {
        var channels = {};
        var getPropChannels = function () {
            return channels;
        };
        var addData = function (meta, CryptPad, user, Utils) {
            var keys = Utils.secret && Utils.secret.keys;

            var parsed = Utils.Hash.parseTypeHash('pad', hash.slice(1));
            if (parsed && parsed.auditorKey) {
                meta.form_auditorKey = parsed.auditorKey;
                meta.form_auditorHash = hash;
            }

            var formData = Utils.Hash.getFormData(Utils.secret);
            if (!formData) { return; }

            var validateKey = keys.secondaryValidateKey;
            meta.form_answerValidateKey = validateKey;

            meta.form_public = formData.form_public;
            meta.form_private = formData.form_private;
            meta.form_auditorHash = formData.form_auditorHash;
        };
        var addRpc = function (sframeChan, Cryptpad) {
            sframeChan.on('EV_FORM_PIN', function (data) {
                channels.answersChannel = data.channel;
                Cryptpad.otherPadAttrs = {
                    answersChannel: data.channel
                };
                Cryptpad.changeMetadata();
                Cryptpad.getPadAttribute('answersChannel', function (err, res) {
                    // If already stored, don't pin it again
                    if (res && res === data.channel) { return; }
                    Cryptpad.pinPads([data.channel], function () {
                        Cryptpad.setPadAttribute('answersChannel', data.channel, function () {});
                    });
                });
            });
        };
        SFCommonO.start({
            addData: addData,
            addRpc: addRpc,
            //cache: true,
            noDrive: true,
            hash: hash,
            href: href,
            useCreationScreen: true,
            messaging: true,
            getPropChannels: getPropChannels
        });
    });
});
