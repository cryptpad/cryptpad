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

    console.log('XXX base64', base64);

    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        const drawioFrame = document.querySelector('#cp-app-drawio-content');
        let lastContent = '';
        let drawIoInitalized = false;

        const postMessageToDrawio = function(msg) {
            if (!drawIoInitalized) {
                return;
            }

            console.log('XXX postMessageToDrawio', msg);
            drawioFrame.contentWindow.postMessage(JSON.stringify(msg), '*');
        };

        const onDrawioInit = function(data) {
            drawIoInitalized = true;

            postMessageToDrawio({
                action: 'load',
                xml: lastContent,
                autosave: 1
            });
        };

        const onDrawioChange = function(newXml) {
            newXml = decompressDrawioXml(newXml);
            if (lastContent != newXml) {
                lastContent = newXml;
                framework.localChange();
            }
        }

        const onDrawioAutodave = function(data) {
            onDrawioChange(data.xml);
        }

        const drawioHandlers = {
            init: onDrawioInit,
            autosave: onDrawioAutodave,
        };

        // This is the function from which you will receive updates from CryptPad
        framework.onContentUpdate(function (newContent) {
            console.log("Content should be updated to " + newContent);
            lastContent = newContent.content;
            postMessageToDrawio({
                action: 'merge',
                xml: newContent.content,
            });
        });

        // This is the function called to get the current state of the data in your app
        framework.setContentGetter(function () {
            console.log("Content current value is " + lastContent);
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
                dev: 1,
                test: 1,
                stealth: 1,
                embed: 1,
                drafts: 0,
                noSaveBtn: 1,
                modified: 'unsavedChanges',
                proto: 'json',
            });

        window.addEventListener("message", (event) => {
            if (event.source == drawioFrame.contentWindow) {
                const data = JSON.parse(event.data);
                console.log('XXX', data);
                const eventType = data.event;
                const handler = drawioHandlers[eventType];
                if (handler) {
                    handler(data);
                }
            }
        }, false);
    };

    // As described here: https://drawio-app.com/extracting-the-xml-from-mxfiles/
    let decompressDrawioXml = function(xmlDocStr) {
        const TEXT_NODE = 3;

        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlDocStr, "application/xml");

        doc.firstChild.removeAttribute('modified');
        doc.firstChild.removeAttribute('agent');
        doc.firstChild.removeAttribute('etag');

        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
            console.error("error while parsing", errorNode);
            return xmlStr;
        }

        const diagrams = doc.querySelectorAll('diagram');

        diagrams.forEach((diagram) => {
            if (diagram.firstChild && diagram.firstChild.nodeType == TEXT_NODE)  {
                const innerText = diagram.firstChild.nodeValue;
                const bin = base64.toUint8Array(innerText);
                const xmlUrlStr = pako.inflateRaw(bin, {to: 'string'});
                const xmlStr = decodeURIComponent(xmlUrlStr);
                const diagramDoc = parser.parseFromString(xmlStr, "application/xml");
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
