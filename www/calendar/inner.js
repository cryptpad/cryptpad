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

    var newCalendar = function (data, cb) {
        APP.module.execCommand('CREATE', data, function (obj) {
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
    var getCalendars = function () {
        return Object.keys(APP.calendars).map(function (id) {
            var c = APP.calendars[id];
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
        });
    };
    var getSchedules = function () {
        var s = [];
        Object.keys(APP.calendars).forEach(function (id) {
            var c = APP.calendars[id];
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
    var updateCalendar = function (data) {
        var cal = APP.calendar;

        // Is it a new calendar?
        var isNew = !APP.calendars[data.id];

        // Update local data
        APP.calendars[data.id] = data;

        // If this calendar is new, add it
        if (cal && isNew) { cal.setCalendars(getCalendars()); }

        // If calendar if initialized, update it
        if (!cal) { return; }
        cal.clear();
        cal.createSchedules(getSchedules(), true);
        cal.render();
    };

    var templates = {
        popupSave: function () {
            return Messages.settings_save;
        }
    };

    var makeCalendar = function (ctx) {
        var $container = $('#cp-container');
        $container.append([
            h('div#menu', [
                h('span#renderRange.render-range')
            ]),
            h('div#cp-calendar')
        ]);

        var cal = APP.calendar = new Calendar('#cp-calendar', {
            defaultView: 'week', // weekly view option
            useCreationPopup: true,
            useDetailPopup: true,
            usageStatistics: false,
            calendars: getCalendars(),
        });
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

        cal.createSchedules(getSchedules(), true);
        cal.render();
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
            console.log('Update');
            updateCalendar(data);
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
