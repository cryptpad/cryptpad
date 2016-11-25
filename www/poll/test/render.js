define([
    '/common/cryptpad-common.js',
    '/bower_components/hyperjson/hyperjson.js',
    '/bower_components/textpatcher/TextPatcher.js',
    '/bower_components/diff-dom/diffDOM.js',
], function (Cryptpad, Hyperjson, TextPatcher) {
    var DiffDOM = window.diffDOM;

    var Example = {
        info: {
            title: 'my title',
            description: 'my description',
        },
        table: {
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

    var getColumnValue = Render.getColumnValue = function (obj, colId) {
        return Cryptpad.find(obj, ['table', 'cols'].concat([colId]));
    };

    var getRowValue = Render.getRowValue = function (obj, rowId) {
        return Cryptpad.find(obj, ['table', 'rows'].concat([rowId]));
    };

    var getCellValue = Render.getCellValue = function (obj, cellId) {
        return Cryptpad.find(obj, ['table', 'cells'].concat([cellId]));
    };

    var setRowValue = Render.setRowValue = function (obj, rowId, value) {
        var parent = Cryptpad.find(obj, ['table', 'rows']);
        if (typeof(parent) === 'object') { return (parent[rowId] = value); }
        return null;
    };

    var setColumnValue = Render.setColumnValue = function (obj, colId, value) {
        var parent = Cryptpad.find(obj, ['table', 'cols']);
        if (typeof(parent) === 'object') { return (parent[colId] = value); }
        return null;
    };

    var setCellValue = Render.setCellValue = function (obj, cellId, value) {
        var parent = Cryptpad.find(obj, ['table', 'cells']);
        if (typeof(parent) === 'object') { return (parent[cellId] = value); }
        return null;
    };

    var createColumn = Render.createColumn = function (obj, cb, id, value) {
        var order = Cryptpad.find(obj, ['table', 'colsOrder']);
        if (!order) { throw new Error("Uninitialized realtime object!"); }
        id = id || coluid();
        value = value || "";
        setColumnValue(obj, id, value);
        order.push(id);
        if (typeof(cb) === 'function') { cb(void 0, id); }
    };

    var removeColumn = Render.removeColumn = function (obj, id, cb) {
        var order = Cryptpad.find(obj, ['table', 'colsOrder']);
        var parent = Cryptpad.find(obj, ['table', 'cols']);

        if (!(order && parent)) { throw new Error("Uninitialized realtime object!"); }

        var idx = order.indexOf(id);
        if (idx === -1) {
            return void console
                .error(new Error("Attempted to remove id which does not exist"));
        }

        order.splice(idx, 1);
        if (parent[id]) { delete parent[id]; }
        if (typeof(cb) === 'function') {
            cb();
        }
    };

    var createRow = Render.createRow = function (obj, cb, id, value) {
        console.error('new row!');
        var order = Cryptpad.find(obj, ['table', 'rowsOrder']);
        if (!order) { throw new Error("Uninitialized realtime object!"); }
        id = id || rowuid();
        value = value || "";
        setRowValue(obj, id, value);
        order.push(id);
        if (typeof(cb) === 'function') { cb(void 0, id); }
    };

    var removeRow = Render.removeRow = function (obj, id, cb) {
        var order = Cryptpad.find(obj, ['table', 'rowsOrder']);
        var parent = Cryptpad.find(obj, ['table', 'rows']);

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

    var setValue = Render.setValue = function (obj, id, value) {
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

    var getValue = Render.getValue = function (obj, id) {
        switch (typeofId(id)) {
            case 'row': return getRowValue(obj, id);
            case 'col': return getColumnValue(obj, id);
            case 'cell': return getCellValue(obj, id);
            case null: break;
            default: throw new Error("Unexpected type!");
        }
    };

    var getRowIds = Render.getRowIds = function (obj) {
        return Cryptpad.find(obj, ['table', 'rowsOrder']);
    };

    var getColIds = Render.getColIds = function (obj) {
        return Cryptpad.find(obj, ['table', 'colsOrder']);
    };

    var getCells = Render.getCells = function (obj) {
        return Cryptpad.find(obj, ['table', 'cells']);
    };

    /*  cellMatrix takes a proxy object, and optionally an alternate ordering
        of row/column keys (as an array).

        it returns an array of arrays containing the relevant data for each
        cell in table we wish to construct.
    */
    var cellMatrix = Render.cellMatrix = function (obj, rows, cols) {
        if (typeof(obj) !== 'object') {
            throw new Error('expected realtime-proxy object');
        }

        var cells = getCells(obj);
        rows = rows || getRowIds(obj);
        cols = cols || getColIds(obj);

        return [null].concat(rows).map(function (row, i) {
            if (i === 0) {
                return [null].concat(cols.map(function (col) {
                    return {
                        'data-rt-id': col,
                        type: 'text',
                        value: getColumnValue(obj, col) || "",
                    };
                }));
            }

            return [{
                'data-rt-id': row,
                value: getRowValue(obj, row),
                type: 'text',
            }].concat(cols.map(function (col) {
                var id = [col, rows[i-1]].join('_');
                var val = cells[id] || false;

                var result = {
                    'data-rt-id': id,
                    type: 'checkbox',
                    autocomplete: 'nope'
                };

                if (val) { result.checked = true; }
                return result;
            }));
        });
    };

    var makeRemoveElement = Render.makeRemoveElement = function (id) {
        return ['SPAN', {
            'data-rt-id': id,
            class: 'remove',
        }, ['✖']];
    };

    var makeHeadingCell = Render.makeHeadingCell = function (cell) {
        if (!cell) { return ['TD', {}, []]; }
        if (cell.type === 'text') {
            return ['TD', {}, [
                ['INPUT', cell, []],
                makeRemoveElement(cell['data-rt-id'])
            ]];
        }
        return ['TD', cell, []];
    };

    var clone = function (o) {
        return JSON.parse(JSON.stringify(o));
    };

    var makeCheckbox = Render.makeCheckbox = function (cell) {
        var attrs = clone(cell);

        // FIXME
        attrs.id = cell['data-rt-id'];

        var labelClass = 'cover';
        if (cell.checked) {
            labelClass += ' yes';
        }

        return ['TD', {class:"checkbox-cell"}, [
            ['DIV', {class: 'checkbox-contain'}, [
                ['INPUT', attrs, []],
                ['SPAN', {class: labelClass}, []],
                ['LABEL', {
                    for: attrs.id,
                    'data-rt-id': attrs.id,
                }, []]
            ]]
        ]];
    };

    var makeBodyCell = Render.makeBodyCell = function (cell) {
        if (cell.type === 'text') {
            return ['TD', {}, [
                    ['DIV', {class: 'text-cell'}, [
                        ['INPUT', cell, []],
                        makeRemoveElement(cell['data-rt-id'])
                    ]]
            ]];
        }

        if (cell.type === 'checkbox') {
            return makeCheckbox(cell);
        }
        return ['TD', cell, []];
    };

    var makeBodyRow = Render.makeBodyRow = function (row) {
        return ['TR', {}, row.map(makeBodyCell)];
    };

    var toHyperjson = Render.toHyperjson = function (matrix) {
        if (!matrix || !matrix.length) { return; }
        var head = ['THEAD', {}, [ ['TR', {}, matrix[0].map(makeHeadingCell)] ]];
        var body = ['TBODY', {}, matrix.slice(1).map(makeBodyRow)];
        return ['TABLE', {id:'table'}, [head, body]];
    };

    var asHTML = Render.asHTML = function (obj) {
        return Hyperjson.toDOM(toHyperjson(cellMatrix(obj)));
    };

    var diffIsInput = Render.diffIsInput = function (info) {
        var nodeName = Cryptpad.find(info, ['node', 'nodeName']);
        if (nodeName !== 'INPUT') { return; }
        return true;
    };

    var getInputType = Render.getInputType = function (info) {
        return Cryptpad.find(info, ['node', 'type']);
    };

    var preserveCursor = Render.preserveCursor = function (info) {
        if (['modifyValue', 'modifyAttribute'].indexOf(info.diff.action) !== -1) {
            var element = info.node;

            if (typeof(element.selectionStart) !== 'number') { return; }

            var o = info.oldValue || '';
            var n = info.newValue || '';
            var op = TextPatcher.diff(o, n);

            info.selection = ['selectionStart', 'selectionEnd'].map(function (attr) {
                var before = element[attr];
                var after = TextPatcher.transformCursor(element[attr], op);
                return after;
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
            //console.log(info.node);
            //console.error(err);
        }
    };

    var diffOptions = {
        preDiffApply: function (info) {
            if (!diffIsInput(info)) { return; }
            switch (getInputType(info)) {
                case 'checkbox':
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

    var updateTable = Render.updateTable = function (table, obj, conf) {
        var DD = new DiffDOM(diffOptions);

        var matrix = cellMatrix(obj);

        var hj = toHyperjson(matrix);

        if (!hj) { throw new Error("Expected Hyperjson!"); }

        var table2 = Hyperjson.toDOM(hj);
        var patch = DD.diff(table, table2);
        DD.apply(table, patch);
    };

    return Render;
});
