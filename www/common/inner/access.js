// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-interface.js',
    '/common/common-ui-elements.js',
    '/common/inner/common-modal.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/components/nthen/index.js',
], function ($, Util, Hash, UI, UIElements, Modal, h,
             Messages, nThen) {
    var Access = {};

    var getOwnersTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;

        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        var owned = Modal.isOwned(Env, data);
        var disabled = !owned || !parsed.hashData || parsed.hashData.type !== 'pad';
        if (disabled) { return void cb(); }

        var friends = common.getFriends(true);
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();

        var priv = metadataMgr.getPrivateData();
        var owners = data.owners || [];
        var pending_owners = data.pending_owners || [];
        var teamOwner = data.teamId;
        var title = opts.title;

        var p = priv.propChannels;
        var otherChan;
        if (p && p.answersChannel) {
            otherChan = [p.answersChannel];
        }

        opts = opts || {};
        var redrawAll = function () {};

        var addBtn = h('button.btn.btn-primary.cp-access-add', [h('i.fa.fa-arrow-left'), h('i.fa.fa-arrow-up')]);

        var div1 = h('div.cp-share-column.cp-ownership');
        var divMid = h('div.cp-share-column-mid', addBtn);
        var div2 = h('div.cp-share-column.cp-ownership');
        var $div1 = $(div1);
        var $div2 = $(div2);

        // Remove owner column
        var drawRemove = function (pending) {
            var priv = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();

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
                Object.keys(priv.teams).some(function (id) {
                    if (priv.teams[id].edPublic === ed) {
                        f = priv.teams[id];
                        f.teamId = id;
                    }
                });
                if (ed === priv.edPublic) {
                    f = f || user;
                    if (f.name) { f.edPublic = priv.edPublic; }
                }
                _owners[ed] = f ? Util.clone(f) : {
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
                if (teamOwner && priv.teams[teamOwner] && priv.teams[teamOwner].edPublic === ed) {
                    me = true;
                }
                if (ed === priv.edPublic && !teamOwner) { me = true; }
                nThen(function (waitFor) {
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
                        channel: data.channel || priv.channel,
                        channels: otherChan,
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
                    if (curve === user.curvePublic) { return; }
                    var friend = friends[curve];
                    if (!friend) { return; }
                    common.mailbox.sendTo("RM_OWNER", {
                        channel: data.channel || priv.channel,
                        title: data.title || title,
                        pending: pending
                    }, {
                        channel: friend.notifications,
                        curvePublic: friend.curvePublic
                    }, waitFor());
                }).nThen(function () {
                    redrawAll(true);
                });
            };

            if (pending && !Object.keys(_owners).length) {
                return $();
            }

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
            var priv = metadataMgr.getPrivateData();
            var teamsData = Util.tryParse(JSON.stringify(priv.teams)) || {};

            var $div = $(h('div.cp-share-column'));
            var _friends = Util.clone(friends);
            var friendKeys = Object.keys(_friends);
            friendKeys.forEach(function (curve) {
                if (owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    pending_owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    !_friends[curve].notifications) {
                    delete _friends[curve];
                }
            });
            if (!Object.keys(_friends).length) {
                var friendText;
                if (!friendKeys.length) {
                    //console.error(UIElements.noContactsMessage(common));
                    var findContacts = UIElements.noContactsMessage(common);
                    friendText = h('span.cp-app-prop-content',
                        findContacts.content
                    );
                } else {
                    friendText = h('span.cp-app-prop-content', Messages.access_noContact);
                }

                $div.append(h('div.cp-app-prop', [
                    Messages.contacts,
                    h('br'),
                    friendText
                ]));
            } else {
                var addCol = UIElements.getUserGrid(Messages.contacts, {
                    common: common,
                    large: true,
                    data: _friends
                }, function () {
                    //console.log(arguments);
                });
                $div.append(addCol.div);
            }

            var _teamsData = Util.clone(teamsData);
            Object.keys(_teamsData).forEach(function (id) {
                var t = _teamsData[id];
                t.teamId = id;
                if (owners.indexOf(t.edPublic) !== -1 || pending_owners.indexOf(t.edPublic) !== -1) {
                    delete _teamsData[id];
                }
            });
            if (!Object.keys(_teamsData).length) { return $div; }
            var teamsList = UIElements.getUserGrid(Messages.teams, {
                common: common,
                large: true,
                noFilter: true,
                data: _teamsData
            }, function () {});
            $div.append(teamsList.div);

            return $div;
        };

        $(addBtn).click(function () {
            var priv = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();
            var teamsData = Util.tryParse(JSON.stringify(priv.teams)) || {};

            var $div = $div2.find('.cp-share-column');
            // Check selection
            var $sel = $div.find('.cp-usergrid-user.cp-selected');
            var sel = $sel.toArray();
            if (!sel.length) { return; }
            var addMe = false;
            var toAdd = sel.map(function (el) {
                var curve = $(el).attr('data-curve');
                // If the pad is owned by a team, we can transfer ownership to ourselves
                if (curve === user.curvePublic && teamOwner) {
                    addMe = true;
                    return;
                }
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
                        channel: data.channel || priv.channel,
                        channels: otherChan,
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

                        // never store calendars in the team drive
                        if (opts.calendar) { return; }
                        toAddTeams.forEach(function (obj) {
                            sframeChan.query('Q_STORE_IN_TEAM', {
                                href: data.href || data.rohref,
                                password: data.password,
                                path: isTemplate ? ['template'] : undefined,
                                title: data.title || title || "",
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
                        channel: data.channel || priv.channel,
                        channels: otherChan,
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
                // Offer ownership to a friend
                if (addMe) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: data.channel || priv.channel,
                        channels: otherChan,
                        command: 'ADD_OWNERS',
                        value: [priv.edPublic],
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
                        sframeChan.query('Q_ACCEPT_OWNERSHIP', data, function (err, res) {
                            if (err || (res && res.error)) {
                                return void console.error(err || res.error);
                            }
                            UI.log(Messages.saved);
                        });
                    }));
                }
            }).nThen(function (waitFor) {
                var href = data.href;
                sel.forEach(function (el) {
                    var curve = $(el).attr('data-curve');
                    if (curve === user.curvePublic) { return; }
                    var friend = friends[curve];
                    if (!friend) { return; }
                    common.mailbox.sendTo("ADD_OWNER", {
                        channel: data.channel || priv.channel,
                        channels: otherChan,
                        href: href,
                        calendar: opts.calendar,
                        password: data.password || priv.password,
                        title: data.title || title
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

        var called = false;
        redrawAll = function (reload) {
            if (called) { return; }
            called = true;
            nThen(function (waitFor) {
                if (!reload) { return; }
                Modal.loadMetadata(Env, data, waitFor, "owner");
            }).nThen(function () {
                var owned = Modal.isOwned(Env, data);
                if (typeof(owned) !== "boolean") {
                    teamOwner = Number(owned);
                } else {
                    teamOwner = undefined;
                }
                owners = data.owners || [];
                pending_owners = data.pending_owners || [];
                $div1.empty();
                $div2.empty();
                $div1.append(h('p', Messages.owner_text));
                $div1.append(drawRemove(false)).append(drawRemove(true));
                $div2.append(drawAdd());
                called = false;
            });
        };
        redrawAll();

        Env.evRedrawAll.reg(function (type) {
            if (type === "owner") { return; }
            setTimeout(function () {
                redrawAll();
            });
        });

        // Create modal
        var link = h('div.cp-share-columns', [
            div1,
            divMid,
            div2
        ]);
        cb(void 0, link);
    };

    var getAllowTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;

        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        var owned = Modal.isOwned(Env, data);
        var disabled = !owned || !parsed.hashData || parsed.hashData.type !== 'pad';
        if (disabled) { return void cb(); }

        opts = opts || {};

        var friends = common.getFriends(true);
        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();

        var priv = metadataMgr.getPrivateData();
        var owners = data.owners || [];
        var restricted = data.restricted || false;
        var allowed = data.allowed || [];
        var teamOwner = data.teamId;

        var p = priv.propChannels;
        var otherChan;
        if (p && p.answersChannel) {
            otherChan = [p.answersChannel];
        }

        var redrawAll = function () {};

        var addBtn = h('button.btn.btn-primary.cp-access-add', [h('i.fa.fa-arrow-left'), h('i.fa.fa-arrow-up')]);

        var div1 = h('div.cp-share-column.cp-allowlist');
        var divMid = h('div.cp-share-column-mid.cp-overlay-container', [
            addBtn,
            h('div.cp-overlay')
        ]);
        var div2 = h('div.cp-share-column.cp-allowlist');
        var $div1 = $(div1);
        var $div2 = $(div2);

        // Create modal
        var link = h('div.cp-share-columns', [
            div1,
            divMid,
            div2
        ]);

        var setLock = function (locked) {
            $(link).find('.cp-overlay').toggle(locked);
        };

        // Remove owner column
        var drawRemove = function () {
            var priv = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();

            var _allowed = {};
            var all = Util.deduplicateString(owners.concat(allowed));
            all.forEach(function (ed) {
                var f;
                Object.keys(friends).some(function (c) {
                    if (friends[c].edPublic === ed) {
                        f = friends[c];
                        return true;
                    }
                });
                Object.keys(priv.teams).some(function (id) {
                    if (priv.teams[id].edPublic === ed) {
                        f = priv.teams[id];
                        f.teamId = id;
                    }
                });
                if (ed === priv.edPublic) {
                    f = f || user;
                    if (f.name) { f.edPublic = priv.edPublic; }
                }
                _allowed[ed] = f ? Util.clone(f) : {
                    displayName: Messages._getKey('owner_unknownUser', [ed]),
                    edPublic: ed,
                };

                if (owners.indexOf(ed) !== -1) {
                    _allowed[ed].notRemovable = true;
                }
            });

            var remove = function (el) {
                // Check selection
                var $el = $(el);
                var ed = $el.attr('data-ed');
                if (!ed) { return; }
                nThen(function (waitFor) {
                    /*
                    var msg = Messages.allow_removeConfirm;
                    UI.confirm(msg, waitFor(function (yes) {
                        if (!yes) {
                            waitFor.abort();
                            return;
                        }
                    }));
                }).nThen(function (waitFor) {
                    */
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: data.channel || priv.channel,
                        channels: otherChan,
                        command: 'RM_ALLOWED',
                        value: [ed],
                        teamId: teamOwner
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        redrawAll(true);
                        if (err) {
                            waitFor.abort();
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                        UI.log(Messages.saved);
                    }));
                });
            };

            var cbox = UI.createCheckbox('cp-allowlist', Messages.allow_checkbox, restricted);
            var $cbox = $(cbox);
            var spinner = UI.makeSpinner($cbox);
            var $checkbox = $cbox.find('input').on('change', function () {
                if (spinner.getState()) {
                    $checkbox.prop('checked', !$checkbox.prop('checked'));
                    return;
                }
                spinner.spin();
                var val = $checkbox.is(':checked');
                sframeChan.query('Q_SET_PAD_METADATA', {
                    channel: data.channel || priv.channel,
                    channels: otherChan,
                    command: 'RESTRICT_ACCESS',
                    value: [Boolean(val)],
                    teamId: teamOwner
                }, function (err, res) {
                    err = err || (res && res.error);
                    redrawAll(true);
                    if (err) {
                        spinner.hide();
                        var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                      : Messages.error;
                        return void UI.warn(text);
                    }
                    spinner.done();
                    UI.log(Messages.saved);
                });
            });


            var msg = Messages._getKey('allow_label', ['']);
            var removeCol = UIElements.getUserGrid(msg, {
                common: common,
                large: true,
                data: _allowed,
                noSelect: true,
                list: true,
                remove: remove
            }, function () { });
            $(removeCol.div).addClass('cp-overlay-container').append(h('div.cp-overlay'));
            return h('div', [
                h('p', Messages.allow_text),
                h('p', cbox),
                removeCol.div
            ]);
        };

        // Add allow list column
        var drawAdd = function () {
            var priv = metadataMgr.getPrivateData();
            var teamsData = Util.tryParse(JSON.stringify(priv.teams)) || {};

            var $div = $(h('div.cp-share-column'));

            $div.addClass('cp-overlay-container').append(h('div.cp-overlay'));

            var _friends = Util.clone(friends);
            var friendKeys = Object.keys(_friends);
            friendKeys.forEach(function (curve) {
                if (owners.indexOf(_friends[curve].edPublic) !== -1 ||
                    allowed.indexOf(_friends[curve].edPublic) !== -1) {
                    delete _friends[curve];
                }
            });
            if (!Object.keys(_friends).length) {
                var friendText;
                if (!friendKeys.length) {
                    var findContacts = UIElements.noContactsMessage(common);
                    friendText = h('span.cp-app-prop-content',
                        findContacts.content
                    );
                } else {
                    friendText = h('span.cp-app-prop-content', Messages.access_noContact);
                }

                $div.append(h('div.cp-app-prop', [
                    Messages.contacts,
                    h('br'),
                    friendText
                ]));
            } else {
                var addCol = UIElements.getUserGrid(Messages.contacts, {
                    common: common,
                    large: true,
                    data: _friends
                }, function () {
                    //console.log(arguments);
                });
                $div.append(addCol.div);
            }

            var _teamsData = Util.clone(teamsData);
            Object.keys(_teamsData).forEach(function (id) {
                var t = _teamsData[id];
                t.teamId = id;
                if (owners.indexOf(t.edPublic) !== -1 || allowed.indexOf(t.edPublic) !== -1) {
                    delete _teamsData[id];
                }
            });
            if (!Object.keys(_teamsData).length) { return $div; }
            var teamsList = UIElements.getUserGrid(Messages.teams, {
                common: common,
                large: true,
                noFilter: true,
                data: _teamsData
            }, function () {});
            $div.append(teamsList.div);

            return $div;
        };
        $(addBtn).click(function () {
            var priv = metadataMgr.getPrivateData();
            var user = metadataMgr.getUserData();
            var teamsData = Util.tryParse(JSON.stringify(priv.teams)) || {};

            var $div = $div2.find('.cp-share-column');
            // Check selection
            var $sel = $div.find('.cp-usergrid-user.cp-selected');
            var sel = $sel.toArray();
            if (!sel.length) { return; }
            var dataToAdd = [];
            var toAdd = sel.map(function (el) {
                var curve = $(el).attr('data-curve');
                var teamId = $(el).attr('data-teamid');
                // If the pad is woned by a team, we can transfer ownership to ourselves
                if (curve === user.curvePublic && teamOwner) { return priv.edPublic; }
                var data = friends[curve] || teamsData[teamId];
                dataToAdd.push(data);
                if (!data) { return; }
                return data.edPublic;
            }).filter(function (x) { return x; });

            nThen(function (waitFor) {
                /*
                var msg = Messages.allow_addConfirm;
                UI.confirm(msg, waitFor(function (yes) {
                    if (!yes) {
                        waitFor.abort();
                        return;
                    }
                }));
            }).nThen(function (waitFor) {
                */
                // Offer ownership to a friend
                if (toAdd.length) {
                    // Send the command
                    sframeChan.query('Q_SET_PAD_METADATA', {
                        channel: data.channel || priv.channel,
                        channels: otherChan,
                        command: 'ADD_ALLOWED',
                        value: toAdd,
                        teamId: teamOwner
                    }, waitFor(function (err, res) {
                        err = err || (res && res.error);
                        redrawAll(true);
                        dataToAdd.forEach(function(mailbox) {
                            if (mailbox.notifications && mailbox.curvePublic) {
                                common.mailbox.sendTo("ADD_TO_ACCESS_LIST", {
                                    channel: data.channel || priv.channel,
                                }, {
                                    channel: mailbox.notifications,
                                    curvePublic: mailbox.curvePublic
                                });
                            } else {
                                return;
                            }
                        });

                        if (err) {
                            waitFor.abort();
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            return void UI.warn(text);
                        }
                    }));
                }
            }).nThen(function () {
                UI.log(Messages.saved);
            });
        });

        var called = false;
        redrawAll = function (reload) {
            if (called) { return; }
            called = true;
            nThen(function (waitFor) {
                if (!reload) { return; }
                Modal.loadMetadata(Env, data, waitFor, "allow");
            }).nThen(function () {
                var owned = Modal.isOwned(Env, data);
                if (typeof(owned) !== "boolean") {
                    teamOwner = Number(owned);
                } else {
                    teamOwner = undefined;
                }
                owners = data.owners || [];
                restricted = data.restricted || false;
                allowed = data.allowed || [];
                $div1.empty();
                $div2.empty();
                $div1.append(drawRemove());
                $div2.append(drawAdd());
                setLock(!restricted);
                called = false;
            });
        };
        redrawAll();

        Env.evRedrawAll.reg(function (type) {
            if (type === "allow") { return; }
            setTimeout(function () {
                redrawAll();
            });
        });

        cb(void 0, link);
    };

    var getUserList = function (common, list) {
        if (!Array.isArray(list)) { return; }
        var priv = common.getMetadataMgr().getPrivateData();
        var user = common.getMetadataMgr().getUserData();
        var edPublic = priv.edPublic;
        //var strangers = 0;
        var _owners = {};
        list.forEach(function (ed) {
            // If a friend is an owner, add their name to the list
            // otherwise, increment the list of strangers

            // Our edPublic? print "Yourself"
            if (ed === edPublic) {
                _owners[ed] = {
                    //selected: true,
                    name: user.name,
                    avatar: user.avatar,
                    uid: user.uid
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
                    avatar: friend.avatar,
                    uid: friend.uid,
                };
                return true;
            })) {
                return;
            }
            // Otherwise it's a stranger
            _owners[ed] = {
                avatar: '?',
                name: Messages.owner_unknownUser,
                // TODO a possible enhancement is to use data from the context
                // ie. if you have opened the access modal from within the pad
                // its owner might be present or they might have left some data
                // in the pad itself (as is the case of the uid in rich text comments)
                // TODO or just implement "Acquaintances"
            };
            //strangers++;
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

    var getAccessTab = function (Env, data, opts, _cb) {
        var cb = Util.once(Util.mkAsync(_cb));
        var common = Env.common;
        opts = opts || {};

        var sframeChan = common.getSframeChannel();
        var metadataMgr = common.getMetadataMgr();
        var priv = metadataMgr.getPrivateData();

        var $div = $(h('div.cp-share-columns'));

        if (priv.offline) {
            $div.append(h('p', Messages.access_offline));
            return void cb(void 0, $div);
        }
        if (!data) { return void cb(void 0, $div); }

        var div1 = h('div.cp-usergrid-user.cp-share-column.cp-access');
        var div2 = h('div.cp-usergrid-user.cp-share-column.cp-access');
        var $div1 = $(div1).appendTo($div);
        var $div2 = $(div2).appendTo($div);

        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        if (!parsed || !parsed.hashData) { return void console.error("Invalid href"); }

        var drawLeft = function () {
            var priv = metadataMgr.getPrivateData();

            var $d = $('<div>');

            var owned = Modal.isOwned(Env, data);

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

            var $pwLabel = $('<label>', {'for': 'cp-app-prop-password'})
                            .text(Messages.creation_passwordValue).appendTo($d);
            var hasPassword = data.password;
            var password = UI.passwordInput({
                id: 'cp-app-prop-password',
                readonly: 'readonly'
            });
            var $password = $(password).appendTo($d);
            var $pwInput = $password.find('.cp-password-input');
            $pwInput.val(data.password || '').click(function () {
                $pwInput[0].select();
            });
            if (!hasPassword) {
                $password.hide();
                $pwLabel.hide();
            }

            // In the properties, we should have the edit href if we know it.
            // We should know it because the pad is stored, but it's better to check...
            //if (!data.noEditPassword && !opts.noEditPassword && owned && data.href) {
            if (!data.noEditPassword && !opts.noEditPassword && owned && data.href && parsed.type !== "form") { // TODO password change in forms block responses (validation & decryption)
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
                var passwordOk = h('button.btn', Messages.properties_changePasswordButton);
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

                        var href = data.href;
                        var isNotStored = Boolean(data.isNotStored);
                        sframeChan.query(q, {
                            teamId: typeof(owned) !== "boolean" ? owned : undefined,
                            href: href,
                            oldPassword: data.password || priv.password,
                            password: newPass
                        }, function (err, res) {
                            $(passwordOk).text(Messages.properties_changePasswordButton);
                            pLocked = false;
                            err = err || res.error;
                            if (err) {
                                if (err === "PASSWORD_ALREADY_USED") {
                                    return void UI.alert(Messages.access_passwordUsed);
                                }
                                console.error(err);
                                return void UI.alert(Messages.properties_passwordError);
                            }
                            UI.findOKButton().click();

                            data.password = newPass;
                            data.href = res.href;
                            data.roHref = res.roHref;
                            data.channel = res.channel;

                            $pwInput.val(newPass);
                            if (newPass) {
                                $password.show();
                                $pwLabel.show();
                            } else {
                                $password.hide();
                                $pwLabel.hide();
                            }

                            // If the current document is a file or if we're changing the password from a drive,
                            // we don't have to reload the page at the end.
                            // Tell the user the password change was successful and abort
                            if (isFile || priv.app !== parsed.type) {
                                if (onProgress && onProgress.stop) { onProgress.stop(); }
                                $(passwordOk).text(Messages.properties_changePasswordButton);
                                var alertMsg = res.warning ? Messages.properties_passwordWarningFile
                                                            : Messages.properties_passwordSuccessFile;
                                return void UI.alert(alertMsg, undefined, {force: true});
                            }

                            // Pad password changed: update the href
                            // Use hidden hash if needed (we're an owner of this pad so we know it is stored)
                            var useUnsafe = Util.find(priv, ['settings', 'security', 'unsafeLinks']);
                            if (isNotStored) { useUnsafe = true; }
                            var _href = (priv.readOnly && res.roHref) ? res.roHref : res.href;
                            if (useUnsafe !== true) {
                                var newParsed = Hash.parsePadUrl(_href);
                                var newSecret = Hash.getSecrets(newParsed.type, newParsed.hash, newPass);
                                var newHash = Hash.getHiddenHashFromKeys(parsed.type, newSecret, {});
                                _href = Hash.hashToHref(newHash, parsed.type);
                            }

                            // Trigger a page reload if the href didn't change
                            if (_href === href) { _href = undefined; }

                            if (res.warning) {
                                return void UI.alert(Messages.properties_passwordWarning, function () {
                                    if (isNotStored) {
                                        return sframeChan.query('Q_PASSWORD_CHECK', newPass, () => { common.gotoURL(_href);  });
                                    }
                                    common.gotoURL(_href);
                                }, {force: true});
                            }
                            return void UI.alert(UIElements.fixInlineBRs(Messages.properties_passwordSuccess), function () {
                                if (!isSharedFolder) {
                                    if (isNotStored) {
                                        return sframeChan.query('Q_PASSWORD_CHECK', newPass, () => { common.gotoURL(_href);  });
                                    }
                                    common.gotoURL(_href);
                                }
                            });
                        });
                    });
                });
                $d.append(changePass);
            }
            if (owned) {
                var deleteOwned = h('button.btn.btn-danger', [h('i.cptools.cptools-destroy'), Messages.fc_delete_owned]);
                var spinner = UI.makeSpinner();
                UI.confirmButton(deleteOwned, {
                    classes: 'btn-danger'
                }, function () {
                    spinner.spin();
                    sframeChan.query('Q_DELETE_OWNED', {
                        teamId: typeof(owned) !== "boolean" ? owned : undefined,
                        channel: data.channel || priv.channel
                    }, function (err, obj) {
                        spinner.done();
                        UI.findCancelButton().click();
                        if (err || (obj && obj.error)) { UI.warn(Messages.error); }
                    });

                    // If this is a form wiht a answer channel, delete it too
                    var p = priv.propChannels;
                    if (p && p.answersChannel) {
                        sframeChan.query('Q_DELETE_OWNED', {
                            teamId: typeof(owned) !== "boolean" ? owned : undefined,
                            channel: p.answersChannel
                        }, function () {});
                    }
                });
                if (!opts.noEditPassword) { $d.append(h('br')); }
                $d.append(h('div', [
                    h('label', Messages.access_destroyPad),
                    h('br'),
                    deleteOwned,
                    spinner.spinner
                ]));
            }
            return $d;
        };
        var drawRight = function () {
            var priv = metadataMgr.getPrivateData();

            // Owners
            var content = [];
            var _ownersGrid = getUserList(common, data.owners);
            if (_ownersGrid && _ownersGrid.div) {
                content.push(h('label', Messages.creation_owners));
                content.push(_ownersGrid.div);
            } else if (!data.rejected) {
                content.push(UI.dialog.selectable(Messages.creation_noOwner, {
                    id: 'cp-app-prop-owners',
                }));
            }

            // Stop here for files: no allow list, no access request
            // Also stop for shared folders
            if (parsed.hashData.type !== 'pad' || parsed.type === 'drive') { return h('div', content); }

            var owned = Modal.isOwned(Env, data);

            // Request edit access
            if (common.isLoggedIn() && data.roHref && !owned && !opts.calendar && priv.app !== 'form') {
                var requestButton = h('button.btn.btn-secondary.no-margin.cp-access-margin-right',
                                        Messages.requestEdit_button);
                var requestBlock = h('p', requestButton);
                var $requestBlock = $(requestBlock).hide();
                content.push(requestBlock);
                sframeChan.query('Q_CONTACT_OWNER', {
                    send: false,
                    metadata: data
                }, function (err, obj) {
                    // Abort if no mailbox available
                    if (!(obj && obj.state)) { return; }

                    var spinner = UI.makeSpinner($requestBlock);
                    $requestBlock.show().find('button').click(function () {
                        if (spinner.getState()) { return; }
                        spinner.spin();
                        sframeChan.query('Q_CONTACT_OWNER', {
                            send: true,
                            metadata: data,
                            query: "REQUEST_PAD_ACCESS"
                        }, function (err, obj) {
                            if (obj && obj.state) {
                                UI.log(Messages.requestEdit_sent);
                                $requestBlock.find('button').prop('disabled', true);
                                spinner.done();
                            } else {
                                spinner.hide();
                            }
                        });
                    });
                });
            }

            // Mute access requests
            var edPublic = priv.edPublic;
            var canMute = data.mailbox && owned === true && (
                    (typeof (data.mailbox) === "string" && data.owners[0] === edPublic) ||
                    data.mailbox[edPublic]);
            if (owned === true && !opts.calendar && priv.app !== 'form') {
                var cbox = UI.createCheckbox('cp-access-mute', Messages.access_muteRequests, !canMute);
                var $cbox = $(cbox);
                var spinner = UI.makeSpinner($cbox);
                var $checkbox = $cbox.find('input').on('change', function () {
                    if (spinner.getState()) {
                        $checkbox.prop('checked', !$checkbox.prop('checked'));
                        return;
                    }
                    spinner.spin();
                    var val = $checkbox.is(':checked');
                    sframeChan.query('Q_UPDATE_MAILBOX', {
                        metadata: data,
                        add: !val
                    }, function (err, res) {
                        err = err || (res && res.error);
                        if (err) {
                            spinner.hide();
                            var text = err === "INSUFFICIENT_PERMISSIONS" ? Messages.fm_forbidden
                                                                          : Messages.error;
                            console.error(err);
                            return void UI.warn(text);
                        }
                        spinner.done();
                        UI.log(Messages.saved);
                    });
                });
                $cbox.find('.cp-checkmark-label').addClass('cp-access-margin-right');
                $cbox.find('.cp-checkmark-mark')
                    .after(h('span.fa.fa-bell-slash.cp-access-margin-right'));
                content.push(h('p', cbox));
            }


            // Allow list
            var state = data.restricted ? Messages.allow_enabled : Messages.allow_disabled;
            content.push(h('label', Messages._getKey('allow_label', [state])));
            if (data.restricted) {
                var _allowed = Util.deduplicateString((data.owners || []).concat(data.allowed));
                var _allowedGrid = getUserList(common, _allowed);
                content.push(_allowedGrid.div);
            }
            return h('div', content);
        };

        var redraw = function (right) {
            if (!right) {
                $div1.empty();
                $div1.append(drawLeft());
            }
            $div2.empty();
            $div2.append(drawRight());
        };
        redraw();

        Env.evRedrawAll.reg(function (ownersOrAllow) {
            setTimeout(function () {
                redraw(ownersOrAllow);
            });
        });

        cb(void 0, $div);
    };

    Access.getAccessModal = function (common, opts, cb) {
        cb = cb || function () {};
        opts = opts || {};
        opts.wide = true;
        opts.access = true;

        var hasFriends = Object.keys(common.getFriends()).length;
        var buttons = hasFriends? []: UIElements.noContactsMessage(common).buttons;
        buttons.unshift({
            className: 'cancel',
            name: Messages.filePicker_close,
            onClick: function () {},
            keys: [27],
        });

        var tabs = [{
            getTab: getAccessTab,
            title: Messages.access_main,
            icon: "fa fa-unlock-alt",
        }, {
            getTab: getAllowTab,
            title: Messages.access_allow,
            icon: "fa fa-list",
            buttons: buttons,
        }, {
            getTab: getOwnersTab,
            title: Messages.creation_owners,
            icon: "fa fa-id-badge",
            buttons: buttons,
        }];
        Modal.getModal(common, opts, tabs, cb);
    };

    return Access;
});
