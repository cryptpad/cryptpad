// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/components/x2js/x2js.js',
    '/diagram/util.js',
], function (
    X2JS,
    DiagramUtil,
) {
    const x2js = new X2JS();
    const jsonContentAsXML = (content) => x2js.js2xml(content);

    const parseDrawioStyle = (styleAttrValue) => {
        if (!styleAttrValue) return;

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

    const findCryptPadImages = (doc) => {
        return Array.from(doc .querySelectorAll('mxCell'))
            .map((element) => [element, parseDrawioStyle(element.getAttribute('style'))])
            .filter(([element, style]) => style && style.image && style.image.startsWith('cryptpad://'))
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
    
    const blobToImage = (blob) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result);
            };
            reader.readAsDataURL(blob);
        });
    };

    const loadImage = async (url) => {
        const blob = await DiagramUtil.loadImage(url);
        return await blobToImage(blob);
    };

    return {
        main: async function(userDoc, cb) {
            delete userDoc.metadata;

            const xml = jsonContentAsXML(userDoc);

            let doc;
            try {
                doc = parseXML(xml);
            } catch(e) {
                console.error(e);
                return;
            }

            const elements = findCryptPadImages(doc)
                .map(([element, style]) => [element, style, loadImage(style.image)]);

            for (const [element, style, imagePromise] of elements) {
                const dataUrl = await imagePromise;
                style.image = dataUrl.replace(';base64', '');  // ';' breaks draw.ios style format
                element.setAttribute('style', stringifyDrawioStyle(style));
            }

            cb(new XMLSerializer().serializeToString(doc), '.drawio');
        }
    };
});
