define([
    'jquery',
    '/api/config',
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
    '/bower_components/nthen/index.js',
    '/common/inner/invitation.js',
    '/common/visible.js',

    'css!/customize/fonts/cptools/style.css',
], function ($, Config, Util, Hash, Language, UI, Constants, Feedback, h, Clipboard,
             Messages, AppConfig, Pages, NThen, InviteInner, Visible) {
    var UIElements = {};

    UIElements.getSvgLogo = function () {
        var svg = (function(){/*
<svg width="45" height="50" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
 <metadata>
  <rdf:RDF>
   <cc:Work rdf:about="">
    <dc:format>image/svg+xml</dc:format>
    <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage"/>
    <dc:title/>
   </cc:Work>
  </rdf:RDF>
 </metadata>
 <path d="m22.422 1.4356-14.641 2.7035c-0.51734-0.36799-1.1561-0.57696-1.8393-0.57696a3.1356 3.1339 0 0 0-3.1373 3.1355 3.1602 3.1585 0 0 0 1.6227 2.7575v21.103c0 1.9871 0.88906 4.1328 2.6508 6.3801 1.5602 1.9878 3.7668 4.027 6.5635 6.0547 1.9912 1.4389 3.9942 2.6545 5.6782 3.6005a3.1431 3.1413 0 0 0 5.9855 0.12499c1.7264-0.96163 3.8202-2.224 5.8986-3.7254 2.7979-2.0277 5.0033-4.0668 6.5635-6.0547 1.7624-2.2501 2.6508-4.393 2.6508-6.3801v-21.12c0.95814-0.53813 1.622-1.5642 1.622-2.74 0-1.733-1.4213-3.1355-3.1556-3.1355a3.1075 3.1059 0 0 0-1.8028 0.57696zm-0.03584 3.118 13.379 2.4687c0.01952 0.19629 0.03611 0.37448 0.08998 0.55867l-7.8432 5.1004c-1.4028-1.5215-3.4192-2.4877-5.6439-2.4877-2.2404 0-4.2687 0.98212-5.6797 2.5235l-7.7539-5.028c0.071056-0.21736 0.10472-0.44988 0.12659-0.68519zm14.426 4.4869c0.2616 0.22946 0.5738 0.4256 0.90137 0.55867v20.526c0 0.27043-0.02367 0.55955-0.07169 0.84677-0.31548 1.2546-1.0076 2.5682-2.0734 3.9289-1.3362 1.7018-3.231 3.4367-5.6264 5.172-1.9203 1.3873-3.8601 2.5452-5.3983 3.3932a3.1431 3.1413 0 0 0-4.3574-0.06325c-1.5186-0.84169-3.4128-1.979-5.2825-3.3299-2.3934-1.7353-4.2716-3.4702-5.6072-5.172-1.2729-1.6234-2.017-3.1789-2.2176-4.6492v-20.616c0.31859-0.12253 0.60591-0.30939 0.86477-0.52285l9.9357 6.3976a5.0789 5.0761 0 0 1 4.4893-2.685c1.9639 0 3.6499 1.0816 4.4901 2.7027zm-21.812 6.6849c-0.20732 0.69421-0.33324 1.4177-0.33324 2.1767 0 2.1872 0.94799 4.1262 2.4242 5.5287l-2.7125 5.4541c-0.01034-1.35e-4 -0.02017-0.0015-0.03051-0.0015-1.2807 0-2.3266 1.045-2.3266 2.3246 0 1.2799 1.046 2.3063 2.3266 2.3063a2.3009 2.2996 0 0 0 1.7349-0.78198h3.999v-2.6119h-3.3974l3.1938-6.4136c0.27643-0.55529 0.08702-1.2992-0.42094-1.6546-1.3154-0.91704-2.178-2.4154-2.178-4.1499 0-0.22399 0.03023-0.43738 0.05796-0.65318zm14.737 0.01524-2.3518 1.5372c0.02538 0.20682 0.04347 0.40998 0.04347 0.62422 0 1.7288-0.83863 3.2165-2.149 4.1356-0.50796 0.3555-0.69738 1.0994-0.42094 1.6546l3.1655 6.4281h-3.3829v2.6112h4.1363c0.42696 0.47986 1.0501 0.78274 1.744 0.78274a2.3009 2.2996 0 0 0 2.3076-2.3056c0-1.2799-1.0273-2.3253-2.3076-2.3253-0.05792 0-0.1147 0.0049-0.17158 0.0092l-2.7186-5.4769c1.4697-1.401 2.4106-3.3321 2.4106-5.5143 0-0.74898-0.10409-1.475-0.30503-2.1607zm-7.4398 0.2477a2.1129 2.1118 0 0 0-2.078 2.1111 2.1132 2.1119 0 1 0 4.2262 0 2.1129 2.1118 0 0 0-2.1482-2.1111z" style="stroke-width:1.2608"/>
</svg>
*/}).toString().slice(14,-3);
        return svg;
    };

    UIElements.prettySize = function (bytes) {
        var kB = Util.bytesToKilobytes(bytes);
        if (kB < 1024) { return kB + Messages.KB; }
        var mB = Util.bytesToMegabytes(bytes);
        return mB + Messages.MB;
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
            var _err;
            hrefs.forEach(function (href) {
                common.getPadAttribute('tags', waitFor(function (err, res) {
                    if (err) {
                        if (err === 'NO_ENTRY') {
                            UI.alert(Messages.tags_noentry);
                        }
                        waitFor.abort();
                        _err = err;
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

    var importContent = function (type, f, cfg) {
        return function () {
            var $files = $('<input>', {type:"file"});
            if (cfg && cfg.accept) {
                $files.attr('accept', cfg.accept);
            }
            $files.click();
            $files.on('change', function (e) {
                var file = e.target.files[0];
                var reader = new FileReader();
                var parsed = file && file.name && /.+\.([^.]+)$/.exec(file.name);
                var ext = parsed && parsed[1];
                reader.onload = function (e) { f(e.target.result, file, ext); };
                if (cfg && cfg.binary && cfg.binary.indexOf(ext) !== -1) {
                   reader.readAsArrayBuffer(file, type);
                } else {
                   reader.readAsText(file, type);
               }
            });
        };
    };

    UIElements.getUserGrid = function (label, config, onSelect) {
        var common = config.common;
        var users = config.data;
        if (!users) { return; }

        var icons = Object.keys(users).map(function (key, i) {
            var data = users[key];
            var name = data.displayName || data.name || Messages.anonymous;
            var avatar = h('span.cp-usergrid-avatar.cp-avatar');
            common.displayAvatar($(avatar), data.avatar, name);
            var removeBtn, el;
            if (config.remove) {
                removeBtn = h('span.fa.fa-times');
                $(removeBtn).click(function () {
                    config.remove(el);
                });
            }

            el = h('div.cp-usergrid-user'+(data.selected?'.cp-selected':'')+(config.large?'.large':''), {
                'data-ed': data.edPublic,
                'data-teamid': data.teamId,
                'data-curve': data.curvePublic || '',
                'data-name': name.toLowerCase(),
                'data-order': i,
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
                        var success = Clipboard.copy(profile);
                        if (success) { UI.log(Messages.shareSuccess); }
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
                        common.setLoginRedirect(function () {
                            common.gotoURL('/register/');
                        });
                    }
                  }, {
                    className: 'secondary',
                    name: Messages.login_login,
                    onClick: function () {
                        common.setLoginRedirect(function () {
                            common.gotoURL('/login/');
                        });
                    }
                  }
                  ]
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

        var linkName, linkPassword, linkMessage, linkError, linkSpinText;
        var linkForm, linkSpin, linkResult;
        var linkWarning;
        // Invite from link
        var dismissButton = h('span.fa.fa-times');
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
                        href: origin + '/faq.html#security-pad_password',
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
                })
            ]),
            linkSpin = h('div.cp-teams-invite-spinner', {
                style: 'display: none;'
            }, [
                h('i.fa.fa-spinner.fa-spin'),
                linkSpinText = h('span', Messages.team_inviteLinkLoading)
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
        $(linkMessage).keydown(function (e) {
            if (e.which === 13) {
                e.stopPropagation();
            }
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
                var success = Clipboard.copy(href);
                if (success) { UI.log(Messages.shareSuccess); }
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

    UIElements.createButton = function (common, type, rightside, data, callback) {
        var AppConfig = common.getAppConfig();
        var button;
        var sframeChan = common.getSframeChannel();
        var appType = (common.getMetadataMgr().getMetadata().type || 'pad').toUpperCase();
        switch (type) {
            case 'export':
                button = $('<button>', {
                    'class': 'fa fa-download cp-toolbar-icon-export',
                    title: Messages.exportButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.exportButton));

                button.click(common.prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                break;
            case 'import':
                button = $('<button>', {
                    'class': 'fa fa-upload cp-toolbar-icon-import',
                    title: Messages.importButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.importButton));
                /*if (data.types) {
                    // New import button in the toolbar
                    var importFunction = {
                        template: function () {
                            UIElements.openTemplatePicker(common, true);
                        },
                        file: function (cb) {
                            importContent('text/plain', function (content, file) {
                                cb(content, file);
                            }, {accept: data ? data.accept : undefined})
                        }
                    };
                    var toImport = [];
                    Object.keys(data.types).forEach(function (importType) {
                        if (!importFunction[importType] || !data.types[importType]) { return; }
                        var option = h('button', importType);
                        $(option).click(function () {
                            importFunction[importType](data.types[importType]);
                        });
                        toImport.push(options);
                    });

                    button.click(common.prepareFeedback(type));

                    if (toImport.length === 1) {
                        button.click(function () { $(toImport[0]).click(); });
                    } else {
                        Cryptpad.alert(h('p.cp-import-container', toImport));
                    }
                }
                else if (callback) {*/
                    // Old import button, used in settings
                    button
                    .click(common.prepareFeedback(type))
                    .click(importContent((data && data.binary) ? 'application/octet-stream' : 'text/plain', callback, {
                        accept: data ? data.accept : undefined,
                        binary: data ? data.binary : undefined
                    }));
                //}
                break;
            case 'upload':
                button = $('<button>', {
                    'class': 'btn btn-primary new',
                    title: Messages.uploadButtonTitle,
                }).append($('<span>', {'class':'fa fa-upload'})).append(' '+Messages.uploadButton);
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
                button.click(function () { $input.click(); });
                break;
            case 'copy':
                button = $('<button>', {
                    'class': 'fa fa-clone cp-toolbar-icon-import',
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.makeACopy));
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    sframeChan.query('EV_MAKE_A_COPY');
                });
                break;
            case 'importtemplate':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = $('<button>', {
                    'class': 'fa fa-upload cp-toolbar-icon-import',
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.template_import));
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    UIElements.openTemplatePicker(common, true);
                });
                break;
            case 'template':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = $('<button>', {
                    'class': 'fa fa-bookmark cp-toolbar-icon-template',
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.saveTemplateButton));
                if (data.rt) {
                    button
                    .click(function () {
                        var title = data.getTitle() || document.title;
                        var todo = function (val) {
                            if (typeof(val) !== "string") { return; }
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
                    });
                }
                break;
            case 'forget':
                button = $('<button>', {
                    'class': "fa fa-trash cp-toolbar-icon-forget"
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.fc_delete));
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
                                    var cMsg = common.isLoggedIn() ? Messages.movedToTrash : Messages.deleted;
                                    var msg = common.fixLinks($('<div>').html(cMsg));
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
                    h('span.cp-toolbar-name', Messages.share_linkOpen)
                ])).click(common.prepareFeedback(type));
                break;
            case 'print':
                button = $('<button>', {
                    title: Messages.printButtonTitle2,
                    'class': "fa fa-print cp-toolbar-icon-print",
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.printText));
                break;
            case 'history':
                if (!AppConfig.enableHistory) {
                    button = $('<span>');
                    break;
                }
                var active = $(".cp-toolbar-history:visible").length !== 0;
                button = $('<button>', {
                    title: active ? Messages.history_closeTitle : Messages.historyButton,
                    'class': "fa fa-history cp-toolbar-icon-history",
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.historyText));
                button.toggleClass("active", active);
                if (data.histConfig) {
                    if (active) {
                        button.click(function () { $(".cp-toolbar-history-close").trigger("click"); });
                    }
                    else {
                        button
                            .click(common.prepareFeedback(type))
                            .on('click', function () {
                            common.getHistory(data.histConfig);
                        });
                    }
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
                break;
            case 'hashtag':
                button = $('<button>', {
                    'class': 'fa fa-hashtag cp-toolbar-icon-hashtag',
                    title: Messages.tags_title,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.fc_hashtag));
                button.click(common.prepareFeedback(type))
                .click(function () {
                    common.isPadStored(function (err, data) {
                        if (!data) {
                            return void UI.alert(Messages.autostore_notAvailable);
                        }
                        UIElements.updateTags(common, null);
                    });
                });
                break;
            case 'toggle':
                button = $(h('button.cp-toolbar-tools', {
                    //title: data.title || '', // TODO display if the label text is collapsed
                }, [
                    h('i.fa.fa-wrench'),
                    h('span.cp-toolbar-name', Messages.toolbar_tools)
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
                button = $('<button>', {
                    'class': 'fa fa-info-circle cp-toolbar-icon-properties',
                    title: Messages.propertiesButtonTitle,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'})
                .text(Messages.propertiesButton))
                .click(common.prepareFeedback(type))
                .click(function () {
                    common.isPadStored(function (err, data) {
                        if (!data) {
                            return void UI.alert(Messages.autostore_notAvailable);
                        }
                        sframeChan.event('EV_PROPERTIES_OPEN');
                    });
                });
                break;
            case 'save': // OnlyOffice save
                button = $('<button>', {
                    'class': 'fa fa-save',
                    title: Messages.settings_save,
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'})
                .text(Messages.settings_save))
                .click(common.prepareFeedback(type));
                if (callback) { button.click(callback); }
                break;
            case 'newpad':
                button = $('<button>', {
                    title: Messages.newButtonTitle,
                    'class': 'fa fa-plus cp-toolbar-icon-newpad',
                }).append($('<span>', {'class': 'cp-toolbar-drawer-element'}).text(Messages.newButton));
                button
                .click(common.prepareFeedback(type))
                .click(function () {
                    common.createNewPadModal();
                });
                break;
            default:
                data = data || {};
                var drawerCls = data.drawer === false ? '' : '.cp-toolbar-drawer-element';
                var icon = data.icon || "fa-question";
                button = $(h('button', {
                    title: data.tippy || ''
                    //title: data.title || '',
                }, [
                    h('i.fa.' + icon),
                    h('span.cp-toolbar-name'+drawerCls, data.text)
                ])).click(common.prepareFeedback(data.name || 'DEFAULT'));
                if (callback) {
                    button.click(callback);
                }
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

    var createMdToolbar = function (common, editor) {
        var $toolbar = $('<div>', {
            'class': 'cp-markdown-toolbar'
        });
        var clean = function (str) {
            return str.replace(/^(\n)+/, '').replace(/(\n)+$/, '');
        };
        var actions = {
            'bold': {
                expr: '**{0}**',
                icon: 'fa-bold'
            },
            'italic': {
                expr: '_{0}_',
                icon: 'fa-italic'
            },
            'strikethrough': {
                expr: '~~{0}~~',
                icon: 'fa-strikethrough'
            },
            'heading': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '# '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-header'
            },
            'link': {
                expr: '[{0}](http://)',
                icon: 'fa-link'
            },
            'quote': {
                apply: function (str) {
                    return '\n\n'+str.split('\n').map(function (line) {
                        return '> '+line;
                    }).join('\n')+'\n\n';
                },
                icon: 'fa-quote-right'
            },
            'nlist': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '1. '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ol'
            },
            'list': {
                apply: function (str) {
                    return '\n'+clean(str).split('\n').map(function (line) {
                        return '* '+line;
                    }).join('\n')+'\n';
                },
                icon: 'fa-list-ul'
            },
            'check': {
                apply: function (str) {
                    return '\n' + clean(str).split('\n').map(function (line) {
                        return '* [ ] ' + line;
                    }).join('\n') + '\n';
                },
                icon: 'fa-check-square-o'
            },
            'code': {
                apply: function (str) {
                    if (str.indexOf('\n') !== -1) {
                        return '\n```\n' + clean(str) + '\n```\n';
                    }
                    return '`' + str + '`';
                },
                icon: 'fa-code'
            },
            'toc': {
                expr: '[TOC]',
                icon: 'fa-newspaper-o'
            }
        };
        var onClick = function () {
            var type = $(this).attr('data-type');
            var texts = editor.getSelections();
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
            $('<button>', {
                'data-type': k,
                'class': 'pure-button fa ' + actions[k].icon,
                title: Messages['mdToolbar_' + k] || k
            }).click(onClick).appendTo($toolbar);
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
    UIElements.createMarkdownToolbar = function (common, editor) {
        var readOnly = common.getMetadataMgr().getPrivateData().readOnly;
        if (readOnly) {
            return {
                toolbar: $(),
                button: $(),
                setState: function () {}
            };
        }

        var $toolbar = createMdToolbar(common, editor);
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

    UIElements.createHelpMenu = function (common, categories) {
        var type = common.getMetadataMgr().getMetadata().type || 'pad';

        var elements = [];
        if (Messages.help && Messages.help.generic) {
            Object.keys(Messages.help.generic).forEach(function (el) {
                elements.push(setHTML(h('li'), Messages.help.generic[el]));
            });
        }
        if (categories) {
            categories.forEach(function (cat) {
                var msgs = Messages.help[cat];
                if (msgs) {
                    Object.keys(msgs).forEach(function (el) {
                        elements.push(setHTML(h('li'), msgs[el]));
                    });
                }
            });
        }

        var text = h('p.cp-help-text', [
            h('h1', Messages.help.title),
            h('ul', elements)
        ]);

        common.fixLinks(text);

        var closeButton = h('span.cp-help-close.fa.fa-times');
        var $toolbarButton = common.createButton('', true, {
            title: Messages.hide_help_button,
            text: Messages.help_button,
            name: 'help'
        }).addClass('cp-toolbar-button-active');
        var help = h('div.cp-help-container', [
            closeButton,
            text
        ]);

        var toggleHelp = function (forceClose) {
            if ($(help).hasClass('cp-help-hidden')) {
                if (forceClose) { return; }
                common.setAttribute(['hideHelp', type], false);
                $toolbarButton.addClass('cp-toolbar-button-active');
                $toolbarButton.attr('title', Messages.hide_help_button);
                return void $(help).removeClass('cp-help-hidden');
            }
            $toolbarButton.removeClass('cp-toolbar-button-active');
            $toolbarButton.attr('title', Messages.show_help_button);
            $(help).addClass('cp-help-hidden');
            common.setAttribute(['hideHelp', type], true);
        };

        var showMore = function () {
            $(text).addClass("cp-help-small");
            var $dot = $('<span>').text('...').appendTo($(text).find('h1'));
            $(text).click(function () {
                $(text).removeClass('cp-help-small');
                $(text).off('click');
                $dot.remove();
            });
        };

        $(closeButton).click(function (e) {
            e.stopPropagation();
            toggleHelp(true);
        });
        $toolbarButton.click(function () {
            toggleHelp();
        });

        common.getAttribute(['hideHelp', type], function (err, val) {
            //if ($(window).height() < 800 || $(window).width() < 800) { return void toggleHelp(true); }
            if (val === true) { return void toggleHelp(true); }
            // Note: Help is always hidden by default now, to avoid displaying to many things in the UI
            // This is why we have (true || ...)
            if (!val && (true || $(window).height() < 800 || $(window).width() < 800)) {
                return void showMore();
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
        var todo = function (err, data) {
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
            var quota = usage/limit;
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
                    makeDonateButton();
                    makeUpgradeButton();
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
            $text.html(Messages._getKey('storageStatus', [prettyUsage, prettyLimit]));
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

        var isElement = function (o) {
            return /HTML/.test(Object.prototype.toString.call(o)) &&
                typeof(o.tagName) === 'string';
        };
        var allowedTags = ['a', 'p', 'hr', 'div'];
        var isValidOption = function (o) {
            if (typeof o !== "object") { return false; }
            if (isElement(o)) { return true; }
            if (!o.tag || allowedTags.indexOf(o.tag) === -1) { return false; }
            return true;
        };

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
        var $button = $('<button>', {
            'class': ''
        }).append($('<span>', {'class': 'cp-dropdown-button-title'}).html(config.text || ""));
        if (config.caretDown) {
            $('<span>', {
                'class': 'fa fa-caret-down',
            }).prependTo($button);
        }
        if (config.angleDown) {
            $('<span>', {
                'class': 'fa fa-angle-down',
            }).prependTo($button);
        }

        // Menu
        var $innerblock = $('<div>', {'class': 'cp-dropdown-content'});
        if (config.left) { $innerblock.addClass('cp-dropdown-left'); }

        config.options.forEach(function (o) {
            if (!isValidOption(o)) { return; }
            if (isElement(o)) { return $innerblock.append($(o)); }
            var $el = $('<' + o.tag + '>', o.attributes || {}).html(o.content || '');
            $el.appendTo($innerblock);
            if (typeof(o.action) === 'function') {
                $el.click(o.action);
            }
        });

        $container.append($button).append($innerblock);

        var value = config.initialValue || '';

        var setActive = function ($el) {
            if ($el.length !== 1) { return; }
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            $el.addClass('cp-dropdown-element-active');
            var scroll = $el.position().top + $innerblock.scrollTop();
            if (scroll < $innerblock.scrollTop()) {
                $innerblock.scrollTop(scroll);
            } else if (scroll > ($innerblock.scrollTop() + 280)) {
                $innerblock.scrollTop(scroll-270);
            }
        };

        var hide = function () {
            window.setTimeout(function () { $innerblock.hide(); }, 0);
        };

        var show = function () {
            var wh = $(window).height();
            var button = $button[0].getBoundingClientRect();
            var topPos = button.bottom;
            $innerblock.css('bottom', '');
            if (config.noscroll) {
                var h = $innerblock.outerHeight();
                if ((topPos + h) > wh) {
                    $innerblock.css('bottom', button.height+'px');
                }
            } else {
                $innerblock.css('max-height', Math.floor(wh - topPos - 1)+'px');
            }
            $innerblock.show();
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            if (config.isSelect && value) {
                var $val = $innerblock.find('[data-value="'+value+'"]');
                setActive($val);
                try {
                    $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
                } catch (e) {}
            }
            if (config.feedback) { Feedback.send(config.feedback); }
        };

        $container.click(function (e) {
            e.stopPropagation();
            var state = $innerblock.is(':visible');
            $('.cp-dropdown-content').hide();

            var $c = $container.closest('.cp-toolbar-drawer-content');
            $c.removeClass('cp-dropdown-visible');
            if (!state) { $c.addClass('cp-dropdown-visible'); }

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
            var pressed = '';
            var to;
            $container.on('click', 'a', function () {
                value = $(this).data('value');
                var $val = $(this);
                var textValue = $val.html() || value;
                $button.find('.cp-dropdown-button-title').html(textValue);
            });
            $container.keydown(function (e) {
                var $value = $innerblock.find('[data-value].cp-dropdown-element-active:visible');
                if (!$value.length) {
                    $value = $innerblock.find('[data-value]').first();
                }
                if (e.which === 38) { // Up
                    e.preventDefault();
                    e.stopPropagation();
                    if ($value.length) {
                        $value.mouseleave();
                        var $prev = $value.prev();
                        $prev.mouseenter();
                        setActive($prev);
                    }
                }
                if (e.which === 40) { // Down
                    e.preventDefault();
                    e.stopPropagation();
                    if ($value.length) {
                        $value.mouseleave();
                        var $next = $value.next();
                        $next.mouseenter();
                        setActive($next);
                    }
                }
                if (e.which === 13) { //Enter
                    e.preventDefault();
                    e.stopPropagation();
                    if ($value.length) {
                        $value.click();
                        hide();
                    }
                }
                if (e.which === 27) { // Esc
                    e.preventDefault();
                    e.stopPropagation();
                    $value.mouseleave();
                    hide();
                }
            });
            $container.keypress(function (e) {
                window.clearTimeout(to);
                var c = String.fromCharCode(e.which);
                pressed += c;
                var $value = $innerblock.find('[data-value^="'+pressed+'"]:first');
                if ($value.length) {
                    setActive($value);
                    $innerblock.scrollTop($value.position().top + $innerblock.scrollTop());
                }
                to = window.setTimeout(function () {
                    pressed = '';
                }, 1000);
            });

            $container.setValue = function (val, name) {
                value = val;
                var $val = $innerblock.find('[data-value="'+val+'"]');
                var textValue = name || $val.html() || val;
                setTimeout(function () {
                    $button.find('.cp-dropdown-button-title').html(textValue);
                });
            };
            $container.getValue = function () {
                return value || '';
            };
        }

        return $container;
    };

    UIElements.displayInfoMenu = function (Common, metadataMgr) {
        //var padType = metadataMgr.getMetadata().type;
        var priv = metadataMgr.getPrivateData();
        var origin = priv.origin;

        // TODO link to the most recent changelog/release notes
        // https://github.com/xwiki-labs/cryptpad/releases/latest/ ?

        var template = function (line, link) {
            if (!line || !link) { return; }
            var p = $('<p>').html(line)[0];
            var sub = link.cloneNode(true);

/*  This is a hack to make relative URLs point to the main domain
    instead of the sandbox domain. It will break if the admins have specified
    some less common URL formats for their customizable links, such as if they've
    used a protocal-relative absolute URL. The URL API isn't quite safe to use
    because of IE (thanks, Bill).  */
            var href = sub.getAttribute('href');
            if (/^\//.test(href)) { sub.setAttribute('href', origin + href); }
            var a = p.querySelector('a');
            if (!a) { return; }
            sub.innerText = a.innerText;
            p.replaceChild(sub, a);
            return p;
        };

        var legalLine = template(Messages.info_imprintFlavour, Pages.imprintLink);
        var privacyLine = template(Messages.info_privacyFlavour, Pages.privacyLink);
        var faqLine = template(Messages.help.generic.more, Pages.faqLink);

        var content = h('div.cp-info-menu-container', [
            h('h6', Pages.versionString),
            h('hr'),
            legalLine,
            privacyLine,
            faqLine,
        ]);

        var buttons = [
            {
                className: 'primary',
                name: Messages.filePicker_close,
                onClick: function () {},
                keys: [27],
            },
        ];

        var modal = UI.dialog.customModal(content, {buttons: buttons });
        UI.openCustomModal(modal);
    };

    UIElements.createUserAdminMenu = function (Common, config) {
        var metadataMgr = Common.getMetadataMgr();

        var displayNameCls = config.displayNameCls || 'cp-toolbar-user-name';
        var $displayedName = $('<span>', {'class': displayNameCls});

        var priv = metadataMgr.getPrivateData();
        var accountName = priv.accountName;
        var origin = priv.origin;
        var padType = metadataMgr.getMetadata().type;

        var $userName = $('<span>');
        var options = [];
        if (config.displayNameCls) {
            var $userAdminContent = $('<p>');
            if (accountName) {
                var $userAccount = $('<span>').append(Messages.user_accountName + ': ');
                $userAdminContent.append($userAccount).append(Util.fixHTML(accountName));
                $userAdminContent.append($('<br>'));
            }
            if (config.displayName && !AppConfig.disableProfile) {
                // Hide "Display name:" in read only mode
                $userName.append(Messages.user_displayName + ': ');
                $userName.append($displayedName);
            }
            $userAdminContent.append($userName);
            options.push({
                tag: 'p',
                attributes: {'class': 'cp-toolbar-account'},
                content: $userAdminContent.html()
            });
        }

        if (accountName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-profile fa fa-user-circle'},
                content: h('span', Messages.profileButton),
                action: function () {
                    if (padType) {
                        window.open(origin+'/profile/');
                    } else {
                        window.parent.location = origin+'/profile/';
                    }
                },
            });
        }
        if (padType !== 'drive' || (!accountName && priv.newSharedFolder)) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/drive/',
                    'class': 'fa fa-hdd-o'
                },
                content: h('span', Messages.type.drive)
            });
        }
        if (padType !== 'teams' && accountName) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/teams/',
                    'class': 'fa fa-users'
                },
                content: h('span', Messages.type.teams)
            });
        }
        if (padType !== 'contacts' && accountName) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/contacts/',
                    'class': 'fa fa-address-book'
                },
                content: h('span', Messages.type.contacts)
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-settings fa fa-cog'},
                content: h('span', Messages.settingsButton),
                action: function () {
                    if (padType) {
                        window.open(origin+'/settings/');
                    } else {
                        window.parent.location = origin+'/settings/';
                    }
                },
            });
        }

        options.push({ tag: 'hr' });
        // Add administration panel link if the user is an admin
        if (priv.edPublic && Array.isArray(Config.adminKeys) && Config.adminKeys.indexOf(priv.edPublic) !== -1) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-admin fa fa-cogs'},
                content: h('span', Messages.adminPage || 'Admin'),
                action: function () {
                    if (padType) {
                        window.open(origin+'/admin/');
                    } else {
                        window.parent.location = origin+'/admin/';
                    }
                },
            });
        }
        if (padType !== 'support' && accountName && Config.supportMailbox) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-support fa fa-life-ring'},
                content: h('span', Messages.supportPage || 'Support'),
                action: function () {
                    if (padType) {
                        window.open(origin+'/support/');
                    } else {
                        window.parent.location = origin+'/support/';
                    }
                },
            });
        }
        if (AppConfig.surveyURL) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'rel': 'noopener',
                    'href': AppConfig.surveyURL,
                    'class': 'cp-toolbar-survey fa fa-graduation-cap'
                },
                content: h('span', Messages.survey),
                action: function () {
                    Feedback.send('SURVEY_CLICKED');
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
                'target': '_blank',
                'href': origin+'/index.html',
                'class': 'fa fa-home'
            },
            content: h('span', Messages.homePage)
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
        if (Config.allowSubscriptions) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': priv.plan ? priv.accounts.upgradeURL : origin+'/features.html',
                    'class': 'fa fa-star-o'
                },
                content: h('span', priv.plan ? Messages.settings_cat_subscription : Messages.pricing)
            });
        }
        if (!priv.plan && !Config.removeDonateButton) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'rel': 'noopener',
                    'href': priv.accounts.donateURL,
                    'class': 'fa fa-gift'
                },
                content: h('span', Messages.crowdfunding_button2)
            });
        }

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
                    Common.getSframeChannel().query('Q_LOGOUT_EVERYWHERE', null, function () {
                        window.parent.location = origin + '/';
                    });
                },
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-logout fa fa-sign-out'},
                content: h('span', Messages.logoutButton),
                action: function () {
                    Common.logout(function () {
                        window.parent.location = origin+'/';
                    });
                },
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-login fa fa-sign-in'},
                content: h('span', Messages.login_login),
                action: function () {
                    Common.setLoginRedirect(function () {
                        window.parent.location = origin+'/login/';
                    });
                },
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-register fa fa-user-plus'},
                content: h('span', Messages.login_register),
                action: function () {
                    Common.setLoginRedirect(function () {
                        window.parent.location = origin+'/register/';
                    });
                },
            });
        }
        var $icon = $('<span>', {'class': 'fa fa-user-secret'});
        //var $userbig = $('<span>', {'class': 'big'}).append($displayedName.clone());
        var $userButton = $('<div>').append($icon);//.append($userbig);
        if (accountName) {
            $userButton = $('<div>').append(accountName);
        }
        /*if (account && config.displayNameCls) {
            $userbig.append($('<span>', {'class': 'account-name'}).text('(' + accountName + ')'));
        } else if (account) {
            // If no display name, do not display the parentheses
            $userbig.append($('<span>', {'class': 'account-name'}).text(accountName));
        }*/
        var dropdownConfigUser = {
            text: $userButton.html(), // Button initial text
            options: options, // Entries displayed in the menu
            left: true, // Open to the left of the button
            container: config.$initBlock, // optional
            feedback: "USER_ADMIN",
            common: Common
        };
        var $userAdmin = UIElements.createDropdown(dropdownConfigUser);

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
        var updateButton = function () {
            var myData = metadataMgr.getUserData();
            if (!myData) { return; }
            if (loadingAvatar) {
                // Try again in 200ms
                window.clearTimeout(to);
                to = window.setTimeout(updateButton, 200);
                return;
            }
            loadingAvatar = true;
            var newName = myData.name;
            var url = myData.avatar;
            $displayName.text(newName || Messages.anonymous);
            if (accountName && oldUrl !== url) {
                $avatar.html('');
                Common.displayAvatar($avatar, url,
                        newName || Messages.anonymous, function ($img) {
                    oldUrl = url;
                    $userAdmin.find('> button').removeClass('cp-avatar');
                    if ($img) { $userAdmin.find('> button').addClass('cp-avatar'); }
                    loadingAvatar = false;
                });
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
                content: languages[l] // Pretty name of the language value
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
        var $title = $('<h3>').text(Messages.fm_newFile);
        var $description = $('<p>').html(Messages.creation_newPadModalDescription);
        $modal.find('.cp-modal').append($title);
        $modal.find('.cp-modal').append($description);

        var $advanced;

        var $container = $('<div>');
        var i = 0;
        var types = AppConfig.availablePadTypes.filter(function (p) {
            if (p === 'drive') { return; }
            if (p === 'teams') { return; }
            if (p === 'contacts') { return; }
            if (p === 'todo') { return; }
            if (p === 'file') { return; }
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
                if ($advanced && Util.isChecked($advanced)) {
                    common.sessionStorage.put(Constants.displayPadCreationScreen, true, function (){
                        common.openURL('/' + p + '/');
                    });
                    return;
                }
                common.sessionStorage.put(Constants.displayPadCreationScreen, "", function () {
                    common.openURL('/' + p + '/');
                });
            });
        });

        var selected = -1;
        var next = function () {
            selected = ++selected % types.length;
            $container.find('.cp-icons-element-selected').removeClass('cp-icons-element-selected');
            $container.find('#cp-newpad-icons-'+selected).addClass('cp-icons-element-selected');
        };

        $modal.off('keydown');
        $modal.keydown(function (e) {
            if (e.which === 9) {
                e.preventDefault();
                e.stopPropagation();
                next();
                return;
            }
            if (e.which === 13) {
                if ($container.find('.cp-icons-element-selected').length === 1) {
                    $container.find('.cp-icons-element-selected').click();
                }
                return;
            }
            if (e.which === 32 && $advanced) {
                $advanced.prop('checked', !$advanced.prop('checked'));
                $modal.focus();
                e.stopPropagation();
                e.preventDefault();
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
        var type = metadataMgr.getMetadataLazy().type;
        var fromFileData = privateData.fromFileData;

        var $body = $('body');
        var $creationContainer = $('<div>', { id: 'cp-creation-container' }).appendTo($body);
        var urlArgs = (Config.requireConf && Config.requireConf.urlArgs) || '';
        var l = h('div.cp-creation-logo', h('img', { src: '/customize/loading-logo.png?' + urlArgs }));
        $(l).appendTo($creationContainer);
        var $creation = $('<div>', { id: 'cp-creation', tabindex: 1 }).appendTo($creationContainer);

        // Title
        //var colorClass = 'cp-icon-color-'+type;
        //$creation.append(h('h2.cp-creation-title', Messages.newButtonTitle));
        var newPadH3Title = Messages['button_new' + type];
        $creation.append(h('h3.cp-creation-title', newPadH3Title));
        //$creation.append(h('h2.cp-creation-title.'+colorClass, Messages.newButtonTitle));

        // Deleted pad warning
        if (metadataMgr.getPrivateData().isDeleted) {
            $creation.append(h('div.cp-creation-deleted-container',
                h('div.cp-creation-deleted', Messages.creation_404)
            ));
        }

        var origin = privateData.origin;
        var createHelper = function (href, text) {
            var q = h('a.cp-creation-help.fa.fa-question-circle', {
                'data-cptippy-html': true,
                title: text,
                href: origin + href,
                target: "_blank",
                'data-tippy-placement': "right"
            });
            return q;
        };

        // Team pad
        var team;
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
            createHelper('/faq.html#keywords-owned', Messages.creation_owned1)
        ]);

        // Life time
        var expire = h('div.cp-creation-expire', [
            UI.createCheckbox('cp-creation-expire', Messages.creation_expire, false),
            h('span.cp-creation-expire-picker.cp-creation-slider', [
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
            createHelper('/faq.html#keywords-expiring', Messages.creation_expire2),
        ]);

        // Password
        var password = h('div.cp-creation-password', [
            UI.createCheckbox('cp-creation-password', Messages.creation_password, false),
            h('span.cp-creation-password-picker.cp-creation-slider', [
                UI.passwordInput({id: 'cp-creation-password-val'})
                /*h('input#cp-creation-password-val', {
                    type: "text" // TODO type password with click to show
                }),*/
            ]),
            //createHelper('#', "TODO: password protection adds another layer of security ........") // TODO
        ]);

        var right = h('span.fa.fa-chevron-right.cp-creation-template-more');
        var left = h('span.fa.fa-chevron-left.cp-creation-template-more');
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
            team,
            owned,
            expire,
            password,
            templates,
            createDiv
        ])).appendTo($creation);

        // Display templates

        var selected = 0; // Selected template in the list (highlighted)
        var TEMPLATES_DISPLAYED = 4; // Max templates displayed per page
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
            if (!appCfg.noTemplates) {
                allData.unshift({
                    name: Messages.creation_newTemplate,
                    id: -1,
                    //icon: h('span.fa.fa-bookmark')
                    icon: h('span.cptools.cptools-new-template')
                });
            }
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
                expireVal = ($('#cp-creation-expire-val').val() || 0) * unit;
            }
            // Password
            var passwordVal = $('#cp-creation-password').is(':checked') ?
                                $('#cp-creation-password-val').val() : undefined;

            var $template = $creation.find('.cp-creation-template-selected');
            var templateId = $template.data('id') || undefined;
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

    UIElements.onServerError = function (common, err, toolbar, cb) {
        //if (["EDELETED", "EEXPIRED", "ERESTRICTED"].indexOf(err.type) === -1) { return; }
        var priv = common.getMetadataMgr().getPrivateData();
        var msg = err.type;
        if (err.type === 'EEXPIRED') {
            msg = Messages.expiredError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
            if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        } else if (err.type === 'EDELETED') {
            if (priv.burnAfterReading) { return void cb(); }
            msg = Messages.deletedError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
            if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        } else if (err.type === 'ERESTRICTED') {
            msg = Messages.restrictedError;
            if (toolbar && typeof toolbar.failed === "function") { toolbar.failed(true); }
        }
        var sframeChan = common.getSframeChannel();
        sframeChan.event('EV_SHARE_OPEN', {hidden: true});
        UI.errorLoadingScreen(msg, Boolean(err.loaded), Boolean(err.loaded));
        (cb || function () {})();
    };

    UIElements.displayPasswordPrompt = function (common, cfg, isError) {
        var error;
        if (isError) { error = setHTML(h('p.cp-password-error'), Messages.password_error); }
        var info = h('p.cp-password-info', Messages.password_info);
        var password = UI.passwordInput({placeholder: Messages.password_placeholder});
        var $password = $(password);
        var button = h('button', Messages.password_submit);
        cfg = cfg || {};

        if (cfg.value && !isError) {
            $password.find('.cp-password-input').val(cfg.value);
        }

        var submit = function () {
            var value = $password.find('.cp-password-input').val();
            UI.addLoadingScreen();
            common.getSframeChannel().query('Q_PAD_PASSWORD_VALUE', value, function (err, data) {
                if (!data) {
                    UIElements.displayPasswordPrompt(common, cfg, true);
                }
            });
        };
        $password.find('.cp-password-input').on('keydown', function (e) { if (e.which === 13) { submit(); } });
        $(button).on('click', function () { submit(); });


        var block = h('div#cp-loading-password-prompt', [
            error,
            info,
            h('p.cp-password-form', [
                password,
                button
            ])
        ]);
        UI.errorLoadingScreen(block);

        $password.find('.cp-password-input').focus();
    };

    UIElements.displayBurnAfterReadingPage = function (common, cb) {
        var info = h('p.cp-password-info', Messages.burnAfterReading_warningAccess);
        var button = h('button.primary', Messages.burnAfterReading_proceed);

        $(button).on('click', function () {
            cb();
        });

        var block = h('div#cp-loading-burn-after-reading', [
            info,
            button
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
            $(modal.popup).find('a').click(function (e) {
                e.stopPropagation();
                e.preventDefault();
                modal.delete();
                common.openURL(priv.accounts.donateURL);
                Feedback.send('CROWDFUNDING_LINK');
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
    var autoStoreModal = {};
    UIElements.displayStorePadPopup = function (common, data) {
        if (storePopupState) { return; }
        storePopupState = true;
        if (data && data.stored) { return; } // We won't display the popup for dropped files
        var priv = common.getMetadataMgr().getPrivateData();

        // This pad will be deleted automatically, it shouldn't be stored
        if (priv.burnAfterReading) { return; }

        var typeMsg = priv.pathname.indexOf('/file/') !== -1 ? Messages.autostore_file :
                        priv.pathname.indexOf('/drive/') !== -1 ? Messages.autostore_sf :
                          Messages.autostore_pad;
        var text = Messages._getKey('autostore_notstored', [typeMsg]);
        var footer = Messages.autostore_settings;

        var hide = h('button.cp-corner-cancel', Messages.autostore_hide);
        var store = h('button.cp-corner-primary', Messages.autostore_store);
        var actions = h('div', [hide, store]);

        var initialHide = data && data.autoStore && data.autoStore === -1;
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

    UIElements.displayAddOwnerModal = function (common, data) {
        var priv = common.getMetadataMgr().getPrivateData();
        var sframeChan = common.getSframeChannel();
        var msg = data.content.msg;

        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
        var title = Util.fixHTML(msg.content.title);

        var text = Messages._getKey('owner_add', [name, title]);

        var link = h('a', {
            href: '#'
        }, Messages.requestEdit_viewPad);
        $(link).click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (msg.content.password) {
                common.sessionStorage.put('newPadPassword', msg.content.password, function () {
                    common.openURL(msg.content.href);
                });
                return;
            }
            common.openURL(msg.content.href);
        });

        var div = h('div', [
            UI.setHTML(h('p'), text),
            link
        ]);

        var dismiss = function () {
            common.mailbox.dismiss(data, function (err) {
                console.log(err);
            });
        };
        var answer = function (yes) {
            common.mailbox.sendTo("ADD_OWNER_ANSWER", {
                channel: msg.content.channel,
                href: msg.content.href,
                password: msg.content.password,
                title: msg.content.title,
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
                    // The callback is called when the pad is stored, independantly of the metadata command
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

                    // Remove yourself from the pending owners
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: msg.content.channel,
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

        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
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

        if (priv.friends && priv.friends[curve]) {
            $verified.addClass('cp-notifications-requestedit-verified');
            var f = priv.friends[curve];
            $verified.append(h('span.fa.fa-certificate'));
            var $avatar = $(h('span.cp-avatar')).appendTo($verified);
            $verified.append(h('p', Messages._getKey('isContact', [f.displayName])));
            common.displayAvatar($avatar, f.avatar, f.displayName);
        } else {
            $verified.append(Messages._getKey('isNotContact', [name]));
        }
        return verified;
    };

    UIElements.displayInviteTeamModal = function (common, data) {
        var msg = data.content.msg;

        var name = Util.fixHTML(msg.content.user.displayName) || Messages.anonymous;
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

        var MAX_TEAMS_SLOTS = Constants.MAX_TEAMS_SLOTS;
        var todo = function (yes) {
            var priv = common.getMetadataMgr().getPrivateData();
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
                notifications: f.notifications
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
            var name = data.name.replace(/[^a-zA-Z0-9]+/g, "-");
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
                    common.displayAvatar($(avatar), data.avatar, data.name);
                    return h('span.cp-mentions', {
                        'data-curve': data.curvePublic,
                        'data-notifications': data.notifications,
                        'data-profile': data.profile,
                        'data-name': Util.fixHTML(data.name),
                        'data-avatar': data.avatar || "",
                    }, [
                        avatar,
                        h('span.cp-mentions-name', {
                            contenteditable: false
                        }, data.name)
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
                            label: data.name,
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
            common.displayAvatar($(avatar), obj.avatar, obj.name);
            var li = h('li.cp-autocomplete-value', [
                avatar,
                h('span', obj.name)
            ]);
            return $(li).appendTo(ul);
        };
    };

    UIElements.isVisible = function (el, $container) {
        var size = $container.outerHeight();
        var pos = el.getBoundingClientRect();
        return (pos.bottom < size) && (pos.y > 0);
    };

    return UIElements;
});
