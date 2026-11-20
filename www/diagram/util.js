// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/components/x2js/x2js.js',
    '/components/pako/dist/pako.min.js',
    '/common/common-hash.js',
    '/common/inner/image-util.js',
    '/api/config',
], function (
    Util,
    X2JS,
    pako,
    Hash,
    ImageUtil,
    ApiConfig,
) {
    const x2js = new X2JS();

    const jsonContentAsXML = (content) => {

        // Sometimes `content` has additional fiels, that break the XML output. Only grab mxfile here.
        const cleaned = { mxfile: content.mxfile };

        return x2js.js2xml(cleaned);
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

    const numbersToNumbers = function(o) {
        const type = typeof o;

        if (type === "object") {
            for (const key in o) {
                o[key] = numbersToNumbers(o[key]);
            }
            return o;
        } else if (type === 'string' && o.match(/^[+-]?(0|(([1-9]\d*)(\.\d+)?))$/)) {
            return parseFloat(o, 10);
        } else {
            return o;
        }
    };

    // As described here: https://drawio-app.com/extracting-the-xml-from-mxfiles/
    const decompressDrawioXml = function(xmlDocStr) {
        var TEXT_NODE = 3;

        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlDocStr, "application/xml");

        var errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.error("error while parsing", errorNode);
            return xmlDocStr;
        }

        doc.firstChild.removeAttribute('modified');
        doc.firstChild.removeAttribute('agent');
        doc.firstChild.removeAttribute('etag');

        var diagrams = doc.querySelectorAll('diagram');

        diagrams.forEach(function(diagram) {
            if (diagram.childNodes.length === 1 && diagram.firstChild && diagram.firstChild.nodeType === TEXT_NODE)  {
                const innerText = diagram.firstChild.nodeValue;
                const bin = Util.decodeBase64(innerText);
                const xmlUrlStr = pako.inflateRaw(bin, {to: 'string'});
                const xmlStr = decodeURIComponent(xmlUrlStr);
                const diagramDoc = parser.parseFromString(xmlStr, "application/xml");
                diagram.replaceChild(diagramDoc.firstChild, diagram.firstChild);
            }
        });


        var result = new XMLSerializer().serializeToString(doc);
        return result;
    };

    const xmlAsJsonContent = (xml) => {
        var decompressedXml = decompressDrawioXml(xml);
        return numbersToNumbers(x2js.xml2js(decompressedXml));
    };


    const parseDrawioStyle = (styleAttrValue) => {
        if (!styleAttrValue) {
            return {};
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

    const getCryptPadUrlForUploadData = (data) => {
        const urlHash = data.url.split('#')[1];
        const secret = Hash.getSecrets('file', urlHash);

        const fileHost = ApiConfig.fileHost || window.location.origin;
        const hexFileName = secret.channel;
        const src = fileHost + Hash.getBlobPathFromHex(hexFileName);
        const key = secret.keys && secret.keys.cryptKey;
        const cryptKey = Util.encodeBase64(key);
        return ImageUtil.getCryptPadUrl(src, cryptKey, data.fileType);
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

    const createSimpleFileManager = (common) => {
        const fmConfigImages = {
            noHandlers: true,
            noStore: true,
            onUploaded: function (ev, data) {
                if (!ev.callback) { return; }
                ev.callback(data);
            }
        };
        return common.createFileManager(fmConfigImages);
    };

    return {
        getCryptPadUrl: ImageUtil.getCryptPadUrl,
        parseCryptPadUrl: ImageUtil.parseCryptPadUrl,
        loadImage: ImageUtil.loadImage,
        jsonContentAsXML,
        parseXML,
        xmlAsJsonContent,
        decompressDrawioXml,
        parseDrawioStyle,
        stringifyDrawioStyle,
        uploadFile,
        createSimpleFileManager,
    };
});
