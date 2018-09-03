define([
    'jquery',
    '/common/toolbar3.js',
    '/common/cryptpad-common.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/customize/messages.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/worker/app-worker.less',
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
        $('<a>', {href:'http://localhost:3000/worker/', target:'_blank'}).text('other').appendTo($container);
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
        /*
        // Shared worker
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
        };*/

        // Service worker
        if ('serviceWorker' in navigator) {
            console.log('here');
            var initializing = true;
            var worker;
            var postMessage = function (data) {
                console.log(data, navigator.serviceWorker);
                if (worker) {
                    return void worker.postMessage(data);
                }
                console.log('NOT READY');
                /*if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage(data);
                }*/
            };
            navigator.serviceWorker.register('/worker/sw.js', {scope: '/'})
                .then(function(reg) {
                    console.log(reg);
                    console.log('Registration succeeded. Scope is ' + reg.scope);
                    $container.append('<br>');
                    $container.append('Registered! (scope: ' + reg.scope +')');
                    reg.onupdatefound = function () {
                        if (initializing) {
                            var w = reg.installing;
                            var onStateChange = function () {
                                if (w.state === "activated") {
                                    console.log(w);
                                    worker = w;
                                    postMessage("INIT");
                                    w.removeEventListener("statechange", onStateChange);
                                }
                            };
                            w.addEventListener('statechange', onStateChange);
                            return;
                        }
                        console.log('new SW version found!');
                        // KILL EVERYTHING
                        UI.confirm("New version detected, you have to reload", function (yes) {
                            if (yes) { common.gotoURL(); }
                        });
                    };
                    // Here we add the event listener for receiving messages
                    navigator.serviceWorker.addEventListener('message', function (e) {
                        var data = e.data;
                        if (data && data.state === "READY") {
                            initializing = false;
                            $container.append('<hr>sw.js ready');
                            postMessage(["Hello worker"]);
                            return;
                        }
                        $container.append('<br>');
                        $container.append(e.data);
                    });
                    if (reg.active) {
                        worker = reg.active;
                        postMessage("INIT");
                    }
                }).catch(function(error) {
                    console.log('Registration failed with ' + error);
                    $container.append('Registration error: ' + error);
                });
        } else {
            console.log('NO SERVICE WORKER');
        }

        $container.append('<hr>inner.js ready');
    });
});
