define([
    '/bower_components/marked/marked.min.js',
    '/bower_components/diff-dom/diffDOM.js',
    '/bower_components/jquery/dist/jquery.min.js',
],function (Marked) {
    var $ = window.jQuery;
    var DiffDOM = window.diffDOM;

    var truthy = function (x) { return x; };

    var Slide = {
        index: 0,
        lastIndex: 0,
        content: [],
        changeHandlers: [],
    };
    var APP;
    var ifrw;
    var $modal;
    var $content;
    var $pad;
    var placeholder;
    var options;
    var separator = '<hr data-pewpew="pezpez">';
    var separatorReg = /<hr data\-pewpew="pezpez">/g;
    var slideClass = 'slide-frame';

    Slide.onChange = function (f) {
        if (typeof(f) === 'function') {
            Slide.changeHandlers.push(f);
        }
    };

    var getNumberOfSlides = Slide.getNumberOfSlides = function () {
        return $content.find('.' + slideClass).length;
    };

    var change = function (oldIndex, newIndex) {
        if (Slide.changeHandlers.length) {
            Slide.changeHandlers.some(function (f, i) {
                // HERE
                f(oldIndex, newIndex, getNumberOfSlides());
            });
        }
    };

    var forbiddenTags = Slide.forbiddenTags = [
        'SCRIPT',
        'IFRAME',
        'OBJECT',
        'APPLET',
        'VIDEO',
        'AUDIO',
    ];
    var unsafeTag = function (info) {
        if (['addAttribute', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
            if (/^on/.test(info.diff.name)) {
                console.log("Rejecting forbidden element attribute with name", info.diff.name);
                return true;
            }
        }
        if (['addElement', 'replaceElement'].indexOf(info.diff.action) !== -1) {
            var msg = "Rejecting forbidden tag of type (%s)";
            if (info.diff.element && forbiddenTags.indexOf(info.diff.element.nodeName) !== -1) {
                console.log(msg, info.diff.element.nodeName);
                return true;
            } else if (info.diff.newValue && forbiddenTags.indexOf(info.diff.newValue.nodeName) !== -1) {
                console.log("Replacing restricted element type (%s) with PRE", info.diff.newValue.nodeName);
                info.diff.newValue.nodeName = 'PRE';
            }
        }
    };

    var domFromHTML = Slide.domFromHTML = function (html) {
        return new DOMParser().parseFromString(html, "text/html");
    };

    var DD = new DiffDOM({
        preDiffApply: function (info) {
            if (unsafeTag(info)) { return true; }
        }
    });

    var makeDiff = function (A, B) {
        var Err;
        var Els = [A, B].map(function (frag) {
            if (typeof(frag) === 'object') {
                if (!frag || (frag && !frag.body)) {
                    Err = "No body";
                    return;
                }
                var els = frag.body.querySelectorAll('#content');
                if (els.length) {
                    return els[0];
                }
            }
            Err = 'No candidate found';
        });
        if (Err) { return Err; }
        var patch = DD.diff(Els[0], Els[1]);
        return patch;
    };

    var slice = function (coll) {
        return Array.prototype.slice.call(coll);
    };

    /*  remove listeners from the DOM */
    var removeListeners = function (root) {
        slice(root.attributes).map(function (attr) {
            if (/^on/.test(attr.name)) {
                root.attributes.removeNamedItem(attr.name);
            }
        });
        // all the way down
        slice(root.children).forEach(removeListeners);
    };

    var fixCSS = function (css) {
        var append = '.cp #print .slide-frame ';
        var append2 = '.cp div#modal #content .slide-frame ';
        return css.replace(/(\n*)([^\n]+)\s*\{/g, '$1' + append + '$2,' + append2 + '$2 {');
    };
    var draw = Slide.draw =  function (i) {
        i = i || 0;
        if (typeof(Slide.content) !== 'string') { return; }

        var c = Slide.content;
        var m = '<span class="slide-container"><span class="'+slideClass+'">'+Marked(c).replace(separatorReg, '</span></span><span class="slide-container"><span class="'+slideClass+'">')+'</span></span>';

        var Dom = domFromHTML('<div id="content">' + m + '</div>');
        removeListeners(Dom.body);
        var patch = makeDiff(domFromHTML($content[0].outerHTML), Dom);

        if (typeof(patch) === 'string') {
            $content.html(m);
        } else {
            DD.apply($content[0], patch);
        }
        var length = getNumberOfSlides();
        $modal.find('style.slideStyle').remove();
        if (options.style && Slide.shown) {
            $modal.prepend($('<style>', {'class': 'slideStyle'}).text(fixCSS(options.style)));
        }
        $content.find('.slide-frame').each(function (i, el) {
            if (options.slide) {
                $('<div>', {'class': 'slideNumber'}).text((i+1)+'/'+length).appendTo($(el));
            }
            if (options.date) {
                $('<div>', {'class': 'slideDate'}).text(new Date().toLocaleDateString()).appendTo($(el));
            }
            if (options.title) {
                $('<div>', {'class': 'slideTitle'}).text(APP.title).appendTo($(el));
            }
        });
        //$content.find('.' + slideClass).hide();
        //$content.find('.' + slideClass + ':eq( ' + i + ' )').show();
        $content.css('margin-left', -(i*100)+'vw');
        change(Slide.lastIndex, Slide.index);
    };

    var updateOptions = Slide.updateOptions = function () {
        draw(Slide.index);
    };

    var isPresentURL = Slide.isPresentURL = function () {
        var hash = window.location.hash;
        // Present mode has /present at the end of the hash
        var urlLastFragment = hash.slice(hash.lastIndexOf('/')+1);
        return urlLastFragment === "present";
    };

    var show = Slide.show = function (bool, content) {
        Slide.shown = bool;
        if (bool) {
            Slide.update(content);
            Slide.draw(Slide.index);
            $modal.addClass('shown');
            $(ifrw).focus();
            change(null, Slide.index);
            if (!isPresentURL()) {
                window.location.hash += '/present';
            }
            $pad.contents().find('.cryptpad-present-button').hide();
            $pad.contents().find('.cryptpad-source-button').show();
            $pad.addClass('fullscreen');
            $('#iframe-container').addClass('fullscreen');
            $('.top-bar').hide();
            return;
        }
        window.location.hash = window.location.hash.replace(/\/present$/, '');
        change(Slide.index, null);
        $pad.contents().find('.cryptpad-present-button').show();
        $pad.contents().find('.cryptpad-source-button').hide();
        $pad.removeClass('fullscreen');
        $('#iframe-container').removeClass('fullscreen');
        $('.top-bar').show();
        $modal.removeClass('shown');
    };

    var update = Slide.update = function (content, init) {
        if (!Slide.shown && !init) { return; }
        if (!content) { content = ''; }
        var old = Slide.content;
        Slide.content = content.replace(/\n\s*\-\-\-\s*\n/g, '\n\n'+separator+'\n\n');
        if (old !== Slide.content) {
            draw(Slide.index);
            return;
        }
        change(Slide.lastIndex, Slide.index);
    };

    var left = Slide.left = function () {
        console.log('left');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = Math.max(0, Slide.index - 1);
        Slide.draw(i);
    };

    var right = Slide.right = function () {
        console.log('right');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = Math.min(getNumberOfSlides() -1, Slide.index + 1);
        Slide.draw(i);
    };

    var first = Slide.first = function () {
        console.log('first');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = 0;
        Slide.draw(i);
    };

    var last = Slide.last = function () {
        console.log('end');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = getNumberOfSlides() - 1;
        Slide.draw(i);
    };

    var addEvent = function () {
        var icon_to;
        $modal.mousemove(function (e) {
            var $buttons = $modal.find('.button');
            $buttons.show();
            if (icon_to) { window.clearTimeout(icon_to); }
            icon_to = window.setTimeout(function() {
                $buttons.fadeOut();
            }, 1000);
        });
        $modal.find('#button_exit').click(function (e) {
            var ev = $.Event("keyup");
            ev.which = 27;
            $modal.trigger(ev);
        });
        $modal.find('#button_left').click(function (e) {
            var ev = $.Event("keyup");
            ev.which = 37;
            $modal.trigger(ev);
        });
        $modal.find('#button_right').click(function (e) {
            var ev = $.Event("keyup");
            ev.which = 39;
            $modal.trigger(ev);
        });

        $(ifrw).on('keyup', function (e) {
            if (!Slide.shown) { return; }
            switch(e.which) {
                case 33: // pageup
                case 38: // up
                case 37: // left
                    Slide.left();
                    break;
                case 34: // pagedown
                case 32: // space
                case 40: // down
                case 39: // right
                    Slide.right();
                    break;
                case 36: // home
                    Slide.first();
                    break;
                case 35: // end
                    Slide.last();
                    break;
                case 27: // esc
                    show(false);
                    break;
                default:
                    console.log(e.which);
            }
        });
    };

    Slide.setModal = function (appObj, $m, $c, $p, iframe, opt, ph) {
        $modal = Slide.$modal = $m;
        $content = Slide.$content = $c;
        $pad = Slide.$pad = $p;
        ifrw = Slide.ifrw = iframe;
        placeholder = Slide.placeholder = ph;
        options = Slide.options = opt;
        APP = appObj;
        console.log(APP);
        addEvent();
    };

    return Slide;
});
