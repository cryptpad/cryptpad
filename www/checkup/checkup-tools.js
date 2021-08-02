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
