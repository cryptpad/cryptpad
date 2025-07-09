// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This is the initialization loading the CryptPad libraries
define([
    '/api/config',
    'jquery',
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/components/x2js/x2js.js',
    '/diagram/util.js',
    '/common/common-ui-elements.js',
    '/components/tweetnacl/nacl-fast.min.js',
    'less!/diagram/app-diagram.less',
    'css!/diagram/drawio.css',
], function (
    ApiConfig,
    $,
    Framework,
    Messages,
    X2JS,
    DiagramUtil,
    UIElements
) {
    const APP = window.APP = {};


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
        $('#cp-app-diagram-editor').show();

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

        var onDrawioInit = function() {
            drawIoInitalized = true;
            if (lastContent?.mxfile?.diagram?.mxGraphModel) {
                let readOnly = framework.isReadOnly() || framework.isLocked();
                let grid = readOnly ? 0 : 1;
                lastContent.mxfile.diagram.mxGraphModel._grid = grid;
            }
            var xmlStr = DiagramUtil.jsonContentAsXML(lastContent);
            postMessageToDrawio({
                action: 'load',
                xml: xmlStr,
                autosave: 1
            });
        };

        var onDrawioChange = function(newXml) {
            var newJson = DiagramUtil.xmlAsJsonContent(newXml);
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
                        const fileManager = DiagramUtil.createSimpleFileManager(framework._.sfCommon);
                        DiagramUtil.uploadFile(fileManager, imageData.blob)
                            .then(url => resolve(url))
                            .catch(e => console.error(e));
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
            var xmlStr = DiagramUtil.jsonContentAsXML(lastContent);
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
            (content, file, cb) => {
                require(['/diagram/import.js'], (importer) => {
                    importer.importDiagram(framework._.sfCommon, content, file).then(cb);
                });
            },
            true
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

        var parameters;

        framework.onEditableChange(function () {
            var readOnly = framework.isReadOnly() || framework.isLocked();
            if (readOnly) {
                parameters.set('chrome', '0'); 
                parameters.set('grid', '0');
            } else {
                parameters.set('chrome', '1');
                parameters.set('grid', '1');
            }
            drawioFrame.src = ApiConfig.httpSafeOrigin + '/components/drawio/src/main/webapp/index.html?'
            + parameters;
        });

        // starting the CryptPad framework
        framework.start();

        parameters = new URLSearchParams({
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

        drawioFrame.src = ApiConfig.httpSafeOrigin + '/components/drawio/src/main/webapp/index.html?'
            + parameters;

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

    $('#cp-app-diagram-editor').hide();
    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-diagram-editor',
        skipLink: '#cp-app-diagram-content|body .geSearchSidebar',
        // validateContent: validateXml,
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
