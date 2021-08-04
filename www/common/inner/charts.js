define([
    '/common/hyperscript.js',

], function (h) {
    var Charts = {};

    Charts.columns = function (rows) {
        return h('table.charts-css.column.show-heading', [
            //h('caption', "Front-End Developer Salary"),
            h('tbody', rows.map(function (n) {
                return h('tr', h('td', {
                    style: '--size: ' + (n / 100),
                }, n));
            })),
        ]);
    };

    // table.charts-css.bar.reverse
    // Charts.bars




    return Charts;
});
