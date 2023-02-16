// This is the initialization loading the CryptPad libraries
define([
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/bower_components/pako/dist/pako.min.js',
    '/bower_components/js-base64/base64.js',
    '/bower_components/x2js/xml2json.min.js',
    'less!/drawio/app.less',
    'css!/drawio/drawio.css',
], function (
    Framework,
    Messages,
    pako,
    base64,
    X2JS) {

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        var EMPTY_DRAWIO = "<mxfile type=\"embed\"><diagram id=\"bWoO5ACGZIaXrIiKNTKd\" name=\"Page-1\"><mxGraphModel dx=\"1259\" dy=\"718\" grid=\"1\" gridSize=\"10\" guides=\"1\" tooltips=\"1\" connect=\"1\" arrows=\"1\" fold=\"1\" page=\"1\" pageScale=\"1\" pageWidth=\"827\" pageHeight=\"1169\" math=\"0\" shadow=\"0\"><root><mxCell id=\"0\"/><mxCell id=\"1\" parent=\"0\"/></root></mxGraphModel></diagram></mxfile>";
        var drawioFrame = document.querySelector('#cp-app-drawio-content');
        var x2js = new X2JS();
        var lastContent = x2js.xml_str2json(EMPTY_DRAWIO);
        var drawIoInitalized = false;

        var postMessageToDrawio = function(msg) {
            if (!drawIoInitalized) {
                return;
            }

            console.log('draw.io postMessageToDrawio', msg);
            drawioFrame.contentWindow.postMessage(JSON.stringify(msg), '*');
        };

        var onDrawioInit = function(data) {
            drawIoInitalized = true;
            var xmlStr = x2js.json2xml_str(lastContent);
            postMessageToDrawio({
                action: 'load',
                xml: xmlStr,
                autosave: 1
            });
        };

        var onDrawioChange = function(newXml) {
            var newXml = decompressDrawioXml(newXml);
            var newJson = x2js.xml_str2json(newXml);
            if (!deepEqual(lastContent, newJson)) {
                lastContent = newJson;
                framework.localChange();
            }
        }

        var onDrawioAutodave = function(data) {
            onDrawioChange(data.xml);
        }

        var onDrawioMerge = function(data) {

        }

        var onDrawioExport = function(data) {

        }

        var drawioHandlers = {
            init: onDrawioInit,
            autosave: onDrawioAutodave,
            merge: onDrawioMerge,
            export: onDrawioExport,
        };

        // This is the function from which you will receive updates from CryptPad
        framework.onContentUpdate(function (newContent) {
            lastContent = newContent;
            var xmlStr = x2js.json2xml_str(newContent);
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

        // This is called when the history is synced. "onContentUpdate" has already been called with the full content and the loading screen is being removed.
        framework.onReady(function (newPad) {
        });

        // starting the CryptPad framework
        framework.start();

        drawioFrame.src = '/bower_components/drawio/src/main/webapp/index.html?'
            + new URLSearchParams({
                // pages: 0,
                // dev: 1,
                test: 1,
                stealth: 1,
                embed: 1,
                drafts: 0,

                chrome: framework.isReadOnly() ? 0 : 1,

                // Hide save and exit buttons
                noSaveBtn: 1,
                saveAndExit: 0,
                noExitBtn: 1,

                modified: 'unsavedChanges',
                proto: 'json',
            });

        window.addEventListener("message", (event) => {
            if (event.source == drawioFrame.contentWindow) {
                var data = JSON.parse(event.data);
                console.log('draw.io got message', data);
                var eventType = data.event;
                var handler = drawioHandlers[eventType];
                if (handler) {
                    handler(data);
                }
            }
        }, false);
    };

    // As described here: https://drawio-app.com/extracting-the-xml-from-mxfiles/
    var decompressDrawioXml = function(xmlDocStr) {
        var TEXT_NODE = 3;

        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlDocStr, "application/xml");

        var errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.error("error while parsing", errorNode);
            return xmlStr;
        }

        doc.firstChild.removeAttribute('modified');
        doc.firstChild.removeAttribute('agent');
        doc.firstChild.removeAttribute('etag');

        var diagrams = doc.querySelectorAll('diagram');

        diagrams.forEach(function(diagram) {
            if (diagram.firstChild && diagram.firstChild.nodeType == TEXT_NODE)  {
                var innerText = diagram.firstChild.nodeValue;
                var bin = base64.toUint8Array(innerText);
                var xmlUrlStr = pako.inflateRaw(bin, {to: 'string'});
                var xmlStr = decodeURIComponent(xmlUrlStr);
                var diagramDoc = parser.parseFromString(xmlStr, "application/xml");
                diagram.replaceChild(diagramDoc.firstChild, diagram.firstChild);
            }
        });


        var result = new XMLSerializer().serializeToString(doc);
        return result;
    }

    var deepEqual = function(o1, o2) {
        return JSON.stringify(o1) == JSON.stringify(o2);
    }

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-drawio-editor',
        // validateContent: validateXml,
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
