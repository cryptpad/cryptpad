define([
    'jquery',
    '/common/common-util.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/bower_components/nthen/index.js',
], function ($, Util, Hyperjson, nThen) {
    var module = {
        ext: '.html'
    };

    var exportMediaTags = function (inner, cb) {
        var $clone = $(inner).clone();
        nThen(function (waitFor) {
            $(inner).find('media-tag').each(function (i, el) {
                if (!$(el).data('blob') || !el.blob) { return; }
                Util.blobToImage(el.blob || $(el).data('blob'), waitFor(function (imgSrc) {
                    $clone.find('media-tag[src="' + $(el).attr('src') + '"] img')
                        .attr('src', imgSrc);
                    $clone.find('media-tag').parent()
                        .find('.cke_widget_drag_handler_container').remove();
                }));
            });
        }).nThen(function () {
            cb($clone[0]);
        });
    };

    module.getHTML = function (inner) {
        return ('<!DOCTYPE html>\n' + '<html>\n' +
                '  <head><meta charset="utf-8"></head>\n  <body>' +
            inner.innerHTML.replace(/<img[^>]*class="cke_anchor"[^>]*data-cke-realelement="([^"]*)"[^>]*>/g,
                function(match,realElt){
                    //console.log("returning realElt \"" + unescape(realElt)+ "\".");
                    return decodeURIComponent(realElt); }) +
            '  </body>\n</html>'
        );
    };

    module.main = function (userDoc, cb) {
        var inner;
        if (userDoc && userDoc.tagName) {
            inner = userDoc;
        } else {
            try {
                if (Array.isArray(userDoc)) {
                    inner = Hyperjson.toDOM(userDoc);
                } else {
                    console.error('This Pad is not an array!', userDoc);
                    return void cb('');
                }
            } catch (e) {
                console.log(JSON.stringify(userDoc));
                console.error(userDoc);
                console.error(e);
                return void cb('');
            }
        }
        exportMediaTags(inner, function (toExport) {
            cb(new Blob([ module.getHTML(toExport) ], { type: "text/html;charset=utf-8" }));
        });
    };

    return module;
});
