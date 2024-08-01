// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/components/pako/dist/pako.min.js',
    '/components/x2js/x2js.js',
    '/diagram/util.js',
    '/common/common-ui-elements.js',
    '/components/tweetnacl/nacl-fast.min.js',
    'less!/diagram/app-diagram.less',
    'css!/diagram/drawio.css',
], function (
    $,
    Framework,
    Messages,
    pako,
    X2JS,
    DiagramUtil,
    UIElements
) {
    const Nacl = window.nacl;
    const APP = window.APP = {};

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
                const bin = Nacl.util.decodeBase64(innerText);
                const xmlUrlStr = pako.inflateRaw(bin, {to: 'string'});
                const xmlStr = decodeURIComponent(xmlUrlStr);
                const diagramDoc = parser.parseFromString(xmlStr, "application/xml");
                diagram.replaceChild(diagramDoc.firstChild, diagram.firstChild);
            }
        });


        var result = new XMLSerializer().serializeToString(doc);
        return result;
    };

    const deepEqual = function(o1, o2) {
        return JSON.stringify(o1) === JSON.stringify(o2);
    };

    var mkHelpMenu = function (framework) {
        var $codeMirrorContainer = $('#cp-app-diagram-container');
        var helpMenu = framework._.sfCommon.createHelpMenu(['diagram']);
        $codeMirrorContainer.prepend(helpMenu.menu);

        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
        framework._.toolbar.$drawer.append($helpMenuButton);
    };

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        var EMPTY_DRAWIO = "<mxfile type=\"embed\"><diagram id=\"bWoO5ACGZIaXrIiKNTKd\" name=\"Page-1\"><mxGraphModel dx=\"1259\" dy=\"718\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"827\" pageHeight=\"1169\" math=\"0\" shadow=\"0\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/></root></mxGraphModel></diagram></mxfile>";
        var drawioFrame = document.querySelector('#cp-app-diagram-content');
        var x2js = new X2JS();
        var lastContent = x2js.xml2js(EMPTY_DRAWIO);
        var drawIoInitalized = false;

        var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
        if (!privateData.isEmbed) {
            mkHelpMenu(framework);
        }

        var postMessageToDrawio = function(msg) {
            if (!drawIoInitalized) {
                return;
            }

            drawioFrame.contentWindow.postMessage(JSON.stringify(msg), '*');
        };

        const jsonContentAsXML = (content) => x2js.js2xml(content);

        var onDrawioInit = function() {
            drawIoInitalized = true;
            var xmlStr = jsonContentAsXML(lastContent);
            postMessageToDrawio({
                action: 'load',
                xml: xmlStr,
                autosave: 1
            });
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

        const xmlAsJsonContent = (xml) => {
            var decompressedXml = decompressDrawioXml(xml);
            return numbersToNumbers(x2js.xml2js(decompressedXml));
        };

        var onDrawioChange = function(newXml) {
            var newJson = xmlAsJsonContent(newXml);
            if (!deepEqual(lastContent, newJson)) {
                lastContent = newJson;
                framework.localChange();
            }
        };

        var onDrawioAutosave = function(data) {
            onDrawioChange(data.xml);

            // Tell draw.io to hide "Unsaved changes" message
            postMessageToDrawio({action: 'status', message: '', modified: false});
        };

        var drawioHandlers = {
            init: onDrawioInit,
            autosave: onDrawioAutosave,
        };

        APP.loadImage = DiagramUtil.loadImage;
        APP.addImage = function() {
            return new Promise((resolve) => {
                framework.insertImage({}, (imageData) => {
                    if (imageData.blob) {
                        resolve(imageData.blob);
                    } else if (imageData.url) {
                        resolve(imageData.url);
                    } else {
                        resolve(DiagramUtil.getCryptPadUrl(imageData.src, imageData.key, imageData.fileType));
                    }
                });
            });
        };

        // This is the function from which you will receive updates from CryptPad
        framework.onContentUpdate(function (newContent) {
            lastContent = newContent;
            var xmlStr = jsonContentAsXML(lastContent);
            postMessageToDrawio({
                action: 'merge',
                xml: xmlStr,
            });

            framework.localChange();
        });

        // This is the function called to get the current state of the data in your app
        framework.setContentGetter(function () {
            return lastContent;
        });

        framework.setFileImporter(
            {accept: ['.drawio',  'application/x-drawio']},
            (content) => {
                return xmlAsJsonContent(content);
            }
        );

        framework.setFileExporter(
            '.drawio',
            (cb) => {
                require(['/diagram/export.js'], (exporter) => {
                    exporter.main(lastContent, (xml) => {
                        cb(new Blob([xml], {type: 'application/x-drawio'}));
                    });
                });
            }, true
        );

        framework.onEditableChange(function () {
            const editable = !framework.isLocked() && !framework.isReadOnly();
            postMessageToDrawio({
                action: 'spinner',
                message: Messages.reconnecting,
                show: !editable
            });
        });

        // starting the CryptPad framework
        framework.start();

        drawioFrame.src = '/components/drawio/src/main/webapp/index.html?'
            + new URLSearchParams({
                test: 1,
                stealth: 1,
                embed: 1,
                drafts: 0,
                p: 'cryptpad',
                integrated: framework.isIntegrated() ? 'true' : 'false',

                chrome: framework.isReadOnly() ? 0 : 1,
                dark: window.CryptPad_theme === "dark" ? 1 : 0,

                // Hide save and exit buttons
                noSaveBtn: 1,
                saveAndExit: 0,
                noExitBtn: 1,
                browser: 0,

                noDevice: 1,
                filesupport: 0,

                modified: 'unsavedChanges',
                proto: 'json',

                lang: Messages._languageUsed
            });

        window.addEventListener("message", (event) => {
            if (event.source === drawioFrame.contentWindow) {
                var data = JSON.parse(event.data);
                var eventType = data.event;
                var handler = drawioHandlers[eventType];
                if (handler) {
                    handler(data);
                }
            }
        }, false);
    };

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-diagram-editor',
        // validateContent: validateXml,
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
