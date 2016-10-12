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
        var isHtml = /\.html/.test(url) || url === '/' || url === '';
        $.ajax({
            url: isHtml ? '/customize/BottomBar.html' : '/customize/Header.html',
            success: function (ret) {
                //:$('iframe').height('96%');
                $('body').append(ret);
                LS.main();
                Messages._applyTranslation();
            }
        });
    };
    return {
        main: main
    };
});
