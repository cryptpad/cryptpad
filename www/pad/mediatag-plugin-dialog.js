CKEDITOR.dialog.add('mediatag', function (editor) {
    var Messages = editor.plugins.mediatag.translations;
    return {
        title: Messages.title,
        minWidth: 400,
        minHeight: 200,
        contents: [
            {
                id: 'tab-basic',
                label: Messages.title,
                elements: [
                    {
                        type: 'text',
                        id: 'width',
                        label: Messages.width,
                    },
                    {
                        type: 'text',
                        id: 'height',
                        label: Messages.height,
                    }
                ]
            },
        ],
        onShow: function () {
            var sel = editor.getSelection();
            element = sel.getSelectedElement();
            if (!element) { return; }

            var el = element.findOne('media-tag');
            if (!el) { return; }

            var rect = el.getClientRect();
            var dialog = this.parts.contents.$;
            var inputs = dialog.querySelectorAll('input');
            var wInput = inputs[0];
            var hInput = inputs[1];
            wInput.value = Math.round(rect.width);
            hInput.value = Math.round(rect.height);
        },
        onOk: function() {
            var dialog = this;

            var sel = editor.getSelection();
            element = sel.getSelectedElement();
            if (!element) { return; }

            var el = element.findOne('media-tag');
            if (!el) { return; }

            var dialog = this.parts.contents.$;
            var inputs = dialog.querySelectorAll('input');
            var wInput = inputs[0];
            var hInput = inputs[1];

            window.setTimeout(function () {
                if (wInput.value === "") {
                    el.removeAttribute('width');
                    el.removeStyle('width');
                } else {
                    el.setSize('width', parseInt(wInput.value));
                }
                if (hInput.value === "") {
                    el.removeAttribute('height');
                    el.removeStyle('height');
                } else {
                    el.setSize('height', parseInt(hInput.value));
                }
                editor.fire( 'change' );
            });
        }
    };
});
