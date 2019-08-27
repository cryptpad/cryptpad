// This file is used when a user tries to export the entire CryptDrive.
// Pads from the code app will be exported using this format instead of plain text.
define([
    '/customize/messages.js',
], function (Messages) {
    var module = {
        ext: '.csv'
    };

    var copyObject = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    module.getCSV = function (content) {
        var data = copyObject(content);
        var res = '';

        var count = {};
        data.rowsOrder.forEach(function (rId) {
            var c = Object.keys(data.cells)
                .filter(function (k) {
                    return k.indexOf(rId) !== -1 && data.cells[k] === 1;
                }).length;
            count[rId] = c;
        });

        var escapeStr = function (str) {
            return '"' + str.replace(/"/g, '""') + '"';
        };

        [null].concat(data.rowsOrder).forEach(function (rowId, i) {
            [null].concat(data.colsOrder).forEach(function (colId, j) {
                // thead
                if (i === 0) {
                    if (j === 0) { res += ','; return; }
                    if (!colId) { throw new Error("Invalid data"); }
                    res += escapeStr(data.cols[colId] || Messages.anonymous) + ',';
                    return;
                }
                // tbody
                if (!rowId) { throw new Error("Invalid data"); }
                if (j === 0) {
                    res += escapeStr(data.rows[rowId] || Messages.poll_optionPlaceholder) + ',';
                    return;
                }
                if (!colId) { throw new Error("Invalid data"); }
                res += (data.cells[colId + '_' + rowId] || 3) + ',';
            });
            // last column: total
            // thead
            if (i === 0) {
                res += escapeStr(Messages.poll_total) + '\n';
                return;
            }
            // tbody
            if (!rowId) { throw new Error("Invalid data"); }
            res += count[rowId] || '?';
            res += '\n';
        });

        return res;
    };
    module.main = function (userDoc, cb) {
        var content = userDoc.content || userDoc.table;
        var csv;
        try {
            csv = module.getCSV(content);
        } catch (e) {
            console.error(e);
            var blob2 = new Blob([JSON.stringify(content, 0, 2)], {
                type: 'application/json',
            });
            return void cb(blob2, true);
        }
        var blob = new Blob([csv], {type: "application/csv;charset=utf-8"});
        cb(blob);
    };

    return module;
});

