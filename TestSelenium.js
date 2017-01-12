/* global process */
var WebDriver = require("selenium-webdriver");

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

driver.get('http://localhost:3000/assert/');
var report = driver.wait(WebDriver.until.elementLocated(WebDriver.By.className("report")), 5000);
report.getAttribute("class").then(function (cls) {
    report.getText().then(function (text) {
        console.log("\n-----\n" + text + "\n-----");
        driver.quit();
        if (!cls) {
            throw new Error("cls is null");
        } else if (cls.indexOf("failure") !== -1) {
            throw new Error("cls contains the word failure");
        } else if (cls.indexOf("success") === -1) {
            throw new Error("cls does not contain the word success");
        }
    });
});
