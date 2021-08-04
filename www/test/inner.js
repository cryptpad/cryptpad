define([
    '/common/hyperscript.js',
    '/common/common-charts.js',
    '/common/common-util.js',
], function (h, Charts, Util) {
    var wrap = function (content) {
        return h('div', {
            style: 'height: 500px; width: 500px; padding: 15px; border: 1px solid #222; margin: 15px;'
        }, content);
    };

    var append = function (el) {
        document.body.appendChild(el);
    };

    var data = [
        25, 58, 0, 96, 79,
        23, 75, 13, 44, 29,
        65, 80, 30, 47, 22,
        7, 62, 64, 46, 21,
        29, 31, 76, 65, 61,
        78, 58, 12, 90, 98,
        37, 75, 92, 74, 16,
        0, 52, 42, 71, 19
    ];

    append(wrap(Charts.columns([ 40, 60, 75, 90, 100])));
    append(wrap(Charts.columns(data.slice(20))));
});
