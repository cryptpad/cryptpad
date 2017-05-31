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

var SC_GET_LOGS = "return (window.__CRYPTPAD_TEST__) ? window.__CRYPTPAD_TEST__.getLogs() : '[]'";

var nt = nThen;
[
    '/assert/#?test=test',
    '/auth/#?test=test'
].forEach(function (path) {
    var url = 'http://localhost:3000' + path;
    nt = nThen(function (waitFor) {
        driver.get(url);
        var done = false;
        var logMore = function (cb) {
            if (done) { return; }
            driver.executeScript(SC_GET_LOGS).then(waitFor(function (logs) {
                JSON.parse(logs).forEach(function (l) { console.log('>' + l); });
                if (cb) { cb(); } else { setTimeout(logMore, 50); }
            }));
        };
        logMore();
        driver.wait(WebDriver.until.elementLocated(WebDriver.By.className("report")), 5000);
        var report = driver.wait(WebDriver.until.elementLocated(WebDriver.By.className("report")), 5000);
        report.getAttribute("class").then(waitFor(function (cls) {
            report.getText().then(waitFor(function (text) {
                logMore(function () { done = true; });
                console.log("\n-----\n" + url + '  ' + text + "\n-----");
                if (!cls) {
                    throw new Error("cls is null");
                } else if (cls.indexOf("failure") !== -1) {
                    throw new Error("cls contains the word failure");
                } else if (cls.indexOf("success") === -1) {
                    throw new Error("cls does not contain the word success");
                }
            }));
        }));
    }).nThen;
});

nt(function () {
    driver.quit();
})