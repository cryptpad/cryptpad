
// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/diagram/util.js',
    '/common/common-hash.js',
    '/api/config',
], function (
    $,
    DiagramUtil,
    Hash,
    ApiConfig,
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

    const getCryptPadUrlForUploadData = (data) => {
        const [, urlHash] = splitAt(data.url, '#');
        const secret = Hash.getSecrets('file', urlHash);

        const fileHost = ApiConfig.fileHost || window.location.origin;
        const hexFileName = secret.channel;
        const src = fileHost + Hash.getBlobPathFromHex(hexFileName);
        const key = secret.keys && secret.keys.cryptKey;
        const cryptKey = Nacl.util.encodeBase64(key);
        return DiagramUtil.getCryptPadUrl(src, cryptKey, data.fileType);
    };

    const uploadFile = async (fileManager, blob) => {
        return new Promise((resolve) => {
            fileManager.handleFile(blob, {
                callback: (data) => {
                    const cryptPadUrl = getCryptPadUrlForUploadData(data);
                    resolve(cryptPadUrl);
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

        console.log('XXX saveImagesToCryptPad 1');
        await window.CryptPad_AsyncStore.onRpcReadyEvt.promise;
        console.log('XXX saveImagesToCryptPad 2');
        for(const image of images) {
            const blob = parseDataUrl(image.style.image);

            const cryptPadUrl = await uploadFile(fileManager, blob);
            image.style.image = cryptPadUrl;
            image.element.setAttribute('style', DiagramUtil.stringifyDrawioStyle(image.style));
        }
    };

    const importDiagram = async (common, content, file) => {
        console.log('XXX importDiagram 1');
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
