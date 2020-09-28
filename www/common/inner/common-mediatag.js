define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/media-tag.js',
    '/customize/messages.js',

    '/bower_components/tweetnacl/nacl-fast.min.js',
    '/bower_components/croppie/croppie.min.js',
    '/bower_components/file-saver/FileSaver.min.js',
    'css!/bower_components/croppie/croppie.css',
], function ($, Util, Hash, UI, h, MediaTag, Messages) {
    var MT = {};

    var Nacl = window.nacl;

    // Configure MediaTags to use our local viewer
    if (MediaTag) {
        MediaTag.setDefaultConfig('pdf', {
            viewer: '/common/pdfjs/web/viewer.html'
        });
    }

    // Cache of the avatars outer html (including <media-tag>)
    var avatars = {};

    MT.getMediaTag = function (common, data) {
        var metadataMgr = common.getMetadataMgr();
        var privateDat = metadataMgr.getPrivateData();
        var origin = privateDat.fileHost || privateDat.origin;
        var src = data.src = data.src.slice(0,1) === '/' ? origin + data.src : data.src;
        return h('media-tag', {
            src: src,
            'data-crypto-key': 'cryptpad:'+data.key
        });
    };

    MT.getCursorAvatar = function (cursor) {
        var html = '<span class="cp-cursor-avatar">';
        html += (cursor.avatar && avatars[cursor.avatar]) || '';
        html += Util.fixHTML(cursor.name) + '</span>';
        return html;
    };

    MT.displayMediatagImage = function (Common, $tag, _cb) {
        var cb = Util.once(_cb);
        if (!$tag.length || !$tag.is('media-tag')) { return void cb('NOT_MEDIATAG'); }
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    if (mutation.addedNodes.length > 1 ||
                        mutation.addedNodes[0].nodeName !== 'IMG') {
                        return void cb('NOT_IMAGE');
                    }
                    var $image = $tag.find('img');
                    var onLoad = function () {
                        cb(null, $image);
                    };
                    if ($image[0].complete) { onLoad(); }
                    $image.on('load', onLoad);
                }
            });
        });
        observer.observe($tag[0], {
            attributes: false,
            childList: true,
            characterData: false
        });
        MediaTag($tag[0]).on('error', function (data) {
            console.error(data);
        });
    };

    MT.displayAvatar = function (common, $container, href, name, _cb) {
        var cb = Util.once(Util.mkAsync(_cb || function () {}));
        var displayDefault = function () {
            var text = (href && typeof(href) === "string") ? href : Util.getFirstCharacter(name);
            var $avatar = $('<span>', {'class': 'cp-avatar-default'}).text(text);
            $container.append($avatar);
            if (cb) { cb(); }
        };
        if (!window.Symbol) { return void displayDefault(); } // IE doesn't have Symbol
        if (!href || href.length === 1) { return void displayDefault(); }

        if (avatars[href]) {
            var nodes = $.parseHTML(avatars[href]);
            var $el = $(nodes[0]);
            $container.append($el);
            return void cb($el);
        }

        var centerImage = function ($img, $image) {
            var img = $image[0];
            var w = img.width;
            var h = img.height;
            if (w>h) {
                $image.css('max-height', '100%');
                $img.css('flex-direction', 'column');
                avatars[href] = $img[0].outerHTML;
                if (cb) { cb($img); }
                return;
            }
            $image.css('max-width', '100%');
            $img.css('flex-direction', 'row');
            avatars[href] = $img[0].outerHTML;
            if (cb) { cb($img); }
        };

        // No password for avatars
        var privateData = common.getMetadataMgr().getPrivateData();
        var origin = privateData.fileHost || privateData.origin;
        var parsed = Hash.parsePadUrl(href);
        var secret = Hash.getSecrets('file', parsed.hash);
        if (secret.keys && secret.channel) {
            var hexFileName = secret.channel;
            var cryptKey = Hash.encodeBase64(secret.keys && secret.keys.cryptKey);
            var src = origin + Hash.getBlobPathFromHex(hexFileName);
            common.getFileSize(hexFileName, function (e, data) {
                if (e || !data) { return void displayDefault(); }
                if (typeof data !== "number") { return void displayDefault(); }
                if (Util.bytesToMegabytes(data) > 0.5) { return void displayDefault(); }
                var $img = $('<media-tag>').appendTo($container);
                $img.attr('src', src);
                $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
                MT.displayMediatagImage(common, $img, function (err, $image) {
                    if (err) { return void console.error(err); }
                    centerImage($img, $image);
                });
            });
        }
    };
    var transformAvatar = function (file, cb) {
        if (file.type === 'image/gif') { return void cb(file); }
        var $croppie = $('<div>', {
            'class': 'cp-app-profile-resizer'
        });

        if (typeof ($croppie.croppie) !== "function") {
            return void cb(file);
        }

        var todo = function () {
            UI.confirm($croppie[0], function (yes) {
                if (!yes) { return; }
                $croppie.croppie('result', {
                    type: 'blob',
                    size: {width: 300, height: 300}
                }).then(function(blob) {
                    blob.lastModifiedDate = new Date();
                    blob.name = 'avatar';
                    cb(blob);
                });
            });
        };

        var reader = new FileReader();
        reader.onload = function(e) {
            $croppie.croppie({
                url: e.target.result,
                viewport: { width: 100, height: 100 },
                boundary: { width: 400, height: 300 },
            });
            todo();
        };
        reader.readAsDataURL(file);
    };
    MT.addAvatar = function (common, cb) {
        var AVATAR_SIZE_LIMIT = 0.5;
        var allowedMediaTypes = [
            'image/png',
            'image/jpeg',
            'image/jpg',
            'image/gif',
        ];
        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: cb
        };
        var FM = common.createFileManager(fmConfig);
        var accepted = ".gif,.jpg,.jpeg,.png";
        var data = {
            FM: FM,
            filter: function (file) {
                var sizeMB = Util.bytesToMegabytes(file.size);
                var type = file.type;
                // We can't resize .gif so we have to display an error if it is too big
                if (sizeMB > AVATAR_SIZE_LIMIT && type === 'image/gif') {
                    UI.log(Messages._getKey('profile_uploadSizeError', [
                        Messages._getKey('formattedMB', [AVATAR_SIZE_LIMIT])
                    ]));
                    return false;
                }
                // Display an error if the image type is not allowed
                if (allowedMediaTypes.indexOf(type) === -1) {
                    UI.log(Messages._getKey('profile_uploadTypeError', [
                        accepted.split(',').join(', ')
                    ]));
                    return false;
                }
                return true;
            },
            transformer: transformAvatar,
            accept: accepted
        };
        return data;
    };

    MT.getMediaTagPreview = function (common, tags, start) {
        if (!Array.isArray(tags) || !tags.length) { return; }

        var i = start;
        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();

        var left, right;

        var modal = UI.createModal({
            id: 'cp-mediatag-preview-modal',
            $body: $('body')
        });
        modal.show();
        var $modal = modal.$modal.focus();
        var $container = $modal.find('.cp-modal').append([
            h('div.cp-mediatag-control', left = h('span.fa.fa-chevron-left')),
            h('div.cp-mediatag-container', [
                h('div.cp-loading-spinner-container', h('span.cp-spinner')),
            ]),
            h('div.cp-mediatag-control', right = h('span.fa.fa-chevron-right')),
        ]);
        var $close = $modal.find('.cp-modal-close');
        var $left = $(left);
        var $right = $(right);
        var $inner = $container.find('.cp-mediatag-container');

        var $spinner = $container.find('.cp-loading-spinner-container');

        var locked = false;
        var show = function (_i) {
            if (locked) { return; }
            locked = true;
            if (_i < 0) { i = 0; }
            else if (_i > tags.length -1) { i = tags.length - 1; }
            else { i = _i; }

            // Show/hide controls
            $left.css('visibility', '');
            $right.css('visibility', '');
            if (i === 0) {
                $left.css('visibility', 'hidden');
            }
            if (i === tags.length - 1) {
                $right.css('visibility', 'hidden');
            }

            // Reset modal
            $inner.find('media-tag, pre[data-plugin]').detach();
            $spinner.show();

            // Check src and cryptkey
            var cfg = tags[i];
            var tag;

            if (cfg.svg) {
                $inner.append(cfg.svg);
                if (!cfg.render) {
                    $spinner.hide();
                    locked = false;
                    return;
                }
                setTimeout(cfg.render);
                tag = cfg.svg;
            } else {
                var src = cfg.src;
                var key = cfg.key;
                if (cfg.href) {
                    var parsed = Hash.parsePadUrl(cfg.href);
                    var secret = Hash.getSecrets(parsed.type, parsed.hash, cfg.password);
                    var host = priv.fileHost || priv.origin || '';
                    src = host + Hash.getBlobPathFromHex(secret.channel);
                    var _key = secret.keys && secret.keys.cryptKey;
                    if (_key) { key = 'cryptpad:' + Nacl.util.encodeBase64(_key); }
                }
                if (!src || !key) {
                    locked = false;
                    $spinner.hide();
                    return void UI.log(Messages.error);
                }
                tag = h('media-tag', {
                    src: src,
                    'data-crypto-key': key
                });
                $inner.append(tag);
                setTimeout(function () {
                    MediaTag(tag).on('error', function () {
                        locked = false;
                        $spinner.hide();
                        UI.log(Messages.error);
                    });
                });
            }

            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function() {
                    locked = false;
                    $spinner.hide();
                });
            });
            observer.observe(tag, {
                attributes: false,
                childList: true,
                characterData: false
            });
        };

        show(i);
        var previous = function () {
            if (i === 0) { return; }
            show(i - 1);
        };
        var next = function () {
            if (i === tags.length - 1) { return; }
            show(i + 1);
        };
        $left.click(previous);
        $right.click(next);

        $modal.on('keydown', function (e) {
            e.stopPropagation();
        });

        var close = function () {
            $inner.find('audio, video').trigger('pause');
            $modal.hide();
        };

        $close.on('click', close);
        $modal.on('keyup', function (e) {
            //if (!Slide.shown) { return; }
            e.stopPropagation();
            if (e.ctrlKey) { return; }
            switch(e.which) {
                case 33: // pageup
                case 38: // up
                case 37: // left
                    previous();
                    break;
                case 34: // pagedown
                case 32: // space
                case 40: // down
                case 39: // right
                    next();
                    break;
                case 27: // esc
                    close();
                    break;
                default:
            }
        });
    };

    var mediatagContextMenu;
    MT.importMediaTagMenu = function (common) {
        if (mediatagContextMenu) { return mediatagContextMenu; }

        // Create context menu
        var menu = h('div.cp-contextmenu.dropdown.cp-unselectable', [
            h('ul.dropdown-menu', {
                'role': 'menu',
                'aria-labelledBy': 'dropdownMenu',
                'style': 'display:block;position:static;margin-bottom:5px;'
            }, [
                h('li.cp-svg', h('a.cp-app-code-context-open.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-eye",
                }, Messages.pad_mediatagPreview)),
                h('li', h('a.cp-app-code-context-saveindrive.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-cloud-upload",
                }, Messages.pad_mediatagImport)),
                h('li', h('a.cp-app-code-context-download.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-download",
                }, Messages.download_mt_button)),
            ])
        ]);
        // create the icon for each contextmenu option
        $(menu).find("li a.dropdown-item").each(function (i, el) {
            var $icon = $("<span>");
            if ($(el).attr('data-icon')) {
                var font = $(el).attr('data-icon').indexOf('cptools') === 0 ? 'cptools' : 'fa';
                $icon.addClass(font).addClass($(el).attr('data-icon'));
            } else {
                $icon.text($(el).text());
            }
            $(el).prepend($icon);
        });
        var m = UI.createContextMenu(menu);

        mediatagContextMenu = m;

        var $menu = $(m.menu);
        $menu.on('click', 'a', function (e) {
            e.stopPropagation();
            m.hide();
            var $mt = $menu.data('mediatag');
            var $this = $(this);
            if ($this.hasClass("cp-app-code-context-saveindrive")) {
                common.importMediaTag($mt);
            }
            else if ($this.hasClass("cp-app-code-context-download")) {
                var media = Util.find($mt, [0, '_mediaObject']);
                if (!(media && media._blob)) { return void console.error($mt); }
                window.saveAs(media._blob.content, media.name);
            }
            else if ($this.hasClass("cp-app-code-context-open")) {
                $mt.trigger('preview');
            }
        });

        return m;
    };

    return MT;
});
