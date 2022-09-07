const cheerio = require('cheerio');

module.exports = async (page, account_id) => {
    const profileURL = "https://www.linkedin.com/in/".concat(account_id);


    let profileDetails, extraDetails;

    try {
        await page.goto(profileURL, { waitUntil: 'networkidle2' });

        await page.waitFor(5000);
        await page.evaluate(() => document.querySelector('*').outerHTML);

        await page.on('console', async (msg) => {
            const msgArgs = msg.args();
            for (let i = 0; i < msgArgs.length; ++i) {
                console.log(await msgArgs[i].jsonValue());
            }
        });

        return await page.evaluate(() => {
            const moreExperience = document.querySelector(`#experience-section > div > button`);
            const moreEducation = document.querySelector(`#education-section > div > button`);

            if (moreExperience)
                moreExperience.click();

            if (moreEducation)
                moreEducation.click();

            const infos = document.querySelector('.profile-detail .pv-about-section .inline-show-more-text');

            const showMoreText = Array.from(document.querySelectorAll('.inline-show-more-text__button'));

            if (showMoreText.length > 0) {
                showMoreText.forEach((button) => button.click());
            }

            return infos && infos.innerText;
        }).then(async (infos) => {
            profileDetails = {
                name: await getName(page),
                picture_url: await getProfilePicture(page),
                profile_title: await getProfileTitle(page),
                location: await getLocation(page),
                profile_infos: infos,
                experiences: await getExperienceList(page),
                education: await getEducationList(page),
                languages: await getLanguageList(page)
            };
    
            extraDetails = await getExtraDetails(page)
    
            return { ...profileDetails, contact_details: extraDetails };
        })
    } catch (e) {
        return { error: e, ...profileDetails, contact_details: extraDetails }
    }

}

const getName = (page) => page
    .$eval(".ph5 .pv-text-details__left-panel .text-heading-xlarge", el => el.innerText);

const getProfilePicture = (page) => page
    .$eval(".ph5 .pv-top-card--photo img", el => el.getAttribute("src"));

const getProfileTitle = (page) => page
    .$eval(".ph5 .pv-text-details__left-panel .text-body-medium", el => el.innerText);

const getLocation = (page) => page
    .$eval(".ph5 > .mt2 > .pb2 span:nth-child(1)", el => el.innerText);

const getExperienceList = (page) => page.$$eval(`#experience-section .pv-profile-section__section-info > li`,
    result => result.map((exp, i) => {
        const header = exp.querySelector("a .pv-entity__summary-info");
        const jobList = exp.querySelector("section > .pv-entity__position-group");

        const showMoreJobs = (exp) => {
            const moreJobs = exp.querySelector(".pv-entity__paging button > li-icon[type='chevron-down-icon']");

            if (moreJobs) {
                moreJobs.click();
                showMoreJobs(exp);
            }
        }

        showMoreJobs(exp);

        return jobList ?
            Array.from(exp.querySelectorAll("section > .pv-entity__position-group > li")).map(job => {
                return ({
                    job_title: job.querySelector(".pv-entity__summary-info-v2 h3 span:nth-child(2)")
                        && job.querySelector(".pv-entity__summary-info-v2 h3 span:nth-child(2)").innerText,
                    company: exp.querySelector("section > div > a .pv-entity__company-summary-info > h3 > span:nth-child(2)")
                        && exp.querySelector("section > div > a .pv-entity__company-summary-info > h3 > span:nth-child(2)").innerText,
                    period: job.querySelector(".pv-entity__summary-info-v2 .pv-entity__date-range span:nth-child(2)")
                        && job.querySelector(".pv-entity__summary-info-v2 .pv-entity__date-range span:nth-child(2)").innerText,
                    description: job.querySelector(".pv-entity__extra-details .inline-show-more-text") &&
                        job.querySelector(".pv-entity__extra-details .inline-show-more-text").innerText,
                    location: job.querySelector(".pv-entity__summary-info-v2 .pv-entity__location span:nth-child(2)")
                        && job.querySelector(".pv-entity__summary-info-v2 .pv-entity__location span:nth-child(2)").innerText
                })
            })
            : {
                job_title: header.querySelector("h3") &&
                    header.querySelector("h3").innerText,
                company: header.querySelector(".pv-entity__secondary-title") &&
                    header.querySelector(".pv-entity__secondary-title").innerText,
                contract_type: header.querySelector(".pv-entity__secondary-title span") &&
                    header.querySelector(".pv-entity__secondary-title span").innerText,
                period: header.querySelector(".pv-entity__date-range span:nth-child(2)") &&
                    header.querySelector(".pv-entity__date-range span:nth-child(2)").innerText,
                description: exp.querySelector(".pv-entity__extra-details .inline-show-more-text") &&
                    exp.querySelector(".pv-entity__extra-details .inline-show-more-text").innerText,
                location: header.querySelector(".pv-entity__location span:nth-child(2)") &&
                    header.querySelector(".pv-entity__location span:nth-child(2)").innerText
            }
    }).flat(1));

const getEducationList = (page) => page.$$eval(`#education-section ul li`
    , result => result.map(school => {
        const header = school.querySelector("a .pv-entity__summary-info");

        return {
            school_name: header.querySelector(".pv-entity__school-name") &&
                header.querySelector(".pv-entity__school-name").innerText,
            diploma: header.querySelector(".pv-entity__secondary-title .pv-entity__comma-item") &&
                header.querySelector(".pv-entity__secondary-title .pv-entity__comma-item").innerText,
            period: header.querySelector(".pv-entity__dates span:nth-child(2)") &&
                header.querySelector(".pv-entity__dates span:nth-child(2)").innerText
        }
    }));

const getLanguageList = (page) => page.$$eval(`#languages-expandable-content li`,
    result => result.map(language => language.innerText));

const getExtraDetails = async (page) => {
    await page.click(".ph5 .pv-text-details__left-panel a");

    await page.waitForSelector('.pv-contact-info__contact-type');

    return await page.evaluate(() => ({
        email: document.querySelector(".pv-contact-info__contact-type .ci-email")
            && document.querySelector(".pv-contact-info__contact-type .ci-email a").innerText,
        phone_number: document.querySelector(".pv-contact-info__contact-type .ci-phone")
            && document.querySelector(".pv-contact-info__contact-type .ci-phone li span:nth-child(1)").innerText,
    }))
}