
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/diagram/util.js',
], function (
    $,
    DiagramUtil
) {
    const Nacl = window.nacl;

    const splitAt = function(str, char) {
        const pos = str.indexOf(char);
        if (pos <= 0) {
            return [str, ''];
        }
        return [str.substring(0, pos), str.substring(pos + 1)];
    }

    const parseDataUrl = function (url) {
        const [prefix, data] = splitAt(url, ',');
        const [, metadata] = splitAt(prefix, ':');
        const [mimeType, ] = splitAt(metadata, ';');

        const u8 = Nacl.util.decodeBase64(data);
        return new Blob([u8], { type: mimeType });
    };

    const uploadFile = async (fileManager, blob) => {
        return new Promise((resolve) => {
            fileManager.handleFile(blob, {
                callback: (data) => {
                    console.log('XXX data', data);
                    resolve();
                }
            });
        });
    };

    const saveImagesToCryptPad = async (fileManager, doc) => {
        const images = Array.from(doc.querySelectorAll('mxCell'))
            .map((element) => ({
                element,
                style: DiagramUtil.parseDrawioStyle(element.getAttribute('style')),
            }))
            .filter(({ style }) => style.image && style.image.startsWith('data:'))

        for(const image of images) {
            const blob = parseDataUrl(image.style.image);

            await uploadFile(fileManager, blob);
        }
    };

    const importDiagram = async (common, content, file) => {
        let doc;
        try {
            doc = DiagramUtil.parseXML(content);
        } catch(e) {
            console.error(e);
            return;
        }

        var fmConfigImages = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                console.log('XXX onUploaded', { ev, data });
                if (!ev.callback) { return; }
                ev.callback(data);
            }
        };
        const fileManager = common.createFileManager(fmConfigImages);

        await saveImagesToCryptPad(fileManager, doc);
        return DiagramUtil.xmlAsJsonContent(new XMLSerializer().serializeToString(doc));
    };

    return {
        importDiagram
    };
});
