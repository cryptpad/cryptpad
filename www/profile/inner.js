define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/common/toolbar3.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-util.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-realtime.js',
    '/common/clipboard.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/bower_components/marked/marked.min.js',
    'cm/lib/codemirror',

    'cm/mode/markdown/markdown',

    'css!/bower_components/codemirror/lib/codemirror.css',
    'css!/bower_components/codemirror/addon/dialog/dialog.css',
    'css!/bower_components/codemirror/addon/fold/foldgutter.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/profile/app-profile.less',
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
    UIElements,
    Realtime,
    Clipboard,
    h,
    Messages,
    AppConfig,
    Marked,
    CodeMirror
    )
{
    var APP = window.APP = {
        _onRefresh: []
    };

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
    var CREATE_ID = "cp-app-profile-create";
    var HEADER_ID = "cp-app-profile-header";
    var HEADER_RIGHT_ID = "cp-app-profile-rightside";
    var CREATE_INVITE_BUTTON = 'cp-app-profile-invite-button'; /* jshint ignore: line */
    var VIEW_PROFILE_BUTTON = 'cp-app-profile-viewprofile-button';

    var common;
    var sFrameChan;

    var addViewButton = function ($container) {
        if (APP.readOnly) {
            return;
        }

        var hash = common.getMetadataMgr().getPrivateData().hashes.viewHash;
        var url = APP.origin + '/profile/#' + hash;

        $('<button>', {
            'class': 'btn btn-success '+VIEW_PROFILE_BUTTON,
        }).text(Messages.profile_viewMyProfile).click(function () {
            window.open(url, '_blank');
        }).appendTo($container);

        $('<button>', {
            'class': 'btn btn-success '+VIEW_PROFILE_BUTTON,
        }).append(h('i.fa.fa-shhare-alt'))
          .append(h('span', Messages.shareButton))
          .click(function () {
            var success = Clipboard.copy(url);
            if (success) { UI.log(Messages.shareSuccess); }
        }).appendTo($container);
    };

    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);
        APP.$name = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
    };
    var refreshName = function (data) {
        APP.$name.text(data.name || Messages.anonymous);
    };

    var addLink = function ($container) {
        var $block = $('<div>', {id: LINK_ID}).appendTo($container);

        APP.$link = $('<a>', {
            'class': LINK_ID,
            target: '_blank',
            rel: 'noreferrer noopener'
        }).appendTo($block).hide();

        APP.$linkEdit = $();
        if (APP.readOnly) { return; }

        var button = h('button.btn.btn-primary', {
            title: Messages.clickToEdit
        }, Messages.profile_addLink);
        APP.$linkEdit = $(button);
        $block.append(button);
        var save = h('button.btn.btn-success', Messages.settings_save);
        var text = h('input');
        var code = h('div.cp-app-profile-link-code', [
            text,
            save
        ]);
        var div = h('div.cp-app-profile-link-edit', [
            code
        ]);
        $block.append(div);
        $(button).click(function () {
            $(text).val(APP.$link.attr('href'));
            $(code).show();
            APP.editor.refresh();
            $(button).hide();
        });
        $(save).click(function () {
            $(save).hide();
            APP.module.execCommand('SET', {
                key: 'url',
                value: $(text).val()
            }, function (data) {
                APP.updateValues(data);
                $(code).hide();
                $(button).show();
                $(save).show();
            });
        });
    };
    var refreshLink = function (data) {
        APP.$linkEdit.removeClass('fa-pencil').removeClass('fa');
        if (!data.url) {
            APP.$linkEdit.text(Messages.profile_addLink);
            return void APP.$link.hide();
        }
        APP.$link.attr('href', data.url).text(data.url).show();
        APP.$linkEdit.text('').addClass('fa fa-pencil');
    };

    var addFriendRequest = function ($container) {
        if (!APP.readOnly || !APP.common.isLoggedIn()) { return; }
        APP.$friend = $('<button>', {
            'class': 'btn btn-success cp-app-profile-friend-request',
        });
        APP.$friend = $(h('div.cp-app-profile-friend-container'));
        $container.append(APP.$friend);
    };
    var refreshFriendRequest = function (data) {
        if (!APP.$friend) { return; }

        var me = common.getMetadataMgr().getUserData().curvePublic;
        if (data.curvePublic === me) {
            APP.$friend.remove();
            return;
        }

        APP.$friend.html('');

        var friends = common.getMetadataMgr().getPrivateData().friends;
        if (friends[data.curvePublic]) {
            APP.$friend.append(h('p.cp-app-profile-friend', Messages._getKey('profile_friend', [data.name || Messages.anonymous])));
            return;
        }

        var $button = $('<button>', {
            'class': 'btn btn-success cp-app-profile-friend-request',
        }).appendTo(APP.$friend);

        // If this curve has sent us a friend request, we should not be able to sent it to them
        var friendRequests = common.getFriendRequests();
        if (friendRequests[data.curvePublic]) {
            $button.html(Messages._getKey('friendRequest_received', [data.name || Messages.anonymous]))
                .click(function () {
                UIElements.displayFriendRequestModal(common, friendRequests[data.curvePublic]);
            });
            return;
        }

        var pendingFriends = APP.common.getPendingFriends(); // Friend requests sent
        if (pendingFriends[data.curvePublic]) {
            $button.attr('disabled', 'disabled').text(Messages.profile_friendRequestSent);
            return;
        }
        $button.text(Messages._getKey('userlist_addAsFriendTitle', [data.name || Messages.anonymous]))
            .click(function () {
                APP.common.sendFriendRequest({
                    curvePublic: data.curvePublic,
                    notifications: data.notifications
                }, function () {
                    $button.attr('disabled', 'disabled').text(Messages.profile_friendRequestSent);
                });
            });
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
    var displayAvatar = function (val) {
        var sframeChan = common.getSframeChannel();
        var $span = APP.$avatar;
        $span.html('');
        if (!val) {
            $('<img>', {
                src: '/customize/images/avatar.png',
                title: Messages.profile_avatar,
                alt: 'Avatar'
            }).appendTo($span);
            return;
        }
        common.displayAvatar($span, val);

        if (APP.readOnly) { return; }

        var $delButton = $('<button>', {
            'class': 'cp-app-profile-avatar-delete btn btn-danger fa fa-times',
            title: Messages.fc_delete
        });
        $span.append($delButton);
        $delButton.click(function () {
            var old = common.getMetadataMgr().getUserData().avatar;
            APP.module.execCommand("SET", {
                key: 'avatar',
                value: ""
            }, function () {
                sframeChan.query("Q_PROFILE_AVATAR_REMOVE", old, function (err, err2) {
                    if (err || err2) { return void UI.log(err || err2); }
                    displayAvatar();
                });
            });
        });
    };
    var addAvatar = function ($container) {
        var $block = $('<div>', {id: AVATAR_ID}).appendTo($container);
        APP.$avatar = $('<span>').appendTo($block);
        var sframeChan = common.getSframeChannel();
        displayAvatar();
        if (APP.readOnly) { return; }

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                var old = common.getMetadataMgr().getUserData().avatar;
                var todo = function () {
                    APP.module.execCommand("SET", {
                        key: 'avatar',
                        value: data.url
                    }, function () {
                        sframeChan.query("Q_PROFILE_AVATAR_ADD", data.url, function (err, err2) {
                            if (err || err2) { return void UI.log(err || err2); }
                            displayAvatar(data.url);
                        });
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
    var refreshAvatar = function (data) {
        displayAvatar(data.avatar);
    };

    var addDescription = function ($container) {
        var $block = $('<div>', {id: DESCRIPTION_ID}).appendTo($container);

        APP.$description = $('<div>', {'class': 'cp-app-profile-description-rendered'}).appendTo($block);
        APP.$descriptionEdit = $();
        if (APP.readOnly) { return; }

        var button = h('button.btn.btn-primary', [
            h('i.fa.fa-pencil'),
            h('span', Messages.profile_addDescription)
        ]);
        APP.$descriptionEdit = $(button);
        var save = h('button.btn.btn-primary', Messages.settings_save);
        var text = h('textarea');
        var code = h('div.cp-app-profile-description-code', [
            text,
            h('br'),
            save
        ]);
        var div = h('div.cp-app-profile-description-edit', [
            h('p.cp-app-profile-info', Messages.profile_info),
            button,
            code
        ]);
        $block.append(div);

        var editor = APP.editor = CodeMirror.fromTextArea(text, {
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine : true,
            mode: "markdown",
        });

        var markdownTb = common.createMarkdownToolbar(editor);
        $(code).prepend(markdownTb.toolbar);
        $(markdownTb.toolbar).show();

        $(button).click(function () {
            $(code).show();
            APP.editor.refresh();
            $(button).hide();
        });
        $(save).click(function () {
            $(save).hide();
            APP.module.execCommand('SET', {
                key: 'description',
                value: editor.getValue()
            }, function (data) {
                APP.updateValues(data);
                $(code).hide();
                $(button).show();
                $(save).show();
            });
        });
    };
    var refreshDescription = function (data) {
        var val = Marked(data.description || "");
        APP.$description.html(val);
        APP.$descriptionEdit.find('span').text(val === "" ? Messages.profile_addDescription : Messages.profile_editDescription);
        if (!APP.editor) { return; }
        APP.editor.setValue(data.description || "");
        APP.editor.save();
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'}).appendTo(APP.$leftside);
        var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
        $category.append($('<span>', {'class': 'fa fa-user'}));
        $category.addClass('cp-leftside-active');
        $category.append(Messages.profileButton);
    };

    var init = function () {
        APP.$container.find('#'+CREATE_ID).remove();

        if (!APP.initialized) {
            var $header = $('<div>', {id: HEADER_ID}).appendTo(APP.$rightside);
            addAvatar($header);
            var $rightside = $('<div>', {id: HEADER_RIGHT_ID}).appendTo($header);
            addDisplayName($rightside);
            addLink($rightside);
            addFriendRequest($rightside);
            addDescription(APP.$rightside);
            addViewButton(APP.$rightside);
            APP.initialized = true;
            createLeftside();
        }
    };

    var updateValues = APP.updateValues = function (data) {
        refreshAvatar(data);
        refreshName(data);
        refreshLink(data);
        refreshDescription(data);
        refreshFriendRequest(data);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
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

    var onEvent = function (obj) {
        var ev = obj.ev;
        var data = obj.data;
        if (ev === 'UPDATE') {
            console.log('Update');
            updateValues(data);
            return;
        }
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        if (AppConfig.disableProfile) {
            common.gotoURL('/drive/');
            return;
        }
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

        if (privateData.isOwnProfile) {

            APP.module = common.makeUniversal('profile', {
                onEvent: onEvent
            });
            var execCommand = APP.module.execCommand;

            init();

            console.log('POST SUBSCRIBE');
            execCommand('SUBSCRIBE', null, function (obj) {
                updateValues(obj);
                UI.removeLoadingScreen();
            });
            return;
        }

        var listmapConfig = {
            data: {},
            common: common,
            userName: 'profile',
            logLevel: 1
        };

        var lm = APP.lm = Listmap.create(listmapConfig);

        init();
        lm.proxy.on('ready', function () {
            updateValues(lm.proxy);
            UI.removeLoadingScreen();
            common.mailbox.subscribe(["notifications"], {
                onMessage: function () {
                    refreshFriendRequest(lm.proxy);
                },
                onViewed: function () {
                    refreshFriendRequest(lm.proxy);
                },
            });
        }).on('change', [], function () {
            updateValues(lm.proxy);
        });
        metadataMgr.onChange(function () {
            updateValues(lm.proxy);
        });
    });
});
