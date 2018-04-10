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

            // If the "contextmenu" plugin is loaded, register the listeners.
            if (editor.contextMenu) {
                editor.contextMenu.addListener(function (element) {
                    if (getSelectedMediatag(editor, element)) {
                        return { mediatag: CKEDITOR.TRISTATE_OFF };
                    }
                });
            }
        },
        afterInit: function( editor ) {
            // Customize the behavior of the alignment commands. (http://dev.ckeditor.com/ticket/7430)
            setupAlignCommand('left');
            setupAlignCommand('right');
            setupAlignCommand('center');
            setupAlignCommand('block');

            function setupAlignCommand (value) {
                var command = editor.getCommand('justify' + value);
                if (command) {
                    if (value === 'left' || value === 'right') {
                        command.on('exec', function (evt) {
                            var img = getSelectedMediatag(editor), align;
                            if (img) {
                                align = getMediatagAlignment(img);
                                if (align === value) {
                                    img.removeStyle('float');

                                    // Remove "align" attribute when necessary.
                                    if (value === getMediatagAlignment(img))
                                        img.removeAttribute( 'align' );
                                } else {
                                    img.setStyle( 'float', value );
                                }

                                evt.cancel();
                            }
                        } );
                    }

                    command.on('refresh', function (evt) {
                        var img = getSelectedMediatag(editor), align;
                        if (img) {
                            align = getMediatagAlignment(img);

                            this.setState(
                            (align === value) ? CKEDITOR.TRISTATE_ON : ( value === 'right' || value === 'left' ) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED );

                            evt.cancel();
                        }
                    } );
                }
            }
        }
    } );

    function getSelectedMediatag (editor, element) {
        if (!element) {
            var sel = editor.getSelection();
            element = sel.getSelectedElement();
        }

        if (element && element.is('media-tag') && !element.data('cke-realelement')
            && !element.isReadOnly()) {
            return element;
        }
    }

    function getMediatagAlignment (element) {
        var align = element.getStyle('float');

        if (align === 'inherit' || align === 'none') {
            align = 0;
        }

        if (!align) {
            align = element.getAttribute('align');
        }

        return align;
    }
} )();

/**
 * Determines whether dimension inputs should be automatically filled when the image URL changes in the Image plugin dialog window.
 *
 *      config.image_prefillDimensions = false;
 *
 * @since 4.5
 * @cfg {Boolean} [image_prefillDimensions=true]
 * @member CKEDITOR.config
 */

/**
 * Whether to remove links when emptying the link URL field in the Image dialog window.
 *
 *      config.image_removeLinkByEmptyURL = false;
 *
 * @cfg {Boolean} [image_removeLinkByEmptyURL=true]
 * @member CKEDITOR.config
 */
CKEDITOR.config.mediatag_removeLinkByEmptyURL = true;

/**
 * Padding text to set off the image in the preview area.
 *
 *      config.image_previewText = CKEDITOR.tools.repeat( '___ ', 100 );
 *
 * @cfg {String} [image_previewText='Lorem ipsum dolor...' (placeholder text)]
 * @member CKEDITOR.config
 */

