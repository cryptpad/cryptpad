var Messages = require("../www/common/translations/messages.json");
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

var grep = function (pattern, cb) {
    var command = 'git grep ' + pattern + " -- ':/' ':(exclude)www/common/translations/*'";
    Exec(command, function (err, stdout, stderr) {
        if (err && err.code === 1 && err.killed === false) {
            return cb(void 0, true, "NOT_FOUND");
        }
        stdout = ignoreLines(stdout, /^CHANGELOG\.md:/);
        stdout = ignoreLines(stdout, /^LICENSE:/);
        stdout = ignoreLines(stdout, /\/onlyoffice/);
        stdout = ignoreLines(stdout, /package.*\.json/);
        stdout = ignoreLines(stdout, /package\.json/);
        stdout = ignoreLines(stdout, /chainpad\.dist\.js/);
        stdout = ignoreLines(stdout, /MathJax\.js/);
        stdout = ignoreLines(stdout, /Binary file/);
        //stdout = stdout .replace(/^CHANGELOG\.md:.*$/g, '') .replace(/^LICENSE:.*$/g, '');

        if (err) {
            if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
                return cb(void 0, true, 'TOO_MUCH');
            }
            return void cb(err);
        }
        if (/data\-localization/.test(stdout)) {
            return cb(void 0, true, "DATA_LOCALIZATION");
        }
        if (/(Messages|Msg|messages)\./.test(stdout)) {
            return cb(void 0, false);
        }
        if (/_cat_/.test(stdout)) {
            return cb(void 0, true, 'POSSIBLE_CATEGORY');
        }

        //console.log(pattern, arguments);
        cb(void 0, true, 'OTHER', stdout);
    });
};

var keys = Object.keys(Messages);
var total = keys.length;

var limit = total;

var next = function () {
    var key = keys[0];
    if (!key) { return void console.log("[DONE]"); }
    keys.shift();

    if (!limit--) { return void console.log("[DONE]"); }

    grep(key, function (err, flagged, reason, output) {
        if (err) {
            return;
            console.error("[%s]", key, err);
            console.log();
        } else if (!flagged) {

        } else if (reason === 'OTHER') {
            console.log('[%s] flagged for [OTHER]', key, output);
            console.log();
        } else {
            console.log("[%s] flagged for [%s]", key, reason || '???');
        }

        next();
    });
};

next();
