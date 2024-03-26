// SPDX-FileCopyrightText: 2023 XWiki CryptPad Team <contact@cryptpad.org> and contributors
//
// SPDX-License-Identifier: AGPL-3.0-or-later

define([
    'jquery',
    '/common/hyperscript.js',
    '/customize/pages.js',
    '/components/nthen/index.js',

    'css!/components/components-font-awesome/css/font-awesome.min.css',
], function ($, h, Pages, nThen) {
    // we consider that there is no valid reason to load any of the info pages
    // in an iframe. abort everything if you detect that you are embedded.
    if (window.top !== window) { return; }

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
            '/api/config',
            '/common/common-util.js',
            'optional!/api/instance',
            'less!/customize/src/less2/pages/page-' + pageName + '.less',
            'css!/components/bootstrap/dist/css/bootstrap.min.css',
            'css!/customize/fonts/cptools/style.css'
        ], function (ApiConfig, Util, Instance) {
            var $main = $(infoPage());
            var titleSuffix = (Util.find(Instance, ['name','default']) || '').trim();
            if (!titleSuffix || titleSuffix === ApiConfig.httpUnsafeOrigin) {
                titleSuffix = window.location.hostname;
            }
            document.title = document.title + ' - ' + titleSuffix;

            $('#placeholder').remove();

            $body.append($main);

            if (/^\/register\//.test(pathname)) {
                require([ '/register/main.js' ], function () {});
            } else if (/^\/install\//.test(pathname)) {
                require([ '/install/main.js' ], function () {});
            } else if (/^\/recovery\//.test(pathname)) {
                require([ '/recovery/main.js' ], function () {});
            } else if (/^\/ssoauth/.test(pathname)) {
                require([ '/ssoauth/main.js' ], function () {});
            } else if (/^\/login\//.test(pathname)) {
                require([ '/login/main.js' ], function () {});
            } else if (/^\/($|^\/index\.html$)/.test(pathname)) {
                require([ '/customize/main.js', ], function () {});
            } else {
                require([ '/customize/main.js', ], function () {});
            }
        });
    });
});
});
