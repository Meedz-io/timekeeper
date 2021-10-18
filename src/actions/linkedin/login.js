module.exports = async (page) => {
    await page.goto('https://www.linkedin.com', { waitUntil: 'networkidle2' });
    await page.click('[data-control-name="ga-cookie.consent.accept.v3"]')
    await page.type('#session_key', process.env.LINKEDIN_ID)
    await page.type('#session_password', process.env.LINKEDIN_PASS)
    await page.click('[data-tracking-control-name="homepage-basic_signin-form_submit-button"]');
    // page.on('console', consoleObj => console.log(consoleObj.text())); DEBUG MODE
}