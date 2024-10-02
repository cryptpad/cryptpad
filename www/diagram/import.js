
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

    const saveImagesToCryptPad = async (fileManager, doc) => {
        const images = Array.from(doc.querySelectorAll('mxCell'))
            .map((element) => ({
                element,
                style: DiagramUtil.parseDrawioStyle(element.getAttribute('style')),
            }))
            .filter(({ style }) => style.image && style.image.startsWith('data:'))

        console.log('XXX', images);

        for(const image of images) {
            const blob = await (await fetch(image.style.image)).blob();

            fileManager.handleFile(blob);
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
                ev.callback();
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
