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
        var isPoll = /\/poll\//.test(url);
        if (!isHtml && !isPoll) {
            Messages._applyTranslation();
            return;
        }
        $.ajax({
            url: isHtml ? '/customize/BottomBar.html' : '/customize/Header.html',
            success: function (ret) {
                var $bar = $(ret);
                $('body').append($bar);

                var $sel = $bar.find('#language-selector');

                Object.keys(Messages._languages).forEach(function (code) {
                    $sel.append($('<option>', {
                        value: code,
                    }).text(Messages._languages[code]));
                });

                LS.main();
                Messages._applyTranslation();
            }
        });
    };
    return {
        main: main
    };
});
