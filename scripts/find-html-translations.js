var EN = require("../www/common/translations/messages.json");

var simpleTags = [
    '<br>',
    '<br />',
    '<br/>',
    '<a href="/login/">',
    '<a href="/register/">',

    // FIXME
    "<a href='#'>",
    '<h3>',
    '</h3>',

    // FIXME register_notes
    '<ul class="cp-notes-list">',
    '</ul>',
    '<li>',
    '</li>',
    '<span class="red">',
    '</span>',
];

['a', 'b', 'em', 'p', 'i'].forEach(function (tag) {
    simpleTags.push('<' + tag + '>');
    simpleTags.push('</' + tag + '>');
});

// these keys are known to be problematic
var KNOWN_ISSUES = [ // FIXME
    //'newVersion',
    //'fm_info_anonymous',
    //'register_notes',
];

var processLang = function (map, lang, primary) {
    var announced = false;
    var announce = function () {
        if (announced) { return; }
        announced = true;
        console.log("NEXT LANGUAGE: ", lang);
    };

    Object.keys(map).forEach(function (k) {
        if (!EN[k]) { return; }
        if (KNOWN_ISSUES.indexOf(k) !== -1) { return; }

        var s = map[k];
        if (typeof(s) !== 'string') { return; }
        var usesHTML;

        s.replace(/<.*?>/g, function (html) {
            if (simpleTags.indexOf(html) !== -1) { return; }
            announce();
            usesHTML = true;
            if (!primary) {
                console.log("{%s}", html);
            }
        });

        if (usesHTML) {
            announce();
            console.log("%s", s);
            console.log("[%s]\n", k);
        }
    });
};

processLang(EN, 'en', true);

[
  'ar',
  'bn_BD',
  'ca',
  'de',
  'es',
  'fi',
  'fr',
  'hi',
  'it',
  'ja',
  'nb',
  'nl',
  'pl',
  'pt-br',
  'ro',
  'ru',
  'sv',
  'te',
  'tr',
  'zh',
].forEach(function (lang) {
    var map = require("../www/common/translations/messages." + lang + ".json");
    if (!Object.keys(map).length) { return; }
    processLang(map, lang);
});
