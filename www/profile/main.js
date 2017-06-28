require.config({
    paths: {
        cm: '/bower_components/codemirror'
    }
});
define([
    'jquery',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/marked/marked.min.js',
    'cm/lib/codemirror',
    'cm/mode/markdown/markdown',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'less!/profile/main.less',
], function ($, Cryptpad, Listmap, Crypto, Marked, CodeMirror) {

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    $(window.document).on('decryption', function (e) {
        var decrypted = e.originalEvent;
        if (decrypted.callback) { decrypted.callback(); }
    })
    .on('decryptionError', function (e) {
        var error = e.originalEvent;
        Cryptpad.alert(error.message);
    });

    // Marked
    var renderer = new Marked.Renderer();
    Marked.setOptions({
        renderer: renderer,
        sanitize: true
    });
    // Tasks list
    var checkedTaskItemPtn = /^\s*\[x\]\s*/;
    var uncheckedTaskItemPtn = /^\s*\[ \]\s*/;
    renderer.listitem = function (text) {
        var isCheckedTaskItem = checkedTaskItemPtn.test(text);
        var isUncheckedTaskItem = uncheckedTaskItemPtn.test(text);
        if (isCheckedTaskItem) {
            text = text.replace(checkedTaskItemPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        if (isUncheckedTaskItem) {
            text = text.replace(uncheckedTaskItemPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        var cls = (isCheckedTaskItem || isUncheckedTaskItem) ? ' class="todo-list-item"' : '';
        return '<li'+ cls + '>' + text + '</li>\n';
    };
    /*renderer.image = function (href, title, text) {
        if (href.slice(0,6) === '/file/') {
            var parsed = Cryptpad.parsePadUrl(href);
            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
            var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '">';
            mt += '</media-tag>';
            return mt;
        }
        var out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? '/>' : '>';
        return out;
    };*/

    var Messages = Cryptpad.Messages;

    var DISPLAYNAME_ID = "displayName";
    var LINK_ID = "link";
    var AVATAR_ID = "avatar";
    var DESCRIPTION_ID = "description";
    var PUBKEY_ID = "pubKey";
    var CREATE_ID = "createProfile";
    var HEADER_ID = "header";
    var HEADER_RIGHT_ID = "rightside";

    var createEditableInput = function ($block, name, ph, getValue, setValue, realtime) {
        var lastVal;
        getValue(function (value) {
            lastVal = value;
            var $input = $('<input>', {
                'id': name+'Input',
                placeholder: ph
            }).val(value);
            var $icon = $('<span>', {'class': 'fa fa-pencil edit'});
            var editing = false;
            var todo = function () {
                if (editing) { return; }
                editing = true;

                var newVal = $input.val().trim();

                if (newVal === lastVal) {
                    editing = false;
                    return;
                }

                setValue(newVal, function (err) {
                    if (err) { return void console.error(err); }
                    Cryptpad.whenRealtimeSyncs(realtime, function () {
                        lastVal = newVal;
                        Cryptpad.log('TODO: '+name+' saved');
                        editing = false;
                    });
                });
            };
            $input.on('keyup', function (e) {
                if (e.which === 13) { return void todo(); }
                if (e.which === 27) {
                    $input.val(lastVal);
                }
            });
            $icon.click(function () { $input.focus(); });
            $input.focus(function () {
                $input.width('');
            });
            $input.focusout(todo);
            $block.append($input).append($icon);
        });
    };

    /*
    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);
        var getValue = function (cb) {
            Cryptpad.getLastName(function (err, name) {
                if (err) { return void console.error(err); }
                cb(name);
            });
        };
        if (APP.readOnly) {
            var $span = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
            getValue(function (value) {
                $span.text(value);
            });
            return;
        }
        var setValue = function (value, cb) {
            Cryptpad.setAttribute('username', value, function (err) {
                cb(err);
            });
        };
        var placeholder = Messages.anonymous;
        var rt = Cryptpad.getStore().getProxy().info.realtime;
        createEditableInput($block, DISPLAYNAME_ID, placeholder, 32, getValue, setValue, rt);
    };
    */
    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);
        var getValue = function (cb) {
            cb(APP.lm.proxy.name);
        };
        var placeholder = Messages.anonymous;
        if (APP.readOnly) {
            var $span = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
            getValue(function (value) {
                $span.text(value || placeholder);
            });
            return;
        }
        var setValue = function (value, cb) {
            APP.lm.proxy.name = value;
            cb();
        };
        var rt = Cryptpad.getStore().getProxy().info.realtime;
        createEditableInput($block, DISPLAYNAME_ID, placeholder, getValue, setValue, rt);
    };

    var addLink = function ($container) {
        var $block = $('<div>', {id: LINK_ID}).appendTo($container);
        var getValue = function (cb) {
            cb(APP.lm.proxy.url);
        };
        if (APP.readOnly) {
            var $a = $('<a>', {
                'class': LINK_ID,
                target: '_blank',
                rel: 'noreferrer noopener'
            }).appendTo($block);
            getValue(function (value) {
                if (!value) {
                    return void $a.hide();
                }
                $a.attr('href', value).text(value);
            });
            return;
        }
        var setValue = function (value, cb) {
            APP.lm.proxy.url = value;
            cb();
        };
        var rt = APP.lm.realtime;
        var placeholder = "URL"; //TODO
        createEditableInput($block, LINK_ID, placeholder, getValue, setValue, rt);
    };

    var addAvatar = function ($container) {
        var $block = $('<div>', {id: AVATAR_ID}).appendTo($container);
        var $span = $('<span>').appendTo($block);
        if (APP.lm.proxy.avatar) {
            //var file = APP.lm.proxy.avatar;
            var $img = $('<media-tag>').appendTo($span);
            $img.attr('src', '/blob/45/45170bcd64aae1726b0b0e06c4360181a08bad9596640863');
            $img.attr('data-crypto-key', 'cryptpad:5vs/ciPzSAyHeP6XRwxpFZt/cjkRC+EE2CRw+/xfcVI=');
            require(['/common/media-tag.js'], function (MediaTag) {
                var allowedMediaTypes = [
                    'image/png',
                    'image/jpeg',
                    'image/jpg',
                    'image/gif',
                ];
                MediaTag.CryptoFilter.setAllowedMediaTypes(allowedMediaTypes);
                MediaTag($img[0]);
            });
        }
        if (APP.readOnly) { return; }

        //var $button = $('<button>', {'class': 'btn btn-success'}).text('TODO: change avatar');
        //$block.append($button);

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                console.log(data);
            }
        };
        APP.FM = Cryptpad.createFileManager(fmConfig);
        var data = {FM: APP.FM};
        $block.append(Cryptpad.createButton('upload', false, data));
    };

    var addDescription = function ($container) {
        var $block = $('<div>', {id: DESCRIPTION_ID}).appendTo($container);

        if (APP.readOnly) {
            var $div = $('<div>', {'class': 'rendered'}).appendTo($block);
            var val = Marked(APP.lm.proxy.description);
            $div.html(val);
            return;
        }

        var $ok = $('<span>', {'class': 'ok fa fa-check', title: Messages.saved}).appendTo($block);
        var $spinner = $('<span>', {'class': 'spin fa fa-spinner fa-pulse'}).appendTo($block);
        var $textarea = $('<textarea>').val(APP.lm.proxy.description || '');
        $block.append($textarea);
        var editor = APP.editor = CodeMirror.fromTextArea($textarea[0], {
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine : true,
            mode: "markdown",
        });

        var onLocal = function () {
            $ok.hide();
            $spinner.show();
            var val = editor.getValue();
            APP.lm.proxy.description = val;
            Cryptpad.whenRealtimeSyncs(APP.lm.realtime, function () {
                $ok.show();
                $spinner.hide();
            });
        };

        editor.on('change', onLocal);
    };

    var addPublicKey = function ($container) {
        var $block = $('<div>', {id: PUBKEY_ID});
        var pubKey = Cryptpad.getProxy().edPublic;
        $block.text(pubKey);
        $container.append($block);
    };

    var onReady = function () {
        // TODO: on reconnect, this is called multiple times...
        APP.$container.find('#'+CREATE_ID).remove();

        if (!APP.initialized) {
            var $header = $('<div>', {id: HEADER_ID}).appendTo(APP.$container);
            addAvatar($header);
            var $rightside = $('<div>', {id: HEADER_RIGHT_ID}).appendTo($header);
            addDisplayName($rightside);
            addLink($rightside);
            addDescription(APP.$container);
            addPublicKey(APP.$container);
            APP.initialized = true;
        }
    };

    var onInit = function () {
        
    };

    var onDisconnect = function () {};
    var onChange = function () {};

    var andThen = function (profileHash) {
        var secret = Cryptpad.getSecrets('profile', profileHash);
        var readOnly = APP.readOnly = secret.keys && !secret.keys.editKeyStr;
        var listmapConfig = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: readOnly,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'profile',
            logLevel: 1,
        };
        var lm = APP.lm = Listmap.create(listmapConfig);
        lm.proxy.on('create', onInit)
                .on('ready', onReady)
                .on('disconnect', onDisconnect)
                .on('change', [], onChange);
    };

    var getOrCreateProfile = function () {
        var obj = Cryptpad.getStore().getProxy().proxy;
        if (obj.profile && obj.profile.view && obj.profile.edit) {
            return void andThen(obj.profile.edit);
        }
        // If the user doesn't have a public profile, ask him if he wants to create one
        var todo = function () {
            var secret = Cryptpad.getSecrets();
            obj.profile = {};
            var channel = Cryptpad.createChannelId();
            obj.profile.edit = Cryptpad.getEditHashFromKeys(channel, secret.keys);
            obj.profile.view = Cryptpad.getViewHashFromKeys(channel, secret.keys);
            obj.profile.name = APP.rt.proxy[Cryptpad.displayNameKey] || '';
            andThen(obj.profile.edit);
        };

        // TODO: if not logged in, display a register button here?
        var $create = $('<div>', {id: CREATE_ID});
        var $button = $('<button>', {'class': 'btn btn-success'});
        $button.text('TODO: create a profile?').click(todo).appendTo($create); // XXX
        APP.$container.append($create);
    };

    $(function () {
        var $main = $('#mainBlock');
        // Language selector
        var $sel = $('#language-selector');
        Cryptpad.createLanguageSelector(undefined, $sel);
        $sel.find('button').addClass('btn').addClass('btn-secondary');
        $sel.show();

        // User admin menu
        var $userMenu = $('#user-menu');
        var userMenuCfg = {
            $initBlock: $userMenu
        };
        var $userAdmin = Cryptpad.createUserAdminMenu(userMenuCfg);
        $userAdmin.find('button').addClass('btn').addClass('btn-secondary');

        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
        });

        // main block is hidden in case javascript is disabled
        $main.removeClass('hidden');

        APP.$container = $('#container');

        Cryptpad.ready(function () {
            Cryptpad.reportAppUsage();

            if (window.location.hash) {
                return void andThen(window.location.hash.slice(1));
            }
            getOrCreateProfile();
        });
    });

});
