define(function () {
    var setRandomizedInterval = function (func, target, range) {
        var timeout;
        var again = function () {
            timeout = setTimeout(function () {
                again();
                func();
            }, target - (range / 2) + Math.random() * range);
        };
        again();
        return {
            cancel: function () {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
            }
        };
    };

    var testInput = function (doc, el, offset, cb) {
        var i = 0,
            j = offset,
            input = " The quick red fox jumps over the lazy brown dog.",
            l = input.length,
            errors = 0,
            max_errors = 15,
            interval;
        var cancel = function () {
            if (interval) { interval.cancel(); }
        };

        interval = setRandomizedInterval(function () {
            cb();
            try {
                el.replaceData(Math.min(j, el.length), 0, input.charAt(i));
            } catch (err) {
                errors++;
                if (errors >= max_errors) {
                    console.log("Max error number exceeded");
                    cancel();
                }

                console.error(err);
                var next = document.createTextNode("");
                doc.appendChild(next);
                el = next;
                j = -1;
            }
            i = (i + 1) % l;
            j++;
        }, 200, 50);

        return {
            cancel: cancel
        };
    };

    var testPad = function (editor, onLocal) {
        var i = 0,
            input = " The quick red fox jumps over the lazy brown dog.",
            l = input.length,
            interval;
        var cancel = function () {
            if (interval) { interval.cancel(); }
        };

        interval = setRandomizedInterval(function () {
            editor.insertText(input.charAt(i));
            onLocal();
            i = (i + 1) % l;
        }, 200, 50);

        return {
            cancel: cancel
        };
    };

    var testCode = function (editor) {
        var i = 0,
            input = " The quick red fox jumps over the lazy brown dog.",
            l = input.length,
            interval;
        var cancel = function () {
            if (interval) { interval.cancel(); }
        };

        interval = setRandomizedInterval(function () {
            editor.replaceSelection(input.charAt(i));
            i = (i + 1) % l;
        }, 200, 50);

        return {
            cancel: cancel
        };
    };

    return {
        testInput: testInput,
        testPad: testPad,
        testCode: testCode,
        setRandomizedInterval: setRandomizedInterval
    };
});
