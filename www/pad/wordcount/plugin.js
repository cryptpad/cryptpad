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
                limitReachedNotified = false,
                limitRestoredNotified = false,
                timeoutId = 0,
                notification = null;


            var dispatchEvent = function(type, currentLength, maxLength) {
                if (typeof document.dispatchEvent == 'undefined') {
                    return;
                }

                type = 'ckeditor.wordcount.' + type;

                var cEvent;
                var eventInitDict = {
                    bubbles: false,
                    cancelable: true,
                    detail: {
                        currentLength: currentLength,
                        maxLength: maxLength
                    }
                };

                try {
                    cEvent = new CustomEvent(type, eventInitDict);
                } catch (o_O) {
                    cEvent = document.createEvent('CustomEvent');
                    cEvent.initCustomEvent(
                        type,
                        eventInitDict.bubbles,
                        eventInitDict.cancelable,
                        eventInitDict.detail
                    );
                }

                document.dispatchEvent(cEvent);
            };

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

                // How long to show the 'paste' warning
                pasteWarningDuration: 0,

                //DisAllowed functions
                wordCountGreaterThanMaxLengthEvent: function(currentLength, maxLength) {
                    dispatchEvent('wordCountGreaterThanMaxLengthEvent', currentLength, maxLength);
                },
                charCountGreaterThanMaxLengthEvent: function(currentLength, maxLength) {
                    dispatchEvent('charCountGreaterThanMaxLengthEvent', currentLength, maxLength);
                },

                //Allowed Functions
                wordCountLessThanMaxLengthEvent: function(currentLength, maxLength) {
                    dispatchEvent('wordCountLessThanMaxLengthEvent', currentLength, maxLength);
                },
                charCountLessThanMaxLengthEvent: function(currentLength, maxLength) {
                    dispatchEvent('charCountLessThanMaxLengthEvent', currentLength, maxLength);
                }
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

            function counterId(editorInstance) {
                return "cke_wordcount_" + editorInstance.name;
            }

            function counterElement(editorInstance) {
                return document.getElementById(counterId(editorInstance));
            }

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

            function limitReached(editorInstance, notify) {
                limitReachedNotified = true;
                limitRestoredNotified = false;

                if (!config.warnOnLimitOnly) {
                    if (config.hardLimit) {
                        editorInstance.execCommand('undo');
                    }
                }

                if (!notify) {
                    counterElement(editorInstance).className = "cke_path_item cke_wordcountLimitReached";
                    editorInstance.fire("limitReached", { firedBy: "wordCount.limitReached" }, editor);
                }
            }

            function limitRestored(editorInstance) {
                limitRestoredNotified = true;
                limitReachedNotified = false;

                if (!config.warnOnLimitOnly) {
                    editorInstance.fire('saveSnapshot');
                }

                counterElement(editorInstance).className = "cke_path_item";
            }

            function updateCounter(editorInstance) {
                if (!counterElement(editorInstance)) {
                    return;
                }

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

                if (CKEDITOR.env.gecko) {
                    counterElement(editorInstance).innerHTML = html;
                } else {
                    counterElement(editorInstance).innerText = html;
                }

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

                // Check for word limit and/or char limit
                if ((config.maxWordCount > -1 && wordCount > config.maxWordCount && deltaWord > 0) ||
                    (config.maxCharCount > -1 && charCount > config.maxCharCount && deltaChar > 0) ||
                    (config.maxParagraphs > -1 && paragraphs > config.maxParagraphs && deltaParagraphs > 0)) {

                    limitReached(editorInstance, limitReachedNotified);
                } else if ((config.maxWordCount == -1 || wordCount <= config.maxWordCount) &&
                    (config.maxCharCount == -1 || charCount <= config.maxCharCount) &&
                    (config.maxParagraphs == -1 || paragraphs <= config.maxParagraphs)) {

                    limitRestored(editorInstance);
                } else {
                    editorInstance.fire('saveSnapshot');
                }

                // update instance
                editorInstance.wordCount =
                {
                    paragraphs: paragraphs,
                    wordCount: wordCount,
                    charCount: charCount
                };


                // Fire Custom Events
                if (config.charCountGreaterThanMaxLengthEvent && config.charCountLessThanMaxLengthEvent) {
                    if (charCount > config.maxCharCount && config.maxCharCount > -1) {
                        config.charCountGreaterThanMaxLengthEvent(charCount, config.maxCharCount);
                    } else {
                        config.charCountLessThanMaxLengthEvent(charCount, config.maxCharCount);
                    }
                }

                if (config.wordCountGreaterThanMaxLengthEvent && config.wordCountLessThanMaxLengthEvent) {
                    if (wordCount > config.maxWordCount && config.maxWordCount > -1) {
                        config.wordCountGreaterThanMaxLengthEvent(wordCount, config.maxWordCount);

                    } else {
                        config.wordCountLessThanMaxLengthEvent(wordCount, config.maxWordCount);
                    }
                }

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

            editor.on("key",
                function(event) {
                    if (editor.mode === "source") {
                        clearTimeout(timeoutId);
                        timeoutId = setTimeout(
                            updateCounter.bind(this, event.editor),
                            250
                        );
                    }
                },
                editor,
                null,
                100);

            editor.on("change",
                function(event) {
                    var ms = isCloseToLimits() ? 5 : 250;
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(
                        updateCounter.bind(this, event.editor),
                        ms
                    );
                },
                editor,
                null,
                100);

            editor.on("uiSpace",
                function(event) {
                    if (editor.elementMode === CKEDITOR.ELEMENT_MODE_INLINE) {
                        if (event.data.space == "top") {
                            event.data.html += "<div class=\"cke_wordcount\" style=\"\"" +
                                " title=\"" +
                                editor.lang.wordcount.title +
                                "\"" +
                                "><span id=\"" +
                                counterId(event.editor) +
                                "\" class=\"cke_path_item\">&nbsp;</span></div>";
                        }
                    } else {
                        if (event.data.space == "bottom") {
                            event.data.html += "<div class=\"cke_wordcount\" style=\"\"" +
                                " title=\"" +
                                editor.lang.wordcount.title +
                                "\"" +
                                "><span id=\"" +
                                counterId(event.editor) +
                                "\" class=\"cke_path_item\">&nbsp;</span></div>";
                        }
                    }

                },
                editor,
                null,
                100);

            editor.on("dataReady",
                function(event) {
                    updateCounter(event.editor);
                },
                editor,
                null,
                100);

            editor.on("paste",
                function(event) {
                    if (!config.warnOnLimitOnly && (config.maxWordCount > 0 || config.maxCharCount > 0 || config.maxParagraphs > 0)) {

                        // Check if pasted content is above the limits
                        var wordCount = -1,
                            charCount = -1,
                            paragraphs = -1;

                        // BeforeGetData and getData events are fired when calling
                        // getData(). We can prevent this by passing true as an
                        // argument to getData(). This allows us to fire the events
                        // manually with additional event data: firedBy. This additional
                        // data helps differentiate calls to getData() made by
                        // wordCount plugin from calls made by other plugins/code.
                        event.editor.fire("beforeGetData", { firedBy: "wordCount.onPaste" }, event.editor);
                        var text = event.editor.getData(true);
                        event.editor.fire("getData", { dataValue: text, firedBy: "wordCount.onPaste" }, event.editor);

                        text += event.data.dataValue;

                        if (config.showCharCount) {
                            charCount = countCharacters(text);
                        }

                        if (config.showWordCount) {
                            wordCount = countWords(text);
                        }

                        if (config.showParagraphs) {
                            paragraphs = countParagraphs(text);
                        }


                        // Instantiate the notification when needed and only have one instance
                        if (notification === null) {
                            notification = new CKEDITOR.plugins.notification(event.editor,
                                {
                                    message: event.editor.lang.wordcount.pasteWarning,
                                    type: 'warning',
                                    duration: config.pasteWarningDuration
                                });
                        }

                        if (config.maxCharCount > 0 && charCount > config.maxCharCount && config.hardLimit) {
                            if (!notification.isVisible()) {
                                notification.show();
                            }
                            event.cancel();
                        }

                        if (config.maxWordCount > 0 && wordCount > config.maxWordCount && config.hardLimit) {
                            if (!notification.isVisible()) {
                                notification.show();
                            }
                            event.cancel();
                        }

                        if (config.maxParagraphs > 0 && paragraphs > config.maxParagraphs && config.hardLimit) {
                            if (!notification.isVisible()) {
                                notification.show();
                            }
                            event.cancel();
                        }
                    }
                },
                editor,
                null,
                100);

            editor.on("afterPaste",
                function(event) {
                    updateCounter(event.editor);
                },
                editor,
                null,
                100);
        }
    });
