define([
    'jquery',
    '/common/toolbar3.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'less!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Toolbar,
    Cryptpad,
    nThen,
    SFCommon,
    UI
    /*Messages*/
    )
{
    var APP = window.APP = {};

    var common;
    var sFrameChan;
    nThen(function (waitFor) {
        $(waitFor(UI.addLoadingScreen));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (waitFor) {
        sFrameChan = common.getSframeChannel();
        sFrameChan.onReady(waitFor());
    }).nThen(function (/*waitFor*/) {
        var $container = $('#cp-app-worker-container');
        var $bar = $('.cp-toolbar-container');

        var displayed = ['useradmin', 'newpad', 'limit', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            common: Cryptpad,
            sfCommon: common,
            $container: $bar,
            pageTitle: 'Test WebWorkers',
            metadataMgr: common.getMetadataMgr(),
        };
        APP.toolbar = Toolbar.create(configTb);
        APP.toolbar.$rightside.hide();

        UI.removeLoadingScreen();
        if (!window.Worker) {
            return void $container.text("WebWorkers not supported by your browser");
        }
        console.log('ready');
        var myWorker = new SharedWorker('/worker/worker.js');
        console.log(myWorker);
        console.log(myWorker.port);
        myWorker.onerror = function (e) { console.error(e); };
        myWorker.port.onmessage = function (e) {
            var data = e.data;
            if (data && data.state === "READY") {
                $container.append('<hr>worker.js ready');
                myWorker.port.postMessage(["Hello worker"]);
                return;
            }
            $container.append('<br>');
            $container.append(e.data);
        };
        $container.append('<hr>inner.js ready');
    });
});
