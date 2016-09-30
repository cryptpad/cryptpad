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
    var ifrw = $('#pad-iframe')[0].contentWindow;
    var $modal;
    var $content;
    Slide.setModal = function ($m, $c) {
        $modal = Slide.$modal = $m;
        $content = Slide.$content = $c;
    };

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
                console.log("Rejecting forbidden element attribute with name", info.diff.element.nodeName);
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

    var draw = Slide.draw =  function (i) {
        console.log("Trying to draw slide #%s", i);
        if (typeof(Slide.content[i]) !== 'string') { return; }

        var c = Slide.content[i];
        var Dom = domFromHTML('<div id="content">' + Marked(c) + '</div>');
        var patch = makeDiff(domFromHTML($content[0].outerHTML), Dom);

        if (typeof(patch) === 'string') {
            $content.html(Marked(c));
        } else {
            DD.apply($content[0], patch);
        }
        change(Slide.lastIndex, Slide.index);
    };

    var show = Slide.show = function (bool, content) {
        Slide.shown = bool;
        if (bool) {
            Slide.update(content);
            Slide.draw(Slide.index);
            $modal.addClass('shown');
            change(null, Slide.index);
            return;
        }
        change(Slide.index, null);
        $modal.removeClass('shown');
    };

    var update = Slide.update = function (content) {
        if (!Slide.shown) { return; }
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

    $(ifrw).on('keyup', function (e) {
        if (!Slide.shown) { return; }
        switch(e.which) {
            case 37:
                Slide.left();
                break;
            case 32:
            case 39: // right
                Slide.right();
                break;
            case 27: // esc
                if (!Slide.readOnly) {
                    show(false);
                }
                break;
            default:
                console.log(e.which);
        }
    });

    return Slide;
});
