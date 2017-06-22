define([
    'jquery',
    '/api/config',
    '/bower_components/chainpad-netflux/chainpad-netflux.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar2.js',
    '/bower_components/textpatcher/TextPatcher.amd.js',
    'json.sortify',
    '/bower_components/chainpad-json-validator/json-ot.js',
    '/common/cryptpad-common.js',
    '/common/cryptget.js',
    '/whiteboard/colors.js',
    '/customize/application_config.js',
    '/bower_components/secure-fabric.js/dist/fabric.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
], function ($, Config, Realtime, Crypto, Toolbar, TextPatcher, JSONSortify, JsonOT, Cryptpad, Cryptget, Colors, AppConfig) {
    var saveAs = window.saveAs;
    var Messages = Cryptpad.Messages;

    var module = window.APP = { $:$ };
    var Fabric = module.Fabric = window.fabric;

    $(function () {
    Cryptpad.addLoadingScreen();
    var onConnectError = function () {
        Cryptpad.errorLoadingScreen(Messages.websocketError);
    };
    var toolbar;

    var secret = Cryptpad.getSecrets();
    var readOnly = secret.keys && !secret.keys.editKeyStr;
    if (!secret.keys) {
        secret.keys = secret.key;
    }

    var andThen = function () {
        /* Initialize Fabric */
        var canvas = module.canvas = new Fabric.Canvas('canvas');
        var $canvas = $('canvas');
        var $controls = $('#controls');
        var $canvasContainer = $('canvas').parents('.canvas-container');
        var $pickers = $('#pickers');
        var $colors = $('#colors');
        var $cursors = $('#cursors');
        var $deleteButton = $('#delete');

        var brush = {
            color: '#000000',
            opacity: 1
        };

        var $toggle = $('#toggleDraw');
        var $width = $('#width');
        var $widthLabel = $('label[for="width"]');
        var $opacity = $('#opacity');
        var $opacityLabel = $('label[for="opacity"]');
window.canvas = canvas;
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
            var $img = $('<img>', {
                src: img,
                title: 'Current brush'
            });
            $controls.find('.selected').html('').append($img);
            canvas.freeDrawingCursor = 'url('+img+') '+size/2+' '+size/2+', crosshair';
        };

        var updateBrushWidth = function () {
            var val = $width.val();
            canvas.freeDrawingBrush.width = Number(val);
            $widthLabel.text(Cryptpad.Messages._getKey("canvas_widthLabel", [val]));
            createCursor();
        };
        updateBrushWidth();

        $width.on('change', updateBrushWidth);

        var updateBrushOpacity = function () {
            var val = $opacity.val();
            brush.opacity = Number(val);
            canvas.freeDrawingBrush.color = Colors.hex2rgba(brush.color, brush.opacity);
            $opacityLabel.text(Cryptpad.Messages._getKey("canvas_opacityLabel", [val]));
            createCursor();
        };
        updateBrushOpacity();

        $opacity.on('change', updateBrushOpacity);

        var pickColor = function (current, cb) {
            var $picker = $('<input>', {
                type: 'color',
                value: '#FFFFFF',
                })
            // TODO confirm that this is safe to remove
            //.css({ visibility: 'hidden' })
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
            module.$color.css({
                'color': c,
            });
            createCursor();
        };


        var palette = AppConfig.whiteboardPalette || [
            'red', 'blue', 'green', 'white', 'black', 'purple',
            'gray', 'beige', 'brown', 'cyan', 'darkcyan', 'gold', 'yellow', 'pink'
        ];

        $('.palette-color').on('click', function () {
            var color = $(this).css('background-color');
            setColor(color);
        });

        module.draw = true;
        var toggleDrawMode = function () {
            module.draw = !module.draw;
            canvas.isDrawingMode = module.draw;
            $toggle.text(module.draw ? Messages.canvas_disable : Messages.canvas_enable);
            if (module.draw) { $deleteButton.hide(); }
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
            module.onLocal();
        };
        $deleteButton.click(deleteSelection);
        $(window).on('keyup', function (e) {
            if (e.which === 46) { deleteSelection (); }
        });

        var setEditable = function (bool) {
            if (readOnly && bool) { return; }
            if (bool) { $controls.show(); }
            else { $controls.hide(); }

            canvas.isDrawingMode = bool ? module.draw : false;
            if (!bool) {
                canvas.deactivateAll();
                canvas.renderAll();
            }
            canvas.forEachObject(function (object) {
                object.selectable = bool;
            });
            $canvasContainer.css('border-color', bool? 'black': 'red');
        };

        var saveImage = module.saveImage = function () {
            var defaultName = "pretty-picture.png";
            Cryptpad.prompt(Messages.exportPrompt, defaultName, function (filename) {
                if (!(typeof(filename) === 'string' && filename)) { return; }
                $canvas[0].toBlob(function (blob) {
                    saveAs(blob, filename);
                });
            });
        };

        var initializing = true;

        var $bar = $('#toolbar');

        var Title;
        var UserList;
        var Metadata;

        var config = module.config = {
            initialState: '{}',
            websocketURL: Cryptpad.getWebsocketURL(),
            validateKey: secret.keys.validateKey,
            readOnly: readOnly,
            channel: secret.channel,
            crypto: Crypto.createEncryptor(secret.keys),
            transformFunction: JsonOT.transform,
        };

        var addColorToPalette = function (color, i) {
            if (readOnly) { return; }
            var $color = $('<span>', {
                'class': 'palette-color',
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
                pickColor(Colors.rgb2hex($color.css('background-color')), function (c) {
                    $color.css({
                        'background-color': c,
                    });
                    palette.splice(i, 1, c);
                    config.onLocal();
                    setColor(c);
                });
            });

            $colors.append($color);
        };

        var metadataCfg = {};
        var updatePalette = metadataCfg.updatePalette = function (newPalette) {
            palette = newPalette;
            $colors.html('<div class="hidden">&nbsp;</div>');
            palette.forEach(addColorToPalette);
        };
        updatePalette(palette);

        var makeColorButton = function ($container) {
            var $testColor = $('<input>', { type: 'color', value: '!' });

            // if colors aren't supported, bail out
            if ($testColor.attr('type') !== 'color' ||
                $testColor.val() === '!') {
                console.log("Colors aren't supported. Aborting");
                return;
            }

            var $color = module.$color = $('<button>', {
                id: "color-picker",
                title: "choose a color",
                'class': "fa fa-square rightside-button",
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

        config.onInit = function (info) {
            UserList = Cryptpad.createUserList(info, config.onLocal, Cryptget, Cryptpad);

            Title = Cryptpad.createTitle({}, config.onLocal, Cryptpad);

            Metadata = Cryptpad.createMetadata(UserList, Title, metadataCfg, Cryptpad);

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'lag', 'state', 'share', 'userlist', 'newpad', 'limit', 'upgrade'],
                userList: UserList.getToolbarConfig(),
                share: {
                    secret: secret,
                    channel: info.channel
                },
                title: Title.getTitleConfig(),
                common: Cryptpad,
                readOnly: readOnly,
                ifrw: window,
                realtime: info.realtime,
                network: info.network,
                $container: $bar
            };

            toolbar = module.toolbar = Toolbar.create(configTb);

            Title.setToolbar(toolbar);

            var $rightside = toolbar.$rightside;

            /* save as template */
            if (!Cryptpad.isTemplate(window.location.href)) {
                var templateObj = {
                    rt: info.realtime,
                    Crypt: Cryptget,
                    getTitle: function () { return document.title; }
                };
                var $templateButton = Cryptpad.createButton('template', true, templateObj);
                $rightside.append($templateButton);
            }

            var $export = Cryptpad.createButton('export', true, {}, saveImage);
            $rightside.append($export);

            var $forget = Cryptpad.createButton('forget', true, {}, function (err) {
                if (err) { return; }
                setEditable(false);
                toolbar.failed();
            });
            $rightside.append($forget);


            var editHash;

            if (!readOnly) {
                editHash = Cryptpad.getEditHashFromKeys(info.channel, secret.keys);
                makeColorButton($rightside);
            }
            if (!readOnly) { Cryptpad.replaceHash(editHash); }
        };

        // used for debugging, feel free to remove
        var Catch = function (f) {
            return function () {
                try {
                    f();
                } catch (e) {
                    console.error(e);
                }
            };
        };

        var onRemote = config.onRemote = Catch(function () {
            if (initializing) { return; }
            var userDoc = module.realtime.getUserDoc();

            Metadata.update(userDoc);
            var json = JSON.parse(userDoc);
            var remoteDoc = json.content;

            // TODO update palette if it has changed

            canvas.loadFromJSON(remoteDoc);
            canvas.renderAll();

            var content = canvas.toDatalessJSON();
            if (content !== remoteDoc) { Cryptpad.notify(); }
            if (readOnly) { setEditable(false); }
        });
        setEditable(false);

        var stringifyInner = function (textValue) {
            var obj = {
                content: textValue,
                metadata: {
                    users: UserList.userData,
                    palette: palette,
                    defaultTitle: Title.defaultTitle,
                    type: 'whiteboard',
                }
            };
            if (!initializing) {
                obj.metadata.title = Title.title;
            }
            // stringify the json and send it into chainpad
            return JSONSortify(obj);
        };


        var onLocal = module.onLocal = config.onLocal = Catch(function () {
            if (initializing) { return; }
            if (readOnly) { return; }

            var content = stringifyInner(canvas.toDatalessJSON());

            module.patchText(content);
        });

        config.onReady = function (info) {
            var realtime = module.realtime = info.realtime;
            module.patchText = TextPatcher.create({
                realtime: realtime
            });

            var isNew = false;
            var userDoc = module.realtime.getUserDoc();
            if (userDoc === "" || userDoc === "{}") { isNew = true; }
            else {
                var hjson = JSON.parse(userDoc);
                if (typeof(hjson) !== 'object' || Array.isArray(hjson) ||
                    (typeof(hjson.type) !== 'undefined' && hjson.type !== whiteboard)) {
                    Cryptpad.errorLoadingScreen(Messages.typeError);
                    throw new Error(Messages.typeError);
                }
            }

            Cryptpad.removeLoadingScreen();
            setEditable(true);
            initializing = false;
            onRemote();

            /*  TODO: restore palette from metadata.palette */

            if (readOnly) { return; }
            UserList.getLastName(toolbar.$userNameButton, isNew);
        };

        config.onAbort = function () {
            setEditable(false);
            toolbar.failed();
            Cryptpad.alert(Messages.common_connectionLost, undefined, true);
        };

        // TODO onConnectionStateChange
        config.onConnectionChange = function (info) {
            setEditable(info.state);
            toolbar.failed();
            if (info.state) {
                initializing = true;
                toolbar.reconnecting(info.myId);
                Cryptpad.findOKButton().click();
            } else {
                Cryptpad.alert(Messages.common_connectionLost, undefined, true);
            }
        };

        module.rt = Realtime.start(config);

        canvas.on('mouse:up', onLocal);

        $('#clear').on('click', function () {
            canvas.clear();
            onLocal();
        });

        $('#save').on('click', function () {
            saveImage();
        });
    };

    Cryptpad.ready(function () {
        andThen();
        Cryptpad.reportAppUsage();
    });
    Cryptpad.onError(function (info) {
        if (info) {
            onConnectError();
        }
    });

    });
});
