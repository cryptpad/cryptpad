define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var Thumb = {
        dimension: 150, // thumbnails are all 150px
    };

    // create thumbnail image from metadata
    // return an img tag, or undefined if anything goes wrong
    Thumb.fromMetadata = function (metadata) {
        if (!metadata || typeof(metadata) !== 'object' || !metadata.thumbnail) { return; }
        try {
            var u8 = Nacl.util.decodeBase64(metadata.thumbnail);
            var blob = new Blob([u8], {
                type: 'image/png'
            });
            var url = URL.createObjectURL(blob);
            var img = new Image();
            img.src = url;
            img.width = Thumb.dimension;
            img.height = Thumb.dimension;
            return img;
        } catch (e) {
            console.error(e);
            return;
        }
    };

    // assumes that your canvas is square
    // nodeback returning blob
    Thumb.fromCanvas = function (canvas, cb) {
        canvas = canvas;
        var c2 = document.createElement('canvas');
        var d = Thumb.dimension;
        c2.width = d;
        c2.height = 2;

        var ctx = c2.getContext('2d');
        ctx.drawImage(canvas, 0, 0, d, d);
        c2.toBlob(function (blob) {
            cb(void 0, blob);
        });
    };

    Thumb.fromVideo = function (video, cb) {
        cb = cb; // WIP
    };

    return Thumb;
});
