// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/common/media-tag.js',
    '/customize/messages.js',
    '/customize/application_config.js',

    '/components/tweetnacl/nacl-fast.min.js',
    '/components/croppie/croppie.min.js',
    '/components/file-saver/FileSaver.min.js',
    'css!/components/croppie/croppie.css',
], function ($, Util, Hash, UI, h, MediaTag, Messages, AppConfig) {
    var MT = {};

    var Nacl = window.nacl;

    // Configure MediaTags to use our local viewer
    // This file is loaded by sframe-common so the following config is used in all the inner apps
    if (MediaTag) {
        // Firefox 121 introduces an issue with ligatures that requires an update to PDFjs
        // See: https://github.com/cryptpad/cryptpad/issues/1362
        // Unfortunately this updated PDFjs doesn't work with older browsers

        let isModernFirefox = false;
        try {
            const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
            if (isFirefox) {
                let version = +navigator.userAgent.match(/rv:([0-9.]+)/)[1];
                isModernFirefox = version >= 100;
            }
        } catch (e) {}
        let isModernChromium = false;
        try {
            isModernChromium = navigator.userAgentData.brands.some(data => {
                return data.brand === 'Chromium' && data.version >= 100;
            });
        } catch (e) {}

        let path = 'legacy';
        if (isModernFirefox || isModernChromium) { path = 'modern'; }
        MediaTag.setDefaultConfig('pdf', {
            viewer: `/lib/pdfjs/${path}/web/viewer.html`
        });
        MediaTag.setDefaultConfig('download', {
            text: Messages.mediatag_saveButton,
            textDl: Messages.mediatag_loadButton,
        });
    }
    MT.MediaTag = MediaTag;

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

    var animal_avatars = {};
    MT.getCursorAvatar = function (cursor) {
        var uid = cursor.uid;
        // TODO it would be nice to have "{0} is editing" instead of just their name
        var html = '<span class="cp-cursor-avatar">';
        if (cursor.avatar && avatars[cursor.avatar]) {
            html += avatars[cursor.avatar];
        } else if (animal_avatars[uid]) {
            html += animal_avatars[uid] + ' ';
        }
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
        MediaTag($tag[0], {force: true}).on('error', function (data) {
            console.error(data);
        });
    };

    // https://emojipedia.org/nature/
    var ANIMALS = AppConfig.emojiAvatars || [];

    var getPseudorandomAnimal = MT.getPseudorandomAnimal = function (seed) {
        if (!ANIMALS.length) { return ''; }
        if (typeof(seed) !== 'string') { return; }
        seed = seed.replace(/\D/g, '').slice(0, 10); // TODO possible optimization for on-wire uid
        seed = parseInt(seed);
        if (!seed) { return; }
        return ANIMALS[seed % ANIMALS.length] || '';
    };
    //this regex identifies both discord and unicode emojis (with optional skin tone modifiers) and complex zwj emoji sequences
    const emojiWithZWJRegex = /(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?)*|\p{Extended_Pictographic})/gu;
    var getPrettyInitials = MT.getPrettyInitials = function (name) {
        let matches = name.match(emojiWithZWJRegex);
        if (matches && name.startsWith(matches[0])) {
            return matches[0];
        }
        else {
            //this is for removing all trailing white characters and unnecessary/redundant emojis
            name = name.replace(emojiWithZWJRegex, '');
            name = name.replace(/\uFE0F/g, '').replace(/\u200D/g, '').replace(/\u2060/g, '');
            name = name.trim();
        }
        var parts = name.split(/\s+/);
        var text;
        if (parts.length > 1) {
            text = parts.slice(0, 2).map(Util.getFirstCharacter).join('');
        } else {
            text = Util.getFirstCharacter(name);
            var second = Util.getFirstCharacter(name.replace(text, ''));
            if (second && second !== '?') {
                text += second;
            }
        }
        return text;
    };

    MT.displayAvatar = function (common, $container, href, name, _cb, uid) {
        var cb = Util.once(Util.mkAsync(_cb || function () {}));
        var displayDefault = function () {
            var animal_avatar;
            if (uid && animal_avatars[uid]) {
                animal_avatar = animal_avatars[uid];
            }

            name = UI.getDisplayName(name);
            var text;
            if (ANIMALS.length && name === Messages.anonymous && uid) {
                if (animal_avatar) {
                    text = animal_avatar;
                } else {
                    text = animal_avatar = getPseudorandomAnimal(uid);
                }
            } else {
                text = getPrettyInitials(name);
            }

            var $avatar = $('<span>', {
                'class': 'cp-avatar-default' + (animal_avatar? ' animal': ''),
                // this prevents screenreaders from trying to describe this
                alt: '',
                'aria-hidden': true,
            }).text(text);
            $container.append($avatar);
            if (uid && animal_avatar) {
                animal_avatars[uid] = animal_avatar;
            }
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
                var mt = UI.mediaTag(src, cryptKey);
                var $img = $(mt).appendTo($container);
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
            'image/webp',
            'image/gif',
        ];
        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: cb
        };
        var FM = common.createFileManager(fmConfig);
        var accepted = ".gif,.jpg,.jpeg,.png,.webp";
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
                    }).on('progress', function () {
                        $spinner.hide();
                        locked = true;
                    }).on('complete', function () {
                        locked = false;
                        $spinner.hide();
                    });
                });
            }

            var observer = new MutationObserver(function(mutations) {
                mutations.forEach(function() {
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
                h('li', h('a.cp-app-code-context-openin.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-external-link",
                }, Messages.pad_mediatagOpen)),
                h('li', h('a.cp-app-code-context-share.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-shhare-alt",
                }, Messages.pad_mediatagShare)),
                h('li', h('a.cp-app-code-context-saveindrive.dropdown-item', {
                    'tabindex': '-1',
                    'data-icon': "fa-cloud-upload",
                }, Messages.pad_mediatagImport)),
                h('li.cp-svg', h('a.cp-app-code-context-download.dropdown-item', {
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
                if ($mt.is('pre.mermaid')  || $mt.is('pre.markmap')) {
                    (function () {
                    var name = Messages.mediatag_defaultImageName + '.svg';
                    var svg = $mt.find('svg')[0].cloneNode(true);
                    $(svg).attr('xmlns', 'http://www.w3.org/2000/svg').attr('width', $mt.width()).attr('height', $mt.height());
                    $(svg).find('foreignObject').each(function (i, el) {
                        var $el = $(el);
                        $el.find('br').after('\n');
                        $el.find('br').remove();
                        var t = $el[0].innerText || $el[0].textContent;
                        t.split('\n').forEach(function (text, i) {
                            var dy = (i+1)+'em';
                            $el.after(h('text', {y:0, dy:dy, style: ''}, text));
                        });
                        $el.remove();
                    });
                    var html = svg.outerHTML;
                    html = html.replace('<br>', '<br/>');
                    var b = new Blob([html], { type: 'image/svg+xml' });
                    window.saveAs(b, name);
                    })();
                    return;
                }
                if ($mt.is('pre.mathjax')) {
                    (function () {
                    var name = Messages.mediatag_defaultImageName + '.png';
                    var svg = $mt.find('> span > svg')[0];
                    var clone = svg.cloneNode(true);
                    var html = clone.outerHTML;
                    var b = new Blob([html], { type: 'image/svg+xml' });
                    var blobURL = URL.createObjectURL(b);
                    var i = new Image();
                    i.onload = function () {
                        var canvas = document.createElement('canvas');
                        canvas.width = i.width;
                        canvas.height = i.height;
                        var context = canvas.getContext('2d');
                        context.drawImage(i, 0, 0, i.width, i.height);
                        canvas.toBlob(function (blob) {
                            window.saveAs(blob, name);
                        });
                    };
                    i.src = blobURL;
                    })();
                    return;
                }
                var media = Util.find($mt, [0, '_mediaObject']);
                if (!media) { return void console.error('no media'); }
                if (!media.complete) { return void UI.warn(Messages.mediatag_notReady); }
                if (!(media && media._blob)) { return void console.error($mt); }
                window.saveAs(media._blob.content, media.name);
            }
            else if ($this.hasClass("cp-app-code-context-open")) {
                $mt.trigger('preview');
            }
            else if ($this.hasClass("cp-app-code-context-openin")) {
                var hash = common.getHashFromMediaTag($mt);
                common.openURL(Hash.hashToHref(hash, 'file'));
            }
            else if ($this.hasClass("cp-app-code-context-share")) {
                var data = {
                    file: true,
                    pathname: '/file/',
                    hashes: {
                        fileHash: common.getHashFromMediaTag($mt)
                    },
                    title: Util.find($mt[0], ['_mediaObject', 'name']) || ''
                };
                common.getSframeChannel().event('EV_SHARE_OPEN', data);
            }
        });

        return m;
    };

    return MT;
});
