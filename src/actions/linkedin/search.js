module.exports = async (page, criteria, maxResults) => {
    const url = searchCriteriatoLink(criteria);
    const profiles = [];

    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.click('[aria-label="Oui, les résultats de cette recherche sont utiles"]');

    await page.$$eval('.artdeco-pagination__pages > .artdeco-pagination__indicator > button > span', items => items.map(item => item.innerText))
        .then(async pages => {
            const numberOfPages = pages[pages.length - 1];

            scrapping(page)
                .then(data => profiles.push(data))

            const maxPage = maxResults && maxResults / 10 < numberOfPages && maxResults / 10 > 2
                ? Math.floor(maxResults / 10) + 1
                : numberOfPages;

            for (let currentPage = 2; currentPage <= maxPage; currentPage++) {
                await page.goto(url.concat('&', `page=${currentPage}`), { waitUntil: 'networkidle2' })
                    .catch(e => console.warn(e));
                await page.waitForTimeout(1000).then(() => {
                    scrapping(page, (currentPage === maxPage && maxResults) && maxResults % 10)
                        .then(data => profiles.push(data));
                });

                await page.waitForTimeout(1000);
            }
        })

    return profiles.flat(1);
}

const scrapping = (page, maxResults) => page.evaluate((maxResults) =>
    maxResults > 0
        ?
        Array.from(document.querySelectorAll('.reusable-search__result-container > .entity-result > .entity-result__item .entity-result__title-text .app-aware-link'))
            .splice(0, maxResults)
            .map(item => ({
                name: item.firstElementChild.firstElementChild.innerText,
                profile_url: item.getAttribute('href')
            }))
        :
        Array.from(document.querySelectorAll('.reusable-search__result-container > .entity-result > .entity-result__item .entity-result__title-text .app-aware-link'))
            .map(item => ({
                name: item.firstElementChild.firstElementChild.innerText,
                profile_url: item.getAttribute('href')
            }))
    , maxResults);


const searchCriteriatoLink = (criteria) => {
    let initialURL = "https://www.linkedin.com/search/results/people/?origin=SWITCH_SEARCH_VERTICAL&sid=GR%3A&";

    return `${initialURL}${criteria.join('&')}`;
}