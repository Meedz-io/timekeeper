const { launchBrowser } = require('../../lib/browser');
const search = require('../../actions/linkedin/search');
const logger = require('../../lib/logger');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const ProfileWorker = require('../../models/worker/profile.worker.model');

const { getRandomSession } = require('../../helper/session');
const { taskTypes, taskStatus } = require('../../helper/tasks');
const cacheStorage = require('../../lib/cache-storage');

const searchCriteriaSchema = {
    people: {
        company: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        keywords: { type: 'string' },
        network: ['F', 'S', '0'],
        industry: { type: 'array' },
        profileLanguage: ['fr', 'en'],
        serviceCategory: { type: 'array' },
        schoolFilter: { type: 'array' },
        geoUrn: { type: 'array' },
        contactInterest: { type: 'array' },
        title: { type: 'string' },
        schoolFreetext: { type: 'string' },
        pastCompany: { type: 'string' },
        currentCompany: { type: 'array' }
    }
};

const isValidCriteria = (name, value) => {
    if (!searchCriteriaSchema.people[name] || typeof value === "string" && value.trim().length === 0)
        return false;

    if (searchCriteriaSchema.people[name].type) {
        if ((searchCriteriaSchema.people[name].type === 'array' && value.startsWith('[') && value.endsWith(']'))
            || typeof value === searchCriteriaSchema.people[name].type)
            return true;
    } else if (Array.isArray(searchCriteriaSchema.people[name])
        && searchCriteriaSchema.people[name].some(value)) {
        return true;
    }
}

const newSearch = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const maxResults = req.query.maxResults;

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await getRandomSession().then(userSession => page.setCookie(...userSession.info.cookies));

    const searchCriteria = await Object.getOwnPropertyNames(req.body)
        .filter(property => isValidCriteria(property, req.body[property]))
        .map(property => `${property}=${encodeURIComponent(req.body[property])}`);

    const searchId = uuidv4();

    logger.log('info', `search#${searchId}: Started..`);
    const newTask = {
        message: 'Searching tasks launched',
        type: taskTypes['S'],
        status: taskStatus['I'],
        maxResults: maxResults && maxResults,
        criterias: searchCriteria
    }

    res.json({
        id: searchId.toString(),
        ...newTask
    })
    cacheStorage.hset('tasks', searchId.toString(), JSON.stringify(newTask))
    const searchResults = await search(page, searchCriteria, searchId, maxResults && maxResults);

    await browser.close();

    ProfileWorker.find().where('profile_url')
        .in(searchResults.map(result => result.profile_url))
        .exec((err, records) => {
            ProfileWorker.insertMany(searchResults
                .filter(result => !records.some((record) => record.profile_url === result.profile_url))
                .map(result => ({ ...result, searchCriteria, searchId }))
                , (error, docs) => {
                    cacheStorage.hset('tasks', searchId.toString(), JSON.stringify({
                        message: 'Search is over successfully',
                        type: 'search',
                        new_profiles: docs.length,
                        status: taskStatus['S'],
                        maxResults: maxResults && maxResults,
                        criterias: searchCriteria
                    }));
                })
        });
}

const getStatus = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const searchId = req.params.id;

    const searchStatus = await cacheStorage.hget('tasks', searchId)

    res.json(JSON.parse(searchStatus));

}

module.exports = { newSearch, getStatus }