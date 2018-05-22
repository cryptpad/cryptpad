require([
    'jquery',
    '/mediatag/media-tag.js',
    '/bower_components/tweetnacl/nacl-fast.min.js'
], function ($, MediaTag) {
    console.log(MediaTag);
    console.log($('media-tag'));
    if (typeof MediaTag === "function") {
        MediaTag.PdfPlugin.viewer = '/common/pdfjs/web/viewer.html';

        var config = {
            allowed: ['download'],
            download: {
                text: 'Download'
            }
        };
        MediaTag($('media-tag'), config)
            .on('progress', function (data) {
                console.log(data.progress);
            })
            .on('complete', function (data) {
                console.log(data);
            })
            .on('error', function (data) {
                console.error(data);
            });
        MediaTag($('media-tag')[1])
            .on('progress', function (data) {
                console.log(data.progress);
            })
            .on('complete', function (data) {
                console.log(data);
            })
            .on('error', function (data) {
                console.error(data);
            });
        MediaTag($('media-tag')[2])
            .on('progress', function (data) {
                console.log(data.progress);
            })
            .on('complete', function (data) {
                console.log(data);
            })
            .on('error', function (data) {
                console.error(data);
            });
        MediaTag($('media-tag')[3])
            .on('progress', function (data) {
                console.log(data.progress);
            })
            .on('complete', function (data) {
                console.log(data);
            })
            .on('error', function (data) {
                console.error(data);
            });
    }
});
