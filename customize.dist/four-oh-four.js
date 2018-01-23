define([
    'jquery',
    '/api/config',
    '/common/hyperscript.js',
    '/common/outer/local-store.js',
    '/customize/messages.js',

    'less!/customize/src/less2/pages/page-404.less',
], function ($, Config, h, LocalStore, Messages) {
    var urlArgs = Config.requireConf.urlArgs;
    var img = h('img#cp-logo', {
        src: '/customize/cryptpad-new-logo-colors-logoonly.png?' + urlArgs
    });

    var brand = h('h1#cp-brand', 'CryptPad');
    var message = h('h2#cp-scramble', Messages.four04_pageNotFound);
    var title = h('h2#cp-title', "404");

    var loggedIn = LocalStore.isLoggedIn();
    var link = h('a#cp-link', {
        href: loggedIn? '/drive/': '/',
    }, loggedIn? Messages.header_logoTitle: Messages.header_homeTitle);

    if (Config.httpUnsafeOrigin && Config.httpUnsafeOrigin !== window.location.origin
        && window.parent) {
        $(link).click(function (e) {
            e.preventDefault();
            window.parent.location = Config.httpUnsafeOrigin + $(link).attr('href').slice(1);
        });
    }

    var content = h('div#cp-main', [
        img,
        brand,
        title,
        message,
        link,
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

    makeDecryptor(brand, 70, 2, function () { })();
    makeDecryptor(title, 50, 14, function () { })();
    makeDecryptor(link, 20, 4, function () {})();
    makeDecryptor(message, 12, 3, function () {
        console.log('done');
    })();
});

