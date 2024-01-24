// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/lib/datepicker/flatpickr.js',
    '/lib/calendar/moment.min.js',

    'css!/lib/datepicker/flatpickr.min.css',
], function ($, Flatpickr, Moment) {

    var parseDate = (value) => {
        return Moment(value, 'YYYY-MM-DD HH:mm a').toDate();
    };

    var createRangePicker = function (cfg) {
        var start = cfg.startpicker;
        var end = cfg.endpicker;

        var is24h = false
        var dateFormat = "Y-m-d H:i";
        try {
            is24h = !new Intl.DateTimeFormat(navigator.language, { hour: 'numeric' }).format(0).match(/AM/);
        } catch (e) {}
        if (!is24h) { dateFormat = "Y-m-d h:i K"; }

        var e = $(end.input)[0];
        var endPickr = Flatpickr(e, {
            enableTime: true,
            time_24hr: is24h,
            dateFormat: dateFormat,
            minDate: start.date,
            onChange: function () {
                    duration = parseDate(e.value) - parseDate(s.value);
            }
        });
        endPickr.setDate(end.date);

        var s = $(start.input)[0];
        var duration = end.date - start.date;
        var startPickr = Flatpickr(s, {
            enableTime: true,
            time_24hr: is24h,
            dateFormat: dateFormat,
            onChange: function () {
                endPickr.set('minDate', parseDate(s.value));
                endPickr.setDate(parseDate(s.value).getTime() + duration);
            }
        });
        startPickr.setDate(start.date);
        window.CP_startPickr = startPickr;
        window.CP_endPickr = endPickr;

        var getStartDate = function () {
            setTimeout(function () { $(startPickr.calendarContainer).remove(); });
            return parseDate(s.value);
        };
        var getEndDate = function () {
            setTimeout(function () { $(endPickr.calendarContainer).remove(); });
            var d = parseDate(e.value);

            if (endPickr.config.dateFormat === "Y-m-d") { // All day event
                // Tui-calendar will remove 1s (1000ms) to the date for an unknown reason...
                d.setMilliseconds(1000);
            }

            return d;
        };

        return {
            getStartDate: getStartDate,
            getEndDate: getEndDate,
        };
    };
    return {
        parseDate: parseDate,
        createRangePicker: createRangePicker
    };
});
