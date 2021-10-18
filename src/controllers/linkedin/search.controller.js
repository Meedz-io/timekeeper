const { launchBrowser } = require('../../lib/browser');
const login = require('../../actions/linkedin/login');
const search = require('../../actions/linkedin/search');
const { validationResult } = require('express-validator');

const ProfileWorker = require('../../models/worker/profile.worker.model');

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

module.exports = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty())
        return res.status(422).json({ errors: errors.array() });

    const maxResults = req.query.maxResults;

    const browser = await launchBrowser();
    const page = await browser.newPage();

    await login(page);

    const searchCriteria = await Object.getOwnPropertyNames(req.body)
        .filter(property => isValidCriteria(property, req.body[property]))
        .map(property => `${property}=${encodeURIComponent(req.body[property])}`);

    const searchResults = await search(page, searchCriteria, maxResults && maxResults);

    await browser.close();

    ProfileWorker.find().where('profile_url')
        .in(searchResults.map(result => result.profile_url))
        .exec((err, records) => {
            ProfileWorker.insertMany(searchResults
                .filter(result => !records.some((record) => record.profile_url === result.profile_url))
                .map(result => ({ ...result, searchCriteria: searchCriteria }))
                , (error, docs) => {
                    res.json({
                        new_profiles: docs.length,
                    });
                })
        });
}