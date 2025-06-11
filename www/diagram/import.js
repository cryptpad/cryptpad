
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/diagram/util.js',
    '/common/common-util.js'
], function (
    DiagramUtil, Util
) {
    const splitAt = function (str, char) {
        const pos = str.indexOf(char);
        if (pos <= 0) {
            return [str, ''];
        }
        return [str.substring(0, pos), str.substring(pos + 1)];
    };

    const parseDataUrl = function (url) {
        const [prefix, data] = splitAt(url, ',');
        const [, metadata] = splitAt(prefix, ':');
        const [mimeType, ] = splitAt(metadata, ';');

        const u8 = Util.decodeBase64(data);
        return new Blob([u8], { type: mimeType });
    };

    const saveImagesToCryptPad = async (fileManager, doc) => {
        const images = Array.from(doc.querySelectorAll('mxCell'))
            .map((element) => ({
                element,
                style: DiagramUtil.parseDrawioStyle(element.getAttribute('style')),
            }))
            .filter(({ style }) => style.image && style.image.startsWith('data:'));

        for(const image of images) {
            const blob = parseDataUrl(image.style.image);

            const cryptPadUrl = await DiagramUtil.uploadFile(fileManager, blob);
            image.style.image = cryptPadUrl;
            image.element.setAttribute('style', DiagramUtil.stringifyDrawioStyle(image.style));
        }
    };

    const importDiagram = async (common, content) => {
        let doc;
        try {
            doc = DiagramUtil.parseXML(content);
        } catch(e) {
            console.error(e);
            return;
        }

        const fileManager = DiagramUtil.createSimpleFileManager(common);

        await saveImagesToCryptPad(fileManager, doc);
        return DiagramUtil.xmlAsJsonContent(new XMLSerializer().serializeToString(doc));
    };

    return {
        importDiagram
    };
});
