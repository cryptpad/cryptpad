define([
    '/bower_components/tweetnacl/nacl-fast.min.js',
], function () {
    var Nacl = window.nacl;
    var Thumb = {
        dimension: 100,
    };

    var supportedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif', // TODO confirm this is true
    ];

    Thumb.isSupportedType = function (type) {
        return supportedTypes.indexOf(type) !== -1;
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

    var getResizedDimensions = function (img) {
        var h = img.height;
        var w = img.width;

        var dim = Thumb.dimension;
        // if the image is too small, don't bother making a thumbnail
        if (h <= dim || w <= dim) { return null; }

        // the image is taller than it is wide, so scale to that.
        var r = dim / (h > w? h: w); // ratio

        var d;
        if (h > w) {
            d = Math.floor(((h * r) - dim) / 2);
            return {
                x1: 0,
                x2: dim,
                y1: d,
                y2: dim + d,
            };
        } else {
            d = Math.floor(((w * r) - dim) / 2);
            return {
                x1: d,
                x2: dim + d,
                y1: 0,
                y2: dim,
            };
        }
    };

    // assumes that your canvas is square
    // nodeback returning blob
    Thumb.fromCanvas = Thumb.fromImage = function (canvas, cb) {
        var c2 = document.createElement('canvas');
        var D = getResizedDimensions(canvas);
        if (!D) { return void cb('TOO_SMALL'); }

        c2.width = Thumb.dimension;
        c2.height = Thumb.dimension;

        var ctx = c2.getContext('2d');
        ctx.drawImage(canvas, D.x1, D.y1, D.x2, D.y2);
        c2.toBlob(function (blob) {
            cb(void 0, blob);
        });
    };

    Thumb.fromImageBlob = function (blob, cb) {
        var url = URL.createObjectURL(blob);
        var img = new Image();

        img.onload = function () {
            Thumb.fromImage(img, cb);
        };
        img.onerror = function () {
            cb('ERROR');
        };
        img.src = url;
    };

    Thumb.fromVideo = function (video, cb) {
        cb = cb; // WIP
    };

    return Thumb;
});
