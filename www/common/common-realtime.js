define([], function () {
    var common = {};

    /*
        TODO make this not blow up when disconnected or lagging...
    */
    common.whenRealtimeSyncs = function (realtime, cb) {
        if (typeof(realtime.getAuthDoc) !== 'function') {
            return void console.error('improper use of this function');
        }
        setTimeout(function () {
            if (realtime.getAuthDoc() === realtime.getUserDoc()) {
                return void cb();
            } else {
                realtime.onSettle(cb);
            }
        }, 0);
    };

    return common;
});
