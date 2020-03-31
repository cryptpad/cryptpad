define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/media-tag.js',
    '/customize/messages.js',

    '/bower_components/croppie/croppie.min.js',
    'css!/bower_components/croppie/croppie.css',
], function ($, Util, Hash, UI, MediaTag, Messages) {
    var MT = {};

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

    MT.previewMediaTag = function (common, config) {
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
            key = secret.keys && secret.keys.cryptKey;
        }
        if (!src || !key) {
            // XXX
            return;
        }

        var tag = h('media-tag', {
            src: src,
            'data-crypto-key': 'cryptpad:' + key
        });
        $img.attr('src', src);
        $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
        

    };

    return MT;
});
