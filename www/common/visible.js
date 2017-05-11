(function () {
    // Set the name of the hidden property and the change event for visibility
    var hidden, visibilityChange; 
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.mozHidden !== "undefined") {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    var Visible = {
        hidden: hidden,
        visibilityChange: visibilityChange,
    };

    Visible.isSupported = function () {
        return !(typeof(document.addEventListener) === "undefined" ||
            typeof document[hidden] === "undefined");
    };

    Visible.onChange = function (f) {
        document.addEventListener(visibilityChange, function (ev) {
            f(!document[hidden], ev);
        }, false);
    };

    Visible.currently = function () {
        return !document[hidden];
    };

    if (typeof(module) !== 'undefined' && module.exports) {
        module.exports = Visible;
    } else if ((typeof(define) !== 'undefined' && define !== null) && (define.amd !== null)) {
        define(function () {
            return Visible;
        });
    } else {
        window.Visible = Visible;
    }
}());
