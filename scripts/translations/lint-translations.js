// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var EN = require("../../www/common/translations/messages.json");
var Util = require("../../www/common/common-util.js");
var Fs = require("fs");

var simpleTags = [
    '<br>',
    '<a href="/login/">',
    '<a href="/register/">',
    '<a href="/recovery/">',

    // FIXME
    "<a href='#'>",
    '<a href="#docs">',
    '<h3>',
    '</h3>',

    // FIXME register_notes
    '<ul class="cp-notes-list">',
    '</ul>',
    '<span class="red">',
    '</span>',
];

['a', 'b', 'em',/* 'p',*/ 'i', 'code', 'li',].forEach(function (tag) {
    simpleTags.push('<' + tag + '>');
    simpleTags.push('</' + tag + '>');
});

var found_tags = {};

// these keys are known to be problematic
var KNOWN_ISSUES = [ // FIXME
    //'newVersion',
    //'fm_info_anonymous',
    //'register_notes',
];

var special_rules = {};

special_rules.en = function (s) {
    // Prefer the american -ize suffix for verbs rather than -ise
    return /[^w]ise(\s|$)/.test(s);
};

special_rules.fr = function (s) {
/*
    hacky regexp to check whether there are any instances of ':'
    which do not have the preceding space as is expected.
    ignore instances where the following character is a '/'
    because this is probably a URL (http(s)://)
*/
    return /\S[:;\?\!][^\/]{1,}/.test(s.replace(/mailto:/g, " :"));
};

var noop = function () {};

var getTags = S => {
    if (typeof(S) !== 'string') { return []; }

    var tags = [];
    S.replace(/(<[\s\S]*?>|\{\d+\})/g, function (html) {
        tags.push(html);
    });
    return tags;
};

var getTagCount = T => {
    var M = {};
    T.forEach(html => {
        Util.inc(M, html);
    });
    return M;
};

// bidirectional comparison
var compareMarkup = (A, B) => {
    // if the frequency of some key in A does not match that of the same key in B
    var diff = {};

    var compare = k => {
        if (diff[k]) { return; }

        var a = A[k] || 0;
        var b = B[k] || 0;
        if (a === b) { return; }
        diff[k] = b - a;
    };

    Object.keys(A).forEach(compare);

    // same for B
    Object.keys(B).forEach(compare);
    return diff;
};

var getReferenceMarkup = (function () {
    var O = {};
    return function (k) {
        var val = O[k];
        if (typeof(val) !== 'undefined') { return val; }
        var tags = getTags(EN[k]);
        val = O[k] = getTagCount(tags);
        return val;
    };
}());

var finalErrorCount = 0;
var processLang = function (map, lang, primary) {
    var announced = false;
    var announce = function () {
        if (announced) { return; }
        announced = true;
        console.log("## LANGUAGE: %s\n", lang);
    };

    var special = special_rules[lang] || noop;
    Object.keys(map).forEach(function (k) {
        if (!EN[k]) { return; }
        if (KNOWN_ISSUES.indexOf(k) !== -1) { return; }

        var s = map[k];
        if (typeof(s) !== 'string') { return; }
        var usesHTML;

        var ref = getReferenceMarkup(k);
        var tags = getTags(s);
        var tagCount = getTagCount(tags);

        var markupDiff = compareMarkup(ref, tagCount);

        //console.log(markupDiff);
        var markupMatches = Object.keys(markupDiff).length === 0;

        //console.log(ref);

        tags.forEach(html => {
            if (/\{\d+\}/.test(html)) { return; }

            if (simpleTags.includes(html)) {
                found_tags[html] = 1;
                return;
            }
            announce();
            usesHTML = true;
            if (!primary) {
                console.log("{%s}", html);
            }
        });

        var weirdCapitalization;
        s.replace(/cryptpad(\.fr|\.org)*/gi, function (brand) {
            if (['CryptPad', 'cryptpad.fr', 'cryptpad.org'].includes(brand)) { return; }
            weirdCapitalization = true;
        });

        var specialViolation = special(s);

        if (usesHTML || weirdCapitalization || specialViolation || !markupMatches) {
            finalErrorCount++;
            announce();
            console.log("`[%s]`\n", k);
            console.log("`%s`", s);

            if (!markupMatches) {
                console.log("\nMarkup does not match base translation");

                console.log("\n**Reference**: \n\n`%s`\n", EN[k]);
                //console.log('base', ref);
                //console.log('translation', tagCount);
                console.log('**diff**:\n\n```\n%s\n```', JSON.stringify(markupDiff, null, 2));

                console.log();
            }
            //if (mismatchedTags.length) { console.log(mismatchedTags); } // TODO
        }
    });
};

var langs = Fs.readdirSync("www/common/translations").filter(name => {
    return /messages\..+\.json$/.test(name);
}).map(name => {
    var code;
    name.replace(/messages\.(.+)\.json$/, (all, _code) => {
        code = _code;
    });
    return code;
});

processLang(EN, 'en', true);

langs.forEach(function (lang) {
    try {
        var map = require("../../www/common/translations/messages." + lang + ".json");
        if (!Object.keys(map).length) { return; }
        processLang(map, lang);
    } catch (err) {
        console.error(err);
    }
});

simpleTags.forEach(html => {
    if (found_tags[html]) { return; }
    console.log(`html exemption '${html}' is unnecessary.`);
});

if (finalErrorCount) {
    console.log(`\nTotal errors: ${finalErrorCount}`);
}
