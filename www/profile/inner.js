define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-realtime.js',
    '/customize/messages.js',
    '/bower_components/marked/marked.min.js',
    'cm/lib/codemirror',

    'cm/mode/markdown/markdown',

    'css!/bower_components/codemirror/lib/codemirror.css',
    'css!/bower_components/codemirror/addon/dialog/dialog.css',
    'css!/bower_components/codemirror/addon/fold/foldgutter.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
    '/bower_components/croppie/croppie.min.js',
    'css!/bower_components/croppie/croppie.css',
], function (
    $,
    Crypto,
    Listmap,
    Toolbar,
    nThen,
    SFCommon,
    Util,
    UI,
    Realtime,
    Messages,
    Marked,
    CodeMirror
    )
{
    var APP = window.APP = {
        _onRefresh: []
    };

    // Decryption event for avatar mediatag (TODO not needed anymore?)
    $(window.document).on('decryption', function (e) {
        var decrypted = e.originalEvent;
        if (decrypted.callback) { decrypted.callback(); }
    })
    .on('decryptionError', function (e) {
        var error = e.originalEvent;
        UI.alert(error.message);
    });

    $(window).click(function () {
        $('.cp-dropdown-content').hide();
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

    var DISPLAYNAME_ID = "cp-app-profile-displayname";
    var LINK_ID = "cp-app-profile-link";
    var AVATAR_ID = "cp-app-profile-avatar";
    var DESCRIPTION_ID = "cp-app-profile-description";
    var PUBKEY_ID = "cp-app-profile-pubkey";
    var CREATE_ID = "cp-app-profile-create";
    var HEADER_ID = "cp-app-profile-header";
    var HEADER_RIGHT_ID = "cp-app-profile-rightside";
    var CREATE_INVITE_BUTTON = 'cp-app-profile-invite-button'; /* jshint ignore: line */
    var VIEW_PROFILE_BUTTON = 'cp-app-profile-viewprofile-button';

    var common;
    var sFrameChan;

    var createEditableInput = function ($block, name, ph, getValue, setValue, fallbackValue) {
        fallbackValue = fallbackValue || ''; // don't ever display 'null' or 'undefined'
        var lastVal;
        getValue(function (value) {
            lastVal = value;
            var $input = $('<input>', {
                'id': name+'Input',
                placeholder: ph
            }).val(value);
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
                    lastVal = newVal;
                    UI.log(Messages._getKey('profile_fieldSaved', [newVal || fallbackValue]));
                    editing = false;
                });
            };
            $input.on('keyup', function (e) {
                if (e.which === 13) { return void todo(); }
                if (e.which === 27) {
                    $input.val(lastVal);
                }
            });
            $input.focus(function () {
                $input.width('');
            });
            $input.focusout(todo);
            $block.append($input);
        });
    };

/* jshint ignore:start */
    var isFriend = function (proxy, edKey) {
        var friends = Util.find(proxy, ['friends']);
        return typeof(edKey) === 'string' && friends && (edKey in friends);
    };

    var addCreateInviteLinkButton = function ($container) {
        return;
        /*var obj = APP.lm.proxy;

        var proxy = Cryptpad.getProxy();
        var userViewHash = Util.find(proxy, ['profile', 'view']);

        var edKey = obj.edKey;
        var curveKey = obj.curveKey;

        if (!APP.readOnly || !curveKey || !edKey || userViewHash === window.location.hash.slice(1) || isFriend(proxy, edKey)) {
            //console.log("edit mode or missing curve key, or you're viewing your own profile");
            return;
        }

        // sanitize user inputs

        var unsafeName = obj.name || '';
        console.log(unsafeName);
        var name = Util.fixHTML(unsafeName) || Messages.anonymous;
        console.log(name);

        console.log("Creating invite button");
        $("<button>", {
            id: CREATE_INVITE_BUTTON,
            title: Messages.profile_inviteButtonTitle,
        })
        .addClass('btn btn-success')
        .text(Messages.profile_inviteButton)
        .click(function () {
            UI.confirm(Messages._getKey('profile_inviteExplanation', [name]), function (yes) {
                if (!yes) { return; }
                console.log(obj.curveKey);
                UI.alert("TODO");
                // TODO create a listmap object using your curve keys
                // TODO fill the listmap object with your invite data
                // TODO generate link to invite object
                // TODO copy invite link to clipboard
            }, null, true);
        })
        .appendTo($container);*/
    };
        /* jshint ignore:end */

    var addViewButton = function ($container) {
        if (APP.readOnly) {
            return;
        }

        var hash = common.getMetadataMgr().getPrivateData().availableHashes.viewHash;
        var url = APP.origin + '/profile/#' + hash;

        var $button = $('<button>', {
            'class': 'btn btn-success',
            id: VIEW_PROFILE_BUTTON,
        })
        .text(Messages.profile_viewMyProfile)
        .click(function () {
            window.open(url, '_blank');
        });
        $container.append($button);
    };

    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);


        var getValue = function (cb) {
            cb(APP.lm.proxy.name);
        };
        var placeholder = Messages.profile_namePlaceholder;
        if (APP.readOnly) {
            var $span = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
            getValue(function (value) {
                $span.text(value || Messages.anonymous);
            });

            //addCreateInviteLinkButton($block);
            return;
        }
        var setValue = function (value, cb) {
            APP.lm.proxy.name = value;
            Realtime.whenRealtimeSyncs(APP.lm.realtime, cb);
        };
        createEditableInput($block, DISPLAYNAME_ID, placeholder, getValue, setValue, Messages.anonymous);
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
            Realtime.whenRealtimeSyncs(APP.lm.realtime, cb);
        };
        var placeholder = Messages.profile_urlPlaceholder;
        createEditableInput($block, LINK_ID, placeholder, getValue, setValue);
    };

    var AVATAR_SIZE_LIMIT = 0.5;
    var allowedMediaTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
    ];
    var transformAvatar = function (file, cb) {
        if (file.type === 'image/gif') { return void cb(file); }
        var $croppie = $('<div>', {
            'class': 'cp-app-profile-resizer'
        });

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
    var addAvatar = function ($container) {
        var $block = $('<div>', {id: AVATAR_ID}).appendTo($container);
        var $span = $('<span>').appendTo($block);
        var sframeChan = common.getSframeChannel();
        var displayAvatar = function () {
            $span.html('');
            if (!APP.lm.proxy.avatar) {
                $('<img>', {
                    src: '/customize/images/avatar.png',
                    title: Messages.profile_avatar,
                    alt: 'Avatar'
                }).appendTo($span);
                return;
            }
            common.displayAvatar($span, APP.lm.proxy.avatar);

            if (APP.readOnly) { return; }

            var $delButton = $('<button>', {
                'class': 'cp-app-profile-avatar-delete btn btn-danger fa fa-times',
                title: Messages.fc_delete
            });
            $span.append($delButton);
            $delButton.click(function () {
                var old = common.getMetadataMgr().getUserData().avatar;
                sframeChan.query("Q_PROFILE_AVATAR_REMOVE", old, function (err, err2) {
                    if (err || err2) { return void UI.log(err || err2); }
                    delete APP.lm.proxy.avatar;
                    displayAvatar();
                });
            });
        };
        displayAvatar();
        if (APP.readOnly) { return; }

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                var old = common.getMetadataMgr().getUserData().avatar;
                var todo = function () {
                    sframeChan.query("Q_PROFILE_AVATAR_ADD", data.url, function (err, err2) {
                        if (err || err2) { return void UI.log(err || err2); }
                        APP.lm.proxy.avatar = data.url;
                        displayAvatar();
                    });
                };
                if (old) {
                    sframeChan.query("Q_PROFILE_AVATAR_REMOVE", old, function (err, err2) {
                        if (err || err2) { return void UI.log(err || err2); }
                        todo();
                    });
                    return;
                }
                todo();
            }
        };
        APP.FM = common.createFileManager(fmConfig);
        var accepted = ".gif,.jpg,.jpeg,.png";
        var data = {
            FM: APP.FM,
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
        var $upButton = common.createButton('upload', false, data);
        $upButton.text(Messages.profile_upload);
        $upButton.prepend($('<span>', {'class': 'fa fa-upload'}));
        $block.append($upButton);
    };

    var addDescription = function ($container) {
        var $block = $('<div>', {id: DESCRIPTION_ID}).appendTo($container);

        if (APP.readOnly) {
            if (!(APP.lm.proxy.description || "").trim()) { return void $block.hide(); }
            var $div = $('<div>', {'class': 'cp-app-profile-description-rendered'}).appendTo($block);
            var val = Marked(APP.lm.proxy.description);
            $div.html(val);
            return;
        }
        $('<h3>').text(Messages.profile_description).insertBefore($block);

        var $ok = $('<span>', {
            'class': 'cp-app-profile-description-ok fa fa-check',
            title: Messages.saved
        }).appendTo($block);
        var $spinner = $('<span>', {
            'class': 'cp-app-profile-description-spin fa fa-spinner fa-pulse'
        }).appendTo($block);

        var $textarea = $('<textarea>').val(APP.lm.proxy.description || '');
        $block.append($textarea);
        var editor = APP.editor = CodeMirror.fromTextArea($textarea[0], {
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine : true,
            mode: "markdown",
        });

        var markdownTb = common.createMarkdownToolbar(editor);
        $block.prepend(markdownTb.toolbar);

        var onLocal = function () {
            $ok.hide();
            $spinner.show();
            var val = editor.getValue();
            APP.lm.proxy.description = val;
            Realtime.whenRealtimeSyncs(APP.lm.realtime, function () {
                $ok.show();
                $spinner.hide();
            });
        };

        editor.on('change', onLocal);
    };

    var addPublicKey = function ($container) {
        var $block = $('<div>', {id: PUBKEY_ID});
        $container.append($block);
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'}).appendTo(APP.$leftside);
        var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
        $category.append($('<span>', {'class': 'fa fa-user'}));
        $category.addClass('cp-leftside-active');
        $category.append(Messages.profileButton);
    };

    var onReady = function () {
        APP.$container.find('#'+CREATE_ID).remove();

        if (!APP.initialized) {
            var $header = $('<div>', {id: HEADER_ID}).appendTo(APP.$rightside);
            addAvatar($header);
            var $rightside = $('<div>', {id: HEADER_RIGHT_ID}).appendTo($header);
            addDisplayName($rightside);
            addLink($rightside);
            addDescription(APP.$rightside);
            addViewButton(APP.$rightside);
            addPublicKey(APP.$rightside);
            APP.initialized = true;
            createLeftside();
        }

        UI.removeLoadingScreen();
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.profileButton,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$container = $('#cp-sidebarlayout-container');
        APP.$toolbar = $('#cp-toolbar');
        APP.$leftside = $('<div>', {id: 'cp-sidebarlayout-leftside'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'cp-sidebarlayout-rightside'}).appendTo(APP.$container);
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        APP.origin = privateData.origin;
        APP.readOnly = privateData.readOnly;

        // If not logged in, you can only view other users's profile
        if (!privateData.readOnly && !common.isLoggedIn()) {
            UI.removeLoadingScreen();

            var $p = $('<p>', {id: CREATE_ID}).append(Messages.profile_register);
            var $a = $('<a>', {
                href: APP.origin + '/register/'
            });
            $('<button>', {
                'class': 'btn btn-success',
            }).text(Messages.login_register).appendTo($a);
            $p.append($('<br>')).append($a);
            APP.$rightside.append($p);
            return;
        }

        var listmapConfig = {
            data: {},
            common: common,
            userName: 'profile',
            logLevel: 1
        };

        var lm = APP.lm = Listmap.create(listmapConfig);

        lm.proxy.on('ready', onReady);
    });
});
