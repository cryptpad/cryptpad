var EN = require("../www/common/translations/messages.json");

var simpleTags = [
    '<br>',
    '<br />',
];

['a', 'b', 'em', 'p', 'i'].forEach(function (tag) {
    simpleTags.push('<' + tag + '>');
    simpleTags.push('</' + tag + '>');
});

Object.keys(EN).forEach(function (k) {
    var s = EN[k];
    if (typeof(s) !== 'string') { return; }
    var usesHTML;

    s.replace(/<.*?>/g, function (html) {
        if (simpleTags.indexOf(html) !== -1) { return; }
        usesHTML = true;
        console.log("{%s}", html);
    });

    if (usesHTML) {
        console.log("[%s] %s\n", k, s);
    }
});
