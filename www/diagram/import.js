
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/diagram/util.js',
], function (
    DiagramUtil
) {

    const importDiagram = async (content, file) => {
        return DiagramUtil.xmlAsJsonContent(content);
    };

    return {
        importDiagram
    };
});
