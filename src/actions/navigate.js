const puppeteer = require('../models/browser');
const navigateTo = (url, ...params) => new Promise(async (resolve, reject) => {
    if(!isValidURL(url))
        reject('Invalid URL');

    try {
        const browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://browserless:3000',
            slowMo: 1000
        });
        const page = await browser.newPage();
        await page.goto(url);

        const data = await page.evaluate(() => {
            return document;
        })

        browser.close();
        resolve(data);
    } catch (error) {
        reject(error);
    }
});

const isValidURL = (str) => new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i').test(str) // fragment locator

module.exports = { navigateTo };