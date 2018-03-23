define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/pages.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, h, Pages) {
$(function () {
    var $body = $('body');

    var infoPage = function () {
        return h('div#mainBlock.hidden', typeof(Pages[location.pathname]) === 'function'?
            Pages[location.pathname](): [h('div#container')]);
    };

    var $main = $(infoPage());

    var pathname = location.pathname;

    // add class on info-pages
    var css = location.pathname.replace(/(index)?\.html$/gi, "") // .html
        .replace(/[^a-zA-Z]+/gi, '-') // any non-alpha character
        .replace(/^-|-$/g, ''); // starting/trailing dashes
    if (css === '') { css = 'index'; }
    $('body').addClass('cp-page-' + css);

    window.Tether = function () {};
    require([
        'less!/customize/src/less2/main.less',
        'css!/bower_components/bootstrap/dist/css/bootstrap.min.css'
    ], function () {
        $body.append($main);

        if (/^\/user\//.test(pathname)) {
            require([ '/user/main.js'], function () {});
        } else if (/^\/register\//.test(pathname)) {
            require([ '/register/main.js' ], function () {});
        } else if (/^\/login\//.test(pathname)) {
            require([ '/login/main.js' ], function () {});
        } else if (/^\/($|^\/index\.html$)/.test(pathname)) {
            // TODO use different top bar
            require([ '/customize/main.js', ], function () {});
        } else if (/invite/.test(pathname)) {
            require([ '/invite/main.js'], function () {});
        } else if (/faq/.test(pathname)) {
            window.location.hash = window.location.hash;
        } else {
            require([ '/customize/main.js', ], function () {});
        }
    });
});
});
