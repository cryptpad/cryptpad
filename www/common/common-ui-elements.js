// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/api/config',
    '/api/broadcast',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-language.js',
    '/common/common-interface.js',
    '/common/common-constants.js',
    '/common/common-feedback.js',
    '/common/hyperscript.js',
    '/common/clipboard.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/customize/pages.js',
    '/components/nthen/index.js',
    '/common/inner/invitation.js',
    '/common/visible.js',
    '/common/pad-types.js',

    'css!/customize/fonts/cptools/style.css',
], function ($, Config, Broadcast, Util, Hash, Language, UI, Constants, Feedback, h, Clipboard,
             Messages, AppConfig, Pages, NThen, InviteInner, Visible, PadTypes) {
    var UIElements = {};
    var urlArgs = Config.requireConf.urlArgs;

    UIElements.getSvgLogo = function () {
        var svg = (function(){/*
<svg width="45" height="50" version="1.1" viewBox="0 0 11.906 13.229" xmlns="http://www.w3.org/2000/svg">
 <path id="background" d="m1.0914 0.43939h6.464l3.2642 3.0329v3.6261c0 3.8106-3.1186 4.6934-4.8229 5.5936-1.8663-0.85843-4.7759-1.7955-4.8229-5.5936z" style="stroke-width:0"/>
 <path id="squares" transform="matrix(.26458 0 0 .26458 -5.37e-5 0)" d="m4.125 1.6582 0.30469 21.82h18.242l0.001953-21.82h-18.549zm18.555 21.822 0.001953 24.188c7.0591-3.2362 18.032-9.399 18.232-23.754l0.007813-0.43359h-18.242z" style="fill-opacity:.4;stroke-width:.55042"/>
 <path id="outline" transform="matrix(.26458 0 0 .26458 -5.37e-5 0)" d="m2.6504 0.19922 0.021484 1.4766 0.31055 25.172c0.093479 7.5478 3.1451 12.529 7.0488 15.826 3.9038 3.297 8.5769 5.029 12.025 6.6152l0.65039 0.30274 0.63477-0.33984c3.0702-1.6216 7.7769-3.3403 11.773-6.5996 3.9966-3.2593 7.2344-8.2277 7.2344-15.826v-14.336l-13.221-12.291zm2.9453 2.916h20.381v12.379h13.457v11.332c0 6.8038-2.6491 10.706-6.1562 13.566-3.2982 2.6898-7.3426 4.2502-10.623 5.9141-3.4806-1.5714-7.5236-3.1369-10.74-5.8535-3.4025-2.8737-5.9391-6.8355-6.0234-13.643zm23.289 0.83789 9.2871 8.6328h-9.2871zm-6.5176 14.223a4.9632 4.9632 0 0 0-4.8496 4.9629 4.9632 4.9632 0 0 0 2.8184 4.4746l-1.7324 9.1504h7.7598l-1.7324-9.1523a4.9632 4.9632 0 0 0 2.8145-4.4727 4.9632 4.9632 0 0 0-4.9629-4.9629 4.9632 4.9632 0 0 0-0.11523 0z" style="color-rendering:auto;color:#000000;dominant-baseline:auto;font-feature-settings:normal;font-variant-alternates:normal;font-variant-caps:normal;font-variant-east-asian:normal;font-variant-ligatures:normal;font-variant-numeric:normal;font-variant-position:normal;font-variation-settings:normal;image-rendering:auto;inline-size:0;isolation:auto;mix-blend-mode:normal;shape-margin:0;shape-padding:0;shape-rendering:auto;solid-color:#000000;stop-color:#000000;text-decoration-color:#000000;text-decoration-line:none;text-decoration-style:solid;text-indent:0;text-orientation:mixed;text-transform:none;white-space:normal"/>
</svg>
*/}).toString().slice(14,-3);
        return svg;
    };

    UIElements.prettySize = function (bytes) {
        var unit = Util.magnitudeOfBytes(bytes);
        if (unit === 'GB') {
            return Messages._getKey('formattedGB', [ Util.bytesToGigabytes(bytes)]);
        } else if (unit === 'MB') {
            return Messages._getKey('formattedMB', [ Util.bytesToMegabytes(bytes)]);
        } else {
            return Messages._getKey('formattedKB', [ Util.bytesToKilobytes(bytes)]);
        }
    };

    UIElements.updateTags = function (common, hrefs) {
        var existing, tags;
        var allTags = {};
        if (!hrefs || typeof (hrefs) === "string") {
            hrefs = [hrefs];
        }
        NThen(function(waitFor) {
            common.getSframeChannel().query("Q_GET_ALL_TAGS", null, waitFor(function(err, res) {
                if (err || res.error) { return void console.error(err || res.error); }
                existing = Object.keys(res.tags).sort();
            }));
        }).nThen(function (waitFor) {
            hrefs.forEach(function (href) {
                common.getPadAttribute('tags', waitFor(function (err, res) {
                    if (err) {
                        if (err === 'NO_ENTRY') {
                            UI.alert(Messages.tags_noentry);
                        }
                        waitFor.abort();
                        return void console.error(err);
                    }
                    allTags[href] = res || [];

                    if (tags) {
                        // Intersect with tags from previous pads
                        tags = (res || []).filter(function (tag) {
                            return tags.indexOf(tag) !== -1;
                        });
                    } else {
                        tags = res || [];
                    }
                }), href);
            });
        }).nThen(function () {
            UI.dialog.tagPrompt(tags, existing, function (newTags) {
                if (!Array.isArray(newTags)) { return; }
                var added = [];
                var removed = [];
                newTags.forEach(function (tag) {
                    if (tags.indexOf(tag) === -1) {
                        added.push(tag);
                    }
                });
                tags.forEach(function (tag) {
                    if (newTags.indexOf(tag) === -1) {
                        removed.push(tag);
                    }
                });
                var update = function (oldTags) {
                    Array.prototype.push.apply(oldTags, added);
                    removed.forEach(function (tag) {
                        var idx = oldTags.indexOf(tag);
                        oldTags.splice(idx, 1);
                    });
                };

                hrefs.forEach(function (href) {
                    var oldTags = allTags[href] || [];
                    update(oldTags);
                    common.setPadAttribute('tags', Util.deduplicateString(oldTags), null, href);
                });
            });
        });
    };

    var dcAlert;
    UIElements.disconnectAlert = function () {
        if (dcAlert && $(dcAlert.element).length) { return; }
        dcAlert = UI.alert(Messages.common_connectionLost, undefined, true);
    };
    UIElements.reconnectAlert = function () {
        if (!dcAlert) { return; }
        if (!dcAlert.delete) {
            dcAlert = undefined;
            return;
        }
        dcAlert.delete();
        dcAlert = undefined;
    };

    var importContent = UIElements.importContent = function (type, f, cfg) {
        return function (_file) {
            var todo = function (file) {
                var reader = new FileReader();
                var parsed = file && file.name && /.+\.([^.]+)$/.exec(file.name);
                var ext = parsed && parsed[1];
                reader.onload = function (e) { f(e.target.result, file, ext); };
                if (cfg && cfg.binary && cfg.binary.indexOf(ext) !== -1) {
                   reader.readAsArrayBuffer(file, type);
                } else {
                   reader.readAsText(file, type);
                }
            };

            if (_file) { return void todo(_file); }

            var $files = $('<input>', {type:"file"});
            if (cfg && cfg.accept) {
                $files.attr('accept', cfg.accept);
            }
            $files.click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                todo(file);
            });
        };
    };

    UIElements.getUserGrid = function (label, config, onSelect) {
        var common = config.common;
        var users = config.data;
        if (!users) { return; }

        var icons = Object.keys(users).map(function (key, i) {
            var data = users[key];
            var name = UI.getDisplayName(data.displayName || data.name);
            var avatar = h('span.cp-usergrid-avatar.cp-avatar', {
                'aria-hidden': true,
            });
            common.displayAvatar($(avatar), data.avatar, name, Util.noop, data.uid);
            var removeBtn, el;
            if (config.remove) {
                removeBtn = h('span.fa.fa-times');
                $(removeBtn).attr('tabindex', '0');
                $(removeBtn).on('click keydown', function(event) {
                    if (event.type === 'click' || (event.type === 'keydown' && event.key === 'Enter')) {
                        event.preventDefault();
                        config.remove(el);
                    }
                });
            }

            el = h('div.cp-usergrid-user'+(data.selected?'.cp-selected':'')+(config.large?'.large':''), {
                'data-ed': data.edPublic,
                'data-teamid': data.teamId,
                'data-curve': data.curvePublic || '',
                'data-name': name.toLowerCase(),
                'data-order': i,
                'tabindex': config.noSelect ? '-1' : '0',
                style: 'order:'+i+';'
            },[
                avatar,
                h('span.cp-usergrid-user-name', name),
                data.notRemovable ? undefined : removeBtn
            ]);
            return el;
        }).filter(function (x) { return x; });

        var noOthers = icons.length === 0 ? '.cp-usergrid-empty' : '';
        var classes = noOthers + (config.large?'.large':'') + (config.list?'.list':'');

        var inputFilter = h('input', {
            placeholder: Messages.share_filterFriend
        });

        var div = h('div.cp-usergrid-container' + classes, [
            label ? h('label', label) : undefined,
            h('div.cp-usergrid-filter', (config.noFilter || config.noSelect) ? undefined : [
                inputFilter
            ]),
        ]);
        var $div = $(div);

        // Hide friends when they are filtered using the text input
        var redraw = function () {
            var name = $(inputFilter).val().trim().replace(/"/g, '').toLowerCase();
            $div.find('.cp-usergrid-user').show();
            if (name) {
                $div.find('.cp-usergrid-user:not(.cp-selected):not([data-name*="'+name+'"])').hide();
            }
        };
        $(inputFilter).on('keydown keyup change', redraw);

        $(div).append(h('div.cp-usergrid-grid', icons));
        if (!config.noSelect) {
            $div.on('click', '.cp-usergrid-user', function () {
                var sel = $(this).hasClass('cp-selected');
                if (!sel) {
                    $(this).addClass('cp-selected');
                } else {
                    var order = $(this).attr('data-order');
                    order = order ? 'order:'+order : '';
                    $(this).removeClass('cp-selected').attr('style', order);
                }
                onSelect();
            });
            $div.on('keydown', '.cp-usergrid-user', function (e) {
                if (e.which === 13) {
                    e.preventDefault();
                    e.stopPropagation();
                    $(this).trigger('click');
                }
            });
        }

        return {
            icons: icons,
            div: div
        };
    };


    UIElements.noContactsMessage = function (common) {
        var metadataMgr = common.getMetadataMgr();
        var data = metadataMgr.getUserData();
        var origin = metadataMgr.getPrivateData().origin;
        if (common.isLoggedIn()) {
            return {
                content: h('p', Messages.share_noContactsLoggedIn),
                buttons: [{
                    className: 'secondary',
                    name: Messages.share_copyProfileLink,
                    onClick: function () {
                        var profile = data.profile ? (origin + '/profile/#' + data.profile) : '';
                        Clipboard.copy(profile, (err) => {
                            if (!err) { UI.log(Messages.shareSuccess); }
                        });
                    },
                    keys: [13]
                  }]
            };
        } else {
            return {
                content: h('p', Messages.share_noContactsNotLoggedIn),
                buttons: [{
                    className: 'secondary',
                    name: Messages.login_register,
                    onClick: function () {
                        common.setLoginRedirect('register');
                    }
                  }, {
                    className: 'secondary',
                    name: Messages.login_login,
                    onClick: function () {
                        common.setLoginRedirect('login');
                    }
                  }]
            };
        }
    };

    UIElements.createInviteTeamModal = function (config) {
        var common = config.common;
        var hasFriends = Object.keys(config.friends || {}).length !== 0;

        var privateData = common.getMetadataMgr().getPrivateData();
        var team = privateData.teams[config.teamId];
        if (!team) { return void UI.warn(Messages.error); }

        var origin = privateData.origin;

        var module = config.module || common.makeUniversal('team');

        // Invite contacts
        var $div;
        var refreshButton = function () {
            if (!$div) { return; }
            var $modal = $div.closest('.alertify');
            var $nav = $modal.find('nav');
            var $btn = $nav.find('button.primary');
            var selected = $div.find('.cp-usergrid-user.cp-selected').length;
            if (selected) {
                $btn.prop('disabled', '');
            } else {
                $btn.prop('disabled', 'disabled');
            }
        };
        var getContacts = function () {
            var list = UIElements.getUserGrid(Messages.team_pickFriends, {
                common: common,
                data: config.friends,
                large: true
            }, refreshButton);
            var div = h('div.contains-nav');
            var $div = $(div);
            $div.append(list.div);
            var contactsButtons = [{
                className: 'primary',
                name: Messages.team_inviteModalButton,
                onClick: function () {
                    var $sel = $div.find('.cp-usergrid-user.cp-selected');
                    var sel = $sel.toArray();
                    if (!sel.length) { return; }

                    sel.forEach(function (el) {
                        var curve = $(el).attr('data-curve');
                        module.execCommand('INVITE_TO_TEAM', {
                            teamId: config.teamId,
                            user: config.friends[curve]
                        }, function (obj) {
                            if (obj && obj.error) {
                                console.error(obj.error);
                                return UI.warn(Messages.error);
                            }
                        });
                    });
                },
                keys: [13]
            }];

            return {
                content: div,
                buttons: contactsButtons
            };
        };
        var friendsObject = hasFriends ? getContacts() : UIElements.noContactsMessage(common);
        var friendsList = friendsObject.content;
        var contactsButtons = friendsObject.buttons;
        contactsButtons.unshift({
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        });

        var contactsContent = h('div.cp-share-modal', [
            friendsList
        ]);

        var frameContacts = UI.dialog.customModal(contactsContent, {
            buttons: contactsButtons,
        });

        var linkName, linkPassword, linkMessage, linkError;
        var linkForm, linkSpin, linkResult, linkUses, linkRole;
        var linkWarning;
        // Invite from link
        var dismissButton = h('span.fa.fa-times');

        var roleViewer = UI.createRadio('cp-team-role', 'cp-team-role-viewer',
                Messages.team_viewers, true, {
                    input: { value: 'VIEWER' },
                });
        var roleMember = UI.createRadio('cp-team-role', 'cp-team-role-member',
                Messages.team_members, false, {
                    input: { value: 'MEMBER' },
                });


        var linkContent = h('div.cp-share-modal', [
            h('p', Messages.team_inviteLinkTitle ),
            linkError = h('div.alert.alert-danger.cp-teams-invite-alert', {style : 'display: none;'}),
            linkForm = h('div.cp-teams-invite-form', [
                // autofill: 'off' was insufficient
                // adding these two fake inputs confuses firefox and prevents unwanted form autofill
                h('input', { type: 'text', style: 'display: none'}),
                h('input', { type: 'password', style: 'display: none'}),

                linkName = h('input', {
                    placeholder:  Messages.team_inviteLinkTempName
                }),
                h('br'),
                h('div.cp-teams-invite-block', [
                    h('span', Messages.team_inviteLinkSetPassword),
                    h('a.cp-teams-help.fa.fa-question-circle', {
                        href: Pages.localizeDocsLink('https://docs.cryptpad.org/en/user_guide/security.html#passwords-for-documents-and-folders'),
                        target: "_blank",
                        'data-tippy-placement': "right"
                    })
                ]),
                linkPassword = UI.passwordInput({
                    id: 'cp-teams-invite-password',
                    placeholder: Messages.login_password
                }),
                h('div.cp-teams-invite-block',
                    h('span', Messages.team_inviteLinkNote)
                ),
                linkMessage = h('textarea.cp-teams-invite-message', {
                    placeholder: Messages.team_inviteLinkNoteMsg,
                    rows: 3
                }),
                linkRole = h('div.cp-teams-invite-block.cp-teams-invite-role',
                    h('span', Messages.team_inviteRole),
                    roleViewer,
                    roleMember
                ),
                h('div.cp-teams-invite-block.cp-teams-invite-uses',
                    linkUses = h('input', {
                        type: 'number',
                        min: 0,
                        max: 999,
                        value: 1
                    }),
                    h('span', Messages.team_inviteUses)
                ),
            ]),
            linkSpin = h('div.cp-teams-invite-spinner', {
                style: 'display: none;'
            }, [
                h('i.fa.fa-spinner.fa-spin'),
                h('span', Messages.team_inviteLinkLoading)
            ]),
            linkResult = h('div', {
                style: 'display: none;'
            }, h('textarea', {
                readonly: 'readonly'
            })),
            linkWarning = h('div.cp-teams-invite-alert.alert.alert-warning.dismissable', {
                style: "display: none;"
            }, [
                h('span.cp-inline-alert-text', Messages.team_inviteLinkWarning),
                dismissButton
            ])
        ]);
        $(linkUses).on('change keyup', function(e) {
            if (e.target.value === '') { e.target.value = 0; }
        });
        $(linkMessage).keydown(function (e) {
            if (e.which === 13) { e.stopPropagation(); }
        });
        var localStore = window.cryptpadStore;
        localStore.get('hide-alert-teamInvite', function (val) {
            if (val === '1') { return; }
            $(linkWarning).css('display', 'flex');

            $(dismissButton).on('click', function () {
                localStore.put('hide-alert-teamInvite', '1');
                $(linkWarning).remove();
            });
        });
        var $linkContent = $(linkContent);
        var href;
        var process = function () {
            var $nav = $linkContent.closest('.alertify').find('nav');
            $(linkError).text('').hide();
            var name = $(linkName).val();

            var uses = Number($(linkUses).val());
            if (isNaN(uses) || !uses) { uses = -1; }

            var role = $(linkRole).find("input[name='cp-team-role']:checked").val() || 'VIEWER';

            var pw = $(linkPassword).find('input').val();
            var msg = $(linkMessage).val();
            var hash = Hash.createRandomHash('invite', pw);
            var hashData = Hash.parseTypeHash('invite', hash);
            href = origin + '/teams/#' + hash;
            if (!name || !name.trim()) {
                $(linkError).text(Messages.team_inviteLinkErrorName).show();
                return true;
            }

            var seeds = InviteInner.deriveSeeds(hashData.key);
            var salt = InviteInner.deriveSalt(pw, AppConfig.loginSalt);

            var bytes64;
            NThen(function (waitFor) {
                $(linkForm).hide();
                $(linkSpin).show();
                $nav.find('button.cp-teams-invite-create').hide();
                $nav.find('button.cp-teams-invite-copy').show();
                setTimeout(waitFor(), 150);
            }).nThen(function (waitFor) {
                InviteInner.deriveBytes(seeds.scrypt, salt, waitFor(function (_bytes) {
                    bytes64 = _bytes;
                }));
            }).nThen(function (waitFor) {
                module.execCommand('CREATE_INVITE_LINK', {
                    name: name,
                    password: pw,
                    message: msg,
                    bytes64: bytes64,
                    hash: hash,
                    teamId: config.teamId,
                    seeds: seeds,
                    role: role,
                    uses: uses
                }, waitFor(function (obj) {
                    if (obj && obj.error) {
                        waitFor.abort();
                        $(linkSpin).hide();
                        $(linkForm).show();
                        $nav.find('button.cp-teams-invite-create').show();
                        $nav.find('button.cp-teams-invite-copy').hide();
                        return void $(linkError).text(Messages.team_inviteLinkError).show();
                    }
                    // Display result here
                    $(linkSpin).hide();
                    $(linkResult).show().find('textarea').text(href);
                    $nav.find('button.cp-teams-invite-copy').prop('disabled', '');
                }));
            });
            return true;
        };
        var linkButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary cp-teams-invite-create',
            name: Messages.team_inviteLinkCreate,
            onClick: function () {
                return process();
            },
            keys: []
        }, {
            className: 'primary cp-teams-invite-copy',
            name: Messages.team_inviteLinkCopy,
            onClick: function () {
                if (!href) { return; }
                Clipboard.copy(href, (err) => {
                    if (!err) { UI.log(Messages.shareSuccess); }
                });
            },
            keys: []
        }];

        var frameLink = UI.dialog.customModal(linkContent, {
            buttons: linkButtons,
        });
        $(frameLink).find('.cp-teams-invite-copy').prop('disabled', 'disabled').hide();

        // Create modal
        var tabs = [{
            title: Messages.share_contactCategory,
            icon: "fa fa-address-book",
            content: frameContacts,
            active: hasFriends
        }, {
            title: Messages.share_linkCategory,
            icon: "fa fa-link",
            content: frameLink,
            active: !hasFriends
        }];

        var modal = UI.dialog.tabs(tabs);
        UI.openCustomModal(modal);
    };

    UIElements.openDirectlyConfirmation = function (common, cb) {
        cb = cb || Util.noop;
        UI.confirm(h('p', Messages.ui_openDirectly), yes => {
            if (!yes) { return void cb(yes); }
            common.openDirectly();
            cb(yes);
        });
    };

    UIElements.getEntryFromButton = function ($button) {
        if (!$button || !$button.length) { return; }
        let $icon = $button.find('> i');

        let attributes = {};
        let btnClass = $button.attr('class');
        let btnId = $button.attr('id');
        let btnTitle = $button.attr('title');
        if (btnClass) { attributes['class'] = btnClass; }
        if (btnId) { attributes['id'] = btnId; }
        if (btnTitle && !attributes.title) { attributes['title'] = btnTitle; }

        return UIElements.createDropdownEntry({
            tag: 'a',
            attributes: attributes,
            content: [
                h('i',{ 'class': $icon.attr('class') }),
                h('span', $button.text())
            ],
            action: function () {
                $button.click();
                return true;
            }
        });
    };


    UIElements.createButton = function (common, type, rightside, data, callback) {
        var AppConfig = common.getAppConfig();
        var button;
        var sframeChan = common.getSframeChannel();
        var appType = (common.getMetadataMgr().getMetadata().type || 'pad').toUpperCase();
        data = data || {};
        if (!callback && data.callback) { callback = data.callback; }

        let makeButton = function(iconClasses, buttonClasses, title, text) {
            const ariaLabel = title || text || '';
            return $(h('button', {
                class: buttonClasses,
                title: title,
                'aria-label': ariaLabel
            }, [
                iconClasses ? h('i', { class: iconClasses }) : null,
                text ? h('span', { class: 'cp-toolbar-drawer-element' }, text) : null
            ]));
        };

        switch (type) {
            case 'export':
                button = makeButton('fa fa-download', 'cp-toolbar-icon-export', Messages.exportButtonTitle, Messages.exportButton);
                button
                .click(common.prepareFeedback(type))
                .click(UI.clearTooltipsDelay);
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = makeButton('fa fa-upload', 'cp-toolbar-icon-import', Messages.importButtonTitle, Messages.importButton);
                var importer = importContent((data && data.binary) ? 'application/octet-stream' : 'text/plain', callback, {
                    accept: data ? data.accept : undefined,
                    binary: data ? data.binary : undefined
                });

                var handler = data.first? function () {
                    data.first(function () {
                        importer(); // Make sure we don't pass arguments to importer
                    });
                }: importer; //importContent;

                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    handler();
                    UI.clearTooltipsDelay();
                });
                //}
                break;
            case 'upload':
                button = makeButton('fa fa-upload', 'btn btn-primary new', Messages.uploadButtonTitle, Messages.uploadButton);
                if (!data.FM) { return; }
                var $input = $('<input>', {
                    'type': 'file',
                    'style': 'display: none;',
                    'multiple': 'multiple'
                }).on('change', function (e) {
                    var files = Util.slice(e.target.files);
                    files.forEach(function (file) {
                        var ev = {
                            target: data.target
                        };
                        if (data.filter && !data.filter(file)) {
                            return;
                        }
                        if (data.transformer) {
                            data.transformer(file, function (newFile) {
                                data.FM.handleFile(newFile, ev);
                            });
                            return;
                        }
                        data.FM.handleFile(file, ev);
                    });
                    if (callback) { callback(); }
                });
                if (data.accept) { $input.attr('accept', data.accept); }
                button.click(function () {
                    $input.click();
                    UI.clearTooltipsDelay();
                });
                break;
            case 'copy':
                button = makeButton('fa fa-files-o', 'cp-toolbar-icon-import', '', Messages.makeACopy);
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    sframeChan.query('EV_MAKE_A_COPY');
                    UI.clearTooltipsDelay();
                });
                break;
            case 'importtemplate':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = makeButton('fa fa-upload', 'cp-toolbar-icon-import', '', Messages.template_import);
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    if (callback) { return void callback(); }
                    UIElements.openTemplatePicker(common, true);
                    UI.clearTooltipsDelay();
                });
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = makeButton('cptools cptools-new-template', 'cp-toolbar-icon-template', '', Messages.saveTemplateButton);
                if (data.rt || data.callback) {
                    button
                    .click(function () {
                        var title = data.getTitle() || document.title;
                        var todo = function (val) {
                            if (typeof(val) !== "string") { return; }
                            if (data.callback) {
                                return void data.callback(val);
                            }
                            var toSave = data.rt.getUserDoc();
                            if (val.trim()) {
                                val = val.trim();
                                title = val;
                                try {
                                    var parsed = JSON.parse(toSave);
                                    var meta;
                                    if (Array.isArray(parsed) && typeof(parsed[3]) === "object") {
                                        meta = parsed[3].metadata; // pad
                                    } else if (parsed.info) {
                                        meta = parsed.info; // poll
                                    } else {
                                        meta = parsed.metadata;
                                    }
                                    if (typeof(meta) === "object") {
                                        meta.title = val;
                                        meta.defaultTitle = val;
                                        delete meta.users;
                                    }
                                    toSave = JSON.stringify(parsed);
                                } catch(e) {
                                    console.error("Parse error while setting the title", e);
                                }
                            }
                            sframeChan.query('Q_SAVE_AS_TEMPLATE', {
                                toSave: toSave,
                                title: title
                            }, function () {
                                UI.alert(Messages.templateSaved);
                                Feedback.send('TEMPLATE_CREATED');
                            });
                        };
                        UI.prompt(Messages.saveTemplatePrompt, title, todo);
                        UI.clearTooltipsDelay();
                    });
                }
                break;
            case 'forget':
                button = makeButton('fa fa-trash', 'cp-toolbar-icon-forget', '', Messages.fc_delete);
                callback = typeof callback === "function" ? callback : function () {};
                button
                .click(common.prepareFeedback(type))
                .click(function() {
                    common.isPadStored(function (err, data) {
                        if (!data) {
                            return void UI.alert(Messages.autostore_notAvailable);
                        }
                        sframeChan.query('Q_IS_ONLY_IN_SHARED_FOLDER', null, function (err, res) {
                            if (err || res.error) { return void console.log(err || res.error); }
                            var msg = Messages.forgetPrompt;
                            if (res) {
                                UI.alert(Messages.sharedFolders_forget);
                                return;
                            } else if (!common.isLoggedIn()) {
                                msg = Messages.fm_removePermanentlyDialog;
                            }
                            UI.confirm(msg, function (yes) {
                                if (!yes) { return; }
                                sframeChan.query('Q_MOVE_TO_TRASH', null, function (err, obj) {
                                    err = err || (obj && obj.error);
                                    if (err) {
                                        callback(err);
                                        return void UI.warn(Messages.fm_forbidden);
                                    }
                                    var msg;
                                    if (common.isLoggedIn()) {
                                        msg = Pages.setHTML(h('div'), Messages.movedToTrash);
                                        $(msg).find('a').attr('href', '/drive/');
                                        common.fixLinks(msg);
                                    } else {
                                        msg = h('div', Messages.deleted);
                                    }
                                    UI.alert(msg);
                                    callback();
                                    return;
                                });
                            });

                        });
                    });
                });
                break;
            case 'present':
                button = $(h('button', {
                    //title: Messages.presentButtonTitle, // TODO display if the label text is collapsed
                }, [
                    h('i.fa.fa-play-circle'),
                    h('span.cp-toolbar-name', Messages.share_linkPresent)
                ])).click(common.prepareFeedback(type));
                break;
            case 'preview':
                button = $(h('button', {
                    //title: Messages.previewButtonTitle, // TODO display if the label text is collapsed
                }, [
                    h('i.fa.fa-eye'),
                    h('span.cp-toolbar-name', Messages.toolbar_preview)
                ])).click(common.prepareFeedback(type));
                break;
            case 'print':
                button = makeButton('fa fa-print', 'cp-toolbar-icon-print', Messages.printButtonTitle2, Messages.printText);
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                button = makeButton('fa fa-history', 'cp-toolbar-icon-history', Messages.historyButton, Messages.historyText, Messages.historyButton);
                if (data.histConfig) {
                    button.click(common.prepareFeedback(type)).on('click', function () {
                        common.getHistory(data.histConfig);
                        UI.clearTooltipsDelay();
                    });
                }
                break;
            case 'mediatag':
                button = $(h('button.cp-toolbar-mediatag', {
                    //title: Messages.filePickerButton, // TODO display if the label text is collapsed
                }, [
                    h('i.fa.fa-picture-o'),
                    h('span.cp-toolbar-name', Messages.toolbar_insert)
                ])).click(common.prepareFeedback(type));
                break;
            case 'savetodrive':
                button = $(h('button.cp-toolbar-savetodrive', {
                    title: Messages.canvas_saveToDrive,
                }, [
                    h('i.fa.fa-file-image-o'),
                    h('span.cp-toolbar-name.cp-toolbar-drawer-element', Messages.toolbar_savetodrive)
                ])).click(common.prepareFeedback(type));
                if (callback) { button.click(callback); }
                break;
            case 'storeindrive':
                button = $(h('button.cp-toolbar-storeindrive', {
                    style: 'display:none;'
                }, [
                    h('i.fa.fa-hdd-o'),
                    h('span.cp-toolbar-name.cp-toolbar-drawer-element', Messages.toolbar_storeInDrive)
                ])).click(common.prepareFeedback(type)).click(function () {
                    $(button).hide();
                    common.getSframeChannel().query("Q_AUTOSTORE_STORE", {
                        forceOwnDrive: true,
                    }, function (err, obj) {
                        var error = err || (obj && obj.error);
                        if (error) {
                            $(button).show();
                            if (error === 'E_OVER_LIMIT') {
                                return void UI.warn(Messages.pinLimitReached);
                            }
                            return void UI.warn(Messages.autostore_error);
                        }
                        $(document).trigger('cpPadStored');
                        UI.log(Messages.autostore_saved);
                    });
                });
                break;
            case 'hashtag':
                button = makeButton('fa fa-hashtag', 'cp-toolbar-icon-hashtag', Messages.tags_title, Messages.fc_hashtag);
                button.click(common.prepareFeedback(type))
                .click(function () {
                    common.isPadStored(function (err, data) {
                        if (!data) {
                            return void UI.alert(Messages.autostore_notAvailable);
                        }
                        UIElements.updateTags(common, null);
                    });
                    UI.clearTooltipsDelay();
                });
                break;
            case 'toggle':
                button = $(h('button.cp-toolbar-tools', {
                    //title: data.title || '', // TODO display if the label text is collapsed
                }, [
                    h('i.fa.' + (data.icon || 'fa-wrench')),
                    h('span.cp-toolbar-name', data.text || Messages.toolbar_tools)
                ])).click(common.prepareFeedback(type));
                /*
                window.setTimeout(function () {
                    button.attr('title', data.title);
                });
                var updateIcon = function (isVisible) {
                    button.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    if (!isVisible) { button.addClass('fa-caret-down'); }
                    else { button.addClass('fa-caret-up'); }
                };
                */
                button.click(function (e) {
                    data.element.toggle();
                    var isVisible = data.element.is(':visible');
                    if (callback) { callback(isVisible); }
                    if (isVisible) {
                        button.addClass('cp-toolbar-button-active');
                        if (e.originalEvent) { Feedback.send('TOGGLE_SHOW_' + appType); }
                    } else {
                        button.removeClass('cp-toolbar-button-active');
                        if (e.originalEvent) { Feedback.send('TOGGLE_HIDE_' + appType); }
                    }
                    //updateIcon(isVisible);
                });
                //updateIcon(data.element.is(':visible'));
                break;
            case 'properties':
                button = makeButton('fa fa-info-circle', 'cp-toolbar-icon-properties', Messages.propertiesButtonTitle, Messages.propertiesButton);
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    var isTop;
                    try {
                        isTop = common.getMetadataMgr().getPrivateData().isTop;
                    } catch (err) { console.error(err); }
                    if (!isTop) {
                        return void UIElements.openDirectlyConfirmation(common);
                    }

                    sframeChan.event('EV_PROPERTIES_OPEN');
                    UI.clearTooltipsDelay();
                });
                break;
            case 'save': // OnlyOffice save
                button = makeButton('fa fa-save', '', Messages.settings_save, Messages.settings_save);
                button
                .click(function() {
                    common.prepareFeedback(type);
                    UI.clearTooltipsDelay();
                });
                if (callback) { button.click(callback); }
                break;
            case 'newpad':
                button = makeButton('fa fa-plus', 'cp-toolbar-icon-newpad', Messages.newButtonTitle, Messages.newButton);
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    common.createNewPadModal();
                    UI.clearTooltipsDelay();
                });
                break;
            case 'snapshots':
                button = makeButton('fa fa-camera', 'cp-toolbar-icon-snapshots', Messages.snapshots_button,Messages.snapshots_button);
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    if (typeof(data.load) !== "function" || typeof(data.make) !== "function") {
                        return;
                    }
                    UIElements.openSnapshotsModal(common, data.load, data.make, data.remove);
                    UI.clearTooltipsDelay();
                });
                break;
            default:
                var drawerCls = data.drawer === false ? '' : '.cp-toolbar-drawer-element';
                var icon = data.icon || "fa-question";
                button = $(h('button', {
                    title: data.tippy || ''
                    //title: data.title || '',
                }, [
                    h('i.fa.' + icon),
                    h('span.cp-toolbar-name'+drawerCls, data.text)
                ]));
                var feedbackHandler = common.prepareFeedback(data.name || 'DEFAULT');
                Util.onClickEnter(button, function () {
                    feedbackHandler();
                    if (typeof(callback) !== 'function') { return; }
                    callback();
                });
                if (data.style) { button.attr('style', data.style); }
                if (data.id) { button.attr('id', data.id); }
                if (data.hiddenReadOnly) { button.addClass('cp-hidden-if-readonly'); }
                if (data.name) {
                    button.addClass('cp-toolbar-icon-'+data.name);
                }
        }
        if (rightside) {
            button.addClass('cp-toolbar-rightside-button');
        }
        return button;
    };

    var createMdToolbar = function (common, editor, cfg) {
        cfg = cfg || {};
        var $toolbar = $('<div>', {
            'class': 'cp-markdown-toolbar'
        });
        var clean = function (str) {
            return str.replace(/^(\n)+/, '').replace(/(\n)+$/, '');
        };
        var actions = {
            'bold': {
                // Msg.mdToolbar_bold
                expr: '**{0}**',
                icon: 'fa-bold'
            },
            'italic': {
                // Msg.mdToolbar_italic
                expr: '_{0}_',
                icon: 'fa-italic'
            },
            'strikethrough': {
                // Msg.mdToolbar_strikethrough
                expr: '~~{0}~~',
                icon: 'fa-strikethrough'
            },
            'heading': {
                // Msg.mdToolbar_heading
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '# '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-header'
            },
            'link': {
                // Msg.mdToolbar_link
                expr: '[{0}](http://)',
                icon: 'fa-link'
            },
            'quote': {
                // Msg.mdToolbar_quote
                apply: function (str) {
                    return '\n\n'+str.split('\n').map(function (line) {
                        return '> '+line;
                    }).join('\n')+'\n\n';
                },
                icon: 'fa-quote-right'
            },
            'nlist': {
                // Msg.mdToolbar_nlist
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '1. '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ol'
            },
            'list': {
                // Msg.mdToolbar_list
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '* '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ul'
            },
            'check': {
                // Msg.mdToolbar_check
                apply: function (str) {
                    return '\n' + clean(str).split('\n').map(function (line) {
                        return '* [ ] ' + line;
                    }).join('\n') + '\n';
                },
                icon: 'fa-check-square-o'
            },
            'code': {
                // Msg.mdToolbar_code
                apply: function (str) {
                    if (str.indexOf('\n') !== -1) {
                        return '\n```\n' + clean(str) + '\n```\n';
                    }
                    return '`' + str + '`';
                },
                icon: 'fa-code'
            },
            'toc': {
                // Msg.mdToolbar_toc
                expr: '[TOC]',
                icon: 'fa-newspaper-o'
            }
        };

        if (typeof(cfg.embed) === "function") {
            actions.embed = { // Messages.mdToolbar_embed
                icon: 'fa-picture-o',
                action: function () {
                    var _cfg = {
                        types: ['file', 'link'],
                        where: ['root']
                    };
                    common.openFilePicker(_cfg, function (data) {
                        // Embed links
                        if (data.static) {
                            var a = h('a', {
                                href: data.href
                            }, data.name);
                            cfg.embed(a, data);
                            return;
                        }
                        // Embed files
                        if (data.type !== 'file') {
                            console.log("Unexpected data type picked " + data.type);
                            return;
                        }
                        if (data.type !== 'file') { console.log('unhandled embed type ' + data.type); return; }
                        common.setPadAttribute('atime', +new Date(), null, data.href);
                        var privateDat = common.getMetadataMgr().getPrivateData();
                        var origin = privateDat.fileHost || privateDat.origin;
                        var src = data.src = data.src.slice(0,1) === '/' ? origin + data.src : data.src;
                        cfg.embed(h('media-tag', {
                            src: src,
                            'data-crypto-key': 'cryptpad:' + data.key,
                        }), data);
                    });

                }
            };
        }

        var onClick = function () {
            var type = $(this).attr('data-type');
            var texts = editor.getSelections();
            if (actions[type].action) {
                return actions[type].action();
            }
            var newTexts = texts.map(function (str) {
                str = str || Messages.mdToolbar_defaultText;
                if (actions[type].apply) {
                    return actions[type].apply(str);
                }
                return actions[type].expr.replace('{0}', str);
            });
            editor.replaceSelections(newTexts, 'around');
            editor.focus();
        };
        for (var k in actions) {
            let $b = $('<button>', {
                'data-type': k,
                'class': 'pure-button fa ' + actions[k].icon,
                title: Messages['mdToolbar_' + k] || k
            }).click(onClick);
            if (k === "embed") { $toolbar.prepend($b); }
            else { $toolbar.append($b); }
        }
        $('<button>', {
            'class': 'pure-button fa fa-question cp-markdown-help',
            title: Messages.mdToolbar_help
        }).click(function () {
            var href = Messages.mdToolbar_tutorial;
            common.openUnsafeURL(href);
        }).appendTo($toolbar);
        return $toolbar;
    };
    UIElements.createMarkdownToolbar = function (common, editor, opts) {
        var readOnly = common.getMetadataMgr().getPrivateData().readOnly;
        if (readOnly) {
            return {
                toolbar: $(),
                button: $(),
                setState: function () {}
            };
        }

        var $toolbar = createMdToolbar(common, editor, opts);
        var cfg = {
            title: Messages.mdToolbar_button,
            element: $toolbar
        };
        var onClick = function (visible) {
            common.setAttribute(['general', 'markdown-help'], visible, function (e) {
                if (e) { return void console.error(e); }
            });
        };

        var $toolbarButton = common.createButton('toggle', true, cfg, onClick);
        var tbState = true;
        common.getAttribute(['general', 'markdown-help'], function (e, data) {
            if (e) { return void console.error(e); }
            if ($(window).height() < 800 && $(window).width() < 800) { return; }
            if (data === true && $toolbarButton.length && tbState) {
                $toolbarButton.click();
            }
        });

        // setState provides the ability to disable the toolbar and the button in case we don't
        // have the markdown editor available (in code we can switch mode, in poll we can publish)
        var setState = function (state) {
            tbState = state;
            if (!state) {
                $toolbar.hide();
                $toolbarButton.hide();
                return;
            }
            common.getAttribute(['general', 'markdown-help'], function (e, data) {
                if (e) { return void console.error(e); }
                if ($(window).height() < 800 && $(window).width() < 800) { return; }
                if (data === true && $toolbarButton) {
                    // Show the toolbar using the button to make sure the icon in the button is
                    // correct (caret-down / caret-up)
                    $toolbar.hide();
                    $toolbarButton.click();
                    return;
                }
                $toolbar.show();
                $toolbarButton.click();
            });
            $toolbarButton.show();
        };

        return {
            toolbar: $toolbar,
            button: $toolbarButton,
            setState: setState
        };
    };

    var setHTML = UIElements.setHTML = function (e, html) {
        e.innerHTML = html;
        return e;
    };

    UIElements.createHelpMenu = function (common /*, categories */) {
        var type = common.getMetadataMgr().getMetadata().type || 'pad';


        var apps = {
            pad: 'richtext',
            code: 'code',
            slide: 'slides',
            sheet: 'sheets',
            poll: 'poll',
            kanban: 'kanban',
            form: 'form',
            whiteboard: 'whiteboard',
            diagram: 'diagram',
        };

        var href = "https://docs.cryptpad.org/en/user_guide/applications.html";
        if (apps[type]) {
            href = "https://docs.cryptpad.org/en/user_guide/apps/" + apps[type] + ".html";
        }
        if (type === 'drive') {
            href = "https://docs.cryptpad.org/en/user_guide/drive.html";
        }
        href = Pages.localizeDocsLink(href);

        var content = setHTML(h('p'), Messages.help_genericMore);
        $(content).find('a').attr({
            href: href,
            target: '_blank',
            rel: 'noopener noreferrer',
        });

        var text = h('p.cp-help-text', [
            content
        ]);

        common.fixLinks(text);

        var closeButton = h('span.cp-help-close.fa.fa-times');
        var $toolbarButton = common.createButton('', true, {
            text: Messages.help_button,
            name: 'help'
        }).addClass('cp-toolbar-button-active');
        var help = h('div.cp-help-container', [
            closeButton,
            text
        ]);

        $toolbarButton.attr('title', Messages.show_help_button);

        var toggleHelp = function () {
            $toolbarButton.removeClass('cp-toolbar-button-active');
            $(help).addClass('cp-help-hidden');
            common.setAttribute(['hideHelp', type], true);
        };

        $(closeButton).click(function (e) {
            e.stopPropagation();
            toggleHelp(true);
        });
        $toolbarButton.click(function () {
            common.openUnsafeURL(href);
            UI.clearTooltipsDelay();
        });

        common.getAttribute(['hideHelp', type], function (err, val) {
            if (val === true || $(window).height() < 800 || $(window).width() < 800) {
                toggleHelp(true);
            }
        });

        return {
            menu: help,
            button: $toolbarButton,
            text: text
        };
    };

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    // NOTE: The callback must stay SYNCHRONOUS
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    UIElements.createUsageBar = function (common, teamId, cb) {
        if (AppConfig.hideUsageBar) { return cb('USAGE_BAR_HIDDEN'); }
        if (!common.isLoggedIn()) { return cb("NOT_LOGGED_IN"); }
        // getPinnedUsage updates common.account.usage, and other values
        // so we can just use those and only check for errors
        var $container = $('<span>', {'class':'cp-limit-container'});
        var to;
        var todo = function (err, data) {
            if (to) {
                clearTimeout(to);
                to = undefined;
            }
            if (err === 'RPC_NOT_READY') {
                to = setTimeout(function () {
                    common.getPinUsage(teamId, todo);
                }, 1000);
                return;
            }
            if (err || !data) { return void console.error(err || 'No data'); }

            var usage = data.usage;
            var limit = data.limit;
            var plan = data.plan;
            $container.html('');
            var unit = Util.magnitudeOfBytes(limit);

            usage = unit === 'GB'? Util.bytesToGigabytes(usage):
                Util.bytesToMegabytes(usage);
            limit = unit === 'GB'? Util.bytesToGigabytes(limit):
                Util.bytesToMegabytes(limit);

            var $limit = $('<span>', {'class': 'cp-limit-bar'}).appendTo($container);
            var quota = limit === 0 ? 1 : usage/limit;
            var $usage = $('<span>', {'class': 'cp-limit-usage'}).css('width', quota*100+'%');
            var $buttons = $(h('span.cp-limit-buttons')).appendTo($container);

            var urls = common.getMetadataMgr().getPrivateData().accounts;
            var makeDonateButton = function () {
                var $a = $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-primary',
                    href: urls.donateURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.crowdfunding_button2).appendTo($buttons);
                $a.click(function () {
                    Feedback.send('SUPPORT_CRYPTPAD');
                });
            };

            var makeUpgradeButton = function () {
                var $a = $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: urls.upgradeURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.upgradeAccount).appendTo($buttons);
                $a.click(function () {
                    Feedback.send('UPGRADE_ACCOUNT');
                });
            };

            if (!Config.removeDonateButton) {
                if (!common.isLoggedIn() || !Config.allowSubscriptions) {
                    // user is not logged in, or subscriptions are disallowed
                    makeDonateButton();
                } else if (!plan) {
                    // user is logged in and subscriptions are allowed
                    // and they don't have one. show upgrades
                    makeUpgradeButton();
                    makeDonateButton();
                } else {
                    // they have a plan. show nothing
                }
            }

            var prettyUsage;
            var prettyLimit;

            if (unit === 'GB') {
                prettyUsage = Messages._getKey('formattedGB', [usage]);
                prettyLimit = Messages._getKey('formattedGB', [limit]);
            } else {
                prettyUsage = Messages._getKey('formattedMB', [usage]);
                prettyLimit = Messages._getKey('formattedMB', [limit]);
            }

            if (quota < 0.8) { $usage.addClass('cp-limit-usage-normal'); }
            else if (quota < 1) { $usage.addClass('cp-limit-usage-warning'); }
            else { $usage.addClass('cp-limit-usage-above'); }
            var $text = $('<span>', {'class': 'cp-limit-usage-text'});
            $text.html(Messages._getKey('storageStatus', [prettyUsage, prettyLimit])); // TODO avoid use of .html() if possible
            $container.prepend($text);
            $limit.append($usage);
        };

        var updateUsage = Util.notAgainForAnother(function () {
            common.getPinUsage(teamId, todo);
        }, LIMIT_REFRESH_RATE);

        var interval = setInterval(function () {
            updateUsage();
        }, LIMIT_REFRESH_RATE * 3);

        Visible.onChange(function (state) {
            if (!state) {
                clearInterval(interval);
                return;
            }
            interval = setInterval(function () {
                updateUsage();
            }, LIMIT_REFRESH_RATE * 3);
            updateUsage();
        });

        updateUsage();
        cb(null, $container);
        return {
            $container: $container,
            update: function () {
                common.getPinUsage(teamId, todo);
            },
            stop: function () {
                clearInterval(interval);
            }
        };
    };

    UIElements.createDropdownEntry = function (config) {
        var hide = function () {};
        var allowedTags = ['a', 'li', 'p', 'hr', 'div'];
        var isElement = function (o) {
            return /HTML/.test(Object.prototype.toString.call(o)) &&
                typeof(o.tagName) === 'string';
        };
        var isValidOption = function (o) {
            if (typeof o !== "object") { return false; }
            if (isElement(o)) { return true; }
            if (!o.tag || allowedTags.indexOf(o.tag) === -1) { return false; }
            return true;
        };

        var entry;
        if (!isValidOption(config)) { return; }

        if (isElement(config)) {
            entry = $(config);
        } else {
            var $el = $(h(config.tag, (config.attributes || {})));

            if (typeof(config.content) === 'string' || (config.content instanceof Element)) {
                config.content = [config.content];
            }

            if (Array.isArray(config.content)) {
                config.content.forEach(function (item) {
                    if (item instanceof Element) {
                        return void $el.append(item);
                    }
                    if (typeof(item) === 'string') {
                        $el[0].appendChild(document.createTextNode(item));
                    }
                });
            }

            // Everything is added as an "li" tag
            // Links and items with action are focusable
            // Add correct "role" attribute
            entry = $(h('li'));
            if (config.tag === 'a') {
                $el.attr('tabindex', '-1');
                entry.attr('role', 'menuitem');
                entry.attr('tabindex', '0');
            } else if (config.tag === 'li') {
                entry = $el;
                entry.attr('role', 'menuitem');
                entry.attr('tabindex', '0');
            } else if (config.tag === 'hr') {
                entry.attr('role', 'separator');
            } else {
                entry.attr('role', 'none');
            }
            entry.append($el);

            // Action can be triggered with a click or keyboard event
            if (config.tag === 'a' || config.tag === 'li') {
                entry.on('mouseenter', (e) => {
                    e.stopPropagation();
                    entry.focus();
                });

                Util.onClickEnter(entry, function(e) {
                    if (config.isSelect) { return; }
                    e.stopPropagation();
                    if (typeof(config.action) === "function") {
                        var close = config.action(e);
                        if (close) { hide(); }
                    } else {
                        // Click on <a> with an href
                        if (e.type === 'keydown'){ $el.get(0).click(); }
                    }
                }, {space: true});
            }
        }

        hide = function () {
            window.setTimeout(function () {
                entry.closest('.cp-dropdown-menu-container').find('.cp-dropdown-submenu').hide();
                entry.parents('.cp-dropdown-content').hide();

            }, 0);
        };

        return entry;
    };

    // Create a button with a dropdown menu
    // input is a config object with parameters:
    //  - container (optional): the dropdown container (span)
    //  - text (optional): the button text value
    //  - options: array of {tag: "", attributes: {}, content: "string"}
    //
    // allowed options tags: ['a', 'hr', 'p']
    UIElements.createDropdown = function (config) {
        if (typeof config !== "object" || !Array.isArray(config.options)) { return; }
        if (config.feedback && !config.common) { return void console.error("feedback in a dropdown requires sframe-common"); }

        // Container
        var $container = $(config.container);
        var containerConfig = {
            'class': 'cp-dropdown-container'
        };
        if (config.buttonTitle) {
            containerConfig.title = config.buttonTitle;
        }

        if (!config.container) {
            $container = $('<span>', containerConfig);
        }


        // Button
        let icon = config.iconCls ? h('i', {class:config.iconCls}) : undefined;
        var $button = $(h('button', {
            class: config.buttonCls || '',
            'aria-haspopup': 'menu',
            'aria-expanded': 'false',
            'title': config.buttonTitle || '',
            'aria-label': config.buttonTitle || '',
        }, config.buttonContent || [
            icon,
            h('span.cp-dropdown-button-title', config.text),
        ]));

        if (config.caretDown) {
            $button.prepend(h('i.fa.fa-caret-down'));
        }
        if (config.angleDown) {
            $button.prepend(h('i.fa.fa-angle-down'));
        }

        // Menu
        var $innerblock = $('<ul>', {
            'class': 'cp-dropdown-content',
            'role': 'menu',
            'tabindex': '-1'
        });
        var $outerblock = $(h('div.cp-dropdown-menu-container', $innerblock[0]));
        let $parentMenu = config.isSubmenuOf;
        $container.$menu = $innerblock;
        if (config.left) { $outerblock.addClass('cp-dropdown-left'); }
        if (config.isSubmenuOf && config.isSubmenuOf.length) {
            $innerblock.addClass('cp-dropdown-submenu');
        }

        var hide = function () {
            window.setTimeout(function () {
                $innerblock.hide();
            }, 0);
        };

        // When the menu is collapsed, update aria-expanded
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.attributeName !== 'style') { return; }
                if ($innerblock[0].style.display === 'none') {
                    $button.attr('aria-expanded', 'false');
                    if (config.$parentButton) {
                        config.$parentButton.find('a')
                            .toggleClass('cp-dropdown-element-active', false);
                    }
                }
            });
        });
        observer.observe($innerblock[0], { attributes: true });

        // Add the dropdown content
        var setOptions = $container.setOptions = function (options) {
            $innerblock.empty();
            options.forEach(function (o) {
                if (!o) { return; }
                o.isSelect = config.isSelect;
                let $entry = UIElements.createDropdownEntry(o);
                if (!$entry) { return void console.error('Error adding dropdown entry', o); }
                $entry.appendTo($innerblock);
            });
        };
        setOptions(config.options);

        $container.addOption = function (config) {
            let $entry = UIElements.createDropdownEntry(config);
            $entry.appendTo($innerblock);
        };

        $container.append($button).append($outerblock);
        if ($parentMenu) { $parentMenu.after($innerblock); }

        var value = config.initialValue || '';

        var setActive = function ($el) {
            if ($el.length !== 1) { return; }
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            $el.addClass('cp-dropdown-element-active');
            $el.closest('li').focus();
        };
        var setFocus = function ($el) {
            if ($el.length !== 1) { return; }
            $el.focus();
            var scroll = $el.position().top + $innerblock.scrollTop();
            if (scroll < $innerblock.scrollTop()) {
                $innerblock.scrollTop(scroll);
            } else if (scroll > ($innerblock.scrollTop() + 280)) {
                $innerblock.scrollTop(scroll-270);
            }
        };

        var show = function () {
            var wh = $(window).height();
            var button = $button[0].getBoundingClientRect();
            var topPos = button.bottom;
            $button.attr('aria-expanded', 'true');
            $innerblock.css('bottom', '');
            $innerblock.show();
            if ($parentMenu) {
                // keep parent open when recursive
                $parentMenu.show();
                if (config.$parentButton) {
                    config.$parentButton.find('a')
                        .toggleClass('cp-dropdown-element-active', true);
                }
            }

            if (config.noscroll) {
                var h = $innerblock.outerHeight();
                if ((topPos + h) > wh) {
                    $innerblock.css('bottom', button.height+'px');
                }
            } else if ($parentMenu) {
                let max = $parentMenu.css('max-height');
                let css = {
                    'max-height': max
                };
                if (config.$parentButton) {
                    let pos = config.$parentButton.position();
                    let diff = pos.top;
                    css['margin-top'] = diff+'px';
                    css['max-height'] = (parseFloat(max)-diff)+'px';
                }
                $innerblock.css(css);
                if ($innerblock.height() < 50) {
                    $innerblock.css('max-height', max);
                    $innerblock.css('margin-top', '');
                }
            } else {
                $innerblock.css('max-height', Math.floor(wh - topPos - 1)+'px');
            }
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            setTimeout(() => {
                if (config.isSelect && value) {
                    // We use JSON.stringify here to escape quotes
                    if (typeof(value) === "object") { value = JSON.stringify(value); }
                    var $val = $innerblock.find('[data-value='+JSON.stringify(value)+']');
                    setActive($val);
                    try {
                        $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
                    } catch (e) {}
                } else {
                    setFocus($innerblock.find('[role="menuitem"]').first());
                }
            });
            if (config.feedback) { Feedback.send(config.feedback); }
        };

        $container.click(function (e) {
            e.stopPropagation();
            var state = $innerblock.is(':visible');
            $('.cp-dropdown-content').hide();

            try {
                $('iframe').each(function (idx, ifrw) {
                    $(ifrw).contents().find('.cp-dropdown-content').hide();
                });
            } catch (er) {
                // empty try catch in case this iframe is problematic (cross-origin)
            }
            if (state) {
                hide();
                return;
            }
            show();
        });

        if (config.isSelect) {
            $container.onChange = Util.mkEvent();
            $innerblock.on('click', 'li', function () {
                var $val = $(this).find('a');
                value = $val.data('value');
                var textValue = $val.text() || value;
                $button.find('.cp-dropdown-button-title').text(textValue);
                $container.onChange.fire(textValue, value);
            });
            $container.setValue = function (val, name, sync) {
                value = val;
                // We use JSON.stringify here to escape quotes
                var $val = $innerblock.find('[data-value='+JSON.stringify(val)+']');
                var textValue = name || $val.text() || val;
                var f = function () {
                    $button.find('.cp-dropdown-button-title').text(textValue);
                };

                if (sync) { return void f(); }
                setTimeout(f);
            };
            $container.getValue = function () {
                return typeof(value) === "undefined" ? '' : value;
            };
        }

        var pressed = '';
        var to;
        var findItem = function () {
            var $value = $();
            $innerblock.find('[role="menuitem"]').each((i, el) => {
                var $el = $(el);
                var $item = $el.find('> *');
                if ($item.length && !$item.is(':visible')) { return false; }
                var text = $el.text().toLowerCase();
                var p = pressed.toLowerCase();
                if (text.indexOf(p) === 0) {
                    $value = $el;
                    return false;
                }
            });
            return $value;
        };
        var getAll = () => {
            return $innerblock.find('[role="menuitem"]').filter((i, el) => {
                var $item = $(el).find('> *');
                return !$item.length || $item.is(':visible');
            });
        };
        var getPrev = ($el) => {
            var $all = getAll();
            if (!$all.length) { return $(); }
            var idx = $all.index($el[0]);
            if (idx === -1) { return $(); }
            var prev = (idx - 1 + $all.length) % $all.length;
            return $($all.get(prev));
        };
        var getNext = ($el) => {
            var $all = getAll();
            if (!$all.length) { return $(); }
            var idx = $all.index($el[0]);
            if (idx === -1) { return $(); }
            var next = (idx + 1) % $all.length;
            return $($all.get(next));
        };

        let $listener = $container;
        if ($parentMenu) { $listener = $innerblock; }
        $listener.keydown(function (e) {
            e.stopPropagation(); // don't propagate event to window if the dropdown is focused

            var visible = $innerblock.is(':visible');
            var $value = $innerblock.find('li:focus');
            if (!visible && [38,40].includes(e.which) && !config.isSelect) {
                $container.click();
                visible = true;
            }

            if (!visible) { return; }
            if (e.which === 38) { // Up
                e.preventDefault();
                var $prev;
                if (!$value.length) {
                    $prev = getAll().last();
                } else {
                    $prev = getPrev($value);
                }
                $value.mouseleave();
                $prev.mouseenter();
                setTimeout(() => {
                    setFocus($prev);
                });
            }
            if (e.which === 40) { // Down
                e.preventDefault();
                var $next;
                if (!$value.length) {
                    $next = getAll().first();
                } else {
                    $next = getNext($value);
                }
                $value.mouseleave();
                $next.mouseenter();
                setTimeout(() => {
                    setFocus($next);
                });
            }
            if (e.which === 13 || e.which === 32) { //Enter or space
                e.preventDefault();
                if ($value.length) {
                    $value.click();
                    hide();
                    $button.focus();
                } else {
                    setFocus(getAll().first());
                }
            }
            if (e.which === 27) { // Esc
                e.preventDefault();
                $value.mouseleave();
                if ($container.find('.cp-dropdown-submenu:visible').length) {
                    let $submenu = $container.find('.cp-dropdown-submenu:visible');
                    if ($submenu[0] !== $innerblock[0]) {
                        $submenu.hide();
                        return;
                    }
                }
                hide();
                if ($parentMenu) { $button.closest('li').focus(); }
                else { $button.focus(); }
            }
            if (e.which === 9) { // Tab
                if (e.shiftKey) {
                    hide();
                    if ($parentMenu) { $button.closest('li').focus(); }
                    else { $button.focus(); }
                } else {
                    // Hide parent only if we're not going to focus visible submenu
                    if ($parentMenu ||
                        !$container.find('.cp-dropdown-submenu:visible').length) {
                        hide();
                    }
                    if ($parentMenu) { $parentMenu.hide(); }
                    $innerblock.find('[role="menuitem"]').last().focus();
                }
            }
        });
        $listener.keypress(function (e) {
            e.stopPropagation(); // Don't propagate to window
            window.clearTimeout(to);
            var c = String.fromCharCode(e.which);
            pressed += c;
            // We use JSON.stringify here to escape quotes
            var $value;
            if (config.isSelect) {
                $value = $innerblock.find('[data-value^='+JSON.stringify(pressed)+']:first').closest('li');
            } else {
                $value = findItem();
            }
            if ($value.length) {
                setFocus($value);
                $innerblock.scrollTop($value.position().top + $innerblock.scrollTop());
            }
            to = window.setTimeout(function () {
                pressed = '';
            }, 1000);
        });

        $container.close = hide;


        return $container;
    };

    UIElements.displayInfoMenu = function (Common, metadataMgr) {
        //var padType = metadataMgr.getMetadata().type;
        var priv = metadataMgr.getPrivateData();
        var origin = priv.origin;

        // TODO link to the most recent changelog/release notes
        // https://github.com/cryptpad/cryptpad/releases/latest/ ?

        var template = function (line, link) {
            if (!line || !link) { return; }
            var p = Pages.setHTML(h('p'), line);
            var sub = link.cloneNode(true);
            var href;
            try {
                href = new URL(sub.getAttribute('href'), origin).href;
            } catch (err) {
                return; // don't return anything to display if their href causes URL to throw
            }
            var a = p.querySelector('a');
            if (!a) { return; }
            sub.innerText = a.innerText;
            sub.setAttribute('href', href);
            p.replaceChild(sub, a);
            return p;
        };

        var legalLine = template(Messages.info_imprintFlavour, Pages.imprintLink);
        var privacyLine = template(Messages.info_privacyFlavour, Pages.privacyLink);
        var faqLine = template(Messages.help_genericMore, Pages.docsLink);
        var termsLine = template(Messages.info_termsFlavour, Pages.termsLink);
        var sourceLine = template(Messages.info_sourceFlavour, Pages.sourceLink);

        var content = h('div.cp-info-menu-container', [
                h('div.logo-block', [
                    h('img', {
                        src: '/customize/CryptPad_logo.svg?' + urlArgs,
                        alt: Messages.label_logo
                    }),
                h('h6', "CryptPad"),
                h('span', Pages.versionString)
            ]),
            h('hr'),
            h('p', Pages.hostDescription),
            h('hr'),
            faqLine,
            termsLine,
            privacyLine,
            legalLine,
            sourceLine,
        ]);

        $(content).find('a').attr('target', '_blank');

        var buttons = [
            {
                className: 'primary',
                name: Messages.filePicker_close,
                onClick: function () {},
                keys: [27],
            },
        ];

        var modal = UI.dialog.customModal(content, {scrollable: true, buttons: buttons });
        UI.openCustomModal(modal);
    };

    UIElements.createUserAdminMenu = function (Common, config) {
        var metadataMgr = Common.getMetadataMgr();

        var displayNameCls = config.displayNameCls || 'cp-toolbar-user-name';

        var priv = metadataMgr.getPrivateData();
        var accountName = Util.fixHTML(priv.accountName);
        var origin = priv.origin;
        var padType = metadataMgr.getMetadata().type;

        var options = [];
        options.push({
            tag: 'div',
            attributes: {'class': 'cp-user-menu-logo'},
            content: h('span', [
                h('img', {
                    src: '/customize/CryptPad_logo_grey.svg',
                    "aria-hidden": true,
                }),
                h('span.cp-user-menu-logo-text', "CryptPad")
            ]),
        });
        if (config.displayNameCls) {
            var userAdminContent = [];
            if (accountName) {
                userAdminContent.push(h('span', [
                    Messages.user_accountName,
                    ': ',
                    h('span', accountName),
                ]));
                userAdminContent.push(h('br'));
            }
            if (config.displayName && !AppConfig.disableProfile) {
                // Hide "Display name:" in read only mode
                userAdminContent.push(h('span', [
                    Messages.user_displayName,
                    ': ',
                    h('span', {
                        class: displayNameCls,
                    }),
                ]));
            }
            options.push({
                tag: 'div',
                attributes: {'class': 'cp-toolbar-account'},
                content: userAdminContent,
            });
        }

        if (accountName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-profile fa fa-user-circle'},
                content: h('span', Messages.profileButton),
                action: function () {
                    if (padType) {
                        Common.openURL(origin+'/profile/');
                    } else {
                        Common.gotoURL(origin+'/profile/');
                    }
                },
            });
        }
        if (padType !== 'drive' || (!accountName && priv.newSharedFolder)) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-hdd-o',
                },
                content: h('span', Messages.type.drive),
                action: function () {
                    Common.openURL(origin+'/drive/');
                },
            });
        }
        if (padType !== 'teams' && accountName) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-users',
                },
                content: h('span', Messages.type.teams),
                action: function () {
                    Common.openURL('/teams/');
                },
            });
        }
        if (padType !== 'calendar' && accountName) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-calendar',
                },
                content: h('span', Messages.calendar),
                action: function () {
                    Common.openURL('/calendar/');
                },
            });
        }
        if (padType !== 'contacts' && accountName) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-address-book',
                },
                content: h('span', Messages.type.contacts),
                action: function () {
                    Common.openURL('/contacts/');
                },
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-settings fa fa-cog'},
                content: h('span', Messages.settingsButton),
                action: function () {
                    if (padType) {
                        Common.openURL(origin+'/settings/');
                    } else {
                        Common.gotoURL(origin+'/settings/');
                    }
                },
            });
        }

        options.push({ tag: 'hr' });
        // Add administration panel link if the user is an admin
        if (priv.edPublic && Array.isArray(Config.adminKeys) && Config.adminKeys.includes(priv.edPublic)) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-admin fa fa-cogs'},
                content: h('span', Messages.adminPage || 'Admin'),
                action: function () {
                    if (padType) {
                        Common.openURL(origin+'/admin/');
                    } else {
                        Common.gotoURL(origin+'/admin/');
                    }
                },
            });
        }
        // Add moderation panel link if the user is a moderator and support is enabled
        if (priv.edPublic && Config.supportMailboxKey && Array.isArray(Config.moderatorKeys) && Config.moderatorKeys.includes(priv.edPublic)) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-admin fa  fa-ambulance'},
                content: h('span', Messages.moderationPage || 'Support mailbox'),
                action: function () {
                    Common.openURL(origin+'/moderation/');
                    return true;
                },
            });
        }
        options.push({
            tag: 'a',
            attributes: {
                'target': '_blank',
                'rel': 'noopener',
                'href': 'https://docs.cryptpad.org',
                'class': 'fa fa-book',
            },
            content: h('span', Messages.docs_link)
        });
        if (padType !== 'support' && accountName && Config.supportMailboxKey) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-support fa fa-life-ring'},
                content: h('span', Messages.supportPage || 'Support'),
                action: function () {
                    if (padType) {
                        Common.openURL(origin+'/support/');
                    } else {
                        Common.gotoURL(origin+'/support/');
                    }
                },
            });
        }

        options.push({
            tag: 'a',
            attributes: {
                'class': 'cp-toolbar-about fa fa-info',
            },
            content: h('span', Messages.user_about),
            action: function () {
                UIElements.displayInfoMenu(Common, metadataMgr);
            },
        });

        options.push({
            tag: 'a',
            attributes: {
                'class': 'fa fa-home',
            },
            content: h('span', Messages.homePage),
            action: function () {
                Common.openURL('/index.html');
            },
        });
        // Add the change display name button if not in read only mode
        /*
        if (config.changeNameButtonCls && config.displayChangeName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls + ' fa fa-user'},
                content: h('span', Messages.user_rename)
            });
        }*/
        options.push({ tag: 'hr' });

        // We have code to hide 2 separators in a row, but in the case of survey, they may be
        // in the DOM but hidden. We need to know if there are other elements in this
        // section to determine if we have to manually hide a separator.
        var surveyAlone = true;

        if (Config.allowSubscriptions) {
            surveyAlone = false;
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-star-o'
                },
                content: h('span', priv.plan ? Messages.settings_cat_subscription : Messages.pricing),
                action: function () {
                    Common.openURL(priv.plan ? priv.accounts.upgradeURL :'/features.html');
                },
            });
        }
        if (!priv.plan && !Config.removeDonateButton) {
            surveyAlone = false;
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-gift',
                },
                content: h('span', Messages.crowdfunding_button2),
                action: function () {
                    Common.openUnsafeURL(priv.accounts.donateURL);
                },
            });
        }

        // If you set "" in the admin panel, it will remove the AppConfig survey
        var surveyURL = typeof(Broadcast.surveyURL) !== "undefined" ? Broadcast.surveyURL
                                        : AppConfig.surveyURL;
        options.push({
            tag: 'a',
            attributes: {
                'class': 'cp-toolbar-survey fa fa-graduation-cap'
            },
            content: h('span', Messages.survey),
            action: function () {
                Common.openUnsafeURL(surveyURL);
                Feedback.send('SURVEY_CLICKED');
            },
        });

        options.push({ tag: 'hr' });
        // Add login or logout button depending on the current status
        if (priv.loggedIn) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'cp-toolbar-menu-logout-everywhere fa fa-plug',
                },
                content: h('span', Messages.logoutEverywhere),
                action: function () {
                    UI.confirm(Messages.settings_logoutEverywhereConfirm, function (yes) {
                        if (!yes) { return; }
                        Common.getSframeChannel().query('Q_LOGOUT_EVERYWHERE', null, function () {
                            Common.gotoURL(origin + '/');
                        });
                    });
                },
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-logout fa fa-sign-out'},
                content: h('span', Messages.logoutButton),
                action: function () {
                    Common.logout(function () {
                        Common.gotoURL(origin+'/');
                    });
                },
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-login fa fa-sign-in'},
                content: h('span', Messages.login_login),
                action: function () {
                    Common.setLoginRedirect('login');
                },
            });
            if (!Config.restrictRegistration) {
                options.push({
                    tag: 'a',
                    attributes: {'class': 'cp-toolbar-menu-register fa fa-user-plus'},
                    content: h('span', Messages.login_register),
                    action: function () {
                        Common.setLoginRedirect('register');
                    },
                });
            }
        }
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        var $userButton = $('<div>').append($icon);
        if (accountName) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/

        options.forEach(function (option) {
            var f = option.action;
            if (!f) { return; }
            option.action = function () {
                f();
                return true;
            };
        });
        var dropdownConfigUser = {
            text: $userButton[0],
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            buttonTitle: config.buttonTitle,
            feedback: "USER_ADMIN",
            common: Common
        };
        var $userAdmin = UIElements.createDropdown(dropdownConfigUser);

        var $survey = $userAdmin.find('.cp-toolbar-survey').parent();
        var $surveyHr =  $survey.next('[role="separator"]');
        if (!surveyURL) {
            $survey.hide();
            if (surveyAlone) { $surveyHr.hide(); }
        }
        Common.makeUniversal('broadcast', {
            onEvent: function (obj) {
                var cmd = obj.ev;
                if (cmd !== "SURVEY") { return; }
                var url = obj.data;
                if (url === surveyURL) { return; }
                if (url && !Util.isValidURL(url)) { return; }
                surveyURL = url;
                if (!url) {
                    $survey.hide();
                    if (surveyAlone) { $surveyHr.hide(); }
                    return;
                }
                $survey.show();
                if (surveyAlone) { $surveyHr.show(); }
            }
        });

        /*
        // Uncomment these lines to have a language selector in the admin menu
        // FIXME clicking on the inner menu hides the outer one
        var $lang = UIElements.createLanguageSelector(Common);
        $userAdmin.find('.cp-dropdown-content').append($lang);
        */

        var $displayName = $userAdmin.find('.'+displayNameCls);

        var $avatar = $userAdmin.find('> button .cp-dropdown-button-title');
        var loadingAvatar;
        var to;
        var oldUrl = '';
        var oldUid;
        var oldName;
        var updateButton = function () {
            var myData = metadataMgr.getUserData();
            var privateData = metadataMgr.getPrivateData();
            var uid = myData.uid;
            if (!priv.plan && privateData.plan) {
                config.$initBlock.empty();
                metadataMgr.off('change', updateButton);
                UIElements.createUserAdminMenu(Common, config);
                return;
            }
            if (!myData) { return; }
            if (loadingAvatar) {
                // Try again in 200ms
                window.clearTimeout(to);
                to = window.setTimeout(updateButton, 200);
                return;
            }
            loadingAvatar = true;
            var newName = UI.getDisplayName(myData.name);
            var url = myData.avatar;
            $displayName.text(newName);
            if ((accountName && oldUrl !== url) || !accountName && uid !== oldUid || oldName !== newName) {
                $avatar.html('');
                Common.displayAvatar($avatar, url, newName, function ($img) {
                    oldUrl = url;
                    oldUid = uid;
                    oldName = newName;
                    $userAdmin.find('> button').removeClass('cp-avatar');
                    if ($img) { $userAdmin.find('> button').addClass('cp-avatar'); }
                    loadingAvatar = false;
                }, uid);
                return;
            }
            loadingAvatar = false;
        };
        metadataMgr.onChange(updateButton);
        updateButton();

        return $userAdmin;
    };

    // Provide $container if you want to put the generated block in another element
    // Provide $initBlock if you already have the menu block and you want the content inserted in it
    UIElements.createLanguageSelector = function (common, $container, $initBlock) {
        var options = [];
        var languages = Messages._languages;
        var keys = Object.keys(languages).sort();
        keys.forEach(function (l) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'cp-language-value',
                    'data-value': l,
                    'href': '#',
                },
                content: [ // supplying content as an array ensures it's a text node, not parsed HTML
                    languages[l] // Pretty name of the language value
                ],
            });
        });
        var dropdownConfig = {
            text: Messages.language, // Button initial text
            options: options, // Entries displayed in the menu
            //left: true, // Open to the left of the button
            container: $initBlock, // optional
            isSelect: true,
            common: common
        };
        var $block = UIElements.createDropdown(dropdownConfig);
        $block.attr('id', 'cp-language-selector');

        if ($container) {
            $block.appendTo($container);
        }

        Language.initSelector($block, common);

        return $block;
    };



    UIElements.createNewPadModal = function (common) {
        // if in drive, show new pad modal instead
        if ($(".cp-app-drive-element-row.cp-app-drive-new-ghost").length !== 0) {
            return void $(".cp-app-drive-element-row.cp-app-drive-new-ghost").click();
        }

        var modal = UI.createModal({
            id: 'cp-app-toolbar-creation-dialog',
            $body: $('body')
        });
        var $modal = modal.$modal;
        var $title = $(h('h3', [ h('i.fa.fa-plus'), ' ', Messages.fm_newButton ]));

        var $description = $(Pages.setHTML(h('p'), Messages.creation_newPadModalDescription));
        $modal.find('.cp-modal').append($title);
        $modal.find('.cp-modal').append($description);

        var $container = $('<div>');
        var i = 0;

        var types = PadTypes.availableTypes.filter(function (p) {
            if (AppConfig.hiddenTypes.indexOf(p) !== -1) { return; }
            if (!common.isLoggedIn() && AppConfig.registeredOnlyTypes &&
                AppConfig.registeredOnlyTypes.indexOf(p) !== -1) { return; }
            return true;
        });

        types.forEach(function (p) {
            var $element = $('<li>', {
                'class': 'cp-icons-element',
                'id': 'cp-newpad-icons-'+ (i++)
            }).prepend(UI.getIcon(p)).appendTo($container);
            $element.append($('<span>', {'class': 'cp-icons-name'})
                .text(Messages.type[p]));
            $element.attr('data-type', p);
            $element.click(function () {
                $modal.hide();
                common.openURL('/' + p + '/');
            });
            var premium = common.checkRestrictedApp(p);
            if (premium < 0) {
                $element.addClass('cp-app-hidden cp-app-disabled');
            } else if (premium === 0) {
                $element.addClass('cp-app-disabled');
            }
        });

        var selected = -1;
        var previous = function () {
            selected = (selected === 0 ? types.length : selected) - 1;
            $container.find('.cp-icons-element-selected').removeClass('cp-icons-element-selected');
            let element = $container.find('#cp-newpad-icons-'+selected).addClass('cp-icons-element-selected');
            if (element.hasClass('cp-app-disabled')) {
                previous();
            }
        };
        var next = function () {
            selected = ++selected % types.length;
            $container.find('.cp-icons-element-selected').removeClass('cp-icons-element-selected');
            let element = $container.find('#cp-newpad-icons-'+selected).addClass('cp-icons-element-selected');
            if (element.hasClass('cp-app-disabled')) {
                next();
            }
        };

        $modal.off('keydown');
        $modal.keydown(function (e) {
            if (e.which === 9) {
                e.preventDefault();
                e.stopPropagation();
                if (e.shiftKey) {
                    previous();
                } else {
                    next();
                }
                return;
            }
            if (e.which === 13) {
                if ($container.find('.cp-icons-element-selected').length === 1) {
                    $container.find('.cp-icons-element-selected').click();
                }
                return;
            }
        });


        $modal.find('.cp-modal').append($container);
        window.setTimeout(function () {
            modal.show();
            $modal.focus();
        });
    };

    UIElements.openFilePicker = function (common, types, cb) {
        var sframeChan = common.getSframeChannel();
        sframeChan.query("Q_FILE_PICKER_OPEN", types, function (err, data) {
            if (err) { return; }
            cb(data);
        });
    };

    UIElements.openTemplatePicker = function (common, force) {
        var metadataMgr = common.getMetadataMgr();
        var type = metadataMgr.getMetadataLazy().type;
        var sframeChan = common.getSframeChannel();
        var focus;

        var pickerCfgInit = {
            types: [type],
            where: ['template'],
            hidden: true
        };
        var pickerCfg = {
            types: [type],
            where: ['template'],
        };
        var onConfirm = function (yes) {
            if (!yes) {
                if (focus) { focus.focus(); }
                return;
            }
            delete pickerCfg.hidden;
            var first = true; // We can only pick a template once (for a new document)
            common.openFilePicker(pickerCfg, function (data) {
                if (data.type === type && first) {
                    UI.addLoadingScreen({hideTips: true});
                    var chatChan = common.getPadChat();
                    var cursorChan = common.getCursorChannel();
                    sframeChan.query('Q_TEMPLATE_USE', {
                        href: data.href,
                        chat: chatChan,
                        cursor: cursorChan
                    }, function () {
                        first = false;
                        UI.removeLoadingScreen();
                        Feedback.send('TEMPLATE_USED');
                    });
                    if (focus) { focus.focus(); }
                    return;
                }
            });
        };

        sframeChan.query("Q_TEMPLATE_EXIST", type, function (err, data) {
            if (data) {
                common.openFilePicker(pickerCfgInit);
                focus = document.activeElement;
                if (force) { return void onConfirm(true); }
                UI.confirm(Messages.useTemplate, onConfirm, {
                    ok: Messages.useTemplateOK,
                    cancel: Messages.useTemplateCancel,
                });
            } else if (force) {
                UI.alert(Messages.template_empty);
            }
        });
    };

    /*
    UIElements.setExpirationValue = function (val, $expire) {
        if (val && typeof (val) === "number") {
            $expire.find('#cp-creation-expire').attr('checked', true).trigger('change');
            $expire.find('#cp-creation-expire-true').attr('checked', true);
            if (val % (3600 * 24 * 30) === 0) {
                $expire.find('#cp-creation-expire-unit').val("month");
                $expire.find('#cp-creation-expire-val').val(val / (3600 * 24 * 30));
                return;
            }
            if (val % (3600 * 24) === 0) {
                $expire.find('#cp-creation-expire-unit').val("day");
                $expire.find('#cp-creation-expire-val').val(val / (3600 * 24));
                return;
            }
            if (val % 3600 === 0) {
                $expire.find('#cp-creation-expire-unit').val("hour");
                $expire.find('#cp-creation-expire-val').val(val / 3600);
                return;
            }
            // if we're here, it means we don't have a valid value so we should check unlimited
            $expire.find('#cp-creation-expire-false').attr('checked', true);
        }
    };
    */
    UIElements.getPadCreationScreen = function (common, cfg, appCfg, cb) {
        appCfg = appCfg || {};
        if (!common.isLoggedIn()) { return void cb(); }
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        if (privateData.offline) {
            var onChange = function () {
                var privateData = metadataMgr.getPrivateData();
                if (privateData.offline) { return; }
                UIElements.getPadCreationScreen(common, cfg, appCfg, cb);
                metadataMgr.off('change', onChange);
            };
            metadataMgr.onChange(onChange);
            return;
        }

        var type = metadataMgr.getMetadataLazy().type || privateData.app;
        var fromFileData = privateData.fromFileData;
        var fromContent = privateData.fromContent;

        var $body = $('body');
        var $creationContainer = $('<div>', { id: 'cp-creation-container' }).appendTo($body);
        var urlArgs = (Config.requireConf && Config.requireConf.urlArgs) || '';

        var logo = h('img', { src: '/customize/CryptPad_logo.svg?' + urlArgs });
        var fill1 = h('div.cp-creation-fill.cp-creation-logo',{ role: 'presentation' }, logo);
        var fill2 = h('div.cp-creation-fill');
        var $creation = $('<div>', { id: 'cp-creation', tabindex:1 });
        $creationContainer.append([fill1, $creation, fill2]);

        var createHelper = function (href, text) {
            var q = UI.createHelper(href, text);
            $(q).addClass('cp-creation-help');
            return q;
        };

        // Title
        //$creation.append(h('h2.cp-creation-title', Messages.newButtonTitle));
        var newPadH3Title = Messages._getKey('creation_new',[Messages.type[type]]);

        var early = common.checkRestrictedApp(type);
        var domain = Config.httpUnsafeOrigin || 'CryptPad';
        if (/^http/.test(domain)) { domain = domain.replace(/^https?\:\/\//, ''); }

        var title = h('div.cp-creation-title', [
            UI.getFileIcon({type: type})[0],
            h('div.cp-creation-title-text', [
                h('span', newPadH3Title),
                createHelper(Pages.localizeDocsLink('https://docs.cryptpad.org/en/user_guide/apps/general.html#new-document'), Messages.creation_helperText)
            ])
        ]);
        $creation.append(title);

        if (early === 1) {
            $creation.append(h('div.cp-creation-early.alert.alert-warning', Messages._getKey('premiumAccess', [
                domain
            ])));
        }
        //var colorClass = 'cp-icon-color-'+type;
        //$creation.append(h('h2.cp-creation-title.'+colorClass, Messages.newButtonTitle));

        // Deleted pad warning
        if (metadataMgr.getPrivateData().isDeleted) {
            $creation.append(h('div.cp-creation-deleted-container',
                h('div.cp-creation-deleted', Messages.creation_404)
            ));
        }

        // Team pad
        var team;
        // FIXME: broken wen cache is enabled
        var teamExists = privateData.teams && Object.keys(privateData.teams).length;
        var teamValue;
        // storeInTeam can be
        // * a team ID ==> store in the team drive, and the team will be the owner
        // * -1 ==> store in the user drive, and the user will be the owner
        // * undefined ==> ask
        if (teamExists) {
            var teams = Object.keys(privateData.teams).map(function (id) {
                var data = privateData.teams[id];
                var avatar = h('span.cp-creation-team-avatar.cp-avatar');
                // We assume that teams always have a non-empty name, so we don't need a UID
                common.displayAvatar($(avatar), data.avatar, data.name);
                return h('div.cp-creation-team', {
                    'data-id': id,
                    title: data.name,
                },[
                    avatar,
                    h('span.cp-creation-team-name', data.name)
                ]);
            });
            teams.unshift(h('div.cp-creation-team', {
                'data-id': '-1',
                title: Messages.settings_cat_drive
            }, [
                h('span.cp-creation-team-avatar.fa.fa-hdd-o'),
                h('span.cp-creation-team-name', Messages.settings_cat_drive)
            ]));
            team = h('div.cp-creation-teams', [
                Messages.team_pcsSelectLabel,
                h('div.cp-creation-teams-grid', teams),
                createHelper('#', Messages.team_pcsSelectHelp)
            ]);
            var $team = $(team);
            $team.find('.cp-creation-team').click(function () {
                if ($(this).hasClass('cp-selected')) {
                    teamValue = undefined;
                    return void $(this).removeClass('cp-selected');
                }
                $team.find('.cp-creation-team').removeClass('cp-selected');
                $(this).addClass('cp-selected');
                teamValue = $(this).attr('data-id');
            });
            if (privateData.storeInTeam) {
                $team.find('[data-id="'+privateData.storeInTeam+'"]').addClass('cp-selected');
                teamValue = privateData.storeInTeam;
            }
        }


        // Owned pads
        // Default is Owned pad
        var owned = h('div.cp-creation-owned', [
            UI.createCheckbox('cp-creation-owned', Messages.creation_owned, true),
        ]);

        // Life time
        var expire = h('div.cp-creation-expire', [
            UI.createCheckbox('cp-creation-expire', Messages.creation_expiration, false, {
                labelAlt: Messages.creation_expiresIn
            }),
            h('form.cp-creation-expire-picker.cp-creation-slider', { autocomplete: "off" }, [
                h('input#cp-creation-expire-val', {
                    type: "number",
                    min: 1,
                    max: 100,
                    value: 3
                }),
                h('select#cp-creation-expire-unit', [
                    h('option', { value: 'hour' }, Messages.creation_expireHours),
                    h('option', { value: 'day' }, Messages.creation_expireDays),
                    h('option', {
                        value: 'month',
                        selected: 'selected'
                    }, Messages.creation_expireMonths)
                ])
            ]),
        ]);

        // Password
        var password = h('div.cp-creation-password', [
            UI.createCheckbox('cp-creation-password', Messages.properties_addPassword, false),
            h('span.cp-creation-password-picker.cp-creation-slider', [
                UI.passwordInput({id: 'cp-creation-password-val'})
                /*h('input#cp-creation-password-val', {
                    type: "text" // TODO type password with click to show
                }),*/
            ]),
            //createHelper('#', "TODO: password protection adds another layer of security ........") // TODO
        ]);

        var $w = $(window);
        var big = $w.width() > 800;

        var right = h('span.fa.fa-chevron-right.cp-creation-template-more');
        var left = h('span.fa.fa-chevron-left.cp-creation-template-more');
        if (!big) {
            $(left).removeClass('fa-chevron-left').addClass('fa-chevron-up');
            $(right).removeClass('fa-chevron-right').addClass('fa-chevron-down');
        }
        var templates = h('div.cp-creation-template', [
            left,
            h('div.cp-creation-template-container', [
                h('span.fa.fa-circle-o-notch.fa-spin.fa-4x.fa-fw')
            ]),
            right
        ]);

        var createDiv = h('div.cp-creation-create');
        var $create = $(createDiv);

        $(h('div#cp-creation-form', [
            h('div.cp-creation-checkboxes', [
                team,
                owned,
                expire,
                password,
            ]),
            templates,
            createDiv
        ])).appendTo($creation);

        // Display templates

        var selected = 0; // Selected template in the list (highlighted)
        var TEMPLATES_DISPLAYED = big ? 6 : 3; // Max templates displayed per page
        var next = function () {}; // Function called when pressing tab to highlight the next template
        var i = 0; // Index of the first template displayed in the current page
        sframeChan.query("Q_CREATE_TEMPLATES", type, function (err, res) {
            if (!res.data || !Array.isArray(res.data)) {
                return void console.error("Error: get the templates list");
            }
            var allData = res.data.slice().sort(function (a, b) {
                if (a.used === b.used) {
                    // Sort by name
                    if (a.name === b.name) { return 0; }
                    return a.name < b.name ? -1 : 1;
                }
                return b.used - a.used;
            });
            /*if (!appCfg.noTemplates) {
                allData.unshift({
                    name: Messages.creation_newTemplate,
                    id: -1,
                    //icon: h('span.fa.fa-bookmark')
                    icon: h('span.cptools.cptools-new-template')
                });
            }*/
            allData.unshift({
                name: Messages.creation_noTemplate,
                id: 0,
                //icon: h('span.fa.fa-file')
                icon: UI.getFileIcon({type: type})
            });
            var redraw = function (index) {
                if (index < 0) { i = 0; }
                else if (index > allData.length - 1) { return; }
                else { i = index; }
                var data = allData.slice(i, i + TEMPLATES_DISPLAYED);
                var $container = $(templates).find('.cp-creation-template-container').html('');
                data.forEach(function (obj, idx) {
                    var name = obj.name;
                    var $span = $('<span>', {
                        'class': 'cp-creation-template-element',
                        'title': name,
                    }).appendTo($container);
                    $span.data('id', obj.id);
                    if (obj.content) { $span.data('content', obj.content); }
                    if (idx === selected) { $span.addClass('cp-creation-template-selected'); }
                    if (!obj.thumbnail) {
                        $span.append(obj.icon || h('span.cptools.cptools-template'));
                    }
                    $('<span>', {'class': 'cp-creation-template-element-name'}).text(name)
                        .appendTo($span);
                    $span.click(function () {
                        $container.find('.cp-creation-template-selected')
                            .removeClass('cp-creation-template-selected');
                        $span.addClass('cp-creation-template-selected');
                        selected = idx;
                    });

                    // Add thumbnail if it exists
                    if (obj.thumbnail) {
                        common.addThumbnail(obj.thumbnail, $span, function () {});
                    }
                });
                $(right).off('click').removeClass('hidden').click(function () {
                    selected = 0;
                    redraw(i + TEMPLATES_DISPLAYED);
                });
                if (i >= allData.length - TEMPLATES_DISPLAYED ) { $(right).addClass('hidden'); }
                $(left).off('click').removeClass('hidden').click(function () {
                    selected = TEMPLATES_DISPLAYED - 1;
                    redraw(i - TEMPLATES_DISPLAYED);
                });
                if (i < TEMPLATES_DISPLAYED) { $(left).addClass('hidden'); }
            };
            if (fromFileData) {
                var todo = function (thumbnail) {
                    allData = [{
                        name: fromFileData.title,
                        id: 0,
                        thumbnail: thumbnail,
                        icon: h('span.cptools.cptools-file'),
                    }];
                    redraw(0);
                };
                todo();
                sframeChan.query("Q_GET_FILE_THUMBNAIL", null, function (err, res) {
                    if (err || (res && res.error)) { return; }
                    todo(res.data);
                });
            }
            else if (fromContent) {
                allData = [{
                    name: fromContent.title,
                    id: 0,
                    icon: h('span.cptools.cptools-poll'),
                }];
                redraw(0);
            }
            else {
                redraw(0);
            }


            // Change template selection when Tab is pressed
            next = function (revert) {
                var max = $creation.find('.cp-creation-template-element').length;
                if (selected + 1 === max && !revert) {
                    selected = i + TEMPLATES_DISPLAYED < allData.length ? 0 : max;
                    return void redraw(i + TEMPLATES_DISPLAYED);
                }
                if (selected === 0 && revert) {
                    selected = i - TEMPLATES_DISPLAYED >= 0 ? TEMPLATES_DISPLAYED - 1 : 0;
                    return void redraw(i - TEMPLATES_DISPLAYED);
                }
                selected = revert ?
                            (--selected < 0 ? 0 : selected) :
                            ++selected >= max ? max-1 : selected;
                $creation.find('.cp-creation-template-element')
                    .removeClass('cp-creation-template-selected');
                $($creation.find('.cp-creation-template-element').get(selected))
                    .addClass('cp-creation-template-selected');
            };

            $w.on('resize', function () {
                var _big = $w.width() > 800;
                if (big === _big) { return; }
                big = _big;
                if (!big) {
                    $(left).removeClass('fa-chevron-left').addClass('fa-chevron-up');
                    $(right).removeClass('fa-chevron-right').addClass('fa-chevron-down');
                } else {
                    $(left).removeClass('fa-chevron-up').addClass('fa-chevron-left');
                    $(right).removeClass('fa-chevron-down').addClass('fa-chevron-right');
                }
                TEMPLATES_DISPLAYED = big ? 6 : 3;
                redraw(0);
            });
        });

        // Display expiration form when checkbox checked
        $creation.find('#cp-creation-expire').on('change', function () {
            if ($(this).is(':checked')) {
                $creation.find('.cp-creation-expire-picker:not(.active)').addClass('active');
                $creation.find('.cp-creation-expire:not(.active)').addClass('active');
                $creation.find('#cp-creation-expire-val').focus();
                return;
            }
            $creation.find('.cp-creation-expire-picker').removeClass('active');
            $creation.find('.cp-creation-expire').removeClass('active');
            $creation.focus();
        });

        // Display password form when checkbox checked
        $creation.find('#cp-creation-password').on('change', function () {
            if ($(this).is(':checked')) {
                $creation.find('.cp-creation-password-picker:not(.active)').addClass('active');
                $creation.find('.cp-creation-password:not(.active)').addClass('active');
                $creation.find('#cp-creation-password-val').focus();
                return;
            }
            $creation.find('.cp-creation-password-picker').removeClass('active');
            $creation.find('.cp-creation-password').removeClass('active');
            $creation.focus();
        });

        // Keyboard shortcuts
        $creation.find('#cp-creation-expire-val').keydown(function (e) {
            if (e.which === 9) {
                e.stopPropagation();
            }
        });
        $creation.find('#cp-creation-expire-unit').keydown(function (e) {
            if (e.which === 9 && e.shiftKey) {
                e.stopPropagation();
            }
        });


        // Initial values
        /*
        if (!cfg.owned && typeof cfg.owned !== "undefined") {
            $creation.find('#cp-creation-owned').prop('checked', false);
        }
        UIElements.setExpirationValue(cfg.expire, $creation);
        */

        // Create the pad
        var getFormValues = function () {
            // Type of pad
            var ownedVal = $('#cp-creation-owned').is(':checked') ? 1 : 0;
            // Life time
            var expireVal = 0;
            if($('#cp-creation-expire').is(':checked')) {
                var unit = 0;
                switch ($('#cp-creation-expire-unit').val()) {
                    case "hour" : unit = 3600;           break;
                    case "day"  : unit = 3600 * 24;      break;
                    case "month": unit = 3600 * 24 * 30; break;
                    default: unit = 0;
                }
                expireVal = (Math.min(Number($('#cp-creation-expire-val').val()), 100) || 0) * unit;
            }
            // Password
            var passwordVal = $('#cp-creation-password').is(':checked') ?
                                $('#cp-creation-password-val').val() : undefined;

            var $template = $creation.find('.cp-creation-template-selected');
            var templateId = $template.data('id') || undefined;
            var templateContent = $template.data('content') || undefined;
            // Team
            var team;
            if (teamValue) {
                team = privateData.teams[teamValue] || {};
                team.id = Number(teamValue);
            }

            return {
                owned: ownedVal,
                password: passwordVal,
                expire: expireVal,
                templateId: templateId,
                templateContent: templateContent,
                team: team
            };
        };
        var create = function () {
            var val = getFormValues();

            common.setAttribute(['general', 'creation', 'owned'], val.owned, function (e) {
                if (e) { return void console.error(e); }
            });
            common.setAttribute(['general', 'creation', 'expire'], val.expire, function (e) {
                if (e) { return void console.error(e); }
            });

            if (val.expire) {
                Feedback.send('EXPIRING_PAD-'+val.expire);
            }

            $creationContainer.remove();
            common.createPad(val, function () {
                cb();
            });
        };


        var $button = $('<button>').text(Messages.creation_create).appendTo($create);
        $button.addClass('cp-creation-button-selected');
        $button.click(function () {
            create();
        });

        $creation.keydown(function (e) {
            if (e.which === 9) {
                e.preventDefault();
                e.stopPropagation();
                next(e.shiftKey);
                return;
            }
            if (e.which === 13) {
                $button.click();
                return;
            }
        });
        $creation.focus();
    };

    UIElements.loginErrorScreenContent = function (common) {
        var msg = Pages.setHTML(h('span'), Messages.restrictedLoginPrompt);
        $(msg).find('a').attr({
            href: '/login/',
        }).click(function (ev) {
            ev.preventDefault();
            common.setLoginRedirect('login');
        });
        return msg;
    };

    var autoStoreModal = {};
    UIElements.onServerError = function (common, err, toolbar, cb) {
        //if (["EDELETED", "EEXPIRED", "ERESTRICTED"].indexOf(err.type) === -1) { return; }
        var priv = common.getMetadataMgr().getPrivateData();
        var viewer = priv.readOnly || err.viewer;
        var sframeChan = common.getSframeChannel();
        var msg = err.type;
        var exitable = Boolean(err.loaded);
        if (err.type === 'EEXPIRED') {
            msg = Messages.expiredError;
            if (err.loaded) {
                // You can still use the current version in read-only mode by pressing Esc.
                // what if they don't have a keyboard (ie. mobile)
                msg += Messages.errorCopy;
            }
            if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        } else if (err.type === 'EDELETED') {
            if (priv.burnAfterReading) { return void cb(); }

            if (autoStoreModal[priv.channel]) {
                autoStoreModal[priv.channel].delete();
                delete autoStoreModal[priv.channel];
            }

            if (err.message && err.drive) {
                let msg = UI.getDestroyedPlaceholder(err.message, true);
                return UI.errorLoadingScreen(msg, false, () => {
                    // When closing error screen
                    if (err.message === 'PASSWORD_CHANGE') {
                        return common.setLoginRedirect('login');
                    }
                    return common.setLoginRedirect('');
                });
            }
            if (err.message && (err.message !== "PASSWORD_CHANGE" || viewer)) {
                // If readonly, tell the viewer that their link won't work with the new password
                UI.errorLoadingScreen(UI.getDestroyedPlaceholder(err.message, false),
                    exitable, exitable);
                return;
            }

            if (err.ownDeletion) {
                if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
                (cb || function () {})();
                return;
            }

            // View users have the wrong seed, thay can't retireve access directly
            // Version 1 hashes don't support passwords
            if (!viewer && !priv.oldVersionHash) {
                sframeChan.event('EV_SHARE_OPEN', {hidden: true}); // Close share modal
                UIElements.displayPasswordPrompt(common, {
                    fromServerError: true,
                    loaded: err.loaded,
                });
                if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
                (cb || function () {})();
                return;
            }

            msg = Messages.deletedError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }

            if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        } else if (err.type === 'ERESTRICTED') {
            msg = Messages.restrictedError;
            if (!common.isLoggedIn()) {
                msg = UIElements.loginErrorScreenContent(common);
            }

            if (toolbar && typeof toolbar.failed === "function") { toolbar.failed(true); }
        } else if (err.type === 'HASH_NOT_FOUND' && priv.isHistoryVersion) {
            msg = Messages.oo_deletedVersion;
            if (toolbar && typeof toolbar.failed === "function") { toolbar.failed(true); }
        }
        sframeChan.event('EV_SHARE_OPEN', {hidden: true});
        UI.errorLoadingScreen(msg, Boolean(err.loaded), Boolean(err.loaded));
        (cb || function () {})();
    };

    UIElements.displayPasswordPrompt = function (common, cfg, isError) {
        var error;
        if (isError) {
            let msg = isError === 'PASSWORD_CHANGE' ? Messages.drive_sfPasswordError : Messages.password_error;
            error = setHTML(h('p.cp-password-error'), msg);
        }

        var pwMsg = UI.getDestroyedPlaceholderMessage('PASSWORD_CHANGE', false);
        if (cfg.legacy) {
            // Legacy mode: we don't know if the pad has been destroyed or its password has changed
            pwMsg = Messages.password_info;
        }
        var info = h('p.cp-password-info', pwMsg);
        var info_loaded = setHTML(h('p.cp-password-info'), Messages.errorCopy);

        var password = UI.passwordInput({placeholder: Messages.password_placeholder});
        var $password = $(password);
        var button = h('button.btn.btn-primary', Messages.password_submit);
        cfg = cfg || {};

        if (cfg.value && !isError) {
            $password.find('.cp-password-input').val(cfg.value);
        }

        var submit = function () {
            var value = $password.find('.cp-password-input').val();

            // Password-prompt called from UIElements.onServerError
            if (cfg.fromServerError) {
                common.getSframeChannel().query('Q_PASSWORD_CHECK', value, function (err, obj) {
                    if (obj && obj.error) {
                        console.error(obj.error);
                        return void UI.warn(Messages.error);
                    }
                    // On success, outer will reload the page: this is a wrong password
                    UIElements.displayPasswordPrompt(common, cfg, true);
                });
                return;
            }

            // Initial load
            UI.addLoadingScreen({newProgress: true});
            if (window.CryptPad_updateLoadingProgress) {
                window.CryptPad_updateLoadingProgress({
                    type: 'pad',
                    progress: 0
                });
            }
            common.getSframeChannel().query('Q_PAD_PASSWORD_VALUE', value, function (err, data) {
                data = data || {};
                if (!data.state && data.view && data.reason === "PASSWORD_CHANGE") {
                    return UIElements.onServerError(common, {
                        type: 'EDELETED',
                        message: data.reason,
                        viewer: data.view
                    });
                }
                if (!data.state) {
                    return void UIElements.displayPasswordPrompt(common, cfg, (data && data.reason) || 1);
                }
            });
        };


        $password.find('.cp-password-input').on('keydown', function (e) { if (e.which === 13) { submit(); } });
        $(button).on('click', function () { submit(); });


        var block = h('div#cp-loading-password-prompt', [
            error,
            info,
            cfg.loaded ? info_loaded : undefined,
            h('p.cp-password-form', [
                password,
                button
            ]),
        ]);
        UI.errorLoadingScreen(block, Boolean(cfg.loaded), Boolean(cfg.loaded));

        $password.find('.cp-password-input').focus();
    };

    UIElements.displayBurnAfterReadingPage = function (common, cb) {
        var info = h('p.cp-password-info', Messages.burnAfterReading_warningAccess);
        var button = h('button.btn.primary', Messages.burnAfterReading_proceed);

        $(button).on('click', function () {
            cb();
        });

        var block = h('div#cp-loading-burn-after-reading', [
            info,
            h('nav', {
                style: 'text-align: right'
            }, button),
        ]);
        UI.errorLoadingScreen(block);
    };
    UIElements.getBurnAfterReadingWarning = function (common) {
        var priv = common.getMetadataMgr().getPrivateData();
        if (!priv.burnAfterReading) { return; }
        return h('div.alert.alert-danger.cp-burn-after-reading', Messages.burnAfterReading_warningDeleted);
    };

    var crowdfundingState = false;
    UIElements.displayCrowdfunding = function (common, force) {
        if (crowdfundingState) { return; }
        var priv = common.getMetadataMgr().getPrivateData();


        var todo = function () {
            crowdfundingState = true;
            // Display the popup
            var text = Messages.crowdfunding_popup_text;
            var yes = h('button.cp-corner-primary', [
                h('span.fa.fa-external-link'),
                'OpenCollective'
            ]);
            var no = h('button.cp-corner-cancel', Messages.crowdfunding_popup_no);
            var actions = h('div', [no, yes]);

            var dontShowAgain = function () {
                common.setAttribute(['general', 'crowdfunding'], false);
                Feedback.send('CROWDFUNDING_NEVER');
            };

            var modal = UI.cornerPopup(text, actions, '', {
                big: true,
                alt: true,
                dontShowAgain: dontShowAgain
            });

            $(yes).click(function () {
                modal.delete();
                common.openURL(priv.accounts.donateURL);
                Feedback.send('CROWDFUNDING_YES');
            });
            $(no).click(function () {
                modal.delete();
                Feedback.send('CROWDFUNDING_NO');
            });
        };

        if (force) {
            crowdfundingState = true;
            return void todo();
        }

        if (AppConfig.disableCrowdfundingMessages) { return; }
        if (priv.plan) { return; }

        crowdfundingState = true;
        common.getAttribute(['general', 'crowdfunding'], function (err, val) {
            if (err || val === false) { return; }
            common.getSframeChannel().query('Q_GET_PINNED_USAGE', null, function (err, obj) {
                var quotaMb = obj.quota / (1024 * 1024);
                if (quotaMb < 10) { return; }
                todo();
            });
        });
    };

    var storePopupState = false;
    UIElements.displayStorePadPopup = function (common, data) {
        if (storePopupState) { return; }
        storePopupState = true;
        // We won't display the popup for dropped files or already stored pads
        if (data && data.stored) {
            if (!data.inMyDrive) {
                $('.cp-toolbar-storeindrive').show();
            }
            return;
        }
        var priv = common.getMetadataMgr().getPrivateData();

        // This pad will be deleted automatically, it shouldn't be stored
        if (priv.burnAfterReading) { return; }


        var typeMsg = priv.pathname.indexOf('/file/') !== -1 ? Messages.autostore_file :
                        priv.pathname.indexOf('/drive/') !== -1 ? Messages.autostore_sf :
                          Messages.autostore_pad;
        var text = Messages._getKey('autostore_notstored', [typeMsg]);
        var footer = Pages.setHTML(h('span'), Messages.autostore_settings);

        var hide = h('button.cp-corner-cancel', Messages.autostore_hide);
        var store = h('button.cp-corner-primary', Messages.autostore_store);
        var actions = h('div', [hide, store]);

        var initialHide = data && data.autoStore && data.autoStore === -1;
        if (initialHide) {
            $('.cp-toolbar-storeindrive').show();
            UIElements.displayCrowdfunding(common);
            return;
        }

        var modal = UI.cornerPopup(text, actions, footer, {hidden: initialHide});

        // Once the store pad popup is created, put the crowdfunding one in the queue
        UIElements.displayCrowdfunding(common);


        autoStoreModal[priv.channel] = modal;

        $(modal.popup).find('.cp-corner-footer a').click(function (e) {
            e.preventDefault();
            common.openURL('/settings/');
        });

        $(hide).click(function () {
            delete autoStoreModal[priv.channel];
            $('.cp-toolbar-storeindrive').show();
            modal.delete();
        });
        var waitingForStoringCb = false;
        $(store).click(function () {
            if (waitingForStoringCb) { return; }
            waitingForStoringCb = true;
            common.getSframeChannel().query("Q_AUTOSTORE_STORE", null, function (err, obj) {
                waitingForStoringCb = false;
                var error = err || (obj && obj.error);
                if (error) {
                    if (error === 'E_OVER_LIMIT') {
                        return void UI.warn(Messages.pinLimitReached);
                    }
                    return void UI.warn(Messages.autostore_error);
                }
                $(document).trigger('cpPadStored');
                delete autoStoreModal[priv.channel];
                modal.delete();
                UI.log(Messages.autostore_saved);
            });
        });

    };

    UIElements.displayTrimHistoryPrompt = function (common, data) {
        var mb = Util.bytesToMegabytes(data.size);
        var text = Messages._getKey('history_trimPrompt', [
            Messages._getKey('formattedMB', [mb])
        ]);
        var yes = h('button.cp-corner-primary', [
            h('span.fa.fa-trash-o'),
            Messages.trimHistory_button
        ]);
        var no = h('button.cp-corner-cancel', Messages.crowdfunding_popup_no); // Not now
        var actions = h('div', [no, yes]);

        var dontShowAgain = function () {
            var until = (+new Date()) + (7 * 24 * 3600 * 1000); // 7 days from now
            if (data.drive) {
                common.setAttribute(['drive', 'trim'], until);
                return;
            }
            common.setPadAttribute('trim', until);
        };

        var modal = UI.cornerPopup(text, actions, '', {});

        $(yes).click(function () {
            modal.delete();
            if (data.drive) {
                common.openURL('/settings/#drive');
                return;
            }
            common.getSframeChannel().event('EV_PROPERTIES_OPEN');
        });
        $(no).click(function () {
            dontShowAgain();
            modal.delete();
        });
    };

    UIElements.displayFriendRequestModal = function (common, data) {
        var msg = data.content.msg;
        var userData = msg.content.user;
        var text = Messages._getKey('contacts_request', [Util.fixHTML(userData.displayName)]);

        var todo = function (yes) {
            common.getSframeChannel().query("Q_ANSWER_FRIEND_REQUEST", {
                data: data,
                value: yes
            }, function (err, obj) {
                var error = err || (obj && obj.error);
                if (error) {
                    return void UI.warn(error);
                }
                if (yes) {
                    UI.log(Messages.contacts_added);
                } else {
                    UI.log(Messages.contacts_rejected);
                }
            });
        };

        var content = h('div.cp-share-modal', [
            setHTML(h('p'), text),
        ]);
        UI.proposal(content, todo);
    };

    UIElements.displayOpenLinkModal = function (common, data, dismiss) {
        var name = Util.fixHTML(data.title);
        var url = data.href;
        var user = data.name;

        var content = h('div', [
            UI.setHTML(h('p'), Messages._getKey('notification_openLink', [name, user])),
            h('pre.cp-link-preview', url),
            UIElements.getVerifiedFriend(common, data.curve, user)
        ]);
        var clicked = false;
        var modal;
        var buttons = [{
            name: Messages.friendRequest_later,
            onClick: function () {
                if (clicked) { return true; }
                clicked = true;
                Feedback.send('LINK_RECEIVED_LATER');
            },
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.fc_open,
            onClick: function () {
                if (clicked) { return true; }
                clicked = true;
                common.openUnsafeURL(url);
                Feedback.send("LINK_RECEIVED_OPEN");
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.toolbar_storeInDrive,
            onClick: function () {
                if (clicked) { return; }
                clicked = true;
                common.getSframeChannel().query("Q_DRIVE_USEROBJECT", {
                    cmd: "addLink",
                    data: {
                        name: name,
                        href: url,
                        path: ['root']
                    }
                }, function () {
                    modal.closeModal();
                    dismiss();
                    Feedback.send("LINK_RECEIVED_STORE");
                });
                return true;
            },
            keys: [[13, 'ctrl']]
        }];
        var _modal = UI.dialog.customModal(content, {buttons: buttons});
        modal = UI.openCustomModal(_modal);
        return modal;
    };

    UIElements.displayAddOwnerModal = function (common, data) {
        var priv = common.getMetadataMgr().getPrivateData();
        var sframeChan = common.getSframeChannel();
        var msg = data.content.msg;

        var name = Util.fixHTML(UI.getDisplayName(msg.content.user.displayName));
        var title = Util.fixHTML(msg.content.title);

        var text = Messages._getKey('owner_add', [name, title]);

        var link = h('a', {
            href: '#'
        }, Messages.requestEdit_viewPad);
        $(link).click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var obj = { pw: msg.content.password || '', f: 1 };
            common.openURL(Hash.getNewPadURL(msg.content.href, obj));
        });

        var div = h('div', [
            UI.setHTML(h('p'), text),
            link
        ]);

        var dismiss = function () {
            common.mailbox.dismiss(data, function (err) {
                if (err) { console.log(err); }
            });
        };
        var answer = function (yes) {
            common.mailbox.sendTo("ADD_OWNER_ANSWER", {
                channel: msg.content.channel,
                href: msg.content.href,
                password: msg.content.password,
                title: msg.content.title,
                calendar: msg.content.calendar,
                answer: yes
            }, {
                channel: msg.content.user.notifications,
                curvePublic: msg.content.user.curvePublic
            });
            dismiss();
        };

        var todo = function (yes) {
            if (yes) {
                // ACCEPT
                sframeChan.query('Q_SET_PAD_METADATA', {
                    channel: msg.content.channel,
                    channels: msg.content.channels,
                    command: 'ADD_OWNERS',
                    value: [priv.edPublic]
                }, function (err, res) {
                    err = err || (res && res.error);
                    if (err) {
                        var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                      : Messages.error;
                        console.error(err);
                        dismiss();
                        return void UI.warn(text);
                    }
                    UI.log(Messages.saved);

                    // Send notification to the sender
                    answer(true);

                    var data = JSON.parse(JSON.stringify(msg.content));
                    data.metadata = res;

                    // Add the pad to your drive
                    // This command will also add your mailbox to the metadata log
                    // The callback is called when the pad is stored, independently of the metadata command
                    if (data.calendar) {
                        var calendarModule = common.makeUniversal('calendar');
                        var calendarData = data.calendar;
                        calendarData.href = data.href;
                        calendarData.teamId = 1;
                        calendarModule.execCommand('ADD', calendarData, function (obj) {
                            if (obj && obj.error) {
                                console.error(obj.error);
                                return void UI.warn(Messages.error);
                            }
                        });
                    } else {
                        sframeChan.query('Q_ACCEPT_OWNERSHIP', data, function (err, res) {
                            if (err || (res && res.error)) {
                                return void console.error(err | res.error);
                            }
                            UI.log(Messages.saved);
                            if (autoStoreModal[data.channel]) {
                                autoStoreModal[data.channel].delete();
                                delete autoStoreModal[data.channel];
                            }
                        });
                    }

                    // Remove yourself from the pending owners
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: msg.content.channel,
                        channels: msg.content.channels,
                        command: 'RM_PENDING_OWNERS',
                        value: [priv.edPublic]
                    }, function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            console.error(err);
                        }
                    });
                });
                return;
            }

            // DECLINE
            // Remove yourself from the pending owners
            sframeChan.query('Q_SET_PAD_METADATA', {
                channel: msg.content.channel,
                channels: msg.content.channels,
                command: 'RM_PENDING_OWNERS',
                value: [priv.edPublic]
            }, function (err, res) {
                err = err || (res && res.error);
                if (err) {
                    console.error(err);
                }
                // Send notification to the sender
                answer(false);
            });
        };

        UI.proposal(div, todo);
    };
    UIElements.displayAddTeamOwnerModal = function (common, data) {
        var priv = common.getMetadataMgr().getPrivateData();
        var sframeChan = common.getSframeChannel();
        var msg = data.content.msg;

        var name = Util.fixHTML(UI.getDisplayName(msg.content.user.displayName));
        var title = Util.fixHTML(msg.content.title);

        var text = Messages._getKey('owner_team_add', [name, title]);

        var div = h('div', [
            UI.setHTML(h('p'), text),
        ]);

        var answer = function (yes) {
            common.mailbox.sendTo("ADD_OWNER_ANSWER", {
                teamChannel: msg.content.teamChannel,
                title: msg.content.title,
                answer: yes
            }, {
                channel: msg.content.user.notifications,
                curvePublic: msg.content.user.curvePublic
            });
            common.mailbox.dismiss(data, function (err) {
                if (err) { console.log(err); }
            });
        };
        var module = common.makeUniversal('team');

        var addOwner = function (chan, waitFor, cb) {
            // Remove yourself from the pending owners
            sframeChan.query('Q_SET_PAD_METADATA', {
                channel: chan,
                command: 'ADD_OWNERS',
                value: [priv.edPublic]
            }, function (err, res) {
                err = err || (res && res.error);
                if (!err) { return; }
                waitFor.abort();
                cb(err);
            });
        };
        var removePending = function (chan, waitFor, cb) {
            // Remove yourself from the pending owners
            sframeChan.query('Q_SET_PAD_METADATA', {
                channel: chan,
                command: 'RM_PENDING_OWNERS',
                value: [priv.edPublic]
            }, waitFor(function (err, res) {
                err = err || (res && res.error);
                if (!err) { return; }
                waitFor.abort();
                cb(err);
            }));
        };
        var changeAll = function (add, _cb) {
            var f = add ? addOwner : removePending;
            var cb = Util.once(_cb);
            NThen(function (waitFor) {
                f(msg.content.teamChannel, waitFor, cb);
                f(msg.content.chatChannel, waitFor, cb);
                f(msg.content.rosterChannel, waitFor, cb);
            }).nThen(function () { cb(); });
        };

        var todo = function (yes) {
            if (yes) {
                // ACCEPT
                changeAll(true, function (err) {
                    if (err) {
                        console.error(err);
                        var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                      : Messages.error;
                        return void UI.warn(text);
                    }
                    UI.log(Messages.saved);

                    // Send notification to the sender
                    answer(true);

                    // Mark ourselves as "owner" in our local team data
                    module.execCommand("ANSWER_OWNERSHIP", {
                        teamChannel: msg.content.teamChannel,
                        answer: true
                    }, function (obj) {
                        if (obj && obj.error) { console.error(obj.error); }
                    });

                    // Remove yourself from the pending owners
                    changeAll(false, function (err) {
                        if (err) { console.error(err); }
                    });
                });
                return;
            }

            // DECLINE
            // Remove yourself from the pending owners
            changeAll(false, function (err) {
                if (err) { console.error(err); }
                // Send notification to the sender
                answer(false);
                // Set our role back to ADMIN
                module.execCommand("ANSWER_OWNERSHIP", {
                    teamChannel: msg.content.teamChannel,
                    answer: false
                }, function (obj) {
                    if (obj && obj.error) { console.error(obj.error); }
                });
            });
        };

        UI.proposal(div, todo);
    };

    UIElements.getVerifiedFriend = function (common, curve, name) {
        var priv = common.getMetadataMgr().getPrivateData();
        var verified = h('p');
        var $verified = $(verified);

        name = UI.getDisplayName(name);
        if (priv.friends && priv.friends[curve]) {
            $verified.addClass('cp-notifications-requestedit-verified');
            var f = priv.friends[curve];
            $verified.append(h('span.fa.fa-certificate'));
            var $avatar = $(h('span.cp-avatar')).appendTo($verified);
            name = UI.getDisplayName(f.displayName);
            $verified.append(h('p', Messages._getKey('isContact', [name])));
            common.displayAvatar($avatar, f.avatar, name, Util.noop, f.uid);
        } else {
            $verified.append(Messages._getKey('isNotContact', [name]));
        }
        return verified;
    };

    UIElements.displayInviteTeamModal = function (common, data) {
        var msg = data.content.msg;

        var name = Util.fixHTML(UI.getDisplayName(msg.content.user.displayName));
        var teamName = Util.fixHTML(Util.find(msg, ['content', 'team', 'metadata', 'name']) || '');

        var verified = UIElements.getVerifiedFriend(common, msg.author, name);

        var text = Messages._getKey('team_invitedToTeam', [name, teamName]);

        var div = h('div', [
            UI.setHTML(h('p'), text),
            verified
        ]);

        var module = common.makeUniversal('team');

        var answer = function (yes) {
            common.mailbox.sendTo("INVITE_TO_TEAM_ANSWER", {
                answer: yes,
                teamChannel: msg.content.team.channel,
                teamName: teamName
            }, {
                channel: msg.content.user.notifications,
                curvePublic: msg.content.user.curvePublic
            });
            common.mailbox.dismiss(data, function (err) {
                console.log(err);
            });
        };

        var todo = function (yes) {
            var priv = common.getMetadataMgr().getPrivateData();
            var MAX_TEAMS_SLOTS = priv.plan ? Constants.MAX_PREMIUM_TEAMS_SLOTS : Constants.MAX_TEAMS_SLOTS;
            var numberOfTeams = Object.keys(priv.teams || {}).length;
            if (yes) {
                if (numberOfTeams >= MAX_TEAMS_SLOTS) {
                    return void UI.alert(Messages._getKey('team_maxTeams', [MAX_TEAMS_SLOTS]));
                }
                // ACCEPT
                module.execCommand('JOIN_TEAM', {
                    team: msg.content.team
                }, function (obj) {
                    if (obj && obj.error) {
                        if (obj.error === 'ENOENT') {
                            common.mailbox.dismiss(data, function () {});
                            return void UI.alert(Messages.deletedError);
                        }
                        return void UI.warn(Messages.error);
                    }
                    answer(true);
                    if (priv.app !== 'teams') { common.openURL('/teams/'); }
                });
                return;
            }

            // DECLINE
            answer(false);
        };

        UI.proposal(div, todo);
    };

    var insertTextAtCursor = function (text) {
        var selection = window.getSelection();
        var range = selection.getRangeAt(0);
        range.deleteContents();
        var node = document.createTextNode(text);
        range.insertNode(node);

        for (var position = 0; position !== text.length; position++) {
            selection.modify("move", "right", "character");
        }
    };

    var getSource = {};
    getSource['contacts'] = function (common, sources) {
        var priv = common.getMetadataMgr().getPrivateData();
        Object.keys(priv.friends || {}).forEach(function (key) {
            if (key === 'me') { return; }
            var f = priv.friends[key];
            if (!f.curvePublic || sources[f.curvePublic]) { return; }
            sources[f.curvePublic] = {
                avatar: f.avatar,
                name: f.displayName,
                curvePublic: f.curvePublic,
                profile: f.profile,
                notifications: f.notifications,
                uid: f.uid,
            };
        });
    };
    UIElements.addMentions = function (common, options) {
        if (!options.$input) { return; }
        var $t = options.$input;

        var getValue = function () { return $t.val(); };
        var setValue = function (val) { $t.val(val); };

        var div = false;
        if (options.contenteditable) {
            div = true;
            getValue = function () { return $t.html(); };
            setValue = function () {}; // Not used, we insert data at the node level
            $t.on('paste', function (e) {
                try {
                    insertTextAtCursor(e.originalEvent.clipboardData.getData('text'));
                    e.preventDefault();
                } catch (err) { console.error(err); }
            });

            // Fix backspace with "contenteditable false" children
            $t.on('keydown', function (e) {
                if (e.which !== 8 && e.which !== 46) { return; } // Backspace or del
                var sel = document.getSelection();
                if (sel.anchorNode.nodeType !== Node.TEXT_NODE) { return; } // text nodes only

                // Only fix node located after mentions
                var n = sel.anchorNode;
                var prev = n && n.previousSibling;
                // Check if our caret is just after a mention
                if (!prev || !prev.classList || !prev.classList.contains('cp-mentions')) { return; }

                // Del: if we're at offset 0, make sure we won't delete the text node
                if (e.which === 46) {
                    if (!sel.anchorOffset && sel.anchorNode.length === 1) {
                        sel.anchorNode.nodeValue = " ";
                        e.preventDefault();
                    }
                    return;
                }

                // Backspace
                // If we're not at offset 0, make sure we won't delete the text node
                if (e.which === 8 && sel.anchorOffset) {
                    if (sel.anchorNode.length === 1) {
                        sel.anchorNode.nodeValue = " ";
                        e.preventDefault();
                    }
                    return;
                }
                // If we're at offset 0, We're just after a mention: delete it
                prev.parentElement.removeChild(prev);
                e.preventDefault();
            });
        }

        // Add the sources
        // NOTE: Sources must have a "name". They can have an "avatar".
        var sources = options.sources || {};
        if (!getSource[options.type]) { return; }
        getSource[options.type](common, sources);


        // Sort autocomplete result by label
        var sort = function (a, b) {
            var _a = a.label.toLowerCase();
            var _b = b.label.toLowerCase();
            if (_a.label < _b.label) { return -1; }
            if (_b.label < _a.label) { return 1; }
            return 0;
        };

        // Get the text between the last @ before the cursor and the cursor
        var extractLast = function (term, offset) {
            offset = typeof(offset) !== "undefined" ? offset : $t[0].selectionStart;
            var startOffset = term.slice(0,offset).lastIndexOf('@');
            return term.slice(startOffset+1, offset);
        };
        // Insert the autocomplete value in the input field
        var insertValue = function (value, offset, content) {
            offset = typeof(offset) !== "undefined" ? offset : $t[0].selectionStart;
            content = content || getValue();
            var startOffset = content.slice(0,offset).lastIndexOf('@');
            var length = offset - startOffset;
            if (length <= 0) { return; }
            var result = content.slice(0,startOffset) + value + content.slice(offset);
            if (content) {
                return {
                    result: result,
                    startOffset: startOffset
                };
            }
            setValue(result);
        };
        // Set the value to receive from the autocomplete
        var toInsert = function (data, key) {
            var name = UI.getDisplayName(data.name.replace(/[^a-zA-Z0-9]+/g, "-"));
            return "[@"+name+"|"+key+"]";
        };

        // Fix the functions when suing a contenteditable div
        if (div) {
            var _extractLast = extractLast;
            // Use getSelection to get the cursor position in contenteditable
            extractLast = function () {
                var sel = document.getSelection();
                if (sel.anchorNode.nodeType !== Node.TEXT_NODE) { return; }
                return _extractLast(sel.anchorNode.nodeValue, sel.anchorOffset);
            };
            var _insertValue = insertValue;
            insertValue = function (value) {
                // Get the selected node
                var sel = document.getSelection();
                if (sel.anchorNode.nodeType !== Node.TEXT_NODE) { return; }
                var node = sel.anchorNode;

                // Remove the "term"
                var insert =_insertValue("", sel.anchorOffset, node.nodeValue);
                if (insert) {
                    node.nodeValue = insert.result;
                }
                var breakAt = insert ? insert.startOffset : sel.anchorOffset;

                var el;
                if (typeof(value) === "string") { el = document.createTextNode(value); }
                else { el = value; }

                node.parentNode.insertBefore(el, node.splitText(breakAt));
                var next = el.nextSibling;
                if (!next) {
                    next = document.createTextNode(" ");
                    el.parentNode.appendChild(next);
                } else if (next.nodeType === Node.TEXT_NODE && !next.nodeValue) {
                    next.nodeValue = " ";
                }
                var range = document.createRange();
                range.setStart(next, 0);
                range.setEnd(next, 0);
                var newSel = window.getSelection();
                newSel.removeAllRanges();
                newSel.addRange(range);
            };

            // Inserting contacts into contenteditable: use mention UI
            if (options.type === "contacts") {
                toInsert = function (data) {
                    var avatar = h('span.cp-avatar', {
                        contenteditable: false
                    });

                    var displayName = UI.getDisplayName(data.name);
                    common.displayAvatar($(avatar), data.avatar, displayName);
                    return h('span.cp-mentions', {
                        'data-curve': data.curvePublic,
                        'data-notifications': data.notifications,
                        'data-profile': data.profile,
                        'data-name': Util.fixHTML(displayName),
                        'data-avatar': data.avatar || "",
                    }, [
                        avatar,
                        h('span.cp-mentions-name', {
                            contenteditable: false
                        }, displayName)
                    ]);
                };
            }
        }


        // don't navigate away from the field on tab when selecting an item
        $t.on("keydown", function(e) {
            // Tab or enter
            if ((e.which === 13 || e.which === 9)) {
                try {
                    var visible = $t.autocomplete("instance").menu.activeMenu.is(':visible');
                    if (visible) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                } catch (err) { console.error(err, $t); }
            }
        }).autocomplete({
            minLength: 0,
            source: function(data, cb) {
                var term = data.term;
                var results = [];
                if (term.indexOf("@") >= 0) {
                    term = extractLast(data.term) || '';
                    results = Object.keys(sources).filter(function (key) {
                        var data = sources[key];
                        return data.name.toLowerCase().indexOf(term.toLowerCase()) !== -1;
                    }).map(function (key) {
                        var data = sources[key];
                        return {
                            label: UI.getDisplayName(data.name),
                            value: key
                        };
                    });
                    results.sort(sort);
                }
                cb(results);
                // Set max-height to the autocomplete dropdown
                try {
                    var max = window.innerHeight;
                    var pos = $t[0].getBoundingClientRect();
                    var menu = $t.autocomplete("instance").menu.activeMenu;
                    menu.css({
                        'overflow-y': 'auto',
                        'max-height': (max-pos.bottom)+'px'
                    });
                } catch (e) {}
            },
            focus: function() {
                // prevent value inserted on focus
                return false;
            },
            select: function(event, ui) {
                // add the selected item
                var key = ui.item.value;
                var data = sources[key];
                var value = toInsert(data, key);
                insertValue(value);
                return false;
            }
        }).autocomplete( "instance" )._renderItem = function( ul, item ) {
            var key = item.value;
            var obj = sources[key];
            if (!obj) { return; }
            var avatar = h('span.cp-avatar');
            var displayName = UI.getDisplayName(obj.name);

            common.displayAvatar($(avatar), obj.avatar, displayName, Util.noop, obj.uid);
            var li = h('li.cp-autocomplete-value', [
                avatar,
                h('span', displayName),
            ]);
            return $(li).appendTo(ul);
        };
    };

    UIElements.isVisible = function (el, $container) {
        var size = $container.outerHeight();
        var pos = el.getBoundingClientRect();
        return (pos.bottom < size) && (pos.y > 0);
    };

    UIElements.is24h = function () {
        try {
            return !new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' }).format(0).match(/AM/);
        } catch (e) {}
        return false;
    };

    UIElements.fixInlineBRs = function (htmlString) {
        if (!htmlString && typeof(htmlString) === 'string') { return; }
        var lines = htmlString.split('<br>');
        if (lines.length === 1) { return lines; }
        var len = lines.length - 1;
        var result = [];
        for (var i = 0; i <= len; i++) {
            result.push(lines[i]);
            if (i < len) {
                result.push(h('br'));
            }
        }
        return result;
    };

    UIElements.openSnapshotsModal = function (common, load, make, remove) {
        var modal;
        var readOnly = common.getMetadataMgr().getPrivateData().readOnly;

        var container = h('div.cp-snapshots-container', {tabindex:1});
        var $container = $(container);

        var input = h('input', {
            tabindex: 1,
            placeholder: Messages.snapshots_placeholder
        });
        var $input = $(input);
        var content = h('div.cp-snapshots-modal', [
            h('h5', Messages.snapshots_button),
            container,
            readOnly ? undefined : h('label', Messages.snapshots_new),
            readOnly ? undefined : input
        ]);

        var refresh = function () {
            var metadataMgr = common.getMetadataMgr();
            var md = metadataMgr.getMetadata();
            var snapshots = md.snapshots || {};

            var list = Object.keys(snapshots).sort(function (h1, h2) {
                var s1 = snapshots[h1];
                var s2 = snapshots[h2];
                return s1.time - s2.time;
            }).map(function (hash) {
                var s = snapshots[hash];

                var openButton = h('button.cp-snapshot-view.btn.btn-light', {
                    tabindex: 1,
                }, [
                    h('i.fa.fa-eye'),
                    h('span', Messages.snapshots_open)
                ]);
                $(openButton).click(function () {
                    load(hash, s);
                    if (modal && modal.closeModal) {
                        modal.closeModal();
                    }
                });

                var deleteButton = h('button.cp-snapshot-delete.btn.btn-light', {
                    tabindex: 1,
                }, [
                    h('i.fa.fa-trash'),
                    h('span', Messages.snapshots_delete)
                ]);
                UI.confirmButton(deleteButton, {
                    classes: 'btn-danger'
                }, function () {
                    remove(hash, s);
                    refresh();
                });

                return h('span.cp-snapshot-element', {tabindex:1}, [
                    h('i.fa.fa-camera'),
                    h('span.cp-snapshot-title', [
                        h('span', s.title),
                        h('span.cp-snapshot-time', new Date(s.time).toLocaleString())
                    ]),
                    h('span.cp-snapshot-buttons', [
                        readOnly ? undefined : deleteButton,
                        openButton,
                    ])
                ]);
            });

            $container.html('').append(list);
            setTimeout(function () {
                if (list.length) { return void $container.focus(); }
                $input.focus();
            });
        };
        refresh();

        var buttons = [{
            className: 'cancel',
            name: Messages.filePicker_close,
            onClick: function () {},
            keys: [27],
        }];
        if (!readOnly) {
            buttons.push({
                className: 'primary',
                iconClass: '.fa.fa-camera',
                name: Messages.snapshots_new,
                onClick: function () {
                    var val = $input.val();
                    if (!val) { return true; }
                    $container.html('').append(h('div.cp-snapshot-spinner'));
                    var to = setTimeout(function () {
                        UI.spinner($container.find('div')).get().show();
                    });
                    make(val, function (err) {
                        clearTimeout(to);
                        $input.val('');
                        if (err) {
                            return void UI.alert(Messages.snapshots_cantMake);
                        }
                        refresh();
                    });
                    return true;
                },
                keys: [],
            });
        }

        modal = UI.openCustomModal(UI.dialog.customModal(content, {buttons: buttons }));
    };

    UIElements.onMissingMFA = (common, config, cb) => {
        let content = h('div');
        let msg = h('div.cp-loading-missing-mfa', [
            h('div.alert.alert-warning', Messages.loading_mfa_required),
            content
        ]);
        common.totpSetup(config, content, false, (newState) => {
            if (!newState) {
                return void UI.errorLoadingScreen(Messages.error);
            }
            cb({state: true});
        });
        return UI.errorLoadingScreen(msg, false, false);
    };

    UIElements.makePalette = (maxColors, onSelect) => {
        let palette = [''];
        for (var i=1; i<=maxColors; i++) { palette.push('color'+i); }

        let offline = false;
        let selectedColor = '';
        let container = h('div.cp-palette-container');
        let $container = $(container);

        var all = [];
        palette.forEach(function (color, i) {
            var $color = $(h('button.cp-palette-color.fa'));
            all.push($color);
            $color.addClass('cp-palette-'+(color || 'nocolor'));
            $color.keydown(function (e) {
                if (e.which === 13) {
                    e.stopPropagation();
                    e.preventDefault();
                    $color.click();
                }
            });
            $color.click(function () {
                if (offline) { return; }
                if (color === selectedColor) { return; }
                selectedColor = color;
                $container.find('.cp-palette-color').removeClass('fa-check');
                $color.addClass('fa-check');
                onSelect(color, $color);
            }).appendTo($container);
            $color.keydown(e => {
                if (e.which === 37) {
                    e.preventDefault();
                    if (i === 0) {
                        all[all.length - 1].focus();
                    } else {
                        all[i - 1].focus();
                    }
                }
                if (e.which === 39) {
                    e.preventDefault();
                    if (i === (all.length - 1)) {
                        all[0].focus();
                    } else {
                        all[i + 1].focus();
                    }
                }
                if (e.which === 9) {
                    if (e.shiftKey) {
                        all[0].focus();
                        return;
                    }
                    all[all.length - 1].focus();
                }
            });
        });

        container.disable = state => {
            offline = !!state;
        };
        container.getValue = () => {
            return selectedColor;
        };
        container.setValue = color => {
            $container.find('.cp-palette-color').removeClass('fa-check');
            let $color = $container.find('.cp-palette-'+(color || 'nocolor'));
            $color.addClass('fa-check');
            selectedColor = color;
        };
        return container;
    };

    return UIElements;
});
