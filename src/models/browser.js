const puppeteer = require('puppeteer');

puppeteer.defaultArgs({
    headless: process.env.NODE_ENV === 'production', 
    args: ['--headless']
});

module.exports = puppeteer;