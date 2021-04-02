define([
    'jquery',
    '/lib/datepicker/flatpickr.js',

    'css!/lib/datepicker/flatpickr.min.css',
], function ($, Flatpickr) {
    var createRangePicker = function (cfg) {
        var start = cfg.startpicker;
        var end = cfg.endpicker;

        var e = $(end.input)[0];
        var endPickr = Flatpickr(e, {
            enableTime: true,
            minDate: start.date
        });
        endPickr.setDate(end.date);

        var s = $(start.input)[0];
        var startPickr = Flatpickr(s, {
            enableTime: true,
            onChange: function () {
                endPickr.set('minDate', startPickr.parseDate(s.value));
            }
        });
        startPickr.setDate(start.date);

        var getStartDate = function () {
            setTimeout(function () { $(startPickr.calendarContainer).remove(); });
            return startPickr.parseDate(s.value);
        };
        var getEndDate = function () {
            setTimeout(function () { $(endPickr.calendarContainer).remove(); });
            return endPickr.parseDate(e.value);
        };

        return {
            getStartDate: getStartDate,
            getEndDate: getEndDate,
        };
    };
    return {
        createRangePicker: createRangePicker
    };
});
