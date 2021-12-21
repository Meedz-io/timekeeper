const User = require('../../models/user.model');
const cacheStorage = require('../../lib/cache-storage');
const { launchBrowser } = require('../../lib/browser');

const login = (page, user_id, password) => new Promise(async (resolve, reject) => {
    try {
        await page.goto('https://www.linkedin.com/uas/login', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(1000);
        await page.click('[data-control-name="ga-cookie.consent.accept.v3"]')
        console.log(user_id)
        await page.type('#username', user_id)
        await page.type('#password', password)
        await page.click('.login__form_action_container > button');
    } catch (error) {
        reject({
            message: 'Failed on interact with login page',
            user: user_id,
            url: await page.evaluate(() => document.location.href),
            ...error
        })
    }
    //page.on('console', consoleObj => console.log(consoleObj.text()));

    const url = await page.evaluate(() => document.location.href);

    if (url.startsWith('https://www.linkedin.com/feed/')) {
        const cookies = await page.cookies();

        resolve(cookies);
    } else {
        console.log('Need manual action to login')

        await page.waitForFunction(() =>
            document.location.href.startsWith('https://www.linkedin.com/feed/')
        ).catch(() => {
            reject({
                message: 'Failed to connect',
                url: url
            })
        })
    }
})

const checkAuth = async (page) => {
    await page.goto('https://www.linkedin.com/feed', { waitUntil: 'networkidle2' });

    const url = await page.evaluate(() => document.location.href);

    if (!url.startsWith('https://www.linkedin.com/feed/')) {
        console.log('Try to login');

        await login(page);

        if (!url.startsWith('https://www.linkedin.com/feed/' || !url.startsWith('https://www.linkedin.com/hp/'))) {
            console.log('Need manual action to login')
            await page.waitForFunction(() =>
                document.location.href.startsWith('https://www.linkedin.com/feed/')
                 || document.location.href.startsWith('https://www.linkedin.com/hp/')
            );

            const cookies = await page.cookies();

            console.log('Succesfull login!', cookies)
        }
    }
}

const importAccounts = async () => {
    const users = await User.find({ $or: [{ disabled: { $exists: false } }, { disabled: false }] });

    for (const user of users) {
        const hasSession = await new Promise(resolve =>
            cacheStorage.hget("user_session", user._id.toString(), (err, value) => {
                resolve(value && !JSON.parse(value).expired);
            }));

        if (!hasSession) {
            const browser = await launchBrowser();
            const page = await browser.newPage();

            await login(page, user.user_id, user.password)
                .then(cookies => {
                    cacheStorage.hset('user_session', user._id.toString(),
                        JSON.stringify({ cookies: cookies, expired: false }));
                }).catch(error => {
                    console.warn(error);
                })
            await browser.close();
        }
    }

    console.log('All users connected')
}

module.exports = { login, checkAuth, importAccounts };