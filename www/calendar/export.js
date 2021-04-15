// This file is used when a user tries to export the entire CryptDrive.
// Calendars will be exported using this format instead of plain text.
define([
    '/customize/pages.js',
], function (Pages) {
    var module = {};

    var getICSDate = function (str) {
        var date = new Date(str);

        var m = date.getUTCMonth() + 1;
        var d = date.getUTCDate();
        var h = date.getUTCHours();
        var min = date.getUTCMinutes();

        var year = date.getUTCFullYear().toString();
        var month = m < 10 ? "0" + m : m.toString();
        var day = d < 10 ? "0" + d : d.toString();
        var hours = h < 10 ? "0" + h : h.toString();
        var minutes = min < 10 ? "0" + min : min.toString();

        return year + month + day + "T" + hours + minutes + "00Z";
    }


    var getDate = function (str, end) {
        var date = new Date(str);
        if (end) {
            date.setDate(date.getDate() + 1);
        }
        var m = date.getUTCMonth() + 1;
        var d = date.getUTCDate();

        var year = date.getUTCFullYear().toString();
        var month = m < 10 ? "0" + m : m.toString();
        var day = d < 10 ? "0" + d : d.toString();

        return year+month+day;
    };

    var MINUTE = 60;
    var HOUR = MINUTE * 60;
    var DAY = HOUR * 24;


    module.main = function (userDoc) {
        var content = userDoc.content;
        var md = userDoc.metadata;

        var ICS = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//CryptPad//CryptPad Calendar '+Pages.versionString+'//EN',
            'METHOD:PUBLISH',
        ];

        Object.keys(content).forEach(function (uid) {
            var data = content[uid];
            // DTSTAMP: now...
            // UID: uid
            var start, end;
            if (data.isAllDay && data.startDay && data.endDay) {
                start = "DTSTART;VALUE=DATE:" + getDate(data.startDay);
                end = "DTEND;VALUE=DATE:" + getDate(data.endDay, true);
            } else {
                start = "DTSTART:"+getICSDate(data.start);
                end = "DTEND:"+getICSDate(data.end);
            }

            Array.prototype.push.apply(ICS, [
                'BEGIN:VEVENT',
                'DTSTAMP:'+getICSDate(+new Date()),
                'UID:'+uid,
                start,
                end,
                'SUMMARY:'+ data.title,
                'LOCATION:'+ data.location,
            ]);

            if (Array.isArray(data.reminders)) {
                data.reminders.forEach(function (valueMin) {
                    var time = valueMin * 60;
                    var days = Math.floor(time / DAY);
                    time -= days * DAY;
                    var hours = Math.floor(time / HOUR);
                    time -= hours * HOUR;
                    var minutes = Math.floor(time / MINUTE);
                    time -= minutes * MINUTE;
                    var seconds = time;

                    var str = "-P" + days + "D";
                    if (hours || minutes || seconds) {
                        str += "T" + hours + "H" + minutes + "M" + seconds + "S";
                    }
                    Array.prototype.push.apply(ICS, [
                        'BEGIN:VALARM',
                        'ACTION:DISPLAY',
                        'DESCRIPTION:This is an event reminder',
                        'TRIGGER:'+str,
                        'END:VALARM'
                    ]);
                    // XXX ACTION:EMAIL
                    // XXX ATTENDEE:mailto:xxx@xxx.xxx
                    // XXX SUMMARY:Alarm notification
                });
            }

            // XXX add hidden data (from imports)

            ICS.push('END:VEVENT');
        });

        ICS.push('END:VCALENDAR');

        return new Blob([ ICS.join('\n') ], { type: 'text/calendar;charset=utf-8' });
    };

    return module;
});


