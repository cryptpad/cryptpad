// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

var Messages = require("../../www/common/translations/messages.json");
var Exec = require("child_process").exec;

var ignoreLines = function (source, pattern) {
    if (!pattern.test(source)) { return source; }
    return source.split('\n')
        .map(function (line) {
            if (pattern.test(line)) { return ''; }
            return line;
        })
        .filter(Boolean)
        .join("\n");
};

var GENERATED_PATTERNS = [
   /(team|admin|settings|support)_.*(Hint|Title|Button|Label)/,
   /settings_colortheme/,
   /loading_(state|drive|pad)_/,
   /(admin|notifications|support|team|settings)_cat_/,
   /features_f/,
];
var isPossiblyGenerated = function (key) {
    return GENERATED_PATTERNS.some(function (patt) {
        return patt.test(key);
    });
};

var grep = function (pattern, cb) {
    var exclude = [
        'www/common/translations/*',
        'www/common/onlyoffice/dist/*',
        'www/lib/*',
        'www/common/pdfjs/*',
        '*.css',
        'www/common/highlight/*',
        '*.min.js',
        '.lesshintrc',
        'CHANGELOG.md',
        'LICENSE',
        'package*.json',
        'www/debug/chainpad.dist.js',
        'www/pad/mathjax/*',
        'www/common/hyperscript.js',
        'www/common/jscolor.js',
        './/scripts/*',
        './lib/*',
        './docs/*',
        './github/*',
        '*.svg',
        '*.md',
        './config/*',
        'www/oldadmin/*', // XXX
    ].map(function (patt) {
        return "':(exclude)" + patt + "'";
    }).join(' ');

    // grep this repository, ignoring binary files and excluding anything matching the above patterns
    //var ignoreBinaries= '--binary-files=without-match ';
    var command = 'git grep ' + pattern + " -- ':/' " + exclude;

    Exec(command, function (err, stdout /*, stderr */) {
        if (err && err.code === 1 && err.killed === false) {
            if (isPossiblyGenerated(pattern)) {
                return cb(void 0, true, 'POSSIBLY_GENERATED');
            }
            return cb(void 0, true, "NOT_FOUND", stdout);
        }
        stdout = ignoreLines(stdout, /Binary file/);

        if (err) {
            if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
                return cb(void 0, true, 'TOO_MUCH', stdout);
            }
            return void cb(err);
        }
        if (/data\-localization/.test(stdout)) {
            return cb(void 0, false);
            //return cb(void 0, true, "DATA_LOCALIZATION", stdout);
        }
        if (/(Messages|Msg|messages)\./.test(stdout) || /(footLink|footerCol)/.test(stdout)) {
            return cb(void 0, false);
        }

        //console.log(pattern, arguments);
        cb(void 0, true, 'OTHER', stdout);
    });
};

var keys = Object.keys(Messages).sort();
var total = keys.length;

var limit = total;

var lineCount = function (s) {
    var i = 0;
    s.replace(/\n/g, function () { i++; return ''; });
    return i;
};

var conditionallyPrintContent = function (output) {
    if (!output) { return; }
    if (lineCount(output) < 12) {
        output.split('\n').map(function (line) {
            if (!line) { return; }
            console.log('\t> ' + line);
        });
        //console.log(output);
        console.log();
    } else {
        console.log("\t> too much content to print");
    }
};

var exceptions = `
ui_more
ui_collapse
ui_expand
ui_jsRequired

`.split(/\s+/).filter(Boolean);

var next = function () {
    var key = keys[0];
    if (!key) { return; }
    keys.shift();

    if (/^og_/.test(key) || exceptions.includes(key)) {
        return void next();
    }

    if (!limit) { return void console.log("[DONE]"); }
    limit--;

    grep(key, function (err, flagged, reason, output) {
        if (err) {
            console.error("[%s]", key, err);
            console.log();
            return;
        } else if (!flagged) {

        } else if (reason === 'OTHER') {
            console.log('[%s] flagged for [OTHER]', key);
            conditionallyPrintContent(output);
        } else {
            console.log("[%s] flagged for [%s]", key, reason || '???');
            conditionallyPrintContent(output);
        }

        next();
    });
};

next();
