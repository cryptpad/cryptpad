define([
    'jquery',
    '/common/diffMarked.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/sframe-common-codemirror.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/modes.js',
    '/common/visible.js',
    '/common/TypingTests.js',
    '/customize/messages.js',
    'cm/lib/codemirror',
    '/bower_components/chainpad/chainpad.dist.js',


    'css!cm/lib/codemirror.css',
    'css!cm/addon/dialog/dialog.css',
    'css!cm/addon/fold/foldgutter.css',

    'cm/mode/gfm/gfm',
    'cm/addon/mode/loadmode',
    'cm/mode/meta',
    'cm/addon/mode/overlay',
    'cm/addon/mode/multiplex',
    'cm/addon/mode/simple',
    'cm/addon/edit/closebrackets',
    'cm/addon/edit/matchbrackets',
    'cm/addon/edit/trailingspace',
    'cm/addon/selection/active-line',
    'cm/addon/search/search',
    'cm/addon/search/match-highlighter',
    'cm/addon/search/searchcursor',
    'cm/addon/dialog/dialog',
    'cm/addon/fold/foldcode',
    'cm/addon/fold/foldgutter',
    'cm/addon/fold/brace-fold',
    'cm/addon/fold/xml-fold',
    'cm/addon/fold/markdown-fold',
    'cm/addon/fold/comment-fold',
    'cm/addon/display/placeholder',

    'less!/code/app-code.less'

], function (
    $,
    DiffMd,
    nThen,
    SFCommon,
    Framework,
    SFCodeMirror,
    Util,
    Hash,
    Modes,
    Visible,
    TypingTest,
    Messages,
    CMeditor,
    ChainPad)
{
    window.CodeMirror = CMeditor;

    var MEDIA_TAG_MODES = Object.freeze([
        'markdown',
        'gfm',
        'html',
        'htmlembedded',
        'htmlmixed',
        'index.html',
        'php',
        'velocity',
        'xml',
    ]);

    var mkPrintButton = function (framework, $content, $print) {
        var $printButton = framework._.sfCommon.createButton('print', true);
        $printButton.click(function () {
            $print.html($content.html());
            window.focus();
            window.print();
            framework.feedback('PRINT_CODE');
        });
        framework._.toolbar.$drawer.append($printButton);
    };
    var mkMarkdownTb = function (editor, framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        var markdownTb = framework._.sfCommon.createMarkdownToolbar(editor);
        $codeMirrorContainer.prepend(markdownTb.toolbar);

        framework._.toolbar.$rightside.append(markdownTb.button);

        var modeChange = function (mode) {
            if (['markdown', 'gfm'].indexOf(mode) !== -1) { return void markdownTb.setState(true); }
            markdownTb.setState(false);
        };

        return {
            modeChange: modeChange
        };
    };
    var mkHelpMenu = function (framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
        $codeMirrorContainer.prepend(framework._.sfCommon.getBurnAfterReadingWarning());
        var helpMenu = framework._.sfCommon.createHelpMenu(['text', 'code']);
        $codeMirrorContainer.prepend(helpMenu.menu);

        framework._.toolbar.$drawer.append(helpMenu.button);
    };
    var mkPreviewPane = function (editor, CodeMirror, framework, isPresentMode) {
        var $previewContainer = $('#cp-app-code-preview');
        var $preview = $('#cp-app-code-preview-content');
        var $editorContainer = $('#cp-app-code-editor');
        var $codeMirrorContainer = $('#cp-app-code-container');
        var $codeMirror = $('.CodeMirror');

        $('<img>', {
            src: '/customize/main-favicon.png',
            alt: '',
            class: 'cp-app-code-preview-empty'
        }).appendTo($previewContainer);

        var $previewButton = framework._.sfCommon.createButton('preview', true);
        var forceDrawPreview = function () {
            try {
                if (editor.getValue() === '') {
                    $previewContainer.addClass('cp-app-code-preview-isempty');
                    return;
                }
                $previewContainer.removeClass('cp-app-code-preview-isempty');
                DiffMd.apply(DiffMd.render(editor.getValue()), $preview, framework._.sfCommon);
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) { return; }
            if (!$previewButton.is('.cp-toolbar-button-active')) { return; }
            forceDrawPreview();
        }, 400);

        var previewTo;
        $previewButton.click(function () {
            clearTimeout(previewTo);
            $codeMirror.addClass('transition');
            previewTo = setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) {
                $previewContainer.show();
            }
            $previewContainer.toggle();
            if ($previewContainer.is(':visible')) {
                forceDrawPreview();
                $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                $previewButton.addClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', true, function (e) {
                    if (e) { return console.log(e); }
                });
            } else {
                $codeMirrorContainer.addClass('cp-app-code-fullpage');
                $previewButton.removeClass('cp-toolbar-button-active');
                framework._.sfCommon.setPadAttribute('previewMode', false, function (e) {
                    if (e) { return console.log(e); }
                });
            }
        });

        framework._.toolbar.$rightside.append($previewButton);

        $preview.click(function (e) {
            if (!e.target) { return; }
            var $t = $(e.target);
            if ($t.is('a') || $t.parents('a').length) {
                e.preventDefault();
                var $a = $t.is('a') ? $t : $t.parents('a').first();
                var href = $a.attr('href');
                if (/^\/[^\/]/.test(href)) {
                    var privateData = framework._.cpNfInner.metadataMgr.getPrivateData();
                    href = privateData.origin + href;
                } else if (/^#/.test(href)) {
                    var target = document.getElementById('cp-md-0-'+href.slice(1));
                    if (target) { target.scrollIntoView(); }
                    return;
                }
                framework._.sfCommon.openUnsafeURL(href);
            }
        });

        var modeChange = function (mode) {
            if (['markdown', 'gfm'].indexOf(mode) !== -1) {
                $previewButton.show();
                framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
                    if (e) { return void console.error(e); }
                    if (data !== false) {
                        $previewContainer.show();
                        $previewButton.addClass('cp-toolbar-button-active');
                        $codeMirrorContainer.removeClass('cp-app-code-fullpage');
                        if (isPresentMode) {
                            $editorContainer.addClass('cp-app-code-present');
                        }
                    }
                });
                return;
            }
            $editorContainer.removeClass('cp-app-code-present');
            $previewButton.hide();
            $previewContainer.hide();
            $previewButton.removeClass('active');
            $codeMirrorContainer.addClass('cp-app-code-fullpage');
        };

        var isVisible = function () {
            return $previewContainer.is(':visible');
        };

        framework.onReady(function () {
            // add the splitter
            var splitter = $('<div>', {
                'class': 'cp-splitter'
            }).appendTo($previewContainer);

            $preview.on('scroll', function() {
                splitter.css('top', $preview.scrollTop() + 'px');
            });

            var $target = $codeMirrorContainer;

            splitter.on('mousedown', function (e) {
                e.preventDefault();
                var x = e.pageX;
                var w = $target.width();
                var handler = function (evt) {
                    if (evt.type === 'mouseup') {
                        $(window).off('mouseup mousemove', handler);
                        return;
                    }
                    $target.css('width', (w - x + evt.pageX) + 'px');
                    editor.refresh();
                };
                $(window).off('mouseup mousemove', handler);
                $(window).on('mouseup mousemove', handler);
            });

            var previewInt;
            var clear = function () { clearInterval(previewInt); };

            // keep trying to draw until you're confident it has been drawn
            previewInt = setInterval(function () {
                // give up if it's not a valid preview mode
                if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) === -1) { return void clear(); }
                // give up if content has been drawn
                if ($preview.text()) { return void clear(); }
                // only draw if there is actually content to display
                if (editor && !editor.getValue().trim()) { return void clear(); }
                forceDrawPreview();
            }, 1000);
        });

        framework._.sfCommon.getPadAttribute('previewMode', function (e, data) {
            if (e) { return void console.error(e); }
            if (data === false && $previewButton) {
                $previewButton.click();
            }
        });

        Visible.onChange(function (visible) {
            if (visible) {
                drawPreview();
            }
        });

        return {
            forceDraw: forceDrawPreview,
            draw: drawPreview,
            modeChange: modeChange,
            isVisible: isVisible
        };
    };

    var mkFilePicker = function (framework, editor, evModeChange) {
        evModeChange.reg(function (mode) {
            if (MEDIA_TAG_MODES.indexOf(mode) !== -1) {
                // Embedding is endabled
                framework.setMediaTagEmbedder(function (mt) {
                    editor.replaceSelection($(mt)[0].outerHTML);
                });
            } else {
                // Embedding is disabled
                framework.setMediaTagEmbedder();
            }
        });
    };

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    var authorUid = function (existing) {
        if (!Array.isArray(existing)) { existing = []; }
        var n;
        var i = 0;
        while (!n || existing.indexOf(n) !== -1 && i++ < 1000) {
            n = Math.floor(Math.random() * 1000000);
        }
        // If we can't find a valid number in 1000 iterations, use 0...
        if (existing.indexOf(n) !== -1) { n = 0; }
        return n;
    };

    var andThen2 = function (editor, CodeMirror, framework, isPresentMode) {

        var common = framework._.sfCommon;
        var privateData = common.getMetadataMgr().getPrivateData();

        var previewPane = mkPreviewPane(editor, CodeMirror, framework, isPresentMode);
        var markdownTb = mkMarkdownTb(editor, framework);

        var $removeAuthorColorsButton = framework._.sfCommon.createButton('removeauthorcolors', true, {icon: 'fa-paint-brush', title: 'Autorenfarben entfernen'}); // XXX
        framework._.toolbar.$rightside.append($removeAuthorColorsButton);
        $removeAuthorColorsButton.click(function() {
            var selfrom = editor.getCursor("from");
            var selto = editor.getCursor("to");
            if (!editor.somethingSelected() || selfrom === selto) {
                editor.getAllMarks().forEach(function (marker) {
                    marker.clear();
                });
                authormarks.authors = {};
                authormarks.marks = [];
            } else {
                editor.findMarks(selfrom, selto).forEach(function (marker) {
                    marker.clear();
                });
            }
            framework.localChange();
        });

        var authormarks = {
            marks: [],
            authors: {}
        };
        var authormarksLocal = [];
        var myAuthorId = 0;

        var MARK_OPACITY = 90;

        var addMark = function (from, to, uid) {
            var author = authormarks.authors[uid] || {};
            editor.markText(from, to, {
                inclusiveLeft: uid === myAuthorId,
                inclusiveRight: uid === myAuthorId,
                css: "background-color: " + author.color + MARK_OPACITY,
                attributes: {
                    'data-type': 'authormark',
                    'data-uid': uid
                }
            });
        };
        var sortMarks = function (a, b) {
            if (!Array.isArray(b)) { return -1; }
            if (!Array.isArray(a)) { return 1; }
            // Check line
            if (a[1] < b[1]) { return -1; }
            if (a[1] > b[1]) { return 1; }
            // Same line: check start offset
            if (a[2] < b[2]) { return -1; }
            if (a[2] > b[2]) { return 1; }
            return 0;
        };


        var $print = $('#cp-app-code-print');
        var $content = $('#cp-app-code-preview-content');
        mkPrintButton(framework, $content, $print);

        mkHelpMenu(framework);

        var evModeChange = Util.mkEvent();
        evModeChange.reg(previewPane.modeChange);
        evModeChange.reg(markdownTb.modeChange);

        CodeMirror.mkIndentSettings(framework._.cpNfInner.metadataMgr);
        CodeMirror.init(framework.localChange, framework._.title, framework._.toolbar);
        mkFilePicker(framework, editor, evModeChange);

        if (!framework.isReadOnly()) {
            CodeMirror.configureTheme(common, function () {
                CodeMirror.configureLanguage(common, null, evModeChange.fire);
            });
        } else {
            CodeMirror.configureTheme(common);
        }

        var checkAuthors = function (userDoc) {
            var chainpad = framework._.cpNfInner.chainpad;
            var authDoc = JSON.parse(chainpad.getAuthDoc() || '{}');
            if (!authDoc.content || !userDoc.content) { return; }
            if (!authormarks || !Array.isArray(authormarks.marks)) { return; }
            var oldDoc = CodeMirror.canonicalize(editor.getValue());
            var theirOps = ChainPad.Diff.diff(oldDoc, userDoc.content);
            var myOps = ChainPad.Diff.diff(authDoc.content, userDoc.content);
            // If I have uncommited content when receiving a remote patch, and they have
            // pushed content to the same line as me, I need to update all the authormarks
            // after their changes to push them by the length of the text I added
            var changed = false;
            console.log(JSON.stringify(authDoc.authormarks));
            console.log(JSON.stringify(authormarks));
            console.warn(myOps);
            console.warn(theirOps);
            myOps.forEach(function (op) {
                var pos = SFCodeMirror.posToCursor(op.offset, authDoc.content);
                var size = (op.toInsert.length - op.toRemove);

                // If the remote change includes an operation on the same line,
                // fix the offsets and continue to my next operation
                // NOTE: we need to fix all the marks that are **after** the change with
                //       the bigger offset
                theirOps.some(function (_op) {
                    var _pos = SFCodeMirror.posToCursor(_op.offset, oldDoc);
                    if (_pos.line !== pos.line) { return; }

                    var ch = Math.max(_pos.ch, pos.ch);
                    // Get the marks from this line and check offsets after the change
                    authormarks.marks.forEach(function (array) {
                        if (array[1] !== pos.line) { return; }
                        // Move the end position if it's on the same line and after the change
                        if (!array[4] && array[3] >= ch) {
                            array[3] += size;
                            changed = true;
                        }
                        // Move the start position if it's after the change
                        if (array[2] >= ch) {
                            array[2] += size;
                            changed = true;
                        }
                    });
                    return true;
                });
            });
            framework.localChange();
        };

        framework.onContentUpdate(function (newContent) {
            var highlightMode = newContent.highlightMode;
            if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                CodeMirror.setMode(highlightMode, evModeChange.fire);
            }

            if (newContent.authormarks) {
                authormarks = newContent.authormarks;
                if (!authormarks.marks) { authormarks.marks = []; }
                if (!authormarks.authors) { authormarks.authors = {}; }
            }

            var chainpad = framework._.cpNfInner.chainpad;
            var ops = ChainPad.Diff.diff(chainpad.getAuthDoc(), chainpad.getUserDoc());
            if (ops.length) {
                console.error(ops);
            }
            checkAuthors(newContent);

            CodeMirror.contentUpdate(newContent); //, authormarks.marks, authormarksLocal);
            previewPane.draw();
        });

        framework.setContentGetter(function () {
            CodeMirror.removeCursors();
            var content = CodeMirror.getContent();
            content.highlightMode = CodeMirror.highlightMode;
            previewPane.draw();

            var colorlist = content.colorlist || {};

            // get author marks
            var authors = authormarks.authors || {};
            var _marks = [];
            var previous;
            editor.getAllMarks().forEach(function (mark) {
                var pos = mark.find();
                var attributes = mark.attributes || {};
                if (!pos || attributes['data-type'] !== 'authormark') { return; }

                var uid = attributes['data-uid'] || 0;
                var author = authors[uid] || {};

                // Check if we need to merge
                if (previous && previous.data && previous.data[0] === uid) {
                    if (previous.pos.to.line ===  pos.from.line
                        && previous.pos.to.ch === pos.from.ch) {
                        // Merge the marks
                        previous.mark.clear();
                        mark.clear();
                        addMark(previous.pos.from, pos.to, uid);
                        // Remove the data for the previous one
                        _marks.pop();
                        // Update the position to create the new data
                        pos.from = previous.pos.from;
                    }
                }

                var array = [uid, pos.from.line, pos.from.ch];
                if (pos.from.line === pos.to.line && pos.to.ch > (pos.from.ch+1)) {
                    // If there is more than 1 character, add the "to" character
                    array.push(pos.to.ch);
                } else if (pos.from.line !== pos.to.line) {
                    // If the mark is on more than one line, add the "to" line data
                    Array.prototype.push.apply(array, [pos.to.line, pos.to.ch]);
                }
                _marks.push(array);
                previous = {
                    pos: pos,
                    mark: mark,
                    data: array
                };
            });
            _marks.sort(sortMarks);
            content.authormarks = {marks: _marks, authors: authormarks.authors};
            //authormarksLocal = _marks.slice();

            return content;
        });

        var cursorTo;
        var updateCursor = function () {
            if (cursorTo) { clearTimeout(cursorTo); }
            if (editor._noCursorUpdate) { return; }
            cursorTo = setTimeout(function () {
                framework.updateCursor();
            }, 500); // 500ms to make sure it is sent after chainpad sync
        };
        framework.onCursorUpdate(CodeMirror.setRemoteCursor);
        framework.setCursorGetter(CodeMirror.getCursor);
        editor.on('cursorActivity', updateCursor);

        framework.onEditableChange(function () {
            editor.setOption('readOnly', framework.isLocked() || framework.isReadOnly());
        });

        framework.setTitleRecommender(CodeMirror.getHeadingText);

        var getMyAuthorId = function () {
            var existing = Object.keys(authormarks.authors || {});
            if (!common.isLoggedIn()) { return authorUid(existing); }

            var userData = common.getMetadataMgr().getUserData();
            var uid;
            existing.some(function (id) {
                var author = authormarks.authors[id] || {};
                if (author.curvePublic !== userData.curvePublic) { return; }
                uid = Number(id);
                return true;
            });
            // XXX update my color?
            return uid || authorUid(existing);
        };

        framework.onReady(function (newPad) {
            editor.focus();

            if (newPad && !CodeMirror.highlightMode) {
                CodeMirror.setMode('gfm', evModeChange.fire);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

            myAuthorId = getMyAuthorId();
            console.warn(myAuthorId);

            var fmConfig = {
                dropArea: $('.CodeMirror'),
                body: $('body'),
                onUploaded: function (ev, data) {
                    var parsed = Hash.parsePadUrl(data.url);
                    var secret = Hash.getSecrets('file', parsed.hash, data.password);
                    var fileHost = privateData.fileHost || privateData.origin;
                    var src = fileHost + Hash.getBlobPathFromHex(secret.channel);
                    var key = Hash.encodeBase64(secret.keys.cryptKey);
                    var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + key + '"></media-tag>';
                    editor.replaceSelection(mt);
                }
            };
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
             editor.setValue(''); //Messages.codeInitialState);
        });

        framework.setFileExporter(CodeMirror.getContentExtension, CodeMirror.fileExporter);
        framework.setFileImporter({}, function () {
            /*  setFileImporter currently takes a function with the following signature:
                (content, file) => {}
                I used 'apply' with 'arguments' to avoid breaking things if this API ever changes.
            */
            var ret = CodeMirror.fileImporter.apply(null, Array.prototype.slice.call(arguments));
            previewPane.modeChange(ret.mode);
            return ret;
        });

        framework.setNormalizer(function (c) {
            return {
                content: c.content,
                highlightMode: c.highlightMode,
                authormarks: c.authormarks
            };
        });

        editor.on('change', function( cm, change ) {
            if (change.text !== undefined && (change.origin === "+input" || change.origin === "paste")) {
                // add new author mark if text is added. marks from removed text are removed automatically

                // If my text is inside an existing mark:
                //  * if it's my mark, do nothing
                //  * if it's someone else's mark, break it
                // We can only have one author mark at a given position, but there may be
                // another mark (cursor selection...) at this position so we use ".some"
                var toSplit, abort;
                editor.findMarksAt(change.from).some(function (mark) {
                    if (!mark.attributes) { return; }
                    if (mark.attributes['data-type'] !== 'authormark') { return; }
                    if (mark.attributes['data-uid'] !== myAuthorId) {
                        toSplit = {
                            mark: mark,
                            uid: mark.attributes['data-uid']
                        };
                    } else {
                        // This is our mark: abort to avoid making a new one
                        abort = true;
                    }

                    return true;
                });
                if (abort) { return void framework.localChange(); }

                // Add my data to the doc if it's missing
                if (!authormarks.authors[myAuthorId]) {
                    var userData = common.getMetadataMgr().getUserData();
                    authormarks.authors[myAuthorId] = {
                        name: userData.name,
                        curvePublic: userData.curvePublic,
                        color: userData.color
                    }
                }

                var to_add = {
                    line: change.from.line + change.text.length-1,
                };
                if (change.text.length > 1) {
                    // Multiple lines => take the length of the text added to the last line
                    to_add.ch = change.text[change.text.length-1].length;
                } else {
                    // Single line => use the "from" position and add the length of the text
                    to_add.ch = change.from.ch + change.text[change.text.length-1].length;
                }

                if (toSplit && toSplit.mark && typeof(toSplit.uid) !== "undefined") {
                    // Break the other user's mark if needed
                    var _pos = toSplit.mark.find();
                    toSplit.mark.clear();
                    addMark(_pos.from, change.from, toSplit.uid); // their mark, 1st part
                    addMark(change.from, to_add, myAuthorId); // my mark
                    addMark(to_add, _pos.to, toSplit.uid); // their mark, 2nd part
                } else {
                    // Add my mark
                    addMark(change.from, to_add, myAuthorId);
                }
            } else if (change.origin === "setValue") {
                // on remote update: remove all marks, add new marks
                editor.getAllMarks().forEach(function (marker) {
                    if (marker.attributes && marker.attributes['data-type'] === 'authormark') {
                        marker.clear();
                    }
                });
                authormarks.marks.forEach(function (mark) {
                    var from_line;
                    var to_line;
                    var from_ch;
                    var to_ch;
                    var uid = mark[0];
                    if (!authormarks.authors || !authormarks.authors[uid]) { return; }
                    var data = authormarks.authors[uid];
                    if (mark.length === 3)  {
                        from_line = mark[1];
                        to_line = mark[1];
                        from_ch = mark[2];
                        to_ch = mark[2]+1;
                    } else if (mark.length === 4) {
                        from_line = mark[1];
                        to_line = mark[1];
                        from_ch = mark[2];
                        to_ch = mark[3];
                    } else if (mark.length === 5) {
                        from_line = mark[1];
                        to_line = mark[3];
                        from_ch = mark[2];
                        to_ch = mark[4];
                    }
                    addMark({
                        line: from_line, ch: from_ch
                    }, {
                        line: to_line, ch: to_ch
                    }, uid);
                });
            }
            framework.localChange();
        });

        framework.start();


        window.easyTest = function () {
            var test = TypingTest.testCode(editor);
            return test;
        };
    };

    var getThumbnailContainer = function () {
        var $preview = $('#cp-app-code-preview-content');
        if ($preview.length && $preview.is(':visible')) {
            return $preview[0];
        }
    };

    var main = function () {
        var CodeMirror;
        var editor;
        var framework;

        nThen(function (waitFor) {

            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-code-editor',
                thumbnail: {
                    getContainer: getThumbnailContainer,
                    filter: function (el, before) {
                        if (before) {
                            //$(el).parents().css('overflow', 'visible');
                            $(el).css('max-height', Math.max(600, $(el).width()) + 'px');
                            return;
                        }
                        $(el).parents().css('overflow', '');
                        $(el).css('max-height', '');
                        editor.refresh();
                    }
                }
            }, waitFor(function (fw) { framework = fw; }));

            nThen(function (waitFor) {
                $(waitFor());
            }).nThen(function () {
                CodeMirror = SFCodeMirror.create(null, CMeditor);
                $('#cp-app-code-container').addClass('cp-app-code-fullpage');
                editor = CodeMirror.editor;
            }).nThen(waitFor());

        }).nThen(function (/*waitFor*/) {
            framework._.sfCommon.isPresentUrl(function (err, val) {
                andThen2(editor, CodeMirror, framework, val);
            });
        });
    };
    main();
});
