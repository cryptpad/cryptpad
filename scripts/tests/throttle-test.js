var Util = require("../../lib/common-util");

(function (throttle) {
    var last = 0;
    var last_call = 0;
    var f = Util.throttle(function (boop) {
        var now = +new Date();
        if (last) {
            console.log("last execution was %sms ago", now - last);
        } else {
            console.log("this is the first execution");
        }
        last = now;

        //console.log('time of execution:', now);
        console.log(boop);
    }, 1000);

    [150, 250, 580, 850, 1500, 2200, 3990, 5000].forEach(function (delay) {
        setTimeout(function () {
            var now = +new Date();

            if (last_call) {
                console.log("last call was %sms ago", now - last_call);
            }

            last_call = now;
            //console.log("time of call for delay(%s):", delay, now);
            f(delay);
        }, delay);
    });
}(Util.throttle2));


