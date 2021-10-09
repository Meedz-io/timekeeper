const puppeteer = require('puppeteer');

puppeteer.connect({
    defaultViewport: { width: 1000, height: 926 },
    slowMo: 200
});

puppeteer.defaultArgs({
    headless: false , // for test disable the headlels mode,
    args: ['--headless'], // headless but GPU enable
    userDataDir: "/Applications/Google"
});

module.exports = puppeteer;