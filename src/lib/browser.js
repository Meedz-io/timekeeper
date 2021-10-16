const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

puppeteer.defaultArgs({
    headless: process.env.NODE_ENV === 'production', 
    args: ['--headless']
});

module.exports = puppeteer;