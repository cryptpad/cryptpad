define([
    '/common/hyperscript.js',

    'less!/customize/src/less2/pages/page-404.less',
], function (h) {
    var scramble = h('h2#cp-scramble', "We couldn't find the page you were looking for");
    var title = h('h1#title', "404");
    var content = h('div#cp-main', [
        title,
        scramble
    ]);
    document.body.appendChild(content);

    var die = function (n) { return Math.floor(Math.random() * n); };
    var randomChar = function () {
        return String.fromCharCode(die(94) + 34);
    };
    var mutate = function (S, i, c) {
        var A = S.split("");
        A[i] = c;
        return A.join("");
    };

    var take = function (A) {
        var n = die(A.length);
        var choice = A[n];
        A.splice(n, 1);
        return choice;
    };

    var makeDecryptor = function (el, t, difficulty, cb) {
        var Orig = el.innerText;
        var options = [];
        el.innerText = el.innerText.split("").map(function (c, i) {
            Orig[i] = c;
            options.push(i);
            return randomChar();
        }).join("");

        return function f () {
            if (die(difficulty) === 0) {
                var choice = take(options);
                el.innerText = mutate(el.innerText, choice, Orig.charAt(choice));
            } else { // make a superficial change
                el.innerText = mutate(el.innerText,
                    options[die(options.length)],
                    randomChar());
            }
            setTimeout(options.length > 0? f: cb, t);
        };
    };

    makeDecryptor(title, 70, 17, function () { })();
    makeDecryptor(scramble, 10, 8, function () {
        console.log('done');
    })();
});

