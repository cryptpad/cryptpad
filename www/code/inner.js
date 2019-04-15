define([
    'jquery',
    '/common/diffMarked.js',
    '/common/media-tag.js',
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

    'less!/code/app-code.less',
    '/common/latex/latex.js',
    'css!/common/latex/css/katex.css',
    'css!/common/latex/css/article.css',
    'css!/common/latex/css/base.css',
    '/common/latex/promise.js',
    '/common/latex/pdftex.js',
], function (
    $,
    DiffMd,
    MediaTag,
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
    CMeditor
    )
{
    window.CodeMirror = CMeditor;
    var latexjs = window.latexjs;

    var MEDIA_TAG_MODES = Object.freeze([
        'markdown',
        'gfm',
        'stex',
        'html',
        'htmlembedded',
        'htmlmixed',
        'index.html',
        'php',
        'velocity',
        'xml',
    ]);
    var PDF_MODES = Object.freeze([
        'stex',
    ]);
    var $pdfButton;

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
            if (['markdown', 'gfm', 'stex'].indexOf(mode) !== -1) { return void markdownTb.setState(true); }
            markdownTb.setState(false);
        };

        return {
            modeChange: modeChange
        };
    };
    var mkHelpMenu = function (framework) {
        var $codeMirrorContainer = $('#cp-app-code-container');
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
                if (['markdown', 'gfm'].indexOf(CodeMirror.highlightMode) !== -1) {
                    DiffMd.apply(DiffMd.render(editor.getValue()), $preview, framework._.sfCommon);
                } else if (['stex'].indexOf(CodeMirror.highlightMode) !== 1) {
                    var latexError = "";
                    console.log("IN STEX/LATEX");
                    console.log("Latex JS: " + latexjs);
		    var latexHtmlGenerator = new latexjs.HtmlGenerator({ 
                        hyphenate: false, 
                        CustomMacros: (function() {
                           var args      = CustomMacros.args = {},
                           prototype = CustomMacros.prototype;

                           function CustomMacros(generator) {
                              this.g = generator;
                           }

                           args['includegraphics'] = ['V','g']
                           prototype['includegraphics'] = function(o) {
                            try {
                              var sMediaTag = o.data;
                              console.log("mediaTag: " + sMediaTag);
                              if (sMediaTag.startsWith("<media")) { 
                                var div = document.createElement("div");
                                div.innerHTML = sMediaTag;
                                var url = div.firstChild.getAttribute(div.firstChild.getAttributeNames()[0]);
                                var key = div.firstChild.getAttribute(div.firstChild.getAttributeNames()[1]);
                                sMediaTag = "mediatag:" + url + "," + key;
                              }
                              console.log("mediaTag: " + sMediaTag);
                              if (sMediaTag.startsWith("mediatag:")) {
                               console.log("In mediatag");
                               var data = sMediaTag.split(",");
                               var cryptpadUrl = data[0].substring(9);
                               var cryptpadKey = data[1];
                               console.log("In mediatag url " + cryptpadUrl + " key: " + cryptpadKey);
                               var mediaTag = document.createElement("media-tag");
                               mediaTag.setAttribute("src", cryptpadUrl);
                               mediaTag.setAttribute("data-crypto-key", cryptpadKey);
                               MediaTag(mediaTag);
                               return [mediaTag];
                              } else {
                               var img = document.createElement("img");
                               img.setAttribute("src", o.data);
                               img.setAttribute("width", "800");
                               img.setAttribute("height", "600");
                               return [img];
                              }
                            } catch (e) {
                              return ["Failed to evaluate mediatag " + e];
                            }
                           };
                           return CustomMacros;
                        }())
                    });
                    var latexGenerator;
                    try {
                     latexGenerator = latexjs.parse(editor.getValue(), { generator: latexHtmlGenerator });
                     console.log("Latex Generator: " + latexGenerator);
                    } catch(e) {
                     console.log("Latex error: " + e);
                     latexError = "Latex error: " + e;
                    }
                    var output;
                    try {
                     var outputDoc = latexGenerator.htmlDocument("http://localhost:3000/common/latex/");
                     output = outputDoc.documentElement.outerHTML;
                     // console.log("Output: " + output);
                    } catch(e) {
                     console.log("Error: " + e);
                     output = "Error: " + e + "\n" + latexError;
                    }
                    DiffMd.apply(output, $preview, framework._.sfCommon);
                };
            } catch (e) { console.error(e); }
        };
        var drawPreview = Util.throttle(function () {
            if (['markdown', 'gfm', 'stex'].indexOf(CodeMirror.highlightMode) === -1) { return; }
            if (!$previewButton.is('.cp-toolbar-button-active')) { return; }
            forceDrawPreview();
        }, 150);

        var previewTo;
        $previewButton.click(function () {
            clearTimeout(previewTo);
            $codeMirror.addClass('transition');
            previewTo = setTimeout(function () {
                $codeMirror.removeClass('transition');
            }, 500);
            if (['markdown', 'gfm', 'stex'].indexOf(CodeMirror.highlightMode) === -1) {
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
                framework._.sfCommon.openUnsafeURL(href);
            }
        });

        var modeChange = function (mode) {
            if (['markdown', 'gfm', 'stex'].indexOf(mode) !== -1) {
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

/*
       var pdftex = new PDFTeX();
        pdftex.set_TOTAL_MEMORY(80*1024*1024).then(function() {
          pdftex.FS_createLazyFile('/', 'snowden.jpg', 'snowden.jpg', true, true);

          pdftex.on_stdout = appendOutput;
          pdftex.on_stderr = appendOutput;

          var start_time = new Date().getTime();

          pdftex.compile(source_code).then(function(pdf_dataurl) {
            var end_time = new Date().getTime();
            console.info("Execution time: " + (end_time-start_time)/1000+' sec');

            showLoadingIndicator(false);

            if(pdf_dataurl === false)
              return;
            showOpenButton(true);
            window.location.href = "#open_pdf";
            document.getElementById("open_pdf_btn").focus();
          });
        });
      }
*/


    var pdfOutput = function(msg) {
         console.log("PDF compile: " + msg);
    }


    var mkPDFMaker = function (framework, editor, evModeChange) {
       evModeChange.reg(function (mode) {
            if (PDF_MODES.indexOf(mode) !== -1) {
               if (!$pdfButton) {
                $pdfButton = framework._.sfCommon.createButton('pdf', true);
                $pdfButton.click(function () {
                  var source = editor.getValue();
                  // console.log("PDF " + source);
                  try {
                   var pdftex = new PDFTeX();
                   pdftex.on_stdout = pdfOutput;
                   pdftex.on_stderr = pdfOutput;
                   pdftex.set_TOTAL_MEMORY(80*1024*1024).then(function() {
                      pdftex.FS_createLazyFile('/', 'snowden.jpg', 'snowden.jpg', true, true);
                      console.log("PDF launch compile");
                      pdftex.compile(source).then(function(pdf_dataurl) { 
                        console.log("PDF end compile opening window");
                        console.log(pdf_dataurl);
                        var link = document.createElement("a");
                        link.download = "file.pdf";
                        link.href = pdf_dataurl;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        delete link;
                      });
                      console.log("PDF end launch compile");
                   });
                   console.log("PDF end prelaunch");
                  } catch (e) {
                   console.log("Error outputing pdf: " + e);
	          }
                });
                framework._.toolbar.$drawer.append($pdfButton);
              } else {
                $pdfButton.show();
              }
            } else {
                if ($pdfButton) 
                 $pdfButton.hide();
            }
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    var andThen2 = function (editor, CodeMirror, framework, isPresentMode) {

        var common = framework._.sfCommon;

        var previewPane = mkPreviewPane(editor, CodeMirror, framework, isPresentMode);
        var markdownTb = mkMarkdownTb(editor, framework);

        var $print = $('#cp-app-code-print');
        var $content = $('#cp-app-code-preview-content');
        mkPrintButton(framework, $content, $print);

        mkHelpMenu(framework);

        var evModeChange = Util.mkEvent();
        evModeChange.reg(previewPane.modeChange);
        evModeChange.reg(markdownTb.modeChange);

        // Add pdf in stex mode
        mkPDFMaker(framework, editor, evModeChange);

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

        ////

        framework.onContentUpdate(function (newContent) {
            var highlightMode = newContent.highlightMode;
            if (highlightMode && highlightMode !== CodeMirror.highlightMode) {
                CodeMirror.setMode(highlightMode, evModeChange.fire);
            }
            CodeMirror.contentUpdate(newContent);
            previewPane.draw();
        });

        framework.setContentGetter(function () {
            CodeMirror.removeCursors();
            var content = CodeMirror.getContent();
            content.highlightMode = CodeMirror.highlightMode;
            previewPane.draw();
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

        framework.onReady(function (newPad) {
            editor.focus();

            if (newPad && !CodeMirror.highlightMode) {
                CodeMirror.setMode('gfm', evModeChange.fire);
                //console.log("%s => %s", CodeMirror.highlightMode, CodeMirror.$language.val());
            }

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
            common.createFileManager(fmConfig);
        });

        framework.onDefaultContentNeeded(function () {
             editor.setValue(''); //Messages.codeInitialState);
        });

        framework.setFileExporter(CodeMirror.getContentExtension, CodeMirror.fileExporter);
        framework.setFileImporter({}, CodeMirror.fileImporter);

        framework.setNormalizer(function (c) {
            return {
                content: c.content,
                highlightMode: c.highlightMode
            };
        });

        editor.on('change', framework.localChange);

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
