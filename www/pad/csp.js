define(['jquery'], function ($) {
    var CKEDITOR = window.CKEDITOR;

    var $iframe = $('iframe').contents().find('html');

    $('body').on('click', '.cke_dialog_container a.cke_specialchar', function (e) {
        e.preventDefault();
        var attr = $(e.currentTarget).attr('oonclick');
        if (!attr) { return; }
        var reg = /CKEDITOR.tools.callFunction\(([0-9]+), this\);/;
        var m = attr.match(reg);
        if (!m) { return; }
        var s = $iframe.scrollTop();
        CKEDITOR.tools.callFunction(Number(m[1]), e.currentTarget);
        $iframe.scrollTop(s);
    });

    // Buttons
    var $a = $('.cke_toolbox_main').find('.cke_button, .cke_combo_button');
    $a.each(function (i, el) {
        var $el = $(el);
        var $icon = $el.find('span.cke_button_icon');
        if ($icon.length) {
            try {
                var url = $icon[0].style['background-image'];
                var bgImg = url.replace(/ !important$/, '');
                if (bgImg) {
                    $icon[0].style.setProperty('background-image', bgImg, 'important');
                }
            } catch (e) { console.error(e); }
        }
        $el.on('keydown blur focus click dragstart', function (e) {
            e.preventDefault();
            var attr = $(el).attr('oon'+e.type);
            if (!attr) { return; }
            if (['blur', 'dragstart'].indexOf(e.type) !== -1) { return false; }
            var reg = /CKEDITOR.tools.callFunction\(([0-9]+),(this|event)\);return false;/;
            var m = attr.match(reg);
            if (!m) { return; }
            var f = m[1];
            var arg = m[2] === "this" ? el : e.originalEvent;
            var s = $iframe.scrollTop();
            CKEDITOR.tools.callFunction(Number(f), arg);
            $iframe.scrollTop(s);
        });
    });


    // Dropdown menus

    var frameTpl = CKEDITOR.getTemplate('panel-frame');
    var panelTpl = CKEDITOR.getTemplate('panel');
    var frameDocTpl = CKEDITOR.addTemplate( 'panel-frame-inner-csp', '<!DOCTYPE html>' +
    '<html class="cke_panel_container {env}" dir="{dir}" lang="{langCode}">' +
        '<head>{css}</head>' +
        '<body class="cke_{dir}"' +
            ' style="margin:0;padding:0"></body>' +
    '<\/html>' );
    CKEDITOR.ui.panel.prototype.render = function( editor, output ) {
        var data = {
            editorId: editor.id,
            id: this.id,
            langCode: editor.langCode,
            dir: editor.lang.dir,
            cls: this.className,
            frame: '',
            env: CKEDITOR.env.cssClass,
            'z-index': editor.config.baseFloatZIndex + 1
        };

        this.getHolderElement = function() {
            var holder = this._.holder;

            if ( !holder ) {
                if ( this.isFramed ) {
                    var iframe = this.document.getById( this.id + '_frame' ),
                        parentDiv = iframe.getParent(),
                        doc = iframe.getFrameDocument();

                    // Make it scrollable on iOS. (https://dev.ckeditor.com/ticket/8308)
                    if (CKEDITOR.env.iOS) {
                        parentDiv.setStyles( {
                            'overflow': 'scroll',
                            '-webkit-overflow-scrolling': 'touch'
                        } );
                    }

                    var onLoad = CKEDITOR.tools.addFunction( CKEDITOR.tools.bind( function() {
                        this.isLoaded = true;
                        if ( this.onLoad ) {
                            this.onLoad();
                        }
                    }, this ) );

                    doc.write( frameDocTpl.output( CKEDITOR.tools.extend( {
                        css: CKEDITOR.tools.buildStyleHtml( this.css )
                    }, data ) ) );

                    var that = this;
                    $(iframe.$).on('load', function () {
                        that.isLoaded = true;
                        if (that.onLoad) {
                            that.onLoad();
                        }
                    }).contents().find('body').on('click dragstart mouseover mouseout', '.cke_button, a.cke_colormore, a.cke_colorbox, .cke_colorauto, .cke_combo_button, .cke_panel_listItem a, a.cke_menubutton', function (e) {
                        e.preventDefault();
                        if (e.type === 'dragstart') { return false; }
                        var attr = $(e.currentTarget).attr('oon'+e.type);
                        if (!attr) { return; }
                        var reg = /CKEDITOR.tools.callFunction\(([0-9]+),'?([^'"]+)'?(,'([A-Za-z0-9 ]+)')?\);/;
                        var match = attr.match(reg);
                        if (!match) { return; }
                        var f = match[1];
                        var el = match[2] !== "null" ? match[2] : null;
                        var s = $iframe.scrollTop();
                        CKEDITOR.tools.callFunction(Number(f), el, match[4]);
                        $iframe.scrollTop(s);
                    });

                    // Register the CKEDITOR global.
                    var win = doc.getWindow();
                    win.$.CKEDITOR = CKEDITOR;

                    // Arrow keys for scrolling is only preventable with 'keypress' event in Opera (https://dev.ckeditor.com/ticket/4534).
                    doc.on( 'keydown', function( evt ) {
                        var keystroke = evt.data.getKeystroke(),
                            dir = this.document.getById( this.id ).getAttribute( 'dir' );

                        // Arrow left and right should use native behaviour inside input element
                        if ( evt.data.getTarget().getName() === 'input' && ( keystroke === 37 || keystroke === 39 ) ) {
                            return;
                        }
                        // Delegate key processing to block.
                        if ( this._.onKeyDown && this._.onKeyDown( keystroke ) === false ) {
                            if ( !( evt.data.getTarget().getName() === 'input' && keystroke === 32 ) ) {
                                // Don't prevent space when is pressed on a input filed.
                                evt.data.preventDefault();
                            }
                            return;
                        }

                        // ESC/ARROW-LEFT(ltr) OR ARROW-RIGHT(rtl)
                        if ( keystroke === 27 || keystroke === ( dir === 'rtl' ? 39 : 37 ) ) {
                            if ( this.onEscape && this.onEscape( keystroke ) === false ) {
                                evt.data.preventDefault();
                            }
                        }
                    }, this );

                    holder = doc.getBody();
                    holder.unselectable();
                    if (CKEDITOR.env.air) { CKEDITOR.tools.callFunction( onLoad ); }
                } else {
                    holder = this.document.getById( this.id );
                }

                this._.holder = holder;
            }

            return holder;
        };

        if ( this.isFramed ) {
            // With IE, the custom domain has to be taken care at first,
            // for other browers, the 'src' attribute should be left empty to
            // trigger iframe's 'load' event.
            var src =
                CKEDITOR.env.air ? 'javascript:void(0)' : // jshint ignore:line
                ( CKEDITOR.env.ie && !CKEDITOR.env.edge ) ? 'javascript:void(function(){' + encodeURIComponent( // jshint ignore:line
                    'document.open();' +
                    // In IE, the document domain must be set any time we call document.open().
                    '(' + CKEDITOR.tools.fixDomain + ')();' +
                    'document.close();'
                ) + '}())' :
                '';

            data.frame = frameTpl.output( {
                id: this.id + '_frame',
                src: src
            } );
        }

        var html = panelTpl.output( data );

        if ( output ) { output.push( html ); }

        return html;
    };






    // Mathjax

    if ( !( CKEDITOR.env.ie && CKEDITOR.env.version === 8 ) ) {
        CKEDITOR.plugins.mathjax.frameWrapper = function( iFrame, editor ) {

            var update = function () {}; // Placeholder
            var buffer, preview, value, newValue,
                doc = iFrame.getFrameDocument(),

                // Is MathJax loaded and ready to work.
                isInit = false,

                // Is MathJax parsing Tex.
                isRunning = false,

                // Function called when MathJax is loaded.
                loadedHandler = CKEDITOR.tools.addFunction( function() {
                    preview = doc.getById( 'preview' );
                    buffer = doc.getById( 'buffer' );
                    isInit = true;

                    if ( newValue ) { update(); }

                    // Private! For test usage only.
                    CKEDITOR.fire( 'mathJaxLoaded', iFrame );
                } ),

                // Function called when MathJax finish his job.
                updateDoneHandler = CKEDITOR.tools.addFunction( function() {
                    CKEDITOR.plugins.mathjax.copyStyles( iFrame, preview );

                    preview.setHtml( buffer.getHtml() );

                    editor.fire( 'lockSnapshot' );

                    iFrame.setStyles( {
                        height: 0,
                        width: 0
                    } );

                    // Set iFrame dimensions.
                    var height = Math.max( doc.$.body.offsetHeight, doc.$.documentElement.offsetHeight ),
                        width = Math.max( preview.$.offsetWidth, doc.$.body.scrollWidth );

                    iFrame.setStyles( {
                        height: height + 'px',
                        width: width + 'px'
                    } );

                    editor.fire( 'unlockSnapshot' );

                    // Private! For test usage only.
                    CKEDITOR.fire( 'mathJaxUpdateDone', iFrame );

                    // If value changed in the meantime update it again.
                    if ( value !== newValue ) {
                        update();
                    } else {
                        isRunning = false;
                    }
                } );

            // Run MathJax parsing Tex.
            update = function () {
                isRunning = true;

                value = newValue;

                editor.fire( 'lockSnapshot' );

                buffer.setHtml( value );

                // Set loading indicator.
                preview.setHtml( '<img src=' + CKEDITOR.plugins.mathjax.loadingIcon + ' alt=' + editor.lang.mathjax.loading + '>' );

                iFrame.setStyles( {
                    height: '16px',
                    width: '16px',
                    display: 'inline',
                    'vertical-align': 'middle'
                } );

                editor.fire( 'unlockSnapshot' );

                // Run MathJax.
                doc.getWindow().$.update( value );
            };


            var load = function () {
                doc = iFrame.getFrameDocument();

                if ( doc.getById( 'preview' ) ) { return; }

                // Because of IE9 bug in a src attribute can not be javascript
                // when you undo (https://dev.ckeditor.com/ticket/10930). If you have iFrame with javascript in src
                // and call insertBefore on such element then IE9 will see crash.
                if ( CKEDITOR.env.ie ) { iFrame.removeAttribute( 'src' ); }

                doc.write( '<!DOCTYPE html>' +
                            '<html>' +
                            '<head>' +
                                '<meta charset="utf-8">' +
                                // Load MathJax lib.
                                '<script src="' + ( editor.config.mathJaxLib ) + '"></script>' +
                            '</head>' +
                            '<body style="padding:0;margin:0;background:transparent;overflow:hidden">' +
                                '<span id="preview"></span>' +

                                // Render everything here and after that copy it to the preview.
                                '<span id="buffer" style="display:none"></span>' +
                            '</body>' +
                            '</html>' );
                iFrame.$.contentWindow.mathjax_loaded = loadedHandler;
                iFrame.$.contentWindow.mathjax_done = updateDoneHandler;
            };

            iFrame.on( 'load', load );
            load();


            return {
                /**
                 * Sets the TeX value to be displayed in the `iframe` element inside
                 * the editor. This function will activate the MathJax
                 * library which interprets TeX expressions and converts them into
                 * their representation that is displayed in the editor.
                 *
                 * @param {String} value TeX string.
                 */
                setValue: function( value ) {
                    newValue = CKEDITOR.tools.htmlEncode( value );

                    if ( isInit && !isRunning ) {
                        update();
                    }
                }
            };
        };
    }




});
