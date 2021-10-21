const { launchBrowser } = require('../../lib/browser');
const getProfile = require('../../actions/linkedin/profile');
const login = require('../../actions/linkedin/login');
const { validationResult } = require('express-validator');
const Profile = require('../../models/profile.model');


module.exports = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await login(page);

    const url = await newPage.evaluate(() => document.location.href);

    if (url.startsWith('https://www.linkedin.com/feed/')) {

        const profiles = [];

        for (let account_id of req.body.accounts) {
            await page.waitForTimeout(1000);

            profiles.push({ ...await getProfile(page, account_id), account_id });
        }

        await browser.close();

        console.log(profiles);

        Profile.find().where('account_id')
            .in(profiles.map(result => result.account_id))
            .exec((err, records) => {
                Profile.insertMany(profiles
                    .filter(result => !records.some((record) => record.account_id === result.account_id))
                    , (error, docs) => {
                        res.json(docs ? {
                            new_profiles: docs.length,
                        } : { error: error });
                    })
            });

    }
}