const { launchBrowser } = require('../../lib/browser');
const getProfile = require('../../actions/linkedin/profile');
const { validationResult } = require('express-validator');
const Profile = require('../../models/profile.model');
const ProfileWorker = require('../../models/worker/profile.worker.model');

const { v4: uuidv4 } = require('uuid');
const logger = require('../../lib/logger');
const { getRandomSession } = require('../../helper/session');

const STORE_PROFILE_INTERVAL = 10;


const extractProfiles = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await getRandomSession().then(userSession => page.setCookie(...userSession.info.cookies));

    const url = await page.evaluate(() => document.location.href);

    const profileExtractorId = uuidv4();

    let profiles = [];
    const accounts = req.body.accounts.split(',').map(value => value.trim().replace(/^"(.*)"$/, '$1'));

    logger.log('info', `profileExtractor#${profileExtractorId}: Started..`);

    for (let i = 0; i < accounts.length; i++) {
        const account_id = accounts[i];
        await page.waitForTimeout(1000);

        profiles.push({ ...await getProfile(page, account_id), account_id });

        if (i % STORE_PROFILE_INTERVAL === 0) {
            saveProfiles(profiles);
            profiles = [];
        }
    }

    await browser.close();

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

const saveProfiles = (profiles) => Profile.find().where('account_id')
    .in(profiles.map(result => result.account_id))
    .exec((err, records) => {
        Profile.insertMany(profiles
            .filter(result => !records.some((record) => record.account_id === result.account_id))
            , (error, docs) => {
                console.log(profiles);
                return (docs ? {
                    new_profiles: docs.length,
                } : { error: error });
            })
    });

const getProfileWorkers = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const defaultMaxResults = 30;

    const data = await ProfileWorker.find()
        .where("account_id").exists(true)
        .limit(50);

    res.json(data.map(e => e.account_id));
}



module.exports = { extractProfiles, getProfileWorkers }