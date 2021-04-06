define([
    'jquery',
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

    '/common/jscolor.js',
    'css!/lib/calendar/tui-calendar.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/calendar/app-calendar.less',
], function (
    $,
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
    Calendar
    )
{
    var APP = window.APP = {
        calendars: {}
    };

    var common;
    var sframeChan;

Messages.calendar = "Calendar"; // XXX
Messages.calendar_default = "My calendar"; // XXX
Messages.calendar_new = "New calendar"; // XXX
Messages.calendar_day = "Day";
Messages.calendar_week = "Week";
Messages.calendar_month = "Month";
Messages.calendar_today = "Today";
Messages.calendar_deleteConfirm = "Are you sure you want to delete this calendar from your account?";
Messages.calendar_deleteTeamConfirm = "Are you sure you want to delete this calendar from this team?";
Messages.calendar_deleteOwned = " It will still be visible for the users it has been shared with.";

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
    var newEvent = function (data, cb) {
        var start = data.start;
        var end = data.end;
        data.start = +new Date(start._date);
        data.end = +new Date(end._date);
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
        return (brightness > 125) ? 'black' : 'white';
    };

    var getWeekDays = function (locale) {
        var baseDate = new Date(Date.UTC(2017, 0, 1)); // just a Sunday
        var weekDays = [];
        for(i = 0; i < 7; i++) {
            weekDays.push(baseDate.toLocaleDateString(undefined, { weekday: 'long' }));
            baseDate.setDate(baseDate.getDate() + 1);
        }
        return weekDays.map(function (day) { return day.replace(/^./, function (str) { return str.toUpperCase(); }) });
    };



    var getCalendars = function () {
        return Object.keys(APP.calendars).map(function (id) {
            var c = APP.calendars[id];
            if (c.hidden) { return; }
            var md = Util.find(c, ['content', 'metadata']);
            if (!md) { return void console.error('Ignore calendar without metadata'); }
            return {
                id: id,
                name: Util.fixHTML(md.title),
                color: getContrast(md.color),
                bgColor: md.color,
                dragBgColor: md.color,
                borderColor: md.color,
            };
        }).filter(Boolean);
    };
    var getSchedules = function () {
        var s = [];
        Object.keys(APP.calendars).forEach(function (id) {
            var c = APP.calendars[id];
            if (c.hidden) { return; }
            var data = c.content || {};
            Object.keys(data.content || {}).forEach(function (uid) {
                var obj = data.content[uid];
                obj.title = Util.fixHTML(obj.title || "");
                obj.location = Util.fixHTML(obj.location || "");
                s.push(data.content[uid]);
            });
        });
        return s;
    };
    var renderCalendar = function () {
        var cal = APP.calendar;
        if (!cal) { return; }

        cal.clear();
        cal.createSchedules(getSchedules(), true);
        cal.render();
    };
    var onCalendarUpdate = function (data) {
        var cal = APP.calendar;

        // Is it a new calendar?
        var isNew = !APP.calendars[data.id];

        console.error(data, data.content.metadata.color);
        if (data.deleted) {
            // Remove this calendar
            delete APP.calendars[data.id];
        } else {
            // Update local data
            APP.calendars[data.id] = data;
        }

        // If calendar if initialized, update it
        if (!cal) { return; }
        console.error('OK');
        cal.setCalendars(getCalendars());
        onCalendarsUpdate.fire();
        renderCalendar();
    };

    var getPadStart = function (value) {
        value = value.toString();
        return padStart.call(value, 2, '0');
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
        popupSave: function () {
            return Messages.settings_save;
        },
        timegridDisplayTime: getTime,
        timegridDisplayPrimaryTime: getTime,
    };

    var makeTeamSelector = function () {
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var keys = Object.keys(privateData.teams);
        if (!keys.length) { return; }
        var options = [];
        keys.forEach(function (id) {
            var t = privateData.teams[id];
            if (t.viewer) { return; }
        });
    };

    // XXX Note: always create calendars in your own proxy. If you want a team calendar, you can share it with the team later.
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
        var to;
        $colorPicker.click(function() {
            jscolorL.show();
        });
        if (md.color) { jscolorL.fromString(md.color); }

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
                })
            };
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
                    }
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

    var makeEditDropdown = function (id, teamId) {
        var options = [{
            tag: 'a',
            attributes: {
                'class': 'fa fa-pencil',
            },
            content: h('span', Messages.tag_edit),
            action: function (e) {
                e.stopPropagation();
                editCalendar(id);
            }
        }, {
            tag: 'a',
            attributes: {
                'class': 'fa fa-trash-o',
            },
            content: h('span', Messages.kanban_delete),
            action: function (e) {
                e.stopPropagation();
                var cal = APP.calendars[id];
                var key = Messages.calendar_deleteConfirm;
                var teams = (cal && cal.teams) || [];
                if (teams.length === 1 && teams[0] !== 1) {
                    key = Messages.calendar_deleteTeamConfirm;
                }
                if (cal.owned) {
                    key += Messages.calendar_deleteOwned;
                }
                UI.confirm(Messages.calendar_deleteConfirm, function (yes) {
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
        }];
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
        if (!data.readOnly) {
            edit = makeEditDropdown(id, teamId);
        }
        var md = Util.find(data, ['content', 'metadata']);
        if (!md) { return; }
        var active = data.hidden ? '' : '.cp-active';
        var calendar = h('div.cp-calendar-entry'+active, [
            h('span.cp-calendar-color', {
                style: 'background-color: '+md.color+';'
            }),
            h('span.cp-calendar-title', md.title),
            edit
        ]);
        $(calendar).click(function () {
            data.hidden = !data.hidden;
            $(calendar).toggleClass('cp-active', !data.hidden);
            renderCalendar();
        });
        if (APP.$calendars) { APP.$calendars.append(calendar); }
        return calendar;
    };
    var makeLeftside = function (calendar, $container) {
        var $topContainer = $(h('div.cp-calendar-new')).appendTo($container);
        // Add new button
        var newButton = h('button.btn.btn-primary', [
            h('i.fa.fa-plus'),
            h('span', Messages.newButton)
        ]);
        $(newButton).click(function () {
            editCalendar();
        });
        $topContainer.append(newButton);

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
            buttonCls: 'btn btn-secondary'
        };
        var $block = UIElements.createDropdown(dropdownConfig);
        $block.setValue('week');
        var $views = $block.find('a');
        $views.click(function () {
            var mode = $(this).attr('data-value');
            calendar.changeView(mode);
        });
        $topContainer.append($block);

        // Change page
        var goLeft = h('button.btn.btn-secondary.fa.fa-chevron-left');
        var goRight = h('button.btn.btn-secondary.fa.fa-chevron-right');
        var goToday = h('button.btn.btn-secondary', Messages.calendar_today);
        $(goLeft).click(function () { calendar.prev(); });
        $(goRight).click(function () { calendar.next(); });
        $(goToday).click(function () { calendar.today(); });
        $container.append(h('div.cp-calendar-browse', [
            goLeft, goToday, goRight
        ]));

        // Show calendars
        var calendars = h('div.cp-calendar-list');
        var $calendars = APP.$calendars = $(calendars).appendTo($container);
        onCalendarsUpdate.reg(function () {
            $calendars.empty();
            Object.keys(APP.calendars || {}).forEach(function (id) {
                var cal = APP.calendars[id];
                if (!cal) { return; }
                (cal.teams || []).forEach(function (teamId) {
                    makeCalendarEntry(id, teamId);
                });
            });
        });
        onCalendarsUpdate.fire();
    };
    var makeCalendar = function () {
        var $container = $('#cp-sidebarlayout-container');
        var leftside;
        $container.append([
            leftside = h('div#cp-sidebarlayout-leftside'),
            h('div#cp-sidebarlayout-rightside')
        ]);

        var cal = APP.calendar = new Calendar('#cp-sidebarlayout-rightside', {
            defaultView: 'week', // weekly view option
            useCreationPopup: true,
            useDetailPopup: true,
            usageStatistics: false,
            calendars: getCalendars(),
            template: templates,
            month: {
                daynames: getWeekDays(),
                startDayOfWeek: 0,
            },
            week: {
                daynames: getWeekDays(),
                startDayOfWeek: 1,
            }
        });

        makeLeftside(cal, $(leftside));

        cal.on('beforeCreateSchedule', function(event) {
            // XXX Recurrence (later)
            // On creation, select a recurrence rule (daily / weekly / monthly / more weird rules)
            // then mark it under recurrence rule with a uid (the same for all the recurring events)
            // ie: recurrenceRule: DAILY|{uid}
            // Use template to hide "recurrenceRule" from the detailPopup or at least to use
            // a non technical value

            var schedule = {
                id: Util.uid(),
                calendarId: event.calendarId,
                title: Util.fixHTML(event.title),
                category: "time",
                location: Util.fixHTML(event.location),
                start: event.start,
                isAllDay: event.isAllDay,
                end: event.end,
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

        renderCalendar();
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
        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();
        var user = metadataMgr.getUserData();


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
                    var node = mutation.addedNodes[i];
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
            $el.find('.tui-full-calendar-confirm').addClass('btn btn-primary');
            $el.find('input').attr('autocomplete', 'off');
            $el.find('.tui-full-calendar-dropdown-button').addClass('btn btn-secondary');
            $el.find('.tui-full-calendar-popup-close').addClass('btn btn-cancel fa fa-times cp-calendar-close').empty();
            var isUpdate = Boolean($el.find('#tui-full-calendar-schedule-title').val());
            if (isUpdate) {
                $el.find('.tui-full-calendar-dropdown-button').attr('disabled', 'disabled').off('click');
            $el.find('.tui-full-calendar-dropdown-menu').addClass('cp-forcehide');
            }
        };
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                var node;
                for (var i = 0; i < mutation.addedNodes.length; i++) {
                    var node = mutation.addedNodes[i];
                    if (node.classList && node.classList.contains('tui-full-calendar-popup')) {
                        onCalendarPopup(node);
                    }
                }
            });
        });
        observer.observe($('body')[0], {
            childList: true,
            subtree: true
        });

        APP.module = common.makeUniversal('calendar', {
            onEvent: onEvent
        });
        APP.module.execCommand('SUBSCRIBE', null, function (obj) {
            if (obj.empty) {
                // No calendar yet, create one
                newCalendar({
                    teamId: 1,
                    color: user.color,
                    title: Messages.calendar_default
                }, function (err, obj) {
                    if (err) { return void UI.errorLoadingScreen(Messages.error); } // XXX
                    makeCalendar();
                    UI.removeLoadingScreen();
                });
                return;
            }
            console.error('subscribed');
            // XXX build UI
            makeCalendar();
            UI.removeLoadingScreen();
        });

        APP.origin = privateData.origin;


    });
});
