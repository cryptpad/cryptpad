/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Image plugin.
 */

( function() {

    CKEDITOR.plugins.add( 'mediatag', {
        requires: 'dialog,widget',
        //icons: 'image',
        //hidpi: true,
        onLoad: function () {

            CKEDITOR.addCss(
            'media-tag{' +
                'display:inline-block;' +
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
} )();

