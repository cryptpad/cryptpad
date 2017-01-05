define([
    'table.js',
    '/bower_components/jquery/dist/jquery.min.js',
], function (Table) {
    var $ = window.jQuery;
    var W = {};

    var xy = function (x, y) {
        return x + '_' + y;
    };

    var Checkbox = W.Checkbox = function (id) {
        return $('<input>', {
            id: id,
            type: 'checkbox',
            checked: true,
        });
    };

    console.log("Creating wizard");

    var $modal = W.$modal = $('#wizard-modal');
    var $table = $modal.find('table');
    console.log("wizard table ->", $table[0]);
    var table = W.table = Table($table, xy);

    W.cleanup = function () {
        $table.find('tbody tr').remove();
        $table.find('thead th').remove();
        //table.rows.forEach(table.removeRow);
        //table.cols.forEach(table.removeColumn);
    };

    W.show = function () {
        $modal.addClass('shown');
        W.isShown = true;
    };

    W.hide = function () {
        $modal.removeClass('shown');
        W.isShown = false;
    };

    $(window).on('keyup', function (e) {
        if (!W.isShown) { return; }
        if (e.which !== 27) { return; }
        W.hide();
    });

    var $closeme = W.$closeme = ($('#close-wizard').click(function () {
        W.hide();
    }));

    var Input = function (opt) { return $('<input>', opt); };

    W.width = 0;
    W.height = 0;

    W.times = [];
    W.dates = [];

    var coluid = function () {
        return 'x-' + W.width++;
    };

    var rowuid = function () {
        return 'y-' + W.height++;
    };

    var makeTime = function (id) {
        var $time = Input({
            id: id,
            type: 'text',
            placeholder: 'your time',
        }).on('keyup', function () {
            // do something
        });

        // add row

        table.addRow($time, Checkbox, id);

        return $time;
    };

    var makeDate = function (id) {
        var $date = Input({
            id: id,
            type: 'text',
            placeholder: 'your date',
        }).on('keyup', function () {
            // do something
        });

        // add column
        table.addColumn($date, Checkbox, id);

        return $date;
    };

    var $addtime = $('#addtime').click(function () {
        if (!W.isShown) { return; }
        var id = rowuid();

        var $time = makeTime(id).focus();

        W.times.push(id);
    });

    var $addDate = $('#adddate').click(function () {
        if (!W.isShown) { return; }

        var id = coluid();
        var $date = makeDate(id).focus();

        W.dates.push(id);
    });

    var fix1 = function (f,a) { return function (b) { return f(a,b); }; };
    var carte = function (f,A,B){ return A.map(function(a){ return B.map(fix1(f,a)); }); };
    var flatten = function (A) {
        return A.reduce(function (a, b) {
            return a.concat(b);
        }, []);
    };

    var computeSlots = W.computeSlots = function (f) {
        f = f || function (a, b) { return a + ', ' + b; };
        return flatten(carte(function (date, time) {
            var $check = $table.find('#' + date + '_' + time);
            var checked = $check[0].checked;

            if (!$check[0].checked) { return; }

            var dateValue = $table.find('#' + date).val();
            var timeValue = $table.find('#' + time).val();

            return f(dateValue, timeValue);
        }, W.dates, W.times)).filter(function (x) { return x; });
    };

    var $toolbar = $('#modal-toolbar');

    var $getOptions = W.$getOptions = $('#get-options');
    var $clearTable = W.$clearTable = ($('#clear-table').click(function () {
        W.cleanup();
    }));

    return W;
});
