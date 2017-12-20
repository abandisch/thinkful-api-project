"use strict";

/**
 * CryptoCurrency - Class for a CryptoCurrency
 * @param name - Full name of the Cryptocurrency
 * @param symbol - Ticker (or stock) symbol of the Cryptocurrency
 * @param rank - market cap rank
 * @param iconPATH - URL to the Cryptocurrency icon
 * @param marketData - Market Data object
 * @constructor
 */
function CryptoCurrency(name, symbol, rank, marketData, iconPATH) {
    this.cryptoName = name;
    this.tickerSymbol = symbol;
    this.rank = rank;
    this.iconPATH = !!iconPATH ? iconPATH : '';
    this.marketData = !!marketData ? marketData : null;
}

/**
 * ApiQuery - class to hold the API query details
 * @param apiURL - URL of the API
 * @param queryData - object holding query information
 * @param dataType - JSON or JSONP, defaults to json
 * @param successCallback - function with what to do on success
 * @param failMessage - message to display on fail
 * @param timeout - API connection timeout - defaults to 10 seconds
 */
function ApiQueryParams(apiURL, queryData, successCallback, failMessage, dataType, timeout) {
    this.url = apiURL;
    this.queryData = queryData;
    this.successCallback = successCallback;
    this.failMessage = failMessage;
    this.dataType = !!dataType ? dataType : 'json';
    this.timeout = !!timeout ? timeout : 10;
}

// JSON results from each API used for testing/development, so I don't spam the API's when testing/developing
const TEST_CoinmarketcapAPIURL = 'resources/test-json/coinmarketcap.json';
const TEST_NewsorgAPIURL = 'resources/test-json/newsapi.json';
const TEST_RedditAPIURL = 'resources/test-json/reddit.json';

/**
 * Object to manage API requests and data
 */
const apiApp = {
    cryptocurrencyList: [],
    newsArticleList: [],
    redditPostList: [],
    cryptocompareData: {},
    //cryptocompareAPIURL: 'https://min-api.cryptocompare.com/data/all/coinlist',
    cryptocompareAPIURL: 'assets/js/cryptocompare.json', // Pre-downloaded this, since I only need image URL's
    // coinmarketcapAPIURL: 'https://api.coinmarketcap.com/v1/ticker/',
    coinmarketcapAPIURL: TEST_CoinmarketcapAPIURL,
    // newsapiorgAPIURL: 'https://newsapi.org/v2/everything',
    newsapiorgAPIURL: TEST_NewsorgAPIURL,
    // redditAPIURL: 'https://www.reddit.com/search.json',
    redditAPIURL: TEST_RedditAPIURL,
    currentCrypto: null,
    callAPI: function(apiQueryData) {
        // Should execute the Ajax call to the API URL and provide any query data
        // Should execute the success call back if successful
        // Should alert the user if Ajax request was not successful
        $.ajax({
            url: apiQueryData.url,
            data: apiQueryData.queryData,
            dataType: apiQueryData.dataType,
            type: 'GET'
        })
        .done(function(apiData) {
            // Call the callback function with the results of teh API query
            apiQueryData.successCallback(apiData);
        })
        .fail(function() {
            // Let the user know something went wrong.
            alert(`${apiQueryData.failMessage}`);
        });
    },
    createCryptoCurrency: function (cryptoObj) {
        // Create the CryptoCurrency object from coinmarketcap.com API json result object
        const {price_usd, price_btc, market_cap_usd} = cryptoObj;
        const volume_24h_usd = cryptoObj['24h_volume_usd'];
        let crypto = new CryptoCurrency(cryptoObj.name, cryptoObj.symbol, cryptoObj.rank, {price_usd, price_btc, market_cap_usd, volume_24h_usd});

        // Set the URL of the crypto icon - there are special cases due to inconsistent Symbol usage between Coinmarketcap and Cryptocompare
        // Only taking care of IOTA, since it's in top ten market cap, rest will get a generic icon if there is no one to one mapping between Coinmarketcap and Cryptocompare
        if (cryptoObj.symbol === 'MIOTA') {
            crypto.iconPATH = `https://www.cryptocompare.com/${this.cryptocompareData["IOT"].ImageUrl}`;
        } else {
            crypto.iconPATH = !!this.cryptocompareData[cryptoObj.symbol] ? `https://www.cryptocompare.com${this.cryptocompareData[cryptoObj.symbol].ImageUrl}` : 'assets/images/generic-icon.jpg';
        }
        return crypto;
    },
    fetchCoinData: function (apiViewCallback) {
        // Should query coinmarketcap.com API for the top ten cryptos
        // Should create a CryptoCurrency object for each
        // Should populate the cryptocurrencyList array with all ten CryptoCurrency objects
        const apiQueryParams = new ApiQueryParams(
            this.coinmarketcapAPIURL,
            { limit: 10 },
            (coinmarketcapApiData) => {
                this.cryptocurrencyList = coinmarketcapApiData.map(this.createCryptoCurrency, this);
                apiViewCallback();
            },
            'Unable to fetch coin data from coinmarketcap.com API. Please try again later.'
        );
        this.callAPI(apiQueryParams);
    },
    initCryptoCurrencyList: function (apiViewCallback) {
        // Should query Cryptocompare.com to get crypto data, which includes images for each crypto (the only reason to query this API)
        // Then should call the fetchCoinData, which will query coinmarketcap.com for crypto market data
        // That callback function should build the array of CryptoCurrencies and then call apiViewCallback
        this.callAPI(new ApiQueryParams(
                        this.cryptocompareAPIURL,
                        { /* no parameters */ },
                        (cryptocompareApiData) => {
                            this.cryptocompareData = cryptocompareApiData.Data;
                            this.fetchCoinData(apiViewCallback)
                        },
                        'Unable to fetch cryptocurrency list from cryptocompare.com API. Please try again later.'
                    ));

    },
    getCrypto: function (symbol) {
        // Should check if this.currentCrypto is null or the symbol that is required is not the currentCrypto
        // Find the required crypto and return that
        // Otherwise just return the currentCrypto
        if (this.currentCrypto === null || this.currentCrypto.tickerSymbol !== symbol) {
            this.currentCrypto = this.cryptocurrencyList.filter(function (crypto) {
                return crypto.tickerSymbol === symbol;
            })[0];
            return !!this.currentCrypto ? this.currentCrypto : null;
        }
        return this.currentCrypto;
    },
    fetchNewsHeadlines: function (cryptoObject, callback) {
        // Should query newsapi.org for news headlines for the given crypto
        // Should execute the callback (which should display the news headlines on the page
        this.callAPI(new ApiQueryParams(
            this.newsapiorgAPIURL,
            {
            q: `crypto AND (${cryptoObject.cryptoName} OR ${cryptoObject.tickerSymbol})`,
                sources: 'abc-news,australian-financial-review,crypto-coins-news,bloomberg,techradar,techcrunch,reuters,reddit-r-all,news-com-au,nbc-news,info-money,hacker-news,google-news,fortune,financial-times,financial-post,engadget,cnn,cnbc,cbs-news,buzzfeed,cbc-news,business-insider-uk,bbc-news,the-next-web,wired,the-washington-post',
                sortBy: 'publishedAt',
                apiKey: 'c148de8ea6b14e0da2a271e4b50f0f63',
                language: 'en',
                page: 1 // Track this and increment to 'load more' - will add newsarrayindex, check if that is > 20, if so increment the page
            },
            (resultsData) => {
                this.newsArticleList = resultsData.articles;
                callback(this.newsArticleList);
            },
            'cannot load data from newsapi.org'
        ));
    },
    createRedditPostObject: function (postObjData) {
        const { domain, num_comments, permalink, subreddit_name_prefixed, is_self, title, url } = postObjData.data;
        let redditPostObject = { domain, num_comments, permalink, subreddit_name_prefixed, is_self, title, url };
        redditPostObject.showLocal = false;

        // Set the URL of the image. If it's a self post use default reddit logo, else use the image URL provided by the API
        if (redditPostObject.is_self || postObjData.data.thumbnail === 'default') {
            redditPostObject['thumbnailURL'] = 'assets/images/default-r-logo.png';
        } else {
            redditPostObject['thumbnailURL'] = postObjData.data.thumbnail;
        }

        if (redditPostObject.is_self) {  // Self post
            redditPostObject.showLocal = true;
            redditPostObject.selfText = postObjData.data.selftext.replace(/"/g, '&quot;');
        }

        if (redditPostObject.domain === 'i.redd.it') { // image post
            redditPostObject.showLocal = true;
        }
        return redditPostObject;
    },
    fetchRedditPosts: function (cryptoObject, callback) {
        // Should query reddit.com for posts related to the given crypto
        // Should execute the callback (which should display the reddit posts on the page)
        this.callAPI(new ApiQueryParams(
            this.redditAPIURL,
            {
                q: `${cryptoObject.cryptoName}`,
                limit: 5,
                sr_detail: false,
                sort: 'relevance',
                restrict_sr: true,
                t: 'week'
            },
            (redditAPIData) => {
                // Process the results and extract only what is needed from JSON
                this.redditPostList = redditAPIData.data.children.map(this.createRedditPostObject);
                callback(this.redditPostList);
            },
            'cannot load data from reddit.com'
        ));
    }
};

/**
 * Object to control the view of the app
 */
const apiView = {
    initMainPage: function () {
        apiApp.initCryptoCurrencyList(function () {
            // Setup top ten list on main page
            // Show 'loading' text and remove it once the load is complete
            let liElement;
            let topTenListHTML = '';
            for (let i = 0; i < 10; i++) {
                liElement = `<li>
                                <a href="#" data-crypto-symbol="${apiApp.cryptocurrencyList[i].tickerSymbol}">
                                    <figure>
                                        <img src="${apiApp.cryptocurrencyList[i].iconPATH}" alt="${apiApp.cryptocurrencyList[i].cryptoName}">
                                        <figcaption class="text-center">${apiApp.cryptocurrencyList[i].tickerSymbol} <span class="sr-only">${apiApp.cryptocurrencyList[i].cryptoName}</span></figcaption>
                                    </figure>
                                </a>
                            </li>`;
                topTenListHTML += liElement;
            }
            $('.top-ten-cryptos').append(topTenListHTML);

            // Remove loading text and show top 10 and search form
            $('.text-loading').prop('hidden', true).attr('aria-hidden', 'true');
            $('.top-ten-container').prop('hidden', false).attr('aria-hidden', 'false');
            $('.search-form-container').prop('hidden', false).attr('aria-hidden', 'false');

        });
    },
    showCryptoDetails: function (cryptoSymbol) {
        // Should hide the main page
        // Should show the 'info' page
        // Show market data for the given crypto
        // Get apiApp to request news headlines and show them
        // Get apiApp to request reddit posts and show them
        $('.start-page').prop('hidden', true).attr('aria-hidden', 'true');
        $('.info-page').prop('hidden', false).attr('aria-hidden', 'false');

        // Get the crypto object
        let crypto = apiApp.getCrypto(cryptoSymbol);

        // Update crypto name in the headings
        $('.js-crypto-name').text(` - ${crypto.cryptoName}`);
        
        // Display the market data
        this.displayMarketData(crypto);
        
        // Display the news headlines
        this.displayNewsArticles(crypto);

        // Display the reddit posts
        this.displayRedditPosts(crypto);
    },
    displayMarketData: function (crypto) {
        // Update market data for the current crypto on the 'info' page
        // Use some regex (sourced online) to format the number as a currency with commas
        // USD price
        $('.js-usd-price').text('$' + Number.parseFloat(crypto.marketData.price_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        // BTC price
        $('.js-btc-price').text(Number.parseFloat(crypto.marketData.price_btc).toFixed(8));
        // Market Cap
        $('.js-market-cap').text('$' + Number.parseFloat(crypto.marketData.market_cap_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        // Trading volume
        $('.js-volume').text('$' + Number.parseFloat(crypto.marketData.volume_24h_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    },
    createNewsArticleDivElement: function (collectiveHTML, newsArticleObj) {
        let publishedAtDate = new Date(newsArticleObj.publishedAt);
        collectiveHTML += `<div class="news-item">
                                     <div class="news-image">
                                         <img src="${newsArticleObj.urlToImage}" alt="News Article Image">
                                     </div>
                                     <div class="news-content">
                                         <h4 class="news-headline">${newsArticleObj.title}</h4>
                                         <p class="news-description">${newsArticleObj.description}</p>
                                         <a class="news-link" href="${newsArticleObj.url}" aria-label="Read Full Article on ${newsArticleObj.title}" target="_blank">Read Full Article <i class="fa fa-external-link" aria-hidden="true"></i></a>
                                         <p class="news-source"><small>Published by ${newsArticleObj.source.name} on ${publishedAtDate.getDate()}/${publishedAtDate.getMonth() + 1}/${publishedAtDate.getFullYear()}</small></p>
                                     </div>
                                 </div>`;
        return collectiveHTML;
    },
    displayNewsArticles: function (crypto) {
        // Should get the apiApp object to query the news headlines
        // Should display these news headlines to the user
        apiApp.fetchNewsHeadlines(crypto, function (newsArticles) {
            // let newsArticleArrayIndex = 0; // Will incorporate properly this later when creating 'load more' functionality.
            let newsArticlesHTML = newsArticles.slice(0, 5).reduce(apiView.createNewsArticleDivElement, '');
            // Remove loading text and show news articles
            $('.text-loading-articles').prop('hidden', true).attr('aria-hidden', 'true');
            $('.news-article-container').html(newsArticlesHTML).prop('hidden', false).attr('aria-hidden', 'false');
        });
    },
    createRedditPostDivElement: function (collectiveHTML, redditPostObj) {
        let displayArea = '';

        if (redditPostObj.is_self) { // self post - show text
            displayArea = `<div class="reddit-post-display-area" data-type="self-post" data-self-text="${redditPostObj.selfText}" style="display: none;"></div>`;
        } else if (redditPostObj.domain === 'i.redd.it') { // image post - show image
            displayArea = `<div class="reddit-post-display-area" data-type="image" data-media-url="${redditPostObj.url}" data-media-alt="${redditPostObj.title}" style="display: none;"></div>`;
        }

        collectiveHTML += `<div class="reddit-post">
                                <div class="top-content">
                                    <div class="reddit-post-image">
                                        <img src="${redditPostObj.thumbnailURL}" alt="Reddit Post Image">
                                    </div>
                                    <div class="reddit-post-content">
                                        <h4 class="reddit-post-headline"><a href="${redditPostObj.url}" target="_blank">${redditPostObj.title}</a> <a class="reddit-post-domain" href="https://www.reddit.com/domain/${redditPostObj.domain}/" target="_blank"><small>(${redditPostObj.domain})</small></a></h4>
                                        <a class="reddit-post-show ${redditPostObj.showLocal ? 'js-show-media-locally' : ''}" 
                                           href="${redditPostObj.showLocal ? '#' : redditPostObj.url}" 
                                           target="_blank" 
                                           aria-label="${redditPostObj.showLocal ? 'Show' : 'Open'} the post for ${redditPostObj.title}">
                                           ${redditPostObj.showLocal ? 'Show' : 'Open'} Post <i class="fa ${redditPostObj.showLocal ? 'fa-angle-double-down' : 'fa-external-link'}" aria-hidden="true"></i>
                                        </a>
                                        <p class="reddit-post-source"><a href="https://www.reddit.com${redditPostObj.permalink}" target="_blank">${redditPostObj.num_comments} Comments</a> on <a href="https://www.reddit.com/${redditPostObj.subreddit_name_prefixed}" target="_blank">${redditPostObj.subreddit_name_prefixed}</a></p>
                                    </div>
                                </div>
                                ${displayArea}
                            </div>`;
        return collectiveHTML;
    },
    displayRedditPosts: function (crypto) {
        // Should get the apiApp object to query reddit.com for relevant posts
        // Should display these posts to the user
        // if the post is an image, allow the user to load the image within the app
        // if the post is a self.<subreddit> post, allow the user to load the text within the app
        // if the post is an external URL (i.e. not reddit.com), pro
        apiApp.fetchRedditPosts(crypto, function (redditPosts) {

            let redditPostsHTML = redditPosts.reduce(apiView.createRedditPostDivElement, '');

            $('.text-loading-posts').prop('hidden', true).attr('aria-hidden', 'true');
            $('.reddit-posts-container')
                .append(redditPostsHTML)
                .prop('hidden', false).attr('aria-hidden', 'false');
        });
    }
};

/**
 * Object to handle form events
 */
const eventHandler = {
    mainPageClickEvents: function () {
        $('.top-ten-cryptos').on('click', 'a', function (event) {
            event.preventDefault();
            let crypto = $(this).data('crypto-symbol');
            apiView.showCryptoDetails(crypto);
        });
    },
    redditShowPostClickEvents: function () {
        $('.reddit-posts-container').on('click', '.js-show-media-locally', function (event) {
            event.preventDefault();
            let displayArea = $(this).closest('.reddit-post').find('.reddit-post-display-area');

            if(displayArea.is(":hidden")) {
                if (displayArea.empty()) {
                    if (displayArea.data('type') === 'image') {
                        let imageURL = displayArea.data('media-url');
                        let imageAlt = displayArea.data('media-alt');
                        displayArea.html(`<img src="${imageURL}" alt="${imageAlt}">`);
                    }

                    if (displayArea.data('type') === 'self-post') {
                        let selfText = marked(displayArea.data('self-text'));
                        displayArea.html(`<div class="display-area-container">${selfText}</div>`);
                    }
                }
                displayArea.slideDown('fast');
                $(this).html('Close Post <i class="fa fa-angle-double-up" aria-hidden="true"></i>');
            } else {
                displayArea.slideUp('fast');
                $(this).html('Show Post <i class="fa fa-angle-double-down" aria-hidden="true"></i>');
            }
        });
    }
};


$(function () {
    // Init the view
    apiView.initMainPage();

    // handle the click events on the main page
    eventHandler.mainPageClickEvents();

    // handle Reddit post clicks
    eventHandler.redditShowPostClickEvents();

    // handle the search submit event - TBC after MVP

});

