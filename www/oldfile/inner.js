define([
    'jquery',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/file/file.less',
    'less!/customize/src/less/cryptpad.less',
    'less!/customize/src/less/toolbar.less',
], function ($) {
    $('.loading-hidden').removeClass('loading-hidden');
    // dirty hack to get rid the flash of the lock background
    setTimeout(function () {
        $('#app').addClass('ready');
    }, 100);
});
