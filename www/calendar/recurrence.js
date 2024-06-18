// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
], function (Util) {
    var Rec = {};

    var debug = function () {};

    // Get week number with any "WKST" (firts day of the week)
    // Week 1 is the first week of the year containing at least 4 days in this year
    // It depends on which day is considered the first day of the week (default Monday)
    // In our case, wkst is a number matching the JS rule: 0 == Sunday
    var getWeekNo = Rec.getWeekNo = function (date, wkst) {
        if (typeof(wkst) !== "number") { wkst = 1; } // Default monday

        var newYear = new Date(date.getFullYear(),0,1);
        var day = newYear.getDay() - wkst; //the day of week the year begins on
        day = (day >= 0 ? day : day + 7);
        var daynum = Math.floor((date.getTime() - newYear.getTime())/86400000) + 1;
        var weeknum;
        // Week 1 / week 53
        if (day < 4) {
            weeknum = Math.floor((daynum+day-1)/7) + 1;
            if (weeknum > 52) {
                var nYear = new Date(date.getFullYear() + 1,0,1);
                var nday = nYear.getDay() - wkst;
                nday = nday >= 0 ? nday : nday + 7;
                weeknum = nday < 4 ? 1 : 53;
            }
        }
        else {
            weeknum = Math.floor((daynum+day-1)/7);
        }
        return weeknum;
    };

    var getYearDay = function (date) {
        var start = new Date(date.getFullYear(), 0, 0);
        var diff = (date - start) +
                    ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    };
    var setYearDay = function (date, day) {
        if (typeof(day) !== "number" || Math.abs(day) < 1 || Math.abs(day) > 366) { return; }
        if (day < 0) {
            var max = getYearDay(new Date(date.getFullYear(), 11, 31));
            day = max + day + 1;
        }
        date.setMonth(0);
        date.setDate(day);
        return true;
    };

    var getEndData = function (s, e) {
        if (s > e) { return void console.error("Wrong data"); }
        var days;
        if (e.getFullYear() === s.getFullYear()) {
            days = getYearDay(e) - getYearDay(s);
        } else { // eYear < sYear
            var tmp = new Date(s.getFullYear(), 11, 31);
            var d1 = getYearDay(tmp) - getYearDay(s); // Number of days before December 31st
            var de = getYearDay(e);
            days = d1 + de;
            while ((tmp.getFullYear()+1) < e.getFullYear()) {
                tmp.setFullYear(tmp.getFullYear()+1);
                days += getYearDay(tmp);
            }
        }
        return {
            h: e.getHours(),
            m: e.getMinutes(),
            days: days
        };
    };
    var setEndData = function (s, e, data) {
        e.setTime(+s);
        if (!data) { return; }
        e.setHours(data.h);
        e.setMinutes(data.m);
        e.setSeconds(0);
        e.setDate(s.getDate() + data.days);
    };

    var DAYORDER = Rec.DAYORDER = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
    var getDayData = function (str) {
        var pos = Number(str.slice(0,-2));
        var day = DAYORDER.indexOf(str.slice(-2));
        return pos ? [pos, day] : day;
    };

    var goToFirstWeekDay = function (date, wkst) {
        var d = date.getDay();
        wkst = typeof(wkst) === "number" ? wkst : 1;
        if (d >= wkst) {
            date.setDate(date.getDate() - (d-wkst));
        } else {
            date.setDate(date.getDate() - (7+d-wkst));
        }
    };

    var getDateStr = function (date) {
        return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
    };
    var FREQ = {};
    FREQ['daily'] = function (s, i) {
        s.setDate(s.getDate()+i);
    };
    FREQ['weekly'] = function (s,i) {
        s.setDate(s.getDate()+(i*7));
    };
    FREQ['monthly'] = function (s,i) {
        s.setMonth(s.getMonth()+i);
    };
    FREQ['yearly'] = function (s,i) {
        s.setFullYear(s.getFullYear()+i);
    };

    // EXPAND is used to create iterations added from a BYxxx rule
    // dateA is the start date and b is the number or id of the BYxxx rule item
    var EXPAND = {};
    EXPAND['month'] = function (dateS, origin, b) {
        var oS = new Date(origin.start);
        var a = dateS.getMonth() + 1;
        var toAdd = (b-a+12)%12;
        var m = dateS.getMonth() + toAdd;
        dateS.setMonth(m);
        dateS.setDate(oS.getDate());
        if (dateS.getMonth() !== m) { return; } // Day 31 may move us to the next month
        return true;
    };


    EXPAND['weekno'] = function (dateS, origin, week, rule) {
        var wkst = rule && rule.wkst;
        if (typeof(wkst) !== "number") { wkst = 1; } // Default monday
        var oS = new Date(origin.start);

        var lastD = new Date(dateS.getFullYear(), 11, 31); // December 31st
        var lastW = getWeekNo(lastD, wkst); // Last week of the year is either 52 or 53

        var doubleOne = lastW === 1;
        if (lastW === 1) { lastW = 52; }

        var a = getWeekNo(dateS, wkst);
        if (!week || week > lastW) { return false; } // Week 53 may not exist this year

        if (week < 0) { week = lastW + week + 1; } // Turn negative week number into positive

        var toAdd = week - a;
        var weekS = new Date(+dateS);
        // Go to the selected week
        weekS.setDate(weekS.getDate() + (toAdd * 7));
        goToFirstWeekDay(weekS, wkst);

        // Then make sure we are in the correct start day
        var all = 'aaaaaaa'.split('').map(function (o, i) {
            var date = new Date(+weekS);
            date.setDate(date.getDate() + i);
            if (date.getFullYear() !== dateS.getFullYear()) { return; }
            return date.toLocaleDateString() !== oS.toLocaleDateString() && date;
        }).filter(Boolean);

        // If we're looking for week 1 and the last week is a week 1, add the days
        if (week === 1 && doubleOne) {
            goToFirstWeekDay(lastD, wkst);
            'aaaaaaa'.split('').some(function (o, i) {
                var date = new Date(+lastD);
                date.setDate(date.getDate() + i);
                if (date.toLocaleDateString() === oS.toLocaleDateString()) { return; }
                if (date.getFullYear() > dateS.getFullYear()) { return true; }
                all.push(date);
            });
        }

        return all.length ? all : undefined;
    };
    EXPAND['yearday'] = function (dateS, origin, b) {
        var y = dateS.getFullYear();
        var state = setYearDay(dateS, b);
        if (!state) { return; } // Invalid day "b"
        if (dateS.getFullYear() !== y) { return; } // Day 366 make move us to the next year
        return true;
    };
    EXPAND['monthday'] = function (dateS, origin, b, rule) {
        if (typeof(b) !== "number" || Math.abs(b) < 1 || Math.abs(b) > 31) { return false; }

        var setMonthDay = function (date, day) {
            var m = date.getMonth();
            if (day < 0) {
                var tmp = new Date(date.getFullYear(), date.getMonth()+1, 0); // Last day
                day = tmp.getDate() + day + 1;
            }
            date.setDate(day);
            return date.getMonth() === m; // Don't push if day 31 moved us to the next month

        };

        // Monthly events
        if (rule.freq === 'monthly') {
            return setMonthDay(dateS, b);
        }

        var all = 'aaaaaaaaaaaa'.split('').map(function (o, i) {
            var date = new Date(dateS.getFullYear(), i, 1);
            var ok = setMonthDay(date, b);
            return ok ? date : undefined;
        }).filter(Boolean);
        return all.length ? all : undefined;
    };
    EXPAND['day'] = function (dateS, origin, b, rule) {
        // Here "b" can be a single day ("TU") or a position and a day ("1MO")
        var day = getDayData(b);
        var pos;
        if (Array.isArray(day)) {
            pos = day[0];
            day = day[1];
        }

        var all = [];
        if (![0,1,2,3,4,5,6].includes(day)) { return false; }

        var filterPos = function (m) {
            if (!pos) { return; }

            var _all = [];
            'aaaaaaaaaaaa'.split('').some(function (a, i) {
                if (typeof(m) !== "undefined" && i !== m) { return; }

                var _pos;
                var tmp = all.filter(function (d) {
                    return d.getMonth() === i;
                });
                if (pos < 0) {
                    _pos = tmp.length + pos;
                } else {
                    _pos = pos - 1; // An array starts at 0 but the recurrence rule starts at 1
                }
                _all.push(tmp[_pos]);

                return typeof(m) !== "undefined" && i === m;
            });
            all = _all.filter(Boolean); // The "5th" {day} won't always exist
        };

        var tmp;
        if (rule.freq === 'yearly') {
            tmp = new Date(+dateS);
            var y = dateS.getFullYear();
            while (tmp.getDay() !== day) { tmp.setDate(tmp.getDate()+1); }
            while (tmp.getFullYear() === y) {
                all.push(new Date(+tmp));
                tmp.setDate(tmp.getDate()+7);
            }
            filterPos();
            return all;
        }

        if (rule.freq === 'monthly') {
            tmp = new Date(+dateS);
            var m = dateS.getMonth();
            while (tmp.getDay() !== day) { tmp.setDate(tmp.getDate()+1); }
            while (tmp.getMonth() === m) {
                all.push(new Date(+tmp));
                tmp.setDate(tmp.getDate()+7);
            }
            filterPos(m);
            return all;
        }

        if (rule.freq === 'weekly') {
            while (dateS.getDay() !== day) { dateS.setDate(dateS.getDate()+1); }
        }
        return true;
    };

    var LIMIT = {};
    LIMIT['month'] = function (events, rule) {
        return events.filter(function (s) {
            return rule.includes(s.getMonth()+1);
        });
    };
    LIMIT['weekno'] = function (events, weeks, rules) {
        return events.filter(function (s) {
            var wkst = rules && rules.wkst;
            if (typeof(wkst) !== "number") { wkst = 1; } // Default monday

            var lastD = new Date(s.getFullYear(), 11, 31); // December 31st
            var lastW = getWeekNo(lastD, wkst); // Last week of the year is either 52 or 53
            if (lastW === 1) { lastW = 52; }

            var w = getWeekNo(s, wkst);

            return weeks.some(function (week) {
                if (week > 0) { return week === w; }
                return w === (lastW + week + 1);
            });
        });
    };
    LIMIT['yearday'] = function (events, days) {
        return events.filter(function (s) {
            var d = getYearDay(s);
            var max = getYearDay(new Date(s.getFullYear(), 11, 31));

            return days.some(function (day) {
                if (day > 0) { return day === d; }
                return d === (max + day + 1);
            });
        });
    };
    LIMIT['monthday'] = function (events, rule) {
        return events.filter(function (s) {
            var r = Util.clone(rule);
            // Transform the negative monthdays into positive for this specific month
            r = r.map(function (b) {
                if (b < 0) {
                    var tmp = new Date(s.getFullYear(), s.getMonth()+1, 0); // Last day
                    b = tmp.getDate() + b + 1;
                }
                return b;
            });
            return r.includes(s.getDate());
        });
    };
    LIMIT['day'] = function (events, days, rules) {
        return events.filter(function (s) {
            var dayStr = s.toLocaleDateString();

            // Check how to handle position in BYDAY rules (last day of the month or the year?)
            var type = 'yearly';
            if (rules.freq === 'monthly' ||
                (rules.freq === 'yearly' && rules.by && rules.by.month)) {
                type = 'monthly';
            }

            // Check if this event matches one of the allowed days
            return days.some(function (r) {
                // rule elements are strings with pos and day
                var day = getDayData(r);
                var pos;
                if (Array.isArray(day)) {
                    pos = day[0];
                    day = day[1];
                }
                if (!pos) {
                    return s.getDay() === day;
                }

                // If we have a position, we can use EXPAND.day to get the nth {day} of the
                // year/month and compare if it matches with
                var d = new Date(s.getFullYear(), s.getMonth(), 1);
                if (type === 'yearly') { d.setMonth(0); }
                var res = EXPAND["day"](d, {}, r, {freq: type});
                return res.some(function (date) {
                    return date.toLocaleDateString() === dayStr;
                });
            });
        });
    };
    LIMIT['setpos'] = function (events, rule) {
        var init = events.slice();
        var rules = Util.deduplicateString(rule.slice().map(function (n) {
            if (n > 0) { return (n-1); }
            if (n === 0) { return; }
            return init.length + n;
        }));
        return events.filter(function (ev) {
            var idx = init.indexOf(ev);
            return rules.includes(idx);
        });
    };

    var BYORDER = ['month','weekno','yearday','monthday','day'];
    var BYDAYORDER = ['month','monthday','day'];

    Rec.getMonthId = function (d) {
        return d.getFullYear() + '-' + d.getMonth();
    };
    var cache = window.CP_calendar_cache = {};
    var recurringAcross = {};
    Rec.resetCache = function () {
        cache = window.CP_calendar_cache = {};
        recurringAcross = {};
    };

    var iterate = function (rule, _origin, s) {
        // "origin" is the original event to detect the start of BYxxx
        var origin = Util.clone(_origin);
        var oS = new Date(origin.start);

        var id = origin.id.split('|')[0]; // Use same cache when updating recurrence rule

        // "uid" is used for the cache
        var uid = s.toLocaleDateString();
        cache[id] = cache[id] || {};

        var inter = rule.interval || 1;
        var freq = rule.freq;

        var all = [];
        var limit = function (byrule, n) {
            all = LIMIT[byrule](all, n, rule);
        };
        var expand = function (byrule) {
            return function (n) {
                // Set the start date at the beginning of the current FREQ
                var _s = new Date(+s);
                if (rule.freq === 'yearly') {
                    // January 1st
                    _s.setMonth(0);
                    _s.setDate(1);
                } else if (rule.freq === 'monthly') {
                    _s.setDate(1);
                } else if (rule.freq === 'weekly') {
                    goToFirstWeekDay(_s, rule.wkst);
                } else if (rule.freq === 'daily') {
                    // We don't have < byday rules so we can't expand daily rules
                }

                var add = EXPAND[byrule](_s, origin, n, rule);

                if (!add) { return; }

                if (Array.isArray(add)) {
                    add = add.filter(function (dateS) {
                        return dateS.toLocaleDateString() !== oS.toLocaleDateString();
                    });
                    Array.prototype.push.apply(all, add);
                } else {
                    if (_s.toLocaleDateString() === oS.toLocaleDateString()) { return; }
                    all.push(_s);
                }
            };
        };

        // Manage interval for the next iteration
        var it = Util.once(function () {
            FREQ[freq](s, inter);
        });
        var addDefault = function () {
            if (freq === "monthly") {
                s.setDate(15);
            } else if (freq === "yearly" && oS.getMonth() === 1 && oS.getDate() === 29) {
                s.setDate(28);
            }

            it();

            var _s = new Date(+s);
            if (freq === "monthly" || freq === "yearly") {
                _s.setDate(oS.getDate());
                if (_s.getDate() !== oS.getDate()) { return; } // If 31st or Feb 29th doesn't exist
                if (freq === "yearly" && _s.getMonth() !== oS.getMonth()) { return; }

                // FIXME if there is a recUpdate that moves the 31st to the 30th, the event
                // will still only be displayed on months with 31 days
            }
            all.push(_s);
        };

        if (Array.isArray(cache[id][uid])) {
            debug('Get cache', id, uid);
            if (freq === "monthly") {
                s.setDate(15);
            } else if (freq === "yearly" && oS.getMonth() === 1 && oS.getDate() === 29) {
                s.setDate(28);
            }
            it();
            return cache[id][uid];
        }

        if (rule.by && freq === 'yearly') {
            var order = BYORDER.slice();
            var monthLimit = false;
            if (rule.by.weekno || rule.by.yearday || rule.by.monthday || rule.by.day) {
                order.shift();
                monthLimit = true;
            }
            var first = true;
            order.forEach(function (_order) {
                var r = rule.by[_order];
                if (!r) { return; }
                if (first) {
                    r.forEach(expand(_order));
                    first = false;
                } else if (_order === "day") {
                    if (rule.by.yearday || rule.by.monthday || rule.by.weekno) {
                        limit('day', rule.by.day);
                    } else {
                        rule.by.day.forEach(expand('day'));
                    }
                } else {
                    limit(_order, r);
                }
            });
            if (rule.by.month && monthLimit) {
                limit('month', rule.by.month);
            }
        }
        if (rule.by && freq === 'monthly') {
            // We're going to compute all the entries for the coming month
            if (!rule.by.monthday && !rule.by.day) {
                addDefault();
            } else if (rule.by.monthday) {
                rule.by.monthday.forEach(expand('monthday'));
            } else if (rule.by.day) {
                rule.by.day.forEach(expand('day'));
            }
            if (rule.by.month) {
                limit('month', rule.by.month);
            }
            if (rule.by.day && rule.by.monthday) {
                limit('day', rule.by.day);
            }
        }
        if (rule.by && freq === 'weekly') {
            // We're going to compute all the entries for the coming week
            if (!rule.by.day) {
                addDefault();
            } else {
                rule.by.day.forEach(expand('day'));
            }
            if (rule.by.month) {
                limit('month', rule.by.month);
            }
        }
        if (rule.by && freq === 'daily') {
            addDefault();
            BYDAYORDER.forEach(function (_order) {
                var r = rule.by[_order];
                if (!r) { return; }
                limit(_order, r);
            });
        }

        all.sort(function (a, b) {
            return a-b;
        });

        if (rule.by && rule.by.setpos) {
            limit('setpos', rule.by.setpos);
        }

        if (!rule.by || !Object.keys(rule.by).length) {
            addDefault();
        } else {
            it();
        }


        var done = [];
        all = all.filter(function (newS) {
            var start = new Date(+newS).toLocaleDateString();
            if (done.includes(start)) { return false; }
            done.push(start);
            return true;
        });

        debug('Set cache', id, uid);
        cache[id][uid] = all;

        return all;
    };

    var getNextRules = function (obj) {
        if (!obj.recUpdate) { return []; }
        var _allRules = {};
        var _obj = obj.recUpdate.from;
        Object.keys(_obj || {}).forEach(function (d) {
            var u = _obj[d];
            if (u.recurrenceRule) { _allRules[d] = u.recurrenceRule; }
        });
        return Object.keys(_allRules).sort(function (a, b) { return Number(a)-Number(b); })
                      .map(function (k) {
            var r = Util.clone(_allRules[k]);
            if (!FREQ[r.freq]) { return; }
            if (r.interval && r.interval < 1) { return; }
            r._start = Number(k);
            return r;
        }).filter(Boolean);
    };

    var fixTimeZone = function (evTimeZone, origin, target) {
        var getOffset = function (date, tz) {
            // Get an ISO string using Canadian local format
            let iso = date.toLocaleString('en-CA', { timeZone:tz, hour12: false }).replace(', ', 'T');
            iso += '.' + date.getMilliseconds().toString().padStart(3, '0');

            // Get a UTC version of this time
            let utcDate = new Date(iso + 'Z');

            // Return the difference in timestamps, as minutes (60*1000)
            return -(utcDate - date);
        };

        var myTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        var offset = getOffset(origin, evTimeZone) - getOffset(target, evTimeZone);
        var myOffset = getOffset(origin, myTimeZone) - getOffset(target, myTimeZone);

        return myOffset - offset;
    };

    Rec.getRecurring = function (months, events) {
        if (window.CP_DEV_MODE) { debug = console.warn; }

        var toAdd = [];
        months.forEach(function (monthId) {
            // from 1st day of the month at 00:00 to last day at 23:59:59:999
            var ms = monthId.split('-');
            var _startMonth = new Date(ms[0], ms[1]);
            var _endMonth = new Date(+_startMonth);
            _endMonth.setMonth(_endMonth.getMonth() + 1);
            _endMonth.setMilliseconds(-1);

            debug('Compute month', _startMonth.toLocaleDateString());

            var rec = events || [];
            rec.forEach(function (obj) {
                var _start = new Date(obj.start);
                var _end = new Date(obj.end);
                var _origin = obj;
                var rule = obj.recurrenceRule;
                if (!rule) { return; }

                var nextRules = getNextRules(obj);
                var nextRule = nextRules.shift();

                if (_start >= _endMonth) { return; }

                // Check the "until" date of the latest rule we can use and stop now
                // if the recurrence ends before the current month
                var until = rule.until;
                var _nextRules = nextRules.slice();
                var _nextRule = nextRule;
                while (_nextRule && _nextRule._start && _nextRule._start < _startMonth) {
                    until = nextRule.until;
                    _nextRule = _nextRules.shift();
                }
                if (until < _startMonth) { return; }

                var endData = getEndData(_start, _end);

                if (rule.interval && rule.interval < 1) { return; }
                if (!FREQ[rule.freq]) { return; }

                /*
                // Rule examples
                rule.by = {
                    //month: [1, 4, 5, 8, 12],
                    //weekno: [1, 2, 4, 5, 32, 34, 35, 50],
                    //yearday: [1, 2, 29, 30, -2, -1, 250],
                    //monthday: [1, 2, 3, -3, -2, -1],
                    //day: ["MO", "WE", "FR"],
                    //setpos: [1, 2, -1, -2]
                };
                rule.wkst = 0;
                rule.interval = 2;
                rule.freq = 'yearly';
                rule.count = 10;
                */
                debug('Iterate over', obj.title, obj);
                debug('Use rule', rule);

                var count = rule.count;
                var c = 1;

                var next = function (start) {
                    var evS = new Date(+start);

                    if (count && c >= count) { return; }

                    debug('Start iteration', evS.toLocaleDateString());

                    var _toAdd = iterate(rule, obj, evS);

                    debug('Iteration results', JSON.stringify(_toAdd.map(function (o) { return new Date(o).toLocaleDateString();})));

                    // Make sure to continue if the current year doesn't provide any result
                    if (!_toAdd.length) {
                        if (evS.getFullYear() < _startMonth.getFullYear() ||
                            evS < _endMonth) {
                            return void next(evS);
                        }
                        return;
                    }


                    var stop = false;
                    var newrule = false;
                    _toAdd.some(function (_newS) {
                        // Make event with correct start and end time
                        var _ev = Util.clone(obj);
                        _ev.id = _origin.id + '|' + (+_newS);
                        var _evS = new Date(+_newS);
                        var _evE = new Date(+_newS);
                        setEndData(_evS, _evE, endData);
                        _ev.start = +_evS;
                        _ev.end = +_evE;
                        _ev._count = c;
                        if (_ev.isAllDay && _ev.startDay) { _ev.startDay = getDateStr(_evS); }
                        if (_ev.isAllDay && _ev.endDay) { _ev.endDay = getDateStr(_evE); }

                        if (nextRule && _ev.start === nextRule._start) {
                            newrule = true;
                        }

                        var useNewRule = function () {
                            if (!newrule) { return; }
                            debug('Use new rule', nextRule);
                            _ev._count = c;
                            count = nextRule.count;
                            c = 1;
                            evS = +_evS;
                            obj = _ev;
                            rule = nextRule;
                            nextRule = nextRules.shift();
                        };


                        if (c >= count) { // Limit reached
                            debug(_evS.toLocaleDateString(), 'count');
                            stop = true;
                            return true;
                        }
                        if (_evS >= _endMonth) { // Won't affect us anymore
                            debug(_evS.toLocaleDateString(), 'endMonth');
                            stop = true;
                            return true;
                        }
                        if (rule.until && _evS > rule.until) {
                            debug(_evS.toLocaleDateString(), 'until');
                            stop = true;
                            return true;
                        }
                        if (_evS < _start) { // "Expand" rules may create events before the _start
                            debug(_evS.toLocaleDateString(), 'start');
                            return;
                        }
                        c++;
                        if (_evE < _startMonth) { // Ended before the current month
                            // Nothing to display but continue the recurrence
                            debug(_evS.toLocaleDateString(), 'startMonth');
                            if (newrule) { useNewRule(); }
                            return;
                        }
                        // If a recurring event start and end in different months, make sure
                        // it is only added once
                        if ((_evS < _endMonth && _evE >= _endMonth) ||
                                (_evS < _startMonth && _evE >= _startMonth)) {
                            if (recurringAcross[_ev.id] && recurringAcross[_ev.id].includes(_ev.start)) {
                                return;
                            } else {
                                recurringAcross[_ev.id] = recurringAcross[_ev.id] || [];
                                recurringAcross[_ev.id].push(_ev.start);
                            }

                        }

                        // Add this event
                        if (_origin.timeZone && !_ev.isAllDay) {
                            var offset = fixTimeZone(_origin.timeZone, _start, _evS);
                            _ev.start += offset;
                            _ev.end += offset;
                        }
                        toAdd.push(_ev);
                        if (newrule) {
                            useNewRule();
                            return true;
                        }
                    });
                    if (!stop) { next(evS); }
                };
                next(_start);
                debug('Added this month (all events)', toAdd.map(function (ev) {
                    return new Date(ev.start).toLocaleDateString();
                }));
            });
        });
        return toAdd;
    };
    Rec.getAllOccurrences = function (ev) {
        if (!ev.recurrenceRule) { return [ev.start]; }
        var r = ev.recurrenceRule;
        // In case of infinite recursion, we can't get all
        if (!r.until && !r.count) { return false; }
        var all = [ev.start];
        var d = new Date(ev.start);
        d.setDate(15); // Make sure we won't skip a month if the event starts on day > 28
        var toAdd = [];

        var i = 0;
        var check = function () {
            return r.count ? (all.length < r.count) : (+d <= r.until);
        };
        while ((toAdd = Rec.getRecurring([Rec.getMonthId(d)], [ev])) && check() && i < (r.count*12)) {
            Array.prototype.push.apply(all, toAdd.map(function (_ev) { return _ev.start; }));
            d.setMonth(d.getMonth() + 1);
            i++;
        }

        return all;
    };

    Rec.diffDate = function (oldTime, newTime) {
        var n = new Date(newTime);
        var o = new Date(oldTime);

        // Diff Days
        var d = 0;
        var mult = n < o ? -1 : 1;
        while (n.toLocaleDateString() !== o.toLocaleDateString() || mult >= 10000) {
            n.setDate(n.getDate() - mult);
            d++;
        }
        d = mult * d;

        // Diff hours
        n = new Date(newTime);
        var h = n.getHours() - o.getHours();

        // Diff minutes
        var m = n.getMinutes() - o.getMinutes();

        return {
            d: d,
            h: h,
            m: m
        };
    };

    var sortUpdate = function (obj) {
        return Object.keys(obj).sort(function (d1, d2) {
            return Number(d1) - Number(d2);
        });
    };
    Rec.applyUpdates = function (events) {
        events.forEach(function (ev) {
            ev.raw = {
                start: ev.start,
                end: ev.end,
            };

            if (!ev.recUpdate) { return; }

            var from = ev.recUpdate.from || {};
            var one = ev.recUpdate.one || {};
            var s = ev.start;

            // Add "until" date to our recurrenceRule if it has been modified in future occurences
            var nextRules = getNextRules(ev).filter(function (r) {
                return r._start > s;
            });
            var nextRule = nextRules.shift();

            var applyDiff = function (obj, k) {
                var diff = obj[k]; // Diff is always compared to origin start/end
                var d = new Date(ev.raw[k]);
                d.setDate(d.getDate() + diff.d);
                d.setHours(d.getHours() + diff.h);
                d.setMinutes(d.getMinutes() + diff.m);
                ev[k] = +d;
            };

            sortUpdate(from).forEach(function (d) {
                if (s < Number(d)) { return; }
                Object.keys(from[d]).forEach(function (k) {
                    if (k === 'start' || k === 'end') { return void applyDiff(from[d], k); }
                    if (k === "recurrenceRule" && !from[d][k]) { return; }
                    ev[k] = from[d][k];
                });
            });
            Object.keys(one[s] || {}).forEach(function (k) {
                if (k === 'start' || k === 'end') { return void applyDiff(one[s], k); }
                if (k === "recurrenceRule" && !one[s][k]) { return; }
                ev[k] = one[s][k];
            });
            if (ev.deleted) {
                Object.keys(ev).forEach(function (k) {
                    delete ev[k];
                });
            }

            if (nextRule && ev.recurrenceRule) {
                ev.recurrenceRule._next = nextRule._start - 1;
            }

            if (ev.reminders) {
                ev.raw.reminders = ev.reminders;
            }
        });
        return events;
    };


    return Rec;
});
