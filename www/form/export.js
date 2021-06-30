define([
    '/common/common-util.js',
    '/customize/messages.js'
], function (Util, Messages) {
    var Export = {};

    var escapeCSV = function (v) {
        if (!/("|,)/.test(v)) {
            return v || '';
        }
        var value = '';
        var vv = (v || '').replaceAll('"', '""');
        value += '"' + vv + '"';
        return value;
    };
    Export.results = function (content, answers, TYPES) {
        console.log(content, answers, TYPES);
        if (!content || !content.form) { return; }
        var csv = "";
        var form = content.form;

        var questions = Object.keys(form).map(function (key) {
            var obj = form[key];
            if (!obj) { return; }
            return obj.q || Messages.form_default;
        }).filter(Boolean);
        questions.unshift(Messages.form_poll_time); // "Time"
        questions.unshift(Messages.share_formView); // "Participant"

        questions.forEach(function (v, i) {
            if (i) { csv += ','; }
            csv += escapeCSV(v);
        });

        Object.keys(answers || {}).forEach(function (key) {
            var obj = answers[key];
            csv += '\n';
            var time = new Date(obj.time).toISOString();
            var msg = obj.msg || {};
            var user = msg._userdata;
            csv += escapeCSV(time);
            csv += ',' + escapeCSV(user.name || Messages.anonymous);
            Object.keys(form).forEach(function (key) {
                csv += ',' + escapeCSV(String(msg[key]));
            });
        });
        console.log(csv);
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
