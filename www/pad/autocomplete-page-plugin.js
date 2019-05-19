( function() {
	// For simplicity we define the plugin in the sample, but normally
	// it would be extracted to a separate file.
	CKEDITOR.plugins.add( 'cryptpadautocomplete', {
  		requires: 'autocomplete,textmatch',
  		init: function(editor) {
		  editor.on( 'instanceReady', function() {
			var config = {};
			var view = new CKEDITOR.plugins.autocomplete.view(editor);
                        var autocomplete;
                        var caretRect;
                        var selectionRange;

			// Called when the user types in the editor or moves the caret.
			// The range represents the caret position.
			function textTestCallback( range ) {
				// You do not want to autocomplete a non-empty selection.
				if ( !range.collapsed ) {
					return null;
				}

                                CKEDITOR.plugins.autocomplete.selectionRange = range;
                                caretRect = view.getViewPosition( range );
				// Use the text match plugin which does the tricky job of performing
				// a text search in the DOM. The "matchCallback" function should return
				// a matching fragment of the text.
				return CKEDITOR.plugins.textMatch.match( range, matchCallback );
                                return result;
			}

			// Returns the position of the matching text.
			// It matches a word starting from the '#' character
			// up to the caret position.
			function matchCallback( text, offset ) {
				// Get the text before the caret.
				var left = text.slice( 0, offset ),
					// Will look for a '#' character followed by a ticket number.
					matchAt = left.match( /@\d*$/ );
					matchSlash = left.match( /\/\d*$/ );

				if ( !matchAt && !matchSlash ) {
					return null;
				}
                                // we match, but we can't use the remaining of autocomplete
				var pickerCfg = {
                    			types: (matchSlash) ? ['file'] : [],
                    			where: ['root'],
					classes: 'sbox-filePicker-iframe-inplace',
                                        caretRect : caretRect,
                                        inplace : true,
					link : (matchSlash) ? false : true
                		};
                		window.APP.framework._.sfCommon.openFilePicker(pickerCfg);
				return null; 
			}

			config.textTestCallback = textTestCallback;

			// Returns (through its callback) the suggestions for the current query.
			function dataCallback( matchInfo, callback ) {
			}

			config.dataCallback = dataCallback;

			// Define the templates of the autocomplete suggestions dropdown and output text.
			config.itemTemplate = '<li data-id="{id}" class="issue-{type}">#{id}: {name}</li>';
			config.outputTemplate = '<a href="https://github.com/ckeditor/ckeditor-dev/issues/{id}">{name} (#{id})</a> ';

			// Attach autocomplete to the editor.
			autocomplete = new CKEDITOR.plugins.autocomplete( editor, config );
			});
		    } 
                });
})();
