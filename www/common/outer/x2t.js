// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    '/components/nthen/index.js',
    '/common/common-util.js',
    '/common/onlyoffice/current-version.js'
], function (ApiConfig, nThen, Util, CurrentVersion) {
    var X2T = {};

    var CURRENT_VERSION = X2T.CURRENT_VERSION = CurrentVersion.currentVersion;
    var debug = function (str) {
        if (localStorage.CryptPad_dev !== "1") { return; }
        console.debug(str);
    };

    X2T.start = function () {
        var x2tReady = Util.mkEvent(true);
        var fetchFonts = function (x2t, obj, cb) {
            if (!obj.fonts) { return void cb(); }
            var path = ApiConfig.httpSafeOrigin + '/common/onlyoffice/dist/'+CURRENT_VERSION+'/fonts/';
            var ver = '?' + ApiConfig.requireConf.urlArgs;
            var fonts = obj.fonts;
            var files = obj.fonts_files;
            var suffixes = {
                indexR: '',
                indexB: '_Bold',
                indexBI: '_Bold_Italic',
                indexI: '_Italic',
            };
            nThen(function (waitFor) {
                fonts.forEach(function (font) {
                    // Check if the font is already loaded
                    if (!font.NeedStyles) { return; }
                    // Pick the variants we need (regular, bold, italic)
                    ['indexR', 'indexB', 'indexI', 'indexBI'].forEach(function (k) {
                        if (typeof(font[k]) !== "number" || font[k] === -1) { return; } // No matching file
                        var file = files[font[k]];

                        var name = font.Name + suffixes[k] + '.ttf';
                        Util.fetch(path + file.Id + ver, waitFor(function (err, buffer) {
                            if (buffer) {
                                x2t.FS.writeFile('/working/fonts/' + name, buffer);
                            }
                        }));
                    });
                });
            }).nThen(function () {
                cb();
            });
        };
        var x2tInitialized = false;
        var x2tInit = function(x2t) {
            debug("x2t mount");
            // x2t.FS.mount(x2t.MEMFS, {} , '/');
            x2t.FS.mkdir('/working');
            x2t.FS.mkdir('/working/media');
            x2t.FS.mkdir('/working/fonts');
            x2t.FS.mkdir('/working/themes');
            x2tInitialized = true;
            x2tReady.fire();
            debug("x2t mount done");
        };
        var getX2T = function (cb) {
            // Perform the x2t conversion
            require(['/common/onlyoffice/x2t/x2t.js'], function() { // FIXME why does this fail without an access-control-allow-origin header?
                var x2t = window.Module;
                if (x2tInitialized) {
                    debug("x2t runtime already initialized");
                    return void x2tReady.reg(function () {
                        cb(x2t);
                    });
                }

                x2t.onRuntimeInitialized = function() {
                    debug("x2t in runtime initialized");
                    // Init x2t js module
                    x2tInit(x2t);
                    x2tReady.reg(function () {
                        cb(x2t);
                    });
                };
            });
        };

        /*
        var getFormatId = function (ext) {
            // Sheets
            if (ext === 'xlsx') { return 257; }
            if (ext === 'xls') { return 258; }
            if (ext === 'ods') { return 259; }
            if (ext === 'csv') { return 260; }
            if (ext === 'pdf') { return 513; }
            // Docs
            if (ext === 'docx') { return 65; }
            if (ext === 'doc') { return 66; }
            if (ext === 'odt') { return 67; }
            if (ext === 'txt') { return 69; }
            if (ext === 'html') { return 70; }

            // Slides
            if (ext === 'pptx') { return 129; }
            if (ext === 'ppt') { return 130; }
            if (ext === 'odp') { return 131; }

            return;
        };
        var getFromId = function (ext) {
            var id = getFormatId(ext);
            if (!id) { return ''; }
            return '<m_nFormatFrom>'+id+'</m_nFormatFrom>';
        };
        var getToId = function (ext) {
            var id = getFormatId(ext);
            if (!id) { return ''; }
            return '<m_nFormatTo>'+id+'</m_nFormatTo>';
        };
        var inputFormat = fileName.split('.').pop();
        */

        // Sanitize file names
        var illegalRe = /[\/\?<>\\:\*\|"]/g;
        var controlRe = /[\x00-\x1f\x80-\x9f]/g; // eslint-disable-line no-control-regex
        var reservedRe = /^\.+$/;
        var safeRe = /[&'%!"{}[\]]/g;
        var sanitize = function (input) {
            if (typeof input !== 'string') { return 'file'; }
            var s = input.split('.');
            var ext = s.pop() || 'bin';
            var name = s.join('');
            var replacement = '';
            var sanitized = name
                .replace(illegalRe, replacement)
                .replace(controlRe, replacement)
                .replace(reservedRe, replacement)
                .replace(safeRe, replacement);
            sanitized = sanitized || 'file';
            return sanitized.slice(0, 255) + '.' + ext;
        };

        var x2tConvertDataInternal = function(x2t, obj) {
            var data = obj.data;
            var fileName = obj.fileName;
            var outputFormat = obj.outputFormat;
            var images = obj.images;
            debug("Converting Data for " + fileName + " to " + outputFormat);

            // PDF
            var pdfData = '';
            if (outputFormat === "pdf" && typeof(data) === "object" && data.bin && data.buffer) {
                // Add conversion rules
                pdfData = "<m_bIsNoBase64>false</m_bIsNoBase64>" +
                          "<m_sFontDir>/working/fonts/</m_sFontDir>";
                // writing file to mounted working disk (in memory)
                x2t.FS.writeFile('/working/' + fileName, data.bin);
                x2t.FS.writeFile('/working/pdf.bin', data.buffer);
            } else {
                // writing file to mounted working disk (in memory)
                x2t.FS.writeFile('/working/' + fileName, data);
            }

            // Adding images
            Object.keys(images || {}).forEach(function (_mediaFileName) {
                if (/\.bin$/.test(_mediaFileName)) { return; }
                var mediasSources = obj.mediasSources || {};
                var mediasData = obj.mediasData || {};
                var mediaData = mediasData[_mediaFileName];
                var mediaFileName;
                if (mediaData) { // Theme image
                    var path = _mediaFileName.split('/');
                    mediaFileName = path.pop();
                    var theme = path[path.indexOf('themes') + 1];
                    try {
                        x2t.FS.mkdir('/working/themes/'+theme);
                        x2t.FS.mkdir('/working/themes/'+theme+'/media');
                    } catch (e) {
                        console.warn(e);
                    }
                    x2t.FS.writeFile('/working/themes/'+theme+'/media/' + mediaFileName, new Uint8Array(mediaData.content));
                    debug("Writing media data " + mediaFileName + " at /working/themes/"+theme+"/media/");
                    return;
                }
                // mediaData is undefined, check mediasSources
                mediaFileName = _mediaFileName.substring(6);
                var mediaSource = mediasSources[mediaFileName];
                mediaData = mediaSource ? mediasData[mediaSource.src] : undefined;
                if (mediaData) {
                    debug("Writing media data " + mediaFileName);
                    debug("Data");
                    var fileData = mediaData.content;
                    x2t.FS.writeFile('/working/media/' + mediaFileName, new Uint8Array(fileData));
                } else {
                    debug("Could not find media content for " + mediaFileName);
                }
            });

            var params =  "<?xml version=\"1.0\" encoding=\"utf-8\"?>"
                        + "<TaskQueueDataConvert xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">"
                        + "<m_sFileFrom>/working/" + fileName + "</m_sFileFrom>"
                        + "<m_sThemeDir>/working/themes</m_sThemeDir>"
                        + "<m_sFileTo>/working/" + fileName + "." + outputFormat + "</m_sFileTo>"
                        + pdfData
                        // + getFromId(inputFormat)
                        // + getToId(outputFormat)
                        + "<m_bIsNoBase64>false</m_bIsNoBase64>"
                        + "</TaskQueueDataConvert>";


            // writing params file to mounted working disk (in memory)
            x2t.FS.writeFile('/working/params.xml', params);
            try {
                // running conversion
                x2t.ccall("main1", "number", ["string"], ["/working/params.xml"]);
            } catch (e) {
                console.error(e);
                return "";
            }

            // reading output file from working disk (in memory)
            var result;
            try {
                result = x2t.FS.readFile('/working/' + fileName + "." + outputFormat);
            } catch (e) {
                debug("Failed reading converted file");
                return "";
            }
            return result;
        };

        var convert = function (obj, cb) {
            console.error(obj);
            obj.fileName = sanitize(obj.fileName);
            getX2T(function (x2t) {
                // Fonts
                fetchFonts(x2t, obj, function () {
                    var o = obj.outputFormat;

                    if (o !== 'pdf') {
                        // Add intermediary conversion to Microsoft Office format if needed
                        // (bin to pdf is allowed)
                        [
                            // Import from Open Document
                            {source: '.ods', format: 'xlsx'},
                            {source: '.odt', format: 'docx'},
                            {source: '.odp', format: 'pptx'},
                            // Export to non Microsoft Office
                            {source: '.bin', type: 'sheet', format: 'xlsx'},
                            {source: '.bin', type: 'doc', format: 'docx'},
                            {source: '.bin', type: 'presentation', format: 'pptx'},
                        ].forEach(function (_step) {
                            if (obj.fileName.endsWith(_step.source) && obj.outputFormat !== _step.format &&
                                (!_step.type || _step.type === obj.type)) {
                                obj.outputFormat = _step.format;
                                obj.data = x2tConvertDataInternal(x2t, obj);
                                obj.fileName += '.'+_step.format;
                            }
                        });
                        obj.outputFormat = o;
                    }

                    var data = x2tConvertDataInternal(x2t, obj);

                    // Convert to bin -- Import
                    // We need to extract the images
                    var images;
                    if (o === 'bin') {
                        images = [];
                        var files = x2t.FS.readdir("/working/media/");
                        files.forEach(function (file) {
                            if (file !== "." && file !== "..") {
                                var fileData = x2t.FS.readFile("/working/media/" + file, {
                                    encoding : "binary"
                                });
                                images.push({
                                    name: file,
                                    data: fileData
                                });
                            }
                        });

                    }

                    cb({
                        data: data,
                        images: images
                    });
                });
            });
        };

        return {
            convert: convert
        };
    };

    return X2T;
});
