const puppeteer = require('puppeteer');

puppeteer.defaultArgs({
    headless: false, 
    args: ['--headless'],
    userDataDir: "/Applications/Google"
});

module.exports = puppeteer;