
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/diagram/util.js',
], function (
    DiagramUtil
) {

    const saveImagesToCryptPad = (doc) => {
        return Array.from(doc.querySelectorAll('mxCell'))
            .map((element) => [element, DiagramUtil.parseDrawioStyle(element.getAttribute('style'))])
            .filter(([, style]) => style.image && style.image.startsWith('data:'))
            .map(x => console.log('XXX', x));
            // .map(([element, style]) => {
            //     return loadImage(style.image)
            //         .then((dataUrl) => {
            //             style.image = dataUrl.replace(';base64', '');  // ';' breaks draw.ios style format
            //             element.setAttribute('style', stringifyDrawioStyle(style));
            //         });
            // });
    };
    const importDiagram = async (content, file) => {
        let doc;
        try {
            doc = DiagramUtil.parseXML(content);
        } catch(e) {
            console.error(e);
            return;
        }

        saveImagesToCryptPad(doc);
        return DiagramUtil.xmlAsJsonContent(new XMLSerializer().serializeToString(doc));
    };

    return {
        importDiagram
    };
});
