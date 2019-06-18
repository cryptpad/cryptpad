define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/toolbar3.js',
    'json.sortify',
    '/common/common-util.js',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/common-interface.js',
    '/common/common-hash.js',
    '/common/common-constants.js',
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
    Hash,
    Constants,
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

        var getHrefsTable = function (chainpad, length, cb, progress) {
            var priv = metadataMgr.getPrivateData();
            var origin = priv.origin;
            var edPublic = priv.edPublic;

            var pads = {};
            var channelByHref = {};
            var isOwned = function (data) {
                data = data || {};
                return data && data.owners && Array.isArray(data.owners) && data.owners.indexOf(edPublic) !== -1;
            };
            var parseBlock = function (block, doc) {
                var c = block.getContent(doc).doc;
                if (!c) { return void console.error(block); }
                var p;
                try {
                    p = JSON.parse(c);
                    if (!p.metadata) {
                        p = p.drive || {};
                    }
                } catch (e) {
                    console.error(e);
                    p = {};
                }

                // Get pads from the old storage key
                var old = p[Constants.oldStorageKey];
                var ids = p[Constants.storageKey];
                var pad, parsed, chan, href;
                if (old && Array.isArray(old)) {
                    for (var i = 0; i<old.length; i++) {
                        try {
                            pad = old[i];
                            href = pad.href || pad.roHref;
                            chan = channelByHref[href];
                            if (!chan && href) {
                                parsed = Hash.parsePadUrl(href);
                                chan = parsed.hashData && Util.base64ToHex(parsed.hashData.channel || '');
                                channelByHref[href] = chan;
                            }
                            if (chan && (!pads[chan] || pads[chan].atime < pad.atime)) {
                                pads[chan] = {
                                    atime: +new Date(pad.atime),
                                    href: href,
                                    title: pad.title,
                                    owned: isOwned(pad),
                                    expired: pad.expire && pad.expire < (+new Date())
                                };
                            }
                        } catch (e) {}
                    }
                }
                // Get pads from the new storage key
                if (ids) {
                    for (var id in ids) {
                        try {
                            pad = ids[id];
                            href = pad.href || pad.roHref;
                            chan = pad.channel || channelByHref[href];
                            if (!chan) {
                                if (href) {
                                    parsed = Hash.parsePadUrl(href);
                                    chan = (parsed.hashData && Util.base64ToHex(parsed.hashData.channel || '')) ||
                                           (Hash.getSecrets(parsed.type, parsed.hash, pad.password) || {}).channel;
                                    channelByHref[href] = chan;
                                }
                            }
                            if (chan && (!pads[chan] || pads[chan].atime < pad.atime)) {
                                pads[chan] = {
                                    atime: +new Date(pad.atime),
                                    href: href,
                                    title: pad.title,
                                    owned: isOwned(pad),
                                    expired: pad.expire && pad.expire < (+new Date())
                                };
                            }
                        } catch (e) {}
                    }
                }
                return c;
            };

            var allChannels;
            var deleted;

            nThen(function (W) {
                var nt = nThen;
                // Safely get all the pads from all the states
                var i = 0;
                var next = function (block, doc) {
                    nt = nt(W(function (waitFor) {
                        i++;
                        var doc2 = parseBlock(block, doc);
                        progress(Math.min(i/length, 1));
                        var c = block.getChildren();
                        setTimeout(waitFor(), 1);
                        c.forEach(function (b) {
                            next(b, doc2);
                        });
                    })).nThen;
                };

                var root = chainpad.getRootBlock();
                next(root);
            }).nThen(function (waitFor) {
                // Make the table
                allChannels = Object.keys(pads);
                sframeChan.query('Q_DRIVE_GETDELETED', {list:allChannels}, waitFor(function (err, data) {
                    deleted = data;
                }));
            }).nThen(function () {
                // Current status
                try {
                    var parsed = JSON.parse(chainpad.getUserDoc());
                    var drive = parsed.metadata ? parsed : parsed.drive;
                    var channels = Object.keys(drive[Constants.storageKey] || {}).map(function (id) {
                        return drive[Constants.storageKey][id].channel;
                    });
                } catch (e) {
                    console.error(e);
                }

                // Header
                var rows = [h('tr', [// TODO
                    h('th', '#'),
                    h('th', 'Title'),
                    h('th', 'URL'),
                    h('th', 'Last visited'),
                    h('th', 'Owned'),
                    h('th', 'CryptDrive status'),
                    h('th', 'Server status'),
                ])];
                // Body
                var body = allChannels;
                body.sort(function (a, b) {
                    return pads[a].atime - pads[b].atime;
                });
                body.forEach(function (id, i) {
                    var p = pads[id];
                    var del = deleted.indexOf(id) !== -1;
                    var removed = channels.indexOf(id) === -1;
                    rows.push(h('tr', [
                        h('td', String(i+1)),
                        h('td', {
                            title: p.title
                        }, p.title),
                        h('td', h('a', {
                            href: origin+p.href,
                            target: '_blank'
                        }, p.href)),
                        h('td', new Date(p.atime).toLocaleString()),
                        h('td', p.owned ? 'Yes' : 'No'),
                        h('td'+(p.expired || removed ?'.cp-debug-nok':'.cp-debug-ok'),
                            p.expired ? 'Expired' :
                                        (!removed ? 'Stored' : 'Deleted')),// TODO
                        h('td'+(del?'.cp-debug-nok':'.cp-debug-ok'), del ? 'Missing' : 'Available'),// TODO
                    ]));
                });
                // Table
                var t = h('table', rows);
                cb(t);
            });
        };

        var getGraph = function (chainpad, cb) {
            var hashes = metadataMgr.getPrivateData().hashes;
            var hash = hashes.editHash || hashes.viewHash;
            var chan = Hash.hrefToHexChannelId('/drive/#'+hash);

            var makeGraph = function () {
                var out = [
                    chan + ' digraph {'
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

            cb(makeGraph());
        };

        var getFullChainpad = function (history, length, cb, progress) {
            var chainpad = ChainWalk.create({
                userName: 'debug',
                initialState: '',
                logLevel: 0,
                noPrune: true
            });

            var nt = nThen;
            history.forEach(function (msg, i) {
                nt = nt(function (waitFor) {
                    chainpad.message(msg);
                    progress(Math.min(i/length, 1));
                    setTimeout(waitFor());
                }).nThen;
            });
            nt(function () {
                cb(chainpad);
            });
        };

        var fullHistoryCalled = false;
        var getFullHistory = function () {
            var priv = metadataMgr.getPrivateData();
            if (fullHistoryCalled) { return; }
            fullHistoryCalled = true;

            // Set spinner
            var content = h('div#cp-app-debug-loading', [
                h('h2', 'Step 1/3'),
                h('p', 'Loading history from the server...'),
                h('span.fa.fa-circle-o-notch.fa-spin.fa-3x.fa-fw')
            ]);
            $('#cp-app-debug-content').html('').append(content);

            // Update progress bar
            var decrypting = false;
            var length = 0;
            var decryptProgress = h('span', '0%');
            sframeChan.on('EV_FULL_HISTORY_STATUS', function (progress) {
                if (!decrypting) {
                    // Add the progress bar the first time
                    decrypting = true;
                    var content = h('div.cp-app-debug-progress.cp-loading-progress', [
                        h('h2', 'Step 2/3'),
                        h('p', 'Decrypting your history...'),
                        h('span.fa.fa-circle-o-notch.fa-spin.fa-3x.fa-fw'),
                        h('br'),
                        decryptProgress
                    ]);
                    $('#cp-app-debug-content').html('').append(content);
                }
                length++;
                decryptProgress.innerHTML = (progress*100).toFixed(2) + '%';
            });

            // Get full history
            sframeChan.query('Q_GET_FULL_HISTORY', null, function (err, data) {
                // History is ready.
                // Display the graph code, and if the doc is a drive, display the button to list all the pads

                // Graph
                var graph = h('div.cp-app-debug-content-graph');

                var seeAllButton = h('button.btn.btn-success', 'Get the list');
                var hrefs = h('div.cp-app-debug-content-hrefs', [
                    h('h2', 'List all the pads ever stored in your CryptDrive'), // TODO
                ]);

                var parseProgress = h('span', '0%');
                var content = h('div#cp-app-debug-loading', [
                    h('h2', 'Step 3/3'),
                    h('p', 'Parsing history...'),// TODO
                    h('span.fa.fa-circle-o-notch.fa-spin.fa-3x.fa-fw'),
                    h('br'),
                    parseProgress
                ]);
                $('#cp-app-debug-content').html('').append(content);

                getFullChainpad(data, length, function (chainpad) {
                    var content = h('div.cp-app-debug-content', [
                        graph,
                        priv.debugDrive ? hrefs : ''
                    ]);
                    $('#cp-app-debug-content').html('').append(content);

                    // Table
                    if (priv.debugDrive) {
                        var clicked = false;
                        $(seeAllButton).click(function () {
                            if (clicked) { return; }
                            clicked = true;
                            $(seeAllButton).remove();
                            // Make the table
                            var progress = h('span', '0%');
                            var loading = h('div', [
                                'Loading data...',
                                h('br'),
                                progress
                            ]);
                            hrefs.append(loading);
                            getHrefsTable(chainpad, length, function (table) {
                                loading.innerHTML = '';
                                hrefs.append(table);
                            }, function (p) {
                                progress.innerHTML = (p*100).toFixed(2) + '%';
                            });
                        }).appendTo(hrefs);
                    }

                    // Graph
                    var code = h('code');
                    getGraph(chainpad, function (graphVal) {
                        code.innerHTML = graphVal;
                        $(graph).append(h('h2', 'Graph')); // TODO
                        $(graph).append(code);
                    });
                }, function (p) {
                    parseProgress.innerHTML = (p*100).toFixed(2) + '%';
                });
            }, {timeout: 2147483647}); // Max 32-bit integer
        };

        var getContent = function () {
            if ($('#cp-app-debug-content').is(':visible')) {
                $('#cp-app-debug-content').hide();
                $('#cp-app-debug-history').show();
                $('#cp-app-debug-get-content').removeClass('cp-toolbar-button-active');
                return;
            }
            $('#cp-app-debug-content').css('display', 'flex');
            $('#cp-app-debug-history').hide();
            $('#cp-app-debug-get-content').addClass('cp-toolbar-button-active');
        };
        var setInitContent = function () {
            var button = h('button.btn.btn-success', 'Load history');
            $(button).click(getFullHistory);
            var content = h('p.cp-app-debug-init', [
                'To get better debugging tools, we need to load the entire history of the document. This make take some time.', // TODO
                h('br'),
                button
            ]);
            $('#cp-app-debug-content').html('').append(content);
        };
        setInitContent();

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
            $('#cp-app-debug-history').text(JSON.stringify(doc, 0, 2));
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

            var $content = common.createButton(null, true, {
                icon: 'fa-question',
                title: 'Get debugging graph', // TODO
                name: 'graph',
                id: 'cp-app-debug-get-content'
            });
            $content.click(getContent);
            toolbar.$rightside.append($content);
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

            metadataMgr.updateTitle('');

            initializing = false;
            $('#cp-app-debug-history').show();
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
