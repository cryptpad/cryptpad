define([
    'jquery',
    '/bower_components/hyperjson/hyperjson.js',
    '/common/text-cursor.js',
    '/bower_components/chainpad/chainpad.dist.js',
    '/common/common-util.js',
    '/customize/messages.js',

    '/bower_components/diff-dom/diffDOM.js'
], function ($, Hyperjson, TextCursor, ChainPad, Util, Messages) {
    var DiffDOM = window.diffDOM;

    var Example = {
        metadata: {
            title: '',
            userData: {}
        },
        description: '',
        comments: {},
        content: {
/*  TODO

deprecate the practice of storing cells, cols, and rows separately.

Instead, keep everything in one map, and iterate over columns and rows
by maintaining indexes in rowsOrder and colsOrder

*/
            cells: {},
            cols: {},
            colsOrder: [],
            rows: {},
            rowsOrder: []
        }
    };

var Renderer = function (APP) {

    var Render = {
        Example: Example
    };

    var Uid = Render.Uid = function (prefix, f) {
        f = f || function () {
            return Number(Math.random() * Number.MAX_SAFE_INTEGER)
                .toString(32).replace(/\./g, '');
        };
        return function () { return prefix + '-' + f(); };
    };

    var coluid = Render.coluid = Uid('x');
    var rowuid = Render.rowuid = Uid('y');

    var isRow = Render.isRow = function (id) { return /^y\-[^_]*$/.test(id); };
    var isColumn = Render.isColumn = function (id) { return /^x\-[^_]*$/.test(id); };
    var isCell = Render.isCell = function (id) { return /^x\-[^_]*_y\-.*$/.test(id); };

    var typeofId = Render.typeofId = function (id) {
        if (isRow(id)) { return 'row'; }
        if (isColumn(id)) { return 'col'; }
        if (isCell(id)) { return 'cell'; }
        return null;
    };

    Render.getCoordinates = function (id) {
        return id.split('_');
    };

    var getColumnValue = Render.getColumnValue = function (obj, colId) {
        return Util.find(obj, ['content', 'cols'].concat([colId]));
    };

    var getRowValue = Render.getRowValue = function (obj, rowId) {
        return Util.find(obj, ['content', 'rows'].concat([rowId]));
    };

    var getCellValue = Render.getCellValue = function (obj, cellId) {
        var value = Util.find(obj, ['content', 'cells'].concat([cellId]));
        if (typeof value === 'boolean') {
            return (value === true ? 1 : 0);
        } else {
            return value;
        }
    };

    var setRowValue = Render.setRowValue = function (obj, rowId, value) {
        var parent = Util.find(obj, ['content', 'rows']);
        if (typeof(parent) === 'object') { return (parent[rowId] = value); }
        return null;
    };

    var setColumnValue = Render.setColumnValue = function (obj, colId, value) {
        var parent = Util.find(obj, ['content', 'cols']);
        if (typeof(parent) === 'object') { return (parent[colId] = value); }
        return null;
    };

    var setCellValue = Render.setCellValue = function (obj, cellId, value) {
        var parent = Util.find(obj, ['content', 'cells']);
        if (typeof(parent) === 'object') { return (parent[cellId] = value); }
        return null;
    };

    Render.createColumn = function (obj, cb, id, value) {
        var order = Util.find(obj, ['content', 'colsOrder']);
        if (!order) { throw new Error("Uninitialized realtime object!"); }
        id = id || coluid();
        value = value || "";
        setColumnValue(obj, id, value);
        order.push(id);
        if (typeof(cb) === 'function') { cb(void 0, id); }
    };

    Render.removeColumn = function (obj, id, cb) {
        var order = Util.find(obj, ['content', 'colsOrder']);
        var parent = Util.find(obj, ['content', 'cols']);

        if (!(order && parent)) { throw new Error("Uninitialized realtime object!"); }

        var idx = order.indexOf(id);
        if (idx === -1) {
            return void console
                .error(new Error("Attempted to remove id which does not exist"));
        }

        Object.keys(obj.content.cells).forEach(function (key) {
            if (key.indexOf(id) === 0) {
                delete obj.content.cells[key];
            }
        });

        order.splice(idx, 1);
        if (parent[id]) { delete parent[id]; }
        if (typeof(cb) === 'function') {
            cb();
        }
    };

    Render.createRow = function (obj, cb, id, value) {
        var order = Util.find(obj, ['content', 'rowsOrder']);
        if (!order) { throw new Error("Uninitialized realtime object!"); }
        id = id || rowuid();
        value = value || "";
        setRowValue(obj, id, value);
        order.push(id);
        if (typeof(cb) === 'function') { cb(void 0, id); }
    };

    Render.removeRow = function (obj, id, cb) {
        var order = Util.find(obj, ['content', 'rowsOrder']);
        var parent = Util.find(obj, ['content', 'rows']);

        if (!(order && parent)) { throw new Error("Uninitialized realtime object!"); }

        var idx = order.indexOf(id);
        if (idx === -1) {
            return void console
                .error(new Error("Attempted to remove id which does not exist"));
        }

        order.splice(idx, 1);
        if (parent[id]) { delete parent[id]; }
        if (typeof(cb) === 'function') { cb(); }
    };

    Render.setValue = function (obj, id, value) {
        var type = typeofId(id);

        switch (type) {
            case 'row': return setRowValue(obj, id, value);
            case 'col': return setColumnValue(obj, id, value);
            case 'cell': return setCellValue(obj, id, value);
            case null: break;
            default:
                console.log("[%s] has type [%s]", id, type);
            throw new Error("Unexpected type!");
        }
    };

    Render.getValue = function (obj, id) {
        switch (typeofId(id)) {
            case 'row': return getRowValue(obj, id);
            case 'col': return getColumnValue(obj, id);
            case 'cell': return getCellValue(obj, id);
            case null: break;
            default: throw new Error("Unexpected type!");
        }
    };

    var getRowIds = Render.getRowIds = function (obj) {
        return Util.find(obj, ['content', 'rowsOrder']);
    };

    var getColIds = Render.getColIds = function (obj) {
        return Util.find(obj, ['content', 'colsOrder']);
    };

    var getCells = Render.getCells = function (obj) {
        return Util.find(obj, ['content', 'cells']);
    };

    /*  cellMatrix takes a proxy object, and optionally an alternate ordering
        of row/column keys (as an array).

        it returns an array of arrays containing the relevant data for each
        cell in table we wish to construct.
    */
    var cellMatrix = Render.cellMatrix = function (obj, rows, cols, readOnly) {
        if (typeof(obj) !== 'object') {
            throw new Error('expected realtime-proxy object');
        }

        var cells = getCells(obj);
        rows = rows || getRowIds(obj);
        rows.push('');
        cols = cols || getColIds(obj);

        return [null].concat(rows).map(function (row, i) {
            if (i === 0) {
                return [null].concat(cols.map(function (col) {
                    var result = {
                        'data-rt-id': col,
                        type: 'text',
                        value: getColumnValue(obj, col) || "",
                        title: getColumnValue(obj, col) || Messages.anonymous,
                        placeholder: Messages.anonymous,
                        disabled: 'disabled'
                    };
                    return result;
                })).concat([{
                    content: Messages.poll_total
                }]);
            }
            if (i === rows.length) {
                return [null].concat(cols.map(function () {
                    return {
                        'class': 'cp-app-poll-table-lastrow',
                    };
                }));
            }

            return [{
                'data-rt-id': row,
                value: getRowValue(obj, row) || '',
                title: getRowValue(obj, row) || Messages.poll_optionPlaceholder,
                type: 'text',
                placeholder: Messages.poll_optionPlaceholder,
                disabled: 'disabled',
            }].concat(cols.map(function (col) {
                var id = [col, rows[i-1]].join('_');
                var val = cells[id];
                var result = {
                    'data-rt-id': id,
                    type: 'number',
                    autocomplete: 'nope',
                    value: '3',
                };
                if (readOnly) {
                    result.disabled = "disabled";
                }
                if (typeof val !== 'undefined') {
                    if (typeof val === 'boolean') { val = (val ? '1' : '0'); }
                    result.value = val;
                }
                return result;
            })).concat([{
                'data-rt-count-id': row
            }]);
        });
    };

    var makeRemoveElement = Render.makeRemoveElement = function (id) {
        return ['SPAN', {
            'data-rt-id': id,
            'title': Messages.poll_remove,
            class: 'cp-app-poll-table-remove',
        }, ['✖']];
    };

    var makeEditElement = Render.makeEditElement = function (id) {
        return ['SPAN', {
            'data-rt-id': id,
            'title': Messages.poll_edit,
            class: 'cp-app-poll-table-edit',
        }, ['✐']];
    };

    var makeLockElement = Render.makeLockElement = function (id) {
        return ['SPAN', {
            'data-rt-id': id,
            'title': Messages.poll_locked,
            class: 'cp-app-poll-table-lock fa fa-lock',
        }, []];
    };

    var makeBookmarkElement = Render.makeBookmarkElement = function (id) {
        return ['SPAN', {
            'data-rt-id': id,
            'title': Messages.poll_bookmark_col,
            'style': 'visibility: hidden;',
            class: 'cp-app-poll-table-bookmark fa fa-thumb-tack',
        }, []];
    };

    var makeHeadingCell = Render.makeHeadingCell = function (cell, readOnly) {
        if (!cell) { return ['TD', {}, []]; }
        if (cell.type === 'text') {
            var elements = [['INPUT', cell, []]];
            if (!readOnly) {
                var buttons = [];
                buttons.unshift(makeRemoveElement(cell['data-rt-id']));
                buttons.unshift(makeLockElement(cell['data-rt-id']));
                buttons.unshift(makeBookmarkElement(cell['data-rt-id']));
                elements.unshift(['DIV', {'class': 'cp-app-poll-table-buttons'}, buttons]);
            }
            return ['TD', {}, elements];
        }
        return ['TD', cell, [cell.content]];
    };

    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    var makeCheckbox = Render.makeCheckbox = function (cell) {
        var attrs = clone(cell);

        // FIXME
        attrs.id = cell['data-rt-id'];

        var labelClass = 'cp-app-poll-table-cover';

        // TODO implement Yes/No/Maybe/Undecided
        return ['TD', {class:"cp-app-poll-table-checkbox-cell"}, [
            ['DIV', {class: 'cp-app-poll-table-checkbox-contain'}, [
                ['INPUT', attrs, []],
                ['SPAN', {class: labelClass}, []],
                ['LABEL', {
                    for: attrs.id,
                    'data-rt-id': attrs.id,
                }, []]
            ]]
        ]];
    };

    var makeBodyCell = Render.makeBodyCell = function (cell, readOnly) {
        if (cell && cell.type === 'text') {
            var elements = [['INPUT', cell, []]];
            if (!readOnly) {
                elements.push(makeRemoveElement(cell['data-rt-id']));
                elements.push(makeEditElement(cell['data-rt-id']));
            }
            return ['TD', {}, [
                    ['DIV', {class: 'cp-app-poll-table-text-cell'}, elements]
            ]];
        }

        if (cell && cell.type === 'number') {
            return makeCheckbox(cell);
        }
        return ['TD', cell, []];
    };

    var makeBodyRow = Render.makeBodyRow = function (row, readOnly) {
        return ['TR', {}, row.map(function (cell) {
            return makeBodyCell(cell, readOnly);
        })];
    };

    var toHyperjson = Render.toHyperjson = function (matrix, readOnly) {
        if (!matrix || !matrix.length) { return; }
        var head = ['THEAD', {}, [ ['TR', {}, matrix[0].map(function (cell) {
            return makeHeadingCell(cell, readOnly);
        })] ]];
        var foot = ['TFOOT', {}, matrix.slice(-1).map(function (row) {
            return makeBodyRow(row, readOnly);
        })];
        var body = ['TBODY', {}, matrix.slice(1, -1).map(function (row) {
            return makeBodyRow(row, readOnly);
        })];
        return ['TABLE', {id:'cp-app-poll-table'}, [head, foot, body]];
    };

    Render.asHTML = function (obj, rows, cols, readOnly) {
        return Hyperjson.toDOM(toHyperjson(cellMatrix(obj, rows, cols, readOnly), readOnly));
    };

    var diffIsInput = Render.diffIsInput = function (info) {
        var nodeName = Util.find(info, ['node', 'nodeName']);
        if (nodeName !== 'INPUT') { return; }
        return true;
    };

    var getInputType = Render.getInputType = function (info) {
        return Util.find(info, ['node', 'type']);
    };

    var preserveCursor = Render.preserveCursor = function (info) {
        if (['modifyValue', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
            var element = info.node;

            if (typeof(element.selectionStart) !== 'number') { return; }

            var o = info.oldValue || '';
            var n = info.newValue || '';
            var ops = ChainPad.Diff.diff(o, n);

            info.selection = ['selectionStart', 'selectionEnd'].map(function (attr) {
                return TextCursor.transformCursor(element[attr], ops);
            });
        }
    };

    var recoverCursor = Render.recoverCursor = function (info) {
        try {
            if (info.selection && info.node) {
                info.node.selectionStart = info.selection[0];
                info.node.selectionEnd = info.selection[1];
            }
        } catch (err) {
            // FIXME LOL empty try-catch?
            //console.log(info.node);
            //console.error(err);
        }
    };

    var diffOptions = {
        preDiffApply: function (info) {
            if (!diffIsInput(info)) { return; }
            if (info.diff.action === "removeAttribute" &&
                (info.diff.name === "aria-describedby" || info.diff.name === "data-original-title")) {
                return;
            }
            switch (getInputType(info)) {
                case 'number':
                    //console.log('checkbox');
                    //console.log("[preDiffApply]", info);
                    break;
                case 'text':
                    preserveCursor(info);
                    break;
                default: break;
            }
        },
        postDiffApply: function (info) {
            if (info.selection) { recoverCursor(info); }
            /*
            if (!diffIsInput(info)) { return; }
            switch (getInputType(info)) {
                case 'checkbox':
                    console.log("[postDiffApply]", info);
                    break;
                case 'text': break;
                default: break;
            }*/
        }
    };

    var styleUserColumn = function (table) {
        var userid = APP.userid;
        if (!userid) { return; }


        // Enable input for the userid column
        APP.enableColumn(userid, table);
        $(table).find('input[disabled="disabled"][data-rt-id^="' + userid + '"]')
            .attr('placeholder', Messages.poll_userPlaceholder);
        $(table).find('.cp-app-poll-table-lock[data-rt-id="' + userid + '"]').remove();
        $(table).find('[data-rt-id^="' + userid + '"]').closest('td')
            .addClass("cp-app-poll-table-own");
        $(table).find('.cp-app-poll-table-bookmark[data-rt-id="' + userid + '"]')
            .css('visibility', '')
            .addClass('cp-app-poll-table-bookmark-full')
            .attr('title', Messages.poll_bookmarked_col);
    };
    var styleUncommittedColumn = function (table) {
        APP.uncommitted.content.colsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            APP.enableColumn(id, table);
            $(table).find('.cp-app-poll-table-lock[data-rt-id="' + id + '"]').remove();
            $(table).find('.cp-app-poll-table-remove[data-rt-id="' + id + '"]').remove();
            $(table).find('.cp-app-poll-table-bookmark[data-rt-id="' + id + '"]').remove();

            $(table).find('td.cp-app-poll-table-uncommitted .cover')
                .addClass("cp-app-poll-table-uncommitted");
            var $uncommittedCol = $(table).find('[data-rt-id^="' + id + '"]').closest('td');
            $uncommittedCol.addClass("cp-app-poll-table-uncommitted");
        });
        APP.uncommitted.content.rowsOrder.forEach(function(id) {
            // Enable the checkboxes for the uncommitted column
            APP.enableRow(id, table);
            $(table).find('.cp-app-poll-table-edit[data-rt-id="' + id + '"]').remove();
            $(table).find('.cp-app-poll-table-remove[data-rt-id="' + id + '"]').remove();

            $(table).find('[data-rt-id="' + id + '"]').closest('tr')
                .addClass("cp-app-poll-table-uncommitted");
        });
    };
    var unlockElements = function (table) {
        APP.unlocked.row.forEach(function (id) { APP.enableRow(id, table); });
        APP.unlocked.col.forEach(function (id) { APP.enableColumn(id, table); });
    };
    var updateTableButtons = function (table) {
        var uncomColId = APP.uncommitted.content.colsOrder[0];
        var uncomRowId = APP.uncommitted.content.rowsOrder[0];
        var $createOption = $(table).find('tbody input[data-rt-id="' + uncomRowId+'"]')
                                .closest('td').find('> div');
        $createOption.append(APP.$createRow);
        var $createUser = $(table).find('thead input[data-rt-id="' + uncomColId + '"]')
                                .closest('td');
        $createUser.prepend(APP.$createCol);

        if (APP.proxy.content.colsOrder.indexOf(APP.userid) === -1) {
            $(table).find('.cp-app-poll-table-bookmark').css('visibility', '');
        }
    };
    var addCount = function (table) {
        var $tr = $(table).find('tbody tr').first();
        var winner = {
            v: 0,
            ids: []
        };
        APP.count = {};
        APP.proxy.content.rowsOrder.forEach(function (rId) {
            var count = Object.keys(APP.proxy.content.cells)
                .filter(function (k) {
                    return k.indexOf(rId) !== -1 && APP.proxy.content.cells[k] === 1;
                }).length;
            if (count > winner.v) {
                winner.v = count;
                winner.ids = [rId];
            } else if (count && count === winner.v) {
                winner.ids.push(rId);
            }
            APP.count[rId] = count;
            var h = $tr.height() || 28;
            $(table).find('[data-rt-count-id="' + rId + '"]')
                .text(count)
                .css({
                    'height': h+'px',
                    'line-height': h+'px'
                });
        });
        winner.ids.forEach(function (rId) {
            $(table).find('[data-rt-id="' + rId + '"]').closest('td')
                .addClass('cp-app-poll-table-winner');
            $(table).find('[data-rt-count-id="' + rId + '"]')
                .addClass('cp-app-poll-table-winner');
        });
    };

    var styleTable = function (table) {
        styleUserColumn(table);
        styleUncommittedColumn(table);
        unlockElements(table);
        updateTableButtons(table);
        addCount(table);
    };

    Render.updateTable = function (table, obj, conf) {
        var DD = new DiffDOM(diffOptions);

        var rows = conf ? conf.rows : null;
        var cols = conf ? conf.cols : null;
        var readOnly = conf ? conf.readOnly : false;
        var matrix = cellMatrix(obj, rows, cols, readOnly);

        var hj = toHyperjson(matrix, readOnly);

        if (!hj) { throw new Error("Expected Hyperjson!"); }

        var table2 = Hyperjson.toDOM(hj);

        styleTable(table2);

        var patch = DD.diff(table, table2);
        DD.apply(table, patch);
    };

    return Render;
};

    return Renderer;
});
