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

