/*
    globals define
*/
define([
    '/customize/languageSelector.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (LS) {
    var $ = window.jQuery;
    var main = function () {
        $.ajax({
            url: '/customize/BottomBar.html',
            success: function (ret) {
                $('iframe').height('96%');
                $('body').append(ret);
                $('head').append($('<link>', {
                    rel: 'stylesheet',
                    href: '/customize/main.css'
                }));
                LS.main();
            }
        });
    };
    return {
        main: main
    };
});
