/*
    globals define
*/
define([
    '/customize/languageSelector.js',
    '/customize/messages.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (LS, Messages) {
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
                Messages._applyTranslation();
            }
        });
    };
    return {
        main: main
    };
});
