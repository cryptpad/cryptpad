define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/common-feedback.js',
    '/common/inner/common-modal.js',
    '/common/hyperscript.js',
    '/common/clipboard.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
], function ($, Util, Hash, UI, UIElements, Feedback, Modal, h, Clipboard,
             Messages, nThen) {
    var Share = {};

    var createShareWithFriends = function (config, onShare, linkGetter) {
        var common = config.common;
        var sframeChan = common.getSframeChannel();
        var title = config.title;
        var friends = config.friends || {};
        var teams = config.teams || {};
        var myName = common.getMetadataMgr().getUserData().name;
        var order = [];

        var smallCurves = Object.keys(friends).map(function (c) {
            return friends[c].curvePublic.slice(0,8);
        });

        var div = h('div.contains-nav');
        var $div = $(div);
        // Replace "copy link" by "share with friends" if at least one friend is selected
        // Also create the "share with friends" button if it doesn't exist
        var refreshButtons = function () {
            var $nav = $div.closest('.alertify').find('nav');

            var friendMode = $div.find('.cp-usergrid-user.cp-selected').length;
            if (friendMode) {
                $nav.find('button.cp-share-with-friends').prop('disabled', '');
            } else {
                $nav.find('button.cp-share-with-friends').prop('disabled', 'disabled');
            }
        };

        config.noInclude = true;
        Object.keys(friends).forEach(function (curve) {
            var data = friends[curve];
            if (curve.length > 40 && data.notifications) { return; }
            delete friends[curve];
        });

        var others = [];
        if (Object.keys(friends).length) {
            var friendsList = UIElements.getUserGrid(Messages.share_linkFriends, {
                common: common,
                data: friends,
                noFilter: false,
                large: true
            }, refreshButtons);
            var friendDiv = friendsList.div;
            $div.append(friendDiv);
            others = friendsList.icons;
        }

        if (Object.keys(teams).length) {
            var teamsList = UIElements.getUserGrid(Messages.share_linkTeam, {
                common: common,
                noFilter: true,
                large: true,
                data: teams
            }, refreshButtons);
            $div.append(teamsList.div);
        }

        var shareButton = {
            className: 'primary cp-share-with-friends',
            name: Messages.share_withFriends,
            onClick: function () {
                var href;
                nThen(function (waitFor) {
                    var w = waitFor();
                    // linkGetter can be async if this is a burn after reading URL
                    var res = linkGetter({}, function (url) {
                        if (!url) {
                            waitFor.abort();
                            return;
                        }
                        href = url;
                        setTimeout(w);
                    });
                    if (res && /^http/.test(res)) {
                        href = Hash.getRelativeHref(res);
                        setTimeout(w);
                        return;
                    }
                }).nThen(function () {
                    var $friends = $div.find('.cp-usergrid-user.cp-selected');
                    $friends.each(function (i, el) {
                        var curve = $(el).attr('data-curve');
                        var ed = $(el).attr('data-ed');
                        var friend = curve && friends[curve];
                        var team = teams[ed];
                        // If the selected element is a friend or a team without edit right,
                        // send a notification
                        var mailbox = friend || ((team && team.viewer) ? team : undefined);
                        if (mailbox) { // Friend
                            if (friends[curve] && !mailbox.notifications) { return; }
                            if (mailbox.notifications && mailbox.curvePublic) {
                                common.mailbox.sendTo("SHARE_PAD", {
                                    href: href,
                                    password: config.password,
                                    isTemplate: config.isTemplate,
                                    name: myName,
                                    title: title
                                }, {
                                    viewed: team && team.id,
                                    channel: mailbox.notifications,
                                    curvePublic: mailbox.curvePublic
                                });
                                return;
                            }
                        }
                        // If it's a team with edit right, add the pad directly
                        if (!team) { return; }
                        sframeChan.query('Q_STORE_IN_TEAM', {
                            href: href,
                            password: config.password,
                            path: config.isTemplate ? ['template'] : undefined,
                            title: title,
                            teamId: team.id
                        }, function (err) {
                            if (err) { return void console.error(err); }
                        });
                    });

                    UI.findCancelButton().click();

                    // Update the "recently shared with" array:
                    // Get the selected curves
                    var curves = $friends.toArray().map(function (el) {
                        return ($(el).attr('data-curve') || '').slice(0,8);
                    }).filter(function (x) { return x; });
                    // Prepend them to the "order" array
                    Array.prototype.unshift.apply(order, curves);
                    order = Util.deduplicateString(order);
                    // Make sure we don't have "old" friends and save
                    order = order.filter(function (curve) {
                        return smallCurves.indexOf(curve) !== -1;
                    });
                    common.setAttribute(['general', 'share-friends'], order);
                    if (onShare) {
                        onShare.fire();
                    }
                });
            },
            keys: [13]
        };

        common.getAttribute(['general', 'share-friends'], function (err, val) {
            order = val || [];
            // Sort friends by "recently shared with"
            others.sort(function (a, b) {
                var ca = ($(a).attr('data-curve') || '').slice(0,8);
                var cb = ($(b).attr('data-curve') || '').slice(0,8);
                if (!ca && !cb) { return 0; }
                if (!ca) { return 1; }
                if (!cb) { return -1; }
                var ia = order.indexOf(ca);
                var ib = order.indexOf(cb);
                if (ia === -1 && ib === -1) { return 0; }
                if (ia === -1) { return 1; }
                if (ib === -1) { return -1; }
                return ia - ib;
            });
            // Reorder the friend icons
            others.forEach(function (el, i) {
                $(el).attr('data-order', i).css('order', i);
            });
            // Display them
            $(friendDiv).find('.cp-usergrid-grid').detach();
            $(friendDiv).append(h('div.cp-usergrid-grid', others));
            refreshButtons();
        });
        return {
            content: div,
            buttons: [shareButton]
        };
    };

    var getEditableTeams = function (common, config) {
        var privateData = common.getMetadataMgr().getPrivateData();
        var teamsData = Util.tryParse(JSON.stringify(privateData.teams)) || {};
        var teams = {};
        Object.keys(teamsData).forEach(function (id) {
            // config.teamId only exists when we're trying to share a pad from a team drive
            // In this case, we don't want to share the pad with the current team
            if (config.teamId && config.teamId === id) { return; }
            var t = teamsData[id];
            teams[t.edPublic] = {
                viewer: !teamsData[id].hasSecondaryKey,
                notifications: t.notifications,
                curvePublic: t.curvePublic,
                displayName: t.name,
                edPublic: t.edPublic,
                avatar: t.avatar,
                id: id
            };
        });
        return teams;
    };
    var makeBurnAfterReadingUrl = function (common, href, channel, cb) {
        var keyPair = Hash.generateSignPair();
        var parsed = Hash.parsePadUrl(href);
        var newHref = parsed.getUrl({
            ownerKey: keyPair.safeSignKey
        });
        var sframeChan = common.getSframeChannel();
        var rtChannel;
        nThen(function (waitFor) {
            if (parsed.type !== "sheet") { return; }
            common.getPadAttribute('rtChannel', waitFor(function (err, chan) {
                rtChannel = chan;
            }));
        }).nThen(function (waitFor) {
            sframeChan.query('Q_SET_PAD_METADATA', {
                channel: channel,
                command: 'ADD_OWNERS',
                value: [keyPair.validateKey]
            }, waitFor(function (err) {
                if (err) {
                    waitFor.abort();
                    UI.warn(Messages.error);
                }
            }));
            if (rtChannel) {
                sframeChan.query('Q_SET_PAD_METADATA', {
                    channel: rtChannel,
                    command: 'ADD_OWNERS',
                    value: [keyPair.validateKey]
                }, waitFor(function (err) {
                    if (err) { console.error(err); }
                }));
            }
        }).nThen(function () {
            cb(newHref);
        });
    };

    var makeFaqLink = function (opts) {
        var link = h('span', [
            h('i.fa.fa-question-circle'),
            h('a', {href: '#'}, Messages.passwordFaqLink)
        ]);
        $(link).click(function () {
            opts.common.openURL(opts.origin + "/faq.html#security-pad_password");
        });
        return link;
    };

    var makeCancelButton = function() {
        return {
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        };
    };

    var getContactsTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;

        var hasFriends = opts.hasFriends;
        var onFriendShare = Util.mkEvent();

        var friendsObject = hasFriends ? createShareWithFriends(opts, onFriendShare, opts.getLinkValue) : UIElements.noContactsMessage(common);
        var friendsList = friendsObject.content;

        onFriendShare.reg(opts.saveValue);

        var contactsContent = h('div.cp-share-modal');
        var $contactsContent = $(contactsContent);
        $contactsContent.append(friendsList);

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            $contactsContent.append(h('div.alert.alert-primary', [
                h('i.fa.fa-unlock'),
                Messages.share_contactPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        // Burn after reading warning
        if (opts.barAlert) { $contactsContent.append(opts.barAlert.cloneNode(true)); }

        var contactButtons = friendsObject.buttons;
        contactButtons.unshift(makeCancelButton());

        cb(void 0, {
            content: contactsContent,
            buttons: contactButtons
        });
    };

    var getLinkTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        var origin = opts.origin;
        var pathname = opts.pathname;
        var hashes = opts.hashes;

        // Create modal
        var linkContent = opts.sharedFolder ? [
            h('label', Messages.sharedFolders_share),
            h('br'),
        ] : [
            UI.createCheckbox('cp-share-embed', Messages.share_linkEmbed, false, { mark: {tabindex:1} }),
        ];
        linkContent.push(h('div.cp-spacer'));
        linkContent.push(UI.dialog.selectableArea('', { id: 'cp-share-link-preview', tabindex: 1, rows:3}));

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            linkContent.push(h('div.alert.alert-primary', [
                h('i.fa.fa-lock'),
                Messages.share_linkPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        // warning about sharing links
        // when sharing a version hash, there is a similar warning and we want
        // to avoid alert fatigue
        if (!opts.versionHash) {
            var localStore = window.cryptpadStore;
            var dismissButton = h('span.fa.fa-times');
            var shareLinkWarning = h('div.alert.alert-warning.dismissable',
                { style: 'display: none;' },
                [
                    h('span.cp-inline-alert-text', Messages.share_linkWarning),
                    dismissButton
                ]);
            linkContent.push(shareLinkWarning);

            localStore.get('hide-alert-shareLinkWarning', function (val) {
                if (val === '1') { return; }
                $(shareLinkWarning).show();

                $(dismissButton).on('click', function () {
                    localStore.put('hide-alert-shareLinkWarning', '1');
                    $(shareLinkWarning).remove();
                });
            });
        }

        // Burn after reading
        if (opts.barAlert) { linkContent.push(opts.barAlert.cloneNode(true)); }

        var link = h('div.cp-share-modal', linkContent);
        var $link = $(link);
        $link.find('#cp-share-link-preview').val(opts.getLinkValue());
        $link.find('input[type="checkbox"]').on('change', function () {
            $link.find('#cp-share-link-preview').val(opts.getLinkValue({
                embed: Util.isChecked($link.find('#cp-share-embed'))
            }));
        });

        var linkButtons = [
            makeCancelButton(),
            !opts.sharedFolder && {
                className: 'secondary cp-nobar',
                name: Messages.share_linkOpen,
                onClick: function () {
                    opts.saveValue();
                    var v = opts.getLinkValue({
                        embed: Util.isChecked($link.find('#cp-share-embed'))
                    });
                    window.open(v);
                    return true;
                },
                keys: [[13, 'ctrl']]
            }, {
                className: 'primary cp-nobar',
                name: Messages.share_linkCopy,
                onClick: function () {
                    opts.saveValue();
                    var v = opts.getLinkValue({
                        embed: Util.isChecked($link.find('#cp-share-embed'))
                    });
                    var success = Clipboard.copy(v);
                    if (success) { UI.log(Messages.shareSuccess); }
                },
                keys: [13]
            }, {
                className: 'primary cp-bar',
                name:  Messages.share_bar,
                onClick: function () {
                    var barHref = origin + pathname + '#' + (hashes.viewHash || hashes.editHash);
                    makeBurnAfterReadingUrl(common, barHref, opts.channel, function (url) {
                        opts.burnAfterReadingUrl = url;
                        opts.$rights.find('input[type="radio"]').trigger('change');
                    });
                    return true;
                },
                keys: []
            }
        ];

        $link.find('.cp-bar').hide();

        cb(void 0, {
            content: link,
            buttons: linkButtons
        });
    };

    var getEmbedTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var embedContent = [
            h('p', Messages.viewEmbedTag),
            UI.dialog.selectableArea(opts.getEmbedValue(), { id: 'cp-embed-link-preview', tabindex: 1, rows: 3})
        ];

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            embedContent.push(h('div.alert.alert-primary', [
                h('i.fa.fa-lock'), ' ',
                Messages.share_embedPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        var embedButtons = [
            makeCancelButton(),
            {
                className: 'primary',
                name: Messages.share_linkCopy,
                onClick: function () {
                    Feedback.send('SHARE_EMBED');
                    var v = opts.getEmbedValue();
                    var success = Clipboard.copy(v);
                    if (success) { UI.log(Messages.shareSuccess); }
                },
                keys: [13]
        }];

        var embed = h('div.cp-share-modal', embedContent);
        var $embed = $(embed);

        $embed.find('#cp-embed-link-preview').val(opts.getEmbedValue());

        cb(void 0, {
            content: embed,
            buttons: embedButtons
        });
    };

    var getRightsHeader = function (common, opts) {
        var hashes = opts.hashes;
        var hash = hashes.editHash || hashes.viewHash;
        var origin = opts.origin;
        var pathname = opts.pathname;
        var parsed = Hash.parsePadUrl(pathname);
        var canPresent = ['code', 'slide'].indexOf(parsed.type) !== -1;
        var versionHash = hashes.viewHash && opts.versionHash;
        var canBAR = parsed.type !== 'drive' && !versionHash;

        var burnAfterReading = (hashes.viewHash && canBAR) ?
                    UI.createRadio('accessRights', 'cp-share-bar', Messages.burnAfterReading_linkBurnAfterReading, false, {
                        mark: {tabindex:1},
                        label: {style: "display: none;"}
                    }) : undefined;
        var rights = h('div.msg.cp-inline-radio-group', [
            h('label', Messages.share_linkAccess),
            h('div.radio-group',[
            UI.createRadio('accessRights', 'cp-share-editable-false',
                           Messages.share_linkView, true, { mark: {tabindex:1} }),
            canPresent ? UI.createRadio('accessRights', 'cp-share-present',
                            Messages.share_linkPresent, false, { mark: {tabindex:1} }) : undefined,
            UI.createRadio('accessRights', 'cp-share-editable-true',
                           Messages.share_linkEdit, false, { mark: {tabindex:1} })]),
            burnAfterReading
        ]);

        // Burn after reading
        // Check if we are an owner of this pad. If we are, we can show the burn after reading option.
        // When BAR is selected, display a red message indicating the consequence and add
        // the options to generate the BAR url
        opts.barAlert = h('div.alert.alert-danger.cp-alertify-bar-selected', {
            style: 'display: none;'
        }, Messages.burnAfterReading_warningLink);
        var channel = opts.channel = Hash.getSecrets('pad', hash, opts.password).channel;
        common.getPadMetadata({
            channel: channel
        }, function (obj) {
            if (!obj || obj.error) { return; }
            var priv = common.getMetadataMgr().getPrivateData();
            // Not an owner: don't display the burn after reading option
            if (!Array.isArray(obj.owners) || obj.owners.indexOf(priv.edPublic) === -1) {
                $(burnAfterReading).remove();
                return;
            }
            // When the burn after reading option is selected, transform the modal buttons
            $(burnAfterReading).css({
                display: 'flex'
            });
        });

        var $rights = $(rights);

        opts.saveValue = function () {
            var edit = Util.isChecked($rights.find('#cp-share-editable-true'));
            var present = Util.isChecked($rights.find('#cp-share-present'));
            common.setAttribute(['general', 'share'], {
                edit: edit,
                present: present
            });
        };
        opts.getLinkValue = function (initValue, cb) {
            var val = initValue || {};
            var edit = val.edit !== undefined ? val.edit : Util.isChecked($rights.find('#cp-share-editable-true'));
            var embed = val.embed;
            var present = val.present !== undefined ? val.present : Util.isChecked($rights.find('#cp-share-present'));
            var burnAfterReading = Util.isChecked($rights.find('#cp-share-bar'));
            if (versionHash) {
                edit = false;
                present = false;
                burnAfterReading = false;
            }
            if (burnAfterReading && !opts.burnAfterReadingUrl) {
                if (cb) { // Called from the contacts tab, "share" button
                    var barHref = origin + pathname + '#' + (hashes.viewHash || hashes.editHash);
                    return makeBurnAfterReadingUrl(common, barHref, channel, function (url) {
                        cb(url);
                    });
                }
                return Messages.burnAfterReading_generateLink;
            }
            var hash = (!hashes.viewHash || (edit && hashes.editHash)) ? hashes.editHash
                                                                       : hashes.viewHash;
            var href = burnAfterReading ? opts.burnAfterReadingUrl
                                             : (origin + pathname + '#' + hash);
            var parsed = Hash.parsePadUrl(href);
            return origin + parsed.getUrl({embed: embed, present: present, versionHash: versionHash});
        };
        opts.getEmbedValue = function () {
            var url = opts.getLinkValue({
                embed: true
            });
            return '<iframe src="' + url + '"></iframe>';
        };

        // disable edit share options if you don't have edit rights
        if (versionHash) {
            $rights.find('#cp-share-editable-false').attr('checked', true);
            $rights.find('#cp-share-present').removeAttr('checked').attr('disabled', true);
            $rights.find('#cp-share-editable-true').removeAttr('checked').attr('disabled', true);
        } else if (!hashes.editHash) {
            $rights.find('#cp-share-editable-false').attr('checked', true);
            $rights.find('#cp-share-editable-true').removeAttr('checked').attr('disabled', true);
        } else if (!hashes.viewHash) {
            $rights.find('#cp-share-editable-false').removeAttr('checked').attr('disabled', true);
            $rights.find('#cp-share-present').removeAttr('checked').attr('disabled', true);
            $rights.find('#cp-share-editable-true').attr('checked', true);
        }

        var getLink = function () {
            return $rights.parent().find('#cp-share-link-preview');
        };
        var getEmbed = function () {
            return $rights.parent().find('#cp-embed-link-preview');
        };

        // update values for link and embed preview when radio btns change
        $rights.find('input[type="radio"]').on('change', function () {
            getLink().val(opts.getLinkValue({
                embed: Util.isChecked($('.alertify').find('#cp-share-embed'))
            }));
            // Hide or show the burn after reading alert
            if (Util.isChecked($rights.find('#cp-share-bar')) && !opts.burnAfterReadingUrl) {
                $('.cp-alertify-bar-selected').show();
                // Show burn after reading button
                $('.alertify').find('.cp-bar').show();
                $('.alertify').find('.cp-nobar').hide();
                return;
            }
            getEmbed().val(opts.getEmbedValue());
            // Hide burn after reading button
            $('.alertify').find('.cp-nobar').show();
            $('.alertify').find('.cp-bar').hide();
            $('.cp-alertify-bar-selected').hide();
        });

        // Set default values
        common.getAttribute(['general', 'share'], function (err, val) {
            val = val || {};
            if (versionHash) {
                $rights.find('#cp-share-editable-false').prop('checked', true);
            } else if (val.present && canPresent) {
                $rights.find('#cp-share-editable-false').prop('checked', false);
                $rights.find('#cp-share-editable-true').prop('checked', false);
                $rights.find('#cp-share-present').prop('checked', true);
            } else if ((val.edit === false && hashes.viewHash) || !hashes.editHash) {
                $rights.find('#cp-share-editable-false').prop('checked', true);
                $rights.find('#cp-share-editable-true').prop('checked', false);
                $rights.find('#cp-share-present').prop('checked', false);
            } else {
                $rights.find('#cp-share-editable-true').prop('checked', true);
                $rights.find('#cp-share-editable-false').prop('checked', false);
                $rights.find('#cp-share-present').prop('checked', false);
            }
            delete val.embed;
            if (!canPresent) {
                delete val.present;
            }
            getLink().val(opts.getLinkValue(val));
        });
        common.getMetadataMgr().onChange(function () {
            // "hashes" is only available is the secure "share" app
            var _hashes = common.getMetadataMgr().getPrivateData().hashes;
            if (!_hashes) { return; }
            hashes = _hashes;
            getLink().val(opts.getLinkValue());
        });

        return $rights;
    };

    // In the share modal, tabs need to share data between themselves.
    // To do so we're using "opts" to store data and functions
    Share.getShareModal = function (common, opts, cb) {
        cb = cb || function () {};
        opts = opts || {};
        opts.access = true; // Allow the use of the modal even if the pad is not stored

        var hashes = opts.hashes;
        if (!hashes || (!hashes.editHash && !hashes.viewHash)) { return; }

        var teams = getEditableTeams(common, opts);
        opts.teams = teams;
        var hasFriends = opts.hasFriends = Object.keys(opts.friends || {}).length ||
                         Object.keys(teams).length;

        // check if the pad is password protected
        var pathname = opts.pathname;
        var hash = hashes.editHash || hashes.viewHash;
        var href = pathname + '#' + hash;
        var parsedHref = Hash.parsePadUrl(href);
        opts.hasPassword = parsedHref.hashData.password;


        var $rights = opts.$rights = getRightsHeader(common, opts);
        var resetTab = function () {
            $rights.show();
            $rights.find('label.cp-radio').show();
        };
        var onShowEmbed = function () {
            $rights.find('#cp-share-bar').closest('label').hide();
            $rights.find('input[type="radio"]:enabled').first().prop('checked', 'checked');
            $rights.find('input[type="radio"]').trigger('change');
        };
        var onShowContacts = function () {
            if (!hasFriends) {
                $rights.hide();
            }
        };

        var tabs = [{
            getTab: getContactsTab,
            title: Messages.share_contactCategory,
            icon: "fa fa-address-book",
            active: hasFriends,
            onShow: onShowContacts,
            onHide: resetTab
        }, {
            getTab: getLinkTab,
            title: Messages.share_linkCategory,
            icon: "fa fa-link",
            active: !hasFriends,
        }, {
            getTab: getEmbedTab,
            title: Messages.share_embedCategory,
            icon: "fa fa-code",
            onShow: onShowEmbed,
            onHide: resetTab
        }];
        Modal.getModal(common, opts, tabs, function (err, modal) {
            // Hide the burn-after-reading option by default
            var $modal = $(modal);
            $modal.find('.cp-bar').hide();

            // Prepend the "rights" radio selection
            $modal.find('.alertify-tabs-titles').after($rights);

            // Add the versionHash warning if needed
            if (opts.versionHash) {
                $rights.after(h('div.alert.alert-warning', [
                    h('i.fa.fa-history'),
                    UI.setHTML(h('span'), Messages.share_versionHash)
                ]));
            }

            // callback
            cb(err, modal);
        });
    };

    var getFileContactsTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        var friendsObject = opts.hasFriends ? createShareWithFriends(opts, null, opts.getLinkValue) : UIElements.noContactsMessage(common);
        var friendsList = friendsObject.content;

        var contactsContent = h('div.cp-share-modal');
        var $contactsContent = $(contactsContent);
        $contactsContent.append(friendsList);

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            $contactsContent.append(h('div.alert.alert-primary', [
                h('i.fa.fa-lock'),
                Messages.share_linkPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        var contactButtons = friendsObject.buttons;
        contactButtons.unshift(makeCancelButton());

        cb(void 0, {
            content: contactsContent,
            buttons: contactButtons
        });
    };

    var getFileLinkTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var linkContent = [
            UI.dialog.selectableArea(opts.getLinkValue(), {
                id: 'cp-share-link-preview', tabindex: 1, rows:2
            })
        ];

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            linkContent.push(h('div.alert.alert-primary', [
                h('i.fa.fa-lock'),
                Messages.share_linkPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        // warning about sharing links
        var localStore = window.cryptpadStore;
        var dismissButton = h('span.fa.fa-times');
        var shareLinkWarning = h('div.alert.alert-warning.dismissable',
            { style: 'display: none;' },
            [
                h('span.cp-inline-alert-text', Messages.share_linkWarning),
                dismissButton
            ]);
        linkContent.push(shareLinkWarning);

        localStore.get('hide-alert-shareLinkWarning', function (val) {
            if (val === '1') { return; }
            $(shareLinkWarning).css('display', 'flex');

            $(dismissButton).on('click', function () {
                localStore.put('hide-alert-shareLinkWarning', '1');
                $(shareLinkWarning).remove();
            });
        });

        var link = h('div.cp-share-modal', linkContent);
        var linkButtons = [
            makeCancelButton(),
            {
                className: 'primary',
                name: Messages.share_linkCopy,
                onClick: function () {
                    var v = opts.getLinkValue();
                    var success = Clipboard.copy(v);
                    if (success) { UI.log(Messages.shareSuccess);
                }
              },
              keys: [13]
            }
        ];

        cb(void 0, {
            content: link,
            buttons: linkButtons
        });
    };

    var getFileEmbedTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        var fileData = opts.fileData;

        var embed = h('div.cp-share-modal', [
            h('p', Messages.fileEmbedScript),
            UI.dialog.selectable(common.getMediatagScript()),
            h('p', Messages.fileEmbedTag),
            UI.dialog.selectable(common.getMediatagFromHref(fileData)),
        ]);

        // Show alert if the pad is password protected
        if (opts.hasPassword) {
            $(embed).append(h('div.alert.alert-primary', [
                h('i.fa.fa-lock'),
                Messages.share_linkPasswordAlert, h('br'),
                makeFaqLink(opts)
            ]));
        }

        var embedButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_mediatagCopy,
            onClick: function () {
                var v = common.getMediatagFromHref(opts.fileData);
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];

        cb(void 0, {
            content: embed,
            buttons: embedButtons
        });
    };

    Share.getFileShareModal = function (common, opts, cb) {
        cb = cb || function () {};
        opts = opts || {};
        opts.access = true; // Allow the use of the modal even if the pad is not stored

        var hashes = opts.hashes;
        if (!hashes || !hashes.fileHash) { return; }

        var teams = getEditableTeams(common, opts);
        opts.teams = teams;
        var hasFriends = opts.hasFriends = Object.keys(opts.friends || {}).length ||
                         Object.keys(teams).length;

        // check if the pad is password protected
        var origin = opts.origin;
        var pathname = opts.pathname;
        var url = opts.url = origin + pathname + '#' + hashes.fileHash;
        var parsedHref = Hash.parsePadUrl(url);
        opts.hasPassword = parsedHref.hashData.password;
        opts.getLinkValue = function () { return url; };

        var tabs = [{
            getTab: getFileContactsTab,
            title: Messages.share_contactCategory,
            icon: "fa fa-address-book",
            active: hasFriends,
        }, {
            getTab: getFileLinkTab,
            title: Messages.share_linkCategory,
            icon: "fa fa-link",
            active: !hasFriends,
        }, {
            getTab: getFileEmbedTab,
            title: Messages.share_embedCategory,
            icon: "fa fa-code",
        }];
        Modal.getModal(common, opts, tabs, cb);
    };

    return Share;
});
