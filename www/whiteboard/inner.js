define([
    'jquery',
    'json.sortify',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-thumbnail.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/whiteboard/colors.js',
    '/customize/application_config.js',
    '/bower_components/chainpad/chainpad.dist.js',

    '/bower_components/secure-fabric.js/dist/fabric.min.js',
    'less!/whiteboard/app-whiteboard.less'
], function (
    $,
    Sortify,
    nThen,
    SFCommon,
    Framework,
    Util,
    Hash,
    UI,
    Thumb,
    h,
    Messages,
    Colors,
    AppConfig,
    ChainPad)
{

    var APP = window.APP = {
        $: $
    };
    var Fabric = APP.Fabric = window.fabric;

    var verbose = function (x) { console.log(x); };
    verbose = function () {}; // comment out to enable verbose logging

    var mkControls = function (framework, canvas) {
        var $pickers = $('#cp-app-whiteboard-pickers');
        var $colors = $('#cp-app-whiteboard-colors');
        var $cursors = $('#cp-app-whiteboard-cursors');
        var $controls = $('#cp-app-whiteboard-controls');
        var $width = $('#cp-app-whiteboard-width');
        var $widthLabel = $('label[for="cp-app-whiteboard-width"]');
        var $opacity = $('#cp-app-whiteboard-opacity');
        var $opacityLabel = $('label[for="cp-app-whiteboard-opacity"]');
        var $toggle = $('#cp-app-whiteboard-toggledraw');
        var $deleteButton = $('#cp-app-whiteboard-delete');

        var metadataMgr = framework._.cpNfInner.metadataMgr;

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
            $widthLabel.text(Messages._getKey("canvas_widthLabel", [val]));
            $('#cp-app-whiteboard-width-val').text(val + 'px');
            createCursor();
        };
        updateBrushWidth();
        $width.on('change', updateBrushWidth);

        var updateBrushOpacity = function () {
            var val = $opacity.val();
            brush.opacity = Number(val);
            canvas.freeDrawingBrush.color = Colors.hex2rgba(brush.color, brush.opacity);
            $opacityLabel.text(Messages._getKey("canvas_opacityLabel", [val]));
            $('#cp-app-whiteboard-opacity-val').text((Number(val) * 100) + '%');
            createCursor();
        };
        updateBrushOpacity();
        $opacity.on('change', updateBrushOpacity);

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
            framework.localChange();
        };
        $deleteButton.click(deleteSelection);
        $(window).on('keyup', function (e) {
            if (e.which === 46) { deleteSelection (); }
        });


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

        var addColorToPalette = function (color, i) {
            if (framework.isReadOnly()) { return; }
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
                if (framework.isLocked()) { return; }
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
            if (first || Sortify(palette) !== Sortify(newPalette)) {
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
            framework.localChange();
        };

        var makeColorButton = function ($container) {
            var $testColor = $('<input>', { type: 'color', value: '!' });

            // if colors aren't supported, bail out
            if ($testColor.attr('type') !== 'color' ||
                $testColor.val() === '!') {
                console.log("Colors aren't supported. Aborting");
                return;
            }

            var $color = APP.$color = framework._.sfCommon.createButton(null, true, {
                icon: 'fa-square',
                title: Messages.canvas_chooseColor,
                name: 'color',
                id: 'cp-app-whiteboard-color-picker'
            });
            $color.on('click', function () {
                pickColor($color.css('background-color'), function (color) {
                    setColor(color);
                });
            });

            setColor('#000');

            $container.append($color);

            return $color;
        };

        updateLocalPalette(palette);

        metadataMgr.onChange(function () {
            var md = metadataMgr.getMetadata();
            if (md.palette) {
                updatePalette(md.palette);
            }
        });

        return {
            palette: palette,
            makeColorButton: makeColorButton,
            updateLocalPalette: updateLocalPalette,
        };
    };

    var mkHelpMenu = function (framework) {
        var $appContainer = $('#cp-app-whiteboard-container');
        var helpMenu = framework._.sfCommon.createHelpMenu(['whiteboard']);
        $appContainer.prepend(helpMenu.menu);
        framework._.toolbar.$drawer.append(helpMenu.button);
    };

    // Start of the main loop
    var andThen2 = function (framework) {
        APP.framework = framework;
        var canvas = APP.canvas = new Fabric.Canvas('cp-app-whiteboard-canvas', {
            containerClass: 'cp-app-whiteboard-canvas-container'
        });
        var $canvas = $('canvas');
        var $canvasContainer = $('canvas').parents('.cp-app-whiteboard-canvas-container');
        var $controls = $('#cp-app-whiteboard-controls');
        var metadataMgr = framework._.cpNfInner.metadataMgr;

        var setEditable = function (bool) {
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

        mkHelpMenu(framework);

        var controls = mkControls(framework, canvas);

        // ---------------------------------------------
        // Whiteboard custom buttons
        // ---------------------------------------------

        var $rightside = framework._.toolbar.$rightside;

        APP.FM = framework._.sfCommon.createFileManager({});
        APP.upload = function (title) {
            var canvas = $canvas[0];
            APP.canvas.deactivateAll().renderAll();
            canvas.toBlob(function (blob) {
                blob.name = title;
                APP.FM.handleFile(blob);
            });
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
            framework.localChange();
        };

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
        framework._.sfCommon.createButton('', true, {
            title: Messages.canvas_imageEmbed,
            icon: 'fa-file-image-o',
            name: 'embedImage'
        }).click(function () {
            $('<input>', {type:'file'}).on('change', onUpload).click();
        }).appendTo($rightside);

        if (framework._.sfCommon.isLoggedIn()) {
            var fileDialogCfg = {
                onSelect: function (data) {
                    if (data.type === 'file') {
                        var mt = '<media-tag src="' + data.src + '" data-crypto-key="cryptpad:' + data.key + '"></media-tag>';
                        framework._.sfCommon.displayMediatagImage($(mt), function (err, $image) {
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
            framework._.sfCommon.initFilePicker(fileDialogCfg);
            framework._.sfCommon.createButton('mediatag', true).click(function () {
                var pickerCfg = {
                    types: ['file'],
                    where: ['root'],
                    filter: {
                        fileType: ['image/']
                    }
                };
                framework._.sfCommon.openFilePicker(pickerCfg);
            }).appendTo($rightside);

            // Export to drive as PNG
            framework._.sfCommon.createButton('savetodrive', true, {}).click(function () {
                var defaultName = framework._.title.getTitle();
                UI.prompt(Messages.exportPrompt, defaultName + '.png', function (name) {
                    if (name === null || !name.trim()) { return; }
                    APP.upload(name);
                });
            }).appendTo($rightside);
        }

        if (framework.isReadOnly()) {
            setEditable(false);
        } else {
            controls.makeColorButton($rightside);
        }

        $('#cp-app-whiteboard-clear').on('click', function () {
            canvas.clear();
            framework.localChange();
        });

        // ---------------------------------------------
        // End custom
        // ---------------------------------------------


        framework.onEditableChange(function () {
            var locked = framework.isLocked() || framework.isReadOnly();
            setEditable(!locked);
        });

        framework.setFileExporter('.png', function (cb) {
            $canvas[0].toBlob(function (blob) {
                cb(blob);
            });
        }, true);

        framework.setNormalizer(function (c) {
            return {
                content: c.content
            };
        });

        framework.onContentUpdate(function (newContent, waitFor) {
            var content = newContent.content;
            canvas.loadFromJSON(content, waitFor(function () {
                canvas.renderAll();
            }));
        });

        framework.setContentGetter(function () {
            var content = canvas.toDatalessJSON();
            return {
                content: content
            };
        });

        framework.onReady(function () {
            var oldThumbnailState;
            var privateDat = metadataMgr.getPrivateData();
            if (!privateDat.thumbnails) { return; }
            var mkThumbnail = function () {
                if (framework.getState() !== 'READY') { return; }
                if (!framework._.cpNfInner.chainpad) { return; }
                var content = framework._.cpNfInner.chainpad.getUserDoc();
                if (content === oldThumbnailState) { return; }
                var D = Thumb.getResizedDimensions($canvas[0], 'pad');
                Thumb.fromCanvas($canvas[0], D, function (err, b64) {
                    oldThumbnailState = content;
                    Thumb.setPadThumbnail(framework._.sfCommon, 'whiteboard', privateDat.channel, b64);
                });
            };
            window.setInterval(mkThumbnail, Thumb.UPDATE_INTERVAL);
            window.setTimeout(mkThumbnail, Thumb.UPDATE_FIRST);
        });

        canvas.on('mouse:up', framework.localChange);
        framework.start();
    };

    var initialContent = function () {
        return [
            h('div#cp-toolbar.cp-toolbar-container'),
            h('div#cp-app-whiteboard-canvas-area',
                h('div#cp-app-whiteboard-container',
                    h('canvas#cp-app-whiteboard-canvas', {
                        width: 600,
                        height: 600
                    })
                )
            ),
            h('div#cp-app-whiteboard-controls', {
                style: {
                    display: 'block',
                }
            }, [
                h('button#cp-app-whiteboard-clear.btn.btn-danger', Messages.canvas_clear), ' ',
                h('button#cp-app-whiteboard-toggledraw.btn.btn-secondary', Messages.canvas_disable),
                h('button#cp-app-whiteboard-delete.btn.btn-secondary', {
                    style: {
                        display: 'none',
                    }
                }, Messages.canvas_delete),
                h('div.cp-app-whiteboard-range-group', [
                    h('label', {
                        'for': 'cp-app-whiteboard-width'
                    }, Messages.canvas_width),
                    h('input#cp-app-whiteboard-width', {
                        type: 'range',
                        min: "1",
                        max: "100"
                    }),
                    h('span#cp-app-whiteboard-width-val', '5px')
                ]),
                h('div.cp-app-whiteboard-range-group', [
                    h('label', {
                        'for': 'cp-app-whiteboard-opacity',
                    }, Messages.canvas_opacity),
                    h('input#cp-app-whiteboard-opacity', {
                        type: 'range',
                        min: "0.1",
                        max: "1",
                        step: "0.1"
                    }),
                    h('span#cp-app-whiteboard-opacity-val', '100%')
                ]),
                h('span.cp-app-whiteboard-selected.cp-app-whiteboard-unselectable', [
                    h('img', {
                        title: Messages.canvas_currentBrush
                    })
                ])
            ]),
            UI.setHTML(h('div#cp-app-whiteboard-colors'), '&nbsp;'),
            h('div#cp-app-whiteboard-cursors', {
                style: {
                    display: 'none',
                    background: 'white',
                    'text-align': 'center',
                }
            }),
            h('div#cp-app-whiteboard-pickers'),
            h('div#cp-app-whiteboard-media-hidden')
        ];
    };

    var main = function () {
        // var framework;
        nThen(function (waitFor) {
            $(waitFor(function () {
                var $div = $('<div>').append(initialContent());
                $('body').append($div.html());
            }));
        }).nThen(function (waitFor) {

            // Framework initialization
            Framework.create({
                patchTransformer: ChainPad.NaiveJSONTransformer,
                toolbarContainer: '#cp-toolbar',
                contentContainer: '#cp-app-whiteboard-canvas-area',
            }, waitFor(function (framework) {
                andThen2(framework);
            }));
        });
    };
    main();
});
