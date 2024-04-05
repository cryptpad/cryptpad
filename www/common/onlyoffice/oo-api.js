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

        }

        addOnMessageFromOOHandler(onMessage) {

        }
	}

	return {
		OnlyOfficeEditor
	};
});
