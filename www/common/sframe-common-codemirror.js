define([
    'jquery',
    '/common/modes.js',
    '/common/themes.js', // XXX remove
    '/customize/messages.js',
    '/common/common-ui-elements.js',
    '/common/inner/common-mediatag.js',
    '/common/common-hash.js',
    '/common/common-util.js',
    '/common/text-cursor.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/lib/cm6.js',
], function ($, Modes, Themes, Messages, UIElements, MT, Hash, Util, TextCursor, ChainPad) {
    var module = {};

    module.CODEMIRROR_DEFAULT_FONT_SIZE = 16;

    var cursorToPos = module.cursorToPos = function(cursor, oldText) {
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

    var posToCursor = module.posToCursor = function(position, newText) {
        var cursor = {
            line: 0,
            ch: 0
        };
        var textLines = newText.substr(0, position).split("\n");
        cursor.line = textLines.length - 1;
        cursor.ch = textLines[cursor.line].length;
        return cursor;
    };

    module.getContentExtension = function (id) {
        var modes = window.CP_getLanguages();
        var mode = modes.find(function (obj) {
            return obj.id === id;
        }) || modes[0];
        var ext = mode.ext && mode.ext[0];
        return ext !== undefined ? ext : '.txt';
    };
    module.fileExporter = function (content) {
        return new Blob([ content ], { type: 'text/plain;charset=utf-8' });
    };
    module.setValueAndCursor = function (editor, oldDoc, remoteDoc) {
        // XXX deprecated function, only used in "poll"
        editor._noCursorUpdate = true;
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

        // XXX setCursor setSelection
        editor._noCursorUpdate = false;
        editor.scrollTo(scroll.left, scroll.top);

        if (!editor.hasFocus()) { return; }

        if(selects[0] === selects[1]) {
            editor.setCursor(posToCursor(selects[0], remoteDoc));
        }
        else {
            editor.setSelection(posToCursor(selects[0], remoteDoc), posToCursor(selects[1], remoteDoc));
        }

        editor.scrollTo(scroll.left, scroll.top);
    };

    module.handleImagePaste = function () {
        // XXX deprecated, used by poll
    };

    module.getHeadingText = function (editor) {
        if (!editor.getValue) { return; }
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
            var hashAndLink = /^#+\s*\[(.*?)\]\(.*\)\s*$/;
            if (hash.test(line)) {
                // test for link inside the title, and set text just to the name of the link
                if (hashAndLink.test(line)) {
                    line.replace(hashAndLink, function (a, one) {
                        text = Util.stripTags(one);
                    });
                    return true;
                }
                line.replace(hash, function (a, one) {
                    text = Util.stripTags(one);
                });
                return true;
            }

            // TODO make one more pass for multiline comments
        });

        return text.trim();
    };

    module.mkIndentSettings = function (editor, metadataMgr) {
        var setIndentation = function (units, useTabs, fontSize, spellcheck, brackets) {
            if (typeof(units) !== 'number') { return; }

            editor.CP_setIndent(useTabs, units);
            editor.CP_setBrackets(brackets);

            //editor.setOption('spellcheck', spellcheck); // XXX not supported

            setTimeout(function () {
                $('.cm-editor').css('font-size', fontSize+'px');
            });

            // orgmode is using its own shortcuts
            //if (editor.getMode().name === 'orgmode') { return; } // XXX orgmode todo (getMode not defined)

            /*
            // XXX not needed: these keys are alreayd disabled by default in cm6
            return;
            var doc = editor.getDoc();
            editor.setOption("extraKeys", {
                Tab: function() {
                    if (doc.somethingSelected()) {
                        editor.execCommand("indentMore");
                    }
                    else {
                        if (!useTabs) { editor.execCommand("insertSoftTab"); }
                        else { editor.execCommand("insertTab"); }
                    }
                },
                "Shift-Tab": function () {
                    editor.execCommand("indentLess");
                },
                "Alt-Left": undefined,
                "Alt-Right": undefined,
                "Alt-Enter": undefined, 
                "Alt-Up": undefined,
                "Alt-Down": undefined,
                "Shift-Alt-Left": undefined,
                "Shift-Alt-Right": undefined,
                "Shift-Alt-Enter": undefined,
                "Shift-Alt-Up": undefined,
                "Shift-Alt-Down": undefined,
            });
            */
        };

        var indentKey = 'indentUnit';
        var useTabsKey = 'indentWithTabs';
        var fontKey = 'fontSize';
        var spellcheckKey = 'spellcheck';
        var updateIndentSettings = editor.updateSettings = function () {
            if (!metadataMgr) { return; }
            var data = metadataMgr.getPrivateData().settings;
            data = data.codemirror || {};
            var indentUnit = data[indentKey];
            var useTabs = data[useTabsKey];
            var fontSize = data[fontKey];
            var spellcheck = data[spellcheckKey];
            var brackets = data.brackets;
            setIndentation(
                typeof(indentUnit) === 'number'? indentUnit : 2,
                typeof(useTabs) === 'boolean'? useTabs : false,
                typeof(fontSize) === 'number' ? fontSize : module.CODEMIRROR_DEFAULT_FONT_SIZE,
                typeof(spellcheck) === 'boolean' ? spellcheck : false,
                typeof(brackets) === 'boolean' ? brackets : true);
        };
        metadataMgr.onChangeLazy(updateIndentSettings);
        updateIndentSettings();
    };

    module.create = function (defaultMode, editor, textarea) {
        var exp = {};

        //var CodeMirror = exp.CodeMirror = CMeditor;
        //CodeMirror.modeURL = "cm/mode/%N/%N";
        if (textarea) { $(textarea).after(editor.dom).hide(); }

        var Title;
        var onLocal = function () {};
        var $drawer;
        exp.init = function (local, title, toolbar) {
            if (typeof local === "function") {
                onLocal = local;
            }
            Title = title;
            $drawer = toolbar.$theme || $();
        };

        exp.editor = editor;


        $(window).on('resize', function () {
            setTimeout(function () {
                editor.focus(); // XXX Firefox fix: focus lost when closing dev console
            });
        });

        exp.setInline = function (state) {
            editor.CP_setInline(state, window.CryptPad_theme === "dark");
        };

        // editor to sframe-common-codemirror
        exp.getValue = function () {
            return editor.state.doc.toString();
        };
        exp.setValue = function (text) {
            editor.dispatch({
                changes: {from: 0, to: editor.state.doc.length, insert: text}
            });
        };
        exp.on = function (type, handler) {
            editor.CP_on(type, handler);
        };
        exp.off = function (type, handler) {
            editor.CP_off(type, handler);
        };
        exp.getMode = function () {
            return {
                name: exp.highlightMode
            };
        };
        exp.replaceSelection = function (txt) {
            return editor.dispatch(editor.state.replaceSelection(txt));
        };
        exp.replaceSelections = function (update) {
            var tx = editor.state.changeByRange(function (r) {
                var str = r.from === r.to  ? '' : editor.state.sliceDoc(r.from, r.to);
                var n = update(str);
                return {
                    changes: {
                        from: r.from,
                        to: r.to,
                        insert: n
                    },
                    range: r,
                };
            });
            editor.dispatch({
                changes: tx.changes,
                annotations: {
                    type: 'toolbar',
                    value: 'input.click'
                }
            });
        };


        exp.hasFocus = function () { return editor.hasFocus; };
        exp.focus = function () {
            editor.focus();
        };

        exp.mkIndentSettings = function (metadataMgr) {
            module.mkIndentSettings(editor, metadataMgr); // XXX module?
        };

        exp.hasFocus = function () { return editor.hasFocus; };

        exp.setSelection = function (from, to) {
            if (from < 0) { from = 0; }
            if (to < 0) { to = 0; }
            if (from > editor.state.doc.length) { from = editor.state.doc.length; }
            if (to > editor.state.doc.length) { to = editor.state.doc.length; }
            editor.dispatch({selection: {anchor:from, head:to}});
        };

        exp.getHeadingText = function () {
            return module.getHeadingText(exp);
        };
        exp.refresh = function () { console.error('placeholder refresh'); }; // XXX remove

        exp.highlightMode = '';

        exp.getContentExtension = function () {
            return module.getContentExtension(exp.highlightMode);
        };
        exp.fileExporter = function () {
            return module.fileExporter(exp.getValue());
        };
        exp.fileImporter = function (content, file) {
            var $toolbarContainer = $('#cme_toolbox');
            /*
            var mime = CodeMirror.findModeByMIME(file.type);
            var mode;
            if (!mime) {
                var ext = /.+\.([^.]+)$/.exec(file.name);
                if (ext && ext[1]) {
                    mode = CMeditor.findModeByExtension(ext[1]);
                    mode = mode && mode.mode || null;
                }
            } else {
                mode = mime && mime.mode || null;
            }
            */
            var reg = /.+\.([^.]+)$/.exec(file.name);
            var ext = reg && reg[1];
            var modes = editor.CP_listLanguages();
            if (ext && !/^\./.test(ext)) { ext = `.${ext}`; }
            var modeData = modes.find(function (data) {
                return (data.ext || []).includes(ext);
            });
            var mode = modeData ? modeData.id : 'text';

            if (mode === "markdown") { mode = "gfm"; }
            exp.setMode(mode);
            $toolbarContainer.find('#language-mode').val(mode);

            // return the mode so that the code editor can decide how to display the new content
        };

        exp.setOption = function (type, value) {
            if (type === "readOnly") {
                return editor.CP_setReadOnly(value);
            }
            if (type === 'lineNumbers') {
                return editor.CP_setNumbers(value);
            }
        };

        exp.configureTheme = function (Common, cb) {
            /*  Remember the user's last choice of theme using localStorage */
            var isDark = window.CryptPad_theme === "dark";
            var themeKey = ['codemirror', isDark ? 'themedark' : 'theme'];
            var defaultTheme = isDark ? 'basic_dark' : 'basic_light';

            var allThemes = editor.CP_listThemes();
            var getThemeData = function (id) {
                return allThemes.find(function (el) {
                    return el.id === id;
                }) || {};
            };

            var todo = function (err, lastTheme) {
                lastTheme = lastTheme || defaultTheme;
                var options = [];
                allThemes.forEach(function (l) {
                    options.push({
                        tag: 'a',
                        attributes: {
                            'data-value': l.id,
                            'href': '#',
                        },
                        content: [l.name] // Pretty name of the language value
                    });
                });
                var dropdownConfig = {
                    text: Messages.code_editorTheme, // Button initial text
                    options: options, // Entries displayed in the menu
                    isSelect: true,
                    initialValue: lastTheme,
                    feedback: 'CODE_THEME',
                    common: Common
                };
                var $block = exp.$theme = UIElements.createDropdown(dropdownConfig);
                $block.find('button').attr('title', Messages.themeButtonTitle).click(function () {
                    var state = $block.find('.cp-dropdown-content').is(':visible');
                    var $c = $block.closest('.cp-toolbar-drawer-content');
                    $c.removeClass('cp-dropdown-visible');
                    if (!state) {
                        $c.addClass('cp-dropdown-visible');
                    }
                });

                var setTheme = function (theme, $select) {
                    var $c = $block.closest('.cp-toolbar-drawer-content');
                    var data = getThemeData(theme);
                    $c.addClass('noblur');
                    editor.CP_setTheme(theme);
                    $c.removeClass('noblur');
                    $block.find('button').focus();
                    if ($select) {
                        var name = data.name || undefined;
                        name = name ? Messages.themeButton + ' ('+name+')' : Messages.themeButton;
                        $select.setValue(theme, name);
                    }
                };

                setTheme(lastTheme, $block);

                var isHovering = false;
                var $aThemes = $block.find('a');
                $aThemes.mouseenter(function () {
                    isHovering = true;
                    var theme = $(this).attr('data-value');
                    setTheme(theme, $block);
                });
                $aThemes.mouseleave(function () {
                    if (isHovering) {
                        setTheme(lastTheme, $block);
                        Common.setAttribute(themeKey, lastTheme);
                    }
                });
                $aThemes.click(function () {
                    isHovering = false;
                    var theme = $(this).attr('data-value');
                    setTheme(theme, $block);
                    Common.setAttribute(themeKey, theme);
                });

                if ($drawer) { $drawer.append($block); }
                if (cb) { cb(); }
            };
            Common.getAttribute(themeKey, todo);
        };

        var setMode = exp.setMode = function (mode, cb) {
            var MIGRATE = {
                'markdown': 'gfm',
                'text/x-java': 'java',
                'text/x-c++src': 'cpp',
                'text/x-csrc': 'c',
                'htmlmixed': 'html'
            };
            if (MIGRATE[mode]) { mode = MIGRATE[mode]; }

            exp.highlightMode = mode;

            var modes = editor.CP_listLanguages();
            var getModeData = function (id) {
                return modes.find(function (el) {
                    return el.id === id;
                }) || {};
            };

            var data = getModeData(mode);

            var $c = $();
            if (exp.$language) { $c = exp.$language.closest('.cp-toolbar-drawer-content'); }

            $c.addClass('noblur');
            editor.CP_setLanguage(mode);
            $c.removeClass('noblur');

            /* // XXX
            if (/text\/x/.test(mode)) {
                CMeditor.autoLoadMode(editor, 'clike');
                editor.setOption('mode', mode);
            } else if (mode === 'asciidoc') {
                CMeditor.autoLoadMode(editor, mode, {
                    path: function () {
                        return 'cm-extra/asciidoc/asciidoc';
                    }
                });
                editor.setOption('mode', mode);
            } else {
                if (mode !== "text") {
                    CMeditor.autoLoadMode(editor, mode);
                }
                editor.setOption('mode', mode);
            }
            */

            if (exp.$language) {
                var name = data.name;
                name = name ? Messages.languageButton + ' ('+name+')' : Messages.languageButton;
                exp.$language.setValue(mode, name);
            }

            // XXX TODO orgmode
            /*
                if (mode === "orgmode") {
                    if (CodeMirror.orgmode && typeof (CodeMirror.orgmode.init) === "function") {
                        CodeMirror.orgmode.init(editor);
                    }
                } else {
                    if (CodeMirror.orgmode && typeof (CodeMirror.orgmode.destroy) === "function") {
                        CodeMirror.orgmode.destroy(editor);
                    }
                }
            */
            if(cb) { cb(mode); }
        };
        exp.configureLanguage = function (Common, cb, onModeChanged) {
            var options = [];
            var modes = editor.CP_listLanguages();
            modes.sort(function (a, b) {
                return a.name < b.name ? -1 : (a.name === b.name ? 0 : 1);
            });
            modes.forEach(function (l) {
                options.push({
                    tag: 'a',
                    attributes: {
                        'data-value': l.id,
                        'href': '#',
                    },
                    content: [l.name] // Pretty name of the language value
                });
            });
            var dropdownConfig = {
                text: Messages.languageButton, // Button initial text
                options: options, // Entries displayed in the menu
                isSelect: true,
                feedback: 'CODE_LANGUAGE',
                common: Common
            };
            var $block = exp.$language = UIElements.createDropdown(dropdownConfig);
            $block.find('button').attr('title', Messages.languageButtonTitle);

            var isHovering = false;
            var $aLanguages = $block.find('a');
            $aLanguages.mouseenter(function () {
                isHovering = true;
                setMode($(this).attr('data-value'));
            });
            $aLanguages.mouseleave(function () {
                if (isHovering) {
                    setMode($block.find(".cp-dropdown-element-active").attr('data-value'));
                }
            });
            $aLanguages.click(function () {
                isHovering = false;
                var mode = $(this).attr('data-value');
                setMode(mode, onModeChanged);
                onLocal();
            });

            if ($drawer) { $drawer.append($block); }
            if (exp.highlightMode) { exp.setMode(exp.highlightMode); }
            if (cb) { cb(); }
        };

        var canonicalize = exp.canonicalize = function (t) { return t.replace(/\r\n/g, '\n'); };

        exp.getContent = function () {
            //editor.save();
            return { content: canonicalize(exp.getValue()) };
        };

        exp.setValueAndCursor = function (oldDoc, remoteDoc) {
            // Store scroll position
            var scroller = $(editor.dom).find('.cm-scroller')[0];
            var scroll = scroller && scroller.scrollTop;

            // Get old cursor here
            var oldCursor = exp.getCursor();

            // Set new value
            exp.setValue(remoteDoc);

            // Update cursor
            var ops = ChainPad.Diff.diff(oldDoc, remoteDoc);
            var selects = ['selectionStart', 'selectionEnd'].map(function (attr) {
                return TextCursor.transformCursor(oldCursor[attr], ops);
            });


            if (scroller) { scroller.scrollTop = scroll; }

            exp.setSelection(selects[0], selects[1]);
        };

        exp.contentUpdate = function (newContent) {
            var oldDoc = canonicalize(exp.getValue());
            var remoteDoc = newContent.content;
            // setValueAndCursor triggers onLocal, even if we don't make any change to the content
            // and it may revert other changes (metadata)

            if (oldDoc === remoteDoc) { return; }
            exp.setValueAndCursor(oldDoc, remoteDoc);
        };

        exp.getCursor = function () {
            return {
                selectionStart: editor.state.selection.main.from,
                selectionEnd: editor.state.selection.main.to
            };
        };
        exp.getSelections = function () {
            return editor.state.selection.ranges.map(function (r) {
                return {
                    range: r,
                    value: editor.state.sliceDoc(r.from, r.to)
                };
            });
        };

        var makeTippy = function (cursor) {
            return MT.getCursorAvatar(cursor);
        };
        exp.removeCursors = function () {
            editor.CP_removeCursors();
        };
        exp.setRemoteCursor = function (data) {
            if (data.reset) {
                return void exp.removeCursors();
            }
            if (data.leave) {
                $('.cp-codemirror-cursor[id^='+data.id+']').each(function (i, el) {
                    var id = $(el).attr('id');
                    editor.CP_removeCursors(id);
                });
                return;
            }

            var id = data.id;
            var cursor = data.cursor;

            editor.CP_removeCursors(id);

            if (!cursor.selectionStart) { return; }

            if (cursor.selectionStart === cursor.selectionEnd) {
                editor.CP_addCursor(cursor.color, makeTippy(cursor), id, cursor.selectionStart);
            } else {
                console.error(cursor.color); // XXX undefined for noDrive?
                var rgb = Util.hexToRGB(cursor.color).join(',');
                var c = `rgba(${rgb},0.2)`;
                editor.CP_addCursor(c, makeTippy(cursor), id, cursor.selectionStart, cursor.selectionEnd);
            }
        };


        if (defaultMode) { setMode(defaultMode); }

        return exp;
    };

    return module;
});

