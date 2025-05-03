// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/diagram/util.js',
], function (
    DiagramUtil
) {
    const blobToImage = (blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
        });
    };

    const loadImage = (url) => {
        return DiagramUtil.loadImage(url).then((blob) => blobToImage(blob));
    };

    const loadCryptPadImages = (doc) => {
        return Array.from(doc.querySelectorAll('mxCell'))
            .map((element) => [element, DiagramUtil.parseDrawioStyle(element.getAttribute('style'))])
            .filter(([, style]) => style.image && style.image.startsWith('cryptpad://'))
            .map(([element, style]) => {
                return loadImage(style.image)
                    .then((dataUrl) => {
                        style.image = dataUrl.replace(';base64', '');  // ';' breaks draw.ios style format
                        element.setAttribute('style', DiagramUtil.stringifyDrawioStyle(style));
                    });
            });
    };

    return {
        main: function (userDoc, cb) {
            delete userDoc.metadata;

            const xml = DiagramUtil.jsonContentAsXML(userDoc);

            let doc;
            try {
                doc = DiagramUtil.parseXML(xml);
            } catch (e) {
                console.error(e);
                return;
            }

            const promises = loadCryptPadImages(doc);

            Promise.all(promises).then(() => {

                try {
                    const xmlString = new XMLSerializer().serializeToString(doc);
                    const blob = new Blob([xmlString], { type: 'application/xml' });
                    cb(blob, '.drawio');

                } catch (error) {
                    console.error('Error exporting diagram:', error);
                }
            });
        }
    };
});
