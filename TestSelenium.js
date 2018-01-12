/* global process */
var WebDriver = require("selenium-webdriver");
var nThen = require('nthen');

if (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST !== 'false') {
    // We can't do saucelabs on pull requests so don't fail.
    return;
}

// https://wiki.saucelabs.com/display/DOCS/Platform+Configurator#/
var driver;
if (process.env.SAUCE_USERNAME !== undefined) {
    var browserArray = process.env.BROWSER.split(':');
    driver = new WebDriver.Builder().usingServer(
        'http://'+ process.env.SAUCE_USERNAME+':'+process.env.SAUCE_ACCESS_KEY+'@ondemand.saucelabs.com:80/wd/hub'
    ).withCapabilities({
        "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
        "build": process.env.TRAVIS_JOB_NUMBER,
        "username": process.env.SAUCE_USERNAME,
        "accessKey": process.env.SAUCE_ACCESS_KEY,
    }).forBrowser(browserArray[0], browserArray[1], browserArray[2]).build();
} else {
    driver = new WebDriver.Builder().withCapabilities({
        browserName: process.env.BROWSER || "chrome"
    }).build();
}

var SC_GET_DATA = "return (window.__CRYPTPAD_TEST__) ? window.__CRYPTPAD_TEST__.getData() : '[]'";

var failed = false;
var nt = nThen(function (waitFor) {
    driver.get('http://localhost:3000/auth/').then(waitFor());
}).nThen(function (waitFor) {
    console.log('initialized');
    driver.manage().addCookie({name: 'test', value: 'auto'}).then(waitFor());
}).nThen;

[
    // login test must happen after register test
    ['/register/', {}],
    ['/login/', {}],

    ['/assert/', {}],
    ['/auth/', {}],

    ['/pad/#/1/edit/1KXFMz5L+nLgvHqXVJjyiQ/IUAE6IzVVg5UIYFOPglmVxvV/', {}],
    ['/pad/#/1/view/1KXFMz5L+nLgvHqXVJjyiQ/O4kuSnJyviGVlz3qpcr4Fxc8fIK6uTeB30MfMkh86O8/', {}],

    ['/code/#/1/edit/CWtkq8Qa2re7W1XvXZRDYg/2G7Gse5UZ8dLyGAXUdCV2fLL/', {}],
    ['/code/#/1/view/CWtkq8Qa2re7W1XvXZRDYg/G1pVa1EL26JRAjk28b43W7Ftc3AkdBblef1U58F3iDk/', {}],

    ['/slide/#/1/edit/uwKqgj8Ezh2dRaFUWSlrRQ/JkJtAb-hNzfESZEHreAeULU1/', {}],
    ['/slide/#/1/view/uwKqgj8Ezh2dRaFUWSlrRQ/Xa8jXl+jWMpwep41mlrhkqbRuVKGxlueH80Pbgeu5Go/', {}],

    ['/poll/#/1/edit/lHhnKHSs0HBsl2UGfSJoLw/ZXSsAq4BORIixuFaLVBFcxoq/', {}],
    ['/poll/#/1/view/lHhnKHSs0HBsl2UGfSJoLw/TGul8PhswwLh1klHpBto6yEntWtKES2+tetYrrYec4M/', {}]

].forEach(function (x) {
    if (failed) { return; }
    var url = 'http://localhost:3000' + x[0];
    nt = nt(function (waitFor) {
        var done = waitFor();
        console.log('\n\n-----TEST ' + url + ' -----');
        var waitTo = setTimeout(function () {
            console.log("no report in 20 seconds, timing out");
            failed = true;
            done();
            done = undefined;
        }, 20000);
        var logMore = function () {
            if (!done) { return; }
            driver.executeScript(SC_GET_DATA).then(waitFor(function (dataS) {
                if (!done) { return; }
                var data = JSON.parse(dataS);
                data.forEach(function (d) {
                    if (d.type !== 'log') { return; }
                    console.log('>' + d.val);
                });
                data.forEach(function (d) {
                    if (d.type !== 'report') { return; }
                    console.log('RESULT: ' + d.val);
                    if (d.val !== 'passed') {
                        if (d.error) {
                            console.log(d.error.message);
                            console.log(d.error.stack);
                        }
                        failed = true;
                    }
                    clearTimeout(waitTo);
                    console.log('-----END TEST ' + url + ' -----');
                    done();
                    done = undefined;
                });
                if (done) { setTimeout(logMore, 50); }
            }));
        };
        driver.manage().addCookie({
            name: 'test',
            value: encodeURIComponent(JSON.stringify({ test:'auto', opts: x[1] }))
        });
        driver.get(url).then(waitFor(logMore));
    }).nThen;
});

nt(function (waitFor) {
    driver.quit().then(waitFor(function () {
        if (failed) { process.exit(100); }
    }));
});
