( function() {

    CKEDITOR.plugins.add( 'mediatag', {
        requires: 'dialog,widget',
        //icons: 'image',
        //hidpi: true,
        onLoad: function () {

            CKEDITOR.addCss(
            'media-tag{' +
                'display:inline-block;' +
                'border-style: solid;' +
                'border-color: black;' +
                'border-width: 0;' +
            '}' +
            'media-tag.selected{' +
                'border: 1px solid black;' +
            '}' +
            'media-tag iframe{' +
                'border: 6px solid #eee;' +
            '}' +
            'media-tag img{' +
                'vertical-align: top;' +
            '}' +
            'media-tag *{' +
                'width:100%; height:100%;' +
            '}');
        },
        init: function( editor ) {
            var pluginName = 'mediatag';
            var Messages = CKEDITOR._mediatagTranslations;
            var targetWidget;

            // Register the dialog.
            CKEDITOR.dialog.add( pluginName, this.path + 'mediatag-plugin-dialog.js' );

            editor.widgets.add( 'mediatag', {

                getLabel: function () { return " "; },
                dialog: pluginName,
                inline: true,
                upcast: function( element ) {
                    return element.name === 'media-tag';
                }

            });

            editor.addCommand('importMediatag', {
                exec: function (editor) {
                    var w = targetWidget;
                    targetWidget = undefined;
                    var $mt = $(w.$).find('media-tag');
                    editor.plugins.mediatag.import($mt);
                }
            });

            if (editor.addMenuItems) {
                editor.addMenuGroup('mediatag');
                editor.addMenuItem('importMediatag', {
                        label: Messages.import,
                        icon: 'save',
                        command: 'importMediatag',
                        group: 'mediatag'
                });
                editor.addMenuItem('mediatag', {
                        label: Messages.options,
                        icon: 'image',
                        command: 'mediatag',
                        group: 'mediatag'
                });
            }
            if (editor.contextMenu) {
                editor.contextMenu.addListener(function (element) {
                    if (element.is('.cke_widget_mediatag')
                        || element.getAttribute('data-cke-display-name') === 'media-tag') {
                        targetWidget = element;
                        return {
                            mediatag: CKEDITOR.TRISTATE_OFF,
                            importMediatag: CKEDITOR.TRISTATE_OFF,
                        };
                    }
                });
            }

        },
    } );


    CKEDITOR.on('dialogDefinition', function (ev) {
        var dialog = ev.data.definition;
        if (ev.data.name === 'image') {
            dialog.removeContents('Link');
            dialog.removeContents('advanced');
            //var info = dialog.getContents('info');
            //info.remove('cmbAlign');
        }
    });

} )();

