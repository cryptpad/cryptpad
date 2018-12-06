define([
], function () {
    var module = {};

    module.create = function (Common) {
        var exp = {};
        var sframeChan = Common.getSframeChannel();
        var metadataMgr = Common.getMetadataMgr();

        var execCommand = function (cmd, data, cb) {
            sframeChan.query('Q_CURSOR_COMMAND', {cmd: cmd, data: data}, function (err, obj) {
                if (err || (obj && obj.error)) { return void cb(err || (obj && obj.error)); }
                cb(void 0, obj);
            });
        };

        exp.updateCursor = function (obj) {
            execCommand('UPDATE', obj, function (err) {
                if (err) { console.error(err); }
            });
        };

        var messageHandlers = [];
        exp.onCursorUpdate = function (handler) {
            messageHandlers.push(handler);
        };
        var onMessage = function (data) {
            messageHandlers.forEach(function (h) {
                try {
                    h(data);
                } catch (e) {
                    console.error(e);
                }
            });
        };


        sframeChan.on('EV_CURSOR_EVENT', function (obj) {
            var cmd = obj.ev;
            var data = obj.data;
            if (cmd === 'MESSAGE') {
                onMessage(data);
                return;
            }
        });

        return exp;
    };

    return module;
});


