/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

/**
 * @fileOverview The WYSIWYG Area plugin. It registers the "wysiwyg" editing
 *		mode, which handles the main editing area space.
 */

define(['/api/config'], function (ApiConfig) {
    var framedWysiwyg;
	var iframe;

	CKEDITOR.plugins.registered.wysiwygarea.init = function( editor ) {
        if ( editor.config.fullPage ) {
            editor.addFeature( {
                allowedContent: 'html head title; style [media,type]; body (*)[id]; meta link [*]',
                requiredContent: 'body'
            } );
        }

        editor.addMode( 'wysiwyg', function( callback ) {
            var src = 'document.open();' +
                // In IE, the document domain must be set any time we call document.open().
                ( CKEDITOR.env.ie ? '(' + CKEDITOR.tools.fixDomain + ')();' : '' ) +
                'document.close();';

            // With IE, the custom domain has to be taken care at first,
            // for other browers, the 'src' attribute should be left empty to
            // trigger iframe's 'load' event.
            // Microsoft Edge throws "Permission Denied" if treated like an IE (http://dev.ckeditor.com/ticket/13441).
            if ( CKEDITOR.env.air ) {
                src = 'javascript:void(0)'; // jshint ignore:line
            } else if ( CKEDITOR.env.ie && !CKEDITOR.env.edge ) {
                src = 'javascript:void(function(){' + encodeURIComponent( src ) + '}())'; // jshint ignore:line
            } else {
                src = '';
            }
            
            // CryptPad
            src = '/pad/ckeditor-inner.html?' + ApiConfig.requireConf.urlArgs;

            iframe = CKEDITOR.dom.element.createFromHtml( '<iframe src="' + src + '" frameBorder="0"></iframe>' );
            iframe.setStyles( { width: '100%', height: '100%' } );
            iframe.addClass( 'cke_wysiwyg_frame' ).addClass( 'cke_reset' );
            
            // CryptPad
            // this is impossible because ckeditor uses some (non-inline) script inside of the iframe...
            //iframe.setAttribute('sandbox', 'allow-same-origin');

            var contentSpace = editor.ui.space( 'contents' );
            contentSpace.append( iframe );


            // Asynchronous iframe loading is only required in IE>8 and Gecko (other reasons probably).
            // Do not use it on WebKit as it'll break the browser-back navigation.
			var useOnloadEvent = ( CKEDITOR.env.ie && !CKEDITOR.env.edge ) || CKEDITOR.env.gecko;

			// CryptPad
			// This breaks Edge so lets use async all of the time
			useOnloadEvent = true;

            if ( useOnloadEvent )
                iframe.on( 'load', onLoad );

            var frameLabel = editor.title,
                helpLabel = editor.fire( 'ariaEditorHelpLabel', {} ).label;

            if ( frameLabel ) {
                if ( CKEDITOR.env.ie && helpLabel )
                    frameLabel += ', ' + helpLabel;

                iframe.setAttribute( 'title', frameLabel );
            }

            if ( helpLabel ) {
                var labelId = CKEDITOR.tools.getNextId(),
                    desc = CKEDITOR.dom.element.createFromHtml( '<span id="' + labelId + '" class="cke_voice_label">' + helpLabel + '</span>' );

                contentSpace.append( desc, 1 );
                iframe.setAttribute( 'aria-describedby', labelId );
            }

            // Remove the ARIA description.
            editor.on( 'beforeModeUnload', function( evt ) {
                evt.removeListener();
                if ( desc )
                    desc.remove();
            } );

            iframe.setAttributes( {
                tabIndex: editor.tabIndex,
                allowTransparency: 'true'
            } );

            // Execute onLoad manually for all non IE||Gecko browsers.
            !useOnloadEvent && onLoad();

            editor.fire( 'ariaWidget', iframe );

            function onLoad( evt ) {
                evt && evt.removeListener();
                var fw = new framedWysiwyg( editor, iframe.$.contentWindow.document.body );
                editor.editable( fw );
                editor.setData( editor.getData( 1 ), callback );
            }
        } );
    };

	/**
	 * Adds the path to a stylesheet file to the exisiting {@link CKEDITOR.config#contentsCss} value.
	 *
	 * **Note:** This method is available only with the `wysiwygarea` plugin and only affects
	 * classic editors based on it (so it does not affect inline editors).
	 *
	 *		editor.addContentsCss( 'assets/contents.css' );
	 *
	 * @since 4.4
	 * @param {String} cssPath The path to the stylesheet file which should be added.
	 * @member CKEDITOR.editor
	 */
	CKEDITOR.editor.prototype.addContentsCss = function( cssPath ) {
		var cfg = this.config,
			curContentsCss = cfg.contentsCss;

		// Convert current value into array.
		if ( !CKEDITOR.tools.isArray( curContentsCss ) )
			cfg.contentsCss = curContentsCss ? [ curContentsCss ] : [];

		cfg.contentsCss.push( cssPath );
	};

	function onDomReady( win ) {
		var editor = this.editor,
			doc = win.document,
			body = doc.body;

		// Remove helper scripts from the DOM.
		var script = doc.getElementById( 'cke_actscrpt' );
		script && script.parentNode.removeChild( script );
		script = doc.getElementById( 'cke_shimscrpt' );
		script && script.parentNode.removeChild( script );
		script = doc.getElementById( 'cke_basetagscrpt' );
		script && script.parentNode.removeChild( script );

		body.contentEditable = true;

		if ( CKEDITOR.env.ie ) {
			// Don't display the focus border.
			body.hideFocus = true;

			// Disable and re-enable the body to avoid IE from
			// taking the editing focus at startup. (http://dev.ckeditor.com/ticket/141 / http://dev.ckeditor.com/ticket/523)
			body.disabled = true;
			body.removeAttribute( 'disabled' );
		}

		delete this._.isLoadingData;

		// Play the magic to alter element reference to the reloaded one.
		this.$ = body;

		doc = new CKEDITOR.dom.document( doc );

		this.setup();
		this.fixInitialSelection();

		var editable = this;

		// Without it IE8 has problem with removing selection in nested editable. (http://dev.ckeditor.com/ticket/13785)
		if ( CKEDITOR.env.ie && !CKEDITOR.env.edge ) {
			doc.getDocumentElement().addClass( doc.$.compatMode );
		}

		// Prevent IE/Edge from leaving a new paragraph/div after deleting all contents in body. (http://dev.ckeditor.com/ticket/6966, http://dev.ckeditor.com/ticket/13142)
		if ( CKEDITOR.env.ie && !CKEDITOR.env.edge && editor.enterMode != CKEDITOR.ENTER_P ) {
			removeSuperfluousElement( 'p' );
		} else if ( CKEDITOR.env.edge && editor.enterMode != CKEDITOR.ENTER_DIV ) {
			removeSuperfluousElement( 'div' );
		}

		// Fix problem with cursor not appearing in Webkit and IE11+ when clicking below the body (http://dev.ckeditor.com/ticket/10945, http://dev.ckeditor.com/ticket/10906).
		// Fix for older IEs (8-10 and QM) is placed inside selection.js.
		if ( CKEDITOR.env.webkit || ( CKEDITOR.env.ie && CKEDITOR.env.version > 10 ) ) {
			doc.getDocumentElement().on( 'mousedown', function( evt ) {
				if ( evt.data.getTarget().is( 'html' ) ) {
					// IE needs this timeout. Webkit does not, but it does not cause problems too.
					setTimeout( function() {
						editor.editable().focus();
					} );
				}
			} );
		}

		// Config props: disableObjectResizing and disableNativeTableHandles handler.
		objectResizeDisabler( editor );

		// Enable dragging of position:absolute elements in IE.
		try {
			editor.document.$.execCommand( '2D-position', false, true );
		} catch ( e ) {}

		if ( CKEDITOR.env.gecko || CKEDITOR.env.ie && editor.document.$.compatMode == 'CSS1Compat' ) {
			this.attachListener( this, 'keydown', function( evt ) {
				var keyCode = evt.data.getKeystroke();

				// PageUp OR PageDown
				if ( keyCode == 33 || keyCode == 34 ) {
					// PageUp/PageDown scrolling is broken in document
					// with standard doctype, manually fix it. (http://dev.ckeditor.com/ticket/4736)
					if ( CKEDITOR.env.ie ) {
						setTimeout( function() {
							editor.getSelection().scrollIntoView();
						}, 0 );
					}
					// Page up/down cause editor selection to leak
					// outside of editable thus we try to intercept
					// the behavior, while it affects only happen
					// when editor contents are not overflowed. (http://dev.ckeditor.com/ticket/7955)
					else if ( editor.window.$.innerHeight > this.$.offsetHeight ) {
						var range = editor.createRange();
						range[ keyCode == 33 ? 'moveToElementEditStart' : 'moveToElementEditEnd' ]( this );
						range.select();
						evt.data.preventDefault();
					}
				}
			} );
		}

		if ( CKEDITOR.env.ie ) {
			// [IE] Iframe will still keep the selection when blurred, if
			// focus is moved onto a non-editing host, e.g. link or button, but
			// it becomes a problem for the object type selection, since the resizer
			// handler attached on it will mark other part of the UI, especially
			// for the dialog. (http://dev.ckeditor.com/ticket/8157)
			// [IE<8 & Opera] Even worse For old IEs, the cursor will not vanish even if
			// the selection has been moved to another text input in some cases. (http://dev.ckeditor.com/ticket/4716)
			//
			// Now the range restore is disabled, so we simply force IE to clean
			// up the selection before blur.
			this.attachListener( doc, 'blur', function() {
				// Error proof when the editor is not visible. (http://dev.ckeditor.com/ticket/6375)
				try {
					doc.$.selection.empty();
				} catch ( er ) {}
			} );
		}

		if ( CKEDITOR.env.iOS ) {
			// [iOS] If touch is bound to any parent of the iframe blur happens on any touch
			// event and body becomes the focused element (http://dev.ckeditor.com/ticket/10714).
			this.attachListener( doc, 'touchend', function() {
				win.focus();
			} );
		}

		var title = editor.document.getElementsByTag( 'title' ).getItem( 0 );
		// document.title is malfunctioning on Chrome, so get value from the element (http://dev.ckeditor.com/ticket/12402).
		title.data( 'cke-title', title.getText() );

		// [IE] JAWS will not recognize the aria label we used on the iframe
		// unless the frame window title string is used as the voice label,
		// backup the original one and restore it on output.
		if ( CKEDITOR.env.ie )
			editor.document.$.title = this._.docTitle;

		CKEDITOR.tools.setTimeout( function() {
			// Editable is ready after first setData.
			if ( this.status == 'unloaded' )
				this.status = 'ready';

			editor.fire( 'contentDom' );

			if ( this._.isPendingFocus ) {
				editor.focus();
				this._.isPendingFocus = false;
			}

			setTimeout( function() {
				editor.fire( 'dataReady' );
			}, 0 );
		}, 0, this );

		function removeSuperfluousElement( tagName ) {
			var lockRetain = false;

			// Superfluous elements appear after keydown
			// and before keyup, so the procedure is as follows:
			// 1. On first keydown mark all elements with
			// a specified tag name as non-superfluous.
			editable.attachListener( editable, 'keydown', function() {
				var body = doc.getBody(),
					retained = body.getElementsByTag( tagName );

				if ( !lockRetain ) {
					for ( var i = 0; i < retained.count(); i++ ) {
						retained.getItem( i ).setCustomData( 'retain', true );
					}
					lockRetain = true;
				}
			}, null, null, 1 );

			// 2. On keyup remove all elements that were not marked
			// as non-superfluous (which means they must have had appeared in the meantime).
			// Also we should preserve all temporary elements inserted by editor – otherwise we'd likely
			// leak fake selection's content into editable due to removing hidden selection container (http://dev.ckeditor.com/ticket/14831).
			editable.attachListener( editable, 'keyup', function() {
				var elements = doc.getElementsByTag( tagName );
				if ( lockRetain ) {
					if ( elements.count() == 1 && !elements.getItem( 0 ).getCustomData( 'retain' ) &&
						!elements.getItem( 0 ).hasAttribute( 'data-cke-temp' ) ) {
						elements.getItem( 0 ).remove( 1 );
					}
					lockRetain = false;
				}
			} );
		}
	}

	framedWysiwyg = CKEDITOR.tools.createClass( {
		$: function() {
			this.base.apply( this, arguments );

			this._.frameLoadedHandler = CKEDITOR.tools.addFunction( function( win ) {
				// Avoid opening design mode in a frame window thread,
				// which will cause host page scrolling.(http://dev.ckeditor.com/ticket/4397)
				CKEDITOR.tools.setTimeout( onDomReady, 0, this, win );
			}, this );

			this._.docTitle = this.getWindow().getFrame().getAttribute( 'title' );
		},

		base: CKEDITOR.editable,

		proto: {
			setData: function( data, isSnapshot ) {
                var editor = this.editor;

				if ( isSnapshot ) {
					this.setHtml( data );
					this.fixInitialSelection();

					// Fire dataReady for the consistency with inline editors
					// and because it makes sense. (http://dev.ckeditor.com/ticket/10370)
					editor.fire( 'dataReady' );
				}
				else {
					this._.isLoadingData = true;
					editor._.dataStore = { id: 1 };

					var config = editor.config,
						fullPage = config.fullPage,
						docType = config.docType;

					// Build the additional stuff to be included into <head>.
                    var headExtra = CKEDITOR.tools.buildStyleHtml( iframeCssFixes() ).replace( /<style>/, '<style data-cke-temp="1">' );

					if ( !fullPage )
						headExtra += CKEDITOR.tools.buildStyleHtml( editor.config.contentsCss );

					var baseTag = config.baseHref ? '<base href="' + config.baseHref + '" data-cke-temp="1" />' : '';

					if ( fullPage ) {
						// Search and sweep out the doctype declaration.
						data = data.replace( /<!DOCTYPE[^>]*>/i, function( match ) {
							editor.docType = docType = match;
							return '';
						} ).replace( /<\?xml\s[^\?]*\?>/i, function( match ) {
							editor.xmlDeclaration = match;
							return '';
						} );
					}

					// Get the HTML version of the data.
					data = editor.dataProcessor.toHtml( data );

					if ( fullPage ) {
						// Check if the <body> tag is available.
						if ( !( /<body[\s|>]/ ).test( data ) )
							data = '<body>' + data;

						// Check if the <html> tag is available.
						if ( !( /<html[\s|>]/ ).test( data ) )
							data = '<html>' + data + '</html>';

						// Check if the <head> tag is available.
						if ( !( /<head[\s|>]/ ).test( data ) )
							data = data.replace( /<html[^>]*>/, '$&<head><title></title></head>' );
						else if ( !( /<title[\s|>]/ ).test( data ) )
							data = data.replace( /<head[^>]*>/, '$&<title></title>' );

						// The base must be the first tag in the HEAD, e.g. to get relative
						// links on styles.
						baseTag && ( data = data.replace( /<head[^>]*?>/, '$&' + baseTag ) );

						// Inject the extra stuff into <head>.
						// Attention: do not change it before testing it well. (V2)
						// This is tricky... if the head ends with <meta ... content type>,
						// Firefox will break. But, it works if we place our extra stuff as
						// the last elements in the HEAD.
						data = data.replace( /<\/head\s*>/, headExtra + '$&' );

						// Add the DOCTYPE back to it.
						data = docType + data;
					} else {
						data = config.docType +
							'<html dir="' + config.contentsLangDirection + '"' +
								' lang="' + ( config.contentsLanguage || editor.langCode ) + '">' +
							'<head>' +
								'<title>' + this._.docTitle + '</title>' +
								baseTag +
								headExtra +
							'</head>' +
							'<body' + ( config.bodyId ? ' id="' + config.bodyId + '"' : '' ) +
								( config.bodyClass ? ' class="' + config.bodyClass + '"' : '' ) +
							'>' +
								data +
							'</body>' +
							'</html>';
					}

					if ( CKEDITOR.env.gecko ) {
						// Hack to make Fx put cursor at the start of doc on fresh focus.
						data = data.replace( /<body/, '<body contenteditable="true" ' );

						// Another hack which is used by onDomReady to remove a leading
						// <br> which is inserted by Firefox 3.6 when document.write is called.
						// This additional <br> is present because of contenteditable="true"
						if ( CKEDITOR.env.version < 20000 )
							data = data.replace( /<body[^>]*>/, '$&<!-- cke-content-start -->'  );
					}

					// The script that launches the bootstrap logic on 'domReady', so the document
					// is fully editable even before the editing iframe is fully loaded (http://dev.ckeditor.com/ticket/4455).
					var bootstrapCode =
						'<script id="cke_actscrpt" type="text/javascript"' + ( CKEDITOR.env.ie ? ' defer="defer" ' : '' ) + '>' +
							'var wasLoaded=0;' +	// It must be always set to 0 as it remains as a window property.
							'function onload(){' +
								'if(!wasLoaded)' +	// FF3.6 calls onload twice when editor.setData. Stop that.
									'window.parent.CKEDITOR.tools.callFunction(' + this._.frameLoadedHandler + ',window);' +
								'wasLoaded=1;' +
							'}' +
							( CKEDITOR.env.ie ? 'onload();' : 'document.addEventListener("DOMContentLoaded", onload, false );' ) +
                        '</script>';

					// For IE<9 add support for HTML5's elements.
					// Note: this code must not be deferred.
					if ( CKEDITOR.env.ie && CKEDITOR.env.version < 9 ) {
						bootstrapCode +=
							'<script id="cke_shimscrpt">' +
								'window.parent.CKEDITOR.tools.enableHtml5Elements(document)' +
							'</script>';
					}

					// IE<10 needs this hack to properly enable <base href="...">.
					// See: http://stackoverflow.com/a/13373180/1485219 (http://dev.ckeditor.com/ticket/11910).
					if ( baseTag && CKEDITOR.env.ie && CKEDITOR.env.version < 10 ) {
						bootstrapCode +=
							'<script id="cke_basetagscrpt">' +
								'var baseTag = document.querySelector( "base" );' +
								'baseTag.href = baseTag.href;' +
							'</script>';
                    }

					data = data.replace( /(?=\s*<\/(:?head)>)/, bootstrapCode );

					// Current DOM will be deconstructed by document.write, cleanup required.
					this.clearCustomData();
					this.clearListeners();

					editor.fire( 'contentDomUnload' );

                    var doc = this.getDocument();
                    
                    // CryptPad
                    var _iframe = window._iframe = iframe.$;
					var fw = this;
					_iframe.contentWindow.onload = function () {}
                    var intr = setInterval(function () {
                        //console.log(_iframe.contentWindow.document.body);
						if (!_iframe.contentWindow) { return; }
						if (!_iframe.contentWindow.document) { return; }
						if (_iframe.contentWindow.document.readyState !== 'complete') { return; }
						if (!_iframe.contentWindow.document.getElementsByTagName('title').length) { return; }
						clearInterval(intr);
						CKEDITOR.tools.callFunction(fw._.frameLoadedHandler, _iframe.contentWindow);
                    }, 10);
                    return;
				}
			},

			getData: function( isSnapshot ) {
				if ( isSnapshot )
					return this.getHtml();
				else {
					var editor = this.editor,
						config = editor.config,
						fullPage = config.fullPage,
						docType = fullPage && editor.docType,
						xmlDeclaration = fullPage && editor.xmlDeclaration,
						doc = this.getDocument();

					var data = fullPage ? doc.getDocumentElement().getOuterHtml() : doc.getBody().getHtml();

					// BR at the end of document is bogus node for Mozilla. (http://dev.ckeditor.com/ticket/5293).
					// Prevent BRs from disappearing from the end of the content
					// while enterMode is ENTER_BR (http://dev.ckeditor.com/ticket/10146).
					if ( CKEDITOR.env.gecko && config.enterMode != CKEDITOR.ENTER_BR )
						data = data.replace( /<br>(?=\s*(:?$|<\/body>))/, '' );

					data = editor.dataProcessor.toDataFormat( data );

					if ( xmlDeclaration )
						data = xmlDeclaration + '\n' + data;
					if ( docType )
						data = docType + '\n' + data;

					return data;
				}
			},

			focus: function() {
				if ( this._.isLoadingData )
					this._.isPendingFocus = true;
				else
					framedWysiwyg.baseProto.focus.call( this );
			},

			detach: function() {
				var editor = this.editor,
					doc = editor.document,
					iframe,
					onResize;

				// Trying to access window's frameElement property on Edge throws an exception
				// when frame was already removed from DOM. (http://dev.ckeditor.com/ticket/13850, http://dev.ckeditor.com/ticket/13790)
				try {
					iframe =  editor.window.getFrame();
				} catch ( e ) {}

				framedWysiwyg.baseProto.detach.call( this );

				// Memory leak proof.
				this.clearCustomData();
				doc.getDocumentElement().clearCustomData();
				CKEDITOR.tools.removeFunction( this._.frameLoadedHandler );

				// On IE, iframe is returned even after remove() method is called on it.
				// Checking if parent is present fixes this issue. (http://dev.ckeditor.com/ticket/13850)
				if ( iframe && iframe.getParent() ) {
					iframe.clearCustomData();
					onResize = iframe.removeCustomData( 'onResize' );
					onResize && onResize.removeListener();

					// IE BUG: When destroying editor DOM with the selection remains inside
					// editing area would break IE7/8's selection system, we have to put the editing
					// iframe offline first. (http://dev.ckeditor.com/ticket/3812 and http://dev.ckeditor.com/ticket/5441)
					iframe.remove();
				} else {
					CKEDITOR.warn( 'editor-destroy-iframe' );
				}
			}
		}
	} );

	function objectResizeDisabler( editor ) {
		if ( CKEDITOR.env.gecko ) {
			// FF allows to change resizing preferences by calling execCommand.
			try {
				var doc = editor.document.$;
				doc.execCommand( 'enableObjectResizing', false, !editor.config.disableObjectResizing );
				doc.execCommand( 'enableInlineTableEditing', false, !editor.config.disableNativeTableHandles );
			} catch ( e ) {}
		} else if ( CKEDITOR.env.ie && CKEDITOR.env.version < 11 && editor.config.disableObjectResizing ) {
			// It's possible to prevent resizing up to IE10.
			blockResizeStart( editor );
		}

		// Disables resizing by preventing default action on resizestart event.
		function blockResizeStart() {
			var lastListeningElement;

			// We'll attach only one listener at a time, instead of adding it to every img, input, hr etc.
			// Listener will be attached upon selectionChange, we'll also check if there was any element that
			// got listener before (lastListeningElement) - if so we need to remove previous listener.
			editor.editable().attachListener( editor, 'selectionChange', function() {
				var selectedElement = editor.getSelection().getSelectedElement();

				if ( selectedElement ) {
					if ( lastListeningElement ) {
						lastListeningElement.detachEvent( 'onresizestart', resizeStartListener );
						lastListeningElement = null;
					}

					// IE requires using attachEvent, because it does not work using W3C compilant addEventListener,
					// tested with IE10.
					selectedElement.$.attachEvent( 'onresizestart', resizeStartListener );
					lastListeningElement = selectedElement.$;
				}
			} );
		}

		function resizeStartListener( evt ) {
			evt.returnValue = false;
		}
	}

	function iframeCssFixes() {
		var css = [];

		// IE>=8 stricts mode doesn't have 'contentEditable' in effect
		// on element unless it has layout. (http://dev.ckeditor.com/ticket/5562)
		if ( CKEDITOR.document.$.documentMode >= 8 ) {
			css.push( 'html.CSS1Compat [contenteditable=false]{min-height:0 !important}' );

			var selectors = [];

			for ( var tag in CKEDITOR.dtd.$removeEmpty )
				selectors.push( 'html.CSS1Compat ' + tag + '[contenteditable=false]' );

			css.push( selectors.join( ',' ) + '{display:inline-block}' );
		}
		// Set the HTML style to 100% to have the text cursor in affect (http://dev.ckeditor.com/ticket/6341)
		else if ( CKEDITOR.env.gecko ) {
			css.push( 'html{height:100% !important}' );
			css.push( 'img:-moz-broken{-moz-force-broken-image-icon:1;min-width:24px;min-height:24px}' );
		}

		// http://dev.ckeditor.com/ticket/6341: The text cursor must be set on the editor area.
		// http://dev.ckeditor.com/ticket/6632: Avoid having "text" shape of cursor in IE7 scrollbars.
		css.push( 'html{cursor:text;*cursor:auto}' );

		// Use correct cursor for these elements
		css.push( 'img,input,textarea{cursor:default}' );

		return css.join( '\n' );
	}
});

/**
 * Disables the ability to resize objects (images and tables) in the editing area.
 *
 *		config.disableObjectResizing = true;
 *
 * **Note:** Because of incomplete implementation of editing features in browsers
 * this option does not work for inline editors (see ticket [#10197](http://dev.ckeditor.com/ticket/10197)),
 * does not work in Internet Explorer 11+ (see [#9317](http://dev.ckeditor.com/ticket/9317#comment:16) and
 * [IE11+ issue](https://connect.microsoft.com/IE/feedback/details/742593/please-respect-execcommand-enableobjectresizing-in-contenteditable-elements)).
 * In Internet Explorer 8-10 this option only blocks resizing, but it is unable to hide the resize handles.
 *
 * @cfg
 * @member CKEDITOR.config
 */
CKEDITOR.config.disableObjectResizing = false;

/**
 * Disables the "table tools" offered natively by the browser (currently
 * Firefox only) to perform quick table editing operations, like adding or
 * deleting rows and columns.
 *
 *		config.disableNativeTableHandles = false;
 *
 * @cfg
 * @member CKEDITOR.config
 */
CKEDITOR.config.disableNativeTableHandles = true;

/**
 * Disables the built-in spell checker if the browser provides one.
 *
 * **Note:** Although word suggestions provided natively by the browsers will
 * not appear in CKEditor's default context menu,
 * users can always reach the native context menu by holding the
 * *Ctrl* key when right-clicking if {@link #browserContextMenuOnCtrl}
 * is enabled or you are simply not using the
 * [context menu](http://ckeditor.com/addon/contextmenu) plugin.
 *
 *		config.disableNativeSpellChecker = false;
 *
 * @cfg
 * @member CKEDITOR.config
 */
CKEDITOR.config.disableNativeSpellChecker = true;

/**
 * Language code of  the writing language which is used to author the editor
 * content. This option accepts one single entry value in the format defined in the
 * [Tags for Identifying Languages (BCP47)](http://www.ietf.org/rfc/bcp/bcp47.txt)
 * IETF document and is used in the `lang` attribute.
 *
 *		config.contentsLanguage = 'fr';
 *
 * @cfg {String} [contentsLanguage=same value with editor's UI language]
 * @member CKEDITOR.config
 */

/**
 * The base href URL used to resolve relative and absolute URLs in the
 * editor content.
 *
 *		config.baseHref = 'http://www.example.com/path/';
 *
 * @cfg {String} [baseHref='']
 * @member CKEDITOR.config
 */

/**
 * Whether to automatically create wrapping blocks around inline content inside the document body.
 * This helps to ensure the integrity of the block *Enter* mode.
 *
 * **Note:** This option is deprecated. Changing the default value might introduce unpredictable usability issues and is
 * highly unrecommended.
 *
 *		config.autoParagraph = false;
 *
 * @deprecated
 * @since 3.6
 * @cfg {Boolean} [autoParagraph=true]
 * @member CKEDITOR.config
 */

/**
 * Fired when some elements are added to the document.
 *
 * @event ariaWidget
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 * @param {CKEDITOR.dom.element} data The element being added.
 */
