module.exports = function (f, g) {
    return function () {
        if (!f) { return; }
        f.apply(this, Array.prototype.slice.call(arguments));
        f = g;
    };
};
