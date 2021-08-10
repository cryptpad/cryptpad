define([
], function () {
    var Tools = {};
    Tools.supportsSharedArrayBuffers = function () {
        try {
            return Object.prototype.toString.call(new window.WebAssembly.Memory({
                shared: true,
                initial: 0,
                maximum: 0,
            }).buffer) === '[object SharedArrayBuffer]';
        } catch (err) {
            console.error(err);
        }
        return false;
    };

    var OS_HINTS = {
        "Win": "Windows",
        "Mac": "MacOS",
        "X11": "UNIX",
        "Linux": "Linux",
    };

    Tools.guessOS = function () {
        var result = "UNKNOWN";
        if (!window.navigator || !window.navigator.appVersion) { return result; }
        result = window.navigator.appVersion;
        console.log(result);
        Object.keys(OS_HINTS).some(function (key) {
            if (result.indexOf(key) === -1) { return; }
            result = OS_HINTS[key]; // else
            return true;
        });
        return result;
    };

    Tools.isSafari = function () {
        return navigator.vendor.match(/apple/i);
    };

    Tools.isChrome = function () {
        return navigator.vendor.match(/google/i);
    };

    Tools.guessBrowser = function () {
        if (Tools.isChrome()) { return 'chrome/blink'; }
        if (Tools.isSafari()) { return 'safari/webkit'; }
        if (navigator.userAgent.match(/firefox\//i)) { return 'firefox/gecko'; }
        if (navigator.userAgent.match(/edge\//i)) { return 'edge/edgehtml'; }
        if (navigator.userAgent.match(/trident\//i)) { return 'ie/trident'; }
        return navigator.userAgent + "\n" + navigator.vendor;
    };

    return Tools;
});
