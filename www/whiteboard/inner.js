// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    'json.sortify',
    '/components/nthen/index.js',
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
    '/components/chainpad/chainpad.dist.js',
    '/common/common-ui-elements.js',

    '/lib/fabric.min.js',
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
    ChainPad,
    UIElements)
{

    var APP = window.APP = {
        $: $
    };
    var Fabric = APP.Fabric = window.fabric;

    var mkControls = function (framework, canvas) {
        var $pickers = $('#cp-app-whiteboard-pickers');
        var $colors = $('#cp-app-whiteboard-colors');
        var $cursors = $('#cp-app-whiteboard-cursors');
        var $controls = $('#cp-app-whiteboard-controls');
        var $width = $('#cp-app-whiteboard-width');
        var $widthLabel = $('label[for="cp-app-whiteboard-width"]');
        var $opacity = $('#cp-app-whiteboard-opacity');
        var $opacityLabel = $('label[for="cp-app-whiteboard-opacity"]');
        var $type = $('.cp-whiteboard-type');
        var $brush = $('.cp-whiteboard-type .brush');
        var $move = $('.cp-whiteboard-type .move');
        var $undo = $('.cp-whiteboard-history .undo');
        var $redo = $('.cp-whiteboard-history .redo');
        var $text = $('.cp-whiteboard-text button');
        var $deleteButton = $('#cp-app-whiteboard-delete');

        var metadataMgr = framework._.cpNfInner.metadataMgr;

        var brush = {
            color: window.CryptPad_theme === "dark" ? '#FFFFFF' : '#000000',
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
            ctx.strokeStyle = window.CryptPad_theme === 'dark' ? '#FFFFFF' : '#000000';
            ctx.stroke();

            var img = ccanvas.toDataURL("image/png");
            $controls.find('.cp-app-whiteboard-selected > img').attr('src', img);
            canvas.freeDrawingCursor = 'url('+img+') '+size/2+' '+size/2+', crosshair';
        };

        var updateBrushWidth = function () {
            var val = $width.val();
            canvas.freeDrawingBrush.width = Number(val);
            $widthLabel.text(Messages._getKey("canvas_widthLabel", ['']));
            $('#cp-app-whiteboard-width-val').text(val + 'px');
            createCursor();
        };
        updateBrushWidth();
        $width.on('change', updateBrushWidth);

        var updateBrushOpacity = function () {
            var val = $opacity.val();
            brush.opacity = Number(val);
            canvas.freeDrawingBrush.color = Colors.hex2rgba(brush.color, brush.opacity);
            $opacityLabel.text(Messages._getKey("canvas_opacityLabel", ['']));
            $('#cp-app-whiteboard-opacity-val').text((Number(val) * 100) + '%');
            createCursor();
        };
        updateBrushOpacity();
        $opacity.on('change', updateBrushOpacity);

        APP.draw = true;
        $brush.click(function () {
            if (APP.draw) { return; }
            canvas.discardActiveObject().renderAll();
            APP.draw = true;
            canvas.isDrawingMode = APP.draw;
            $type.find('button').removeClass('btn-primary');
            $brush.addClass('btn-primary');
            $deleteButton.prop('disabled', 'disabled');
        });
        $move.click(function () {
            if (!APP.draw) { return; }
            canvas.discardActiveObject().renderAll();
            APP.draw = false;
            canvas.isDrawingMode = APP.draw;
            $type.find('button').removeClass('btn-primary');
            $move.addClass('btn-primary');
            $deleteButton.prop('disabled', '');
        });

        $text.click(function () {
            $move.click();
            canvas.add(new Fabric.Textbox('My Text', {
                fill: brush.color,
                top: 5,
                left: 5
            }));
        });
        $undo.click(function () {
            if (typeof(APP.canvas.undo) !== "function") { return; }
            APP.canvas.undo();
            APP.onLocal();
        });
        $redo.click(function () {
            if (typeof(APP.canvas.undo) !== "function") { return; }
            APP.canvas.redo();
            APP.onLocal();
        });
        $('body').on('keydown', function (e) {
            if (e.which === 90 && e.ctrlKey) {
                $undo.click();
                return;
            }
            if (e.which === 89 && e.ctrlKey) {
                $redo.click();
                return;
            }
        });

        var deleteSelection = function () {
            if (APP.draw) { return; }
            /*
            if (canvas.getActiveObject()) {
                canvas.getActiveObject().remove();
            }*/
            if (canvas.getActiveObjects()) {
                canvas.getActiveObjects().forEach(function (el) {
                    APP.canvas.remove(el);
                });
                canvas.discardActiveObject();
            }
            canvas.renderAll();
            APP.onLocal();
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
            if (!APP.draw) {
                var active = canvas.getActiveObject();
                if (active) {
                    var col = Colors.hex2rgba(brush.color, brush.opacity);
                    if (active.text) { active.set('fill', col); }
                    else { active.set('stroke', col); }
                    canvas.renderAll();
                    APP.onLocal();
                }
            }
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
                $colors.css('width', (palette.length * 20)+'px');
                palette.forEach(addColorToPalette);
                first = false;
            }
        };
        var updateLocalPalette = APP.updateLocalPalette = function (newPalette) {
            updatePalette(newPalette);
            var metadata = JSON.parse(JSON.stringify(metadataMgr.getMetadata()));
            metadata.palette = newPalette;
            metadataMgr.updateMetadata(metadata);
            APP.onLocal();
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
            updateLocalPalette: updateLocalPalette,
        };
    };

    var mkHelpMenu = function (framework) {
        var $appContainer = $('#cp-app-whiteboard-container');
        var helpMenu = framework._.sfCommon.createHelpMenu(['whiteboard']);
        var $helpMenuButton = UIElements.getEntryFromButton(helpMenu.button);
        $appContainer.prepend(helpMenu.menu);
        framework._.toolbar.$drawer.append($helpMenuButton);
    };

    // Start of the main loop
    var andThen2 = function (framework) {
        APP.framework = framework;
        var canvas = APP.canvas = new Fabric.Canvas('cp-app-whiteboard-canvas', {
            containerClass: 'cp-app-whiteboard-canvas-container'
        });
        var $canvas = $('canvas');
        var $canvasContainer = $('canvas').parents('.cp-app-whiteboard-canvas-container');
        var $container = $('#cp-app-whiteboard-container');
        $('#cp-app-whiteboard-canvas-area').show();
        $('#cp-app-whiteboard-controls').show();

        // Max for old macs: 2048×1464
        // Max for IE: 8192x8192
        var MAX = 8192;
        var onResize = APP.onResize = function () {
            var w = $container.width();
            var h = $container.height();
            canvas.forEachObject(function (obj) {
                var c = obj.getCoords();
                Object.keys(c).forEach(function (k) {
                    if (c[k].x > w) { w = c[k].x + 1; }
                    if (c[k].y > h) { h = c[k].y + 1; }
                });
            });
            w = Math.min(w, MAX);
            h = Math.min(h, MAX);
            canvas.setWidth(w);
            canvas.setHeight(h);
            canvas.calcOffset();
        };
        $(window).on('resize', onResize);

        var onLocal = APP.onLocal = function () {
            framework.localChange();
            APP.onResize();
        };

        var $controls = $('#cp-app-whiteboard-controls');
        var metadataMgr = framework._.cpNfInner.metadataMgr;

        var setEditable = function (bool) {
            if (bool) { $controls.css('display', 'flex'); }
            else { $controls.hide(); }

            canvas.isDrawingMode = bool ? APP.draw : false;
            if (!bool) {
                canvas.discardActiveObject();
                canvas.renderAll();
            }
            canvas.forEachObject(function (object) {
                object.selectable = bool;
            });
            $canvasContainer.find('canvas').css('border-color', bool? 'black': 'red');
        };

        var privateData = metadataMgr.getPrivateData();
        if (!privateData.isEmbed) {
            mkHelpMenu(framework);
        }

        mkControls(framework, canvas);

        // ---------------------------------------------
        // Whiteboard custom buttons
        // ---------------------------------------------

        var $drawer = framework._.toolbar.$drawer;

        APP.FM = framework._.sfCommon.createFileManager({});
        APP.upload = function (title) {
            var canvas = $canvas[0];
            APP.canvas.discardActiveObject().renderAll();
            canvas.toBlob(function (blob) {
                blob.name = title;
                APP.FM.handleFile(blob);
            });
        };
        var ONE_MB = 1 * 1024 * 1024; // 1 MB
        var MAX_IMAGE_SIZE = Math.ceil(ONE_MB / 3) * 4 + 23; // 23 is the length of "data:image/jpeg;base64,"
        var maxSizeStr = Util.bytesToMegabytes(ONE_MB);
        var addImageToCanvas = function (img) {
            if (img.src && img.src.length > MAX_IMAGE_SIZE) {
                UI.warn(Messages._getKey('upload_tooLargeBrief', [maxSizeStr]));
                return;
            }
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

        // Embed image
        var onUpload = function (e) {
            var file = e.target.files[0];
            var reader = new FileReader();
            // 1 MB maximum
            if (file.size > MAX_IMAGE_SIZE) {
                UI.warn(Messages._getKey('upload_tooLargeBrief', [maxSizeStr]));
                return;
            }
            reader.onload = function () {
                var img = new Image();
                img.onload = function () {
                    addImageToCanvas(img);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        };

        if (framework._.sfCommon.isLoggedIn()) {
            framework.setMediaTagEmbedder(function ($mt) {
                framework._.sfCommon.displayMediatagImage($mt, function (err, $image) {
                    // Convert src from blob URL to base64 data URL
                    Util.blobURLToImage($image.attr('src'), function (imgSrc) {
                        var img = new Image();
                        img.onload = function () { addImageToCanvas(img); };
                        img.src = imgSrc;
                    });
                });
            }, {
                fileType: ['image/']
            });

            // Export to drive as PNG
            var $saveToDriveButton = framework._.sfCommon.createButton('savetodrive', true, {
                callback: function () {
                    var defaultName = framework._.title.getTitle()
                                    || framework._.title.defaultTitle;
                    UI.prompt(Messages.exportPrompt, defaultName + '.png', function (name) {
                        if (name === null || !name.trim()) { return; }
                        APP.upload(name);
                    });
                }
            });
            var $saveToDrive = UIElements.getEntryFromButton($saveToDriveButton);
            $saveToDrive.appendTo($drawer);

        } else {
            framework._.sfCommon.createButton('', true, {
                title: Messages.canvas_imageEmbed,
                text: Messages.toolbar_insert,
                drawer: false,
                icon: 'fa-picture-o',
                name: 'mediatag'
            }).click(function () {
                $('<input>', {type:'file'}).on('change', onUpload).click();
            }).appendTo(framework._.toolbar.$bottomL);
        }

        if (framework.isReadOnly()) {
            setEditable(false);
        }

        $('#cp-app-whiteboard-clear').on('click', function () {
            canvas.clear();
            onLocal();
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

        var cleanHistory = function () {
            if (Array.isArray(canvas.historyUndo)) {
                canvas.historyUndo = canvas.historyUndo.slice(-100);
                canvas.historyRedo = canvas.historyRedo.slice(-100);
            }
        };

        framework.onContentUpdate(function (newContent, waitFor) {
            cleanHistory();
            var content = newContent.content;
            canvas.loadFromJSON(content, waitFor(function () {
                canvas.renderAll();
                onResize();
            }));
        });

        framework.setContentGetter(function () {
            cleanHistory();
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

        canvas.on('mouse:up', onLocal);
        framework.start();
    };

    var initialContent = function () {
        return [
            h('div#cp-toolbar.cp-toolbar-container'),
            h('div#cp-app-whiteboard-canvas-area',
                h('div#cp-app-whiteboard-container',
                    h('canvas#cp-app-whiteboard-canvas', {
                    })
                )
            ),
            h('div#cp-app-whiteboard-controls', {
                style: {
                    display: 'block',
                }
            }, [
                h('button#cp-app-whiteboard-clear.btn.btn-danger', Messages.canvas_clear), ' ',
                h('div.cp-whiteboard-type', [
                    h('button.btn.brush.fa.fa-paint-brush.btn-primary', {title: Messages.canvas_brush}),
                    h('button.btn.move.fa.fa-arrows', {title: Messages.canvas_select}),
                ]),
                h('div.cp-whiteboard-history', [
                    h('button.btn.undo.fa.fa-undo', {title: Messages.undo}),
                    h('button.btn.redo.fa.fa-repeat', {title: Messages.redo}),
                ]),
                h('div.cp-whiteboard-text', [
                    h('button.btn.fa.fa-font')
                ]),
                h('button.btn.fa.fa-trash#cp-app-whiteboard-delete', {
                    disabled: 'disabled',
                    title: Messages.canvas_delete
                }),
                /*
                h('button#cp-app-whiteboard-toggledraw.btn.btn-secondary', Messages.canvas_disable),
                h('button#cp-app-whiteboard-toggledraw.btn.btn-secondary', Messages.canvas_disable),
                h('button#cp-app-whiteboard-delete.btn.btn-secondary', {
                    style: {
                        display: 'none',
                    }
                }, Messages.canvas_delete),*/
                h('div.cp-whiteboard-brush', [
                    h('div.cp-app-whiteboard-range-group', [
                        h('label', {
                            'for': 'cp-app-whiteboard-width'
                        }, Messages.canvas_width),
                        h('input#cp-app-whiteboard-width', {
                            type: 'range',
                            value: "20",
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
                            value: "1",
                            min: "0.1",
                            max: "1",
                            step: "0.1"
                        }),
                        h('span#cp-app-whiteboard-opacity-val', '100%')
                    ]),
                ]),
                h('div.cp-app-whiteboard-selected.cp-app-whiteboard-unselectable', [
                    h('img', {
                        title: Messages.canvas_currentBrush
                    })
                ]),
                UI.setHTML(h('div#cp-app-whiteboard-colors'), '&nbsp;'),
            ]),
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
            require(['/lib/fabric-history.min.js'], waitFor());

            $('#cp-app-whiteboard-canvas-area').css('display', 'none');
            $('#cp-app-whiteboard-controls').css('display', 'none');
            // Framework initialization
            Framework.create({
                patchTransformer: ChainPad.NaiveJSONTransformer,
                toolbarContainer: '#cp-toolbar',
                contentContainer: '#cp-app-whiteboard-canvas-area',
                skipLink: '#cp-app-whiteboard-controls'
            }, waitFor(function (framework) {
                andThen2(framework);
            }));
        });
    };
    main();
});
