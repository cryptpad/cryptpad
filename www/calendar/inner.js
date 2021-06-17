define([
    'jquery',
    'json.sortify',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar.js',
    '/bower_components/nthen/index.js',
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
    '/lib/datepicker/flatpickr.js',

    '/common/inner/share.js',
    '/common/inner/access.js',
    '/common/inner/properties.js',

    '/common/jscolor.js',
    '/bower_components/file-saver/FileSaver.min.js',
    'css!/lib/calendar/tui-calendar.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
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
    Flatpickr,
    Share, Access, Properties
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
    var newEvent = function (data, cb) {
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

    var getWeekDays = function (large) {
        var baseDate = new Date(2017, 0, 1); // just a Sunday
        var weekDays = [];
        for(var i = 0; i < 7; i++) {
            weekDays.push(baseDate.toLocaleDateString(undefined, { weekday: 'long' }));
            baseDate.setDate(baseDate.getDate() + 1);
        }
        if (!large) {
            weekDays = weekDays.map(function (day) { return day.slice(0,3); });
        }
        return weekDays.map(function (day) { return day.replace(/^./, function (str) { return str.toUpperCase(); }); });
    };



    var getCalendars = function () {
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
        }).filter(Boolean);
    };
    var getSchedules = function () {
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
                if (obj.isAllDay && obj.startDay) { obj.start = +Flatpickr.parseDate((obj.startDay)); }
                if (obj.isAllDay && obj.endDay) {
                    var endDate = Flatpickr.parseDate(obj.endDay);
                    endDate.setHours(23);
                    endDate.setMinutes(59);
                    endDate.setSeconds(59);
                    obj.end = +endDate;
                }
                if (c.readOnly) {
                    obj.isReadOnly = true;
                }
                s.push(data.content[uid]);
            });
        });
        return s;
    };
    var renderCalendar = function () {
        var cal = APP.calendar;
        if (!cal) { return; }

        cal.clear();
        cal.setCalendars(getCalendars());
        cal.createSchedules(getSchedules(), true);
        cal.render();
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
        popupEdit: function() { return Messages.poll_edit; },
        popupDelete: function() { return Messages.kanban_delete; },
        popupDetailLocation: function(schedule) {
            // TODO detect url and create 'a' tag
            return Messages._getKey('calendar_location', [Util.fixHTML(schedule.location)]);
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
                        common: common
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
                content: h('span', Messages.kanban_delete),
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
                                UI.warn(Messages.error);
                            }
                        });
                    });
                }
            });
        }
        var dropdownConfig = {
            text: '',
            options: options, // Entries displayed in the menu
            common: common,
            buttonCls: 'btn btn-cancel fa fa-ellipsis-h small'
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
                return Object.keys(APP.calendars || {}).filter(function (id) {
                    var cal = APP.calendars[id] || {};
                    var teams = (cal.teams || []).map(function (tId) { return Number(tId); });
                    return teams.indexOf(typeof(teamId) !== "undefined" ? Number(teamId) : 1) !== -1;
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
                var name = user.name || Messages.anonymous;
                common.displayAvatar($(avatar), user.avatar, name);
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

            Object.keys(privateData.teams).forEach(function (teamId) {
                var calendars = filter(teamId);
                if (!calendars.length) { return; }
                var team = privateData.teams[teamId];
                var avatar = h('span.cp-avatar');
                common.displayAvatar($(avatar), team.avatar, team.displayName);
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
            // TODO Recurrence (later)
            // On creation, select a recurrence rule (daily / weekly / monthly / more weird rules)
            // then mark it under recurrence rule with a uid (the same for all the recurring events)
            // ie: recurrenceRule: DAILY|{uid}
            // Use template to hide "recurrenceRule" from the detailPopup or at least to use
            // a non technical value
            var reminders = APP.notificationsEntries;

            var startDate = event.start._date;
            var endDate = event.end._date;

            var schedule = {
                id: Util.uid(),
                calendarId: event.calendarId,
                title: Util.fixHTML(event.title),
                category: "time",
                location: Util.fixHTML(event.location),
                start: +startDate,
                isAllDay: event.isAllDay,
                end: +endDate,
                reminders: reminders,
            };

            newEvent(schedule, function (err) {
                if (err) {
                    console.error(err);
                    return void UI.warn(err);
                }
                cal.createSchedules([schedule]);
            });
        });
        cal.on('beforeUpdateSchedule', function(event) {
            var changes = event.changes || {};
            delete changes.state;
            if (changes.end) { changes.end = +new Date(changes.end._date); }
            if (changes.start) { changes.start = +new Date(changes.start._date); }
            var old = event.schedule;

            var oldReminders = Util.find(APP.calendars, [old.calendarId, 'content', 'content', old.id, 'reminders']);
            var reminders = APP.notificationsEntries;
            if (JSONSortify(oldReminders || []) !== JSONSortify(reminders)) {
                changes.reminders = reminders;
            }

            updateEvent({
                ev: old,
                changes: changes
            }, function (err) {
                if (err) {
                    console.error(err);
                    return void UI.warn(err);
                }
                cal.updateSchedule(old.id, old.calendarId, changes);
            });
        });
        cal.on('beforeDeleteSchedule', function(event) {
            var data = event.schedule;
            deleteEvent(event.schedule, function (err) {
                if (err) {
                    console.error(err);
                    return void UI.warn(err);
                }
                cal.deleteSchedule(data.id, data.calendarId);
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
        var $views = $block.find('a');
        $views.click(function () {
            var mode = $(this).attr('data-value');
            cal.changeView(mode);
            updateDateRange();
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
        var goLeft = h('button.fa.fa-chevron-left');
        var goRight = h('button.fa.fa-chevron-right');
        var goToday = h('button', Messages.calendar_today);
        $(goLeft).click(function () {
            cal.prev();
            updateDateRange();
        });
        $(goRight).click(function () {
            cal.next();
            updateDateRange();
        });
        $(goToday).click(function () {
            cal.today();
            updateDateRange();
        });
        APP.toolbar.$bottomL.append(h('div.cp-calendar-browse', [
            goLeft, goToday, goRight
        ]));

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
        // DEFAULT HERE [10] ==> 10 minutes before the event
        var oldReminders = Util.find(APP.calendars, [calId, 'content', 'content', ev.id, 'reminders']) || [10];
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
        var $types = $block.find('a');
        $types.click(function () {
            var mode = $(this).attr('data-value');
            var max = mode === "minutes" ? 60 : 24;
            $number.attr('max', max);
            if ($number.val() > max) { $number.val(max); }
        });
        var addNotif = h('button.btn.btn-primary-outline.fa.fa-plus');
        var $list = $(h('div.cp-calendar-notif-list'));
        var listContainer = h('div.cp-calendar-notif-list-container', [
            h('span.cp-notif-label', Messages.calendar_notifications),
            $list[0],
            h('span.cp-notif-empty', Messages.calendar_noNotification)
        ]);
        var addNotification = function (unit, value) {
            var unitValue = (unit === "minutes") ? 1 : (unit === "hours" ? 60 : (60*24));
            var del = h('button.btn.btn-danger-outline.small.fa.fa-times');
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
            var value = $number.val();
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
                number,
                $block[0],
                addNotif
            ])
        ]);
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
            var div = getNotificationDropdown();
            $button.before(div);

            var $cbox = $el.find('#tui-full-calendar-schedule-allday');
            var $start = $el.find('.tui-full-calendar-section-start-date');
            var $dash = $el.find('.tui-full-calendar-section-date-dash');
            var $end = $el.find('.tui-full-calendar-section-end-date');
            var allDay = $cbox.is(':checked');
            if (allDay) {
                $start.hide();
                $dash.hide();
                $end.hide();
            }
            $el.find('.tui-full-calendar-section-allday').click(function () {
                setTimeout(function () {
                    var allDay = $cbox.is(':checked');
                    if (allDay) {
                        $start.hide();
                        $dash.hide();
                        $end.hide();
                        return;
                    }
                    $start.show();
                    $dash.show();
                    $end.show();
                });
            });
        };
        var onCalendarEditPopup = function (el) {
            var $el = $(el);
            $el.find('.tui-full-calendar-popup-edit').addClass('btn btn-primary');
            $el.find('.tui-full-calendar-popup-edit .tui-full-calendar-icon').addClass('fa fa-pencil').removeClass('tui-full-calendar-icon');
            $el.find('.tui-full-calendar-popup-delete').addClass('btn btn-danger');
            $el.find('.tui-full-calendar-popup-delete .tui-full-calendar-icon').addClass('fa fa-trash').removeClass('tui-full-calendar-icon');
            $el.find('.tui-full-calendar-content').removeClass('tui-full-calendar-content');
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
            }
            store.get('calendarView', makeCalendar);
            UI.removeLoadingScreen();
        });

        APP.origin = privateData.origin;


    });
});
