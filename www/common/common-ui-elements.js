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
    '/common/media-tag.js',
    '/common/clipboard.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/customize/pages.js',
    '/bower_components/nthen/index.js',
    'css!/customize/fonts/cptools/style.css'
], function ($, Config, Util, Hash, Language, UI, Constants, Feedback, h, MediaTag, Clipboard,
             Messages, AppConfig, Pages, NThen) {
    var UIElements = {};

    // Configure MediaTags to use our local viewer
    if (MediaTag) {
        MediaTag.setDefaultConfig('pdf', {
            viewer: '/common/pdfjs/web/viewer.html'
        });
    }

    UIElements.updateTags = function (common, href) {
        var existing, tags;
        NThen(function(waitFor) {
            common.getSframeChannel().query("Q_GET_ALL_TAGS", null, waitFor(function(err, res) {
                if (err || res.error) { return void console.error(err || res.error); }
                existing = Object.keys(res.tags).sort();
            }));
        }).nThen(function (waitFor) {
            common.getPadAttribute('tags', waitFor(function (err, res) {
                if (err) {
                    if (err === 'NO_ENTRY') {
                        UI.alert(Messages.tags_noentry);
                    }
                    waitFor.abort();
                    return void console.error(err);
                }
                tags = res || [];
            }), href);
        }).nThen(function () {
            UI.dialog.tagPrompt(tags, existing, function (newTags) {
                if (!Array.isArray(newTags)) { return; }
                common.setPadAttribute('tags', newTags, null, href);
            });
        });
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
                reader.onload = function (e) { f(e.target.result, file); };
                reader.readAsText(file, type);
            });
        };
    };

    var getPropertiesData = function (common, cb) {
        var data = {};
        NThen(function (waitFor) {
            var base = common.getMetadataMgr().getPrivateData().origin;
            common.getPadAttribute('', waitFor(function (err, val) {
                if (err || !val) {
                    waitFor.abort();
                    return void cb(err || 'EEMPTY');
                }
                delete val.owners;
                delete val.expire;
                Util.extend(data, val);
                if (data.href) { data.href = base + data.href; }
                if (data.roHref) { data.roHref = base + data.roHref; }
            }));
            common.getPadMetadata(null, waitFor(function (obj) {
                if (obj && obj.error) { return; }
                data.owners = obj.owners;
                data.expire = obj.expire;
                data.pending_owners = obj.pending_owners;
            }));
        }).nThen(function () {
            cb(void 0, data);
        });
    };
    var createOwnerModal = function (common, data) {
        var friends = common.getFriends(true);
        var sframeChan = common.getSframeChannel();
        var priv = common.getMetadataMgr().getPrivateData();
        var user = common.getMetadataMgr().getUserData();
        var edPublic = priv.edPublic;
        var channel = data.channel;
        var owners = data.owners || [];
        var pending_owners = data.pending_owners || [];

        var redrawAll = function () {};

        var div1 = h('div.cp-share-friends.cp-share-column.cp-ownership');
        var div2 = h('div.cp-share-friends.cp-share-column.cp-ownership');
        var $div1 = $(div1);
        var $div2 = $(div2);

        // Remove owner column
        var drawRemove = function (pending) {
            var _owners = {};
            var o = (pending ? pending_owners : owners) || [];
            o.forEach(function (ed) {
                var f;
                Object.keys(friends).some(function (c) {
                    if (friends[c].edPublic === ed) {
                        f = friends[c];
                        return true;
                    }
                });
                if (ed === edPublic) {
                    f = f || user;
                    if (f.name) {
                        f.displayName = f.name;
                        f.edPublic = edPublic;
                    }
                }
                _owners[ed] = f || {
                    displayName: Messages._getKey('owner_unknownUser', [ed]),
                    notifications: true,
                    edPublic: ed,
                };
            });
            var msg = pending ? Messages.owner_removePendingText
                        : Messages.owner_removeText;
            var removeCol = UIElements.getFriendsList(msg, {
                common: common,
                friends: _owners,
                noFilter: true
            }, function () {
            });
            var $div = $(removeCol.div);
            var others1 = removeCol.others;
            $div.append(h('div.cp-share-grid', others1));
            $div.find('.cp-share-friend').click(function () {
                var sel = $(this).hasClass('cp-selected');
                if (!sel) {
                    $(this).addClass('cp-selected');
                } else {
                    var order = $(this).attr('data-order');
                    order = order ? 'order:'+order : '';
                    $(this).removeClass('cp-selected').attr('style', order);
                }
            });
            // When clicking on the remove button, we check the selected users.
            // If you try to remove yourself, we'll display an additional warning message
            var btnMsg = pending ? Messages.owner_removePendingButton : Messages.owner_removeButton;
            var removeButton = h('button.no-margin', btnMsg);
            $(removeButton).click(function () {
                // Check selection
                var $sel = $div.find('.cp-share-friend.cp-selected');
                var sel = $sel.toArray();
                if (!sel.length) { return; }
                var me = false;
                var toRemove = sel.map(function (el) {
                    var ed = $(el).attr('data-ed');
                    if (!ed) { return; }
                    if (ed === edPublic) { me = true; }
                    return ed;
                }).filter(function (x) { return x; });
                NThen(function (waitFor) {
                    var msg = me ? Messages.owner_removeMeConfirm : Messages.owner_removeConfirm;
                    UI.confirm(msg, waitFor(function (yes) {
                        if (!yes) {
                            waitFor.abort();
                            return;
                        }
                    }));
                }).nThen(function (waitFor) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: channel,
                        command: pending ? 'RM_PENDING_OWNERS' : 'RM_OWNERS',
                        value: toRemove
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            waitFor.abort();
                            redrawAll();
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                        UI.log(Messages.saved);
                    }));
                }).nThen(function (waitFor) {
                    sel.forEach(function (el) {
                        var friend = friends[$(el).attr('data-curve')];
                        if (!friend) { return; }
                        common.mailbox.sendTo("RM_OWNER", {
                            channel: channel,
                            title: data.title,
                            pending: pending,
                            user: {
                                displayName: user.name,
                                avatar: user.avatar,
                                profile: user.profile,
                                notifications: user.notifications,
                                curvePublic: user.curvePublic,
                                edPublic: priv.edPublic
                            }
                        }, {
                            channel: friend.notifications,
                            curvePublic: friend.curvePublic
                        }, waitFor());
                    });
                }).nThen(function () {
                    redrawAll();
                });
            });
            $div.append(h('p', removeButton));
            return $div;
        };

        // Add owners column
        var drawAdd = function () {
            var _friends = JSON.parse(JSON.stringify(friends));
            Object.keys(_friends).forEach(function (curve) {
                if (owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    pending_owners.indexOf(_friends[curve].edPublic) !== -1) {
                    delete _friends[curve];
                }
            });
            var addCol = UIElements.getFriendsList(Messages.owner_addText, {
                common: common,
                friends: _friends
            }, function () {
                //console.log(arguments);
            });
            $div2 = $(addCol.div);
            var others2 = addCol.others;
            $div2.append(h('div.cp-share-grid', others2));
            $div2.find('.cp-share-friend').click(function () {
                var sel = $(this).hasClass('cp-selected');
                if (!sel) {
                    $(this).addClass('cp-selected');
                } else {
                    var order = $(this).attr('data-order');
                    order = order ? 'order:'+order : '';
                    $(this).removeClass('cp-selected').attr('style', order);
                }
            });
            // When clicking on the add button, we get the selected users.
            var addButton = h('button.no-margin', Messages.owner_addButton);
            $(addButton).click(function () {
                // Check selection
                var $sel = $div2.find('.cp-share-friend.cp-selected');
                var sel = $sel.toArray();
                if (!sel.length) { return; }
                var toAdd = sel.map(function (el) {
                    return friends[$(el).attr('data-curve')].edPublic;
                }).filter(function (x) { return x; });

                NThen(function (waitFor) {
                    var msg = Messages.owner_addConfirm;
                    UI.confirm(msg, waitFor(function (yes) {
                        if (!yes) {
                            waitFor.abort();
                            return;
                        }
                    }));
                }).nThen(function (waitFor) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: channel,
                        command: 'ADD_PENDING_OWNERS',
                        value: toAdd
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            waitFor.abort();
                            redrawAll();
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                    }));
                }).nThen(function (waitFor) {
                    sel.forEach(function (el) {
                        var friend = friends[$(el).attr('data-curve')];
                        if (!friend) { return; }
                        common.mailbox.sendTo("ADD_OWNER", {
                            channel: channel,
                            href: data.href,
                            password: data.password,
                            title: data.title,
                            user: {
                                displayName: user.name,
                                avatar: user.avatar,
                                profile: user.profile,
                                notifications: user.notifications,
                                curvePublic: user.curvePublic,
                                edPublic: priv.edPublic
                            }
                        }, {
                            channel: friend.notifications,
                            curvePublic: friend.curvePublic
                        }, waitFor());
                    });
                }).nThen(function () {
                    redrawAll();
                    UI.log(Messages.saved);
                });
            });
            $div2.append(h('p', addButton));
            return $div2;
        };

        redrawAll = function (md) {
            var todo = function (obj) {
                if (obj && obj.error) { return; }
                owners = obj.owners || [];
                pending_owners = obj.pending_owners || [];
                $div1.empty();
                $div2.empty();
                $div1.append(drawRemove(false)).append(drawRemove(true));
                $div2.append(drawAdd());
            };

            if (md) { return void todo(md); }
            common.getPadMetadata({
                channel: data.channel
            }, todo);
        };

        $div1.append(drawRemove(false)).append(drawRemove(true));
        $div2.append(drawAdd());

        var handler = sframeChan.on('EV_RT_METADATA', function (md) {
            if (!$div1.length) {
                return void handler.stop();
            }
            owners = md.owners || [];
            pending_owners = md.pending_owners || [];
            redrawAll(md);
        });

        // Create modal
        var link = h('div.cp-share-columns', [
            div1,
            div2
            /*drawRemove()[0],
            drawAdd()[0]*/
        ]);
        var linkButtons = [{
            className: 'cancel',
            name: Messages.filePicker_close,
            onClick: function () {},
            keys: [27]
        }];
        return UI.dialog.customModal(link, {buttons: linkButtons});
    };
    var getRightsProperties = function (common, data, cb) {
        var $div = $('<div>');
        if (!data) { return void cb(void 0, $div); }

        var draw = function () {
            var $d = $('<div>');
            $('<label>', {'for': 'cp-app-prop-owners'}).text(Messages.creation_owners)
                .appendTo($d);
            var owners = Messages.creation_noOwner;
            var priv = common.getMetadataMgr().getPrivateData();
            var edPublic = priv.edPublic;
            var owned = false;
            if (data.owners && data.owners.length) {
                if (data.owners.indexOf(edPublic) !== -1) {
                    owned = true;
                }
                var names = [];
                var strangers = 0;
                data.owners.forEach(function (ed) {
                    // If a friend is an owner, add their name to the list
                    // otherwise, increment the list of strangers
                    if (ed === edPublic) {
                        names.push(Messages.yourself);
                        return;
                    }
                    if (!Object.keys(priv.friends || {}).some(function (c) {
                        var friend = priv.friends[c] || {};
                        if (friend.edPublic !== ed || c === 'me') { return; }
                        names.push(friend.displayName);
                        return true;
                    })) {
                        strangers++;
                    }
                });
                if (strangers) {
                    names.push(Messages._getKey('properties_unknownUser', [strangers]));
                }
                owners = names.join(', ');
            }
            $d.append(UI.dialog.selectable(owners, {
                id: 'cp-app-prop-owners',
            }));
            var parsed;
            if (data.href || data.roHref) {
                parsed = Hash.parsePadUrl(data.href || data.roHref);
            }
            if (owned && data.roHref && parsed.type !== 'drive' && parsed.hashData.type === 'pad') {
                var manageOwners = h('button.no-margin', Messages.owner_openModalButton);
                $(manageOwners).click(function () {
                    var modal = createOwnerModal(common, data);
                    UI.openCustomModal(modal, {
                        wide: true,
                    });
                });
                $d.append(h('p', manageOwners));
            }

            if (!data.noExpiration) {
                var expire = Messages.creation_expireFalse;
                if (data.expire && typeof (data.expire) === "number") {
                    expire = new Date(data.expire).toLocaleString();
                }
                $('<label>', {'for': 'cp-app-prop-expire'}).text(Messages.creation_expiration)
                    .appendTo($d);
                $d.append(UI.dialog.selectable(expire, {
                    id: 'cp-app-prop-expire',
                }));
            }

            if (!data.noPassword) {
                var hasPassword = data.password;
                if (hasPassword) {
                    $('<label>', {'for': 'cp-app-prop-password'}).text(Messages.creation_passwordValue)
                        .appendTo($d);
                    var password = UI.passwordInput({
                        id: 'cp-app-prop-password',
                        readonly: 'readonly'
                    });
                    var $pwInput = $(password).find('.cp-password-input');
                    $pwInput.val(data.password).click(function () {
                        $pwInput[0].select();
                    });
                    $d.append(password);
                }

                if (!data.noEditPassword && owned && parsed.hashData.type === 'pad' && parsed.type !== "sheet") { // FIXME SHEET fix password change for sheets
                    var sframeChan = common.getSframeChannel();
                    var changePwTitle = Messages.properties_changePassword;
                    var changePwConfirm = Messages.properties_confirmChange;
                    if (!hasPassword) {
                        changePwTitle = Messages.properties_addPassword;
                        changePwConfirm = Messages.properties_confirmNew;
                    }
                    $('<label>', {'for': 'cp-app-prop-change-password'})
                        .text(changePwTitle).appendTo($d);
                    var newPassword = UI.passwordInput({
                        id: 'cp-app-prop-change-password',
                        style: 'flex: 1;'
                    });
                    var passwordOk = h('button', Messages.properties_changePasswordButton);
                    var changePass = h('span.cp-password-container', [
                        newPassword,
                        passwordOk
                    ]);
                    $(passwordOk).click(function () {
                        var newPass = $(newPassword).find('input').val();
                        if (data.password === newPass ||
                            (!data.password && !newPass)) {
                            return void UI.alert(Messages.properties_passwordSame);
                        }
                        UI.confirm(changePwConfirm, function (yes) {
                            if (!yes) { return; }
                            sframeChan.query("Q_PAD_PASSWORD_CHANGE", {
                                href: data.href || data.roHref,
                                password: newPass
                            }, function (err, data) {
                                if (err || data.error) {
                                    return void UI.alert(Messages.properties_passwordError);
                                }
                                UI.findOKButton().click();
                                // If we didn't have a password, we have to add the /p/
                                // If we had a password and we changed it to a new one, we just have to reload
                                // If we had a password and we removed it, we have to remove the /p/
                                if (data.warning) {
                                    return void UI.alert(Messages.properties_passwordWarning, function () {
                                        common.gotoURL(hasPassword && newPass ? undefined : (data.href || data.roHref));
                                    }, {force: true});
                                }
                                return void UI.alert(Messages.properties_passwordSuccess, function () {
                                    common.gotoURL(hasPassword && newPass ? undefined : (data.href || data.roHref));
                                }, {force: true});
                            });
                        });
                    });
                    $d.append(changePass);
                }
            }
            return $d;
        };

        var sframeChan = common.getSframeChannel();
        var handler = sframeChan.on('EV_RT_METADATA', function (md) {
            if (!$div.length) {
                handler.stop();
                return;
            }
            md = JSON.parse(JSON.stringify(md));
            data.owners = md.owners;
            data.expire = md.expire;
            data.pending_owners = md.pending_owners;
            $div.empty();
            $div.append(draw());
        });
        $div.append(draw());

        cb(void 0, $div);
    };
    var getPadProperties = function (common, data, cb) {
        var $d = $('<div>');
        if (!data || (!data.href && !data.roHref)) { return void cb(void 0, $d); }

        if (data.href) {
            $('<label>', {'for': 'cp-app-prop-link'}).text(Messages.editShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.href, {
                id: 'cp-app-prop-link',
            }));
        }

        if (data.roHref) {
            $('<label>', {'for': 'cp-app-prop-rolink'}).text(Messages.viewShare).appendTo($d);
            $d.append(UI.dialog.selectable(data.roHref, {
                id: 'cp-app-prop-rolink',
            }));
        }

        if (data.tags && Array.isArray(data.tags)) {
            $('<label>', {'for': 'cp-app-prop-tags'}).text(Messages.fm_prop_tagsList).appendTo($d);
            $d.append(UI.dialog.selectable(data.tags.join(', '), {
                id: 'cp-app-prop-tags',
            }));
        }

        if (data.ctime) {
            $('<label>', {'for': 'cp-app-prop-ctime'}).text(Messages.fm_creation)
                .appendTo($d);
            $d.append(UI.dialog.selectable(new Date(data.ctime).toLocaleString(), {
                id: 'cp-app-prop-ctime',
            }));
        }

        if (data.atime) {
            $('<label>', {'for': 'cp-app-prop-atime'}).text(Messages.fm_lastAccess)
                .appendTo($d);
            $d.append(UI.dialog.selectable(new Date(data.atime).toLocaleString(), {
                id: 'cp-app-prop-atime',
            }));
        }

        if (common.isLoggedIn()) {
            // check the size of this file...
            var bytes = 0;
            NThen(function (waitFor) {
                var chan = [data.channel];
                if (data.rtChannel) { chan.push(data.rtChannel); }
                if (data.lastVersion) { chan.push(Hash.hrefToHexChannelId(data.lastVersion)); }
                chan.forEach(function (c) {
                    common.getFileSize(c, waitFor(function (e, _bytes) {
                        if (e) {
                            // there was a problem with the RPC
                            console.error(e);
                        }
                        bytes += _bytes;
                    }));
                });
            }).nThen(function () {
                if (bytes === 0) { return void cb(void 0, $d); }
                var KB = Util.bytesToKilobytes(bytes);

                var formatted = Messages._getKey('formattedKB', [KB]);
                $('<br>').appendTo($d);

                $('<label>', {
                    'for': 'cp-app-prop-size'
                }).text(Messages.fc_sizeInKilobytes).appendTo($d);

                $d.append(UI.dialog.selectable(formatted, {
                    id: 'cp-app-prop-size',
                }));

        if (data.sharedFolder && false) {
            $('<label>', {'for': 'cp-app-prop-channel'}).text('Channel ID').appendTo($d);
            if (AppConfig.pinBugRecovery) { $d.append(h('p', AppConfig.pinBugRecovery)); }
            $d.append(UI.dialog.selectable(data.channel, {
                id: 'cp-app-prop-link',
            }));
        }

                cb(void 0, $d);
            });
        } else {
            cb(void 0, $d);
        }


    };
    UIElements.getProperties = function (common, data, cb) {
        var c1;
        var c2;
        NThen(function (waitFor) {
            getPadProperties(common, data, waitFor(function (e, c) {
                c1 = c[0];
            }));
            getRightsProperties(common, data, waitFor(function (e, c) {
                c2 = c[0];
            }));
        }).nThen(function () {
            var tabs = UI.dialog.tabs([{
                title: Messages.fc_prop,
                content: c1
            }, {
                title: Messages.creation_propertiesTitle,
                content: c2
            }]);
            cb (void 0, $(tabs));
        });
    };

    UIElements.getFriendsList = function (label, config, onSelect) {
        var common = config.common;
        var friends = config.friends;
        if (!friends) { return; }

        var others = Object.keys(friends).map(function (curve, i) {
            if (curve.length <= 40) { return; }
            var data = friends[curve];
            if (!data.notifications) { return; }
            var name = data.displayName || Messages.anonymous;
            var avatar = h('span.cp-share-friend-avatar.cp-avatar');
            UIElements.displayAvatar(common, $(avatar), data.avatar, name);
            return h('div.cp-share-friend', {
                'data-ed': data.edPublic,
                'data-curve': data.curvePublic,
                'data-name': name,
                'data-order': i,
                title: name,
                style: 'order:'+i+';'
            },[
                avatar,
                h('span.cp-share-friend-name', name)
            ]);
        }).filter(function (x) { return x; });

        var noOthers = others.length === 0 ? '.cp-recent-only' : '';

        var buttonSelect = h('button.cp-share-with-friends', Messages.share_selectAll);
        var buttonDeselect = h('button.cp-share-with-friends', Messages.share_deselectAll);
        var inputFilter = h('input', {
            placeholder: Messages.share_filterFriend
        });

        var div = h('div.cp-share-friends.cp-share-column' + noOthers, [
            h('label', label),
            h('div.cp-share-grid-filter', config.noFilter ? undefined : [
                inputFilter,
                buttonSelect,
                buttonDeselect
            ]),
        ]);
        var $div = $(div);

        // Fill with fake friends to have a uniform spacing (from the flexbox)
        var makeFake = function () {
            return h('div.cp-share-friend.cp-fake-friend', {
                style: 'order:9999999;'
            });
        };
        var addFake = function (els) {
            $div.find('.cp-fake-friend').remove();
            var n = (6 - els.length%6)%6;
            for (var j = 0; j < n; j++) {
                els.push(makeFake);
            }
        };
        addFake(others);

        // Hide friends when they are filtered using the text input
        var redraw = function () {
            var name = $(inputFilter).val().trim().replace(/"/g, '');
            $div.find('.cp-share-friend').show();
            if (name) {
                $div.find('.cp-share-friend:not(.cp-selected):not([data-name*="'+name+'"])').hide();
            }

            // Redraw fake friends
            $div.find('.cp-fake-friend').remove();
            var visible = $div.find('.cp-share-friend:visible').length;
            var n = (6 - visible%6)%6;
            for (var i = 0; i<n; i++) {
                $div.find('.cp-share-grid').append(makeFake());
            }
        };

        $(inputFilter).on('keydown keyup change', redraw);

        $(buttonSelect).click(function () {
            $div.find('.cp-share-friend:not(.cp-fake-friend):not(.cp-selected):visible').addClass('cp-selected');
            onSelect();
        });
        $(buttonDeselect).click(function () {
            $div.find('.cp-share-friend.cp-selected').removeClass('cp-selected').each(function (i, el) {
                var order = $(el).attr('data-order');
                if (!order) { return; }
                $(el).attr('style', 'order:'+order);
            });
            redraw();
            onSelect();
        });

        return {
            others: others,
            div: div
        };
    };


    var createShareWithFriends = function (config, onShare) {
        var common = config.common;
        var title = config.title;
        var friends = config.friends;
        var myName = common.getMetadataMgr().getUserData().name;
        if (!friends) { return; }
        var order = [];

        var smallCurves = Object.keys(friends).map(function (c) {
            return friends[c].curvePublic.slice(0,8);
        });

        var $div;
        // Replace "copy link" by "share with friends" if at least one friend is selected
        // Also create the "share with friends" button if it doesn't exist
        var refreshButtons = function () {
            var $nav = $div.parents('.alertify').find('nav');
            if (!$nav.find('.cp-share-with-friends').length) {
                var button = h('button.primary.cp-share-with-friends', {
                    'data-keys': '[13]'
                }, Messages.share_withFriends);
                $(button).click(function () {
                    var href = Hash.getRelativeHref($('#cp-share-link-preview').val());
                    var $friends = $div.find('.cp-share-friend.cp-selected');
                    $friends.each(function (i, el) {
                        var curve = $(el).attr('data-curve');
                        if (!curve || !friends[curve]) { return; }
                        var friend = friends[curve];
                        if (!friend.notifications || !friend.curvePublic) { return; }
                        common.mailbox.sendTo("SHARE_PAD", {
                            href: href,
                            password: config.password,
                            isTemplate: config.isTemplate,
                            name: myName,
                            title: title
                        }, {
                            channel: friend.notifications,
                            curvePublic: friend.curvePublic
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
                $nav.append(button);
            }

            var friendMode = $div.find('.cp-share-friend.cp-selected').length;
            if (friendMode) {
                $nav.find('button.primary[data-keys]').hide();
                $nav.find('button.cp-share-with-friends').show();
            } else {
                $nav.find('button.primary[data-keys]').show();
                $nav.find('button.cp-share-with-friends').hide();
            }
        };

        var friendsList = UIElements.getFriendsList(Messages.share_linkFriends, config, refreshButtons);
        var div = friendsList.div;
        $div = $(div);
        var others = friendsList.others;

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
                if ($(el).is('.cp-fake-friend')) { return; }
                $(el).attr('data-order', i).css('order', i);
            });
            // Display them
            $div.append(h('div.cp-share-grid', others));
            $div.find('.cp-share-friend').click(function () {
                var sel = $(this).hasClass('cp-selected');
                if (!sel) {
                    $(this).addClass('cp-selected');
                } else {
                    var order = $(this).attr('data-order');
                    order = order ? 'order:'+order : '';
                    $(this).removeClass('cp-selected').attr('style', order);
                }
                refreshButtons();
            });
        });
        return div;
    };

    UIElements.createShareModal = function (config) {
        var origin = config.origin;
        var pathname = config.pathname;
        var hashes = config.hashes;
        var common = config.common;

        if (!hashes) { return; }

        // Share link tab
        var hasFriends = Object.keys(config.friends || {}).length !== 0;
        var onFriendShare = Util.mkEvent();
        var friendsList = hasFriends ? createShareWithFriends(config, onFriendShare) : undefined;
        var friendsUIClass = hasFriends ? '.cp-share-columns' : '';

        var link = h('div.cp-share-modal' + friendsUIClass, [
            h('div.cp-share-column', [
                hasFriends ? h('p', Messages.share_description) : undefined,
                h('label', Messages.share_linkAccess),
                h('br'),
                UI.createRadio('cp-share-editable', 'cp-share-editable-true',
                               Messages.share_linkEdit, true, { mark: {tabindex:1} }),
                UI.createRadio('cp-share-editable', 'cp-share-editable-false',
                               Messages.share_linkView, false, { mark: {tabindex:1} }),
                h('br'),
                h('label', Messages.share_linkOptions),
                h('br'),
                UI.createCheckbox('cp-share-embed', Messages.share_linkEmbed, false, { mark: {tabindex:1} }),
                UI.createCheckbox('cp-share-present', Messages.share_linkPresent, false, { mark: {tabindex:1} }),
                h('br'),
                UI.dialog.selectable('', { id: 'cp-share-link-preview', tabindex: 1 }),
            ]),
            friendsList
        ]);
        if (!hashes.editHash) {
            $(link).find('#cp-share-editable-false').attr('checked', true);
            $(link).find('#cp-share-editable-true').removeAttr('checked').attr('disabled', true);
        }
        var saveValue = function () {
            var edit = Util.isChecked($(link).find('#cp-share-editable-true'));
            var embed = Util.isChecked($(link).find('#cp-share-embed'));
            var present = Util.isChecked($(link).find('#cp-share-present'));
            common.setAttribute(['general', 'share'], {
                edit: edit,
                embed: embed,
                present: present
            });
        };
        onFriendShare.reg(saveValue);
        var getLinkValue = function (initValue) {
            var val = initValue || {};
            var edit = val.edit !== undefined ? val.edit : Util.isChecked($(link).find('#cp-share-editable-true'));
            var embed = val.embed !== undefined ? val.embed : Util.isChecked($(link).find('#cp-share-embed'));
            var present = val.present !== undefined ? val.present : Util.isChecked($(link).find('#cp-share-present'));

            var hash = (!hashes.viewHash || (edit && hashes.editHash)) ? hashes.editHash : hashes.viewHash;
            var href = origin + pathname + '#' + hash;
            var parsed = Hash.parsePadUrl(href);
            return origin + parsed.getUrl({embed: embed, present: present});
        };
        $(link).find('#cp-share-link-preview').val(getLinkValue());
        $(link).find('input[type="radio"], input[type="checkbox"]').on('change', function () {
            $(link).find('#cp-share-link-preview').val(getLinkValue());
        });
        var linkButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                saveValue();
                var v = getLinkValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.share_linkOpen,
            onClick: function () {
                saveValue();
                var v = getLinkValue();
                window.open(v);
            },
            keys: [[13, 'ctrl']]
        }];
        var frameLink = UI.dialog.customModal(link, {
            buttons: linkButtons,
            onClose: config.onClose,
        });

        // Embed tab
        var getEmbedValue = function () {
            var hash = hashes.viewHash || hashes.editHash;
            var href = origin + pathname + '#' + hash;
            var parsed = Hash.parsePadUrl(href);
            var url = origin + parsed.getUrl({embed: true, present: true});
            return '<iframe src="' + url + '"></iframe>';
        };
        var embed = h('div.cp-share-modal', [
            h('h3', Messages.viewEmbedTitle),
            h('p', Messages.viewEmbedTag),
            h('br'),
            UI.dialog.selectable(getEmbedValue())
        ]);
        var embedButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                var v = getEmbedValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameEmbed = UI.dialog.customModal(embed, {
            buttons: embedButtons,
            onClose: config.onClose,
        });

        // Create modal
        var tabs = [{
            title: Messages.share_linkCategory,
            content: frameLink
        }, {
            title: Messages.share_embedCategory,
            content: frameEmbed
        }];
        if (typeof(AppConfig.customizeShareOptions) === 'function') {
            AppConfig.customizeShareOptions(hashes, tabs, {
                type: 'DEFAULT',
                origin: origin,
                pathname: pathname
            });
        }
        common.getAttribute(['general', 'share'], function (err, val) {
            val = val || {};
            if (val.edit === false || !hashes.editHash) {
                $(link).find('#cp-share-editable-false').prop('checked', true);
                $(link).find('#cp-share-editable-true').prop('checked', false);
            } else {
                $(link).find('#cp-share-editable-true').prop('checked', true);
                $(link).find('#cp-share-editable-false').prop('checked', false);
            }
            if (val.embed) { $(link).find('#cp-share-embed').prop('checked', true); }
            if (val.present) { $(link).find('#cp-share-present').prop('checked', true); }
            $(link).find('#cp-share-link-preview').val(getLinkValue(val));
        });
        common.getMetadataMgr().onChange(function () {
            // "hashes" is only available is the secure "share" app
            hashes = common.getMetadataMgr().getPrivateData().hashes;
            if (!hashes) { return; }
            $(link).find('#cp-share-link-preview').val(getLinkValue());
        });
        return tabs;
    };
    UIElements.createFileShareModal = function (config) {
        var origin = config.origin;
        var pathname = config.pathname;
        var hashes = config.hashes;
        var common = config.common;
        var fileData = config.fileData;

        if (!hashes.fileHash) { throw new Error("You must provide a file hash"); }
        var url = origin + pathname + '#' + hashes.fileHash;


        // Share link tab
        var hasFriends = Object.keys(config.friends || {}).length !== 0;
        var friendsList = hasFriends ? createShareWithFriends(config) : undefined;
        var friendsUIClass = hasFriends ? '.cp-share-columns' : '';
        var link = h('div.cp-share-modal' + friendsUIClass, [
            h('div.cp-share-column', [
                hasFriends ? h('p', Messages.share_description) : undefined,
                UI.dialog.selectable('', { id: 'cp-share-link-preview' }),
            ]),
            friendsList
        ]);
        var getLinkValue = function () { return url; };
        $(link).find('#cp-share-link-preview').val(getLinkValue());
        var linkButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                var v = getLinkValue();
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameLink = UI.dialog.customModal(link, {
            buttons: linkButtons,
            onClose: config.onClose,
        });

        // Embed tab
        var embed = h('div.cp-share-modal', [
            h('h3', Messages.fileEmbedTitle),
            h('p', Messages.fileEmbedScript),
            h('br'),
            UI.dialog.selectable(common.getMediatagScript()),
            h('p', Messages.fileEmbedTag),
            h('br'),
            UI.dialog.selectable(common.getMediatagFromHref(fileData)),
        ]);
        var embedButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_mediatagCopy,
            onClick: function () {
                var v = common.getMediatagFromHref(fileData);
                var success = Clipboard.copy(v);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        var frameEmbed = UI.dialog.customModal(embed, {
            buttons: embedButtons,
            onClose: config.onClose,
        });

        // Create modal
        var tabs = [{
            title: Messages.share_linkCategory,
            content: frameLink
        }, {
            title: Messages.share_embedCategory,
            content: frameEmbed
        }];
        if (typeof(AppConfig.customizeShareOptions) === 'function') {
            AppConfig.customizeShareOptions(hashes, tabs, {
                type: 'FILE',
                origin: origin,
                pathname: pathname
            });
        }
        return tabs;
    };
    UIElements.createSFShareModal = function (config) {
        var origin = config.origin;
        var pathname = config.pathname;
        var hashes = config.hashes;

        if (!hashes.editHash) { throw new Error("You must provide a valid hash"); }
        var url = origin + pathname + '#' + hashes.editHash;

        // Share link tab
        var hasFriends = Object.keys(config.friends || {}).length !== 0;
        var friendsList = hasFriends ? createShareWithFriends(config) : undefined;
        var friendsUIClass = hasFriends ? '.cp-share-columns' : '';
        var link = h('div.cp-share-modal' + friendsUIClass, [
            h('div.cp-share-column', [
                h('label', Messages.sharedFolders_share),
                h('br'),
                hasFriends ? h('p', Messages.share_description) : undefined,
                UI.dialog.selectable(url, { id: 'cp-share-link-preview', tabindex: 1 })
            ]),
            friendsList
        ]);
        var linkButtons = [{
            className: 'cancel',
            name: Messages.cancel,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.share_linkCopy,
            onClick: function () {
                var success = Clipboard.copy(url);
                if (success) { UI.log(Messages.shareSuccess); }
            },
            keys: [13]
        }];
        return UI.dialog.customModal(link, {buttons: linkButtons});
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
                    .click(importContent('text/plain', function (content, file) {
                        callback(content, file);
                    }, {accept: data ? data.accept : undefined}));
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
            case 'importtemplate':
                if (!AppConfig.enableTemplates) { return; }
                if (!common.isLoggedIn()) { return; }
                button = $('<button>', {
                    'class': 'fa fa-upload cp-toolbar-icon-import',
                    title: Messages.template_import,
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
                    title: Messages.saveTemplateButton,
                    class: 'fa fa-bookmark cp-toolbar-icon-template'
                });
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
                    title: Messages.forgetButtonTitle,
                    'class': "fa fa-trash cp-toolbar-icon-forget"
                });
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
                                sframeChan.query('Q_MOVE_TO_TRASH', null, function (err) {
                                    if (err) { return void callback(err); }
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
                button = $('<button>', {
                    title: Messages.presentButtonTitle,
                    'class': "fa fa-play-circle cp-toolbar-icon-present", // used in slide.js
                });
                break;
            case 'preview':
                button = $('<button>', {
                    title: Messages.previewButtonTitle,
                    'class': "fa fa-eye cp-toolbar-icon-preview",
                });
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
            case 'more':
                button = $('<button>', {
                    title: Messages.moreActions,
                    'class': "cp-toolbar-drawer-button fa fa-ellipsis-h",
                });
                break;
            case 'mediatag':
                button = $('<button>', {
                    'class': 'fa fa-picture-o cp-toolbar-icon-mediatag',
                    title: Messages.filePickerButton,
                })
                .click(common.prepareFeedback(type));
                break;
            case 'savetodrive':
                button = $('<button>', {
                    'class': 'fa fa-cloud-upload cp-toolbar-icon-savetodrive',
                    title: Messages.canvas_saveToDrive,
                })
                .click(common.prepareFeedback(type));
                break;
            case 'hashtag':
                button = $('<button>', {
                    'class': 'fa fa-hashtag cp-toolbar-icon-hashtag',
                    title: Messages.tags_title,
                })
                .click(common.prepareFeedback(type))
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
                button = $('<button>', {
                    'class': 'fa fa-caret-down cp-toolbar-icon-toggle',
                });
                window.setTimeout(function () {
                    button.attr('title', data.title);
                });
                var updateIcon = function (isVisible) {
                    button.removeClass('fa-caret-down').removeClass('fa-caret-up');
                    if (!isVisible) { button.addClass('fa-caret-down'); }
                    else { button.addClass('fa-caret-up'); }
                };
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
                    updateIcon(isVisible);
                });
                updateIcon(data.element.is(':visible'));
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
                        getPropertiesData(common, function (e, data) {
                            if (e) { return void console.error(e); }
                            UIElements.getProperties(common, data, function (e, $prop) {
                                if (e) { return void console.error(e); }
                                UI.alert($prop[0], undefined, true);
                            });
                        });
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
            default:
                data = data || {};
                var icon = data.icon || "fa-question";
                button = $('<button>', {
                    'class': "fa " + icon,
                })
                .click(common.prepareFeedback(data.name || 'DEFAULT'));
                //.click(common.prepareFeedback(type));
                if (callback) {
                    button.click(callback);
                }
                if (data.title) { button.attr('title', data.title); }
                if (data.style) { button.attr('style', data.style); }
                if (data.id) { button.attr('id', data.id); }
                if (data.hiddenReadOnly) { button.addClass('cp-hidden-if-readonly'); }
                if (data.name) {
                    button.addClass('cp-toolbar-icon-'+data.name);
                    button.click(common.prepareFeedback(data.name));
                }
                if (data.text) {
                    $('<span>', {'class': 'cp-toolbar-drawer-element'}).text(data.text)
                        .appendTo(button);
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
                'class': 'fa ' + actions[k].icon,
                title: Messages['mdToolbar_' + k] || k
            }).click(onClick).appendTo($toolbar);
        }
        $('<button>', {
            'class': 'fa fa-question cp-markdown-help',
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

        var closeButton = h('span.cp-help-close.fa.fa-window-close');
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

    // Avatars

    UIElements.displayMediatagImage = function (Common, $tag, cb) {
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
                        var img = new Image();
                        img.onload = function () {
                            var _cb = cb;
                            cb = $.noop;
                            _cb(null, $image, img);
                        };
                        img.src = $image.attr('src');
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

    var emoji_patt = /([\uD800-\uDBFF][\uDC00-\uDFFF])/;
    var isEmoji = function (str) {
      return emoji_patt.test(str);
    };
    var emojiStringToArray = function (str) {
      var split = str.split(emoji_patt);
      var arr = [];
      for (var i=0; i<split.length; i++) {
        var char = split[i];
        if (char !== "") {
          arr.push(char);
        }
      }
      return arr;
    };
    var getFirstEmojiOrCharacter = function (str) {
      if (!str || !str.trim()) { return '?'; }
      var emojis = emojiStringToArray(str);
      return isEmoji(emojis[0])? emojis[0]: str[0];
    };
    var avatars = {};
    UIElements.setAvatar = function (hash, data) {
        avatars[hash] = data;
    };
    UIElements.getAvatar = function (hash) {
        return avatars[hash];
    };
    UIElements.displayAvatar = function (common, $container, href, name, cb) {
        var displayDefault = function () {
            var text = getFirstEmojiOrCharacter(name);
            var $avatar = $('<span>', {'class': 'cp-avatar-default'}).text(text);
            $container.append($avatar);
            if (cb) { cb(); }
        };
        if (!window.Symbol) { return void displayDefault(); } // IE doesn't have Symbol
        if (!href) { return void displayDefault(); }

        var centerImage = function ($img, $image, img) {
            var w = img.width;
            var h = img.height;
            if (w>h) {
                $image.css('max-height', '100%');
                $img.css('flex-direction', 'column');
                if (cb) { cb($img); }
                return;
            }
            $image.css('max-width', '100%');
            $img.css('flex-direction', 'row');
            if (cb) { cb($img); }
        };

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
                if (e || !data) {
                    displayDefault();
                    return void console.error(e || "404 avatar");
                }
                if (typeof data !== "number") { return void displayDefault(); }
                if (Util.bytesToMegabytes(data) > 0.5) { return void displayDefault(); }
                var $img = $('<media-tag>').appendTo($container);
                $img.attr('src', src);
                $img.attr('data-crypto-key', 'cryptpad:' + cryptKey);
                UIElements.displayMediatagImage(common, $img, function (err, $image, img) {
                    if (err) { return void console.error(err); }
                    centerImage($img, $image,  img);
                });
            });
        }
    };

    /*  Create a usage bar which keeps track of how much storage space is used
        by your CryptDrive. The getPinnedUsage RPC is one of the heavier calls,
        so we throttle its usage. Clients will not update more than once per
        LIMIT_REFRESH_RATE. It will be update at least once every three such intervals
        If changes are made to your drive in the interim, they will trigger an
        update.
    */
    var LIMIT_REFRESH_RATE = 30000; // milliseconds
    UIElements.createUsageBar = function (common, cb) {
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

            var urls = common.getMetadataMgr().getPrivateData().accounts;
            var makeDonateButton = function () {
                var $a = $('<a>', {
                    'class': 'cp-limit-upgrade btn btn-success',
                    href: urls.donateURL,
                    rel: "noreferrer noopener",
                    target: "_blank",
                }).text(Messages.supportCryptpad).appendTo($container);
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
                }).text(Messages.upgradeAccount).appendTo($container);
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
            $text.text(usage + ' / ' + prettyLimit);
            $limit.append($usage).append($text);
        };

        var updateUsage = Util.notAgainForAnother(function () {
            common.getPinUsage(todo);
        }, LIMIT_REFRESH_RATE);

        setInterval(function () {
            updateUsage();
        }, LIMIT_REFRESH_RATE * 3);

        updateUsage();
        cb(null, $container);
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
        /*$('<span>', {
            'class': 'fa fa-caret-down',
        }).appendTo($button);*/

        // Menu
        var $innerblock = $('<div>', {'class': 'cp-dropdown-content'});
        if (config.left) { $innerblock.addClass('cp-dropdown-left'); }

        config.options.forEach(function (o) {
            if (!isValidOption(o)) { return; }
            if (isElement(o)) { return $innerblock.append($(o)); }
            $('<' + o.tag + '>', o.attributes || {}).html(o.content || '').appendTo($innerblock);
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
            var topPos = $container[0].getBoundingClientRect().bottom;
            $innerblock.css('max-height', Math.floor(wh - topPos - 1)+'px');
            $innerblock.show();
            $innerblock.find('.cp-dropdown-element-active').removeClass('cp-dropdown-element-active');
            if (config.isSelect && value) {
                var $val = $innerblock.find('[data-value="'+value+'"]');
                setActive($val);
                $innerblock.scrollTop($val.position().top + $innerblock.scrollTop());
            }
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
            var pressed = '';
            var to;
            $container.keydown(function (e) {
                var $value = $innerblock.find('[data-value].cp-dropdown-element-active:visible');
                if (e.which === 38) { // Up
                    if ($value.length) {
                        $value.mouseleave();
                        var $prev = $value.prev();
                        $prev.mouseenter();
                        setActive($prev);
                    }
                }
                if (e.which === 40) { // Down
                    if ($value.length) {
                        $value.mouseleave();
                        var $next = $value.next();
                        $next.mouseenter();
                        setActive($next);
                    }
                }
                if (e.which === 13) { //Enter
                    if ($value.length) {
                        $value.click();
                        hide();
                    }
                }
                if (e.which === 27) { // Esc
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
                $button.find('.cp-dropdown-button-title').html(textValue);
            };
            $container.getValue = function () {
                return value || '';
            };
        }

        return $container;
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
        options.push({
            tag: 'a',
            attributes: {
                'target': '_blank',
                'href': origin+'/index.html',
                'class': 'fa fa-home'
            },
            content: h('span', Messages.homePage)
        });
        if (padType !== 'drive' || (!accountName && priv.newSharedFolder)) {
            options.push({
                tag: 'a',
                attributes: {
                    'target': '_blank',
                    'href': origin+'/drive/',
                    'class': 'fa fa-hdd-o'
                },
                content: h('span', Messages.login_accessDrive)
            });
        }
        options.push({ tag: 'hr' });
        // Add the change display name button if not in read only mode
        if (config.changeNameButtonCls && config.displayChangeName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': config.changeNameButtonCls + ' fa fa-user'},
                content: h('span', Messages.user_rename)
            });
        }
        if (accountName && !AppConfig.disableProfile) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-profile fa fa-user-circle'},
                content: h('span', Messages.profileButton)
            });
        }
        if (padType !== 'settings') {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-settings fa fa-cog'},
                content: h('span', Messages.settingsButton)
            });
        }
        options.push({ tag: 'hr' });
        // Add administration panel link if the user is an admin
        if (priv.edPublic && Array.isArray(Config.adminKeys) && Config.adminKeys.indexOf(priv.edPublic) !== -1) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-admin fa fa-cogs'},
                content: h('span', Messages.adminPage || 'Admin')
            });
        }
        if (padType !== 'support' && accountName && Config.supportMailbox) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-support fa fa-life-ring'},
                content: h('span', Messages.supportPage || 'Support')
            });
        }
        options.push({
            tag: 'a',
            attributes: {
                'target': '_blank',
                'href': origin+'/features.html',
                'class': 'fa fa-star-o'
            },
            content: h('span', priv.plan ? Messages.settings_cat_subscription : Messages.pricing)
        });
        options.push({ tag: 'hr' });
        // Add login or logout button depending on the current status
        if (accountName) {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-logout fa fa-sign-out'},
                content: h('span', Messages.logoutButton)
            });
        } else {
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-login fa fa-sign-in'},
                content: h('span', Messages.login_login)
            });
            options.push({
                tag: 'a',
                attributes: {'class': 'cp-toolbar-menu-register fa fa-user-plus'},
                content: h('span', Messages.login_register)
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
                UIElements.displayAvatar(Common, $avatar, url,
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

        $userAdmin.find('a.cp-toolbar-menu-logout').click(function () {
            Common.logout(function () {
                window.parent.location = origin+'/';
            });
        });
        $userAdmin.find('a.cp-toolbar-menu-settings').click(function () {
            if (padType) {
                window.open(origin+'/settings/');
            } else {
                window.parent.location = origin+'/settings/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-support').click(function () {
            if (padType) {
                window.open(origin+'/support/');
            } else {
                window.parent.location = origin+'/support/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-admin').click(function () {
            if (padType) {
                window.open(origin+'/admin/');
            } else {
                window.parent.location = origin+'/admin/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-profile').click(function () {
            if (padType) {
                window.open(origin+'/profile/');
            } else {
                window.parent.location = origin+'/profile/';
            }
        });
        $userAdmin.find('a.cp-toolbar-menu-login').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/login/';
            });
        });
        $userAdmin.find('a.cp-toolbar-menu-register').click(function () {
            Common.setLoginRedirect(function () {
                window.parent.location = origin+'/register/';
            });
        });

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

    UIElements.createModal = function (cfg) {
        var $body = cfg.$body || $('body');
        var $blockContainer = $body.find('#'+cfg.id);
        if (!$blockContainer.length) {
            $blockContainer = $('<div>', {
                'class': 'cp-modal-container',
                tabindex: 1,
                'id': cfg.id
            });
        }
        var hide = function () {
            if (cfg.onClose) { return void cfg.onClose(); }
            $blockContainer.hide();
        };
        $blockContainer.html('').appendTo($body);
        var $block = $('<div>', {'class': 'cp-modal'}).appendTo($blockContainer);
        $('<span>', {
            'class': 'cp-modal-close fa fa-times',
            'title': Messages.filePicker_close
        }).click(hide).appendTo($block);
        $body.click(hide);
        $block.click(function (e) {
            e.stopPropagation();
        });
        $body.keydown(function (e) {
            if (e.which === 27) {
                hide();
            }
        });
        return $blockContainer;
    };

    UIElements.createNewPadModal = function (common) {
        // if in drive, show new pad modal instead
        if ($("body.cp-app-drive").length !== 0) { return void $(".cp-app-drive-element-row.cp-app-drive-new-ghost").click(); }

        var $modal = UIElements.createModal({
            id: 'cp-app-toolbar-creation-dialog',
            $body: $('body')
        });
        var $title = $('<h3>').text(Messages.fm_newFile);
        var $description = $('<p>').html(Messages.creation_newPadModalDescription);
        $modal.find('.cp-modal').append($title);
        $modal.find('.cp-modal').append($description);

        var $advanced;

        var $advancedContainer = $('<div>');
        var priv = common.getMetadataMgr().getPrivateData();
        var c = (priv.settings.general && priv.settings.general.creation) || {};
        if (AppConfig.displayCreationScreen && common.isLoggedIn() && c.skip) {
            var $cboxLabel = $(UI.createCheckbox('cp-app-toolbar-creation-advanced',
                                                 Messages.creation_newPadModalAdvanced, true))
                                 .appendTo($advancedContainer);
            $advanced = $cboxLabel.find('input');
            $description.append('<br>');
            $description.append(Messages.creation_newPadModalDescriptionAdvanced);
        }

        var $container = $('<div>');
        var i = 0;
        var types = AppConfig.availablePadTypes.filter(function (p) {
            if (p === 'drive') { return; }
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


        $modal.find('.cp-modal').append($container).append($advancedContainer);
        window.setTimeout(function () {
            $modal.show();
            $modal.focus();
        });
    };

    UIElements.initFilePicker = function (common, cfg) {
        var onSelect = cfg.onSelect || $.noop;
        var sframeChan = common.getSframeChannel();
        sframeChan.on("EV_FILE_PICKED", function (data) {
            onSelect(data);
        });
    };
    UIElements.openFilePicker = function (common, types) {
        var sframeChan = common.getSframeChannel();
        sframeChan.event("EV_FILE_PICKER_OPEN", types);
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
            common.openFilePicker(pickerCfg);
            var first = true; // We can only pick a template once (for a new document)
            var fileDialogCfg = {
                onSelect: function (data) {
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
                }
            };
            common.initFilePicker(fileDialogCfg);
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
                title: text,
                href: origin + href,
                target: "_blank",
                'data-tippy-placement': "right"
            });
            return q;
        };

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

        var settings = h('div.cp-creation-remember', [
            UI.createCheckbox('cp-creation-remember', Messages.creation_saveSettings, false),
            createHelper('/settings/#creation', Messages.creation_settings),
            h('div.cp-creation-remember-help.cp-creation-slider', [
                h('span.fa.fa-exclamation-circle.cp-creation-warning'),
                Messages.creation_rememberHelp
            ])
        ]);

        var createDiv = h('div.cp-creation-create');
        var $create = $(createDiv);

        $(h('div#cp-creation-form', [
            owned,
            expire,
            password,
            settings,
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

        // Display settings help when checkbox checked
        $creation.find('#cp-creation-remember').on('change', function () {
            if ($(this).is(':checked')) {
                $creation.find('.cp-creation-remember-help:not(.active)').addClass('active');
                return;
            }
            $creation.find('.cp-creation-remember-help').removeClass('active');
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
        if (!cfg.owned && typeof cfg.owned !== "undefined") {
            $creation.find('#cp-creation-owned').prop('checked', false);
        }
        if (cfg.skip) {
            $creation.find('#cp-creation-remember').prop('checked', true).trigger('change');
        }
        UIElements.setExpirationValue(cfg.expire, $creation);

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

            return {
                owned: ownedVal,
                password: passwordVal,
                expire: expireVal,
                templateId: templateId
            };
        };
        var create = function () {
            var val = getFormValues();

            var skip = $('#cp-creation-remember').is(':checked');
            common.setAttribute(['general', 'creation', 'skip'], skip, function (e) {
                if (e) { return void console.error(e); }
            });
            common.setAttribute(['general', 'creation', 'noTemplate'], skip, function (e) {
                if (e) { return void console.error(e); }
            });

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
        if (["EDELETED", "EEXPIRED"].indexOf(err.type) === -1) { return; }
        var msg = err.type;
        if (err.type === 'EEXPIRED') {
            msg = Messages.expiredError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
        } else if (err.type === 'EDELETED') {
            msg = Messages.deletedError;
            if (err.loaded) {
                msg += Messages.errorCopy;
            }
        }
        if (toolbar && typeof toolbar.deleted === "function") { toolbar.deleted(); }
        UI.errorLoadingScreen(msg, true, true);
        (cb || function () {})();
    };

    UIElements.displayPasswordPrompt = function (common, isError) {
        var error;
        if (isError) { error = setHTML(h('p.cp-password-error'), Messages.password_error); }
        var info = h('p.cp-password-info', Messages.password_info);
        var password = UI.passwordInput({placeholder: Messages.password_placeholder});
        var button = h('button', Messages.password_submit);

        var submit = function () {
            var value = $(password).find('.cp-password-input').val();
            UI.addLoadingScreen();
            common.getSframeChannel().query('Q_PAD_PASSWORD_VALUE', value, function (err, data) {
                if (!data) {
                    UIElements.displayPasswordPrompt(common, true);
                }
            });
        };
        $(password).find('.cp-password-input').on('keydown', function (e) { if (e.which === 13) { submit(); } });
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

        $(password).find('.cp-password-input').focus();
    };

    var crowdfundingState = false;
    UIElements.displayCrowdfunding = function (common) {
        if (crowdfundingState) { return; }
        if (AppConfig.disableCrowdfundingMessages) { return; }
        var priv = common.getMetadataMgr().getPrivateData();
        if (priv.plan) { return; }

        crowdfundingState = true;
        setTimeout(function () {
            common.getAttribute(['general', 'crowdfunding'], function (err, val) {
                if (err || val === false) { return; }
                // Display the popup
                var text = Messages.crowdfunding_popup_text;
                var yes = h('button.cp-corner-primary', Messages.crowdfunding_popup_yes);
                var no = h('button.cp-corner-primary', Messages.crowdfunding_popup_no);
                var never = h('button.cp-corner-cancel', Messages.crowdfunding_popup_never);
                var actions = h('div', [yes, no, never]);

                var modal = UI.cornerPopup(text, actions, null, {big: true});

                $(yes).click(function () {
                    modal.delete();
                    common.openURL('https://opencollective.com/cryptpad/contribute');
                    Feedback.send('CROWDFUNDING_YES');
                });
                $(modal.popup).find('a').click(function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    modal.delete();
                    common.openURL('https://opencollective.com/cryptpad/');
                    Feedback.send('CROWDFUNDING_LINK');
                });
                $(no).click(function () {
                    modal.delete();
                    Feedback.send('CROWDFUNDING_NO');
                });
                $(never).click(function () {
                    modal.delete();
                    common.setAttribute(['general', 'crowdfunding'], false);
                    Feedback.send('CROWDFUNDING_NEVER');
                });

            });
        }, 5000);
    };

    var storePopupState = false;
    var autoStoreModal = {};
    UIElements.displayStorePadPopup = function (common, data) {
        if (storePopupState) { return; }
        storePopupState = true;
        if (data && data.stored) { return; } // We won't display the popup for dropped files
        var priv = common.getMetadataMgr().getPrivateData();

        var typeMsg = priv.pathname.indexOf('/file/') !== -1 ? Messages.autostore_file :
                        priv.pathname.indexOf('/drive/') !== -1 ? Messages.autostore_sf :
                          Messages.autostore_pad;
        var text = Messages._getKey('autostore_notstored', [typeMsg]);
        var footer = Messages.autostore_settings;

        var hide = h('button.cp-corner-cancel', Messages.autostore_hide);
        var store = h('button.cp-corner-primary', Messages.autostore_store);
        var actions = h('div', [store, hide]);

        var initialHide = data && data.autoStore && data.autoStore === -1;
        var modal = UI.cornerPopup(text, actions, footer, {hidden: initialHide});

        autoStoreModal[priv.channel] = modal;

        $(modal.popup).find('.cp-corner-footer a').click(function (e) {
            e.preventDefault();
            common.openURL('/settings/');
        });

        $(hide).click(function () {
            UIElements.displayCrowdfunding(common);
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
                delete autoStoreModal[priv.channel];
                modal.delete();
                UIElements.displayCrowdfunding(common);
                UI.log(Messages.autostore_saved);
            });
        });

    };

    var createContextMenu = function (menu) {
        var $menu = $(menu).appendTo($('body'));

        var display = function (e) {
            $menu.css({ display: "block" });
            var h = $menu.outerHeight();
            var w = $menu.outerWidth();
            var wH = window.innerHeight;
            var wW = window.innerWidth;
            if (h > wH) {
                $menu.css({
                    top: '0px',
                    bottom: ''
                });
            } else if (e.pageY + h <= wH) {
                $menu.css({
                    top: e.pageY+'px',
                    bottom: ''
                });
            } else {
                $menu.css({
                    bottom: '0px',
                    top: ''
                });
            }
            if(w > wW) {
                $menu.css({
                    left: '0px',
                    right: ''
                });
            } else if (e.pageX + w <= wW) {
                $menu.css({
                    left: e.pageX+'px',
                    right: ''
                });
            } else {
                $menu.css({
                    left: '',
                    right: '0px',
                });
            }
        };

        var hide = function () {
            $menu.hide();
        };
        var remove = function () {
            $menu.remove();
        };

        $('body').click(hide);

        return {
            menu: menu,
            show: display,
            hide: hide,
            remove: remove
        };
    };

    var mediatagContextMenu;
    UIElements.importMediaTagMenu = function (common) {
        if (mediatagContextMenu) { return mediatagContextMenu; }

        // Create context menu
        var menu = h('div.cp-contextmenu.dropdown.cp-unselectable', [
            h('ul.dropdown-menu', {
                'role': 'menu',
                'aria-labelledBy': 'dropdownMenu',
                'style': 'display:block;position:static;margin-bottom:5px;'
            }, [
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
        var m = createContextMenu(menu);

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
        });

        return m;
    };

    UIElements.displayFriendRequestModal = function (common, data) {
        var msg = data.content.msg;
        var text = Messages._getKey('contacts_request', [Util.fixHTML(msg.content.displayName)]);

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
            setHTML(h('p'), text)
        ]);
        var buttons = [{
            name: Messages.friendRequest_later,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.friendRequest_accept,
            onClick: function () {
                todo(true);
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.friendRequest_decline,
            onClick: function () {
                todo(false);
            },
            keys: [[13, 'ctrl']]
        }];
        var modal = UI.dialog.customModal(content, {buttons: buttons});
        UI.openCustomModal(modal);
    };

    UIElements.displayAddOwnerModal = function (common, data) {
        var priv = common.getMetadataMgr().getPrivateData();
        var user = common.getMetadataMgr().getUserData();
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

        var answer = function (yes) {
            common.mailbox.sendTo("ADD_OWNER_ANSWER", {
                channel: msg.content.channel,
                href: msg.content.href,
                password: msg.content.password,
                title: msg.content.title,
                answer: yes,
                user: {
                    displayName: user.name,
                    avatar: user.avatar,
                    profile: user.profile,
                    notifications: user.notifications,
                    curvePublic: user.curvePublic,
                    edPublic: priv.edPublic
                }
            }, {
                channel: msg.content.user.notifications,
                curvePublic: msg.content.user.curvePublic
            });
            common.mailbox.dismiss(data, function (err) {
                console.log(err);
            });
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

        var buttons = [{
            name: Messages.friendRequest_later,
            onClick: function () {},
            keys: [27]
        }, {
            className: 'primary',
            name: Messages.friendRequest_accept,
            onClick: function () {
                todo(true);
            },
            keys: [13]
        }, {
            className: 'primary',
            name: Messages.friendRequest_decline,
            onClick: function () {
                todo(false);
            },
            keys: [[13, 'ctrl']]
        }];
        var modal = UI.dialog.customModal(div, {buttons: buttons});
        UI.openCustomModal(modal);
    };

    return UIElements;
});
