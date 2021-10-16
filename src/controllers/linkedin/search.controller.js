const puppeteer = require('../../lib/browser');
const login = require('../../actions/linkedin/login');
const search = require('../../actions/linkedin/search');

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
    if (!searchCriteriaSchema.people[name] || typeof value !== 'string' || value.trim().length === 0)
        return false;

    if (searchCriteriaSchema.people[name].type) {
        if (searchCriteriaSchema.people[name].type === 'array' && Array.isArray(value)
            || typeof value === searchCriteriaSchema.people[name].type)
            return true;
    } else if (Array.isArray(searchCriteriaSchema.people[name]) 
        && searchCriteriaSchema.people[name].some(value)) {
        return true;
    }
}

module.exports = async (req, res) =>  {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: process.env.BROWSER_EXECUTABLE_PATH,
        slowMo: 100
    });
    const page = await browser.newPage();
    await login(page);

    const searchCriteria = await Object.getOwnPropertyNames(req.body)
    .filter(property => isValidCriteria(property, req.body[property]))
    .map(property => `${property}=${encodeURIComponent(req.body[property])}`)

    const searchResults = await search(page, searchCriteria);

    console.log(searchResults);

    res.send(searchResults)

    await browser.close();
}