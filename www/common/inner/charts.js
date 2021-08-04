define([
    '/common/hyperscript.js',

], function (h) {
    var Charts = {};

    Charts.table = function (content, classes) {
        var classString = Array.isArray(classes)? '.' + classes.join('.'): '';
        return h('table' + classString, content);
    };

    Charts.columns = function (rows) {
        return Charts.table([
            //h('caption', "Front-End Developer Salary"),
            h('tbody', rows.map(function (n) {
                return h('tr', h('td', {
                    style: '--size: ' + (n / 100),
                }, n));
            })),
        ], [
            'charts-css',
            'column',
            'show-heading',
        ]);
    };

    // table.charts-css.bar.reverse
    // Charts.bars




    return Charts;
});
