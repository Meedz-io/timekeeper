module.exports = async (page, criteria) => {
    const url = searchCriteriatoLink(criteria);
    const profiles = [];

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.on('console', consoleObj => console.log(consoleObj.text()));

    await page.click('[aria-label="Oui, les résultats de cette recherche sont utiles"]');

    await page.waitForSelector('.search-results-container', { visible: true })
        .then(async () => {
            await page.$$eval('.artdeco-pagination__pages > .artdeco-pagination__indicator > button > span', items => items.map(item => item.innerText))
                .then(async pages => {
                    const numberOfPages = pages[pages.length - 1];

                    page.evaluate(() => {
                        const items = [];
                        document.querySelectorAll('.reusable-search__result-container > .entity-result > .entity-result__item .entity-result__title-text .app-aware-link')
                            .forEach(item => items.push({
                                name: item.firstElementChild.firstElementChild.innerText,
                                url: item.getAttribute('href')
                            }));
                        return items;
                    }).then(data => profiles.push(data))

                    for (let currentPage = 2; currentPage <= numberOfPages; currentPage++) {
                        await page.goto(url.concat('&', `page=${currentPage}`), { waitUntil: 'networkidle2' })
                            .catch(e => console.warn(e))
                        await page.waitForTimeout(1000).then(() => {
                            page.evaluate(() => {
                                const items = [];
                                document.querySelectorAll('.reusable-search__result-container > .entity-result > .entity-result__item .entity-result__title-text .app-aware-link')
                                    .forEach(item => items.push({
                                        name: item.firstElementChild.firstElementChild.innerText,
                                        url: item.getAttribute('href')
                                    }));
                                return items;
                            }).then(data => profiles.push(data))
                        });

                        await page.waitForTimeout(1000);
                    }
                })
        })
    
    return profiles.flat(1);
}

const searchCriteriatoLink = (criteria) => {
    let initialURL = "https://www.linkedin.com/search/results/people/?origin=SWITCH_SEARCH_VERTICAL&sid=GR%3A&";

    return `${initialURL}${criteria.join('&')}`;
}