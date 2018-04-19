/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The Image plugin.
 */

( function() {

    CKEDITOR.plugins.add( 'mediatag', {
        requires: 'dialog',
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

            var allowed = 'media-tag[!data-crypto-key,!src,contenteditable,width,height]{border-style,border-width,float,height,margin,margin-bottom,margin-left,margin-right,margin-top,width}',
                required = 'media-tag[data-crypto-key,src]';

            // Register the command.
            editor.addCommand( pluginName, new CKEDITOR.dialogCommand( pluginName, {
                allowedContent: allowed,
                requiredContent: required,
                contentTransformations: [
                    [ 'media-tag{width}: sizeToStyle', 'media-tag[width]: sizeToAttribute' ],
                    [ 'media-tag{float}: alignmentToStyle', 'media-tag[align]: alignmentToAttribute' ]
                ]
            } ) );

            var isMediaTag = function (el) {
                if (el.is('media-tag')) { return el; }
                var mt = el.getParents().slice().filter(function (p) {
                    return p.is('media-tag');
                });
                if (mt.length !== 1) { return; }
                return mt[0];
            };
            editor.on('doubleclick', function (evt) {
                var element = evt.data.element;
                var mt = isMediaTag(element);
                if (mt && !element.data('cke-realelement')) {
                    editor.plugins.mediatag.clicked = mt;
                    evt.data.dialog = 'mediatag';
                }
            });
        },
    } );
} )();

