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
        var url = window.location.pathname;
        var isHtml = /\.html/.test(url) || url === '/';
        $.ajax({
            url: isHtml ? '/customize/BottomBar.html' : '/customize/Header.html',
            success: function (ret) {
                $('iframe').height('96%');
                if (isHtml) {
                    $('body').append(ret);
                }
                else {
                    $('body').prepend(ret);
                }
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
