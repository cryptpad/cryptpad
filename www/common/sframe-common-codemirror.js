define([
    'jquery',
    '/common/modes.js',
    '/common/themes.js',
    '/customize/messages.js',
    '/common/common-ui-elements.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/text-cursor.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function ($, Modes, Themes, Messages, UIElements, Hash, Util, TextCursor, ChainPad) {
    var module = {};

    var cursorToPos = function(cursor, oldText) {
        var cLine = cursor.line;
        var cCh = cursor.ch;
        var pos = 0;
        var textLines = oldText.split("\n");
        for (var line = 0; line <= cLine; line++) {
            if(line < cLine) {
                pos += textLines[line].length+1;
            }
            else if(line === cLine) {
                pos += cCh;
            }
        }
        return pos;
    };

    var posToCursor = function(position, newText) {
        var cursor = {
            line: 0,
            ch: 0
        };
        var textLines = newText.substr(0, position).split("\n");
        cursor.line = textLines.length - 1;
        cursor.ch = textLines[cursor.line].length;
        return cursor;
    };

    module.setValueAndCursor = function (editor, oldDoc, remoteDoc) {
        var scroll = editor.getScrollInfo();
        //get old cursor here
        var oldCursor = {};
        oldCursor.selectionStart = cursorToPos(editor.getCursor('from'), oldDoc);
        oldCursor.selectionEnd = cursorToPos(editor.getCursor('to'), oldDoc);

        editor.setValue(remoteDoc);
        editor.save();

        var ops = ChainPad.Diff.diff(oldDoc, remoteDoc);
        var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
            return TextCursor.transformCursor(oldCursor[attr], ops);
        });

        if(selects[0] === selects[1]) {
            editor.setCursor(posToCursor(selects[0], remoteDoc));
        }
        else {
            editor.setSelection(posToCursor(selects[0], remoteDoc), posToCursor(selects[1], remoteDoc));
        }

        editor.scrollTo(scroll.left, scroll.top);
    };

    module.getHeadingText = function (editor) {
        var lines = editor.getValue().split(/\n/);

        var text = '';
        lines.some(function (line) {
            // lines including a c-style comment are also valuable
            var clike = /^\s*(\/\*|\/\/)(.*)?(\*\/)*$/;
            if (clike.test(line)) {
                line.replace(clike, function (a, one, two) {
                    if (!(two && two.replace)) { return; }
                    text = two.replace(/\*\/\s*$/, '').trim();
                });
                return true;
            }

            // lisps?
            var lispy = /^\s*(;|#\|)+(.*?)$/;
            if (lispy.test(line)) {
                line.replace(lispy, function (a, one, two) {
                    text = two;
                });
                return true;
            }

            // lines beginning with a hash are potentially valuable
            // works for markdown, python, bash, etc.
            var hash = /^#+(.*?)$/;
            if (hash.test(line)) {
                line.replace(hash, function (a, one) {
                    text = one;
                });
                return true;
            }

            // TODO make one more pass for multiline comments
        });

        return text.trim();
    };

    module.create = function (defaultMode, CMeditor) {
        var exp = {};

        var CodeMirror = exp.CodeMirror = CMeditor;
        CodeMirror.modeURL = "cm/mode/%N/%N";

        var $pad = $('#pad-iframe');
        var $textarea = exp.$textarea = $('#editor1');
        if (!$textarea.length) { $textarea = exp.$textarea = $pad.contents().find('#editor1'); }

        var Title;
        var onLocal = function () {};
        var $rightside;
        var $drawer;
        exp.init = function (local, title, toolbar) {
            if (typeof local === "function") {
                onLocal = local;
            }
            Title = title;
            $rightside = toolbar.$rightside;
            $drawer = toolbar.$drawer;
        };

        var editor = exp.editor = CMeditor.fromTextArea($textarea[0], {
            lineNumbers: true,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets : true,
            showTrailingSpace : true,
            styleActiveLine : true,
            search: true,
            highlightSelectionMatches: {showToken: /\w+/},
            extraKeys: {"Shift-Ctrl-R": undefined},
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            mode: defaultMode || "javascript",
            readOnly: true
        });
        editor.focus();

        var setMode = exp.setMode = function (mode, cb) {
            exp.highlightMode = mode;
            if (mode === 'markdown') { mode = 'gfm'; }
            if (mode !== "text") {
                CMeditor.autoLoadMode(editor, mode);
            }
            editor.setOption('mode', mode);
            if (exp.$language) {
                var name = exp.$language.find('a[data-value="' + mode + '"]').text() || undefined;
                name = name ? Messages.languageButton + ' ('+name+')' : Messages.languageButton;
                exp.$language.setValue(mode, name);
            }
            if(cb) { cb(mode); }
        };

        var setTheme = exp.setTheme = (function () {
            var path = '/common/theme/';

            var $head = $(window.document.head);

            var themeLoaded = exp.themeLoaded = function (theme) {
                return $head.find('link[href*="'+theme+'"]').length;
            };

            var loadTheme = exp.loadTheme = function (theme) {
                $head.append($('<link />', {
                    rel: 'stylesheet',
                    href: path + theme + '.css',
                }));
            };

            return function (theme, $select) {
                if (!theme) {
                    editor.setOption('theme', 'default');
                } else {
                    if (!themeLoaded(theme)) {
                        loadTheme(theme);
                    }
                    editor.setOption('theme', theme);
                }
                if ($select) {
                    var name = theme || undefined;
                    name = name ? Messages.themeButton + ' ('+theme+')' : Messages.themeButton;
                    $select.setValue(theme, name);
                }
            };
        }());

        exp.getHeadingText = function () {
            return module.getHeadingText(editor);
        };

        exp.configureLanguage = function (Common, cb, onModeChanged) {
            var options = [];
            Modes.list.forEach(function (l) {
                options.push({
                    tag: 'a',
                    attributes: {
                        'data-value': l.mode,
                        'href': '#',
                    },
                    content: l.language // Pretty name of the language value
                });
            });
            var dropdownConfig = {
                text: Messages.languageButton, // Button initial text
                options: options, // Entries displayed in the menu
                left: true, // Open to the left of the button
                isSelect: true,
                feedback: 'CODE_LANGUAGE',
                common: Common
            };
            var $block = exp.$language = UIElements.createDropdown(dropdownConfig);
            $block.find('button').attr('title', Messages.languageButtonTitle);
            $block.find('a').click(function () {
                setMode($(this).attr('data-value'), onModeChanged);
                onLocal();
            });

            if ($drawer) { $drawer.append($block); }
            if (exp.highlightMode) { exp.setMode(exp.highlightMode); }
            if (cb) { cb(); }
        };

        exp.configureTheme = function (Common, cb) {
            /*  Remember the user's last choice of theme using localStorage */
            var themeKey = ['codemirror', 'theme'];

            var todo = function (err, lastTheme) {
                lastTheme = lastTheme || 'default';
                var options = [];
                Themes.forEach(function (l) {
                    options.push({
                        tag: 'a',
                        attributes: {
                            'data-value': l.name,
                            'href': '#',
                        },
                        content: l.name // Pretty name of the language value
                    });
                });
                var dropdownConfig = {
                    text: 'Theme', // Button initial text
                    options: options, // Entries displayed in the menu
                    left: true, // Open to the left of the button
                    isSelect: true,
                    initialValue: lastTheme,
                    feedback: 'CODE_THEME',
                    common: Common
                };
                var $block = exp.$theme = UIElements.createDropdown(dropdownConfig);
                $block.find('button').attr('title', Messages.themeButtonTitle);

                setTheme(lastTheme, $block);

                $block.find('a').click(function () {
                    var theme = $(this).attr('data-value');
                    setTheme(theme, $block);
                    Common.setAttribute(themeKey, theme);
                });

                if ($drawer) { $drawer.append($block); }
                if (cb) { cb(); }
            };
            Common.getAttribute(themeKey, todo);
        };

        exp.getContentExtension = function () {
            return (Modes.extensionOf(exp.highlightMode) || '.txt').slice(1);
        };
        exp.fileExporter = function () {
            return new Blob([ editor.getValue() ], { type: 'text/plain;charset=utf-8' });
        };
        exp.fileImporter = function (content, file) {
            var $toolbarContainer = $('#cme_toolbox');
            var mime = CodeMirror.findModeByMIME(file.type);
            var mode;
            if (!mime) {
                var ext = /.+\.([^.]+)$/.exec(file.name);
                if (ext[1]) {
                    mode = CMeditor.findModeByExtension(ext[1]);
                    mode = mode && mode.mode || null;
                }
            } else {
                mode = mime && mime.mode || null;
            }
            if (mode && Modes.list.some(function (o) { return o.mode === mode; })) {
                exp.setMode(mode);
                $toolbarContainer.find('#language-mode').val(mode);
            } else {
                console.log("Couldn't find a suitable highlighting mode: %s", mode);
                exp.setMode('text');
                $toolbarContainer.find('#language-mode').val('text');
            }
            return { content: content };
        };

        exp.setValueAndCursor = function (oldDoc, remoteDoc) {
            return module.setValueAndCursor(editor, oldDoc, remoteDoc);
        };

        /////

        var canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };



        exp.contentUpdate = function (newContent) {
            var oldDoc = canonicalize(editor.getValue());
            var remoteDoc = newContent.content;
            // setValueAndCursor triggers onLocal, even if we don't make any change to the content
            // and it may revert other changes (metadata)
            if (oldDoc === remoteDoc) { return; }
            exp.setValueAndCursor(oldDoc, remoteDoc);
        };

        exp.getContent = function () {
            editor.save();
            return { content: canonicalize(editor.getValue()) };
        };

        exp.mkFileManager = function (framework) {
            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var src = Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + key + '"></media-tag>';
                    editor.replaceSelection(mt);
                }
            };
            framework._.sfCommon.createFileManager(fmConfig);
        };

        return exp;
    };

    return module;
});

