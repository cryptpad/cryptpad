define([
    'jquery',
    '/common/common-interface.js',
    '/common/hyperscript.js',
    '/customize/messages.js',
    '/bower_components/nthen/index.js',
    '/bower_components/chainpad/chainpad.dist.js',
], function ($, UI, h, Messages, nThen, ChainPad /* JsonOT */) {
    var Snapshots = {};

    Snapshots.create = function (common, config) {
        if (!config.$toolbar) { return void console.error("config.$toolbar is undefined");}
        if (Snapshots.loading) { return void console.error("Snapshot is already being loaded..."); }
        Snapshots.loading = true;

        var sframeChan = common.getSframeChannel();

        var $toolbar = config.$toolbar;
        var $snap = $toolbar.find('.cp-toolbar-snapshots');
        var $bottom = $toolbar.find('.cp-toolbar-bottom');
        var $cke = $toolbar.find('.cke_toolbox_main');

        $snap.html('').css('display', 'flex');
        $bottom.hide();
        $cke.hide();

        var createChainPad = function () {
            return ChainPad.create({
                userName: 'snapshot',
                validateContent: function (content) {
                    try {
                        JSON.parse(content);
                        return true;
                    } catch (e) {
                        console.log('Failed to parse, rejecting patch');
                        return false;
                    }
                },
                initialState: '',
                logLevel: 0
            });
        };

        var snapshot;
        var getData = function () {
            sframeChan.query("Q_GET_SNAPSHOT", {hash: config.hash}, function (err, obj) {
                if (err || (obj && obj.error)) { return void console.error(err || obj.error); }
                if (!Array.isArray(obj)) { return void console.error("invalid type"); }
                var messages = obj;
                var chainpad = createChainPad();
                messages.forEach(function (m) {
                    chainpad.message(m);
                });
                snapshot = chainpad.getAuthDoc();
                config.applyVal(snapshot);
                chainpad.abort();
            });
        };

Messages.snapshots_restore = "Restore"; // XXX
Messages.snapshots_close = "Close";
Messages.snapshots_cantRestore = "Can't restore now. Disconnected...";

        var display = function () {
            var data = config.data || {};

            if (!config.readOnly) {
                $(h('button.cp-toolbar-snapshots-restore', [
                    h('i.fa.fa-check'),
                    h('spap.cp-button-name', Messages.snapshots_restore)
                ])).click(function () {
                    var closed = config.close(true, snapshot);
                    if (!closed) {
                        return void UI.alert(Messages.snapshots_cantRestore);
                    }
                    $snap.hide();
                    $bottom.show();
                    $cke.show();
                    Snapshots.loading = false;
                }).appendTo($snap);
            }

            $(h('span.cp-toolbar-snapshots-title', data.title)).appendTo($snap);

            $(h('button.cp-toolbar-snapshots-close', [
                h('i.fa.fa-times'),
                h('spap.cp-button-name', Messages.snapshots_close)
            ])).click(function () {
                $snap.hide();
                $bottom.show();
                $cke.show();
                Snapshots.loading = false;
                config.close(false);
            }).appendTo($snap);
        };

        display();
        getData();
    };

    return Snapshots;
});


