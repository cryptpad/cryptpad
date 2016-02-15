/*
    globals define
*/
define([
    '/bower_components/jquery/dist/jquery.min.js'
], function () {
    var $ = window.jQuery;
    var main = function () {
        $.ajax({
            url: '/customize/BottomBar.html',
            success: function (ret) {
                $('iframe').height('96%');
                $('body').append(ret);
            }
        });
    };
    return {
        main: main
    };
});
