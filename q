warning: LF will be replaced by CRLF in customize.dist/translations/messages.fr.js.
The file will have its original line endings in your working directory.
[1mdiff --git a/customize.dist/translations/messages.fr.js b/customize.dist/translations/messages.fr.js[m
[1mindex 96e36a4..4ad51bd 100644[m
[1m--- a/customize.dist/translations/messages.fr.js[m
[1m+++ b/customize.dist/translations/messages.fr.js[m
[36m@@ -79,12 +79,14 @@[m [mdefine(function () {[m
 [m
     out.printButton = "Imprimer";[m
     out.printButtonTitle = "Imprimer votre présentation ou l'enregistrer au format PDF";[m
[31m-    out.printOptions = "Options d'impression";[m
[32m+[m[32m    out.printOptions = "Options de mise en page";[m
     out.printSlideNumber = "Afficher le numéro des slides";[m
     out.printDate = "Afficher la date";[m
     out.printTitle = "Afficher le titre du pad";[m
     out.printCSS = "Personnaliser l'apparence (CSS):";[m
 [m
[32m+[m[32m    out.slideOptionsTitle = "Personnaliser la présentation";[m
[32m+[m
     out.editShare = "Lien d'édition";[m
     out.editShareTitle = "Copier le lien d'édition dans le presse-papiers";[m
     out.editOpen = "Éditer dans un nouvel onglet";[m
[1mdiff --git a/customize.dist/translations/messages.js b/customize.dist/translations/messages.js[m
[1mindex b463b48..15540fd 100644[m
[1m--- a/customize.dist/translations/messages.js[m
[1m+++ b/customize.dist/translations/messages.js[m
[36m@@ -81,12 +81,14 @@[m [mdefine(function () {[m
 [m
     out.printButton = "Print";[m
     out.printButtonTitle = "Print your slides or export them as a PDF file";[m
[31m-    out.printOptions = "Print options";[m
[32m+[m[32m    out.printOptions = "Layout options";[m
     out.printSlideNumber = "Display the slide number";[m
     out.printDate = "Display the date";[m
     out.printTitle = "Display the pad title";[m
     out.printCSS = "Custom style rules (CSS):";[m
 [m
[32m+[m[32m    out.slideOptionsTitle = "Customize your slides";[m
[32m+[m
     out.editShare = "Editing link";[m
     out.editShareTitle = "Copy the editing link to clipboard";[m
     out.editOpen = "Open editing link in a new tab";[m
[1mdiff --git a/www/slide/main.js b/www/slide/main.js[m
[1mindex 50f216e..0bc6f5f 100644[m
[1m--- a/www/slide/main.js[m
[1m+++ b/www/slide/main.js[m
[36m@@ -136,7 +136,8 @@[m [mdefine([[m
 [m
             var $modal = $pad.contents().find('#modal');[m
             var $content = $pad.contents().find('#content');[m
[31m-            var $print = $pad.contents().find('#print');[m
[32m+[m[32m            var $print = $pad.contents().find('#print');            var slideOptions = {};[m
[32m+[m
             $( window ).resize(function() {[m
                 // 20vh[m
                 // 20 * 16 / 9vw[m
[36m@@ -149,7 +150,13 @@[m [mdefine([[m
                 // $print.css('font-size', (20*9/16)+'vw');[m
             });[m
 [m
[31m-            Slide.setModal($modal, $content, $pad, ifrw, initialState);[m
[32m+[m[32m            Slide.setModal(APP, $modal, $content, $pad, ifrw, slideOptions, initialState);[m
[32m+[m
[32m+[m[32m            var setStyleState = function (state) {[m
[32m+[m[32m                $pad.contents().find('#print, #content').find('style').each(function (i, el) {[m
[32m+[m[32m                    el.disabled = !state;[m
[32m+[m[32m                });[m
[32m+[m[32m            };[m
 [m
             var enterPresentationMode = function (shouldLog) {[m
                 Slide.show(true, editor.getValue());[m
[36m@@ -158,6 +165,7 @@[m [mdefine([[m
                 }[m
             };[m
             var leavePresentationMode = function () {[m
[32m+[m[32m                setStyleState(false);[m
                 Slide.show(false);[m
             };[m
 [m
[36m@@ -229,7 +237,8 @@[m [mdefine([[m
                     content: textValue,[m
                     metadata: {[m
                         users: userData,[m
[31m-                        defaultTitle: defaultName[m
[32m+[m[32m                        defaultTitle: defaultName,[m
[32m+[m[32m                        slideOptions: slideOptions[m
                     }[m
                 };[m
                 if (!initializing) {[m
[36m@@ -370,6 +379,7 @@[m [mdefine([[m
                     setTabTitle();[m
                     $bar.find('.' + Toolbar.constants.title).find('span.title').text(data);[m
                     $bar.find('.' + Toolbar.constants.title).find('input').val(data);[m
[32m+[m[32m                    if (slideOptions.title) { Slide.updateOptions(); }[m
                 });[m
             };[m
 [m
[36m@@ -387,6 +397,15 @@[m [mdefine([[m
                 }[m
             };[m
 [m
[32m+[m[32m            var updateOptions = function (newOpt) {[m
[32m+[m[32m                if (stringify(newOpt) !== stringify(slideOptions)) {[m
[32m+[m[32m                    $.extend(slideOptions, newOpt);[m
[32m+[m[32m                    // TODO: manage realtime + cursor in the "options" modal ??[m
[32m+[m[32m                    console.log('updating options');[m
[32m+[m[32m                    Slide.updateOptions();[m
[32m+[m[32m                }[m
[32m+[m[32m            };[m
[32m+[m
             var updateDefaultTitle = function (defaultTitle) {[m
                 defaultName = defaultTitle;[m
                 $bar.find('.' + Toolbar.constants.title).find('input').attr("placeholder", defaultName);[m
[36m@@ -409,6 +428,7 @@[m [mdefine([[m
                         updateTitle(json.metadata.title || defaultName);[m
                         titleUpdated = true;[m
                     }[m
[32m+[m[32m                    updateOptions(json.metadata.slideOptions);[m
                     updateColors(json.metadata.color, json.metadata.backColor);[m
                 }[m
                 if (!titleUpdated) {[m
[36m@@ -424,12 +444,14 @@[m [mdefine([[m
             };[m
 [m
             var createPrintDialog = function () {[m
[31m-                var printOptions = {[m
[32m+[m[32m                var slideOptionsTmp = {[m
                     title: true,[m
                     slide: true,[m
[31m-                    date: true[m
[32m+[m[32m                    date: true,[m
[32m+[m[32m                    style: ''[m
                 };[m
 [m
[32m+[m[32m                $.extend(slideOptionsTmp, slideOptions);[m[41m[m
                 var $container = $('<div class="alertify">');[m
                 var $container2 = $('<div class="dialog">').appendTo($container);[m
                 var $div = $('<div id="printOptions">').appendTo($container2);[m
[36m@@ -440,21 +462,21 @@[m [mdefine([[m
                 $('<input>', {type: 'checkbox', id: 'checkNumber', checked: 'checked'}).on('change', function () {[m
                     var c = this.checked;[m
                     console.log(c);[m
[31m-                    printOptions.slide = c;[m
[32m+[m[32m                    slideOptionsTmp.slide = c;[m
                 }).appendTo($p).css('width', 'auto');[m
                 $('<label>', {'for': 'checkNumber'}).text(Messages.printSlideNumber).appendTo($p);[m
                 $p.append($('<br>'));[m
                 // Date[m
                 $('<input>', {type: 'checkbox', id: 'checkDate', checked: 'checked'}).on('change', function () {[m
                     var c = this.checked;[m
[31m-                    printOptions.date = c;[m
[32m+[m[32m                    slideOptionsTmp.date = c;[m
                 }).appendTo($p).css('width', 'auto');[m
                 $('<label>', {'for': 'checkDate'}).text(Messages.printDate).appendTo($p);[m
                 $p.append($('<br>'));[m
                 // Title[m
                 $('<input>', {type: 'checkbox', id: 'checkTitle', checked: 'checked'}).on('change', function () {[m
                     var c = this.checked;[m
[31m-                    printOptions.title = c;[m
[32m+[m[32m                    slideOptionsTmp.title = c;[m
                 }).appendTo($p).css('width', 'auto');[m
                 $('<label>', {'for': 'checkTitle'}).text(Messages.printTitle).appendTo($p);[m
                 $p.append($('<br>'));[m
[36m@@ -462,34 +484,18 @@[m [mdefine([[m
                 $('<label>', {'for': 'cssPrint'}).text(Messages.printCSS).appendTo($p);[m
                 $p.append($('<br>'));[m
                 var $textarea = $('<textarea>', {'id':'cssPrint'}).css({'width':'100%', 'height':'100px'}).appendTo($p);[m
[32m+[m[32m                $textarea.val(slideOptionsTmp.style);[m
[32m+[m
 [m
[31m-                var fixCSS = function (css) {[m
[31m-                    var append = '.cp #print ';[m
[31m-                    return css.replace(/(\n*)([^\n]+)\s*\{/g, '$1' + append + '$2 {');[m
[31m-                };[m
 [m
                 var todo = function () {[m
[31m-                    var $style = $('<style>').text(fixCSS($textarea.val()));[m
[31m-                    $print.prepend($style);[m
[31m-                    var length = $print.find('.slide-frame').length;[m
[31m-                    $print.find('.slide-frame').each(function (i, el) {[m
[31m-                        if (printOptions.slide) {[m
[31m-                            $('<div>', {'class': 'slideNumber'}).text((i+1)+'/'+length).appendTo($(el));[m
[31m-                        }[m
[31m-                        if (printOptions.date) {[m
[31m-                            $('<div>', {'class': 'slideDate'}).text(new Date().toLocaleDateString()).appendTo($(el));[m
[31m-                        }[m
[31m-                        if (printOptions.title) {[m
[31m-                            $('<div>', {'class': 'slideTitle'}).text(APP.title).appendTo($(el));[m
[31m-                        }[m
[31m-                    });[m
[31m-                    window.frames["pad-iframe"].focus();[m
[31m-                    window.frames["pad-iframe"].print();[m
[32m+[m[32m                    $.extend(slideOptions, slideOptionsTmp);                    slideOptions.style = $textarea.val();[m
[32m+[m[32m                    onLocal();[m
                     $container.remove();[m
                 };[m
 [m
                 var $nav = $('<nav>').appendTo($div);[m
[31m-                var $ok = $('<button>', {'class': 'ok'}).text(Messages.printButton).appendTo($nav).click(todo);[m
[32m+[m[32m                var $ok = $('<button>', {'class': 'ok'}).text(Messages.settings_save).appendTo($nav).click(todo);[m
                 var $cancel = $('<button>', {'class': 'cancel'}).text(Messages.cancel).appendTo($nav).click(function () {[m
                     $container.remove();[m
                 });[m
[36m@@ -556,10 +562,24 @@[m [mdefine([[m
                     'class': 'rightside-button fa fa-print',[m
                     style: 'font-size: 17px'[m
                 }).click(function () {[m
[32m+[m[32m                    Slide.update(editor.getValue(), true);[m
                     $print.html($content.html());[m
[32m+[m[32m                    Cryptpad.confirm("Are you sure you want to print?", function (yes) {[m
[32m+[m[32m                        if (yes) {[m
[32m+[m[32m                            window.frames["pad-iframe"].focus();[m
[32m+[m[32m                            window.frames["pad-iframe"].print();[m
[32m+[m[32m                        }[m
[32m+[m[32m                    }, {ok: Messages.printButton});[m
[32m+[m[32m                    //$('body').append(createPrintDialog());[m
[32m+[m[32m                });[m
[32m+[m[32m                $rightside.append($printButton);                var $slideOptions = $('<button>', {[m
[32m+[m[32m                    title: Messages.slideOptionsTitle,[m
[32m+[m[32m                    'class': 'rightside-button fa fa-cog',[m
[32m+[m[32m                    style: 'font-size: 17px'[m
[32m+[m[32m                }).click(function () {[m
                     $('body').append(createPrintDialog());[m
                 });[m
[31m-                $rightside.append($printButton);[m
[32m+[m[32m                $rightside.append($slideOptions);[m
 [m
                 var $present = Cryptpad.createButton('present', true)[m
               warning: LF will be replaced by CRLF in customize.dist/translations/messages.js.
The file will have its original line endings in your working directory.
warning: LF will be replaced by CRLF in www/slide/slide.css.
The file will have its original line endings in your working directory.
      .click(function () {[m
[36m@@ -726,8 +746,6 @@[m [mdefine([[m
                 updateMetadata(userDoc);[m
 [m
                 editor.setValue(newDoc || initialState);[m
[31m-                Slide.update(newDoc, true);[m
[31m-                Slide.draw();[m
 [m
                 if (Cryptpad.initialName && APP.title === defaultName) {[m
                     updateTitle(Cryptpad.initialName);[m
[1mdiff --git a/www/slide/slide.css b/www/slide/slide.css[m
[1mindex e96b77a..0404398 100644[m
[1m--- a/www/slide/slide.css[m
[1m+++ b/www/slide/slide.css[m
[36m@@ -80,11 +80,16 @@[m [mbody .CodeMirror-focused .cm-matchhighlight {[m
   position: relative;[m
   display: none;[m
   font-size: 11.25vw;[m
[32m+[m[32m  /*.slide-frame:first-child {[m
[32m+[m[32m        h1 { color: yellow; }[m
[32m+[m[32m        margin-top: ~"calc(((100vh - 56.25vw)/2))";[m
[32m+[m[32m    }*/[m
 }[m
 .cp #print .slide-frame {[m
   display: block !important;[m
   padding: 2.5%;[m
[31m-  margin-top: calc((100vh - 56.25vw)/2);[m
[32m+[m[32m  margin-top: 7.228vw;[m
[32m+[m[32m  margin-bottom: 7.228vw;[m
   border-top: 1px solid black;[m
   border-bottom: 1px solid black;[m
   height: 56.25vw;[m
[36m@@ -98,26 +103,7 @@[m [mbody .CodeMirror-focused .cm-matchhighlight {[m
 }[m
 .cp #print .slide-frame h1 {[m
   padding-top: 0;[m
[31m-}[m
[31m-.cp #print .slide-frame .slideNumber {[m
[31m-  position: absolute;[m
[31m-  right: 5vh;[m
[31m-  bottom: 5vh;[m
[31m-  font-size: 15px;[m
[31m-}[m
[31m-.cp #print .slide-frame .slideDate {[m
[31m-  position: absolute;[m
[31m-  left: 5vh;[m
[31m-  bottom: 5vh;[m
[31m-  font-size: 15px;[m
[31m-}[m
[31m-.cp #print .slide-frame .slideTitle {[m
[31m-  position: absolute;[m
[31m-  top: 5vh;[m
[31m-  left: 0px;[m
[31m-  right: 0px;[m
[31m-  text-align: center;[m
[31m-  font-size: 15px;[m
[32m+[m[32m  color: green;[m
 }[m
 .cp div.modal,[m
 .cp div#modal {[m
[36m@@ -341,3 +327,29 @@[m [mbody .CodeMirror-focused .cm-matchhighlight {[m
   max-height: 90%;[m
   margin: auto;[m
 }[m
[32m+[m[32m.cp div#modal #content .slide-frame .slideNumber,[m
[32m+[m[32m.cp #print .slide-frame .slideNumber {[m
[32m+[m[32m  position: absolute;[m
[32m+[m[32m  right: 5vh;[m
[32m+[m[32m  bottom: 5vh;[m
[32m+[m[32m  font-size: 10%;[m
[32m+[m[32m  line-height: 110%;[m
[32m+[m[32m}[m
[32m+[m[32m.cp div#modal #content .slide-frame .slideDate,[m
[32m+[m[32m.cp #print .slide-frame .slideDate {[m
[32m+[m[32m  position: absolute;[m
[32m+[m[32m  left: 5vh;[m
[32m+[m[32m  bottom: 5vh;[m
[32m+[m[32m  font-size: 10%;[m
[32m+[m[32m  line-height: 110%;[m
[32m+[m[32m}[m
[32m+[m[32m.cp div#modal #content .slide-frame .slideTitle,[m
[32m+[m[32m.cp #print .slide-frame .slideTitle {[m
[32m+[m[32m  position: absolute;[m
[32m+[m[32m  bottom: 5vh;[m
[32m+[m[32m  left: 0px;[m
[32m+[m[32m  right: 0px;[m
[32m+[m[32m  text-align: center;[m
[32m+[m[32m  font-size: 10%;[m
[32m+[m[32m  line-height: 110%;[m
[32m+[m[32m}[m
[1mdiff --git a/www/slide/slide.js b/www/slide/slide.js[m
[1mindex 7cbcad4..3990124 100644[m
[1m--- a/www/slide/slide.js[m
[1m+++ b/www/slide/slide.js[m
[36m@@ -14,11 +14,13 @@[m [mdefine([[m
         content: [],[m
         changeHandlers: [],[m
     };[m
[32m+[m[32m    var APP;[m
     var ifrw;[m
     var $modal;[m
     var $content;[m
     var $pad;[m
     var placeholder;[m
[32m+[m[32m    var options;[m
     var separator = '<hr data-pewpew="pezpez">';[m
     var separatorReg = /<hr data\-pewpew="pezpez">/g;[m
     var slideClass = 'slide-frame';[m
[36m@@ -114,6 +116,11 @@[m [mdefine([[m
         slice(root.children).forEach(removeListeners);[m
     };[m
 [m
[32m+[m[32m    var fixCSS = function (css) {[m
[32m+[m[32m        var append = '.cp #print .slide-frame ';[m
[32m+[m[32m        var append2 = '.cp div#modal #content .slide-frame ';[m
[32m+[m[32m        return css.replace(/(\n*)([^\n]+)\s*\{/g, '$1' + append + '$2,' + append2 + '$2 {');[m
[32m+[m[32m    };[m
     var draw = Slide.draw =  function (i) {[m
         i = i || 0;[m
         if (typeof(Slide.content) !== 'string') { return; }[m
[36m@@ -130,11 +137,31 @@[m [mdefine([[m
         } else {[m
             DD.apply($content[0], patch);[m
         }[m
[32m+[m[32m        var length = getNumberOfSlides();[m
[32m+[m[32m        $modal.find('style.slideStyle').remove();[m
[32m+[m[32m        if (options.style && Slide.shown) {[m
[32m+[m[32m            $modal.prepend($('<style>', {'class': 'slideStyle'}).text(fixCSS(options.style)));[m
[32m+[m[32m        }[m
[32m+[m[32m        $content.find('.slide-frame').each(function (i, el) {[m
[32m+[m[32m            if (options.slide) {[m
[32m+[m[32m                $('<div>', {'class': 'slideNumber'}).text((i+1)+'/'+length).appendTo($(el));[m
[32m+[m[32m            }[m
[32m+[m[32m            if (options.date) {[m
[32m+[m[32m                $('<div>', {'class': 'slideDate'}).text(new Date().toLocaleDateString()).appendTo($(el));[m
[32m+[m[32m            }[m
[32m+[m[32m            if (options.title) {[m
[32m+[m[32m                $('<div>', {'class': 'slideTitle'}).text(APP.title).appendTo($(el));[m
[32m+[m[32m            }[m
[32m+[m[32m        });[m
         $content.find('.' + slideClass).hide();[m
         $content.find('.' + slideClass + ':eq( ' + i + ' )').show();[m
         change(Slide.lastIndex, Slide.index);[m
     };[m
 [m
[32m+[m[32m    var updateOptions = Slide.updateOptions = function () {[m
[32m+[m[32m        draw(Slide.index);[m
[32m+[m[32m    };[m
[32m+[m
     var isPresentURL = Slide.isPresentURL = function () {[m
         var hash = window.location.hash;[m
         // Present mode has /present at the end of the hash[m
[36m@@ -269,12 +296,15 @@[m [mdefine([[m
         });[m
     };[m
 [m
[31m-    Slide.setModal = function ($m, $c, $p, iframe, ph) {[m
[32m+[m[32m    Slide.setModal = function (appObj, $m, $c, $p, iframe, opt, ph) {[m
         $modal = Slide.$modal = $m;[m
         $content = Slide.$content = $c;[m
         $pad = Slide.$pad = $p;[m
         ifrw = Slide.ifrw = iframe;[m
         placeholder = Slide.placeholder = ph;[m
[32m+[m[32m        options = Slide.options = opt;[m
[32m+[m[32m        APP = appObj;[m
[32m+[m[32m        console.log(APP);[m
         addEvent();[m
     };[m
 [m
[1mdiff --git a/www/slide/slide.less b/www/slide/slide.less[m
[1mindex 31dd1c1..3bbd52e 100644[m
[1m--- a/www/slide/slide.less[m
[1m+++ b/www/slide/slide.less[m
[36m@@ -90,7 +90,10 @@[m [mbody {[m
         //align-items: center;[m
         // flex-flow: column;[m
         padding: 2.5%;[m
[31m-        margin-top: ~"calc((100vh - 56.25vw)/2)";[m
[32m+[m[32m        // margin-top: ~"calc(((100vh - 56.25vw)/2))";[m
[32m+[m[32m        margin-top: 7.228vw;[m
[32m+[m[32m        margin-bottom: 7.228vw;[m
[32m+[m[32m        // margin-bottom: ~"calc(((100vh - 56.25vw)/2) - 1px)";[m
         border-top: 1px solid black;[m
         border-bottom: 1px solid black;[m
         height: 56.25vw;[m
[36m@@ -103,27 +106,14 @@[m [mbody {[m
         }[m
         h1 {[m
             padding-top: 0;[m
[32m+[m[32m            color: green;[m
         }[m
[31m-        .slideNumber {[m
[31m-            position: absolute;[m
[31m-            right: 5vh;[m
[31m-            bottom: 5vh;[m
[31m-            font-size: 15px;[m
[31m-        }[m
[31m-        .slideDate {[m
[31m-            position: absolute;[m
[31m-            left: 5vh;[m
[31m-            bottom: 5vh;[m
[31m-            font-size: 15px;[m
[31m-        }[m
[31m-        .slideTitle {[m
[31m-            position: absolute;[m
[31m-            top: 5vh;[m
[31m-            left: 0px; right: 0px;[m
[31m-            text-align: center;[m
[31m-            font-size: 15px;[m
[31m-        }[m
[32m+[m
     }[m
[32m+[m[32m    /*.slide-frame:first-child {[m
[32m+[m[32m        h1 { color: yellow; }[m
[32m+[m[32m        margin-top: ~"calc(((100vh - 56.25vw)/2))";[m
[32m+[m[32m    }*/[m
 }[m
 [m
 [m
[36m@@ -276,6 +266,24 @@[m [mdiv#modal #content, #print {[m
             max-width: 90%;[m
             max-height: 90%;[m
             margin: auto;[m
[32m+[m[32m        }        .slideNumber {[m
[32m+[m[32m            position: absolute;[m
[32m+[m[32m            right: 5vh;[m
[32m+[m[32m            bottom: 5vh;[m
[32m+[m[32m            .size(1);[m
[32m+[m[32m        }[m
[32m+[m[32m        .slideDate {[m
[32m+[m[32m            position: absolute;[m
[32m+[m[32m            left: 5vh;[m
[32m+[m[32m            bottom: 5vh;[m
[32m+[m[32m            .size(1);[m
[32m+[m[32m        }[m
[32m+[m[32m        .slideTitle {[m
[32m+[m[32m            position: absolute;[m
[32m+[m[32m            bottom: 5vh;[m
[32m+[m[32m            left: 0px; right: 0px;[m
[32m+[m[32m            text-align: center;[m
[32m+[m[32m            .size(1);[m
         }[m
     }[m
 }[m
warning: LF will be replaced by CRLF in www/slide/slide.js.
The file will have its original line endings in your working directory.
