define([
    '/customize/application_config.js',
    '/customize/messages.js',
], function (AppConfig, Messages) {
    var common = {};

    common.infiniteSpinnerDetected = false;
    var BAD_STATE_TIMEOUT = typeof(AppConfig.badStateTimeout) === 'number'?
        AppConfig.badStateTimeout: 30000;

    var connected = false;
    var intr;
    var infiniteSpinnerHandlers = [];

    /*
        TODO make this not blow up when disconnected or lagging...
    */
    common.whenRealtimeSyncs = function (Cryptpad, realtime, cb) {
        if (typeof(realtime.getAuthDoc) !== 'function') {
            return void console.error('improper use of this function');
        }

        window.setTimeout(function () {
            if (realtime.getAuthDoc() === realtime.getUserDoc()) {
                return void cb();
            } else {
                realtime.onSettle(cb);
            }

            if (intr) { return; }
            intr = window.setInterval(function () {
                var l;
                try {
                    l = realtime.getLag();
                } catch (e) {
                    throw new Error("ChainPad.getLag() does not exist, please `bower update`");
                }
                if (l.lag < BAD_STATE_TIMEOUT || !connected) { return; }
                realtime.abort();
                // don't launch more than one popup
                if (common.infiniteSpinnerDetected) { return; }
                infiniteSpinnerHandlers.forEach(function (ish) { ish(); });

                // inform the user their session is in a bad state
                Cryptpad.confirm(Messages.realtime_unrecoverableError, function (yes) {
                    if (!yes) { return; }
                    window.parent.location.reload();
                });
                common.infiniteSpinnerDetected = true;
            }, 2000);
        }, 0);
    };

    common.onInfiniteSpinner = function (f) { infiniteSpinnerHandlers.push(f); };

    common.setConnectionState = function (bool) {
        if (typeof(bool) !== 'boolean') { return; }
        connected = bool;
    };

    return common;
});
