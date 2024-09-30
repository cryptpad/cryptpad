// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
    '/common/common-realtime.js',
    '/common/outer/cache-store.js',
    '/calendar/recurrence.js',
    '/customize/messages.js',
    '/components/nthen/index.js',
    'chainpad-listmap',
    '/lib/datepicker/flatpickr.js',
    '/components/chainpad-crypto/crypto.js',
    '/components/chainpad/chainpad.dist.js',
], function (Util, Hash, Constants, Realtime, Cache, Rec, Messages, nThen, Listmap, FP, Crypto, ChainPad) {
    var Calendar = {};

    var getStore = function (ctx, id) {
        if (!id || id === 1) {
            return ctx.store;
        }
        var m = ctx.store.modules && ctx.store.modules.team;
        if (!m) { return; }
        return m.getTeam(id);
    };

    var makeCalendar = function () {
        var hash = Hash.createRandomHash('calendar');
        var secret = Hash.getSecrets('calendar', hash);
        var roHash = Hash.getViewHashFromKeys(secret);
        var href = Hash.hashToHref(hash, 'calendar');
        var roHref = Hash.hashToHref(roHash, 'calendar');
        return {
            href: href,
            roHref: roHref,
            channel: secret.channel,
        };
    };
    var initializeCalendars = function (ctx, cb) {
        var proxy = ctx.store.proxy;
        proxy.calendars = proxy.calendars || {};
        setTimeout(cb);
    };

    var sendUpdate = function (ctx, c) {
        ctx.emit('UPDATE', {
            teams: c.stores,
            roTeams: c.roStores,
            id: c.channel,
            loading: !c.ready && !c.cacheready,
            readOnly: c.readOnly || (!c.ready && c.cacheready) || c.offline,
            offline: c.offline,
            deleted: !c.stores.length,
            restricted: c.restricted,
            owned: ctx.Store.isOwned(c.owners),
            content: Util.clone(c.proxy),
            hashes: c.hashes
        }, ctx.clients);
    };

    var clearReminders = function (ctx, id) {
        var calendar = ctx.calendars[id];
        if (!calendar || !calendar.reminders) { return; }
        // Clear existing reminders
        Object.keys(calendar.reminders).forEach(function (uid) {
            if (!Array.isArray(calendar.reminders[uid])) { return; }
            calendar.reminders[uid].forEach(function (to) { clearTimeout(to); });
        });
    };
    var closeCalendar = function (ctx, id) {
        var ctxCal = ctx.calendars[id];
        if (!ctxCal) { return; }

        // If the calendar doesn't exist in any other team, stop it and delete it from ctx
        if (!ctxCal.stores.length) {
            ctxCal.lm.stop();
            clearReminders(ctx, id);
            delete ctx.calendars[id];
        }
    };

    var updateLocalCalendars = function (ctx, c, data) {
        // Also update local data
        c.stores.forEach(function (id) {
            var s = getStore(ctx, id);
            if (!s || !s.proxy) { return; }
            if (!s.rpc) { return; } // team viewer
            if (!s.proxy.calendars) { return; }
            var cal = s.proxy.calendars[c.channel];
            if (!cal) { return; }
            if (cal.color !== data.color) { cal.color = data.color; }
            if (cal.title !== data.title) { cal.title = data.title; }
        });
    };

    var getRecurring = function (ev) {
        var mid = new Date();
        var start = new Date(mid.getFullYear(), mid.getMonth()-1, 15);
        var end = new Date(mid.getFullYear(), mid.getMonth()+1, 15);
        var startId = Rec.getMonthId(start);
        var midId = Rec.getMonthId(mid);
        var endId = Rec.getMonthId(end);

        var toAdd = Rec.getRecurring([startId, midId, endId], [ev]);

        var all = [ev];
        Array.prototype.push.apply(all, toAdd);
        return Rec.applyUpdates(all);
    };
    var clearDismissed = function (ctx, uid) {
        var h = Util.find(ctx, ['store', 'proxy', 'hideReminders']) || {};
        Object.keys(h).filter(function (id) {
            return id === uid;
        }).forEach(function (id) {
            delete h[id];
        });
    };
    var _updateEventReminders = function (ctx, reminders, _ev, useLastVisit) {
        var now = +new Date();
        var ev = Util.clone(_ev);
        var uid = ev.id;

        // Clear reminders for this event
        if (Array.isArray(reminders[uid])) {
            reminders[uid].forEach(function (to) { clearTimeout(to); });
        }
        reminders[uid] = [];

        if (_ev.deleted) { return; }

        var d = Util.find(ctx, ['store', 'proxy', 'hideReminders', uid]) || []; // dismissed

        var last = ctx.store.data.lastVisit;

        if (ev.isAllDay) {
            if (ev.startDay) { ev.start = +FP.parseDate(ev.startDay); }
            if (ev.endDay) {
                var endDate = FP.parseDate(ev.endDay);
                endDate.setHours(23);
                endDate.setMinutes(59);
                endDate.setSeconds(59);
                ev.end = +endDate;
            }
        }

        var oneWeekAgo = now - (7 * 24 * 3600 * 1000);
        var missed = useLastVisit && ev.start > last && ev.end <= now && ev.end > oneWeekAgo;
        if (ev.end <= now && !missed) {
            // No reminder for past events
            delete reminders[uid];
            clearDismissed(ctx, uid);
            return;
        }

        var send = function (d) {
            var hide = Util.find(ctx, ['store', 'proxy', 'settings', 'general', 'calendar', 'hideNotif']);
            if (hide) { return; }
            var ctime = ev.start <= now ? ev.start : +new Date(); // Correct order for past events
            ctx.store.mailbox.showMessage('reminders', {
                msg: {
                    ctime: ctime,
                    type: "REMINDER",
                    missed: Boolean(missed),
                    content: ev
                },
                hash: 'REMINDER|'+uid+'-'+d
            }, null, function () {
            });
        };
        var sent = false;
        var sendNotif = function (delay) {
            sent = true;

            ctx.Store.onReadyEvt.reg(function () {
                send(delay);
            });
        };

        var notifs = ev.reminders || [];
        notifs.sort(function (a, b) {
            return a - b;
        });

        notifs.some(function (delayMinutes) {
            var delay = delayMinutes * 60000;
            var time = now + delay;

            if (d.some(function (minutes) {
                return delayMinutes >= minutes;
            })) { return; }

            // setTimeout only work with 32bit timeout values. If the event is too far away,
            // ignore this event for now
            // FIXME: call this function again in xxx days to reload these missing timeout?
            if (ev.start - time >= 2147483647) { return true; }

            // If we're too late to send a notification, send it instantly and ignore
            // all notifications that were supposed to be sent even earlier
            if (ev.start <= time) {
                sendNotif(delayMinutes);
                return true;
            }

            // It starts in more than "delay": prepare the notification
            reminders[uid].push(setTimeout(function () {
                sendNotif(delayMinutes);
            }, (ev.start - time)));
        });

        if (!sent) {
            // Remone any existing notification from the UI
            ctx.Store.onReadyEvt.reg(function () {
                ctx.store.mailbox.hideMessage('reminders', {
                    hash: 'REMINDER|'+uid
                }, null, function () {
                });
            });
        }
    };
    var updateEventReminders = function (ctx, reminders, ev, useLastVisit) {
        var all = getRecurring(Util.clone(ev));
        all.forEach(function (_ev) {
            _updateEventReminders(ctx, reminders, _ev, useLastVisit);
        });
    };
    var addReminders = function (ctx, id, ev) {
        var calendar = ctx.calendars[id];
        if (!ev) { return; }
        if (!calendar || !calendar.reminders) { return; }
        if (calendar.stores.length === 1 && calendar.stores[0] === 0) { return; }

        updateEventReminders(ctx, calendar.reminders, ev);
    };
    var addInitialReminders = function (ctx, id, useLastVisit) {
        var calendar = ctx.calendars[id];
        if (!calendar || !calendar.reminders) { return; }
        if (Object.keys(calendar.reminders).length) { return; } // Already initialized

        // No reminders for calendars not stored
        if (calendar.stores.length === 1 && calendar.stores[0] === 0) { return; }

        // Re-add all reminders
        var content = Util.find(calendar, ['proxy', 'content']);
        if (!content) { return; }
        Object.keys(content).forEach(function (uid) {
            updateEventReminders(ctx, calendar.reminders, content[uid], useLastVisit);
        });
    };
    var openChannel = function (ctx, cfg, _cb) {
        var cb = Util.once(Util.mkAsync(_cb || function () {}));
        var teamId = cfg.storeId;
        var data = cfg.data;
        var channel = data.channel;
        if (!channel) { return; }

        var c = ctx.calendars[channel];

        var update = function () {
            sendUpdate(ctx, c);
        };

        if (c) {
            if (c.readOnly && data.href) {
                // Upgrade readOnly calendar to editable
                var upgradeParsed = Hash.parsePadUrl(data.href);
                var upgradeSecret = Hash.getSecrets('calendar', upgradeParsed.hash, data.password);
                var upgradeCrypto = Crypto.createEncryptor(upgradeSecret.keys);
                c.hashes.editHash = Hash.getEditHashFromKeys(upgradeSecret);
                c.lm.setReadOnly(false, upgradeCrypto);
                c.readOnly = false;
            } else if (teamId === 0) {
                // If we open a second tab with the same temp URL, push to tempId
                if (c.stores.length === 1 && c.stores[0] === 0 && c.tempId.length && cfg.cId) {
                    c.tempId.push(cfg.cId);
                }
                // Existing calendars can't be "temp calendars" (unless they are an upgrade)
                return void cb();
            }

            // Remove from roStores when upgrading this store
            if (c.roStores.indexOf(teamId) !== -1 && data.href) {
                c.roStores.splice(c.roStores.indexOf(teamId), 1);
                // If we've upgraded a stored calendar, remove the temp calendar
                if (c.stores.indexOf(0) !== -1) {
                    c.stores.splice(c.stores.indexOf(0), 1);
                }
                update();
            }

            // Don't store duplicates
            if (c.stores && c.stores.indexOf(teamId) !== -1) { return void cb(); }

            // If we store a temp calendar to our account or team, remove this "temp calendar"
            if (c.stores.indexOf(0) !== -1) {
                c.stores.splice(c.stores.indexOf(0), 1);
                c.tempId = [];
            }

            c.stores.push(teamId);
            if (!data.href) {
                c.roStores.push(teamId);
            }
            update();
            return void cb();
        }

        // Multiple teams can have the same calendar. Make sure we remember the list of stores
        // that know it so that we don't close the calendar when leaving/deleting a team.
        c = ctx.calendars[channel] = {
            ready: false,
            channel: channel,
            readOnly: !data.href,
            tempId: [],
            stores: [teamId],
            roStores: data.href ? [] : [teamId],
            reminders: {},
            hashes: {}
        };

        if (teamId === 0) {
            c.tempId.push(cfg.cId);
        }


        var parsed = Hash.parsePadUrl(data.href || data.roHref);
        var secret = Hash.getSecrets('calendar', parsed.hash, data.password);
        var crypto = Crypto.createEncryptor(secret.keys);

        c.hashes.viewHash = Hash.getViewHashFromKeys(secret);
        if (data.href) {
            c.hashes.editHash = Hash.getEditHashFromKeys(secret);
        }

        c.proxy = {
            metadata: {
                color: data.color,
                title: data.title
            }
        };
        update();

        var onDeleted = function () {
            // Remove this calendar from all our teams
            c.stores.forEach(function (storeId) {
                var store = getStore(ctx, storeId);
                if (!store || !store.rpc || !store.proxy.calendars) { return; }
                delete store.proxy.calendars[channel];
                // And unpin
                var unpin = store.unpin || ctx.unpinPads;
                unpin([channel], function (res) {
                    if (res && res.error) { console.error(res.error); }
                });
            });

            // Close listmap, update the UI and clear the memory
            if (c.lm) { c.lm.stop(); }
            c.stores = [];
            sendUpdate(ctx, c);
            clearReminders(ctx, channel);
            delete ctx.calendars[channel];
        };

        nThen(function (waitFor) {
            if (!ctx.store.network || cfg.isNew) { return; }
            // This is supposed to be an existing channel. Make sure it exists on the server
            // before trying to load it.
            // NOTE: if we can't check (error), we can skip this step. On "ready", we have
            // another check to make sure we won't make a new calendar
            ctx.Store.isNewChannel(null, channel, waitFor(function (obj) {
                if (obj && obj.error) {
                    // If we can't check, skip this part
                    return;
                }
                if (obj && typeof(obj.isNew) === "boolean") {
                    if (obj.isNew) {
                        onDeleted();
                        cb({error: 'EDELETED'});
                        waitFor.abort();
                        return;
                    }
                }
            }));
        }).nThen(function () {
            // Set the owners as the first store opening it. We don't know yet if it's a new or
            // existing calendar. "owners' will be ignored if the calendar already exists.
            var edPublic;
            if (teamId === 1 || !teamId) {
                edPublic = ctx.store.proxy.edPublic;
            } else {
                var teams = ctx.store.modules.team && ctx.store.modules.team.getTeamsData();
                var team = teams && teams[teamId];
                edPublic = team ? team.edPublic : undefined;
            }

            var config = {
                data: {},
                network: ctx.store.network || ctx.store.networkPromise,
                channel: secret.channel,
                crypto: crypto,
                owners: [edPublic],
                ChainPad: ChainPad,
                validateKey: secret.keys.validateKey || undefined,
                userName: 'calendar',
                Cache: Cache,
                classic: true,
                onRejected: ctx.Store && ctx.Store.onRejected
            };

            var lm = Listmap.create(config);
            c.lm = lm;
            var proxy = c.proxy = lm.proxy;

            var _updateCalled = false;
            var _update = function () {
                if (_updateCalled) { return; }
                _updateCalled = true;
                setTimeout(function () {
                    _updateCalled = false;
                    update();
                });
            };

            lm.proxy.on('cacheready', function () {
                if (!proxy.metadata) { return; }
                c.cacheready = true;
                _update();
                if (cb) { cb(null, lm.proxy); }
                addInitialReminders(ctx, channel, cfg.lastVisitNotif);
            }).on('ready', function (info) {
                var md = info.metadata;
                c.owners = md.owners || [];
                c.ready = true;
                if (!proxy.metadata) {
                    if (!cfg.isNew) {
                        // no metadata on an existing calendar: deleted calendar
                        return void onDeleted();
                    }
                    proxy.metadata = {
                        color: data.color,
                        title: data.title
                    };
                }
                _update();
                if (cb) { cb(null, lm.proxy); }
                addInitialReminders(ctx, channel, cfg.lastVisitNotif);
            }).on('change', [], function () {
                if (!c.ready) { return; }
                _update();
            }).on('change', ['content'], function (o, n, p) {
                if (p.length === 2 && n && !o) { // New event
                    return void addReminders(ctx, channel, n);
                }
                if (p.length === 2 && !n && o) { // Deleted event
                    return void addReminders(ctx, channel, {
                        id: p[1],
                        start: 0
                    });
                }
                if (p.length >= 3 && ['start','reminders','isAllDay'].includes(p[2])) {
                    // Updated event
                    return void setTimeout(function () {
                        addReminders(ctx, channel, proxy.content[p[1]]);
                    });
                }
                if (p.length >= 6 && ['start','reminders','isAllDay'].includes(p[5])) {
                    // Updated recurring event
                    return void setTimeout(function () {
                        addReminders(ctx, channel, proxy.content[p[1]]);
                    });
                }
            }).on('remove', ['content'], function (x, p) {
                _update();
                if ((p.length >= 3 && p[2] === 'reminders') ||
                    (p.length >= 6 && p[5] === 'reminders')) {
                    return void setTimeout(function () {
                        addReminders(ctx, channel, proxy.content[p[1]]);
                    });
                }
            }).on('change', ['metadata'], function () {
                // if title or color have changed, update our local values
                var md = proxy.metadata;
                if (!md || !md.title || !md.color) { return; }
                updateLocalCalendars(ctx, c, md);
            }).on('disconnect', function () {
                c.offline = true;
                _update();
            }).on('reconnect', function () {
                c.offline = false;
                _update();
            }).on('error', function (info) {
                if (!info || !info.error) { return; }
                if (info.error === "EDELETED" ) {
                    return void onDeleted();
                }
                if (info.error === "ERESTRICTED" ) {
                    c.restricted = true;
                    _update();
                }
                cb(info);
            });
        });
    };
    var decryptTeamCalendarHref = function (store, calData) {
        if (!calData.href) { return; }

        // Already decrypted? nothing to do
        if (calData.href.indexOf('#') !== -1) { return; }

        // href exists and is encrypted: decrypt if we can or ignore the href
        if (store.secondaryKey) {
            try {
                calData.href = store.userObject.cryptor.decrypt(calData.href);
            } catch (e) {
                console.error(e);
                delete calData.href;
            }
        } else {
            delete calData.href;
        }
    };
    var initializeStore = function (ctx, store) {
        var c = store.proxy.calendars;
        var storeId = store.id || 1;

        // Add listeners
        store.proxy.on('change', ['calendars'], function (o, n, p) {
            if (p.length < 2) { return; }

            // Handle deletions
            if (o && !n) {
                (function () {
                    var id = p[1];
                    var ctxCal = ctx.calendars[id];
                    if (!ctxCal) { return; }
                    var idx = ctxCal.stores.indexOf(storeId);

                    // Check if the team has loaded this calendar in memory
                    if (idx === -1) { return; }

                    // Remove the team from memory
                    ctxCal.stores.splice(idx, 1);
                    var roIdx = ctxCal.roStores.indexOf(storeId);
                    if (roIdx !== -1) { ctxCal.roStores.splice(roIdx, 1); }

                    // Check if we need to close listmap and update the UI
                    closeCalendar(ctx, id);
                    sendUpdate(ctx, ctxCal);
                })();
            }

            // Handle additions
            // NOTE: this also upgrade from readOnly to edit (add an "href" to the calendar)
            if (!o && n) {
                (function () {
                    var id = p[1];
                    var _cal = store.proxy.calendars[id];
                    if (!_cal) { return; }
                    var cal = Util.clone(_cal);
                    decryptTeamCalendarHref(store, cal);
                    openChannel(ctx, {
                        storeId: storeId,
                        data: cal
                    });
                })();
            }
        });

        // If this store contains existing calendars, open them
        Object.keys(c || {}).forEach(function (channel) {
            var cal = Util.clone(c[channel]);
            decryptTeamCalendarHref(store, cal);
            openChannel(ctx, {
                storeId: storeId,
                lastVisitNotif: true,
                data: cal
            });
        });
    };
    var openChannels = function (ctx) {
        // Personal drive
        initializeStore(ctx, ctx.store);

        var teams = ctx.store.modules.team && ctx.store.modules.team.getTeamsData();
        if (!teams) { return; }
        Object.keys(teams).forEach(function (id) {
            var store = getStore(ctx, id);
            initializeStore(ctx, store);
        });
    };


    var subscribe = function (ctx, data, cId, cb) {
        // Subscribe to new notifications
        var idx = ctx.clients.indexOf(cId);
        if (idx === -1) {
            ctx.clients.push(cId);
        }
        cb({
            empty: !Object.keys(ctx.calendars).length
        });
        Object.keys(ctx.calendars).forEach(function (channel) {
            var c = ctx.calendars[channel] || {};
            sendUpdate(ctx, c);
        });
    };

    var importICSCalendar = function (ctx, data, cId, cb) {
        var id = data.id;
        var c = ctx.calendars[id];
        if (!c || !c.proxy) { return void cb({error: "ENOENT"}); }
        var json = data.json;
        c.proxy.content = c.proxy.content || {};
        Object.keys(json).forEach(function (uid) {
            c.proxy.content[uid] = json[uid];
            addReminders(ctx, id, json[uid]);
        });

        Realtime.whenRealtimeSyncs(c.lm.realtime, function () {
            sendUpdate(ctx, c);
            cb();
        });
    };

    var openCalendar = function (ctx, data, cId, cb) {
        var secret = Hash.getSecrets('calendar', data.hash, data.password);
        var hash = Hash.getEditHashFromKeys(secret);
        var roHash = Hash.getViewHashFromKeys(secret);

        //if (!ctx.loggedIn) { hash = undefined; }

        var cal = {
            href: hash && Hash.hashToHref(hash, 'calendar'),
            roHref: roHash && Hash.hashToHref(roHash, 'calendar'),
            channel: secret.channel,
            color: Util.getRandomColor(),
            title: '...'
        };
        openChannel(ctx, {
            cId: cId,
            storeId: 0,
            data: cal
        }, cb);
    };
    var importCalendar = function (ctx, data, cId, cb) {
        var id = data.id;
        var c = ctx.calendars[id];
        if (!c) { return void cb({error: "ENOENT"}); }
        if (!Array.isArray(c.stores) || c.stores.indexOf(data.teamId) === -1) {
            return void cb({error: 'EINVAL'});
        }

        // Add to my calendars
        var store = ctx.store;
        var calendars = store.proxy.calendars = store.proxy.calendars || {};
        var hash = c.hashes.editHash;
        var roHash = c.hashes.viewHash;
        calendars[id] = {
            href: hash && Hash.hashToHref(hash, 'calendar'),
            roHref: roHash && Hash.hashToHref(roHash, 'calendar'),
            channel: id,
            color: Util.find(c,['proxy', 'metadata', 'color']) || Util.getRandomColor(),
            title: Util.find(c,['proxy', 'metadata', 'title']) || '...'
        };
        ctx.Store.onSync(null, cb);

        // Make the change in memory
        openChannel(ctx, {
            storeId: 1,
            data: {
                href: calendars[id].href,
                toHref: calendars[id].roHref,
                channel: id
            }
        });
    };
    var addCalendar = function (ctx, data, cId, cb) {
        var store = getStore(ctx, data.teamId);
        if (!store) { return void cb({error: "NO_STORE"}); }
        // Check team edit rights: viewers in teams don't have rpc
        if (!store.rpc) { return void cb({error: "EFORBIDDEN"}); }

        var c = store.proxy.calendars = store.proxy.calendars || {};
        var parsed = Hash.parsePadUrl(data.href);
        var secret = Hash.getSecrets(parsed.type, parsed.hash, data.password);

        if (secret.channel !== data.channel) { return void cb({error: 'EINVAL'}); }

        var hash = Hash.getEditHashFromKeys(secret);
        var roHash = Hash.getViewHashFromKeys(secret);
        var href = hash && Hash.hashToHref(hash, 'calendar');
        var cal = {
            href: href,
            roHref: roHash && Hash.hashToHref(roHash, 'calendar'),
            color: data.color,
            title: data.title,
            channel: data.channel
        };

        // If it already existed and it's not an upgrade, nothing to do
        if (c[data.channel] && (c[data.channel].href || !cal.href)) { return void cb(); }

        cal.color = data.color;
        cal.title = data.title;
        openChannel(ctx, {
            storeId: store.id || 1,
            data: Util.clone(cal)
        }, function (err) {
            if (err) {
                // Can't open this channel, don't store it
                console.error(err);
                return void cb({error: err.error});
            }

            if (href && store.id && store.secondaryKey) {
                try {
                    cal.href = store.userObject.cryptor.encrypt(href);
                } catch (e) {
                    console.error(e);
                }
            }

            // Add the calendar and call back
            // If it already existed it means this is an upgrade
            c[cal.channel] = cal;
            var pin = store.pin || ctx.pinPads;
            pin([cal.channel], function (res) {
                if (res && res.error) { console.error(res.error); }
            });
            ctx.Store.onSync(store.id, cb);
        });
    };
    var createCalendar = function (ctx, data, cId, cb) {
        var store = getStore(ctx, data.teamId);
        if (!store) { return void cb({error: "NO_STORE"}); }
        // Check team edit rights: viewers in teams don't have rpc
        if (!store.rpc) { return void cb({error: "EFORBIDDEN"}); }

        var c = store.proxy.calendars = store.proxy.calendars || {};
        var cal = makeCalendar();
        cal.color = data.color;
        cal.title = data.title;
        openChannel(ctx, {
            storeId: store.id || 1,
            data: cal,
            isNew: true
        }, function (err) {
            if (err) {
                // Can't open this channel, don't store it
                console.error(err);
                return void cb({error: err.error});
            }
            // Add the calendar and call back
            // Wait for the metadata to be stored (channel fully ready) before adding it
            // to our store
            var ctxCal = ctx.calendars[cal.channel];
            Realtime.whenRealtimeSyncs(ctxCal.lm.realtime, function () {
                c[cal.channel] = cal;
                var pin = store.pin || ctx.pinPads;
                pin([cal.channel], function (res) {
                    if (res && res.error) { console.error(res.error); }
                });
                ctx.Store.onSync(store.id, cb);
            });
        });
    };
    var updateCalendar = function (ctx, data, cId, cb) {
        var id = data.id;
        var c = ctx.calendars[id];
        if (!c) { return void cb({error: "ENOENT"}); }
        var md = Util.find(c, ['proxy', 'metadata']);
        if (!md) { return void cb({error: 'EINVAL'}); }
        md.title = data.title;
        md.color = data.color;
        Realtime.whenRealtimeSyncs(c.lm.realtime, cb);
        sendUpdate(ctx, c);

        updateLocalCalendars(ctx, c, data);
    };
    var deleteCalendar = function (ctx, data, cId, cb) {
        var store = getStore(ctx, data.teamId);
        if (!store) { return void cb({error: "NO_STORE"}); }
        if (!store.rpc) { return void cb({error: "EFORBIDDEN"}); }
        if (!store.proxy.calendars) { return; }
        var id = data.id;
        var cal = store.proxy.calendars[id];
        if (!cal) { return void cb(); } // Already deleted

        // Delete
        delete store.proxy.calendars[id];

        // Unpin
        var unpin = store.unpin || ctx.unpinPads;
        unpin([id], function (res) {
            if (res && res.error) { console.error(res.error); }
        });

        // Clear/update ctx data

        // Remove this store from the calendar's clients
        var ctxCal = ctx.calendars[id];
        var idx = ctxCal.stores.indexOf(store.id || 1);
        ctxCal.stores.splice(idx, 1);

        closeCalendar(ctx, id);

        ctx.Store.onSync(store.id, function () {
            sendUpdate(ctx, ctxCal);
            cb();
        });
    };

    var createEvent = function (ctx, data, cId, cb) {
        var id = data.calendarId;
        var c = ctx.calendars[id];
        if (!c) { return void cb({error: "ENOENT"}); }

        var startDate = new Date(data.start);
        var endDate = new Date(data.end);
        if (data.isAllDay) {
            data.startDay = startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate();
            data.endDay = endDate.getFullYear() + '-' + (endDate.getMonth()+1) + '-' + endDate.getDate();
        } else {
            delete data.startDay;
            delete data.endDay;
        }

        c.proxy.content = c.proxy.content || {};
        c.proxy.content[data.id] = data;

        Realtime.whenRealtimeSyncs(c.lm.realtime, function () {
            addReminders(ctx, id, data);
            sendUpdate(ctx, c);
            cb();
        });
    };
    var updateEvent = function (ctx, data, cId, cb) {
        if (!data || !data.ev) { return void cb({error: 'EINVAL'}); }
        var id = data.ev.calendarId;
        var c = ctx.calendars[id];
        if (!c || !c.proxy || !c.proxy.content) { return void cb({error: "ENOENT"}); }

        // Find the event
        var ev = c.proxy.content[data.ev.id];
        if (!ev) { return void cb({error: "EINVAL"}); }

        data.rawData = data.rawData || {};

        // update the event
        var changes = data.changes || {};
        var type = data.type || {};

        var newC;
        if (changes.calendarId) {
            newC = ctx.calendars[changes.calendarId];
            if (!newC || !newC.proxy) { return void cb({error: "ENOENT"}); }
            newC.proxy.content = newC.proxy.content || {};
        }

        var RECUPDATE = {
            one: {},
            from: {}
        };
        if (['one','from','all'].includes(type.which)) {
            ev.recUpdate = ev.recUpdate || RECUPDATE;
            if (!ev.recUpdate.one) { ev.recUpdate.one = {}; }
            if (!ev.recUpdate.from) { ev.recUpdate.from = {}; }
        }
        var update = ev.recUpdate;
        var alwaysAll = ['calendarId'];
        var keys = Object.keys(changes).filter(function (s) {
            // we can only change the calendar or recurrence rule on the origin
            return !alwaysAll.includes(s);
        });

        // Delete (future) affected keys
        var cleanAfter = function (time) {
            [update.from, update.one].forEach(function (obj) {
                Object.keys(obj).forEach(function (d) {
                    if (Number(d) < time) { return; }
                    delete obj[d];
                });
            });
        };
        var cleanKeys = function (obj, when) {
            Object.keys(obj).forEach(function (d) {
                if (when && Number(d) < when) { return; }
                keys.forEach(function (k) {
                    delete obj[d][k];
                });
            });
        };


        // Update recurrence rule. We may create a new event here
        var dontSendUpdate = false;
        if (typeof(changes.recurrenceRule) !== "undefined") {
            if (type.which === "all" && changes.recurrenceRule.until) {
                // Remove changes after the last iteration
                cleanAfter(changes.recurrenceRule.until);
            }
            else if (['one','from'].includes(type.which) && !data.rawData.isOrigin) {
                // Start cleaning after the event (otherwise it resets the current event)
                cleanAfter(type.when + 1);
            } else {
                // Else wipe everything
                update = ev.recUpdate = RECUPDATE;
            }
        }

        if (type.which === "one") {
            update.one[type.when] = update.one[type.when] || {};
            // Nothing to delete
        } else if (type.which === "from") {
            update.from[type.when] = update.from[type.when] || {};
            // Delete all "single/from" updates (affected keys only) after this "from" date
            cleanKeys(update.from, type.when);
            cleanKeys(update.one, type.when);
        } else if (type.which === "all") {
            // Delete all "single/from" updates (affected keys only) after
            cleanKeys(update.from);
            cleanKeys(update.one);
        }

        if (changes.start && update && (!type.which || type.which === "all")) {
            var diff = changes.start - ev.start;
            var newOne = {};
            var newFrom = {};
            Object.keys(update.one || {}).forEach(function (time) {
                newOne[Number(time)+diff] = update.one[time];
            });
            Object.keys(update.from || {}).forEach(function (time) {
                newFrom[Number(time)+diff] = update.from[time];
            });
            update.one = newOne;
            update.from = newFrom;
        }


        // Clear the "dismissed" reminders when the user is updating reminders
        var h = Util.find(ctx, ['store', 'proxy', 'hideReminders']) || {};
        if (changes.reminders) {
            if (type.which === 'one') {
                if (!type.when || type.when === ev.start) { delete h[data.ev.id]; }
                else { delete h[data.ev.id +'|'+ type.when]; }
            } else if (type.which === "from") {
                Object.keys(h).filter(function (id) {
                    return id.indexOf(data.ev.id) === 0;
                }).forEach(function (id) {
                    var time = Number(id.split('|')[1]);
                    if (!time) { return; }
                    if (time < type.when) { return; }
                    delete h[id];
                });
            } else {
                Object.keys(h).filter(function (id) {
                    return id.indexOf(data.ev.id) === 0;
                }).forEach(function (id) {
                    delete h[id];
                });
            }
        }

        // Apply the changes
        Object.keys(changes).forEach(function (key) {
            if (!alwaysAll.includes(key) && type.which === "one") {
                if (key === "recurrenceRule") {
                    if (data.rawData && data.rawData.isOrigin) {
                        return (ev[key] = changes[key]);
                    }
                    // Always "from", never "one" for recurrence rules
                    update.from[type.when] = update.from[type.when] || {};
                    return (update.from[type.when][key] = changes[key]);
                }
                update.one[type.when][key] = changes[key];
                return;
            }
            if (!alwaysAll.includes(key) && type.which === "from") {
                update.from[type.when][key] = changes[key];
                return;
            }
            ev[key] = changes[key];
        });

        var startDate = new Date(ev.start);
        var endDate = new Date(ev.end);
        if (ev.isAllDay) {
            ev.startDay = startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate();
            ev.endDay = endDate.getFullYear() + '-' + (endDate.getMonth()+1) + '-' + endDate.getDate();
        } else {
            delete ev.startDay;
            delete ev.endDay;
        }

        // Move to a different calendar?
        if (changes.calendarId && newC) {
            newC.proxy.content[data.ev.id] = Util.clone(ev);
            delete c.proxy.content[data.ev.id];
        }


        nThen(function (waitFor) {
            Realtime.whenRealtimeSyncs(c.lm.realtime, waitFor());
            if (newC) { Realtime.whenRealtimeSyncs(newC.lm.realtime, waitFor()); }
        }).nThen(function () {
            if (newC) {
                // Move reminders to the new calendar
                addReminders(ctx, id, {
                    id: ev.id,
                    start: 0
                });
                addReminders(ctx, ev.calendarId, ev);
            } else if (changes.start || changes.reminders || changes.isAllDay) {
                // Update reminders
                addReminders(ctx, id, ev);
            }

            if (!dontSendUpdate || newC) { sendUpdate(ctx, c); }
            if (newC && !dontSendUpdate) { sendUpdate(ctx, newC); }
            cb();
        });
    };
    var deleteEvent = function (ctx, data, cId, cb) {
        var id = data.calendarId;
        var c = ctx.calendars[id];
        if (!c) { return void cb({error: "ENOENT"}); }
        c.proxy.content = c.proxy.content || {};
        var evId = data.id.split('|')[0];
        if (data.id === evId) {
            delete c.proxy.content[data.id];
        } else {
            var ev = c.proxy.content[evId];
            var s = data.raw && data.raw.start;
            if (s) {
                ev.recUpdate = ev.recUpdate || {
                    one: {},
                    from: {}
                };
                ev.recUpdate.one[s] = {
                    deleted: true
                };
            }
        }
        Realtime.whenRealtimeSyncs(c.lm.realtime, function () {
            addReminders(ctx, id, {
                id: data.id,
                start: 0
            });
            sendUpdate(ctx, c);
            cb();
        });
    };

    var removeClient = function (ctx, cId) {
        var idx = ctx.clients.indexOf(cId);
        if (idx !== -1) { ctx.clients.splice(idx, 1); }

        Object.keys(ctx.calendars).forEach(function (id) {
            var cal = ctx.calendars[id];
            if (cal.stores.length !== 1 || cal.stores[0] !== 0 || !cal.tempId.length) { return; }
            // This is a temp calendar: check if the closed tab had this calendar opened
            var idx = cal.tempId.indexOf(cId);
            if (idx !== -1) { cal.tempId.splice(idx, 1); }
            if (!cal.tempId.length) {
                cal.stores = [];
                // Close calendar
                closeCalendar(ctx, id);
            }
        });
    };

    Calendar.init = function (cfg, waitFor, emit) {
        var calendar = {};
        var store = cfg.store;
        var ctx = {
            loggedIn: store.loggedIn && store.proxy.edPublic,
            store: store,
            Store: cfg.Store,
            pinPads: cfg.pinPads,
            unpinPads: cfg.unpinPads,
            updateMetadata: cfg.updateMetadata,
            emit: emit,
            onReady: Util.mkEvent(true),
            calendars: {},
            clients: []
        };

        initializeCalendars(ctx, waitFor(function (err) {
            if (err) { return; }
            openChannels(ctx);
        }));

        ctx.store.proxy.on('change', ['hideReminders'], function (o,n,p) {
            var uid = p[1].split('|')[0];
            Object.keys(ctx.calendars).some(function (calId) {
                var c = ctx.calendars[calId];
                if (!c || !c.proxy || !c.proxy.content) { return; }
                if (c.proxy.content[uid]) {
                    setTimeout(function () {
                        addReminders(ctx, calId, c.proxy.content[uid]);
                    });
                    return true;
                }
            });
        });

        calendar.closeTeam = function (teamId) {
            Object.keys(ctx.calendars).forEach(function (id) {
                var ctxCal = ctx.calendars[id];
                var idx = ctxCal.stores.indexOf(teamId);
                if (idx === -1) { return; }
                ctxCal.stores.splice(idx, 1);
                var roIdx = ctxCal.roStores.indexOf(teamId);
                if (roIdx !== -1) { ctxCal.roStores.splice(roIdx, 1); }

                closeCalendar(ctx, id);
                sendUpdate(ctx, ctxCal);
            });
        };
        calendar.openTeam = function (teamId) {
            var store = getStore(ctx, teamId);
            if (!store) { return; }
            initializeStore(ctx, store);
        };
        calendar.upgradeTeam = function (teamId) {
            if (!teamId) { return; }
            var store = getStore(ctx, teamId);
            if (!store) { return; }
            Object.keys(ctx.calendars).forEach(function (id) {
                var ctxCal = ctx.calendars[id];
                var idx = ctxCal.stores.indexOf(teamId);
                if (idx === -1) { return; }
                var _cal = store.proxy.calendars[id];
                var cal = Util.clone(_cal);
                decryptTeamCalendarHref(store, cal);
                openChannel(ctx, {
                    storeId: teamId,
                    data: cal
                });
                sendUpdate(ctx, ctxCal);
            });
        };

        calendar.removeClient = function (clientId) {
            removeClient(ctx, clientId);
        };
        calendar.execCommand = function (clientId, obj, cb) {
            var cmd = obj.cmd;
            var data = obj.data;
            if (cmd === 'SUBSCRIBE') {
                return void subscribe(ctx, data, clientId, cb);
            }
            if (cmd === 'OPEN') {
                ctx.Store.onReadyEvt.reg(function () {
                    openCalendar(ctx, data, clientId, cb);
                });
                return;
            }
            if (cmd === 'IMPORT') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void importCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'IMPORT_ICS') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                //if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void importICSCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'ADD') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void addCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE') {
                if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                if (data.initialCalendar) {
                    return void ctx.Store.onReadyEvt.reg(function () {
                        createCalendar(ctx, data, clientId, cb);
                    });
                }
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                return void createCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'UPDATE') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                //if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void updateCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'DELETE') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void deleteCalendar(ctx, data, clientId, cb);
            }
            if (cmd === 'CREATE_EVENT') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                //if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void createEvent(ctx, data, clientId, cb);
            }
            if (cmd === 'UPDATE_EVENT') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                //if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void updateEvent(ctx, data, clientId, cb);
            }
            if (cmd === 'DELETE_EVENT') {
                if (ctx.store.offline) { return void cb({error: 'OFFLINE'}); }
                //if (!ctx.loggedIn) { return void cb({error: 'NOT_LOGGED_IN'}); }
                return void deleteEvent(ctx, data, clientId, cb);
            }
        };

        return calendar;
    };

    return Calendar;
});



