
define([
    '/common/sframe-ctrl.js',
    'jquery'
], function (SFrameCtrl, $) {
    console.log('xxx');
    $(function () {
        console.log('go');
        SFrameCtrl.init($('#sbox-iframe')[0], function () {
            console.log('\n\ndone\n\n');
        });
    });
});