define([], function() {
	class OnlyOfficeEditor {
		constructor(placeholderId, config) {
            this.editor = new window.DocsAPI.DocEditor(placeholderId, config);
		}

		destroyEditor() {
			this.editor.destroyEditor();
		}
	}

	return {
		OnlyOfficeEditor
	};
});
