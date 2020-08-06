define([
    'jquery',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
], function (
    $,
    Util,
    Hash,
    nThen,
    SFCommon,
    UI
    )
{
   var APP = {}

   window.openPicker = openPicker = function () { 
                var pickerCfg = {
                    types: [],
                    where: ['root']
                };
                common.openFilePicker(pickerCfg, function (data) {
                    console.log(data);
                    window.parent.parent.postMessage(data, '*');
                });
   }

   var main = function () {

        nThen(function (waitFor) {
            $(waitFor(function () {
                UI.addLoadingScreen();
                var $div = $('<div>').append("");
                $('body').append($div.html());
            }));
            SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
        }).nThen(function (waitFor) {
            common.getSframeChannel().onReady(waitFor());
        }).nThen(function (waitFor) {
           //  common.handleNewFile(waitFor);
        }).nThen(function (/* waitFor */) {
            // var metadataMgr = common.getMetadataMgr();
	    UI.removeLoadingScreen();
            window.parent.parent.postMessage({ type: "ready" }, '*');
            openPicker();
        });
   };
   main();
});
