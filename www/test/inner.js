define([
    '/common/hyperscript.js',
    '/common/inner/charts.js',
], function (h, Charts) {
    var wrap = function (content) {
        return h('div', {
            style: 'height: 500px; width: 500px; padding: 15px; border: 1px solid #222; margin: 15px;'
        }, content);
    };

    var append = function (el) {
        document.body.appendChild(el);
    };

    var data = [
        25, 58, 5, 96, 79,
        23, 75, 13, 44, 29,
        65, 80, 30, 47, 22,
        7, 62, 64, 46, 21,
        29, 31, 76, 65, 61,
        78, 58, 12, 90, 98,
        37, 75, 92, 74, 16,
        17, 52, 42, 71, 19
    ];


    append(h('h1', 'Charts'));
    append(h('hr'));

    var cell = (function () {
        var i = 0;

        return function () {
            var val = data[i++];
            return h('td', {
                style: '--size: ' + (val / 100),
            }, val);
        };
    }());

    var multirow = function (n) {
        var cells = [];
        while (n--) {
            cells.push(cell());
        }
        return h('tr', {
            style: 'margin: 15px',
        }, cells);
    };

    append(wrap(Charts.table([
        h('tbody', [
            multirow(4),
            multirow(4),
            multirow(4),
            multirow(4),
        ]),
    ], [
        'charts-css',
        'bar',
        'multiple',
    ])));


    append(h('hr'));
    append(wrap(Charts.columns([ 40, 60, 75, 90, 100])));
    append(wrap(Charts.columns(data.slice(20))));
});
