// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// This file is used when a user tries to export the entire CryptDrive.
// Calendars will be exported using this format instead of plain text.
define([
    '/customize/pages.js',
    '/common/common-util.js',
    '/calendar/recurrence.js',

    '/lib/ical.min.js'
], function (Pages, Util, Rec) {
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
    };


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
            var getDT = function (data) {
                var start, end;
                if (data.isAllDay) {
                    var startDate = new Date(data.start);
                    var endDate = new Date(data.end);
                    data.startDay = data.startDay || (startDate.getFullYear() + '-' + (startDate.getMonth()+1) + '-' + startDate.getDate());
                    data.endDay = data.endDay || (endDate.getFullYear() + '-' + (endDate.getMonth()+1) + '-' + endDate.getDate());
                    start = "DTSTART;VALUE=DATE:" + getDate(data.startDay);
                    end = "DTEND;VALUE=DATE:" + getDate(data.endDay, true);
                } else {
                    start = "DTSTART:"+getICSDate(data.start);
                    end = "DTEND:"+getICSDate(data.end);
                }
                return {
                    start: start,
                    end: end
                };
            };

            var getRRule = function (data) {
                if (!data.recurrenceRule || !data.recurrenceRule.freq) { return; }
                var r = data.recurrenceRule;
                var rrule = "RRULE:";
                rrule += "FREQ="+r.freq.toUpperCase();
                Object.keys(r).forEach(function (k) {
                    if (k === "freq") { return; }
                    if (k === "by") {
                        Object.keys(r.by).forEach(function (_k) {
                            rrule += ";BY"+_k.toUpperCase()+"="+r.by[_k];
                        });
                        return;
                    }
                    rrule += ";"+k.toUpperCase()+"="+r[k];
                });
                return rrule;
            };

            var addEvent = function (arr, data, recId) {
                var uid = data.id;
                var dt = getDT(data);
                var start = dt.start;
                var end = dt.end;
                var rrule = getRRule(data);

                var formatDescription = function(str) {
                    var componentName = 'DESCRIPTION:';
                    var result = componentName + str.replace(/\n/g, ["\\n"]);
                    // In RFC5545: https://www.rfc-editor.org/rfc/rfc5545#section-3.1
                    result = window.ICAL.helpers.foldline(result);
                    return result;
                };

                Array.prototype.push.apply(arr, [
                    'BEGIN:VEVENT',
                    'DTSTAMP:'+getICSDate(+new Date()),
                    'UID:'+uid,
                    start,
                    end,
                    recId,
                    rrule,
                    'SUMMARY:'+ data.title,
                    'LOCATION:'+ data.location,
                    formatDescription(data.body),
                ].filter(Boolean));

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
                        Array.prototype.push.apply(arr, [
                            'BEGIN:VALARM',
                            'ACTION:DISPLAY',
                            'DESCRIPTION:This is an event reminder',
                            'TRIGGER:'+str,
                            'END:VALARM'
                        ]);
                    });
                }

                if (Array.isArray(data.cp_hidden)) {
                    Array.prototype.push.apply(arr, data.cp_hidden);
                }

                arr.push('END:VEVENT');
            };


            var applyChanges = function (base, changes) {
                var applyDiff = function (obj, k) {
                    var diff = obj[k]; // Diff is always compared to origin start/end
                    var d = new Date(base[k]);
                    d.setDate(d.getDate() + diff.d);
                    d.setHours(d.getHours() + diff.h);
                    d.setMinutes(d.getMinutes() + diff.m);
                    base[k] = +d;
                };
                Object.keys(changes || {}).forEach(function (k) {
                    if (k === "start" || k === "end") {
                        return applyDiff(changes, k);
                    }
                    base[k] = changes[k];
                });
            };

            var prev = data;

            // Check if we have "one-time" or "from date" updates.
            // "One-time" updates will be added accordingly to the ICS specs
            // "From date" updates will be added as new events and will add
            // an "until" value to the initial event's RRULE
            var toAdd = [];
            if (data.recurrenceRule && data.recurrenceRule.freq && data.recUpdate) {
                var ru = data.recUpdate;
                var _all = {};
                var duration = data.end - data.start;

                var all = Rec.getAllOccurrences(data); // "false" if infinite

                Object.keys(ru.from || {}).forEach(function (d) {
                    if (!Object.keys(ru.from[d] || {}).length) { return; }
                    _all[d] = _all[d] || {};
                    _all[d].from = ru.from[d];
                });
                Object.keys(ru.one || {}).forEach(function (d) {
                    if (!Object.keys(ru.one[d] || {}).length) { return; }
                    _all[d] = _all[d] || {};
                    _all[d].one = ru.one[d];
                });
                Object.keys(_all).sort(function (a, b) {
                    return Number(a) - Number(b);
                }).forEach(function (d) {
                    d = Number(d);
                    var r = prev.recurrenceRule;

                    // This rule won't apply if we've reached "until" or "count"
                    var idx = all && all.indexOf(d);
                    if (all && idx === -1) {
                        // Make sure we don't have both count and until
                        if (all.length === r.count) { delete r.until; }
                        else { delete r.count; }
                        return;
                    }

                    var ud = _all[d];

                    if (ud.from) { // "From" updates are not supported by ICS: make a new event
                        var _new = Util.clone(prev);
                        r.until = getICSDate(d - 1); // Stop previous recursion
                        delete r.count;
                        addEvent(ICS, prev, null); // Add previous event
                        Array.prototype.push.apply(ICS, toAdd); // Add individual updates
                        toAdd = [];
                        prev = _new;
                        if (all) { all = all.slice(idx); }

                        // if we updated the recurrence rule, count is reset, nothing to do
                        // if we didn't update the recurrence, we need to fix the count
                        var _r = _new.recurrenceRule;
                        if (all && !ud.from.recurrenceRule && _r && _r.count) {
                            _r.count -= idx;
                        }

                        prev.start = d;
                        prev.end = d + duration;
                        prev.id = Util.uid();
                        applyChanges(prev, ud.from);
                        duration = prev.end - prev.start;
                    }
                    if (ud.one) { // Add update
                        var _one = Util.clone(prev);
                        _one.start = d;
                        _one.end = d + duration;
                        applyChanges(_one, ud.one);
                        var recId = "RECURRENCE-ID:"+getICSDate(+d);
                        delete _one.recurrenceRule;
                        addEvent(toAdd, _one, recId); // Add updated event
                    }
                });
            }

            addEvent(ICS, prev);
            Array.prototype.push.apply(ICS, toAdd); // Add individual updates
        });

        ICS.push('END:VCALENDAR');

        return new Blob([ ICS.join('\r\n') ], { type: 'text/calendar;charset=utf-8' });
    };

    module.import = function (content, id, cb) {
        var ICAL = window.ICAL;
        var res = {};

        var vcalendar;
        try {
            var jcalData = ICAL.parse(content);
            vcalendar = new ICAL.Component(jcalData);
        } catch (e) {
            console.error(e);
            return void cb(e);
        }

        //var method = vcalendar.getFirstPropertyValue('method');
        //if (method !== "PUBLISH") { return void cb('NOT_SUPPORTED'); }

        // Add all timezones in iCalendar object to TimezoneService
        // if they are not already registered.
            var timezones = vcalendar.getAllSubcomponents("vtimezone");
        timezones.forEach(function (timezone) {
            if (!(ICAL.TimezoneService.has(timezone.getFirstPropertyValue("tzid")))) {
                ICAL.TimezoneService.register(timezone);
            }
        });

        var events = vcalendar.getAllSubcomponents('vevent');
        events.forEach(function (ev) {
            var uid = ev.getFirstPropertyValue('uid');
            if (!uid) { return; }

            // Get start and end time
            var isAllDay = false;
            var start = ev.getFirstPropertyValue('dtstart');
            var end = ev.getFirstPropertyValue('dtend');
            var duration = ev.getFirstPropertyValue('duration');
            if (!end && !duration) {
                if (start.isDate) {
                    end = start.clone();
                    end.adjust(1); // Add one day
                } else {
                    end = start.clone();
                }
            } else if (!end) {
                end = start.clone();
                end.addDuration(duration);
            }
            if (start.isDate && end.isDate) {
                isAllDay = true;
                start = String(start);
                end.adjust(-1); // Substract one day
                end = String(end);
            } else {
                start = +start.toJSDate();
                end = +end.toJSDate();
            }

            // Store other properties
            var used = ['dtstart', 'dtend', 'uid', 'summary', 'location', 'description', 'dtstamp', 'rrule', 'recurrence-id'];
            var hidden = [];
            ev.getAllProperties().forEach(function (p) {
                if (used.indexOf(p.name) !== -1) { return; }
                // This is an unused property
                hidden.push(p.toICALString());
            });

            // Get reminders
            var reminders = [];
            ev.getAllSubcomponents('valarm').forEach(function (al) {
                var action = al.getFirstPropertyValue('action');
                if (action !== 'DISPLAY') {
                    // Email notification: keep it in "hidden" and create a cryptpad notification
                    hidden.push(al.toString());
                }
                var trigger = al.getFirstPropertyValue('trigger');
                var minutes = trigger && trigger.toSeconds ? (-trigger.toSeconds() / 60) : 0;
                if (reminders.indexOf(minutes) === -1) { reminders.push(minutes); }
            });

            // Get recurrence rule
            var rrule = ev.getFirstPropertyValue('rrule');
            var rec;
            if (rrule && rrule.freq) {
                rec = {};
                rec.freq = rrule.freq.toLowerCase();
                if (rrule.interval) { rec.interval = rrule.interval; }
                if (rrule.count) { rec.count = rrule.count; }
                if (Object.keys(rrule).includes('wkst')) { rec.wkst = (rrule.wkst + 6) % 7; }
                if (rrule.until) { rec.until = +new Date(rrule.until); }
                Object.keys(rrule.parts || {}).forEach(function (k) {
                    rec.by = rec.by || {};
                    var _k = k.toLowerCase().slice(2); // "BYDAY" ==> "day"
                    rec.by[_k] = rrule.parts[k];
                });
            }

            // Create event
            var obj = {
                calendarId: id,
                id: uid,
                category: 'time',
                title: ev.getFirstPropertyValue('summary'),
                location: ev.getFirstPropertyValue('location'),
                body: ev.getFirstPropertyValue('description'),
                isAllDay: isAllDay,
                start: start,
                end: end,
                reminders: reminders,
                cp_hidden: hidden,
            };
            if (rec) { obj.recurrenceRule = rec; }

            if (!hidden.length) { delete obj.cp_hidden; }
            if (!reminders.length) { delete obj.reminders; }

            var recId = ev.getFirstPropertyValue('recurrence-id');
            if (recId) {
                setTimeout(function () {
                    if (!res[uid]) { return; }
                    var old = res[uid];
                    var time = +new Date(recId);
                    var diff = {};
                    var from = {};
                    Object.keys(obj).forEach(function (k) {
                        if (JSON.stringify(old[k]) === JSON.stringify(obj[k])) { return; }
                        if (['start','end'].includes(k)) {
                            diff[k] = Rec.diffDate(old[k], obj[k]);
                            return;
                        }
                        if (k === "recurrenceRule") {
                            from[k] = obj[k];
                            return;
                        }
                        diff[k] = obj[k];
                    });
                    old.recUpdate = old.recUpdate || {one:{},from:{}};
                    if (Object.keys(from).length) { old.recUpdate.from[time] = from; }
                    if (Object.keys(diff).length) { old.recUpdate.one[time] = diff; }
                });
                return;
            }

            res[uid] = obj;
        });

        // setTimeout to make sure we call back after the "recurrence-id" setTimeout
        // are called
        setTimeout(function () {
            cb(null, res);
        });
    };

    return module;
});


