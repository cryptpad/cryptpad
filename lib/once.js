module.exports = function (f) {
    var called;
    return function () {
        if (called) { return; }
        called = true;
        f.apply(this, Array.prototype.slice.call(arguments));
    };
};
