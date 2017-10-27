define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/common-util.js',
    '/common/cryptget.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-common-interface.js',
    '/api/config',
    '/common/common-realtime.js',
    '/customize/pages.js',

    '/customize/application_config.js',
    '/common/common-thumbnail.js',
    '/whiteboard/colors.js',

    '/bower_components/secure-fabric.js/dist/fabric.min.js',
    '/bower_components/file-saver/FileSaver.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    TextPatcher,
    Toolbar,
    JSONSortify,
    JsonOT,
    Cryptpad,
    Util,
    Cryptget,
    nThen,
    SFCommon,
    SFUI,
    ApiConfig,
    CommonRealtime,
    Pages,
    AppConfig,
    Thumb,
    Colors)
{
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        $: $
    };
    var Fabric = APP.Fabric = window.fabric;

    var stringify = function (obj) {
        return JSONSortify(obj);
    };

    var toolbar;

    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };

    var andThen = function (common) {
        var config = {};
        /* Initialize Fabric */
        var canvas = APP.canvas = new Fabric.Canvas('cp-app-whiteboard-canvas', {
            containerClass: 'cp-app-whiteboard-canvas-container'
        });
        var $canvas = $('canvas');
        var $controls = $('#cp-app-whiteboard-controls');
        var $canvasContainer = $('canvas').parents('.cp-app-whiteboard-canvas-container');
        var $pickers = $('#cp-app-whiteboard-pickers');
        var $colors = $('#cp-app-whiteboard-colors');
        var $cursors = $('#cp-app-whiteboard-cursors');
        var $deleteButton = $('#cp-app-whiteboard-delete');
        var $toggle = $('#cp-app-whiteboard-toggledraw');
        var $width = $('#cp-app-whiteboard-width');
        var $widthLabel = $('label[for="cp-app-whiteboard-width"]');
        var $opacity = $('#cp-app-whiteboard-opacity');
        var $opacityLabel = $('label[for="cp-app-whiteboard-opacity"]');


        // Brush

        var readOnly = false;
        var brush = {
            color: '#000000',
            opacity: 1
        };

        var createCursor = function () {
            var w = canvas.freeDrawingBrush.width;
            var c = canvas.freeDrawingBrush.color;
            var size = w > 30 ? w+2 : w+32;
            $cursors.html('<canvas width="'+size+'" height="'+size+'"></canvas>');
            var $ccanvas = $cursors.find('canvas');
            var ccanvas = $ccanvas[0];

            var ctx = ccanvas.getContext('2d');
            var centerX = size / 2;
            var centerY = size / 2;
            var radius = w/2;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = c;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = brush.color;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(size/2, 0); ctx.lineTo(size/2, 10);
            ctx.moveTo(size/2, size); ctx.lineTo(size/2, size-10);
            ctx.moveTo(0, size/2); ctx.lineTo(10, size/2);
            ctx.moveTo(size, size/2); ctx.lineTo(size-10, size/2);
            ctx.strokeStyle = '#000000';
            ctx.stroke();

            var img = ccanvas.toDataURL("image/png");
            $controls.find('.cp-app-whiteboard-selected > img').attr('src', img);
            canvas.freeDrawingCursor = 'url('+img+') '+size/2+' '+size/2+', crosshair';
        };

        var updateBrushWidth = function () {
            var val = $width.val();
            canvas.freeDrawingBrush.width = Number(val);
            $widthLabel.text(Cryptpad.Messages._getKey("canvas_widthLabel", [val]));
            $('#cp-app-whiteboard-width-val').text(val + 'px');
            createCursor();
        };
        updateBrushWidth();
        $width.on('change', updateBrushWidth);

        var updateBrushOpacity = function () {
            var val = $opacity.val();
            brush.opacity = Number(val);
            canvas.freeDrawingBrush.color = Colors.hex2rgba(brush.color, brush.opacity);
            $opacityLabel.text(Cryptpad.Messages._getKey("canvas_opacityLabel", [val]));
            $('#cp-app-whiteboard-opacity-val').text((Number(val) * 100) + '%');
            createCursor();
        };
        updateBrushOpacity();
        $opacity.on('change', updateBrushOpacity);

        var pickColor = function (current, cb) {
            var $picker = $('<input>', {
                type: 'color',
                value: '#FFFFFF',
                })
            .on('change', function () {
                var color = this.value;
                cb(color);
            }).appendTo($pickers);
            setTimeout(function () {
                $picker.val(current);
                $picker.click();
            });
        };
        var setColor = function (c) {
            c = Colors.rgb2hex(c);
            brush.color = c;
            canvas.freeDrawingBrush.color = Colors.hex2rgba(brush.color, brush.opacity);
            APP.$color.css({
                'color': c,
            });
            createCursor();
        };

        var palette = AppConfig.whiteboardPalette || [
            'red', 'blue', 'green', 'white', 'black', 'purple',
            'gray', 'beige', 'brown', 'cyan', 'darkcyan', 'gold', 'yellow', 'pink'
        ];
        $('.cp-app-whiteboard-palette-color').on('click', function () {
            var color = $(this).css('background-color');
            setColor(color);
        });

        APP.draw = true;
        var toggleDrawMode = function () {
            canvas.deactivateAll().renderAll();
            APP.draw = !APP.draw;
            canvas.isDrawingMode = APP.draw;
            $toggle.text(APP.draw ? Messages.canvas_disable : Messages.canvas_enable);
            if (APP.draw) { $deleteButton.hide(); }
            else { $deleteButton.show(); }
        };
        $toggle.click(toggleDrawMode);

        var deleteSelection = function () {
            if (canvas.getActiveObject()) {
                canvas.getActiveObject().remove();
            }
            if (canvas.getActiveGroup()) {
                canvas.getActiveGroup()._objects.forEach(function (el) {
                    el.remove();
                });
                canvas.discardActiveGroup();
            }
            canvas.renderAll();
            config.onLocal();
        };
        $deleteButton.click(deleteSelection);
        $(window).on('keyup', function (e) {
            if (e.which === 46) { deleteSelection (); }
        });

        var setEditable = function (bool) {
            APP.editable = bool;
            if (readOnly && bool) { return; }
            if (bool) { $controls.css('display', 'flex'); }
            else { $controls.hide(); }

            canvas.isDrawingMode = bool ? APP.draw : false;
            if (!bool) {
                canvas.deactivateAll();
                canvas.renderAll();
            }
            canvas.forEachObject(function (object) {
                object.selectable = bool;
            });
            $canvasContainer.find('canvas').css('border-color', bool? 'black': 'red');
        };

        var saveImage = APP.saveImage = function () {
            var defaultName = "pretty-picture.png";
            Cryptpad.prompt(Messages.exportPrompt, defaultName, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                $canvas[0].toBlob(function (blob) {
                    saveAs(blob, filename);
                });
            });
        };

        APP.FM = common.createFileManager({});
        APP.upload = function (title) {
            var canvas = $canvas[0];
            APP.canvas.deactivateAll().renderAll();
            canvas.toBlob(function (blob) {
                blob.name = title;
                APP.FM.handleFile(blob);
            });
        };

        var initializing = true;
        var $bar = $('#cp-toolbar');
        var Title;
        var cpNfInner;
        var metadataMgr;

        config = {
            readOnly: readOnly,
            transformFunction: JsonOT.validate,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var addColorToPalette = function (color, i) {
            if (readOnly) { return; }
            var $color = $('<span>', {
                'class': 'cp-app-whiteboard-palette-color',
            })
            .css({
                'background-color': color,
            })
            .click(function () {
                var c = Colors.rgb2hex($color.css('background-color'));
                setColor(c);
            })
            .on('dblclick', function (e) {
                e.preventDefault();
                if (!APP.editable) { return; }
                pickColor(Colors.rgb2hex($color.css('background-color')), function (c) {
                    $color.css({
                        'background-color': c,
                    });
                    palette.splice(i, 1, c);
                    APP.updateLocalPalette(palette);
                    setColor(c);
                });
            });

            $colors.append($color);
        };

        var first = true;
        var updatePalette = function (newPalette) {
            if (first || stringify(palette) !== stringify(newPalette)) {
                palette = newPalette;
                $colors.html('<div class="hidden">&nbsp;</div>');
                palette.forEach(addColorToPalette);
                first = false;
            }
        };
        var updateLocalPalette = APP.updateLocalPalette = function (newPalette) {
            updatePalette(newPalette);
            var metadata = JSON.parse(JSON.stringify(metadataMgr.getMetadata()));
            metadata.palette = newPalette;
            metadataMgr.updateMetadata(metadata);
            config.onLocal();
        };

        var makeColorButton = function ($container) {
            var $testColor = $('<input>', { type: 'color', value: '!' });

            // if colors aren't supported, bail out
            if ($testColor.attr('type') !== 'color' ||
                $testColor.val() === '!') {
                console.log("Colors aren't supported. Aborting");
                return;
            }

            var $color = APP.$color = $('<button>', {
                id: "cp-app-whiteboard-color-picker",
                title: Messages.canvas_chooseColor,
                'class': "fa fa-square cp-toolbar-rightside-button",
            })
            .on('click', function () {
                pickColor($color.css('background-color'), function (color) {
                    setColor(color);
                });
            });

            setColor('#000');

            $container.append($color);

            return $color;
        };

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: metadataMgr.getMetadataLazy()
            };
            // stringify the json and send it into chainpad
            return stringify(obj);
        };

        var onLocal = config.onLocal = function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            var content = stringifyInner(canvas.toDatalessJSON());

            APP.patchText(content);
        };

        var addImageToCanvas = function (img) {
            var w = img.width;
            var h = img.height;
            if (w<h) {
                img.width = img.width * (300/img.height);
                img.height = 300;
            } else {
                img.height = img.height * (300/img.width);
                img.width = 300;
            }
            var cImg = new Fabric.Image(img, { left:0, top:0, angle:0, });
            APP.canvas.add(cImg);
            onLocal();
        };

        var initThumbnails = function () {
            var oldThumbnailState;
            var privateDat = metadataMgr.getPrivateData();
            var hash = privateDat.availableHashes.editHash ||
                       privateDat.availableHashes.viewHash;
            var href = privateDat.pathname + '#' + hash;
            var mkThumbnail = function () {
                if (!hash) { return; }
                if (initializing) { return; }
                if (!APP.realtime) { return; }
                var content = APP.realtime.getUserDoc();
                if (content === oldThumbnailState) { return; }
                var D = Thumb.getResizedDimensions($canvas[0], 'pad');
                Thumb.fromCanvas($canvas[0], D, function (err, b64) {
                    oldThumbnailState = content;
                    SFUI.setPadThumbnail(href, b64);
                });
            };
            window.setInterval(mkThumbnail, Thumb.UPDATE_INTERVAL);
        };

        config.onInit = function (info) {
            updateLocalPalette(palette);
            readOnly = metadataMgr.getPrivateData().readOnly;

            Title = common.createTitle({});

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: readOnly,
                realtime: info.realtime,
                common: Cryptpad,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-whiteboard-canvas-area')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;

            /* save as template */
            if (!metadataMgr.getPrivateData().isTemplate) {
                var templateObj = {
                    rt: info.realtime,
                    getTitle: function () { return metadataMgr.getMetadata().title; }
                };
                var $templateButton = common.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            /* add an export button */
            var $export = common.createButton('export', true, {}, saveImage);
            $rightside.append($export);

            if (common.isLoggedIn()) {
                common.createButton('savetodrive', true, {}, function () {})
                .click(function () {
                    Cryptpad.prompt(Messages.exportPrompt, document.title + '.png',
                    function (name) {
                        if (name === null || !name.trim()) { return; }
                        APP.upload(name);
                    });
                }).appendTo($rightside);
            }

            var $forget = common.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
            });
            $rightside.append($forget);
            common.createButton('hashtag', true).appendTo($rightside);

            if (!readOnly) {
                makeColorButton($rightside);

                // Embed image
                var onUpload = function (e) {
                    var file = e.target.files[0];
                    var reader = new FileReader();
                    reader.onload = function () {
                        var img = new Image();
                        img.onload = function () {
                            addImageToCanvas(img);
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                };
                common.createButton('', true)
                    .attr('title', Messages.canvas_imageEmbed)
                    .removeClass('fa-question').addClass('fa-file-image-o')
                    .click(function () {
                        $('<input>', {type:'file'}).on('change', onUpload).click();
                    }).appendTo($rightside);
                var fileDialogCfg = {
                    onSelect: function (data) {
                        if (data.type === 'file') {
                            var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                            common.displayMediatagImage($(mt), function (err, $image) {
                                Util.blobURLToImage($image.attr('src'), function (imgSrc) {
                                    var img = new Image();
                                    img.onload = function () { addImageToCanvas(img); };
                                    img.src = imgSrc;
                                });
                            });
                            return;
                        }
                    }
                };
                common.initFilePicker(fileDialogCfg);
                APP.$mediaTagButton = $('<button>', {
                    title: Messages.filePickerButton,
                    'class': 'cp-toolbar-rightside-button fa fa-picture-o',
                    style: 'font-size: 17px'
                }).click(function () {
                    var pickerCfg = {
                        types: ['file'],
                        where: ['root'],
                        filter: {
                            fileType: ['image/']
                        }
                    };
                    common.openFilePicker(pickerCfg);
                }).appendTo($rightside);
            }

            metadataMgr.onChange(function () {
                var md = metadataMgr.getMetadata();
                if (md.palette) {
                    updateLocalPalette(md.palette);
                }
            });
        };

        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                var realtime = APP.realtime = info.realtime;
                APP.patchText = TextPatcher.create({
                    realtime: realtime,
                    //logging: true
                });
            }

            var userDoc = APP.realtime.getUserDoc();
            var isNew = false;
            var newDoc = '';
            if (userDoc === "" || userDoc === "{}") { isNew = true; }

            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                if (typeof (hjson) !== 'object' || Array.isArray(hjson) ||
                    (hjson.metadata && typeof(hjson.metadata.type) !== 'undefined' &&
                     hjson.metadata.type !== 'whiteboard')) {
                    var errorText = Messages.typeError;
                    Cryptpad.errorLoadingScreen(errorText);
                    throw new Error(errorText);
                }
                newDoc = hjson.content;
            } else {
                Title.updateTitle(Cryptpad.initialName || Title.defaultTitle);
            }

            nThen(function (waitFor) {
                if (newDoc) {
                    canvas.loadFromJSON(newDoc, waitFor(function () {
                        console.log('loaded');
                        canvas.renderAll();
                    }));
                }
            }).nThen(function () {
                setEditable(!readOnly);
                initializing = false;
                config.onLocal();
                Cryptpad.removeLoadingScreen();

                initThumbnails();


                if (readOnly) { return; }
                if (isNew) {
                    common.openTemplatePicker();
                }
            });

        };

        config.onRemote = function () {
            if (initializing) { return; }
            var userDoc = APP.realtime.getUserDoc();

            var json = JSON.parse(userDoc);
            var remoteDoc = json.content;

            canvas.loadFromJSON(remoteDoc, function () {
                canvas.renderAll();
                if (json.metadata) {
                    metadataMgr.updateMetadata(json.metadata);
                }
            });

            var content = canvas.toDatalessJSON();
            if (content !== remoteDoc) { common.notify(); }
            if (readOnly) { setEditable(false); }
        };

        config.onAbort = function () {
            // inform of network disconnect
            setEditable(false);
            toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
        };

        config.onConnectionChange = function (info) {
            setEditable(info.state);
            if (info.state) {
                initializing = true;
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        config.onError = onConnectError;

        cpNfInner = common.startRealtime(config);
        metadataMgr = cpNfInner.metadataMgr;

        cpNfInner.onInfiniteSpinner(function () {
            setEditable(false);
            Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                if (!yes) { return; }
                common.gotoURL();
            });
        });

        canvas.on('mouse:up', onLocal);

        $('#cp-app-whiteboard-clear').on('click', function () {
            canvas.clear();
            onLocal();
        });

        $('#save').on('click', function () {
            saveImage();
        });

        Cryptpad.onLogout(function () { setEditable(false); });
    };

    var main = function () {
        var common;

        nThen(function (waitFor) {
            $(waitFor(function () {
                Cryptpad.addLoadingScreen();
                var $div = $('<div>').append(Pages['/whiteboard/']());
                $('body').append($div.html());
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (/*waitFor*/) {
            Cryptpad.onError(function (info) {
                if (info && info.type === "store") {
                    onConnectError();
                }
            });
            andThen(common);
        });
    };
    main();
});
