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
        'image/gif',
        'video/'
    ];

    Thumb.isSupportedType = function (type) {
        return supportedTypes.some(function (t) {
            return type.indexOf(t) !== -1;
        });
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

    var getResizedDimensions = function (img, type) {
        var h = type === 'video' ? img.videoHeight : img.height;
        var w = type === 'video' ? img.videoWidth : img.width;

        var dim = Thumb.dimension;
        // if the image is too small, don't bother making a thumbnail
        if (h <= dim && w <= dim) { return null; }

        // the image is taller than it is wide, so scale to that.
        var r = dim / (h > w? h: w); // ratio

        var d;
        if (h > w) {
            var newW = Math.floor(w*r);
            d = Math.floor((dim - newW) / 2);
            return {
                x: d,
                w: newW,
                y: 0,
                h: dim,
            };
        } else {
            var newH = Math.floor(h*r);
            d = Math.floor((dim - newH) / 2);
            return {
                x: 0,
                w: dim,
                y: d,
                h: newH
            };
        }
    };

    // assumes that your canvas is square
    // nodeback returning blob
    Thumb.fromCanvas = Thumb.fromImage = function (canvas, D, cb) {
        var c2 = document.createElement('canvas');
        if (!D) { return void cb('TOO_SMALL'); }

        c2.width = Thumb.dimension;
        c2.height = Thumb.dimension;

        var ctx = c2.getContext('2d');
        ctx.drawImage(canvas, D.x, D.y, D.w, D.h);
        c2.toBlob(function (blob) {
            cb(void 0, blob);
        });
    };

    Thumb.fromImageBlob = function (blob, cb) {
        var url = URL.createObjectURL(blob);
        var img = new Image();

        img.onload = function () {
            var D = getResizedDimensions(img, 'image');
            Thumb.fromImage(img, D, function (err, t) {
                if (err === 'TOO_SMALL') { return void cb(void 0, blob); }
                cb(err, t);
            });
        };
        img.onerror = function () {
            cb('ERROR');
        };
        img.src = url;
    };
    Thumb.fromVideoBlob = function (blob, cb) {
        var url = URL.createObjectURL(blob);
        var video = document.createElement("VIDEO");

        video.src = url;
        video.addEventListener('loadedmetadata', function() {
            video.currentTime = Number(Math.floor(Math.min(video.duration/10, 5)));
            video.addEventListener('loadeddata', function() {
                var D = getResizedDimensions(video, 'video');
                Thumb.fromCanvas(video, D, cb);
            });
        });
        video.addEventListener('error', function (e) {
            console.error(e);
            cb('ERROR');
        });
    };
    Thumb.fromBlob = function (blob, cb) {
        if (blob.type.indexOf('video/') !== -1) {
            return void Thumb.fromVideoBlob(blob, cb);
        }
        Thumb.fromImageBlob(blob, cb);
    };

    Thumb.fromVideo = function (video, cb) {
        cb = cb; // WIP
    };

    return Thumb;
});
