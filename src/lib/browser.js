const puppeteer = require('puppeteer-extra');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());

const launchBrowser = (...param) => process.env.NODE_ENV === 'development'
    ? puppeteer.launch({
        headless: false,
        executablePath: process.env.BROWSER_EXECUTABLE_PATH,
        slowMo: 100,
        args: [
            '--shm-size=1gb'
        ],
        ...param
    })
    : puppeteer.connect({
        browserWSEndpoint: `ws://browserless:${process.env.BROWSERLESS_PORT}/`,
        slowMo: 100,
        ...param
    });

module.exports = { puppeteer, launchBrowser };