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
    var ifrw;
    var $modal;
    var $content;
    var $pad;
    var placeholder;

    Slide.onChange = function (f) {
        if (typeof(f) === 'function') {
            Slide.changeHandlers.push(f);
        }
    };

    var change = function (oldIndex, newIndex) {
        if (Slide.changeHandlers.length) {
            Slide.changeHandlers.some(function (f, i) {
                // HERE
                f(oldIndex, newIndex, Slide.content.length);
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
                if (!frag && frag.body) {
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

    var draw = Slide.draw =  function (i) {
        console.log("Trying to draw slide #%s", i);
        if (typeof(Slide.content[i]) !== 'string') { return; }

        var c = Slide.content[i];
        var Dom = domFromHTML('<div id="content">' + Marked(c) + '</div>');
        removeListeners(Dom.body);
        var patch = makeDiff(domFromHTML($content[0].outerHTML), Dom);

        if (typeof(patch) === 'string') {
            $content.html(Marked(c));
        } else {
            DD.apply($content[0], patch);
        }
        change(Slide.lastIndex, Slide.index);
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

    var update = Slide.update = function (content) {
        if (!Slide.shown) { return; }
        if (!content) { content = placeholder; }
        var old = Slide.content[Slide.index];
        Slide.content = content.split(/\n\s*\-\-\-\s*\n/).filter(truthy);
        if (old !== Slide.content[Slide.index]) {
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

        var i = Slide.index = Math.min(Slide.content.length -1, Slide.index + 1);
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

        var i = Slide.index = Slide.content.length - 1;
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

    Slide.setModal = function ($m, $c, $p, iframe, ph) {
        $modal = Slide.$modal = $m;
        $content = Slide.$content = $c;
        $pad = Slide.$pad = $p;
        ifrw = Slide.ifrw = iframe;
        placeholder = Slide.placeholder = ph;
        addEvent();
    };

    return Slide;
});
