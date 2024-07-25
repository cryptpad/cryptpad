// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    'json.sortify',
    '/components/chainpad-crypto/crypto.js',
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
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/lib/calendar/tui-calendar.min.js',
    '/calendar/export.js',
    '/calendar/recurrence.js',
    '/lib/datepicker/flatpickr.js',
    'tui-date-picker',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/common/diffMarked.js',
    '/common/sframe-common-codemirror.js',
    'cm/lib/codemirror',

    'cm/addon/display/autorefresh',
    'cm/addon/display/placeholder',
    'cm/mode/gfm/gfm',
    '/common/jscolor.js',
    '/components/file-saver/FileSaver.min.js',
    'css!/lib/calendar/tui-calendar.min.css',
    'css!/components/codemirror/lib/codemirror.css',
    'css!/components/codemirror/addon/dialog/dialog.css',
    'css!/components/components-font-awesome/css/font-awesome.min.css',
    'css!/components/bootstrap/dist/css/bootstrap.min.css',
    'less!/calendar/app-calendar.less',
], function (
    $,
    JSONSortify,
    Crypto,
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
    h,
    Messages,
    AppConfig,
    Calendar,
    Export,
    Rec,
    Flatpickr,
    DatePicker,
    Share, Access, Properties,
    diffMk,
    SFCodeMirror,
    CodeMirror
    )
{

    var SaveAs = window.saveAs;
    var APP = window.APP = {
        calendars: {}
    };

    var common;
    var metadataMgr;
    var sframeChan;

    var onCalendarsUpdate = Util.mkEvent();

    var newCalendar = function (data, cb) {
        APP.module.execCommand('CREATE', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var updateCalendar = function (data, cb) {
        APP.module.execCommand('UPDATE', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var deleteCalendar = function (data, cb) {
        APP.module.execCommand('DELETE', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var importCalendar = function (data, cb) {
        APP.module.execCommand('IMPORT', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var importICSCalendar = function (data, cb) {
        APP.module.execCommand('IMPORT_ICS', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var newEvent = function (event, cb) {
        var reminders = APP.notificationsEntries;
        var eventBody = APP.eventBody || "";

        var startDate = event.start._date;
        var endDate = event.end._date;

        var timeZone;
        try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
        var data = {
            id: Util.uid(),
            calendarId: event.calendarId,
            title: event.title,
            category: "time",
            location: event.location,
            start: +startDate,
            isAllDay: event.isAllDay,
            end: +endDate,
            reminders: reminders,
            body: eventBody,
            timeZone: timeZone,
            recurrenceRule: event.recurrenceRule
        };

        APP.module.execCommand('CREATE_EVENT', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var updateEvent = function (data, cb) {
        APP.module.execCommand('UPDATE_EVENT', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };
    var deleteEvent = function (data, cb) {
        APP.module.execCommand('DELETE_EVENT', data, function (obj) {
            if (obj && obj.error) { return void cb(obj.error); }
            cb(null, obj);
        });
    };

    var getContrast = function (color) {
        var rgb = Util.hexToRGB(color);
        // http://www.w3.org/TR/AERT#color-contrast
        var brightness = Math.round(((parseInt(rgb[0]) * 299) +
                          (parseInt(rgb[1]) * 587) +
                          (parseInt(rgb[2]) * 114)) / 1000);
        return (brightness > 125) ? '#424242' : '#EEEEEE';
    };

    var getDateLanguage = function () {
        try {
            new Date().toLocaleDateString(Messages._languageUsed, { weekday: 'long' });
            return Messages._languageUsed;
        } catch (e) {
            return;
        }
    };

    var getWeekDays = function (large) {
        var baseDate = new Date(2017, 0, 1); // just a Sunday
        var weekDays = [];
        for(var i = 0; i < 7; i++) {
            weekDays.push(baseDate.toLocaleDateString(getDateLanguage(), { weekday: 'long' }));
            baseDate.setDate(baseDate.getDate() + 1);
        }
        if (!large) {
            weekDays = weekDays.map(function (day) { return day.slice(0,3); });
        }
        return weekDays.map(function (day) { return day.replace(/^./, function (str) { return str.toUpperCase(); }); });
    };

    // Get week number in our calendar view
    var ISO8601_week_no = function (dt) {
        var tdt = new Date(dt.valueOf());
        var dayn = (dt.getDay() + 6) % 7;
        tdt.setDate(tdt.getDate() - dayn + 3);
        var firstThursday = tdt.valueOf();
        tdt.setMonth(0, 1);
        if (tdt.getDay() !== 4) {
            tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
        }
        return 1 + Math.ceil((firstThursday - tdt) / 604800000);
    };

    var updateDateRange = function () {
        var range = APP.calendar._renderRange;
        var start = range.start._date.toLocaleDateString();
        var end = range.end._date.toLocaleDateString();
        var week = ISO8601_week_no(range.start._date);
        var date = [
            h('b.cp-small', Messages._getKey('calendar_weekNumber', [week])),
            h('b', start),
            h('span', ' - '),
            h('b', end),
        ];
        if (APP.calendar._viewName === "day") {
            date = h('b', start);
        } else if (APP.calendar._viewName === "month") {
            var month;
            var mid = new Date(Math.floor(((+range.start._date) + (+range.end._date)) / 2));
            try {
                month = mid.toLocaleString('default', {
                    month: 'long',
                    year:'numeric'
                });
                month = month.replace(/^./, function (str) { return str.toUpperCase(); });
                date = h('b', month);
            } catch (e) {
                // Use same as week range: first day of month to last day of month
            }
        }
        APP.toolbar.$bottomM.empty().append(h('div', date));
    };
    APP.moveToDate = function (time) {
        var cal = APP.calendar;
        if (!cal) { return; }

        // Move calendar to correct date
        var d = new Date(time);
        cal.setDate(d);
        updateDateRange();

        if (cal.getViewName() === 'month') { return; }

        // Scroll to correct time
        setTimeout(function () {
            var h = d.toLocaleTimeString('en-US', { hour12: 0, timeStyle: "short" }).slice(0,2);
            h = Number(h) % 24;
            var $h = $('.tui-full-calendar-timegrid-timezone .tui-full-calendar-timegrid-hour');
            try { $h.get(h).scrollIntoView(); } catch (e) { console.error(e); }
        });
    };

    var getCalendars = function () {
        var LOOKUP = {};
        var TEAMS = {};
        return Object.keys(APP.calendars).map(function (id) {
            var c = APP.calendars[id];
            if (c.hidden || c.restricted || c.loading) { return; }
            var md = Util.find(c, ['content', 'metadata']);
            if (!md) { return void console.error('Ignore calendar without metadata'); }
            return {
                id: id,
                name: md.title,
                color: getContrast(md.color),
                bgColor: md.color,
                dragBgColor: md.color,
                borderColor: md.color,
            };
        }).filter(Boolean).map(function (obj) {
            var id = obj.id;
            var cal = APP.calendars[id];
            var team = cal.teams.sort()[0] || cal.roTeams.sort()[0];
            var title = Util.find(cal, ['content', 'metadata', 'title']) || '';
            LOOKUP[id] = title;
            TEAMS[id] = team;
            return obj;
        }).sort(function (a, b) {
            var team1 = TEAMS[a.id];
            var team2 = TEAMS[b.id];
            var t1 = LOOKUP[a.id];
            var t2 = LOOKUP[b.id];
            return team1 > team2 ? 1 :
                    (team1 < team2 ? -1 : (
                        t1 > t2 ? 1 : (t1 < t2 ? -1 : 0)));
        });
    };
    var getSchedules = function () {
        APP.recurringEvents = [];
        APP.recurringDone = [];
        var s = [];
        var calendars = Object.keys(APP.calendars);
        if (APP.currentCalendar) {
            var currentCal = calendars.filter(function (id) {
                var c = APP.calendars[id];
                var t = c.teams || [];
                if (id !== APP.currentCalendar) { return; }
                return t.length === 1 && t[0] === 0;
            });
            if (currentCal.length) { calendars = currentCal; }
        }
        calendars.forEach(function (id) {
            var c = APP.calendars[id];
            if (c.hidden || c.restricted || c.loading) { return; }
            var data = c.content || {};
            Object.keys(data.content || {}).forEach(function (uid) {
                var obj = data.content[uid];
                obj.title = obj.title || "";
                obj.location = obj.location || "";
                obj.body = obj.body || "";
                if (obj.isAllDay && obj.startDay) { obj.start = +DatePicker.parseDate((obj.startDay)); }
                if (obj.isAllDay && obj.endDay) {
                    var endDate = DatePicker.parseDate(obj.endDay);
                    endDate.setHours(23);
                    endDate.setMinutes(59);
                    endDate.setSeconds(59);
                    obj.end = +endDate;
                }
                if (c.readOnly) {
                    obj.isReadOnly = true;
                }
                if (obj.recurrenceRule) {
                    APP.recurringEvents.push(obj);
                }
                s.push(Util.clone(data.content[uid]));
            });
        });
        return s;
    };

    var applyUpdates = Rec.applyUpdates;

    var updateRecurring = function () {}; // Defined later
    var renderCalendar = function () {
        var cal = APP.calendar;
        if (!cal) { return; }

        try {
            cal.clear();
            cal.setCalendars(getCalendars());
            cal.createSchedules(applyUpdates(getSchedules()), true);
            cal.render();
            if (APP.initTime && APP.moveToDate) {
                APP.moveToDate(APP.initTime);
                delete APP.initTime;
            }
            Rec.resetCache();
            updateRecurring();
        } catch (e) {
            console.error(e);
        }
    };
    var onCalendarUpdate = function (data) {
        var cal = APP.calendar;

        if (data.deleted) {
            // Remove this calendar
            delete APP.calendars[data.id];
        } else {
            // Update local data
            APP.calendars[data.id] = data;
        }

        // If calendar if initialized, update it
        if (!cal) { return; }
        onCalendarsUpdate.fire();
        renderCalendar();
    };

    var getTime = function (time) {
        var d = new Date();
        d.setHours(time.hour);
        d.setMinutes(time.minutes);
        return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    };

    // If this browser doesn't support options to toLocaleTimeString, use default layout
    if (!(function () {
        // Modern browser will return a RangeError if the "locale" argument is invalid.
        // Note: the "locale" argument has the same browser compatibility table as the "options"
        try {
            new Date().toLocaleTimeString('i');
        } catch (e) {
            return e.name === 'RangeError';
        }
    })()) { getTime = undefined; }

    var templates = {
        popupSave: function (obj) {
            APP.editModalData = obj.data && obj.data.root;
            return Messages.settings_save;
        },
        popupUpdate: function(obj) {
            APP.editModalData = obj.data && obj.data.root;
            return Messages.calendar_update;
        },
        monthGridHeaderExceed: function(hiddenSchedules) {
            return '<span class="tui-full-calendar-weekday-grid-more-schedules">' + Messages._getKey('calendar_more', [hiddenSchedules]) + '</span>';
        },
        popupEdit: function(obj) {
            APP.editModalData = obj.data && obj.data.root;
            return Messages.poll_edit;
        },
        popupDetailLocation: function(schedule) {
            var l = schedule.location;
            var str = Util.fixHTML(l);
            delete APP.nextLocationUid;
            if (/^https?:\/\//.test(l)) {
                var uid = "cp-link-"+Util.uid();
                str = `<a href="${l}" id="${uid}">${str}</a>`;
                APP.nextLocationUid = uid;
            }
            let location_icon = h('i.fa.fa-map-marker.tui-full-calendar-icon', { 'aria-label': Messages.calendar_loc }, []);
            return location_icon.outerHTML + str;
        },
        popupDetailBody: function(schedule) {
            var str = schedule.body;
            delete APP.eventBody;
            return diffMk.render(str, true);
        },
        popupIsAllDay: function() { return Messages.calendar_allDay; },
        titlePlaceholder: function() { return Messages.calendar_title; },
        locationPlaceholder: function() { return Messages.calendar_loc; },
        alldayTitle: function() {
            return '<span class="tui-full-calendar-left-content">'+Messages.calendar_allDay+'</span>';
        },
        timegridDisplayTime: getTime,
        timegridDisplayPrimaryTime: getTime,
        popupDetailDate: function(isAllDay, start, end) {
            var startDate = start._date.toLocaleDateString();
            var endDate = end._date.toLocaleDateString();
            if (isAllDay) {
                if (startDate === endDate) { return startDate; }
                return Messages._getKey('calendar_dateRange', [startDate, endDate]);
            }

            var startTime = getTime({
                hour: start._date.getHours(),
                minutes: start._date.getMinutes(),
            });
            var endTime = getTime({
                hour: end._date.getHours(),
                minutes: end._date.getMinutes(),
            });

            if (startDate === endDate && startTime === endTime) {
                return start._date.toLocaleString();
            }
            if (startDate === endDate) {
                return Messages._getKey('calendar_dateTimeRange', [startDate, startTime, endTime]);
            }
            return Messages._getKey('calendar_dateRange', [start._date.toLocaleString(), end._date.toLocaleString()]);
        }
    };

    var editCalendar = function (id) {
        var isNew = !id;
        var data = APP.calendars[id];
        if (id && !data) { return; }
        var md = {};
        if (!isNew) { md = Util.find(data, ['content', 'metadata']); }
        if (!md) { return; }

        // Create form data
        var labelTitle = h('label', Messages.kanban_title);
        var title = h('input');
        var $title = $(title);
        $title.val(md.title || Messages.calendar_new);
        var labelColor = h('label', Messages.kanban_color);

        var $colorPicker = $(h('div.cp-calendar-colorpicker'));
        var jscolorL = new window.jscolor($colorPicker[0], { showOnClick: false, valueElement: undefined, zIndex: 100000 });
        $colorPicker.click(function() {
            jscolorL.show();
        });
        if (md.color) { jscolorL.fromString(md.color); }
        else { jscolorL.fromString(Util.getRandomColor()); }

        var form = h('div', [
            labelTitle,
            title,
            labelColor,
            $colorPicker[0]
        ]);

        var send = function (obj) {
            if (isNew) {
                return void newCalendar(obj, function (err) {
                    if (err) { console.error(err); return void UI.warn(Messages.error); }
                    UI.log(Messages.saved);
                });
            }
            obj.id = id;
            updateCalendar(obj, function (err) {
                if (err) { console.error(err); return void UI.warn(Messages.error); }
                UI.log(Messages.saved);
            });
        };
        var m = UI.dialog.customModal(form, {
            buttons: [{
                className: 'cancel',
                name: Messages.cancel,
                onClick: function () {},
                keys: [27]
            }, {
                className: 'primary',
                name: Messages.settings_save,
                onClick: function () {
                    var color = jscolorL.toHEXString();
                    var title = $title.val();
                    var obj = {
                        color: color,
                        title: title
                    };
                    if (!title || !title.trim() ||!/^#[0-9a-fA-F]{6}$/.test(color)) {
                        return true;
                    }
                    send(obj);
                },
                keys: [13]
            }]
        });
        UI.openCustomModal(m);
    };

    var isReadOnly = function (id, teamId) {
        var data = APP.calendars[id];
        return data.readOnly || (data.roTeams && data.roTeams.indexOf(teamId) !== -1);
    };
    var makeEditDropdown = function (id, teamId) {
        var options = [];
        var privateData = metadataMgr.getPrivateData();
        var cantRemove = teamId === 0 || (teamId !== 1 && privateData.teams[teamId].viewer);
        var data = APP.calendars[id];
        if (!data.readOnly) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-pencil',
                },
                content: h('span', Messages.tag_edit),
                action: function (e) {
                    e.stopPropagation();
                    editCalendar(id);
                    return true;
                }
            });
        }
        if (APP.loggedIn && (data.teams.indexOf(1) === -1 || teamId === 0)) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-clone',
                },
                content: h('span', Messages.calendar_import),
                action: function (e) {
                    e.stopPropagation();
                    importCalendar({
                        id: id,
                        teamId: teamId
                    }, function (err) {
                        if (err) {
                            console.error(err);
                            return void UI.warn(Messages.error);
                        }
                    });
                    return true;
                }
            });
        }
        if (!data.restricted) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-shhare-alt',
                },
                content: h('span', Messages.shareButton),
                action: function (e) {
                    e.stopPropagation();
                    var friends = common.getFriends();
                    var cal = APP.calendars[id];
                    var title = Util.find(cal, ['content', 'metadata', 'title']);
                    var color = Util.find(cal, ['content', 'metadata', 'color']);
                    Share.getShareModal(common, {
                        teamId: teamId === 1 ? undefined : teamId,
                        origin: APP.origin,
                        pathname: "/calendar/",
                        friends: friends,
                        title: title,
                        password: cal.password,
                        calendar: {
                            title: title,
                            color: color,
                            channel: id,
                        },
                        common: common,
                        hashes: cal.hashes
                    });
                    return true;
                }
            });
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-lock',
                },
                content: h('span', Messages.accessButton),
                action: function (e) {
                    e.stopPropagation();
                    var cal = APP.calendars[id];
                    var title = Util.find(cal, ['content', 'metadata', 'title']);
                    var color = Util.find(cal, ['content', 'metadata', 'color']);
                    var h = cal.hashes || {};
                    var href = Hash.hashToHref(h.editHash || h.viewHash, 'calendar');
                    Access.getAccessModal(common, {
                        title: title,
                        password: cal.password,
                        calendar: {
                            title: title,
                            color: color,
                            channel: id,
                        },
                        common: common,
                        noExpiration: true,
                        noEditPassword: true,
                        channel: id,
                        href: href
                    });
                    return true;
                }
            });

            if (!data.readOnly) {
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'fa fa-upload',
                    },
                    content: h('span', Messages.importButton),
                    action: function () {
                        UIElements.importContent('text/calendar', function (res) {
                            Export.import(res, id, function (err, json) {
                                if (err) { return void UI.warn(Messages.importError); }
                                importICSCalendar({
                                    id: id,
                                    json: json
                                }, function (err) {
                                    if (err) { return void UI.warn(Messages.error); }
                                    UI.log(Messages.saved);
                                });

                            });
                        }, {
                            accept: ['.ics']
                        })();
                        return true;
                    }
                });
            }
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-download',
                },
                content: h('span', Messages.exportButton),
                action: function (e) {
                    e.stopPropagation();
                    var cal = APP.calendars[id];
                    var suggestion = Util.find(cal, ['content', 'metadata', 'title']);
                    var types = [];
                    types.push({
                        tag: 'a',
                        attributes: {
                            'data-value': '.ics',
                            'href': '#'
                        },
                        content: '.ics'
                    });
                    var dropdownConfig = {
                        text: '.ics', // Button initial text
                        caretDown: true,
                        options: types, // Entries displayed in the menu
                        isSelect: true,
                        initialValue: '.ics',
                        common: common,
                        buttonCls: 'btn',
                    };
                    var $select = UIElements.createDropdown(dropdownConfig);
                    UI.prompt(Messages.exportPrompt,
                        Util.fixFileName(suggestion), function (filename)
                    {
                        if (!(typeof(filename) === 'string' && filename)) { return; }
                        var ext = $select.getValue();
                        filename = filename + ext;
                        var blob = Export.main(cal.content);
                        SaveAs(blob, filename);
                    }, {
                        typeInput: $select[0]
                    });
                    return true;
                }
            });



            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-info-circle',
                },
                content: h('span', Messages.propertiesButton),
                action: function (e) {
                    e.stopPropagation();
                    var cal = APP.calendars[id];
                    var title = Util.find(cal, ['content', 'metadata', 'title']);
                    var color = Util.find(cal, ['content', 'metadata', 'color']);
                    var h = cal.hashes || {};
                    var href = Hash.hashToHref(h.editHash || h.viewHash, 'calendar');
                    Properties.getPropertiesModal(common, {
                        calendar: {
                            title: title,
                            color: color,
                            channel: id,
                        },
                        common: common,
                        channel: id,
                        href: href
                    });
                    return true;
                }
            });
        }
        if (!cantRemove) {
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'fa fa-trash-o',
                },
                content: h('span', Messages.poll_remove),
                action: function (e) {
                    e.stopPropagation();
                    var cal = APP.calendars[id];
                    var teams = (cal && cal.teams) || [];
                    var text = [ Messages.calendar_deleteConfirm ];
                    if (teams.length === 1 && teams[0] !== 1) {
                        text[0] = Messages.calendar_deleteTeamConfirm;
                    }
                    if (cal.owned) {
                        text = text.concat([' ', Messages.calendar_deleteOwned]);
                    }
                    UI.confirm(h('span', text), function (yes) {
                        if (!yes) { return; }
                        deleteCalendar({
                            id: id,
                            teamId: teamId,
                        }, function (err) {
                            if (err) {
                                console.error(err);
                                return void UI.warn(Messages.error);
                            }
                            renderCalendar();
                        });
                    });
                }
            });
        }
        var dropdownConfig = {
            text: '',
            options: options, // Entries displayed in the menu
            common: common,
            buttonCls: 'btn btn-default fa fa-gear small cp-calendar-actions',
            buttonTitle: Messages.calendar_settings,
        };
        return UIElements.createDropdown(dropdownConfig)[0];
    };
    var makeCalendarEntry = function (id, teamId) {
        var data = APP.calendars[id];
        var edit;
        if (data.loading) {
            edit = h('i.fa.fa-spinner.fa-spin');
        } else {
            edit = makeEditDropdown(id, teamId);
        }
        var md = Util.find(data, ['content', 'metadata']);
        if (!md) { return; }
        var active = data.hidden ? '' : '.cp-active';
        var restricted = data.restricted ? '.cp-restricted' : '';
        var temp = teamId === 0 ? '.cp-unclickable' : '';
        var calendar = h('div.cp-calendar-entry'+active+restricted+temp, {
            'data-uid': id
        }, [
            h('span.cp-calendar-icon', {
                style: 'background-color: '+md.color+';'
            }, [
                h('i.cp-calendar-active.fa.fa-calendar', {
                    style: 'color: '+getContrast(md.color)+';'
                }),
                h('i.cp-calendar-inactive.fa.fa-calendar-o')
            ]),
            h('span.cp-calendar-title', md.title),
            data.restricted ? h('i.fa.fa-ban', {title: Messages.fm_restricted}) :
                (isReadOnly(id, teamId) ? h('i.fa.fa-eye', {title: Messages.readonly}) : undefined),
            edit
        ]);
        var $calendar = $(calendar).click(function () {
            if (teamId === 0) { return; }
            data.hidden = !data.hidden;
            if (APP.$calendars) {
                APP.$calendars.find('[data-uid="'+id+'"]').toggleClass('cp-active', !data.hidden);
            } else {
                $(calendar).toggleClass('cp-active', !data.hidden);
            }

            renderCalendar();
        });
        if (!data.loading) {
            $calendar.contextmenu(function (ev) {
                ev.preventDefault();
                $(edit).click();
            });
        }
        if (APP.$calendars) { APP.$calendars.append(calendar); }
        return calendar;
    };
    var makeLeftside = function (calendar, $container) {
        // Show calendars
        var calendars = h('div.cp-calendar-list');
        var $calendars = APP.$calendars = $(calendars).appendTo($container);
        onCalendarsUpdate.reg(function () {
            $calendars.empty();
            var privateData = metadataMgr.getPrivateData();
            var filter = function (teamId) {
                var LOOKUP = {};
                return Object.keys(APP.calendars || {}).filter(function (id) {
                    var cal = APP.calendars[id] || {};
                    var teams = (cal.teams || []).map(function (tId) { return Number(tId); });
                    return teams.indexOf(typeof(teamId) !== "undefined" ? Number(teamId) : 1) !== -1;
                }).map(function (k) {
                    // nearly constant-time pre-sort
                    var cal = APP.calendars[k] || {};
                    var title = Util.find(cal, ['content', 'metadata', 'title']) || '';
                    LOOKUP[k] = title;
                    return k;
                }).sort(function (a, b) {
                    var t1 = LOOKUP[a];
                    var t2 = LOOKUP[b];
                    return t1 > t2 ? 1 : (t1 === t2 ? 0 : -1);
                });
            };
            var tempCalendars = filter(0);
            if (tempCalendars.length && tempCalendars[0] === APP.currentCalendar) {
                APP.$calendars.append(h('div.cp-calendar-team', [
                    h('span', Messages.calendar_tempCalendar)
                ]));
                makeCalendarEntry(tempCalendars[0], 0);
                var importTemp = h('button', [
                    h('i.fa.fa-calendar-plus-o'),
                    h('span', Messages.calendar_import_temp),
                    h('span')
                ]);
                $(importTemp).click(function () {
                    importCalendar({
                        id: tempCalendars[0],
                        teamId: 0
                    }, function (err) {
                        if (err) {
                            console.error(err);
                            return void UI.warn(Messages.error);
                        }
                    });
                });
                if (APP.loggedIn) {
                    APP.$calendars.append(h('div.cp-calendar-entry.cp-ghost', importTemp));
                }
                return;
            }
            var myCalendars = filter(1);
            if (myCalendars.length) {
                var user = metadataMgr.getUserData();
                var avatar = h('span.cp-avatar');
                var uid = user.uid;
                var name = user.name || Messages.anonymous;
                common.displayAvatar($(avatar), user.avatar, name, function(){}, uid);
                APP.$calendars.append(h('div.cp-calendar-team', [
                    avatar,
                    h('span.cp-name', {title: name}, name)
                ]));
            }
            myCalendars.forEach(function (id) {
                makeCalendarEntry(id, 1);
            });

            // Add new button
            var $newContainer = $(h('div.cp-calendar-entry.cp-ghost')).appendTo($calendars);
            var newButton = h('button', [
                h('i.fa.fa-calendar-plus-o'),
                h('span', Messages.calendar_new),
                h('span')
            ]);
            $(newButton).click(function () {
                editCalendar();
            }).appendTo($newContainer);

            Object.keys(privateData.teams).sort().forEach(function (teamId) {
                var calendars = filter(teamId);
                if (!calendars.length) { return; }
                var team = privateData.teams[teamId];
                var avatar = h('span.cp-avatar');
                common.displayAvatar($(avatar), team.avatar, team.displayName || team.name);
                APP.$calendars.append(h('div.cp-calendar-team', [
                    avatar,
                    h('span.cp-name', {title: team.name}, team.name)
                ]));
                calendars.forEach(function (id) {
                    makeCalendarEntry(id, teamId);
                });
            });
        });
        onCalendarsUpdate.fire();

    };

    var _updateRecurring = function () {
        var cal = APP.calendar;
        if (!cal) { return; }

        var range = APP.calendar._renderRange;
        var startView = range.start._date;
        var endView = range.end._date;
        endView.setDate(endView.getDate() + 1);

        var midView = new Date(((+startView) + (+endView)) / 2);

        // We want to generate recurring events month per month.
        // In "month" view, we may see up to 3 different months
        // at the same time.
        var startId = Rec.getMonthId(startView);
        var midId = Rec.getMonthId(midView);
        var endId = Rec.getMonthId(endView);
        var todo = Util.deduplicateString([startId, midId, endId]);
        todo = todo.filter(function (monthId) {
            return !APP.recurringDone.includes(monthId);
        });

        var toAdd = Rec.getRecurring(todo, APP.recurringEvents);

        // Mark selected months as done
        todo.forEach(function (monthId) { APP.recurringDone.push(monthId); });

        cal.createSchedules(applyUpdates(toAdd));
    };
    updateRecurring = function () {
        try {
            _updateRecurring();
        } catch (e) {
            console.error(e);
        }
    };

/*
UPDATE A RECCURENT EVENT:
ICS ==> create a new event with the same UID and a RECURRENCE-ID field (with a value equals to the DTSTART of this recurring event)
*/


    var diffDate = Rec.diffDate;

    var makeCalendar = function (view) {
        var store = window.cryptpadStore;

        var $container = $('#cp-sidebarlayout-container');
        var leftside;
        $container.append([
            leftside = h('div#cp-sidebarlayout-leftside'),
            h('div#cp-sidebarlayout-rightside')
        ]);

        var large = $(window).width() >= 800;
        var cal = APP.calendar = new Calendar('#cp-sidebarlayout-rightside', {
            defaultView: view || 'week', // weekly view option
            taskView: false,
            useCreationPopup: true,
            useDetailPopup: true,
            usageStatistics: false,
            calendars: getCalendars(),
            template: templates,
            month: {
                daynames: getWeekDays(large),
                startDayOfWeek: 1,
            },
            week: {
                daynames: getWeekDays(large),
                startDayOfWeek: 1,
            }
        });

        $(window).on('resize', function () {
            var _large = $(window).width() >= 800;
            if (large !== _large) {
                large = _large;
                cal.setOptions({
                    month: {
                        daynames: getWeekDays(_large),
                        startDayOfWeek: 1,
                    },
                    week: {
                        daynames: getWeekDays(_large),
                        startDayOfWeek: 1,
                    }
                });
            }
        });

        makeLeftside(cal, $(leftside));

        cal.on('beforeCreateSchedule', function(event) {
            event.recurrenceRule = APP.recurrenceRule;
            newEvent(event, function (err) {
                if (err) {
                    console.error(err);
                    return void UI.warn(err);
                }
            });
        });
        cal.on('beforeUpdateSchedule', function(event) {
            var changes = event.changes || {};
            delete changes.state;

            if (changes.end) { changes.end = +new Date(changes.end._date); }
            if (changes.start) { changes.start = +new Date(changes.start._date); }
            var old = event.schedule;
            var id = old.id.split('|')[0];

            var originalEvent = Util.find(APP.calendars, [old.calendarId, 'content', 'content', id]);

            var ev = APP.calendar.getSchedule(old.id, old.calendarId);
            var evOrig = APP.calendar.getSchedule(id, old.calendarId);

            var isOrigin = id === old.id;
            var wasRecurrent = Boolean(originalEvent.recurrenceRule);
            var moveCalendar = Boolean(changes.calendarId);

            if (event.calendar) { // Don't update reminders and recurrence with drag&drop event
                var oldReminders = ev.raw.reminders || originalEvent.reminders;
                var reminders = APP.notificationsEntries;
                if (JSONSortify(oldReminders || []) !== JSONSortify(reminders)) {
                    changes.reminders = reminders;
                }

                var oldRec = ev.recurrenceRule;
                var rec = APP.recurrenceRule;
                if (JSONSortify(oldRec || '') !== JSONSortify(rec)) {
                    changes.recurrenceRule = rec;
                }

                var eventBody = APP.eventBody || "";
                if (eventBody !== old.body) {
                    changes.body = eventBody;
                }
            }


            if (!event.triggerEventName || event.triggerEventName !== "click") {
                APP.recurrenceRule = ev.recurrenceRule;
            }

            APP.editType = undefined;
            var afterConfirm = function () {
                var raw = (ev && ev.raw) || {};
                var rawData = { // Exact start and end of the selected event
                    start: raw.start || ev.start,
                    end: raw.end || ev.end,
                    isOrigin: isOrigin
                };
                var isOneTime = APP.editType === 'one';
                if (['one', 'from'].includes(APP.editType)) {
                    if (changes.start) {
                        changes.start = diffDate(raw.start || ev.start, changes.start);
                    }
                    if (changes.end) {
                        changes.end = diffDate(raw.end || ev.end, changes.end);
                    }
                }


                if (isOneTime && wasRecurrent && moveCalendar) {
                    // Copy the event with applied changes
                    var copyEvent = ev;
                    for (let key in changes) {
                        copyEvent[key] = changes[key];
                    }
                    copyEvent.recurrenceRule = "";

                    newEvent(copyEvent, function(err) {
                        if (err) {
                            console.error(err);
                            return void UI.warn(err);
                        }
                    });

                    if (!isOrigin) {
                        // If it's not the first event, then simply remove the
                        // original occurrence
                        deleteEvent(old, function(err) {
                            if (err) {
                                console.error(err);
                                return void UI.warn(err);
                            }
                        });
                    } else {
                        // You can only edit all events in the origin case
                        console.error(Messages.error);
                        return void UI.warn(Messages.error);
                    }
                } else {
                    old.id = id;

                    updateEvent({
                        ev: old,
                        changes: changes,
                        rawData: rawData,
                        type: {
                            which: APP.editType,
                            when: raw.start || ev.start
                        }
                    }, function (err) {
                        if (err) {
                            console.error(err);
                            return void UI.warn(err);
                        }
                    });
                }
            };


            // Confirm modal: select which recurring events to update
            if (!Object.keys(changes).length) { return void afterConfirm(); }
            if (!wasRecurrent) { return void afterConfirm(); }

            var list = ['one','from','all'];
            if (isOrigin) { list = ['one', 'all']; }
            if (moveCalendar) {
                if (isOrigin) {
                    // Changing calendar on Origin can only be done for all
                    list = ['all'];
                } else {
                    // Otherwise cannot apply it to the future event
                    list = ['one', 'all'];
                }
            }
            if ((changes.start || changes.end) && !isOrigin) {
                list = list.filter(function (item) {
                    return item !== "all";
                });
            }

            // Messages.calendar_rec_edit_all, .calendar_rec_edit_from, .calendar_rec_edit_one
            var radioEls = list.map(function (k, i) {
                return UI.createRadio('cp-calendar-rec-edit', 'cp-calendar-rec-edit-'+k,
                           Messages['calendar_rec_edit_'+k], !i, {input:{ 'data-value':k }});
            });
            var p = h('p', Messages.calendar_rec_edit);
            var warn = h('div.alert.alert-warning');
            var content = h('div', [
                warn,
                p,
                radioEls
            ]);
            UI.confirm(content, function (yes) {
                if (!yes) { return; }
                var r = $(content).find('input[name="cp-calendar-rec-edit"]:checked')
                                .data('value');
                APP.editType = r;
                afterConfirm();
            });
            $(content).closest('.alertify').on('mousedown', function (e) {
                e.stopPropagation();
            });

            var $p = $(p);
            var $warn = $(warn);
            var $radio = $(radioEls);
            var recurrenceWarn = function () {
                if (typeof(changes.recurrenceRule) === "undefined") {
                    $p.show();
                    return $warn.hide();
                }
                $warn.show();
                $p.hide();
                var val = $radio.find('input[name="cp-calendar-rec-edit"]:checked')
                                        .data('value');


                if (!changes.recurrenceRule) { // Rule was deleted
                    if (!val || val === "all") {
                        return $warn.text(Messages._getKey('calendar_rec_warn_delall', [
                            new Date(evOrig.start).toLocaleDateString()
                        ]));
                    }
                    return $warn.text(Messages.calendar_rec_warn_del);
                }
                if (!val || val === "all") {
                    return $warn.text(Messages._getKey('calendar_rec_warn_updateall', [
                        new Date(evOrig.start).toLocaleDateString()
                    ]));
                }
                return $warn.text(Messages.calendar_rec_warn_update);
            };
            recurrenceWarn();
            var changeCalendarWarn = function() {
                if (moveCalendar && wasRecurrent) {
                    // Don't change only the first event of a recurring event
                    $warn.show();
                    $p.hide();
                    if (isOrigin) {
                        return $warn.text(Messages.calendar_rec_change_first);
                    } else {
                        return $warn.text(Messages.calendar_rec_change);
                    }
                } else {
                    return null;
                }
            };
            changeCalendarWarn();
            $radio.find('input[type="radio"]').on('change', recurrenceWarn);
            $radio.find('input[type="radio"]').on('change', changeCalendarWarn);
        });
        cal.on('beforeDeleteSchedule', function(event) {
            deleteEvent(event.schedule, function (err) {
                if (err) {
                    console.error(err);
                    return void UI.warn(err);
                }
            });
        });

        $('body').on('keydown', function (e) {
            if (e.which === 27) {
                $('.tui-full-calendar-floating-layer').hide();
            }
        });

        updateDateRange();
        renderCalendar();

        // Toolbar

        // Change view mode
        var options = ['day', 'week', 'month'].map(function (k) {
            return {
                tag: 'a',
                attributes: {
                    'class': 'cp-calendar-view',
                    'data-value': k,
                    'href': '#',
                },
                content: Messages['calendar_'+k]
                // Messages.calendar_day
                // Messages.calendar_week
                // Messages.calendar_month
            };
        });
        var dropdownConfig = {
            text: Messages.calendar_week,
            options: options, // Entries displayed in the menu
            isSelect: true,
            common: common,
            caretDown: true,
            left: true,
        };
        var $block = UIElements.createDropdown(dropdownConfig);
        $block.setValue(view || 'week');
        $block.onChange.reg((name, mode) => {
            cal.changeView(mode);
            updateDateRange();
            updateRecurring();
            store.put('calendarView', mode, function () {});
        });
        APP.toolbar.$bottomR.append($block);

        // New event button
        var newEventBtn = h('button.cp-calendar-newevent', [
            h('i.fa.fa-plus'),
            h('span', Messages.calendar_newEvent)
        ]);
        $(newEventBtn).click(function (e) {
            e.preventDefault();
            cal.openCreationPopup({isAllDay:false});
        }).appendTo(APP.toolbar.$bottomL);

        // Change page
        var goLeft = h('button.fa.fa-chevron-left',{'aria-label': Messages.goLeft});
        var goRight = h('button.fa.fa-chevron-right', {'aria-label': Messages.goRight});
        var goToday = h('button', Messages.calendar_today);
        var goDate = h('button.fa.fa-calendar',{'aria-label': Messages.date});
        $(goLeft).click(function () {
            cal.prev();
            updateDateRange();
            updateRecurring();
        });
        $(goRight).click(function () {
            cal.next();
            updateDateRange();
            updateRecurring();
        });
        $(goToday).click(function () {
            APP.moveToDate(+new Date());
            //cal.today();
            updateDateRange();
            updateRecurring();
        });
        var f = Flatpickr(goDate, {
            enableTime: false,
            defaultDate: APP.calendar.getDate()._date,
            clickOpens: false,
            //dateFormat: dateFormat,
            onChange: function (date) {
                date[0].setHours(12);
                APP.moveToDate(+date[0]);
                updateDateRange();
                updateRecurring();
            },
        });
        $(goDate).click(function () {
            return f.isOpen ? f.close() : f.open();
        });
        APP.toolbar.$bottomL.append(h('div.cp-calendar-browse', [
            goLeft, goToday, goRight, goDate
        ]));

    };


    var WEEKDAYS = getWeekDays(true);
    var listItems = function (_arr) {
        var arr = _arr.slice();
        if (arr.length === 1) {
            return arr[0];
        }
        var shift = function () {
            var i = arr.shift();
            if (i === -1) { return Messages.calendar_month_last; }
            return i;
        };
        var str = shift();
        var i = 0;
        while (arr.length > 1 && i < 367) {
            str = Messages._getKey('calendar_list', [str, shift()]);
            i++;
        }
        str = Messages._getKey('calendar_list_end', [str, shift()]);
        return str;
    };
    var translate = function (rule) {
        var str = "";
        if (!rule || !rule.freq) { return; }
        var tmp = new Date();

        // Freq, interval
        // Messages.calendar_str_daily, .calendar_str_weekly, .calendar_str_monthly, .calendar_str_yearly
        str = Messages._getKey('calendar_str_'+rule.freq, [rule.interval || 1]);

        var m = rule.by && rule.by.month;
        var d = rule.by && rule.by.day;
        var md = rule.by && rule.by.monthday;

        var ord = false;
        if (d) {
            d = d.map(function (str) {
                var nth = str.slice(0, -2);
                nth = (nth === '-1') ? 'last' : nth;
                ord = Boolean(nth);
                var day = str.slice(-2);
                var n = Rec.DAYORDER.indexOf(day);
                var dayStr = WEEKDAYS[n];
                if (nth) { return Messages['calendar_nth_'+nth] + " " + dayStr; }
                return dayStr;
            });
        }
        if (m) {
            m = m.map(function (n) {
                tmp.setDate(15);
                tmp.setHours(12);
                tmp.setMonth(n-1);
                return tmp.toLocaleDateString(getDateLanguage(), { month: 'long' });
            });
        }

        // Until / count
        var end = "";
        if (rule.count) {
            end += " " + Messages._getKey('calendar_str_for', [rule.count]);
        }
        if (rule.until) {
            end += " " + Messages._getKey('calendar_str_until', [
                new Date(rule.until).toLocaleDateString(getDateLanguage(), {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                })
            ]);
        }

        var filters = [];
        // Messages.calendar_str_filter_day, .calendar_str_filter_month
        // Messages.calendar_str_filter_monthday, .calendar_str_filter_weekno, .calendar_str_filter_yearday
        // nth day (of month)
        if (rule.freq === "yearly" && m && m.length === 1 && d && d.length === 1
            && Object.keys(rule.by).length === 2) {
            str += " " + Messages._getKey('calendar_str_nthdayofmonth', [
                d[0],
                m[0]
            ]);
        } else if (rule.freq === "monthly" && d && d.length === 1 && ord
            && Object.keys(rule.by).length === 1) {
            str += " " + Messages._getKey('calendar_str_monthday', [
                d[0]
            ]);
        } else if (rule.freq === "monthly" && md && Object.keys(rule.by).length === 1) {
            str += " " + Messages._getKey('calendar_str_monthday', [listItems(md)]);
        } else if (rule.freq === "weekly" && d && Object.keys(rule.by).length === 1) {
            str += " " + Messages._getKey('calendar_str_day', [listItems(d)]);
        } else if (rule.by) {
            filters = Object.keys(rule.by).map(function (k) {
                var val = rule.by[k];
                if (k === "month") { val = m; }
                if (k === "day") { val = d; }
                return Messages._getKey('calendar_str_filter_'+k, [listItems(val)]);
            });
        }

        str += end;

        return {
            str: Messages._getKey('calendar_rec_every_date', [str]),
            filters: filters
        };
    };

    var getMonthlyPattern = function (date, yearly) {
        var d = new Date(+date);
        var day = d.getDay();
        var monthday = d.getDate();

        // Check nth day
        var s = new Date(+d);
        s.setDate(1);
        while (s.getDay() !== day) { s.setDate(s.getDate() + 1); }
        var nth = ((monthday - s.getDate()) / 7) + 1;

        // Check last day
        var m = d.getMonth();
        d.setDate(d.getDate() + 7);
        var last = d.getMonth() !== m;

        var dayCode = Rec.DAYORDER[day];
        var dayStr = WEEKDAYS[day];
        var monthStr = date.toLocaleDateString(getDateLanguage(), { month: 'long' });

        var key = yearly ? "yearly" : "monthly";
        // Messages.calendar_nth_1, .calendar_nth_2, .calendar_nth_3
        // Messages.calendar_nth_4, .calendar_nth_5, .calendar_nth_last
        return {
            nth: nth + dayCode,
            str: Messages._getKey('calendar_rec_'+key+'_nth', [
                Messages['calendar_nth_'+nth],
                dayStr,
                monthStr
            ]),
            last: last ? '-1' + dayCode : undefined,
            lastStr: Messages._getKey('calendar_rec_'+key+'_nth', [
                Messages['calendar_nth_last'],
                dayStr,
                monthStr
            ]),
            // Messages.calendar_rec_yearly_nth, .calendar_rec_monthly_nth
        };
    };

    var getRecurrenceInput = function (date) {
        APP.recurrenceRule = '';

        var obj = APP.editModalData;
        if (obj.id) { // Edit mode, recover recurrence data
            var cal = obj.selectedCal.id;
            var calData = APP.calendars[cal];
            if (calData) {
                var ev = APP.calendar.getSchedule(obj.id, cal);
                APP.recurrenceRule = ev.recurrenceRule || '';
            }
        }
        var updatedOn = APP.recurrenceRule && APP.recurrenceRule._next;
        if (updatedOn) { delete APP.recurrenceRule._next; }
        APP.wasRecurrent = Boolean(APP.recurrenceRule);

/*
// Test data:
APP.recurrenceRule = {
    freq: 'yearly',
    interval: 2,
    count: 30,
    until: 1924902000000,
    by: {
        month: [1, 3, 5, 7, 9, 11],
        weekno: [1, 11, 21, 31, 41, 51],
        day: ["MO","TU","WE","TH","FR"]
    }
};
*/

        var basicStr = {};

        var options = [{
            tag: 'a',
            attributes: {
                'class': 'cp-calendar-recurrence',
                'data-value': '',
                'href': '#',
            },
            content: Messages.calendar_rec_no
        }];
        // Basic recurrence
        // Messages.calendar_rec_daily, .calendar_rec_weekly, .calendar_rec_monthly, .calendar_rec_yearly, .calendar_rec_weekdays, .calendar_rec_weekend
        ['daily', 'weekly', 'monthly', 'yearly'].forEach(function (rec) {
            basicStr[rec] = JSONSortify({freq: rec});
            options.push({
                tag: 'a',
                attributes: {
                    'class': 'cp-calendar-recurrence',
                    'data-value': basicStr[rec],
                    'href': '#',
                },
                content: Messages._getKey('calendar_rec_' + rec, [
                    getWeekDays(true)[date.getDay()],
                    date.getDate(),
                    date.toLocaleDateString(getDateLanguage(), {month:"long", day:"2-digit"})
                ])
            });
        });
        // Weekdays / Weekend
        var isWeekend = [0,6].includes(date.getDay());
        var weekValue = isWeekend ? ['SA', 'SU'] : ['MO', 'TU', 'WE', 'TH', 'FR'];
        basicStr.days = JSONSortify({
            freq: 'daily',
            by: { day: weekValue }
        });
        options.splice(2, 0, {
            tag: 'a',
            attributes: {
                'class': 'cp-calendar-recurrence',
                'data-value': basicStr.days,
                'href': '#',
            },
            content: Messages['calendar_rec_' + (isWeekend ? 'weekend' : 'weekdays')]
        });
        // Custom
        options.push({
            tag: 'a',
            attributes: {
                'class': 'cp-calendar-recurrence',
                'data-value': 'custom',
                'href': '#',
            },
            content: Messages.calendar_rec_custom
        });

        var dropdownConfig = {
            text: Messages.calendar_rec_no,
            options: options, // Entries displayed in the menu
            isSelect: true,
            common: common,
            buttonCls: 'btn btn-secondary',
            caretDown: true,
        };
        var $block = UIElements.createDropdown(dropdownConfig);

        var translated = h('div.cp-calendar-rec-translated');
        var $translated = $(translated);
        var _addTranslation = function () {
            $translated.empty();

            // Dropdown value
            var recStr = JSONSortify(APP.recurrenceRule);
            var set = Object.keys(basicStr).some(function (k) {
                if (recStr === basicStr[k]) {
                    $block.setValue(basicStr[k]);
                    $translated.empty();
                    return true;
                }
            });
            if (set) { return; }
            $block.setValue(APP.recurrenceRule ? 'custom' : '');

            // Text value

            var ruleObj = translate(APP.recurrenceRule);
            if (!ruleObj || !ruleObj.str) { return; }
            $translated.append(h('div.cp-calendar-rec-translated-str', ruleObj.str));

            if (!ruleObj.filters || !Array.isArray(ruleObj.filters)
                    || !ruleObj.filters.length) { return; }
            var toAdd = [];
            toAdd = ruleObj.filters.map(function (str) {
                return h('li', str);
            });
            $translated.append([
                h('div', Messages.calendar_str_filter),
                h('ul', toAdd)
            ]);
        };
        var addUpdate = function () {
            if (!updatedOn) { return; }
            var d = new Date(updatedOn).toLocaleDateString();
            $translated.append(h('div', Messages._getKey('calendar_rec_updated', [d])));
        };
        var addTranslation = function () {
            _addTranslation();
            addUpdate();
        };

        addTranslation();



        var showCustom = function () {
            var rec = APP.recurrenceRule || {};

            var interval = h('input', {
                type: "number",
                min: 1,
                max: 1000,
                value: rec.interval || 1
            });

            // Messages.calendar_rec_freq_daily, .calendar_rec_freq_weekly
            // Messages.calendar_rec_freq_monthly, .calendar_rec_freq_yearly
            var options = [];
            ['daily', 'weekly', 'monthly', 'yearly'].forEach(function (rec) {
                options.push({
                    tag: 'a',
                    attributes: {
                        'class': 'cp-calendar-recurrence-freq',
                        'data-value': rec,
                        'href': '#',
                    },
                    content: Messages['calendar_rec_freq_' + rec]
                });
            });
            var dropdownConfig = {
                text: Messages.calendar_rec_freq_daily,
                options: options, // Entries displayed in the menu
                isSelect: true,
                common: common,
                buttonCls: 'btn btn-secondary',
                caretDown: true,
            };
            var $freq = UIElements.createDropdown(dropdownConfig);
            $freq.setValue(rec.freq || 'daily');

            var radioNo = UI.createRadio('cp-calendar-rec-until', 'cp-calendar-rec-until-no',
                       Messages.calendar_rec_until_no, !rec.until && !rec.count, {});
            var pickr;
            var untilDate = [
                h('span', Messages.calendar_rec_until_date),
                pickr = h('input', {readonly:"readonly"})
            ];
            var startPickr = Flatpickr(pickr, {
                enableTime: false,
                minDate: date,
                //dateFormat: dateFormat,
                onChange: function () {
                    //endPickr.set('minDate', DatePicker.parseDate(s.value));
                }
            });
            var endDate = new Date(+date);
            endDate.setMonth(endDate.getMonth() + 1);
            startPickr.setDate(rec.until ? new Date(rec.until) : endDate);
            var radioDate = UI.createRadio('cp-calendar-rec-until', 'cp-calendar-rec-until-date',
                       untilDate, Boolean(rec.until), {input:{'data-value':'date'}});
            var untilCount = [
                h('span', Messages.calendar_rec_until_count),
                h('input', {type: "number", value: (rec.count || 5), min: 2}),
                h('span', Messages.calendar_rec_until_count2),
            ];
            var radioCount = UI.createRadio('cp-calendar-rec-until', 'cp-calendar-rec-until-count',
                       untilCount, Boolean(rec.count), {input:{'data-value':'count'}});
            var untilEls = [radioNo, radioDate, radioCount];
            $(untilEls).find('.cp-checkmark-label input').click(function () {
                $(this).closest('.cp-radio').find('input[type="radio"]').prop('checked', true);
            });

            var repeat = h('div.cp-calendar-rec-inline', [
                h('span', Messages.calendar_rec_txt),
                interval,
                $freq[0]
            ]);
            var until = h('div.cp-calendar-rec-block.radio-group', [
                h('div.cp-calendar-rec-block-title', Messages.calendar_rec_until),
                untilEls
            ]);

            var expand = h('div');
            var $expand = $(expand);
            var EXPAND = {};
            EXPAND.daily = function () {};
            EXPAND.weekly = function () {
                $expand.attr('class', 'cp-calendar-rec-inline cp-calendar-weekly-pick');
                var days = getWeekDays();
                var active = (rec.by && rec.by.day) || [Rec.DAYORDER[date.getDay()]];
                var line = [], dayCode;
                for (var i = 1; i < 8; i++) {
                    dayCode = Rec.DAYORDER[i%7];
                    line.push(h('button.btn.no-margin.cp-calendar-pick-el' +
                                (active.includes(dayCode) ? '.btn-primary' : '.btn-default'), {
                            'data-value': dayCode
                         }, days[i%7]));
                }
                $expand.append(line);
                $expand.find('button').click(function () {
                    var $b = $(this);
                    if ($b.is('.btn-primary')) {
                        return $b.removeClass('btn-primary').addClass('btn-default');
                    }
                    $b.removeClass('btn-default').addClass('btn-primary');
                });
            };
            EXPAND.monthly = function () {
                $expand.attr('class', 'cp-calendar-rec-block radio-group');
                // Display one or two radio options accordingly
                var checked = (rec.by && rec.by.day) || [];
                var pattern = getMonthlyPattern(date);
                var radioNth = UI.createRadio('cp-calendar-rec-monthly', 'cp-calendar-rec-monthly-nth',
                    pattern.str, checked.includes(pattern.nth),
                    {input:{'data-value':pattern.nth }});
                $expand.append(radioNth);

                if (pattern.last) {
                    var radioLast = UI.createRadio('cp-calendar-rec-monthly', 'cp-calendar-rec-monthly-last',
                        pattern.lastStr, checked.includes(pattern.last),
                        {input:{ 'data-value': pattern.last }});
                    $expand.append(radioLast);
                }

                var active = (rec.by && rec.by.monthday) || [date.getDate()];
                var lines = [], l, n;
                for (var i = 0; i < 5; i++) {
                    l = [];
                    for (var j = 1; j < 8; j++) {
                        n = i * 7 + j;
                        if (n > 31) {
                            l.push(h('button.btn.no-margin.cp-calendar-pick-el.lastday' +
                                        (active.includes(-1) ? '.btn-primary' : '.btn-default'), {
                                    'data-value': -1
                                 }, Messages.calendar_month_last));
                            break;
                        }
                        l.push(h('button.btn.no-margin.cp-calendar-pick-el' +
                                    (active.includes(n) ? '.btn-primary' : '.btn-default'), {
                                'data-value': n
                             }, n));
                    }
                    lines[i] = h('div', l);
                }

                var pickr = h('div.cp-calendar-monthly-pick', lines);
                $(pickr).find('button').click(function () {
                    var $b = $(this);
                    if ($b.is('.btn-primary')) {
                        return $b.removeClass('btn-primary').addClass('btn-default');
                    }
                    $b.removeClass('btn-default').addClass('btn-primary');
                });
                var radioPickContent = [
                    h('span', Messages.calendar_rec_monthly_pick),
                    pickr
                ];
                var radioPick = UI.createRadio('cp-calendar-rec-monthly', 'cp-calendar-rec-monthly-pick',
                       radioPickContent, !checked.length, {input:{'data-value':'pick'}});
                $expand.append(radioPick);

                $expand.find('.cp-checkmark-label button').click(function () {
                    $(this).closest('.cp-radio').find('input[type="radio"]').prop('checked', true);
                });
            };
            EXPAND.yearly = function () {
                $expand.attr('class', 'cp-calendar-rec-block radio-group');

                var checked = (rec.by && rec.by.day) || [];

                var radioDate = UI.createRadio('cp-calendar-rec-yearly',
                    'cp-calendar-rec-yearly-date',
                    Messages._getKey('calendar_rec_every_date', [
                        date.toLocaleDateString(getDateLanguage(), { month: 'long', day: 'numeric'})
                    ]), !checked.length, { 'data-value': '' });
                $expand.append(radioDate);

                var pattern = getMonthlyPattern(date, true);
                var radioNth = UI.createRadio('cp-calendar-rec-yearly', 'cp-calendar-rec-yearly-nth',
                    pattern.str, checked.includes(pattern.nth),
                    {input:{ 'data-value': pattern.nth }});
                $expand.append(radioNth);

                if (pattern.last) {
                    var radioLast = UI.createRadio('cp-calendar-rec-yearly', 'cp-calendar-rec-yearly-last',
                        pattern.lastStr, checked.includes(pattern.last),
                        {input:{ 'data-value': pattern.last }});
                    $expand.append(radioLast);
                }
            };
            EXPAND[rec.freq || "daily"]();

            var currentFreq = rec.freq || 'daily';
            $freq.onChange.reg(function (prettyVal, val) {
                if (val === currentFreq || !val) { return; }
                currentFreq = val;
                rec = {};
                $expand.empty();
                EXPAND[val]();
            });


            var content = [repeat, expand, until];

            var $modal;
            var modal = UI.dialog.customModal(content, {
                buttons: [{
                    className: 'cancel',
                    name: Messages.cancel,
                    onClick: function () {
                        if (!APP.recurrenceRule) { $block.setValue(''); }
                    },
                    keys: [27]
                }, {
                    className: 'primary',
                    name: Messages.settings_save,
                    onClick: function () {
                        var freq = $freq.getValue();

                        var rec = APP.recurrenceRule = {
                            freq: freq,
                            interval: Number($(interval).val()) || 1,
                            by: {}
                        };
                        if (rec.interval === 1) { delete rec.interval; }

                        var until = $modal.find('input[name="cp-calendar-rec-until"]:checked').data('value');
                        if (until === "count") {
                            rec.count = $(radioCount).find('input[type="number"]').val();
                        } else if (until === "date") {
                            var _date = DatePicker.parseDate(pickr.value);
                            _date.setDate(_date.getDate()+1);
                            rec.until = +_date - 1;
                        }

                        if (freq === "weekly") {
                            rec.by.day = [];
                            $expand.find('button.cp-calendar-pick-el.btn-primary')
                                    .each(function (i, el) {
                                rec.by.day.push($(el).data('value'));
                            });
                            if (!rec.by.day.length) { delete rec.by.day; }
                        }

                        if (freq === "monthly") {
                            var _m = $expand.find('input[name="cp-calendar-rec-monthly"]:checked').data('value');
                            if (_m === "pick") {
                                rec.by.monthday = [];
                                $expand.find('div.cp-calendar-monthly-pick button.btn-primary')
                                        .each(function (i, el) {
                                    rec.by.monthday.push($(el).data('value'));
                                });
                                if (!rec.by.monthday.length) { delete rec.by.monthday; }
                            } else {
                                rec.by.day = [_m];
                            }
                        }

                        if (freq === "yearly") {
                            var _y = $expand.find('input[name="cp-calendar-rec-yearly"]:checked').data('value');
                            if (_y) {
                                rec.by.month = [date.getMonth()+1];
                                rec.by.day = [_y];
                            }
                        }

                        if (!Object.keys(rec.by).length) { delete rec.by; }

                        addTranslation();
                    },
                    keys: [13]
                }]
            });
            $modal = $(modal);
            UI.openCustomModal(modal);
            $modal.closest('.alertify').on('mousedown', function (e) {
                e.stopPropagation();
            });
        };

        $block.onChange.reg(function(name, val) {
            if (val === "custom") { return void showCustom(); }
            APP.recurrenceRule = val;
            addTranslation();
        });

        return h('div.cp-calendar-recurrence-container', [
            h('span.cp-recurrence-label', [
                h('i.fa.fa-repeat', {'aria-hidden':'true'}),
                Messages.calendar_rec]),
            $block[0],
            translated
        ]);
    };

    var parseNotif = function (minutes) {
        var res = {
            unit: 'minutes',
            value: minutes
        };
        var hours = minutes / 60;
        if (!Number.isInteger(hours)) { return res; }
        res.unit = 'hours';
        res.value = hours;
        var days = hours / 24;
        if (!Number.isInteger(days)) { return res; }
        res.unit = 'days';
        res.value = days;
        return res;
    };
    var getNotificationDropdown = function () {
        var ev = APP.editModalData;
        var calId = ev.selectedCal.id;
        var id = (ev.id && ev.id.split('|')[0]) || undefined;
        var _ev = APP.calendar.getSchedule(ev.id, calId);
        var oldReminders = _ev && _ev.raw && _ev.raw.reminders;
        if (!oldReminders) {
            oldReminders = Util.find(APP.calendars, [calId, 'content', 'content', id, 'reminders']) || [60];
        }

        APP.notificationsEntries = [];
        var number = h('input.tui-full-calendar-content', {
            type: "number",
            value: 10,
            min: 1,
            max: 60
        });
        var $number = $(number);
        var options = ['minutes', 'hours', 'days'].map(function (k) {
            return {
                tag: 'a',
                attributes: {
                    'class': 'cp-calendar-reminder',
                    'data-value': k,
                    'href': '#',
                },
                content: Messages['calendar_'+k]
                // Messages.calendar_minutes
                // Messages.calendar_hours
                // Messages.calendar_days
            };
        });
        var dropdownConfig = {
            text: Messages.calendar_minutes,
            options: options, // Entries displayed in the menu
            isSelect: true,
            common: common,
            buttonCls: 'btn btn-secondary',
            caretDown: true,
        };

        var $block = UIElements.createDropdown(dropdownConfig);
        $block.setValue('minutes');
        $block.onChange.reg((name, mode) => {
            var max = mode === "minutes" ? 60 : 24;
            $number.attr('max', max);
            if ($number.val() > max) { $number.val(max); }
        });
        var addNotif = h('button.btn.btn-primary-outline.fa.fa-plus');
        var $list = $(h('div.cp-calendar-notif-list'));
        var listContainer = h('div.cp-calendar-notif-list-container', [
            h('span.cp-notif-label', [
                h('i.fa.fa-bell', {'aria-hidden':'true'}),
                Messages.calendar_notifications
            ]),
            $list[0],
            h('span.cp-notif-empty', Messages.calendar_noNotification)
        ]);

        var addNotification = function (unit, value) {
            var unitValue = (unit === "minutes") ? 1 : (unit === "hours" ? 60 : (60*24));
            var del = h('button.btn.btn-danger-outline.small.fa.fa-times',
                {'title': Messages.calendar_removeNotification}
            );
            var minutes = value * unitValue;
            if ($list.find('[data-minutes="'+minutes+'"]').length) { return; }
            var span = h('span.cp-notif-entry', {
                'data-minutes': minutes
            }, [
                h('span.cp-notif-value', [
                    h('span', value),
                    h('span', Messages['calendar_'+unit]),
                    h('span.cp-before', Messages.calendar_before)
                ]),
                del
            ]);
            $(del).click(function () {
                $(span).remove();
                var idx = APP.notificationsEntries.indexOf(minutes);
                APP.notificationsEntries.splice(idx, 1);
            });
            $list.append(span);
            APP.notificationsEntries.push(minutes);
        };
        $(addNotif).click(function () {
            var unit = $block.getValue();
            var val = $number.val();
            if (val === "") { return void UI.warn(Messages.error); }
            var value = Number(val);
            addNotification(unit, value);
        });
        oldReminders.forEach(function (minutes) {
            var p = parseNotif(minutes);
            addNotification(p.unit, p.value);
        });
        return h('div.tui-full-calendar-popup-section.cp-calendar-add-notif', [
            listContainer,
            h('div.cp-calendar-notif-form', [
                h('span.cp-notif-label', Messages.calendar_addNotification),
                h('span.cp-calendar-notif-form-buttons', [
                    number,
                    $block[0],
                    addNotif
                ])
            ])
        ]);
    };

    var getBodyInput = function() {
        var ev = APP.editModalData;
        var calId = ev.selectedCal.id;
        var id = (ev.id && ev.id.split('|')[0]) || undefined;
        var _ev = APP.calendar.getSchedule(ev.id, calId);
        var oldEventBody = _ev && _ev.body;
        if (!oldEventBody) {
            oldEventBody = Util.find(APP.calendars, [calId, 'content', 'content', id, 'body']) || "";
        }

        APP.eventBody = oldEventBody;
        var description = h('textarea.tui-full-calendar-content', {
            placeholder: Messages.calendar_desc,
            id: 'tui-full-calendar-body',
        });

        description.value = oldEventBody;

        var block = h('div.tui-full-calendar-popup-section', [
            description,
        ]);

        var cm = SFCodeMirror.create("gfm", CodeMirror, description);
        var editor = APP.editor = cm.editor;
        editor.setOption('lineNumbers', false);
        editor.setOption('lineWrapping', true);
        editor.setOption('styleActiveLine', false);
        editor.setOption('readOnly', false);
        editor.setOption('autoRefresh', true);
        editor.setOption('gutters', []);
        editor.on('keydown', function (editor, e) {
            if (e.which === 27) {
                let $next = $(e.target).closest('.tui-full-calendar-popup-section').next();
                if ($next.length) {
                    $next.find('#tui-full-calendar-schedule-start-date').focus();
                }
                e.stopPropagation();
            }
        });
        cm.configureTheme(common, function () {});
        editor.setValue(oldEventBody);

        var updateBody = function(value) {
            APP.eventBody = value;
        };

        editor.on('changes', function() {
            updateBody(editor.getValue());
        });

        return block;
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle', 'notifications'];
        var configTb = {
            displayed: displayed,
            sfCommon: common,
            $container: APP.$toolbar,
            pageTitle: Messages.calendar,
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();
    };

    var onEvent = function (obj) {
        var ev = obj.ev;
        var data = obj.data;
        if (ev === 'UPDATE') {
            onCalendarUpdate(data);
            return;
        }
    };

    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        APP.$toolbar = $('#cp-toolbar');
        sframeChan = common.getSframeChannel();
        sframeChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        createToolbar();
        metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var user = metadataMgr.getUserData();

        APP.loggedIn = common.isLoggedIn();

        common.setTabTitle(Messages.calendar);

        // Fix flatpickr selection
        var MutationObserver = window.MutationObserver;
        var onFlatPickr = function (el) {
            // Don't close event creation popup when clicking on flatpickr
            $(el).mousedown(function (e) {
                e.stopPropagation();
            });
        };
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node;
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('flatpickr-calendar')) {
                        onFlatPickr(node);
                    }
                }
            });
        });
        observer.observe($('body')[0], {
            childList: true,
            subtree: false
        });

        // Customize creation/update popup
        var onCalendarPopup = function (el) {
            var $el = $(el);
            $el.find('.tui-full-calendar-confirm').addClass('btn btn-primary').prepend(h('i.fa.fa-floppy-o'));
            $el.find('input').attr('autocomplete', 'off');
            $el.find('.tui-full-calendar-dropdown-button').addClass('btn btn-secondary');
            $el.find('.tui-full-calendar-popup-close').addClass('btn btn-cancel fa fa-times cp-calendar-close').empty();
            $el.find('.tui-full-calendar-section-allday').attr('tabindex', 0);
            $el.find('.cp-calendar-close').attr('tabindex',-1);
            $el.find('.tui-full-calendar-section-allday').keydown(function (e) {
                if (e.which === 13) {
                    $(this).click();
                }
            });

            var $container = $el.closest('.tui-full-calendar-floating-layer');
            $container.addClass('cp-calendar-popup-flex');
            $container.css('display', 'flex').mousedown(function (e) {
                if ($(e.target).is('.cp-calendar-popup-flex')) {
                    $el.find('.tui-full-calendar-popup-close').click();
                }
            });

            var calendars = APP.calendars || {};
            var show = false;
            $el.find('.tui-full-calendar-dropdown-menu li').each(function (i, li) {
                var $li = $(li);
                var id = $li.attr('data-calendar-id');
                var c = calendars[id];
                if (!c || c.readOnly) {
                    return void $li.remove();
                }
                // If at least one calendar is editable, show the popup
                show = true;
            });
            if ($el.find('.tui-full-calendar-hide.tui-full-calendar-dropdown').length || !show) {
                $el.hide();
                UI.warn(Messages.calendar_errorNoCalendar);
                return;
            }
            var isUpdate = Boolean($el.find('#tui-full-calendar-schedule-title').val());
            if (!isUpdate) { $el.find('.tui-full-calendar-dropdown-menu li').first().click(); }

            var $button = $el.find('.tui-full-calendar-section-button-save');

            var $startDate = $el.find('#tui-full-calendar-schedule-start-date');
            var startDate = DatePicker.parseDate($startDate.val());

            var divRec = getRecurrenceInput(startDate);
            $button.before(divRec);

            var div = getNotificationDropdown();
            $button.before(div);

            var bodyInput = getBodyInput();
            $startDate.parent().parent().before(bodyInput);

            // Use Flatpickr with or without time depending on allday checkbox
            var $cbox = $el.find('#tui-full-calendar-schedule-allday');
            var allDay = $cbox.is(':checked');
            var allDayFormat = 'Y-m-d';
            var timeFormat = '';
            var setFormat = function (allDay) {
                var s = window.CP_startPickr;
                var e = window.CP_endPickr;
                if (!timeFormat) { timeFormat = s.config.dateFormat; }
                s.set('dateFormat', allDay ? allDayFormat : timeFormat);
                e.set('dateFormat', allDay ? allDayFormat : timeFormat);
            };
            setFormat(allDay);
            $el.find('.tui-full-calendar-section-allday').click(function () {
                setTimeout(function () {
                    var allDay = $cbox.is(':checked');
                    setFormat(allDay);
                });
            });
            UI.addTabListener(el);
        };
        var onCalendarEditPopup = function (el) {
            var $el = $(el);
            $el.find('.tui-full-calendar-popup-edit').addClass('btn btn-primary');
            $el.find('.tui-full-calendar-popup-edit .tui-full-calendar-icon').addClass('fa fa-pencil').removeClass('tui-full-calendar-icon');
            $el.find('.tui-full-calendar-content').removeClass('tui-full-calendar-content');

            var delButton = h('button.btn.btn-danger', [
                h('i.fa.fa-trash'),
                h('span', Messages.kanban_delete)
            ]);
            var $del = $el.find('.tui-full-calendar-popup-delete').hide();
            $del.after(delButton);
            UI.confirmButton(delButton, {
                classes: 'danger'
            }, function () {
                $del.click();
            });

            if (APP.nextLocationUid) {
                var uid = APP.nextLocationUid;
                delete APP.nextLocationUid;
                var $a = $el.find('#'+uid);
                $a.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    common.openUnsafeURL($a.attr('href'));
                });
            }

            var $section = $el.find('.tui-full-calendar-section-button');
            var ev = APP.editModalData;
            var data = ev.schedule || {};
            var id = data.id;

            UI.addTabListener(el);
            if (!id) { return; }
            if (id.indexOf('|') === -1) { return; } // Original event ID doesn't contain |

            // This is a recurring event, add button to stop recurrence now
            var $b = $(h('button.btn.btn-default', [
                h('i.fa.fa-times'),
                h('span', Messages.calendar_rec_stop)
            ])).insertBefore($section);
            UI.confirmButton($b[0], { classes: 'btn-default' }, function () {
                var originalId = id.split('|')[0];
                var originalEvent = Util.find(APP.calendars,
                        [ev.schedule.calendarId, 'content', 'content', originalId]);
                var rec = originalEvent.recurrenceRule;
                if (!rec) { return; }
                rec.until = (ev.schedule.raw && ev.schedule.raw.start) - 1;
                data.id = originalId;
                updateEvent({
                    ev: data,
                    changes: {
                        recurrenceRule: rec
                    },
                    type: {
                        which: 'all'
                    }
                }, function (err) {
                    if (err) {
                        console.error(err);
                        return void UI.warn(err);
                    }
                    $b.closest('.tui-full-calendar-floating-layer').hide();
                });
            });
        };
        var onPopupRemoved = function () {
            var start, end;
            if (window.CP_startPickr) { start = window.CP_startPickr.calendarContainer; }
            if (window.CP_endPickr) { end = window.CP_endPickr.calendarContainer; }
            $('.flatpickr-calendar').each(function (i, el) {
                if (el === start || el === end) { return; }
                $(el).remove();
            });
        };
        var observer2 = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node, _node;
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    node = mutation.addedNodes[i];
                    try {
                        if (node.classList && node.classList.contains('tui-full-calendar-popup')
                                && !node.classList.contains('tui-full-calendar-popup-detail')) {
                            onCalendarPopup(node);
                        }
                        if (node.classList && node.classList.contains('tui-full-calendar-popup')
                                && node.classList.contains('tui-full-calendar-popup-detail')) {
                            onCalendarEditPopup(node);
                        }
                    } catch (e) {}
                }
                for (var j = 0; j < mutation.removedNodes.length; j++) {
                    _node = mutation.addedNodes[j];
                    try {
                        if (_node.classList && _node.classList.contains('tui-full-calendar-popup')) {
                            onPopupRemoved();
                        }
                    } catch (e) {}
                }
            });
        });
        observer2.observe($('body')[0], {
            childList: true,
            subtree: true
        });

        APP.module = common.makeUniversal('calendar', {
            onEvent: onEvent
        });
        var store = window.cryptpadStore;
        APP.module.execCommand('SUBSCRIBE', null, function (obj) {
            if (obj.empty && !privateData.calendarHash) {
                if (!privateData.loggedIn) {
                    return void UI.errorLoadingScreen(Messages.mustLogin, false, function () {
                        common.setLoginRedirect('login');
                    });
                }
                // No calendar yet, create one
                newCalendar({
                    teamId: 1,
                    initialCalendar: true,
                    color: user.color,
                    title: Messages.calendar_default
                }, function (err) {
                    if (err) { return void UI.errorLoadingScreen(Messages.error); }
                    store.get('calendarView', makeCalendar);
                    UI.removeLoadingScreen();
                });
                return;
            }
            if (privateData.calendarHash) {
                var hash = privateData.hashes.editHash || privateData.hashes.viewHash;
                var secret = Hash.getSecrets('calendar', hash, privateData.password);
                APP.currentCalendar = secret.channel;
                APP.module.execCommand('OPEN', {
                    hash: hash,
                    password: privateData.password
                }, function (obj) {
                    if (obj && obj.error) { console.error(obj.error); }
                });
            } else if (privateData.calendarOpts) {
                APP.initTime = privateData.calendarOpts.time;
            }
            store.get('calendarView', makeCalendar);
            UI.removeLoadingScreen();
        });

        APP.origin = privateData.origin;


    });
});
