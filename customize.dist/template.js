define([
    'jquery',
    '/common/hyperscript.js',
    '/common/cryptpad-common.js',
    '/customize/pages.js',

    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function ($, h, Cryptpad, Pages) {
$(function () {
    var $body = $('body');
    var isMainApp = function () {
        return /^\/(pad|code|slide|poll|whiteboard|file|media|contacts|drive|settings|profile|todo)\/$/.test(location.pathname);
    };

    var infoPage = function () {
        return h('div#mainBlock.hidden', typeof(Pages[location.pathname]) === 'function'?
            Pages[location.pathname](): [h('div#container')]);
    };

    var $main = $(infoPage());

    var pathname = location.pathname;

    if (isMainApp()) {
        if (typeof(Pages[pathname]) === 'function') {
            var $flash = $('body, #iframe-container, #pad-iframe, textarea');
            $flash.css({
                display: 'none',
                opacity: 0,
                overflow: 'hidden',
            });
            var ready = function () {
                $flash.css({
                    display: '',
                    opacity: '',
                    overflow: '',
                });
            };

            require([
                'less!/customize/src/less/loading.less'
            ], function () {
                if (/whiteboard/.test(pathname)) {
                    $('body').html(h('body', Pages[pathname]()).innerHTML);
                    require(['/whiteboard/main.js'], ready);
                } else if (/poll/.test(pathname)) {
                    $('body').html(h('body', Pages[pathname]()).innerHTML);
                    require(['/poll/main.js'], ready);
                } else if (/drive/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require(['/drive/main.js'], ready);
                } else if (/\/file\//.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/file/main.js' ], ready);
                } else if (/contacts/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/contacts/main.js' ], ready);
                } else if (/pad/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/pad/main.js' ], ready);
                } else if (/code/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/code/main.js' ], ready);
                } else if (/slide/.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/slide/main.js' ], ready);
                } else if (/^\/settings\//.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/settings/main.js', ], ready);
                } else if (/^\/profile\//.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/profile/main.js', ], ready);
                } else if (/^\/todo\//.test(pathname)) {
                    $('body').append(h('body', Pages[pathname]()).innerHTML);
                    require([ '/todo/main.js', ], ready);
                }
            });

            return;
        }
    }

    require([
        'less!/customize/src/less2/main.less',
        'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
        '/bower_components/bootstrap/dist/js/bootstrap.min.js'
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
        } else {
            require([ '/customize/main.js', ], function () {});
        }
    });
});
});
