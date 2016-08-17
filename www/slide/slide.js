define([
    '/bower_components/marked/marked.min.js',
    '/bower_components/jquery/dist/jquery.min.js',
],function (Marked) {
    var $ = window.jQuery;

    var truthy = function (x) { return x; };

    var Slide = {
        index: 0,
        lastIndex: 0,
        content: [],
    };
    var $modal;
    var $content;
    Slide.setModal = function ($m, $c) {
        $modal = Slide.$modal = $m;
        $content = Slide.$content = $c;
    };
    var draw = Slide.draw =  function (i) {
        console.log("Trying to draw slide #%s", i);
        if (typeof(Slide.content[i]) !== 'string') { return; }

        var c = Slide.content[i];
        console.log(c);
        $content.html(Marked(c));
    };

    var show = Slide.show = function (bool, content) {
        Slide.shown = bool;
        if (bool) {
            Slide.update(content);
            Slide.draw(Slide.index);
            $modal.addClass('shown');
            return;
        }
        $modal.removeClass('shown');
    };

    var update = Slide.update = function (content) {
        if (!Slide.shown) { return; }
        console.log(content);
        Slide.content = content.split(/\n\-\-\-\n/).filter(truthy);
        draw(Slide.index);
    };

    var left = Slide.left = function () {
        console.log('left');
        var i = Slide.index = Math.max(0, Slide.index - 1);
        Slide.draw(i);
    };

    var right = Slide.right = function () {
        console.log('right');
        var i = Slide.index = Math.min(Slide.content.length, Slide.index + 1);
        Slide.draw(i);
    };

    $(document).on('keyup', function (e) {
        if (!Slide.shown) { return; }
        switch(e.which) {
            case 37:
                Slide.left();
                break;
            case 39: // right
                Slide.right();
                break;
            case 27: // esc
                show(false);
                break;
            default:
                console.log(e.which);
        }
    });

    return Slide;
});
