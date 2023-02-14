// This is the initialization loading the CryptPad libraries
define([
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    '/bower_components/pako/dist/pako.min.js',
    '/bower_components/js-base64/base64.js',
    'less!/drawio/app.less',
    'css!/drawio/drawio.css',
], function (
    Framework,
    Messages,
    pako,
    base64) {

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        var drawioFrame = document.querySelector('#cp-app-drawio-content');
        var lastContent = '';
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

            postMessageToDrawio({
                action: 'load',
                xml: lastContent,
                autosave: 1
            });
        };

        var onDrawioChange = function(newXml) {
            newXml = decompressDrawioXml(newXml);
            if (lastContent != newXml) {
                lastContent = newXml;
                framework.localChange();
            }
        }

        var onDrawioAutodave = function(data) {
            onDrawioChange(data.xml);
        }

        var drawioHandlers = {
            init: onDrawioInit,
            autosave: onDrawioAutodave,
        };

        // This is the function from which you will receive updates from CryptPad
        framework.onContentUpdate(function (newContent) {
            lastContent = newContent.content;
            postMessageToDrawio({
                action: 'merge',
                xml: newContent.content,
            });
        });

        // This is the function called to get the current state of the data in your app
        framework.setContentGetter(function () {
            return {
                content: lastContent
            };
        });

        // This is called when the history is synced. "onContentUpdate" has already been called with the full content and the loading screen is being removed.
        framework.onReady(function (newPad) {
            // Here you can focus any editable part, check the integrity of the current data or intialize some values
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

        doc.firstChild.removeAttribute('modified');
        doc.firstChild.removeAttribute('agent');
        doc.firstChild.removeAttribute('etag');

        var errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.error("error while parsing", errorNode);
            return xmlStr;
        }

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


        return new XMLSerializer().serializeToString(doc);
    }

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-drawio-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
