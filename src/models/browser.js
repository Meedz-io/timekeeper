const puppeteer = require('puppeteer');

puppeteer.defaultArgs({
    headless: process.env.NODE_ENV === 'production', 
    args: ['--headless'],
    userDataDir: process.env.BROWSER_PATH
});

module.exports = puppeteer;