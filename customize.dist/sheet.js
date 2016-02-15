/*
    globals require
*/
require([
    '/customize/DecorateToolbar.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Dt) {
    Dt.main(window.$('#bottom-bar'));
});
