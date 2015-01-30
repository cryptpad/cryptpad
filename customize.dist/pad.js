require([
    '/customize/DecorateToolbar.js',
    '/bower_components/jquery/dist/jquery.min.js'
], function (Dt, $) {
    Dt.main($('.rtwysiwyg-toolbar-rightside'));
});
