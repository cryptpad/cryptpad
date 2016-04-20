/* global process */
var WebDriver = require("selenium-webdriver");
var Https = require("https");

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

var logSauceLink = function (cb) {
    Https.request("https://saucelabs.com/rest/v1.1/" + process.env.SAUCE_USERNAME +
            "/jobs?auto_only=true&full=true&limit=50&subaccounts=true", function (resp) {
        var str = '';
        resp.on('data', function (chunk) { str += chunk; });
        resp.on('end', function () {
            JSON.parse(str).jobs.forEach(function (j) {
                var banner = new Array(80).join('=');
                if (j.build === process.env.TRAVIS_JOB_NUMBER) {
                    console.log("\n\n\n" + banner);
                    console.log("SauceLabs Link: " + j.video_url.replace(/\/video\.flv$/), '');
                    console.log(banner + "\n\n\n");
                }
            });
            cb();
        });
    });
};

driver.get('http://localhost:3000/assert/');
var report = driver.wait(WebDriver.until.elementLocated(WebDriver.By.className("report")), 5000);
report.getAttribute("class").then(function (cls) {
    driver.quit();
    logSauceLink(function () {
        if (!cls) {
            throw new Error("cls is null");
        } else if (cls.indexOf("failure") !== -1) {
            throw new Error("cls contains the word failure");
        } else if (cls.indexOf("success") === -1) {
            throw new Error("cls does not contain the word success");
        }
    });
});
