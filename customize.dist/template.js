define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/pages.js',
    '/bower_components/nthen/index.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, h, Pages, nThen) {
$(function () {
    var $body = $('body');

    var pathname = location.pathname;

    // add class on info-pages
    var pageName = pathname.replace(/(index)?\.html$/gi, "") // .html
        .replace(/[^a-zA-Z]+/gi, '-') // any non-alpha character
        .replace(/^-|-$/g, ''); // starting/trailing dashes
    if (pageName === '') { pageName = 'index'; }
    $('body').addClass('cp-page-' + pageName);

    var infoPage = function () {
        return h('div#mainBlock.hidden', typeof(Pages[pathname]) === 'function'?
            Pages[pathname](): [h('div#container')]);
    };

    window.Tether = function () {};

    nThen(function (waitFor) {
        var w = waitFor();
        require([
            '/customize/pages/' + pageName + '.js',
        ], function (Page) {
            infoPage = Page;
            w();
        }, function () {
            w();
        });
    }).nThen(function () {
        require([
            'less!/customize/src/less2/pages/page-' + pageName + '.less',
            'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
            'css!/customize/fonts/cptools/style.css'
        ], function () {
            var $main = $(infoPage());

            $body.append($main);

            if (/^\/register\//.test(pathname)) {
                require([ '/register/main.js' ], function () {});
            } else if (/^\/login\//.test(pathname)) {
                require([ '/login/main.js' ], function () {});
            } else if (/^\/($|^\/index\.html$)/.test(pathname)) {
                // TODO use different top bar
                require([ '/customize/main.js', ], function () {});
            } else if (/invite/.test(pathname)) {
                require([ '/invite/main.js'], function () {});
            } else if (/faq/.test(pathname)) {
                var hash = window.location.hash;
                window.location.hash = '';
                window.location.hash = hash;
            } else {
                require([ '/customize/main.js', ], function () {});
            }
        });
    });
});
});
