// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    '/common/common-util.js',
    '/customize/messages.js'
], function (Util, Messages) {
    var Export = {
        ext: '.json'
    };

    var escapeCSV = function (v) {
        if (!/("|,|\n|;)/.test(v)) {
            return v || '';
        }
        var value = '';
        var vv = (v || '').replaceAll('"', '""');
        value += '"' + vv + '"';
        return value;
    };

    // Get all responses
    var sortAnswers = function (answers) {
        var allUnsorted = {};
        Object.keys(answers).forEach(function (curve) {
            var userAnswers = answers[curve];
            Object.keys(userAnswers).forEach(function (uid) {
                allUnsorted[curve + '|' + uid] = userAnswers[uid];
            });
        });
        var sorted = Object.keys(allUnsorted).sort(function (uid1, uid2) {
            return (allUnsorted[uid1].time || 0) - (allUnsorted[uid2].time || 0);
        });
        return {
            answers: allUnsorted,
            sortedKeys: sorted
        };
    };

    var exportJSON = function (content, answers, TYPES, order) {
        var form = content.form;
        var res = {
            questions: {},
            responses: []
        };
        var q = res.questions;
        var r = res.responses;

        var sortObj  = sortAnswers(answers);
        answers = sortObj.answers;
        var sortedKeys = sortObj.sortedKeys;

        // Add questions
        var i = 1;
        order.forEach(function (key) {
            var obj = form[key];
            if (!obj) { return; }
            var type = obj.type;
            if (!TYPES[type]) { return; } // Ignore static types
            var id = `q${i++}`;
            if (TYPES[type] && TYPES[type].exportCSV) {
                var _obj = Util.clone(obj);
                _obj.q = "tmp";
                q[id] = {
                    question: obj.q,
                    items: TYPES[type].exportCSV(false, _obj).map(function (str) {
                        return str.slice(6); // Remove "tmp | "
                    })
                };
            } else {
                q[id] = obj.q || Messages.form_default;
            }
        });

        sortedKeys.forEach(function (k) {
                var obj = answers[k];
                var time = new Date(obj.time).toISOString();
                var msg = obj.msg || {};
                var user = msg._userdata || {};
                var data = {
                    '_time': time,
                    '_name': user.name || Messages.anonymous
                };

                var i = 1;
                order.forEach(function (key) {
                    if (!form[key]) { return; }
                    var type = form[key].type;
                    if (!TYPES[type]) { return; } // Ignore static types
                    var id = `q${i++}`;
                    if (TYPES[type].exportCSV) {
                        data[id] = TYPES[type].exportCSV(msg[key], form[key]);
                        return;
                    }
                    data[id] = msg[key];
                });
                r.push(data);
        });

        return JSON.stringify(res, 0, 2);
    };
    Export.results = function (content, answers, TYPES, order, format) {
        if (!content || !content.form) { return; }

        if (format === "json") { return exportJSON(content, answers, TYPES, order); }

        var sortObj  = sortAnswers(answers);
        answers = sortObj.answers;
        var sortedKeys = sortObj.sortedKeys;

        var isArray = format === "array";
        var csv = "";
        var array = [];
        var form = content.form;

        var questions = [Messages.form_poll_time, Messages.share_formView];

        order.forEach(function (key) {
            var obj = form[key];
            if (!obj) { return; }
            var type = obj.type;
            if (!TYPES[type]) { return; } // Ignore static types
            var c;
            if (TYPES[type] && TYPES[type].exportCSV) { c = TYPES[type].exportCSV(false, obj); }
            if (!c) { c = [obj.q || Messages.form_default]; }
            Array.prototype.push.apply(questions, c);
        });

        questions.forEach(function (v, i) {
            if (i) { csv += ','; }
            csv += escapeCSV(v);
        });
        array.push(questions);

        sortedKeys.forEach(function (k) {
                var obj = answers[k];
                csv += '\n';
                var time = new Date(obj.time).toISOString();
                var msg = obj.msg || {};
                var user = msg._userdata || {};
                var line = [];
                line.push(time);
                line.push(user.name || Messages.anonymous);
                order.forEach(function (key) {
                    var type = form[key].type;
                    if (!TYPES[type]) { return; } // Ignore static types
                    if (TYPES[type].exportCSV) {
                        var res = TYPES[type].exportCSV(msg[key], form[key]);
                        Array.prototype.push.apply(line, res);
                        return;
                    }
                    line.push(String(msg[key] || ''));
                });
                line.forEach(function (v, i) {
                    if (i) { csv += ','; }
                    csv += escapeCSV(v);
                });
                array.push(line);
        });
        if (isArray) { return array; }
        return csv;
    };

    Export.main = function (content, cb) {
        var json = Util.clone(content || {});
        delete json.answers;
        cb(new Blob([JSON.stringify(json, 0, 2)], {
            type: 'application/json;charset=utf-8'
        }));
    };

    return Export;
});
