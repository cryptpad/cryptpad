define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/api/config',
    '/common/common-realtime.js',
    '/customize/messages.js',
    '/customize/application_config.js',

    '/bower_components/secure-fabric.js/dist/fabric.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/customize/src/less2/main.less',
], function (
    $,
    Crypto,
    Toolbar,
    JSONSortify,
    Util,
    nThen,
    SFCommon,
    UI,
    ApiConfig,
    CommonRealtime,
    Messages,
    AppConfig)
{
    var APP = window.APP = {
        $: $,
        AppConfig: AppConfig,
        SFCommon: SFCommon,
        Crypto: Crypto,
        ApiConfig: ApiConfig
    };

    var toolbar;
    var common;

    nThen(function (waitFor) {
        $(waitFor(function () {
            UI.addLoadingScreen();
        }));
        SFCommon.create(waitFor(function (c) { APP.common = common = c; }));
    }).nThen(function (/*waitFor*/) {
        var initializing = true;
        var $bar = $('#cp-toolbar');
        var Title;
        var cpNfInner;
        var metadataMgr;
        var readOnly = true;

        var config = APP.config = {
            readOnly: readOnly,
            // cryptpad debug logging (default is 1)
            // logLevel: 0,
            validateContent: function (content) {
                try {
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    console.log("Failed to parse, rejecting patch");
                    return false;
                }
            }
        };

        var history = false;

        var setHistory = function (bool, update) {
            history = bool;
            if (!bool && update) { config.onRemote(); }
        };

        var displayDoc = function (doc) {
            $('#cp-app-debug-content').text(JSON.stringify(doc, 0, 2));
            console.log(doc);
        };

        config.onLocal = function () { };

        config.onInit = function (info) {
            Title = common.createTitle({});

            var configTb = {
                displayed: ['title', 'useradmin', 'spinner', 'share', 'userlist', 'newpad', 'limit'],
                title: Title.getTitleConfig(),
                metadataMgr: metadataMgr,
                readOnly: 1,
                realtime: info.realtime,
                sfCommon: common,
                $container: $bar,
                $contentContainer: $('#cp-app-debug')
            };
            toolbar = APP.toolbar = Toolbar.create(configTb);
            Title.setToolbar(toolbar);

            /* add a history button */
            var histConfig = {
                onLocal: config.onLocal,
                onRemote: config.onRemote,
                setHistory: setHistory,
                applyVal: function (val) {
                    displayDoc(JSON.parse(val) || {});
                },
                $toolbar: $bar,
                debug: true
            };
            var $hist = common.createButton('history', true, {histConfig: histConfig});
            $hist.addClass('cp-hidden-if-readonly');
            toolbar.$rightside.append($hist);
        };

        config.onReady = function (info) {
            if (APP.realtime !== info.realtime) {
                APP.realtime = info.realtime;
            }

            var userDoc = APP.realtime.getUserDoc();
            if (userDoc !== "") {
                var hjson = JSON.parse(userDoc);

                if (Array.isArray(hjson)) {
                    metadataMgr.updateMetadata(hjson[3]);
                } else if (hjson && hjson.metadata) {
                    metadataMgr.updateMetadata(hjson.metadata);
                }
                displayDoc(hjson);
            }

            initializing = false;
            UI.removeLoadingScreen();
        };

        config.onRemote = function () {
            if (initializing) { return; }
            if (history) { return; }
            var userDoc = APP.realtime.getUserDoc();

            var json = JSON.parse(userDoc);
            if (Array.isArray(json)) {
                metadataMgr.updateMetadata(json[3]);
            } else if (json && json.metadata) {
                metadataMgr.updateMetadata(json.metadata);
            }
            displayDoc(json);
        };

        config.onAbort = function () {
            console.log('onAbort');
        };

        config.onConnectionChange = function (info) {
            console.log('onConnectionChange', info.state);
        };

        cpNfInner = APP.cpNfInner = common.startRealtime(config);
        metadataMgr = APP.metadataMgr = cpNfInner.metadataMgr;

        cpNfInner.onInfiniteSpinner(function () {
            console.error('infinite spinner');
        });
    });

});
