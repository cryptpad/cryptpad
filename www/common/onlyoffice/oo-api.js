define([
    '/common/common-util.js',
], function(
    Util
) {
    class OnlyOfficeEditor {
        constructor(placeholderId, config) {
            let onAppReady;

            this.waitForAppReady = new Promise((resolve) => {
                onAppReady = resolve;
            });

            this.waitForAppReady.then(Util.get(config, 'events.onAppReady', Util.noop));

            config = Util.deepAssign(config, {events: {onAppReady}});

            this.editor = new window.DocsAPI.DocEditor(placeholderId, config);

            this.fromOOHandlers = new EventHandlers();
            this.toOOHandlers = new EventHandlers();

            window.APP = window.APP || {};
            window.APP.addToOOHandler = (h) => {
                console.log('XXX addToOOHandler', h);
                this.toOOHandlers.add(h);
            };
        }

        destroyEditor() {
            this.editor.destroyEditor();
        }

        getIframe() {
            return document.querySelector('iframe[name="frameEditor"]');
        }

        injectCSS(css) {
            const head = this.getIframe().contentDocument.querySelector('head');
            const style = document.createElement('style');
            style.innerText = css;
            head.appendChild(style);
        }

        sendMessageToOO(msg) {
            console.log('XXX sendMessageToOO', msg);
            this.toOOHandlers.fire(msg);
        }

        addOnMessageFromOOHandler(onMessage) {
            this.fromOOHandlers.add(onMessage);
        }
    }

    class EventHandlers {
        constructor() {
            this.handlers = [];
        }

        add(handler) {
            this.handlers.push(handler);
        }

        remove(handler) {
            const index = this.handlers.indexOf(handler);
            if (index > -1) {
                this.handlers.splice(index, 1);
            }
        }

        fire(...args) {
            for (const h of this.handlers) {
                h(...args);
            }
        }
    }

    return {
        OnlyOfficeEditor
    };
});
