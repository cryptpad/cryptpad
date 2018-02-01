define([
    '/bower_components/chainpad/chainpad.dist.js',
], function (ChainPad) {
    var Diff = ChainPad.Diff;

    var isSpace = function (S, i) {
        return /^\s$/.test(S.charAt(i));
    };

    var leadingBoundary = function (S, offset) {
        if (/\s/.test(S.charAt(offset))) { return offset; }
        while (offset > 0) {
            offset--;
            if (isSpace(S, offset)) { offset++; break; }
        }
        return offset;
    };

    var trailingBoundary = function (S, offset) {
        if (isSpace(S, offset)) { return offset; }
        while (offset < S.length && !/\s/.test(S.charAt(offset))) {
            offset++;
        }
        return offset;
    };

    var opsToWords = function (last, current) {
        var output = [];
        Diff.diff(A, B).forEach(function (op) {
            // ignore deleted sections...
            var offset = op.offset;
            var toInsert = op.toInsert;

            // given an operation,  check whether it is a word fragment,
            // if it is, expand it to its word boundaries
            var first = B.slice(leadingBoundary(B, offset), offset);
            var last = B.slice(offset + toInsert.length, trailingBoundary(B, offset + toInsert.length));

            var result = first + toInsert + last;
            // concat-in-place
            Array.prototype.push.apply(output, result.split(/\s+/));
        });
        return output;
    };

    var runningDiff = function (getter, f, time) {
        var last = getter();
        // first time through, send all the words :D
        f(opsToWords("", last));
        return setInterval(function () {
            var current = getter();

            // find inserted words...
            var words = opsToWords(last, current);
            last = current;
            f(words);
        }, time);
    };

    return runningDiff;
});
