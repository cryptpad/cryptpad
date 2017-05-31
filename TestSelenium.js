/* global process */
var WebDriver = require("selenium-webdriver");
var nThen = require('nthen');

if (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST !== 'false') {
    // We can't do saucelabs on pull requests so don't fail.
    return;
}

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
    driver = new WebDriver.Builder().withCapabilities({ browserName: "chrome" }).build();
}

var SC_GET_DATA = "return (window.__CRYPTPAD_TEST__) ? window.__CRYPTPAD_TEST__.getData() : '[]'";

var failed = false;
var nt = nThen;
[
    '/assert/#?test=test',
  //  '/auth/#?test=test' // TODO(cjd): Not working on automatic tests, understand why.
].forEach(function (path) {
    if (failed) { return; }
    var url = 'http://localhost:3000' + path;
    nt = nt(function (waitFor) {
        var done = waitFor();
        console.log('\n\n-----TEST ' + url + ' -----');
        driver.get(url);
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
        logMore();
    }).nThen;
});

nt(function (waitFor) {
    driver.quit().then(waitFor(function () {
        if (failed) { process.exit(100); }
    }));
});