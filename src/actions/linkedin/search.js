const logger = require('../../lib/logger');
const cacheStorage = require('../../lib/cache-storage');

module.exports = async (page, criteria, searchId, maxResults) => {
    const url = searchCriteriatoLink(criteria);
    const profiles = [];

    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.on('console', consoleObj => console.log(consoleObj.text()));

    await page.click('[aria-label="Oui, les résultats de cette recherche sont utiles"]');

    await page.$$eval('.artdeco-pagination__pages > .artdeco-pagination__indicator > button > span', items => items.map(item => item.innerText))
        .then(async pages => {
            const numberOfPages = pages[pages.length - 1];

            logger.log('info', `search#${searchId}: started scrapping..`);
            scrapping(page, searchId)
                .then(data => data.map(el => {
                    logger.log('info', el.message);

                    if (el.error) {
                        logger.log('warn', el.error)
                    }

                    return { ...el, message: undefined }
                }))
                .then(async data => {
                    profiles.push(data)
                })

            const maxPage = maxResults && maxResults / 10 < numberOfPages
                ? Math.floor(maxResults / 10) + 1
                : numberOfPages;

            for (let currentPage = 2; currentPage <= maxPage; currentPage++) {
                await page.goto(url.concat('&', `page=${currentPage}`), { waitUntil: 'networkidle2' })
                    .catch(e => console.warn(e));
                await page.waitForTimeout(1000).then(async () => {
                    const searchFailed = await page.$('#idProductType');

                    if (!searchFailed) {
                        console.log('profiles length', profiles.flat(1).length);
                        scrapping(page, searchId, (currentPage === maxPage && maxResults) && maxResults % 10)
                            .then(data => data.map(el => {
                                //logger.log('info', el.message);

                                if (el.error) {
                                    logger.log('warn', el.error.replace('$page', currentPage))
                                }

                                console.log(el, el.name);

                                return { ...el, message: undefined, error: undefined }
                            }))
                            .then(async data => {
                                console.log(data.length, data[0]);
                                profiles.push({...data, searchId: searchId.toString()})

                                const searchStatus = await cacheStorage.hget('tasks', searchId.toString())

                                cacheStorage.hset('tasks', searchId.toString(), JSON.stringify({ ...JSON.parse(searchStatus), progression: `${currentPage}/${maxPage} pages` }))
                            });
                    } else {
                        logger.log('warn', `search#${searchId}: Scrapping of page ${currentPage} failed, no results, server error.`)
                    }
                });

                await page.waitForTimeout(1000);
            }
        })

    return profiles.flat(1);
}

const scrapping = (page, searchId, maxResults) => page.evaluate((URL, searchId, maxResults) => {
    console.log("maxResults", maxResults);
    const scrappingResult = Array.from(document.querySelectorAll('.reusable-search__result-container > .entity-result > .entity-result__item .entity-result__title-text .app-aware-link'))
        .map((item, i) => {
            console.log(item, item.firstElementChild, item.firstElementChild && item.firstElementChild.firstElementChild.innerText)
            return !item.firstElementChild || !item.firstElementChild.firstElementChild
            ? { error: `search#${searchId}: Scrapping ${i+1}/$pagep failed` }
            : ({
                message: `search#${searchId}: Scrapping of ${item.getAttribute('href').split("?")[0].split('/').pop()}`,
                name: item.firstElementChild.firstElementChild.innerText,
                profile_url: item.getAttribute('href'),
                account_id: item.getAttribute('href').split("?")[0].split('/').pop()
            })
        }
        )
    return maxResults > 0 ? scrappingResult.splice(0, maxResults) : scrappingResult;
}, URL, searchId, maxResults);

const searchCriteriatoLink = (criteria) => {
    let initialURL = "https://www.linkedin.com/search/results/people/?origin=SWITCH_SEARCH_VERTICAL&sid=GR%3A&";

    return `${initialURL}${criteria.join('&')}`;
}