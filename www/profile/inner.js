// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/api/config',
    'jquery',
    '/components/chainpad-crypto/crypto.js',
    'chainpad-listmap',
    '/common/toolbar.js',
    '/components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-realtime.js',
    '/common/clipboard.js',
    '/common/inner/common-mediatag.js',
    '/common/inner/badges.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/components/marked/marked.min.js',
    '/common/sframe-common-codemirror.js',
    'cm/lib/codemirror',

    'cm/mode/gfm/gfm',


    'css!/components/codemirror/lib/codemirror.css',
    'css!/components/codemirror/addon/dialog/dialog.css',
    'css!/components/codemirror/addon/fold/foldgutter.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'less!/profile/app-profile.less',
], function (
    ApiConfig,
    $,
    Crypto,
    Listmap,
    Toolbar,
    nThen,
    SFCommon,
    Util,
    Hash,
    UI,
    UIElements,
    Realtime,
    Clipboard,
    MT,
    Badges,
    h,
    Messages,
    AppConfig,
    Marked,
    SFCodeMirror,
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
    var BADGES_ID = "cp-app-profile-badges";
    var CREATE_ID = "cp-app-profile-create";
    var HEADER_ID = "cp-app-profile-header";
    var HEADER_RIGHT_ID = "cp-app-profile-rightside";
    var VIEW_PROFILE_BUTTON = 'cp-app-profile-viewprofile-button';
    var PROFILE_SECTION = "cp-app-profile-section";

    var common;
    var sFrameChan;

    var addViewButton = function ($container) {
        if (APP.readOnly) {
            return;
        }

        var hash = common.getMetadataMgr().getPrivateData().hashes.viewHash;
        var url = APP.origin + '/profile/#' + hash;

        var $blockView = $('<div>', {class: PROFILE_SECTION}).appendTo($container);
        var button = h('button.btn.' + VIEW_PROFILE_BUTTON, {
            'aria-labelledby': 'cp-profile-view-button'
        }, [
            h('span#cp-profile-view-button', Messages.profile_viewMyProfile)
        ]);
        $(button).click(function () {
            window.open(url, '_blank');
        }).appendTo($blockView);

        var $blockShare = $('<div>', {class: PROFILE_SECTION}).appendTo($container);
        var buttonS = h('button.btn.btn-primary.' + VIEW_PROFILE_BUTTON, {
            'aria-labelledby': 'cp-profile-share-button'
        }, [
            h('i.fa.fa-share-alt', { 'aria-hidden': 'true' }),
            h('span#cp-profile-share-button', Messages.shareButton)
        ]);
        $(buttonS).click(function () {
            Clipboard.copy(url, (err) => {
                if (!err) { UI.log(Messages.shareSuccess); }
            });
        }).appendTo($blockShare);
    };

    var addDisplayName = function ($container) {
        var $block = $('<div>', {'class': PROFILE_SECTION}).appendTo($container);
        APP.$name = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
    };
    var refreshName = function (data) {
        APP.$name.text(data.name || Messages.anonymous);
    };

    var addLink = function ($container) {
        var $block = $('<div>', {class: PROFILE_SECTION}).appendTo($container);

        APP.$link = $('<a>', {
            'class': LINK_ID,
            target: '_blank',
            rel: 'noreferrer noopener'
        }).appendTo($block).hide();

        APP.$link.click(function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            var href = $(this).attr('href').trim();
            if (!href) { return; }
            common.openUnsafeURL(href);
        });

        APP.$linkEdit = $();
        if (APP.readOnly) { return; }

        var button = h('button.btn', {
            title: Messages.clickToEdit
        }, Messages.profile_addLink);
        APP.$linkEdit = $(button);
        $block.append(button);
        var save = h('button.btn.btn-primary', { 'aria-labelledby': 'cp-save-link' }, Messages.settings_save);
        var text = h('input#cp-save-link');
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
            $(code).css('display', 'flex');
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
        var $block = $('<div>', {class: PROFILE_SECTION}).appendTo($container);
        APP.$friend = $(h('div.cp-app-profile-friend-container'));
        $block.append(APP.$friend);
    };
    var refreshFriendRequest = function (data) {
        if (!APP.$friend) { return; }

        var me = common.getMetadataMgr().getUserData().curvePublic;
        if (data.curvePublic === me) {
            APP.$friend.remove();
            return;
        }

        APP.$friend.html('');

        var module = common.makeUniversal('messenger');
        var name = Util.fixHTML(data.name) || Messages.anonymous;

        var friends = common.getMetadataMgr().getPrivateData().friends;
        // This is a friend: display the "friend" message and an "unfriend" button
        if (friends[data.curvePublic]) {
            // Add friend message
            APP.$friend.append(h('p.cp-app-profile-friend', [
                h('i.fa.fa-address-book', {'aria-hidden': 'true' }),
                Messages._getKey('isContact', [name])
            ]));
            if (!friends[data.curvePublic].notifications) { return; }
            // Add unfriend button
            var unfriendButton = h('button.btn.btn-primary.cp-app-profile-friend-request', {
                'aria-labelledby': 'cp-profile-unfriend-button'
            }, [
                h('i.fa.fa-user-times', {'aria-hidden': 'true' }), 
                h('span#cp-profile-unfriend-button', Messages.contacts_remove)
            ]);
            $(unfriendButton).click(function () {
                // Unfriend confirm
                var content = h('div', [
                    UI.setHTML(h('p'), Messages._getKey('contacts_confirmRemove', [name]))
                ]);
                UI.confirm(content, function (yes) {
                    if (!yes) { return; }
                    module.execCommand('REMOVE_FRIEND', data.curvePublic, function (e) {
                        if (e) { return void console.error(e); }
                    });
                });
            }).appendTo(APP.$friend);
            return;
        }

        var button = h('button.btn.btn-success.cp-app-profile-friend-request', [
            h('i.fa.fa-user-plus', {'aria-hidden': 'true'}),
        ]);
        var $button = $(button).appendTo(APP.$friend);

        // If this curve has sent us a friend request, we should not be able to sent it to them
        var friendRequests = common.getFriendRequests();
        if (friendRequests[data.curvePublic]) {
            $button.append(Messages._getKey('friendRequest_received', [name || Messages.anonymous]))
                .click(function () {
                UIElements.displayFriendRequestModal(common, friendRequests[data.curvePublic]);
            });
            return;
        }

        var addCancel = function () {
            var cancelButton = h('button.btn.btn-danger.cp-app-profile-friend-request', { 
                'aria-labelledby': 'cp-profile-cancel-button' 
            },[
                h('i.fa.fa-user-times', {'aria-hidden': 'true' }),
                h('span#cp-profile-cancel-button' , Messages.cancel)
            ]);
            $(cancelButton).click(function () {
                // Unfriend confirm
                var content = h('div', [
                    UI.setHTML(h('p'), Messages._getKey('contacts_confirmCancel', [name]))
                ]);
                UI.confirm(content, function (yes) {
                    if (!yes) { return; }
                    module.execCommand('CANCEL_FRIEND', {
                        curvePublic: data.curvePublic,
                        notifications: data.notifications
                    }, function (e) {
                        refreshFriendRequest(data);
                        if (e) { UI.warn(Messages.error); return void console.error(e); }
                    });
                });
            }).appendTo(APP.$friend);
        };

        // Pending friend (we've sent a friend request)
        var pendingFriends = APP.common.getPendingFriends(); // Friend requests sent
        if (pendingFriends[data.curvePublic]) {
            $button.attr('disabled', 'disabled').text(Messages.profile_friendRequestSent);
            addCancel();
            return;
        }
        // This is not a friend yet: we can send a friend request
        $button.text(Messages._getKey('userlist_addAsFriendTitle', [data.name || Messages.anonymous]))
            .click(function () {
                APP.common.sendFriendRequest({
                    curvePublic: data.curvePublic,
                    notifications: data.notifications
                }, function (err, obj) {
                    if (obj && obj.error) { return void UI.warn(Messages.error); }
                    //$button.attr('disabled', 'disabled').append(Messages.profile_friendRequestSent);
                });
            });
    };

    var addMuteButton = function ($container) {
        if (!APP.readOnly || !APP.common.isLoggedIn()) { return; }
        APP.$mute = $(h('div.cp-app-profile-mute-container.cp-app-profile-section'));
        $container.append(APP.$mute);
    };
    var refreshMute = function (data) {
        if (!APP.$mute) { return; }

        var me = common.getMetadataMgr().getUserData().curvePublic;
        if (data.curvePublic === me) {
            APP.$mute.remove();
            return;
        }

        // Add mute/unmute buttons
        var $mute = APP.$mute;
        var module = common.makeUniversal('messenger');
        module.execCommand('GET_MUTED_USERS', null, function (muted) {
            if (!muted || typeof(muted) !== "object") { return; }
            $mute.html('');
            var isMuted = muted[data.curvePublic];
            if (isMuted) {
                var unmuteButton = h('button.btn.btn-secondary.cp-app-profile-friend-request', { 
                    'aria-labelledby': 'cp-profile-unmute-button'
                }, [
                    h('i.fa.fa-bell', {'aria-hidden': 'true' }),
                    h('span#cp-profile-unmute-button', Messages.contacts_unmute || 'unmute')
                ]);
                $(unmuteButton).click(function () {
                    module.execCommand('UNMUTE_USER', data.curvePublic, function (e) {
                        if (e) { console.error(e); return void UI.warn(Messages.error); }
                        refreshMute(data);
                    });
                }).appendTo($mute);
                return;
            }
            var muteButton = h('button.btn.btn-danger-outline.cp-app-profile-friend-request', {
                 'aria-labelledby': 'cp-profile-mute-button'
                }, [
                    h('i.fa.fa-bell-slash', {'aria-hidden': 'true' }),
                    h('span#cp-profile-mute-button', Messages.contacts_mute || 'mute')
                ]);            
            $(muteButton).click(function () {
                module.execCommand('MUTE_USER', {
                    curvePublic: data.curvePublic,
                    name: Util.fixHTML(data.displayName || data.name),
                    avatar: data.avatar
                }, function (e) {
                    if (e) { console.error(e); return void UI.warn(Messages.error); }
                    refreshMute(data);
                });
            }).appendTo($mute);
            $(UI.setHTML(h('p'), Messages.contacts_muteInfo)).appendTo($mute);
        });
    };

    var displayAvatar = function (val) {
        var sframeChan = common.getSframeChannel();
        var $span = APP.$avatar;
        $span.empty();
        if (!val) {
            $('<img>', {
                src: '/customize/images/avatar.png',
                title: Messages.profile_defaultAlt,
                alt: Messages.profile_defaultAlt,
            }).appendTo($span);
            return;
        }
        common.displayAvatar($span, val);

        if (APP.readOnly) { return; }

        var $delButton = $('<button>', {
            'class': 'cp-app-profile-avatar-delete btn btn-danger fa fa-times',
            title: Messages.profile_remove_avatar
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

        var data = MT.addAvatar(common, function (ev, data) {
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
        });
        //upload profile photo button should be secondary
        var $upButton = common.createButton('upload', false, data);
        $upButton.removeClass('btn-primary').addClass('btn-secondary');
        $upButton.removeProp('title');
        $upButton.text(Messages.profile_upload);
        $upButton.prepend($('<i>', {'class': 'fa fa-upload', 'aria-hidden': 'true'}));
        $block.append($upButton);
    };
    var refreshAvatar = function (data) {
        displayAvatar(data.avatar);
    };

    const addBadges = $container => {
        var $block = $('<div>', {id: BADGES_ID, class:'cp-sidebarlayout-element'}).appendTo($container);
        APP.$badges = $(h('span')).appendTo($block);
    };
    const refreshBadges = (obj) => {
        if (!APP.$badges) { return; }
        const metadataMgr = APP.common.getMetadataMgr();
        const privateData = metadataMgr.getPrivateData();
        let args = {};
        if (!privateData.isOwnProfile) { args.edPublic = obj.edPublic; }
        APP.badge.execCommand('LIST_BADGES', args, data => {
            APP.$badges.empty();
            let spinner;
            APP.$badges.toggle(!!data.length);
            let all = data.map(str => {
                const i = Badges.render(str);
                const $i = $(i).attr('tabindex', 0);
                if (APP.readOnly) { return i; }
                const selected = obj?.badge === str;
                if (selected) { $i.addClass('cp-selected'); }
                Util.onClickEnter($i, () => {
                    let value = selected ? '' : str;
                    spinner.spin();
                    APP.module.execCommand('SET', {
                        key: 'badge',
                        value
                    }, function (data) {
                        spinner.hide();
                        APP.updateValues(data);
                    });
                });
                return i;
            });
            let content = h('div.cp-profile-badges', [
                h('span', Messages.profile_badges),
                h('div.cp-profile-badges-list', all)
            ]);
            APP.$badges.append(content);
            spinner = UI.makeSpinner(APP.$badges.find('> div'));
        });
    };

    var addDescription = function ($container) {
        var $block = $('<div>', {id: DESCRIPTION_ID, class: PROFILE_SECTION}).appendTo($container);

        APP.$description = $('<div>', {
            'id': 'cp-app-profile-description-info'
        }).appendTo($block);

        APP.$descriptionEdit = $();
        if (APP.readOnly) { return; }

        var button = h('button.btn.btn-secondary', {
            'aria-labelledby': 'cp-profile-add-description-button' 
            }, [
                h('i.fa.fa-pencil', {'aria-hidden': 'true' }),
                h('span#cp-profile-add-description-button', Messages.profile_addDescription)
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
        $(div).insertBefore(APP.$description);

        var cm = SFCodeMirror.create("gfm", CodeMirror, text);
        var editor = APP.editor = cm.editor;
        editor.setOption('lineNumbers', true);
        editor.setOption('lineWrapping', true);
        editor.setOption('styleActiveLine', true);
        editor.setOption('readOnly', false);
        cm.configureTheme(common, function () {});
        editor.setOption("extraKeys", {
            "Esc": function () {
                cm.getInputField().blur();
                $(save).focus();
            }
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
        var descriptionData = data.description || "";
        var val = Marked.parse(descriptionData);
        APP.$description.html(val);
        APP.$description.off('click');
        APP.$description.click(function (e) {
            if (!e.target) { return; }
            var $t = $(e.target);
            if ($t.is('a') || $t.parents('a').length) {
                e.preventDefault();
                var $a = $t.is('a') ? $t : $t.parents('a').first();
                var href = $a.attr('href');
                common.openUnsafeURL(href);
            }
        });
        APP.$descriptionEdit.find('span').text(val === "" ? Messages.profile_addDescription : Messages.profile_editDescription);
        if (!APP.editor) { return; }
        APP.editor.setValue(data.description || "");
        APP.editor.save();
    };

    var addPublicKey = function ($container) {
        if (!APP.readOnly) { return; }
        if (!Messages.profile_copyKey) { return; }

        var $div = $(h('div.cp-app-profile-section')).appendTo($container);
        APP.$edPublic = $('<button>', {
            'class': 'btn',
            'aria-labelledby': 'cp-profile-copy-key-button'
        }).append([
            h('i.fa.fa-key', {'aria-hidden': 'true' }),
            h('span#cp-profile-copy-key-button', Messages.profile_copyKey)
        ]).click(function () {
            if (!APP.getEdPublic) { return; }
            APP.getEdPublic();
        }).appendTo($div).hide();
    };
    var setPublicKeyButton = function (data) {
        if (!data.edPublic || APP.getEdPublic || !APP.readOnly) { return; }
        if (!Messages.profile_copyKey) { return; }
        APP.$edPublic.show();
        APP.getEdPublic = function () {
            var metadataMgr = APP.common.getMetadataMgr();
            var privateData = metadataMgr.getPrivateData();
            var url = Hash.getPublicSigningKeyString(privateData.origin, data.name, data.edPublic);
            Clipboard.copy(url, (err) => {
                if (!err) { UI.log(Messages.genericCopySuccess); }
            });
        };
    };

    var addCopyData = function ($container) {
        if (!APP.isModerator) { return; }
        var $block = $('<div>', {class:PROFILE_SECTION}).appendTo($container);
        APP.$copyData = $(h('button.btn.btn-secondary', { 
            'aria-labelledby': 'cp-profile-copy-data-button' 
        }, [   
            h('i.fa.fa-clipboard', {'aria-hidden': 'true' }), 
            h('span#cp-profile-copy-data-button', Messages.support_copyUserData)
        ])).click(function () {
            if (!APP.getCopyData) { return; }
            APP.getCopyData();
        }).appendTo($block).hide();
    };
    var setCopyDataButton = function (data) {
        if (!data.curvePublic) { return; }
        APP.getCopyData = function () {
            if (!APP.isModerator) { return void UI.warn(Messages.error); }
            Clipboard.copy(JSON.stringify(data), (err) => {
                if (!err) { UI.log(Messages.genericCopySuccess); }
            });
        };
        if (APP.$copyData) { APP.$copyData.show(); }
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'cp-sidebarlayout-categories'}).appendTo(APP.$leftside);
        var $category = $('<div>', {'class': 'cp-sidebarlayout-category'}).appendTo($categories);
        $category.append($('<span>', {'class': 'fa fa-user'}));
        $category.addClass('cp-leftside-active');
        $category.text(Messages.profileButton);
    };

    var init = function () {
        APP.$container.find('#'+CREATE_ID).remove();

        if (!APP.initialized) {
            var $header = $('<div>', {id: HEADER_ID, class:'cp-sidebarlayout-element'}).appendTo(APP.$rightside);
            addAvatar($header);
            var $rightside = $('<div>', {id: HEADER_RIGHT_ID}).appendTo($header);
            addDisplayName($rightside);
            addLink($rightside);
            addFriendRequest($rightside);
            addMuteButton($rightside);
            //addBadges($rightside); // XXX 2025.6
            addPublicKey($rightside);
            addCopyData($rightside);
            addViewButton($rightside);
            addDescription($rightside);
            APP.initialized = true;
            createLeftside();
        }
    };

    var updateValues = APP.updateValues = function (data) {
        // Only update avatar if it has changed
        if (!APP._lastUpdate || APP._lastUpdate.avatar !== data.avatar) {
            refreshAvatar(data);
        }
        // Always update other profile information
        refreshName(data);
        refreshLink(data);
        refreshDescription(data);
        refreshBadges(data);
        refreshFriendRequest(data);
        refreshMute(data);
        setPublicKeyButton(data);
        setCopyDataButton(data);
        APP._lastUpdate = data;
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.profileButton,
            metadataMgr: common.getMetadataMgr(),
            skipLink: '#cp-sidebarlayout-container'
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

        let edPublic = privateData.edPublic;
        APP.isModerator = ApiConfig.moderatorKeys && ApiConfig.moderatorKeys.includes(edPublic);

        common.setTabTitle(Messages.profileButton);
        // If not logged in, you can only view other users's profile
        if (!privateData.readOnly && !common.isLoggedIn()) {
            UI.removeLoadingScreen();

            var $p = $('<p>', {id: CREATE_ID}).text(Messages.profile_register);
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

        APP.badge = common.makeUniversal('badge', {
            onEvent: onEvent
        });
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

        if (!common.isLoggedIn()) {
            var login = h('button.cp-corner-primary', Messages.login_login);
            var register = h('button.cp-corner-primary', Messages.login_register);
            var cancel = h('button.cp-corner-cancel', Messages.cancel);
            var actions = h('div', [cancel, register, login]);
            var modal = UI.cornerPopup(Messages.profile_login, actions, '', {alt: true});
            $(register).click(function () {
                common.setLoginRedirect('register');
                modal.delete();
            });
            $(login).click(function () {
                common.setLoginRedirect('login');
                modal.delete();
            });
            $(cancel).click(function () {
                modal.delete();
            });
        }

        var listmapConfig = {
            data: {},
            common: common,
            userName: 'profile',
            logLevel: 1
        };

        var lm = APP.lm = Listmap.create(listmapConfig);

        var onCorruptedCache = function () {
            var sframeChan = common.getSframeChannel();
            sframeChan.event("EV_PROFILE_CORRUPTED_CACHE");
        };

        init();
        lm.proxy.on('ready', function () {
            if (JSON.stringify(lm.proxy) === '{}') {
                return void onCorruptedCache();
            }
            // Force avatar update on initial load
            APP._lastUpdate = null;
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
