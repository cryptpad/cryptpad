define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/api/config',
    '/common/common-realtime.js',
    '/customize/messages.js',
    '/customize/application_config.js',
    '/debug/chainpad.dist.js',

    '/bower_components/secure-fabric.js/dist/fabric.min.js',

    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
    'css!/bower_components/components-font-awesome/css/font-awesome.min.css',
    'less!/debug/app-debug.less',
], function (
    $,
    Crypto,
    Toolbar,
    JSONSortify,
    Util,
    nThen,
    SFCommon,
    UI,
    h,
    ApiConfig,
    CommonRealtime,
    Messages,
    AppConfig,
    ChainWalk)
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
        var sframeChan = common.getSframeChannel();

        var getGraph = function (cb) {
            var chainpad = ChainWalk.create({
                userName: 'debug',
                initialState: '',
                logLevel: 0,
                noPrune: true
            });
            var makeGraph = function () {
                var out = [
                    'digraph {'
                ];
                var parseBlock = function (x) {
                    var c = x.getChildren();
                    var label = x.hashOf.slice(0,8) + ' (' + x.parentCount + ' - ' + x.recvOrder + ')';
                    var p = x.getParent();
                    if (p && p.getChildren().length === 1 && c.length === 1) {
                        label = '...';
                        var gc = c;
                        while (gc.length === 1) {
                            c = gc;
                            gc = c[0].getChildren();
                        }
                    }
                    var nodeInfo = ['  p' + x.hashOf + '[label="' + label + '"'];
                    if (x.isCheckpoint && label !== '...') { nodeInfo.push(',color=red,weight=0.5'); }
                    nodeInfo.push(']');
                    out.push(nodeInfo.join(''));
                    c.forEach(function (child) {
                        out.push('  p' + x.hashOf + ' -> p' + child.hashOf);
                        parseBlock(child);
                    });
                };
                parseBlock(chainpad.getRootBlock());
                out.push('}');
                return out.join('\n');
            };
            sframeChan.query('Q_GET_FULL_HISTORY', null, function (err, data) {
                console.log(err, data);
                if (err) { return void cb(err); }
                data.forEach(function (m) {
                    chainpad.message(m);
                    cb(null, makeGraph());
                });
            }, {timeout: 180000});
        };

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

            var $graph = common.createButton(null, true, {
                icon: 'fa-bug',
                title: Messages.debug_getGraph,
                name: 'graph',
                id: 'cp-app-debug-get-graph'
            });
            $graph.click(function () {
                var p = h('p', [
                    Messages.debug_getGraphWait,
                    h('br'),
                    h('span.fa-circle-o-notch.fa-spin.fa-3x.fa-fw.fa')
                ]);
                var code = h('code');
                var content = h('div', [p, code]);
                getGraph(function (err, data) {
                    if (err) {
                        p.innerHTML = err;
                        return;
                    }
                    p.innerHTML = Messages.debug_getGraph;
                    code.innerHTML = data;
                });
                UI.alert(content);
            });
            toolbar.$rightside.append($graph);
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
