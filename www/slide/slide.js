define([
    'jquery',
    '/common/diffMarked.js',
],function ($, DiffMd) {

    var Slide = {
        index: 0,
        lastIndex: 0,
        content: [],
        changeHandlers: [],
    };
    var ifrw;
    var $modal;
    var $content;
    var $pad;
    var placeholder;
    var options;
    var separator = '<hr data-pewpew="pezpez">';
    var separatorReg = /<hr data\-pewpew="pezpez">/g;
    var slideClass = 'slide-frame';
    var Title;

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
            Slide.changeHandlers.some(function (f) {
                f(oldIndex, newIndex, getNumberOfSlides());
            });
        }
    };

    var updateFontSize = Slide.updateFontSize = function () {
        // 20vh
        // 20 * 16 / 9vw
        var wbase = 20;
        var vh = 20;
        var $elem = $(window);
        if (!Slide.shown) {
            wbase = 10;
            vh *= $content.height()/$(window).height();
            $elem = $content;
        }
        if ($elem.width() > 16/9*$elem.height()) {
            $content.css('font-size', vh+'vh');
            // $print.css('font-size', '20vh');
            return;
        }
        $content.css('font-size', (wbase*9/16)+'vw');
        // $print.css('font-size', (20*9/16)+'vw');
    };

    var fixCSS = function (css) {
        var append = '.cp #print .slide-frame ';
        var append2 = '.cp div#modal #content .slide-frame ';
        return css.replace(/(\n*)([^\n}]+)\s*\{/g, '$1' + append + '$2,' + append2 + '$2 {');
    };

    var goTo = Slide.goTo = function (i) {
        i = i || 0;
        Slide.index = i;
        $content.find('.slide-container').first().css('margin-left', -(i*100)+'%');
        updateFontSize();
        change(Slide.lastIndex, Slide.index);
        $modal.find('#button_left > span').css({
            opacity: Slide.index === 0? 0: 1
        });
        $modal.find('#button_right > span').css({
            opacity: Slide.index === (getNumberOfSlides() -1)? 0: 1
        });
    };
    var draw = Slide.draw =  function (i) {
        if (typeof(Slide.content) !== 'string') { return; }

        var c = Slide.content;
        var m = '<span class="slide-container"><span class="'+slideClass+'">'+DiffMd.render(c).replace(separatorReg, '</span></span><span class="slide-container"><span class="'+slideClass+'">')+'</span></span>';

        DiffMd.apply(m, $content);

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
                $('<div>', {'class': 'slideTitle'}).text(Title.title).appendTo($(el));
            }
        });
        $content.removeClass('transition');
        if (options.transition || typeof(options.transition) === "undefined") {
            $content.addClass('transition');
        }
        //$content.find('.' + slideClass).hide();
        //$content.find('.' + slideClass + ':eq( ' + i + ' )').show();
        //$content.css('margin-left', -(i*100)+'vw');
        goTo(Math.min(i, getNumberOfSlides() - 1));
    };

    Slide.updateOptions = function () {
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
                if (window.location.href.slice(-1) !== '/') {
                    window.location.hash += '/';
                }
                window.location.hash += 'present';
            }
            $pad.contents().find('.cryptpad-present-button').hide();
            $pad.contents().find('.cryptpad-source-button').show();
            $pad.addClass('fullscreen');
            $('#iframe-container').addClass('fullscreen');
            $('.top-bar').hide();
            updateFontSize();
            return;
        }
        window.location.hash = window.location.hash.replace(/\/present$/, '/');
        change(Slide.index, null);
        $pad.contents().find('.cryptpad-present-button').show();
        $pad.contents().find('.cryptpad-source-button').hide();
        $pad.removeClass('fullscreen');
        $('#iframe-container').removeClass('fullscreen');
        $('.top-bar').show();
        $modal.removeClass('shown');
        updateFontSize();
    };

    Slide.update = function (content) {
        updateFontSize();
        //if (!init) { return; }
        if (!content) { content = ''; }
        var old = Slide.content;
        Slide.content = content.replace(/\n\s*\-\-\-\s*\n/g, '\n\n'+separator+'\n\n');
        if (old !== Slide.content) {
            draw(Slide.index);
            return;
        }
        change(Slide.lastIndex, Slide.index);
    };

    Slide.left = function () {
        console.log('left');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = Math.max(0, Slide.index - 1);
        Slide.goTo(i);
    };

    Slide.right = function () {
        console.log('right');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = Math.min(getNumberOfSlides() -1, Slide.index + 1);
        Slide.goTo(i);
    };

    Slide.first = function () {
        console.log('first');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = 0;
        Slide.goTo(i);
    };

    Slide.last = function () {
        console.log('end');
        Slide.lastIndex = Slide.index;

        var i = Slide.index = getNumberOfSlides() - 1;
        Slide.goTo(i);
    };

    var addEvent = function () {
        var icon_to;
        $modal.mousemove(function () {
            var $buttons = $modal.find('.button');
            $buttons.show();
            if (icon_to) { window.clearTimeout(icon_to); }
            icon_to = window.setTimeout(function() {
                $buttons.fadeOut();
            }, 1000);
        });
        $modal.find('#button_exit').click(function () {
            var ev = $.Event("keyup");
            ev.which = 27;
            $modal.trigger(ev);
        });
        $modal.find('#button_left').click(function () {
            var ev = $.Event("keyup");
            ev.which = 37;
            $modal.trigger(ev);
        });
        $modal.find('#button_right').click(function () {
            console.log('right');
            var ev = $.Event("keyup");
            ev.which = 39;
            $modal.trigger(ev);
        });

        $pad.contents().find('.CodeMirror').keyup(function (e) { e.stopPropagation(); });
        $(ifrw).on('keyup', function (e) {
            //if (!Slide.shown) { return; }
            if (e.ctrlKey) { return; }
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

    $(window).resize(Slide.updateFontSize);

    // Swipe
    var addSwipeEvents = function () {
        var touch = {
            maxTime: 2000,
            minXDist: 150,
            maxYDist: 100
        };

        var resetSwipe = function () {
            touch.x = 0;
            touch.y = 0;
            touch.time = 0;
        };

        $content.on('touchstart', function (e) {
            e.preventDefault();
            resetSwipe();
            var t = e.originalEvent.changedTouches[0];
            touch.x = t.pageX;
            touch.y = t.pageY;
            touch.time = new Date().getTime();
        });

        $content.on('touchend', function (e) {
            e.preventDefault();
            var t = e.originalEvent.changedTouches[0];
            var xDist = t.pageX - touch.x;
            var yDist = t.pageY - touch.y;
            var time = new Date().getTime() - touch.time;
            if (time <= touch.maxTime && Math.abs(xDist) >= touch.minXDist && Math.abs(yDist) <= touch.maxYDist) {
                if (xDist < 0) {
                    Slide.right();
                    return;
                }
                Slide.left();
            }
        });

        $content.on('touchmove', function (e){
            e.preventDefault();
        });
    };


    Slide.setModal = function ($m, $c, $p, iframe, opt, ph) {
        $modal = Slide.$modal = $m;
        $content = Slide.$content = $c;
        $pad = Slide.$pad = $p;
        ifrw = Slide.ifrw = iframe;
        placeholder = Slide.placeholder = ph;
        options = Slide.options = opt;
        addEvent();
        addSwipeEvents();
    };

    Slide.setTitle = function (titleObj) {
        Title = titleObj;
    };

    return Slide;
});
