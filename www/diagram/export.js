// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/diagram/util.js',
], function (
    DiagramUtil
) {
    const parseDrawioStyle = (styleAttrValue) => {
        if (!styleAttrValue) {
            return;
        }

        const result = {};
        for (const part of styleAttrValue.split(';')) {
            const s = part.split(/=(.*)/);
            result[s[0]] = s[1];
        }

        return result;
    };

    const stringifyDrawioStyle = (styleAttrValue) => {
        const parts = [];
        for (const [key, value] of Object.entries(styleAttrValue)) {
            parts.push(`${key}=${value}`);
        }
        return parts.join(';');
    };

    const blobToImage = (blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
        });
    };

    const loadImage = (url) => {
        return DiagramUtil.loadImage(url).then((blob) => blobToImage(blob));
    };

    const loadCryptPadImages = (doc) => {
        return Array.from(doc .querySelectorAll('mxCell'))
            .map((element) => [element, parseDrawioStyle(element.getAttribute('style'))])
            .filter(([, style]) => style && style.image && style.image.startsWith('cryptpad://'))
            .map(([element, style]) => {
                return loadImage(style.image)
                    .then((dataUrl) => {
                        style.image = dataUrl.replace(';base64', '');  // ';' breaks draw.ios style format
                        element.setAttribute('style', stringifyDrawioStyle(style));
                    });
            });
    };

    const parseXML = (xmlStr) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            throw Error("error while parsing " + errorNode);
        }
        return doc;
    };

    return {
        main: function(userDoc, cb) {
            delete userDoc.metadata;

            const xml = DiagramUtil.jsonContentAsXML(userDoc);

            let doc;
            try {
                doc = parseXML(xml);
            } catch(e) {
                console.error(e);
                return;
            }

            const promises = loadCryptPadImages(doc);

            Promise.all(promises).then(() => {
                cb(new XMLSerializer().serializeToString(doc), '.drawio');
            });
        }
    };
});
