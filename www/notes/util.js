// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// Reuse diagram helpers

define([
    '/diagram/util.js',
], function (
    DiagramUtil
) {
    const resolveImageUrl = function (href) {
        return DiagramUtil.loadImage(href).then((blob) => URL.createObjectURL(blob));
    };

    return {
        getCryptPadUrl: DiagramUtil.getCryptPadUrl,
        resolveImageUrl
    };
});
