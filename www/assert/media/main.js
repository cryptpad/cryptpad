define([
    '/bower_components/jquery/dist/jquery.min.js',
], function () {
    var $ = window.jQuery;

    $('media').each(function () {
        window.alert("media tag selection works!");
    });
});
