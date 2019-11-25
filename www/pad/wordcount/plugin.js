/**
 * @license Copyright (c) CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.plugins.add("wordcount",
    {
        lang: "ar,bg,ca,cs,da,de,el,en,es,eu,fa,fi,fr,he,hr,hu,it,ko,ja,nl,no,pl,pt,pt-br,ru,sk,sv,tr,uk,zh-cn,zh,ro", // %REMOVE_LINE_CORE%
        version: "1.17.6",
        requires: 'htmlwriter,notification,undo',
        bbcodePluginLoaded: false,
        onLoad: function() {
            CKEDITOR.document.appendStyleSheet(this.path + "css/wordcount.css");
        },
        init: function(editor) {
            var defaultFormat = "",
                lastWordCount = -1,
                lastCharCount = -1,
                lastParagraphs = -1,
                timeoutId = 0,
                notification = null;

            // Default Config
            var defaultConfig = {
                showRemaining: false,
                showParagraphs: true,
                showWordCount: true,
                showCharCount: false,
                countBytesAsChars: false,
                countSpacesAsChars: false,
                countHTML: false,
                countLineBreaks: false,
                hardLimit: true,
                warnOnLimitOnly: false,

                //MAXLENGTH Properties
                maxWordCount: -1,
                maxCharCount: -1,
                maxParagraphs: -1,

                // Filter
                filter: null,
            };

            // Get Config & Lang
            var config = CKEDITOR.tools.extend(defaultConfig, editor.config.wordcount || {}, true);

            if (config.showParagraphs) {
              if (config.maxParagraphs > -1) {
                  if (config.showRemaining) {
                      defaultFormat += "%paragraphsCount% " + editor.lang.wordcount.ParagraphsRemaining;
                  } else {
                      defaultFormat += editor.lang.wordcount.Paragraphs + " %paragraphsCount%";

                      defaultFormat += "/" + config.maxParagraphs;
                  }
              } else {
                  defaultFormat += editor.lang.wordcount.Paragraphs + " %paragraphsCount%";
              }
            }

            if (config.showParagraphs && (config.showWordCount || config.showCharCount)) {
                defaultFormat += ", ";
            }

            if (config.showWordCount) {
                if (config.maxWordCount > -1) {
                    if (config.showRemaining) {
                        defaultFormat += "%wordCount% " + editor.lang.wordcount.WordCountRemaining;
                    } else {
                        defaultFormat += editor.lang.wordcount.WordCount + " %wordCount%";

                        defaultFormat += "/" + config.maxWordCount;
                    }
                } else {
                    defaultFormat += editor.lang.wordcount.WordCount + " %wordCount%";
                }
            }

            if (config.showCharCount && config.showWordCount) {
                defaultFormat += ", ";
            }

            if (config.showCharCount) {
                if (config.maxCharCount > -1) {
                    if (config.showRemaining) {
                        defaultFormat += "%charCount% " +
                            editor.lang.wordcount[config.countHTML
                                ? "CharCountWithHTMLRemaining"
                                : "CharCountRemaining"];
                    } else {
                        defaultFormat += editor.lang.wordcount[config.countHTML
                                ? "CharCountWithHTML"
                                : "CharCount"] +
                            " %charCount%";

                        defaultFormat += "/" + config.maxCharCount;
                    }
                } else {
                    defaultFormat += editor.lang.wordcount[config.countHTML ? "CharCountWithHTML" : "CharCount"] +
                        " %charCount%";
                }
            }

            var format = defaultFormat;

            bbcodePluginLoaded = typeof editor.plugins.bbcode != 'undefined';

            function strip(html) {
                if (bbcodePluginLoaded) {
                    // stripping out BBCode tags [...][/...]
                    return html.replace(/\[.*?\]/gi, '');
                }

                var tmp = document.createElement("div");

                // Add filter before strip
                html = filter(html);

                tmp.innerHTML = html;

                if (tmp.textContent == "" && typeof tmp.innerText == "undefined") {
                    return "";
                }

                return tmp.textContent || tmp.innerText;
            }

            /**
             * Implement filter to add or remove before counting
             * @param html
             * @returns string
             */
            function filter(html) {
                if (config.filter instanceof CKEDITOR.htmlParser.filter) {
                    var fragment = CKEDITOR.htmlParser.fragment.fromHtml(html),
                        writer = new CKEDITOR.htmlParser.basicWriter();
                    config.filter.applyTo(fragment);
                    fragment.writeHtml(writer);
                    return writer.getHtml();
                }
                return html;
            }

            function countCharacters(text) {
                if (config.countHTML) {
                    return config.countBytesAsChars ? countBytes(filter(text)) : filter(text).length;
                }

                var normalizedText;

                // strip body tags
                if (editor.config.fullPage) {
                    var i = text.search(new RegExp("<body>", "i"));
                    if (i != -1) {
                        var j = text.search(new RegExp("</body>", "i"));
                        text = text.substring(i + 6, j);
                    }

                }

                normalizedText = text;

                if (!config.countSpacesAsChars) {
                    normalizedText = text.replace(/\s/g, "").replace(/&nbsp;/g, "");
                }

                if (config.countLineBreaks) {
                    normalizedText = normalizedText.replace(/(\r\n|\n|\r)/gm, " ");
                } else {
                    normalizedText = normalizedText.replace(/(\r\n|\n|\r)/gm, "").replace(/&nbsp;/gi, " ");
                }

                normalizedText = strip(normalizedText).replace(/^([\t\r\n]*)$/, "");

                return config.countBytesAsChars ? countBytes(normalizedText) : normalizedText.length;
            }

            function countBytes(text) {
                var count = 0, stringLength = text.length, i;
                text = String(text || "");
                for (i = 0; i < stringLength; i++) {
                    var partCount = encodeURI(text[i]).split("%").length;
                    count += partCount == 1 ? 1 : partCount - 1;
                }
                return count;
            }

            function countParagraphs(text) {
                return (text.replace(/&nbsp;/g, " ").replace(/(<([^>]+)>)/ig, "").replace(/^\s*$[\n\r]{1,}/gm, "++")
                    .split("++").length);
            }

            function countWords(text) {
                var normalizedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/^\s+|\s+$/g, "")
                    .replace("&nbsp;", " ");

                normalizedText = strip(normalizedText);

                var words = normalizedText.split(/\s+/);

                for (var wordIndex = words.length - 1; wordIndex >= 0; wordIndex--) {
                    if (words[wordIndex].match(/^([\s\t\r\n]*)$/)) {
                        words.splice(wordIndex, 1);
                    }
                }

                return (words.length);
            }

            function updateCounter(editorInstance) {
                var paragraphs = 0,
                    wordCount = 0,
                    charCount = 0,
                    text;

                // BeforeGetData and getData events are fired when calling
                // getData(). We can prevent this by passing true as an
                // argument to getData(). This allows us to fire the events
                // manually with additional event data: firedBy. This additional
                // data helps differentiate calls to getData() made by
                // wordCount plugin from calls made by other plugins/code.
                editorInstance.fire("beforeGetData", { firedBy: "wordCount.updateCounter" }, editor);
                text = editorInstance.getData(true);
                editorInstance.fire("getData", { dataValue: text, firedBy: "wordCount.updateCounter" }, editor);

                if (text) {
                    if (config.showCharCount) {
                        charCount = countCharacters(text);
                    }

                    if (config.showParagraphs) {
                        paragraphs = countParagraphs(text);
                    }

                    if (config.showWordCount) {
                        wordCount = countWords(text);
                    }
                }

                var html = format;
                if (config.showRemaining) {
                    if (config.maxCharCount >= 0) {
                        html = html.replace("%charCount%", config.maxCharCount - charCount);
                    } else {
                        html = html.replace("%charCount%", charCount);
                    }

                    if (config.maxWordCount >= 0) {
                        html = html.replace("%wordCount%", config.maxWordCount - wordCount);
                    } else {
                        html = html.replace("%wordCount%", wordCount);
                    }

                    if (config.maxParagraphs >= 0) {
                        html = html.replace("%paragraphsCount%", config.maxParagraphs - paragraphs);
                    } else {
                        html = html.replace("%paragraphsCount%", paragraphs);
                    }
                } else {
                    html = html.replace("%wordCount%", wordCount).replace("%charCount%", charCount).replace("%paragraphsCount%", paragraphs);
                }

                (editorInstance.config.wordcount || (editorInstance.config.wordcount = {})).wordCount = wordCount;
                (editorInstance.config.wordcount || (editorInstance.config.wordcount = {})).charCount = charCount;

                if (charCount == lastCharCount && wordCount == lastWordCount && paragraphs == lastParagraphs) {
                    if (charCount == config.maxCharCount || wordCount == config.maxWordCount || paragraphs > config.maxParagraphs) {
                        editorInstance.fire('saveSnapshot');
                    }
                    return true;
                }

                //If the limit is already over, allow the deletion of characters/words. Otherwise,
                //the user would have to delete at one go the number of offending characters
                var deltaWord = wordCount - lastWordCount;
                var deltaChar = charCount - lastCharCount;
                var deltaParagraphs = paragraphs - lastParagraphs;

                lastWordCount = wordCount;
                lastCharCount = charCount;
                lastParagraphs = paragraphs;

                if (lastWordCount == -1) {
                    lastWordCount = wordCount;
                }
                if (lastCharCount == -1) {
                    lastCharCount = charCount;
                }
                if (lastParagraphs == -1) {
                    lastParagraphs = paragraphs;
                }

                // update instance
                editorInstance.wordCount =
                {
                    paragraphs: paragraphs,
                    wordCount: wordCount,
                    charCount: charCount
                };
                editor.fire('cp-wc-update');

                return true;
            }

            function isCloseToLimits() {
                if (config.maxWordCount > -1 && config.maxWordCount - lastWordCount < 5) {
                    return true;
                }

                if (config.maxCharCount > -1 && config.maxCharCount - lastCharCount < 20) {
                    return true;
                }

                if (config.maxParagraphs > -1 && config.maxParagraphs - lastParagraphs < 1) {
                    return true;
                }

                return false;
            }

            editor.on('cp-wc', function(event) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(
                    updateCounter.bind(this, event.editor),
                    250
                );
            }, editor, null, 250);
        }
    });
