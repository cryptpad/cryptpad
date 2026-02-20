/**
 * @license TODO
 */

/**
 * @fileOverview TODO
 */

(function() {
	var localStorage = window.localStorage;
	if (!localStorage) {
		localStorage = {
			getItem: function(key) {
				return null;
			},
			setItem: function(key, value) {
			}
		};
	}
	var dynamicOptions = [
		'useReplacementTable',
		'recognizeUrlsAsYouType',
		'recognizeUrls',
		'replaceHyphensAsYouType',
		'replaceHyphens',
		'formatOrdinalsAsYouType',
		'formatOrdinals',
		'smartQuotesAsYouType',
		'smartQuotes',
		'createHorizontalRulesAsYouType',
		'createHorizontalRules',
		'formatBulletedListsAsYouType',
		'formatBulletedLists',
		'formatNumberedListsAsYouType',
		'formatNumberedLists'
	];
	var autocorrect = CKEDITOR.plugins.autocorrect = {
		getOption: function(key) {
			return CKEDITOR.config['autocorrect_' + key];
		},
		setOption: function(key, value) {
			localStorage.setItem('autocorrect_' + key, value);
			CKEDITOR.config['autocorrect_' + key] = value;
		}
	};

	var isBookmark = CKEDITOR.dom.walker.bookmark();

	function arrayToMap(array) {
		var map = {};
		for (var i = 0; i < array.length; i++)
			map[array[i]] = true;
		return map;
	}

	function loadOptions() {
		for (var i = 0; i < dynamicOptions.length; i++) {
			var key = dynamicOptions[i];
			var localValue = null;
			try {
				localValue = JSON.parse(localStorage.getItem('autocorrect_' + key));
			} catch (e) {}
			if (localValue !== null) {
				CKEDITOR.config['autocorrect_' + key] = localValue;
			}
		}
	}

	function CharacterIterator(range) {
		var walker = new CKEDITOR.dom.walker( range );
		walker.evaluator = function( node ) { return (node.type === CKEDITOR.NODE_TEXT && !isBookmark(node)) || (node.type === CKEDITOR.NODE_ELEMENT && node.getName() == 'br'); };
		walker.current = range.startContainer;
		this.walker = walker;
		this.referenceNode = range.startContainer;
		this.referenceCharacter = null;
		this.referenceCharacterOffset = range.startOffset;
	}

	CharacterIterator.prototype.nextCharacter = function() {
		// TODO
		return null;
	};

	CharacterIterator.prototype.previousCharacter = function() {
		while (this.referenceCharacterOffset === 0) {
			this.walker.current = this.referenceNode;
			this.referenceNode = this.walker.previous();
			if (!this.referenceNode)
				return null;
			if (this.referenceNode.type === CKEDITOR.NODE_ELEMENT && this.referenceNode.getName() == 'br')
				return null;
			this.referenceCharacterOffset = this.referenceNode.getText().length;
		}
		if (this.referenceCharacterOffset === 0)
			return null;
		this.referenceCharacter = this.referenceNode.getText()[--this.referenceCharacterOffset];
		// Sometimes Chrome inserts U+200B Zero Width Space
		// if (this.referenceCharacter == String.fromCharCode(8203))
		// 	return this.previousCharacter();
		return this.referenceCharacter;
	};

	CKEDITOR.plugins.add( 'autocorrect', {
		requires: 'menubutton',
		lang: 'en,ru',
		icons: 'autocorrect', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			var config = editor.config;
			var lang = editor.lang.autocorrect;
			loadOptions();
			editor.addCommand( 'autocorrect', {
				exec: function(editor) {
					editor.fire( 'saveSnapshot' );
					var selectedRange = editor.getSelection().getRanges().shift();
					var bookmark = selectedRange.createBookmark();

					var walkerRange;
					if (selectedRange.collapsed) {
						walkerRange = new CKEDITOR.dom.range(editor.editable());
						walkerRange.selectNodeContents(editor.editable());
					} else {
						walkerRange = selectedRange.clone();
					}

					var walker = new CKEDITOR.dom.walker( walkerRange );
					editor.editable().$.normalize();
					walker.evaluator = function( node ) { return node.type === CKEDITOR.NODE_TEXT && !isBookmark(node); };
					var node;
					while (node = walker.next()) {
						var next = getNext(node);
						var parent = getBlockParent(node);
						walker.current = correctTextNode(node, (parent.isBlockBoundary() && !next) || next && next.type === CKEDITOR.NODE_ELEMENT && next.getName() === 'br');
						if (parent.getName() === 'p' && !skipBreaks(next)) {
							correctParagraph(parent);
						}
					}

					editor.getSelection().selectBookmarks([bookmark]);
					editor.fire( 'saveSnapshot' );
				}
			} );

			var command = editor.addCommand('toggleAutocorrect', {
				preserveState: true,
				canUndo: false,

				exec: function( editor ) {
					this.setState(isEnabled() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON);
				}
			});

			var isEnabled = function() {
				return command.state === CKEDITOR.TRISTATE_ON;
			};

			var optionsCommand = editor.addCommand( 'autocorrectOptions', new CKEDITOR.dialogCommand( 'autocorrectOptions' ) );
			optionsCommand.canUndo = false;
			optionsCommand.readOnly = 1;

			CKEDITOR.dialog.add( 'autocorrectOptions', this.path + 'dialogs/options.js' );

			var menuGroup = 'autocorrectButton';
			editor.addMenuGroup( menuGroup );

			// combine menu items to render
			var uiMenuItems = {};

			// always added
			uiMenuItems.autoCorrectWhileTyping = {
				label: lang.disable,
				group: menuGroup,
				command: 'toggleAutocorrect'
			};

			uiMenuItems.autoCorrectNow = {
				label: lang.autocorrectNow,
				command: 'autocorrect',
				group: menuGroup
			};

			uiMenuItems.autocorrectOptions = {
				label: lang.options,
				command: 'autocorrectOptions',
				group: menuGroup
			};

			editor.addMenuItems( uiMenuItems );

			editor.ui.add( 'AutoCorrect', CKEDITOR.UI_MENUBUTTON, {
				label: lang.toolbar,
				modes: { wysiwyg: 1 },
				toolbar: 'spellchecker,20',
				onRender: function() {
					command.on( 'state', function() {
						this.setState( command.state );
					}, this );
				},
				onMenu: function() {
					editor.getMenuItem( 'autoCorrectWhileTyping' ).label = isEnabled() ? lang.disable : lang.enable;

					return {
						autoCorrectWhileTyping: CKEDITOR.TRISTATE_OFF,
						autoCorrectNow: CKEDITOR.TRISTATE_OFF,
						autocorrectOptions: CKEDITOR.TRISTATE_OFF
					};
				}
			});

			var showInitialState = function( evt ) {
				evt.removeListener();
				command.setState( config.autocorrect_enabled ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF );
			};

			editor.on( 'instanceReady', showInitialState );

			var isTyping = false;

			function getOption(key) {
				return autocorrect.getOption(isTyping ? key + 'AsYouType' : key);
			}

			function skipBreaks(node, isBackwards) {
				while (node && ((node.type == CKEDITOR.NODE_ELEMENT && node.getName() == 'br') || isBookmark(node))) {
					node = isBackwards ? node.getPrevious() : node.getNext();
				}
				return node;
			}

			function isWhitespace(ch) {
				return ch === ' ' || ch === ' ';
			}

			function isPunctuation(ch) {
				return ch === '.' || ch === ',' || ch === '!' || ch === '?' || ch === '/';
			}

			function isWordPart(ch) {
				return ch >= 'A' && ch <= 'Z'
					|| ch >= 'a' && ch <= 'z'
					|| ch >= 'а' && ch <= 'я'
					|| ch >= 'А' && ch <= 'Я'
					|| ch == 'ё' || ch == 'Ё'
					|| ch >= '0' && ch <= '9';
			}

			function isPairOpenCharacter(ch) {
				return ch == '"' || ch == '\'' || ch == '«' || ch == '‘' || ch == '“' || ch == '„' || ch == '(' || ch == '[' || ch == '{';
			}

			function isPairClosingCharacter(ch) {
				return ch == '"' || ch == '\'' || ch == '»' || ch == '’' || ch == '”' || ch == '“' || ch == ')' || ch == ']' || ch == '}';
			}

			var hyperlinkExcludedTail = arrayToMap(['.', ',', '?', '!', ':', '(', ')', '[', ']', '{', '}', '"', '\'', '‘', '’', '“', '”', '«', '»', '<', '>']);
			function isHyperlinkExcludedTail(ch) {
				return ch in hyperlinkExcludedTail;
			}

			function moveCursorIntoTextNode(cursor) {
				if (cursor.startContainer.type == CKEDITOR.NODE_ELEMENT) {
					var rawStartNode = cursor.startContainer.getChild(cursor.startOffset);
					var startOffset = 0;
					// Skip ending <br>'s in Firefox, skip bookmark
					var startNode = skipBreaks(rawStartNode, true);
					if (startNode) {
						if (startNode != rawStartNode) {
							// We moved outside bookmark to the end of previous text node
							startOffset = startNode.getText().length;
						}
						while (startNode.type == CKEDITOR.NODE_ELEMENT) {
							startNode = startNode.getFirst();
						}
					} else {
						startNode = new CKEDITOR.dom.text('');
						cursor.insertNode(startNode);
					}
					cursor.setStart(startNode, startOffset);
					cursor.collapse(true);
				}
			}

			function correctOnInput(cursor) {
				moveCursorIntoTextNode(cursor);
				var input = cursor.startContainer.getText().substring(cursor.startOffset-1, cursor.startOffset);

				if (getOption('replaceHyphens') && isPairOpenCharacter(input))
					replaceHyphenPairInWord(cursor, input);

				if (getOption('smartQuotes') && replaceDoubleQuote(cursor, input))
					return;

				if (getOption('smartQuotes') && replaceSingleQuote(cursor, input))
					return;

				if (isWhitespace(input))
					autoCorrectOnWhitespace(cursor, input);

				if (isPunctuation(input) || isWhitespace(input))
					autoCorrectOnDelimiter(cursor, input);
			}

			function correctOnEnter(cursor) {
				moveCursorIntoTextNode(cursor);

				if (getOption('replaceHyphens'))
					replaceHyphens(cursor, '');

				autoCorrectOnDelimiter(cursor, '');
			}

			function correctTextNode(node, isBlockEnding) {
				var cursor = new CKEDITOR.dom.range(editor.editable());
				cursor.setStart(node, 0);
				cursor.collapse(true);
				while (cursor.startOffset < cursor.startContainer.getText().length) {
					cursor.setStart(cursor.startContainer, cursor.startOffset + 1);
					cursor.setEnd(cursor.startContainer, cursor.startOffset);
					correctOnInput(cursor);
					if (isBlockEnding && cursor.endOffset == cursor.startContainer.getText().length) {
						// "Emulate" Enter key
						correctOnEnter(cursor);
					}
				}
				return cursor.startContainer;

			}

			function correctParagraph(p) {
				if (!p)
					return;

				// FIXME this way is wrong
				var content = p.getText();

				if (getOption('createHorizontalRules'))
					insertHorizontalRule(p, content);
			}

			function getNext(node) {
				var next = node.getNext();
				while (next && isBookmark(next)) {
					next = next.getNext();
				}
				return next;
			}

			function replaceRangeContent(range, data) {
				var walker = new CKEDITOR.dom.walker( range );
				walker.evaluator = function( node ) { return node.type === CKEDITOR.NODE_ELEMENT && isBookmark(node); };
				var bm;
				var bookmarks = [];
				while (bm = walker.next()) {
					bookmarks.push(bm);
				}
				range.deleteContents();
				for (var i = 0; i < bookmarks.length; i++) {
					range.insertNode(bookmarks[i]);
				}
				range.insertNode(new CKEDITOR.dom.text(data));
			}

			function replaceHyphenPairInWord(cursor, input) {
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				if (input && !iterator.previousCharacter())
					return;

				var hypenPairRange = new CKEDITOR.dom.range(editor.editable());

				var needle = '--';
				var charAfterHypens = input;

				var ch;
				var i = needle.length - 1;
				while ((ch = iterator.previousCharacter()) && !isWhitespace(ch)) {
					if (ch == needle[i]) {
						if (i == needle.length - 1)
							hypenPairRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset + 1);
						i--;
						if (i < 0)
							break;
					} else {
						charAfterHypens = ch;
						i = needle.length - 1;
					}
				}
				if (i >= 0)
					return false;

				if (charAfterHypens && !(isWhitespace(charAfterHypens) || isWordPart(charAfterHypens) || isPairOpenCharacter(charAfterHypens)))
					return false;

				hypenPairRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);

				var charBeforeHypens = iterator.previousCharacter();

				if (!charBeforeHypens || !(isWordPart(charBeforeHypens) || isPairClosingCharacter(charBeforeHypens)))
					return false;

				beforeReplace();
				var bookmark = cursor.createBookmark();
				replaceRangeContent(hypenPairRange, '—');
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();
			}

			function replaceHyphens(cursor, input) {
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				if (input && !iterator.previousCharacter())
					return;

				var hypensRange = new CKEDITOR.dom.range(editor.editable());
				hypensRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);

				var leftChar = iterator.previousCharacter();
				if (leftChar !== '-')
					return false;

				hypensRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);
				var charBeforeHyphen = iterator.previousCharacter();
				if (charBeforeHyphen == '-') {
					hypensRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);
					charBeforeHyphen = iterator.previousCharacter();
				}

				if (!isWhitespace(charBeforeHyphen))
					return false;

				var dash = config.autocorrect_dash;
				beforeReplace();
				var bookmark = cursor.createBookmark();
				replaceRangeContent(hypensRange, dash);
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();
			}

			function autoCorrectOnWhitespace(cursor, inputChar) {
				if (getOption('formatBulletedLists') && formatBulletedList(cursor, inputChar))
					return;

				if (getOption('formatNumberedLists') && formatNumberedList(cursor, inputChar))
					return;

				if (getOption('replaceHyphens'))
					replaceHyphens(cursor, inputChar);
			}

			function autoCorrectOnDelimiter(cursor, delimiter) {
				if (getOption('recognizeUrls') && formatHyperlink(cursor, delimiter))
					return;

				if (config.autocorrect_useReplacementTable)
					replaceSequence(cursor, delimiter);

				if (getOption('formatOrdinals'))
					formatOrdinals(cursor, delimiter);

				if (getOption('replaceHyphens'))
					replaceHyphenPairInWord(cursor, delimiter);
			}

			var bookmark;
			function beforeReplace() {
				if (!isTyping)
					return;
				editor.fire( 'saveSnapshot' );
				bookmark = editor.getSelection().getRanges().shift().createBookmark();
			}

			function afterReplace() {
				if (!isTyping)
					return;
				editor.getSelection().selectBookmarks([bookmark]);
				editor.fire( 'saveSnapshot' );
			}

			var replacementTable = config.autocorrect_replacementTable;
			function replaceSequence(cursor, input) {
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				if (input && !iterator.previousCharacter())
					return;

				var replacement;
				var match;
				var matchRange = new CKEDITOR.dom.range(editor.editable());
				matchRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);
				var sequence = '';
				var ch;
				while ((ch = iterator.previousCharacter()) && !isWhitespace(ch)) {
					sequence = ch + sequence;
					if (sequence in replacementTable) {
						match = sequence;
						replacement = replacementTable[match];
						matchRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);
					}
				}

				if (!replacement)
					return false;

				beforeReplace();
				var bookmark = cursor.createBookmark();
				replaceRangeContent(matchRange, replacement);
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();

				return true;
			}

			var urlRe = /^(http:|https:|ftp:|mailto:|tel:|skype:|www\.).+$/i;
			function formatHyperlink(cursor, input) {
				if (isPunctuation(input))
					return;
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				if (input && !iterator.previousCharacter())
					return;

				var matchRange = new CKEDITOR.dom.range(editor.editable());
				matchRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);
				var tail = true;
				var match = '';
				var ch;
				while ((ch = iterator.previousCharacter()) && ch != ' ' && ch != ' ') {
					// exclude trailing punctuation
					if (tail && isHyperlinkExcludedTail(ch)) {
						matchRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);
						continue;
					}
					match = ch + match;
					tail = false;
					matchRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);
				}

				match = match.match(urlRe);

				if (!match)
					return false;

				var url = match[0];
				var href = match[1].toLowerCase() === 'www.' ? 'http://' + url : url;

				beforeReplace();
				var bookmark = cursor.createBookmark();
				var attributes = {'data-cke-saved-href': href, href: href};
				var style = new CKEDITOR.style({ element: 'a', attributes: attributes } );
				style.type = CKEDITOR.STYLE_INLINE; // need to override... dunno why.
				style.applyToRange( matchRange );
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();

				return true;
			}

			var suffixes = {'st': true, 'nd': true, 'rd': true, 'th': true};
			function formatOrdinals(cursor, delimiter) {
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				if (delimiter && !iterator.previousCharacter())
					return;

				var suffixRange = new CKEDITOR.dom.range(editor.editable());
				suffixRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);
				var suffix = '';
				var ch;
				for (var i = 0; i < 2; i++) {
					ch = iterator.previousCharacter();
					if (!ch)
						break;
					suffix = ch + suffix;
				}
				if (!(suffix in suffixes))
					return false;
				suffixRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);

				var number = '';
				while (ch = iterator.previousCharacter()) {
					if (ch >= '0' && ch <= '9')
						number = ch + number;
					else if (isWordPart(ch))
						return false;
					else
						break;
				}

				var n = number % 100;
				if (n > 9 && n < 20) {
					if (suffix !== 'th')
						return false;
				} else {
					n = number % 10;
					if (n == 1) {
						if (suffix !== 'st')
							return false;
					} else if (n == 2) {
						if (suffix !== 'nd')
							return false;
					} else if (n == 3) {
						if (suffix !== 'rd')
							return false;
					} else if (suffix !== 'th')
						return false;
				}

				beforeReplace();
				var bookmark = cursor.createBookmark();
				var style = new CKEDITOR.style({ element: 'sup' } );
				style.applyToRange( suffixRange );
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();

				return true;
			}

			var horizontalRuleRe = /^(-{3,}|_{3,})$/;
			function insertHorizontalRule(parent, content) {
				var match = content.match(horizontalRuleRe);
				if (!match)
					return false;

				var hr = editor.document.createElement( 'hr' );
				hr.replace(parent);

				return true;
			}

			var bulletedListMarkers = arrayToMap(['*', '+', '•']);
			function formatBulletedList(cursor, input) {
				var parent = getBlockParent(cursor.startContainer);

				if (parent.getName() !== 'p')
					return;

				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				var markerRange = new CKEDITOR.dom.range(editor.editable());
				markerRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);

				if (input && !iterator.previousCharacter())
					return;

				var marker = iterator.previousCharacter();

				if (!marker || !(marker in bulletedListMarkers))
					return false;

				markerRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);

				if (iterator.previousCharacter())
					return false;

				var previous = parent.getPrevious();

				beforeReplace();
				var bookmark = cursor.createBookmark();
				markerRange.deleteContents();
				if (!isTyping && previous && previous.type == CKEDITOR.NODE_ELEMENT && previous.getName() == 'ul') {
					appendContentsToList(parent, previous);
				} else {
					replaceContentsWithList([parent], 'ul', null);
				}
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();

				return true;
			}

			function formatNumberedList(cursor, input) {
				var parent = getBlockParent(cursor.startContainer);

				if (parent.getName() !== 'p')
					return;

				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				var markerRange = new CKEDITOR.dom.range(editor.editable());
				markerRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);

				if (input && !iterator.previousCharacter())
					return;

				var delimiter = iterator.previousCharacter();
				if (!(delimiter in {'.': true, ')': true}))
					return false;

				var start = '';
				var ch;
				while ((ch = iterator.previousCharacter()) && ch != ' ' && ch != ' ') {
					start = ch + start;
					markerRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);
				}

				var type;
				if (start.match(/^[0-9]+$/))
					type = '1';
				else if (start.match(/^[ivxlcdm]+$/))
					type = 'i';
				else if (start.match(/^[IVXLCDM]+$/))
					type = 'I';
				else if (start.match(/^[a-z]$/))
					type = 'a';
				else if (start.match(/^[A-Z]$/))
					type = 'A';
				else
					return false;

				if (iterator.previousCharacter())
					return false;

				var startNumber = toNumber(start, type);

				parent = getBlockParent(cursor.startContainer);
				var previous = parent.getPrevious();

				beforeReplace();
				var bookmark = cursor.createBookmark();
				markerRange.deleteContents();
				if (!isTyping && previous && previous.type == CKEDITOR.NODE_ELEMENT && previous.getName() == 'ol' && previous.getAttribute('type') == type && getLastNumber(previous) == startNumber - 1) {
					appendContentsToList(parent, previous);
				} else {
					var attributes = startNumber === 1 ? {type: type} : {type: type, start: startNumber};
					replaceContentsWithList([parent], 'ol', attributes);
				}
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();

				return true;
			}

			var doubleQuotes = config.autocorrect_doubleQuotes;
			function replaceDoubleQuote(cursor, input) {
				if (input !== '"')
					return false;

				replaceQuote(cursor, doubleQuotes);
				return true;
			}

			var singleQuotes = config.autocorrect_singleQuotes;
			function replaceSingleQuote(cursor, input) {
				if (input !== '\'')
					return false;

				replaceQuote(cursor, singleQuotes);
				return true;
			}

			function replaceQuote(cursor, quotes) {
				var iteratorRange = new CKEDITOR.dom.range(editor.editable());
				iteratorRange.selectNodeContents(getBlockParent(cursor.startContainer));
				var iterator = new CharacterIterator(iteratorRange);
				iterator.referenceNode = cursor.startContainer;
				iterator.referenceCharacterOffset = cursor.startOffset;

				var quoteRange = new CKEDITOR.dom.range(editor.editable());
				quoteRange.setEnd(iterator.referenceNode, iterator.referenceCharacterOffset);
				iterator.previousCharacter();
				quoteRange.setStart(iterator.referenceNode, iterator.referenceCharacterOffset);

				var leftChar = iterator.previousCharacter();

				var isClosingQuote = leftChar ? '  –—([{'.indexOf(leftChar) < 0 : false;
				var replacement = quotes[Number(isClosingQuote)];

				beforeReplace();
				var bookmark = cursor.createBookmark();
				replaceRangeContent(quoteRange, replacement);
				cursor.moveToBookmark(bookmark);
				moveCursorIntoTextNode(cursor);
				afterReplace();
			}

			function getBlockParent(node) {
				while (node && (node.type !== CKEDITOR.NODE_ELEMENT || (node.getName() in CKEDITOR.dtd.$inline || node.getName() in CKEDITOR.dtd.$empty ))) {
					node = node.getParent();
				}
				return node;
			}

			function getLastNumber(list) {
				return list.$.start + list.getChildCount() - 1;
			}

			function replaceContentsWithList(listContents, type, attributes) {
				// Insert the list to the DOM tree.
				var insertAnchor = listContents[ listContents.length - 1 ].getNext(),
					listNode = editor.document.createElement( type );

				var commonParent = listContents[0].getParent();

				var contentBlock;

				while ( listContents.length ) {
					contentBlock = listContents.shift();
					appendContentsToList(contentBlock, listNode);
				}

				// Apply list root dir only if it has been explicitly declared.
				// if ( listDir && explicitDirection )
				// 	listNode.setAttribute( 'dir', listDir );

				if (attributes)
					listNode.setAttributes(attributes);

				if ( insertAnchor )
					listNode.insertBefore( insertAnchor );
				else
					listNode.appendTo( commonParent );
			}

			function appendContentsToList(contentBlock, listNode) {
				var listItem = editor.document.createElement( 'li' );

				// If current block should be preserved, append it to list item instead of
				// transforming it to <li> element.
				if ( false /*shouldPreserveBlock( contentBlock )*/ )
					contentBlock.appendTo( listItem );
				else {
					contentBlock.copyAttributes( listItem );
					// Remove direction attribute after it was merged into list root. (#7657)
					/*if ( listDir && contentBlock.getDirection() ) {
						listItem.removeStyle( 'direction' );
						listItem.removeAttribute( 'dir' );
					}*/
					contentBlock.moveChildren( listItem );
					contentBlock.remove();
				}

				listItem.appendTo( listNode );
			}

			function characterPosition(character) {
				var alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				return alpha.indexOf(character) + 1;
			}

			function toArabic(number) {
				if (!number) return 0;
				if (number.substring(0, 1) == "M") return 1000 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "CM") return 900 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "D") return 500 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "CD") return 400 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "C") return 100 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "XC") return 90 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "L") return 50 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "XL") return 40 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "X") return 10 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "IX") return 9 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "V") return 5 + toArabic(number.substring(1));
				if (number.substring(0, 2) == "IV") return 4 + toArabic(number.substring(2));
				if (number.substring(0, 1) == "I") return 1 + toArabic(number.substring(1));
			}

			function toNumber(start, type) {
				switch (type) {
					case '1':
						return start|0;
					case 'i':
						return toArabic(start.toUpperCase());
					case 'I':
						return toArabic(start);
					case 'a':
						return characterPosition(start.toUpperCase());
					case 'A':
						return characterPosition(start);
				}
			}

			editor.on( 'key', function( event ) {
				if (event.data.keyCode != 2228237 && event.data.keyCode != 13)
					return;
				if (!isEnabled())
					return;
				if (editor.mode !== 'wysiwyg')
					return;

				var cursor = editor.getSelection().getRanges().shift();
				var paragraph = null;

				if (event.data.keyCode === 13) {
					var parent = getBlockParent(cursor.startContainer);
					if (parent.getName() === 'p') {
						paragraph = parent;
					}
				}

				setTimeout(function() {
					isTyping = true;
					correctOnEnter(cursor);
					correctParagraph(paragraph);
					isTyping = false;
				});
			});

			editor.on( 'contentDom', function() {
				editor.editable().on( 'keypress', function( event ) {
					if ( event.data.$.charCode === 0 )
						return;
					if (!isEnabled())
						return;

					setTimeout(function() {
						isTyping = true;
						var cursor = editor.getSelection().getRanges().shift();
						correctOnInput(cursor);
						isTyping = false;
					});
				});
			});
		}
	});

})();


/**
 * 
 *
 * @cfg
 * @member CKEDITOR.config
 */
CKEDITOR.config.autocorrect_enabled = true;
// language specific
CKEDITOR.config.autocorrect_replacementTable = {"-->": "→", "-+": "∓", "->": "→", "...": "…", "(c)": "©", "(e)": "€", "(r)": "®", "(tm)": "™", "(o)": "˚", "+-": "±", "<-": "←", "<--": "←", "<-->": "↔", "<->": "↔", "<<": "«", ">>": "»", "~=": "≈", "1/2": "½", "1/4": "¼", "3/4": "¾"};

CKEDITOR.config.autocorrect_useReplacementTable = true;

CKEDITOR.config.autocorrect_recognizeUrlsAsYouType = true;

CKEDITOR.config.autocorrect_recognizeUrls = true;
// language specific
CKEDITOR.config.autocorrect_dash = '–';

CKEDITOR.config.autocorrect_replaceHyphensAsYouType = true;

CKEDITOR.config.autocorrect_replaceHyphens = true;

CKEDITOR.config.autocorrect_formatOrdinalsAsYouType = true;

CKEDITOR.config.autocorrect_formatOrdinals = true;

// language specific
CKEDITOR.config.autocorrect_singleQuotes = "‘’";

CKEDITOR.config.autocorrect_smartQuotesAsYouType = true;

CKEDITOR.config.autocorrect_smartQuotes = true;
// language specific
CKEDITOR.config.autocorrect_doubleQuotes = "“”";

CKEDITOR.config.autocorrect_createHorizontalRulesAsYouType = true;

CKEDITOR.config.autocorrect_createHorizontalRules = true;

CKEDITOR.config.autocorrect_formatBulletedListsAsYouType = true;

CKEDITOR.config.autocorrect_formatBulletedLists = true;

CKEDITOR.config.autocorrect_formatNumberedListsAsYouType = true;

CKEDITOR.config.autocorrect_formatNumberedLists = true;

// XXX table autocreation?
// XXX upper first word of a sentense?