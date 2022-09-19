const Apify = require('apify');

const {
    utils: { log },
} = Apify;
const { applyFunction, saveScreenshot } = require('./utils');

exports.SEARCH_PAGE = async (countryCode, page, request, query, requestQueue, maxPostCount, evaledFunc) => {
    // CHECK FOR SELECTOR
    let { savedItems, pageNumber } = request.userData;
    const { hostname } = request.userData;

    await page.waitForSelector('div.sh-pr__product-results');

    const resultsLength = await page.evaluate(() => {
        return document.querySelector('div.sh-pr__product-results').children.length;
    });


    // check HTML if page has no results
    if (resultsLength === 0) {
        log.warning('The page has no results. Check dataset for more info.');

        await Apify.pushData({
            '#debug': Apify.utils.createRequestDebugInfo(request),
        });
    }


    log.info(`Found ${resultsLength} products on the page.`);
    // eslint-disable-next-line no-shadow

    await saveScreenshot(page);

    const data = await page.evaluate(
        (countryCode, maxPostCount, query, savedItems) => {

            // nodes with items
            let results = Array.from(document.querySelectorAll('.sh-dlr__list-result'));
            if (results.length === 0) results = Array.from(document.querySelectorAll('.sh-dlr__content'));
            // limit the results to be scraped, if maxPostCount exists
            if (maxPostCount) {
                results = results.slice(0, maxPostCount - savedItems);
            }

            // eslint-disable-next-line no-shadow
            const data = [];
            // ITERATING NODES TO GET RESULTS
            for (let i = 0; i < results.length; i++) {
                // Please pay attention that "merchantMetrics" and "reviewsLink" were removed from the  "SEARCH" page.
                const item = results[i];
                // KEYS OF OUTPUT OBJ

                // console.log("Product", i)

                const type = 'result'

                const title = item.querySelector('h3') ? item.querySelector('h3') : null;

                const productName = title?.textContent ?? null;

                // const productLinkAnchor = item.querySelector('a[href*="shopping/product/"]')
                //     ? item.querySelector('a[href*="shopping/product/"]')
                //     : null;
                // const productLink = productLinkAnchor ? productLinkAnchor.href : null;

                // const price = item.querySelector('div[data-sh-or="price"] div > span > span')?.textContent ?? null;

                const description = item.querySelectorAll('div.hBUZL')[1]?.textContent ?? null;

                // const merchantName = item.querySelector('div[data-sh-or="price"]')?.nextSibling?.textContent ?? null;

                // const merchantLink = item.querySelector('div[data-sh-or="price"]')?.parentElement?.parentElement?.href ?? null;

                // const idArray = productLink ? productLink.split('?')[0].split('/') : null;
                // const shoppingId = idArray ? idArray[idArray.length - 1] : null;

                // div.fAcMNb => badge spécial
                // span.S7D1Ud => retrait magasin / drive
                const elementBadgeDrive = item.querySelector('span.S7D1Ud')
                const badgeDrive = (elementBadgeDrive) ? true : false
                
                // span.Ib8pOd => PROMO / Prix en baisse
                const elementBadgePromo = item.querySelector('span.Ib8pOd')
                const badgePromo = (elementBadgePromo) ? true : false
                //      Ib8pOd

                console.log("Item ;", item)
                console.log("Item div ;", item.querySelector('div.tDoYpc div'))

                let reviewsScore = 0
                let reviewsCount = 0
                let elemStr = ''
                let elemStrHTML = ''
                let scoreReviewStr = ''
                if (item.querySelector('div.tDoYpc div')) {

                    // Check if style element :
                    let elementReviews = item.querySelector('div.tDoYpc div')

                    // const styleElem = elementReviews.querySelector(':scope > style')
                    // if (styleElem) {
                    //     elemReviews = elemReviews.querySelector(':scope > div')
                    // }

                    const avg = item.querySelector('.Rsc7Yb') ? item.querySelector('.Rsc7Yb').textContent.replace(',', '.') : '0'
                    reviewsScore = parseFloat(avg)

                    // Remove elements :
                    elemStr = elementReviews.textContent
                    elemStrHTML = elementReviews.innerHTML
                    const elementAvg = elementReviews.querySelector(':scope > span.Rsc7Yb')
                    if (elementAvg)
                        elementReviews.removeChild(elementAvg)
                    const subElemReview = elementReviews.querySelector(':scope > div.qSSQfd')
                    if (subElemReview)
                        elementReviews.removeChild(subElemReview)
                    scoreReviewStr = elementReviews.textContent
                    let scoreReviewStrTemp = scoreReviewStr.replace(/\s+/g, '').replace(/,/g, '').replace(/\./g, '')
                    reviewsCount = parseInt(scoreReviewStrTemp)


                }

                // FINAL OUTPUT OBJ
                const output = {
                    countryCode,
                    query,
                    type,
                    productName,
                    // productLink,
                    // price,
                    description,
                    // merchantName,
                    // merchantLink,
                    // shoppingId,
                    reviewsScore,
                    reviewsCount,
                    // elemStr,
                    // elemStrHTML,
                    // scoreReviewStr,
                    badgeDrive,
                    badgePromo,
                    positionOnSearchPage: i + 1,
                    // productDetails: item.querySelectorAll('.translate-content')[1]?.textContent.trim(),
                };

                data.push(output);
            }


            // Ads :
            // nodes with items
            let arrAdContainer = Array.from(document.querySelectorAll('.GhTN2e'))
            if (arrAdContainer && arrAdContainer.length > 0) {

                for (let iAdContainer=0; iAdContainer<arrAdContainer.length; iAdContainer++) {

                    let ads = Array.from(arrAdContainer[iAdContainer].querySelectorAll('.KZmu8e'));
    
                    // ITERATING NODES TO GET ADS
                    for (let i = 0; i < ads.length; i++) {
                        // Please pay attention that "merchantMetrics" and "reviewsLink" were removed from the  "SEARCH" page.
                        const item = ads[i];
                        // KEYS OF OUTPUT OBJ
    
                        // console.log("Ad", i)
    
                        const type = 'ad'
    
                        const title = item.querySelector('.sh-np__product-title') ? item.querySelector('.sh-np__product-title') : null;
    
                        const productName = title?.textContent ?? null;
    
                        // const productLinkAnchor = item.querySelector('a[href*="shopping/product/"]')
                        //     ? item.querySelector('a[href*="shopping/product/"]')
                        //     : null;
                        // const productLink = productLinkAnchor ? productLinkAnchor.href : null;
    
                        // const price = item.querySelector('div[data-sh-or="price"] div > span > span')?.textContent ?? null;
    
                        // const description = item.querySelectorAll('div.hBUZL')[1]?.textContent ?? null;
    
                        // const merchantName = item.querySelector('div[data-sh-or="price"]')?.nextSibling?.textContent ?? null;
    
                        // const merchantLink = item.querySelector('div[data-sh-or="price"]')?.parentElement?.parentElement?.href ?? null;
    
                        // const idArray = productLink ? productLink.split('?')[0].split('/') : null;
                        // const shoppingId = idArray ? idArray[idArray.length - 1] : null;
    
                        let reviewsScore = 0
                        let reviewsCount = 0
    
                        console.log("Ad ;", item)
                        console.log("Ad div ;", item.querySelector('div.U6puSd div'))
    
                        if (item.querySelector('div.U6puSd div')) {
    
                            const elemReviews = item.querySelector('div.U6puSd div')
    
                            const reviewStr = elemReviews.querySelector('div.qSSQfd.uqAnbd').getAttribute('aria-label')
                            const numbers = reviewStr.match(/\d+\.?\d*/g)
                            const reviewsScore = parseFloat(numbers[0])
    
                            // Le nb reviews est le 
                            const elemTextNbReviews = elemReviews.querySelector('div.U6puSd div span').textContent.replace(/\s+/g, '').replace(/[\(\)]/gi, '')
                            reviewsCount = parseFloat(elemTextNbReviews)
                        }
    
                        // const reviewsScore = item.querySelector('div[aria-label*="product reviews"] span')?.textContent ?? null;
                        // const reviewsCount = item.querySelector('div[aria-label*="product reviews"]')
                        //     ? item.querySelector('div[aria-label*="product reviews"]').getAttribute('aria-label').split(' ')[0]
                        //     : null;
    
                        // FINAL OUTPUT OBJ
                        const output = {
                            countryCode,
                            query,
                            type,
                            productName,
                            // productLink,
                            // price,
                            description: '',
                            // merchantName,
                            // merchantLink,
                            // shoppingId,
                            reviewsScore,
                            reviewsCount,
                            positionOnSearchPage: iAdContainer+'/'+(i + 1),
                            // productDetails: item.querySelectorAll('.translate-content')[1]?.textContent.trim(),
                        };
    
                        data.push(output);
                    }
                }

            }

            return data;
        },
        countryCode,
        maxPostCount,
        query,
        savedItems,
    );


    // ITERATING ITEMS TO EXTEND WITH USERS FUNCTION
    for (let item of data) {
        if (evaledFunc) {
            item = await applyFunction(page, evaledFunc, item);
        }

        await Apify.pushData(item);
        savedItems++;
    }
    log.info(`${Math.min(maxPostCount, resultsLength)} items on the page were successfully scraped.`);
};
