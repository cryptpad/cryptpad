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
    };
console.log(Calendar);


    var common;
    var sframeChan;

Messages.calendar = "Calendar"; // XXX

    var updateCalendar = function (data) {
        console.log(data);

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

        var cal = new Calendar('#cp-calendar', {
            defaultView: 'week', // weekly view option
            useCreationPopup: true,
            useDetailPopup: true,
            usageStatistics: false,
            calendars: [{
                id: '1',
                name: 'My Calendar',
                color: '#ffffff',
                bgColor: '#9e5fff',
                dragBgColor: '#9e5fff',
                borderColor: '#9e5fff'
            }, {
                id: '2',
                name: 'Company',
                color: '#00a9ff',
                bgColor: '#00a9ff',
                dragBgColor: '#00a9ff',
                borderColor: '#00a9ff'
            }]
        });
        cal.on('beforeCreateSchedule', function(event) {
            var startTime = event.start;
            var endTime = event.end;
            var isAllDay = event.isAllDay;
            var guide = event.guide;
            var triggerEventName = event.triggerEventName;

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
                end: event.end,
            };

            /*
            if (triggerEventName === 'click') {
                // open writing simple schedule popup
                schedule = {
                };
            } else if (triggerEventName === 'dblclick') {
                // open writing detail schedule popup
                schedule = {
                };
            }
            */

            cal.createSchedules([schedule]);
        });
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
            console.log(el);
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
        APP.module.execCommand('SUBSCRIBE', null, function () {
            console.error('subscribed');
            // XXX build UI
            makeCalendar();
            UI.removeLoadingScreen();
        });

        var metadataMgr = common.getMetadataMgr();
        var privateData = metadataMgr.getPrivateData();

        APP.origin = privateData.origin;


    });
});
