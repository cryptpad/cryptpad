define([
    'jquery',
    '/common/modes.js',
    '/common/themes.js',
    '/bower_components/file-saver/FileSaver.min.js'
], function ($, Modes, Themes) {
    var saveAs = window.saveAs;
    var module = {};

    module.create = function (CMeditor, ifrw, Cryptpad) {
        var exp = {};

        var Messages = Cryptpad.Messages;

        var CodeMirror = exp.CodeMirror = CMeditor;
        CodeMirror.modeURL = "/bower_components/codemirror/mode/%N/%N.js";

        var $pad = $('#pad-iframe');
        var $textarea = exp.$textarea = $pad.contents().find('#editor1');

        var Title;
        var onLocal = function () {};
        var $rightside;
        exp.init = function (local, title, toolbar) {
            if (typeof local === "function") {
                onLocal = local;
            }
            Title = title;
            $rightside = toolbar.$rightside;
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
            mode: "javascript",
            readOnly: true
        });
        editor.setValue(Messages.codeInitialState);

        var setMode = exp.setMode = function (mode) {
            exp.highlightMode = mode;
            if (mode === 'text') {
                editor.setOption('mode', 'text');
                return;
            }
            CMeditor.autoLoadMode(editor, mode);
            editor.setOption('mode', mode);
            if (exp.$language) {
                var name = exp.$language.find('a[data-value="' + mode + '"]').text() || 'Mode';
                exp.$language.setValue(name);
            }
        };

        var setTheme = exp.setTheme = (function () {
            var path = '/common/theme/';

            var $head = $(ifrw.document.head);

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
                    $select.setValue(theme || 'Theme');
                }
            };
        }());

        var getHeadingText = function () {
            var lines = editor.getValue().split(/\n/);

            var text = '';
            lines.some(function (line) {
                // lisps?
                var lispy = /^\s*(;|#\|)(.*?)$/;
                if (lispy.test(line)) {
                    line.replace(lispy, function (a, one, two) {
                        text = two;
                    });
                    return true;
                }

                // lines beginning with a hash are potentially valuable
                // works for markdown, python, bash, etc.
                var hash = /^#(.*?)$/;
                if (hash.test(line)) {
                    line.replace(hash, function (a, one) {
                        text = one;
                    });
                    return true;
                }

                // lines including a c-style comment are also valuable
                var clike = /^\s*(\/\*|\/\/)(.*)?(\*\/)*$/;
                if (clike.test(line)) {
                    line.replace(clike, function (a, one, two) {
                        if (!(two && two.replace)) { return; }
                        text = two.replace(/\*\/\s*$/, '').trim();
                    });
                    return true;
                }

                // TODO make one more pass for multiline comments
            });

            return text.trim();
        };

        exp.configureLanguage = function (cb) {
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
                text: 'Mode', // Button initial text
                options: options, // Entries displayed in the menu
                left: true, // Open to the left of the button
                isSelect: true,
            };
            console.log('here');
            var $block = exp.$language = Cryptpad.createDropdown(dropdownConfig);
            console.log(exp);
            $block.find('a').click(function () {
                setMode($(this).attr('data-value'), $block);
                onLocal();
            });

            if ($rightside) { $rightside.append($block); }
            cb();
        };

        exp.configureTheme = function () {
            /*  Remember the user's last choice of theme using localStorage */
            var themeKey = 'CRYPTPAD_CODE_THEME';
            var lastTheme = localStorage.getItem(themeKey) || 'default';

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
                initialValue: lastTheme
            };
            var $block = exp.$theme = Cryptpad.createDropdown(dropdownConfig);

            setTheme(lastTheme, $block);

            $block.find('a').click(function () {
                var theme = $(this).attr('data-value');
                setTheme(theme, $block);
                localStorage.setItem(themeKey, theme);
            });

            if ($rightside) { $rightside.append($block); }
        };

        exp.exportText = function () {
            var text = editor.getValue();

            var ext = Modes.extensionOf(exp.highlightMode);

            var title = Cryptpad.fixFileName(Title ? Title.suggestTitle('cryptpad') : "?") + (ext || '.txt');

            Cryptpad.prompt(Messages.exportPrompt, title, function (filename) {
                if (filename === null) { return; }
                var blob = new Blob([text], {
                    type: 'text/plain;charset=utf-8'
                });
                saveAs(blob, filename);
            });
        };
        exp.importText = function (content, file) {
            var $bar = ifrw.$('#cme_toolbox');
            var mode;
            var mime = CodeMirror.findModeByMIME(file.type);

            if (!mime) {
                var ext = /.+\.([^.]+)$/.exec(file.name);
                if (ext[1]) {
                    mode = CMeditor.findModeByExtension(ext[1]);
                }
            } else {
                mode = mime && mime.mode || null;
            }

            if (mode && Modes.list.some(function (o) { return o.mode === mode; })) {
                setMode(mode);
                $bar.find('#language-mode').val(mode);
            } else {
                console.log("Couldn't find a suitable highlighting mode: %s", mode);
                setMode('text');
                $bar.find('#language-mode').val('text');
            }

            editor.setValue(content);
            onLocal();
        };

        return exp;
    };

    return module;
});

