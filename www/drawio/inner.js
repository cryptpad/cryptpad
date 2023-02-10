// This is the initialization loading the CryptPad libraries
define([
    '/common/sframe-app-framework.js',
    '/customize/messages.js', // translation keys
    'text!/drawio/empty.drawio',
    'less!/drawio/app.less',
    'css!/drawio/drawio.css',
], function (
    Framework,
    Messages,
    emptyDrawioXml) {


    // This is the main initialization loop
    var onFrameworkReady = function (framework) {
        const drawioFrame = document.querySelector('#cp-app-drawio-content');
        let lastContent = emptyDrawioXml;

        const postMessageToDrawio = function(msg) {
            console.log('XXX postMessageToDrawio', msg);
            drawioFrame.contentWindow.postMessage(JSON.stringify(msg), '*');
        };

        const onDrawioInit = function(data) {
            postMessageToDrawio({
                action: 'load',
                xml: lastContent,
                autosave: 1
            });
        };

        const onDrawioChange = function(newXml) {
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

        drawioFrame.src = '/bower_components/drawio/src/main/webapp/index.html?pages=0&dev=1&stealth=1&embed=1&drafts=0&noSaveBtn=1&modified=unsavedChanges&proto=json';

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

    // Framework initialization
    Framework.create({
        toolbarContainer: '#cme_toolbox',
        contentContainer: '#cp-app-drawio-editor'
    }, function (framework) {
        onFrameworkReady(framework);
    });
});
