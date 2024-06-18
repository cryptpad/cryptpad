// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

require([
    'jquery',
    '/mediatag/media-tag.js',
    '/components/tweetnacl/nacl-fast.min.js'
], function ($, MediaTag) {
    console.log(MediaTag);
    console.log($('media-tag'));
    if (typeof MediaTag === "function") {
        MediaTag.PdfPlugin.viewer = '/lib/pdfjs/web/viewer.html';

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
