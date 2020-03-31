define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/media-tag.js',
    '/customize/messages.js',

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

    MT.getCursorAvatar = function (cursor) {
        var html = '<span class="cp-cursor-avatar">';
        html += (cursor.avatar && avatars[cursor.avatar]) || '';
        html += cursor.name + '</span>';
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

        // XXX Drop support for external URLs
        var parsed = Hash.parsePadUrl(href);
        if (parsed.type !== "file" || parsed.hashData.type !== "file") {
            var $img = $('<media-tag>').appendTo($container);
            var img = new Image();
            $(img).attr('src', href);
            img.onload = function () {
                centerImage($img, $(img), img);
                $(img).appendTo($img);
            };
            return;
        }
        // No password for avatars
        var privateData = common.getMetadataMgr().getPrivateData();
        var origin = privateData.fileHost || privateData.origin;
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

    MT.getMediaTagPreview = function (common, config) {
        config = config || {};

        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();

        var src = config.src;
        var key = config.key;
        if (config.href) {
            var parsed = Hash.parsePadUrl(config.href);
            var secret = Hash.getSecrets(parsed.type, parsed.hash, config.password);
            var host = priv.fileHost || priv.origin || '';
            src = host + Hash.getBlobPathFromHex(secret.channel);
            var _key = secret.keys && secret.keys.cryptKey;
            if (_key) { key = 'cryptpad:' + Nacl.util.encodeBase64(_key); }
        }
        if (!src || !key) { return void UI.log(Messages.error); }

        var tag = h('media-tag', {
            src: src,
            'data-crypto-key': key
        });

        var $modal = UI.createModal({
            id: 'cp-mediatag-preview-modal',
            $body: $('body')
        }).show().focus();

        var $container = $modal.find('.cp-modal').append(h('div.cp-mediatag-container', [
            h('div.cp-loading-spinner-container', h('span.cp-spinner')),
            tag
        ]));

        var el;
        var checkSize = function () {
            if (!el) { return; }
            var size = el.naturalHeight || el.videoHeight;
            if (el.nodeName !== 'IMG' && el.nodeName !== 'VIDEO') {
                $container.find('.cp-mediatag-container').css('height', '100%');
            }
            if (!size) { return; }
            // Center small images and videos
            $container.find('.cp-mediatag-container').css('height', '100%');
            if (size < $container.height()) {
                $container.find('.cp-mediatag-container').css('height', 'auto');
            }
        };
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                $container.find('.cp-loading-spinner-container').remove();
                if (mutation.addedNodes.length === 1) {
                    el = mutation.addedNodes[0];
                    if (el.readyState === 0) {
                        // Wait for the video to be ready before checking the size
                        el.onloadedmetadata = checkSize;
                        return;
                    }
                    if (el.complete === false) {
                        el.onload = checkSize;
                        return;
                    }
                    setTimeout(checkSize);
                }
            });
        });
        observer.observe(tag, {
            attributes: false,
            childList: true,
            characterData: false
        });
        MediaTag(tag).on('error', function () {
            UI.log(Messages.error);
            $modal.hide();
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
                h('li', h('a.cp-app-code-context-open.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-eye",
                }, Messages.fc_open)), // XXX
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
            if ($(this).hasClass("cp-app-code-context-saveindrive")) {
                common.importMediaTag($mt);
            }
            else if ($(this).hasClass("cp-app-code-context-download")) {
                var media = $mt[0]._mediaObject;
                window.saveAs(media._blob.content, media.name);
            }
            else if ($(this).hasClass("cp-app-code-context-open")) {
                common.getMediaTagPreview({
                    src: $mt.attr('src'),
                    key: $mt.attr('data-crypto-key')
                });
            }
        });

        return m;
    };

    return MT;
});
