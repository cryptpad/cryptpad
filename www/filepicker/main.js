// Load #1, load as little as possible because we are in a race to get the loading screen up.
define([
    '/bower_components/nthen/index.js',
    '/api/config',
    'jquery',
    '/common/requireconfig.js',
], function (nThen, ApiConfig, $, RequireConfig) {
    var requireConfig = RequireConfig();

    var create = function (config) {
        // Loaded in load #2
        var sframeChan;
        nThen(function (waitFor) {
            $(waitFor());
        }).nThen(function (waitFor) {
            var req = {
                cfg: requireConfig,
                req: [ '/common/loading.js' ],
                pfx: window.location.origin
            };
            window.rc = requireConfig;
            window.apiconf = ApiConfig;
            $('#sbox-filePicker-iframe').attr('src',
                ApiConfig.httpSafeOrigin + '/filepicker/inner.html?' + requireConfig.urlArgs +
                    '#' + encodeURIComponent(JSON.stringify(req)));

            // This is a cheap trick to avoid loading sframe-channel in parallel with the
            // loading screen setup.
            var done = waitFor();
            var onMsg = function (msg) {
                var data = JSON.parse(msg.data);
                if (data.q !== 'READY') { return; }
                window.removeEventListener('message', onMsg);
                var _done = done;
                done = function () { };
                _done();
            };
            window.addEventListener('message', onMsg);
        }).nThen(function (/*waitFor*/) {
            var Cryptpad = config.modules.Cryptpad;
            var Utils = config.modules.Utils;

            nThen(function (waitFor) {
                // The inner iframe tries to get some data from us every ms (cache, store...).
                // It will send a "READY" message and wait for our answer with the correct txid.
                // First, we have to answer to this message, otherwise we're going to block
                // sframe-boot.js. Then we can start the channel.
                var msgEv = Utils.Util.mkEvent();
                var iframe = $('#sbox-filePicker-iframe')[0].contentWindow;
                var postMsg = function (data) {
                    iframe.postMessage(data, '*');
                };
                var w = waitFor();
                var whenReady = function (msg) {
                    if (msg.source !== iframe) { return; }
                    var data = JSON.parse(msg.data);
                    if (!data.txid) { return; }
                    // Remove the listener once we've received the READY message
                    window.removeEventListener('message', whenReady);
                    // Answer with the requested data
                    postMsg(JSON.stringify({ txid: data.txid, language: Cryptpad.getLanguage() }));

                    // Then start the channel
                    window.addEventListener('message', function (msg) {
                        if (msg.source !== iframe) { return; }
                        msgEv.fire(msg);
                    });
                    config.modules.SFrameChannel.create(msgEv, postMsg, waitFor(function (sfc) {
                        sframeChan = sfc;
                    }));
                    w();
                };
                window.addEventListener('message', whenReady);
            }).nThen(function () {
                var updateMeta = function () {
                    //console.log('EV_METADATA_UPDATE');
                    var metaObj;
                    nThen(function (waitFor) {
                        Cryptpad.getMetadata(waitFor(function (err, n) {
                            if (err) { console.log(err); }
                            metaObj = n;
                        }));
                    }).nThen(function (/*waitFor*/) {
                        metaObj.doc = {};
                        var additionalPriv = {
                            fileHost: ApiConfig.fileHost,
                            accountName: Utils.LocalStore.getAccountName(),
                            origin: window.location.origin,
                            pathname: window.location.pathname,
                            feedbackAllowed: Utils.Feedback.state,
                            types: config.types
                        };
                        for (var k in additionalPriv) { metaObj.priv[k] = additionalPriv[k]; }

                        sframeChan.event('EV_METADATA_UPDATE', metaObj);
                    });
                };
                Cryptpad.onMetadataChanged(updateMeta);
                sframeChan.onReg('EV_METADATA_UPDATE', updateMeta);

                config.addCommonRpc(sframeChan);

                sframeChan.on('Q_GET_FILES_LIST', function (types, cb) {
                    Cryptpad.getSecureFilesList(types, function (err, data) {
                        cb({
                            error: err,
                            data: data
                        });
                    });
                });

                sframeChan.on('EV_FILE_PICKER_CLOSE', function () {
                    config.onClose();
                });
                sframeChan.on('EV_FILE_PICKED', function (data) {
                    config.onFilePicked(data);
                });
                sframeChan.on('Q_UPLOAD_FILE', function (data, cb) {
                    config.onFileUpload(sframeChan, data, cb);
                });
            });
        });
        var refresh = function (types) {
            if (!sframeChan) { return; }
            sframeChan.event('EV_FILE_PICKER_REFRESH', types);
        };
        return {
            refresh: refresh
        };
    };
    return {
        create: create
    };
});
