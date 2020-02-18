define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
], function ($, Util, Hash, UI, UIElements, h,
             Messages, nThen) {
    var Access = {};

    var getOwnersTab = function (common, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));

        var friends = common.getFriends(true);
        var sframeChan = common.getSframeChannel();
        var priv = common.getMetadataMgr().getPrivateData();
        var user = common.getMetadataMgr().getUserData();
        var edPublic = priv.edPublic;
        var channel = data.channel;
        var owners = data.owners || [];
        var pending_owners = data.pending_owners || [];
        var teams = priv.teams;
        var teamsData = Util.tryParse(JSON.stringify(priv.teams)) || {};
        var teamOwner = data.teamId;

        opts = opts || {};
        var redrawAll = function () {};

        var addBtn = h('button.btn.btn-primary.fa.fa-arrow-left');

        var div1 = h('div.cp-share-column.cp-ownership');
        var divMid = h('div.cp-share-column-mid', addBtn);
        var div2 = h('div.cp-share-column.cp-ownership');
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
                Object.keys(teams).some(function (id) {
                    if (teams[id].edPublic === ed) {
                        f = teams[id];
                        f.teamId = id;
                    }
                });
                if (ed === edPublic) {
                    f = f || user;
                    if (f.name) { f.edPublic = edPublic; }
                }
                _owners[ed] = f || {
                    displayName: Messages._getKey('owner_unknownUser', [ed]),
                    edPublic: ed,
                };
            });

            var remove = function (el) {
                // Check selection
                var me = false;
                var $el = $(el);
                var ed = $el.attr('data-ed');
                if (!ed) { return; }
                if (teamOwner && teams[teamOwner] && teams[teamOwner].edPublic === ed) { me = true; }
                if (ed === edPublic && !teamOwner) { me = true; }
                nThen(function (waitFor) {
                    var msg = me ? Messages.owner_removeMeConfirm : Messages.owner_removeConfirm; // XXX check existing keys
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
                        value: [ed],
                        teamId: teamOwner
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            waitFor.abort();
                            redrawAll(true);
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                        UI.log(Messages.saved);
                    }));
                }).nThen(function (waitFor) {
                    var curve = $el.attr('data-curve');
                    var friend = curve === user.curvePublic ? user : friends[curve];
                    if (!friend) { return; }
                    common.mailbox.sendTo("RM_OWNER", {
                        channel: channel,
                        title: data.title,
                        pending: pending
                    }, {
                        channel: friend.notifications,
                        curvePublic: friend.curvePublic
                    }, waitFor());
                }).nThen(function () {
                    redrawAll(true);
                });
            };

            var msg = pending ? Messages.owner_removePendingText
                        : Messages.owner_removeText;
            var removeCol = UIElements.getUserGrid(msg, {
                common: common,
                large: true,
                data: _owners,
                noSelect: true,
                list: true,
                remove: remove
            }, function () {
            });
            var $div = $(removeCol.div);
            return $div;
        };

        // Add owners column
        var drawAdd = function () {
            var $div = $(h('div.cp-share-column'));
            var _friends = JSON.parse(JSON.stringify(friends));
            Object.keys(_friends).forEach(function (curve) {
                if (owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    pending_owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    !_friends[curve].notifications) {
                    delete _friends[curve];
                }
            });
            var addCol = UIElements.getUserGrid(Messages.owner_addText, {
                common: common,
                large: true,
                data: _friends
            }, function () {
                //console.log(arguments);
            });
            $div.append(addCol.div);

            Object.keys(teamsData).forEach(function (id) {
                var t = teamsData[id];
                t.teamId = id;
                if (owners.indexOf(t.edPublic) !== -1 || pending_owners.indexOf(t.edPublic) !== -1) {
                    delete teamsData[id];
                }
            });
            var teamsList = UIElements.getUserGrid(Messages.owner_addTeamText, {
                common: common,
                large: true,
                noFilter: true,
                data: teamsData
            }, function () {});
            $div.append(teamsList.div);

            // When clicking on the add button, we get the selected users.
            //var addButton = h('button.no-margin', Messages.owner_addButton); // XXX
            //$div.append(h('p', addButton));
            return $div;
        };

        $(addBtn).click(function () {
            var $div = $div2.find('.cp-share-column');
            // Check selection
            var $sel = $div.find('.cp-usergrid-user.cp-selected');
            var sel = $sel.toArray();
            if (!sel.length) { return; }
            var toAdd = sel.map(function (el) {
                var curve = $(el).attr('data-curve');
                // If the pad is woned by a team, we can transfer ownership to ourselves
                if (curve === user.curvePublic && teamOwner) { return priv.edPublic; }
                var friend = friends[curve];
                if (!friend) { return; }
                return friend.edPublic;
            }).filter(function (x) { return x; });
            var toAddTeams = sel.map(function (el) {
                var team = teamsData[$(el).attr('data-teamid')];
                if (!team || !team.edPublic) { return; }
                return {
                    edPublic: team.edPublic,
                    id: $(el).attr('data-teamid')
                };
            }).filter(function (x) { return x; });

            nThen(function (waitFor) {
                var msg = Messages.owner_addConfirm;
                UI.confirm(msg, waitFor(function (yes) {
                    if (!yes) {
                        waitFor.abort();
                        return;
                    }
                }));
            }).nThen(function (waitFor) {
                // Add one of our teams as an owner
                if (toAddTeams.length) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: channel,
                        command: 'ADD_OWNERS',
                        value: toAddTeams.map(function (obj) { return obj.edPublic; }),
                        teamId: teamOwner
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            waitFor.abort();
                            redrawAll(true);
                            var text = err === "INSUFFICIENT_PERMISSIONS" ?
                                    Messages.fm_forbidden : Messages.error;
                            return void UI.warn(text);
                        }
                        var isTemplate = priv.isTemplate || opts.isTemplate;
                        toAddTeams.forEach(function (obj) {
                            sframeChan.query('Q_STORE_IN_TEAM', {
                                href: data.href || data.rohref,
                                password: data.password,
                                path: isTemplate ? ['template'] : undefined,
                                title: data.title || '',
                                teamId: obj.id
                            }, waitFor(function (err) {
                                if (err) { return void console.error(err); }
                            }));
                        });
                    }));
                }
            }).nThen(function (waitFor) {
                // Offer ownership to a friend
                if (toAdd.length) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: channel,
                        command: 'ADD_PENDING_OWNERS',
                        value: toAdd,
                        teamId: teamOwner
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            waitFor.abort();
                            redrawAll(true);
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                    }));
                }
            }).nThen(function (waitFor) {
                sel.forEach(function (el) {
                    var curve = $(el).attr('data-curve');
                    var friend = curve === user.curvePublic ? user : friends[curve];
                    if (!friend) { return; }
                    common.mailbox.sendTo("ADD_OWNER", {
                        channel: channel,
                        href: data.href,
                        password: data.password,
                        title: data.title
                    }, {
                        channel: friend.notifications,
                        curvePublic: friend.curvePublic
                    }, waitFor());
                });
            }).nThen(function () {
                redrawAll(true);
                UI.log(Messages.saved);
            });
        });

        redrawAll = function (reload) {
            nThen(function (waitFor) {
                if (!reload) { return; }
                common.getPadMetadata({
                    channel: data.channel
                }, waitFor(function (md) {
                    data.owners = md.owners || [];
                    data.pending_owners = md.pending_owners || [];
                }));
            }).nThen(function () {
                owners = data.owners || [];
                pending_owners = data.pending_owners || [];
                $div1.empty();
                $div2.empty();
                $div1.append(drawRemove(false)).append(drawRemove(true));
                $div2.append(drawAdd());
            });
        };
        redrawAll();

        var handler = sframeChan.on('EV_RT_METADATA', function (md) {
            if (!$div1.length) {
                return void handler.stop();
            }
            data.owners = md.owners || [];
            data.pending_owners = md.pending_owners || [];
            redrawAll();
        });

        // Create modal
        var link = h('div.cp-share-columns', [
            div1,
            divMid,
            div2
        ]);
        cb(void 0, link);
    };

    var isOwned = function (common, data) {
        data = data || {};
        var priv = common.getMetadataMgr().getPrivateData();
        var edPublic = priv.edPublic;
        var owned = false;
        if (data.owners && data.owners.length) {
            if (data.owners.indexOf(edPublic) !== -1) {
                owned = true;
            } else {
                Object.keys(priv.teams || {}).some(function (id) {
                    var team = priv.teams[id] || {};
                    if (team.viewer) { return; }
                    if (data.owners.indexOf(team.edPublic) === -1) { return; }
                    owned = id;
                    return true;
                });
            }
        }
        return owned;
    };

    var getUserList = function (common, list) {
        if (!Array.isArray(list)) { return; }
        var priv = common.getMetadataMgr().getPrivateData();
        var user = common.getMetadataMgr().getUserData();
        var edPublic = priv.edPublic;
        var strangers = 0;
        var _owners = {};
        list.forEach(function (ed) {
            // If a friend is an owner, add their name to the list
            // otherwise, increment the list of strangers

            // Our edPublic? print "Yourself"
            if (ed === edPublic) {
                _owners[ed] = {
                    //selected: true,
                    name: user.name,
                    avatar: user.avatar
                };
                return;
            }
            // One of our teams? print the team name
            if (Object.keys(priv.teams || {}).some(function (id) {
                var team = priv.teams[id] || {};
                if (team.edPublic !== ed) { return; }
                _owners[ed] = {
                    name: team.name,
                    avatar: team.avatar
                };
                return true;
            })) {
                return;
            }
            // One of our friends? print the friend name
            if (Object.keys(priv.friends || {}).some(function (c) {
                var friend = priv.friends[c] || {};
                if (friend.edPublic !== ed || c === 'me') { return; }
                _owners[friend.edPublic] = {
                    name: friend.displayName,
                    avatar: friend.avatar
                };
                return true;
            })) {
                return;
            }
            // Otherwise it's a stranger
            _owners[ed] = {
                name: '???', // XXX unkwown?
            };
            strangers++;
        });
        if (!Object.keys(_owners).length) { return; }
        /*
        if (strangers) {
            _owners['stangers'] = {
                name: Messages._getKey('properties_unknownUser', [strangers]),
            };
        }
        */
        return UIElements.getUserGrid(null, {
            common: common,
            noSelect: true,
            data: _owners,
            large: true
        }, function () {});
    };

    var getAccessTab = function (common, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        opts = opts || {};

        var priv = common.getMetadataMgr().getPrivateData();

        var $div = $(h('div.cp-share-columns'));
        if (!data) { return void cb(void 0, $div); }

        var div1 = h('div.cp-usergrid-user.cp-share-column.cp-access');
        var div2 = h('div.cp-usergrid-user.cp-share-column.cp-access');
        var $div1 = $(div1).appendTo($div);
        var $div2 = $(div2).appendTo($div);

        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        if (!parsed || !parsed.hashData) { return void console.error("Invalid href"); }

        var drawLeft = function () {
            var $d = $('<div>');

            var owned = isOwned(common, data);

            if (!opts.noExpiration) {
                var expire = Messages.creation_expireFalse;
                if (data.expire && typeof (data.expire) === "number") {
                    expire = new Date(data.expire).toLocaleString();
                }
                $d.append(h('div.cp-app-prop', [
                    Messages.creation_expiration,
                    h('br'),
                    h('span.cp-app-prop-content', expire)
                ]));
            }

            $('<label>', {'for': 'cp-app-prop-password'}).text(Messages.creation_passwordValue).appendTo($d);
            var password = UI.passwordInput({
                id: 'cp-app-prop-password',
                readonly: 'readonly'
            });
            $d.append(password);
            if (!data.noPassword) {
                var hasPassword = data.password;
                var $password = $(password);
                var $pwInput = $password.find('.cp-password-input');
                $pwInput.val(data.password || '').click(function () {
                    $pwInput[0].select();
                });

                // In the properties, we should have the edit href if we know it.
                // We should know it because the pad is stored, but it's better to check...
                if (!data.noEditPassword && owned && data.href) { // FIXME SHEET fix password change for sheets
                    var sframeChan = common.getSframeChannel();

                    var isOO = parsed.type === 'sheet';
                    var isFile = parsed.hashData.type === 'file';
                    var isSharedFolder = parsed.type === 'drive';

                    var changePwTitle = Messages.properties_changePassword;
                    var changePwConfirm = isFile ? Messages.properties_confirmChangeFile : Messages.properties_confirmChange;
                    if (!hasPassword) {
                        changePwTitle = Messages.properties_addPassword;
                        changePwConfirm = isFile ? Messages.properties_confirmNewFile : Messages.properties_confirmNew;
                    }
                    $('<label>', {'for': 'cp-app-prop-change-password'})
                        .text(changePwTitle).appendTo($d);
                    var newPassword = UI.passwordInput({
                        id: 'cp-app-prop-change-password',
                        style: 'flex: 1;'
                    });
                    var passwordOk = h('button', Messages.properties_changePasswordButton);
                    var changePass = h('span.cp-password-change-container', [
                        newPassword,
                        passwordOk
                    ]);
                    var pLocked = false;
                    $(passwordOk).click(function () {
                        var newPass = $(newPassword).find('input').val();
                        if (data.password === newPass ||
                            (!data.password && !newPass)) {
                            return void UI.alert(Messages.properties_passwordSame);
                        }
                        if (pLocked) { return; }
                        pLocked = true;
                        UI.confirm(changePwConfirm, function (yes) {
                            if (!yes) { pLocked = false; return; }
                            $(passwordOk).html('').append(h('span.fa.fa-spinner.fa-spin', {style: 'margin-left: 0'}));
                            var q = isFile ? 'Q_BLOB_PASSWORD_CHANGE' :
                                        (isOO ? 'Q_OO_PASSWORD_CHANGE' : 'Q_PAD_PASSWORD_CHANGE');

                            // If this is a file password change, register to the upload events:
                            // * if there is a pending upload, ask if we shoudl interrupt
                            // * display upload progress
                            var onPending;
                            var onProgress;
                            if (isFile) {
                                onPending = sframeChan.on('Q_BLOB_PASSWORD_CHANGE_PENDING', function (data, cb) {
                                    onPending.stop();
                                    UI.confirm(Messages.upload_uploadPending, function (yes) {
                                        cb({cancel: yes});
                                    });
                                });
                                onProgress = sframeChan.on('EV_BLOB_PASSWORD_CHANGE_PROGRESS', function (data) {
                                    if (typeof (data) !== "number") { return; }
                                    var p = Math.round(data);
                                    $(passwordOk).text(p + '%');
                                });
                            }

                            sframeChan.query(q, {
                                teamId: typeof(owned) !== "boolean" ? owned : undefined,
                                href: data.href,
                                password: newPass
                            }, function (err, data) {
                                $(passwordOk).text(Messages.properties_changePasswordButton);
                                pLocked = false;
                                if (err || data.error) {
                                    console.error(err || data.error);
                                    return void UI.alert(Messages.properties_passwordError);
                                }
                                UI.findOKButton().click();

                                $pwInput.val(newPass);

                                // If the current document is a file or if we're changing the password from a drive,
                                // we don't have to reload the page at the end.
                                // Tell the user the password change was successful and abort
                                if (isFile || priv.app !== parsed.type) {
                                    if (onProgress && onProgress.stop) { onProgress.stop(); }
                                    $(passwordOk).text(Messages.properties_changePasswordButton);
                                    var alertMsg = data.warning ? Messages.properties_passwordWarningFile
                                                                : Messages.properties_passwordSuccessFile;
                                    return void UI.alert(alertMsg, undefined, {force: true});
                                }

                                // Pad password changed: update the href
                                // Use hidden hash if needed (we're an owner of this pad so we know it is stored)
                                var useUnsafe = Util.find(priv, ['settings', 'security', 'unsafeLinks']);
                                var href = (priv.readOnly && data.roHref) ? data.roHref : data.href;
                                if (useUnsafe === false) {
                                    var newParsed = Hash.parsePadUrl(href);
                                    var newSecret = Hash.getSecrets(newParsed.type, newParsed.hash, newPass);
                                    var newHash = Hash.getHiddenHashFromKeys(parsed.type, newSecret, {});
                                    href = Hash.hashToHref(newHash, parsed.type);
                                }

                                if (data.warning) {
                                    return void UI.alert(Messages.properties_passwordWarning, function () {
                                        common.gotoURL(href);
                                    }, {force: true});
                                }
                                return void UI.alert(Messages.properties_passwordSuccess, function () {
                                    if (!isSharedFolder) {
                                        common.gotoURL(href);
                                    }
                                }, {force: true});
                            });
                        });
                    });
                    $d.append(changePass);
                }
            }
            return $d;
        };
        var drawRight = function () {
            var content = [
                h('label', Messages.creation_owners),
            ];
            var _ownersGrid = getUserList(common, data.owners);
            if (_ownersGrid && _ownersGrid.div) {
                content.push(_ownersGrid.div);
            } else {
                content.push(UI.dialog.selectable(Messages.creation_noOwner, {
                    id: 'cp-app-prop-owners',
                }));
            }

            /*
            var owned = isOwned(common, data);
            var parsed = Hash.parsePadUrl(data.href || data.roHref);
            if (!parsed || !parsed.hashData) { return; }
            if (owned && parsed.hashData.type === 'pad') {
                var manageOwners = h('button.no-margin', Messages.owner_openModalButton);
                $(manageOwners).click(function () {
                    data.teamId = typeof(owned) !== "boolean" ? owned : undefined;
                    var modal = createOwnerModal(common, data);
                    UI.openCustomModal(modal, {
                        wide: true,
                    });
                });
                $d.append(h('p', manageOwners));
            }
            */
            return h('div', content);
        };

        var sframeChan = common.getSframeChannel();
        var redraw = function () {
            $div1.empty();
            $div1.append(drawLeft());
            $div2.empty();
            $div2.append(drawRight());
        };
        var handler = sframeChan.on('EV_RT_METADATA', function (md) {
            if (!$div.length) {
                handler.stop();
                return;
            }
            md = JSON.parse(JSON.stringify(md));
            data.owners = md.owners;
            data.expire = md.expire;
            data.pending_owners = md.pending_owners;
            redraw();
        });
        redraw();

        cb(void 0, $div);
    };

    var getAccessData = function (common, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        opts = opts || {};
        var data = {};
        nThen(function (waitFor) {
            var base = common.getMetadataMgr().getPrivateData().origin;
            common.getPadAttribute('', waitFor(function (err, val) {
                if (err || !val) {
                    waitFor.abort();
                    return void cb(err || 'EEMPTY');
                }
                if (!val.fileType) {
                    delete val.owners;
                    delete val.expire;
                }
                Util.extend(data, val);
                if (data.href) { data.href = base + data.href; }
                if (data.roHref) { data.roHref = base + data.roHref; }
            }), opts.href);

            // If this is a file, don't try to look for metadata
            if (opts.channel && opts.channel.length > 34) { return; }
            common.getPadMetadata({
                channel: opts.channel // optional, fallback to current pad
            }, waitFor(function (obj) {
                if (obj && obj.error) { console.error(obj.error); return; }
                data.owners = obj.owners;
                data.expire = obj.expire;
                data.pending_owners = obj.pending_owners;
            }));
        }).nThen(function () {
            cb(void 0, data);
        });
    };
    Access.getAccessModal = function (common, opts, cb) {
        var data;
        var tab1, tab2, tab3;
        var owned = false;
        var button = [{
            className: 'cancel',
            name: Messages.filePicker_close,
            onClick: function () {},
            keys: [13,27]
        }];
        nThen(function (waitFor) {
            getAccessData(common, opts, waitFor(function (e, _data) {
                if (e) {
                    waitFor.abort();
                    return void cb(e);
                }
                data = _data;
            }));
        }).nThen(function (waitFor) {
            owned = isOwned(common, data);

            getAccessTab(common, data, opts, waitFor(function (e, c) {
                if (e) {
                    waitFor.abort();
                    return void cb(e);
                }
                tab1 = UI.dialog.customModal(c[0], {
                    buttons: button
                });
            }));

            if (!owned) { return; }

            getOwnersTab(common, data, opts, waitFor(function (e, c) {
                if (e) {
                    waitFor.abort();
                    return void cb(e);
                }
                tab3 = UI.dialog.customModal(c, {
                    buttons: button
                });
            }));
        }).nThen(function () {
            var tabs = UI.dialog.tabs([{
                title: "ACCESS", // XXX
                icon: "fa fa-unlock-alt",
                content: tab1
            }, {
                title: "ALLOW LIST", // XXX
                disabled: !owned,
                icon: "fa fa-list",
                content: h('div')
            }, {
                title: Messages.creation_owners,
                disabled: !owned,
                icon: "fa fa-id-badge",
                content: tab3
            }]);
            var modal = UI.openCustomModal(tabs, {
                wide: true
            });
            cb (void 0, modal);
        });
    };

    return Access;
});
