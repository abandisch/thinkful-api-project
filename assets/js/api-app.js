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

/**
 * Object to manage API requests and data
 */
const apiApp = {
    cryptocurrencyList: [],
    cryptocompareData: {},
    //cryptocompareAPIURL: 'https://min-api.cryptocompare.com/data/all/coinlist',
    cryptocompareAPIURL: 'assets/js/cryptocompare.json', // Pre-downloaded this, since I only need images
    coinmarketcapAPIURL: 'https://api.coinmarketcap.com/v1/ticker/',
    // newsapiorgAPIURL: 'https://newsapi.org/v2/everything',
    newsapiorgAPIURL: 'assets/js/newsapi.json',
    currentCrypto: null,
    newsArticleList: [],
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
    fetchCoinData: function (apiViewCallback) {
        this.callAPI(new ApiQueryParams(
            this.coinmarketcapAPIURL,
            { limit: 10 },
            (apiData) => {
                for (let key in apiData) {
                    // Create the CryptoCurrency object
                    let crypto = new CryptoCurrency(apiData[key].name,
                                                    apiData[key].symbol,
                                                    apiData[key].rank,
                                                    {
                                                        price_usd: apiData[key].price_usd,
                                                        price_btc: apiData[key].price_btc,
                                                        market_cap_usd: apiData[key].market_cap_usd,
                                                        volume_24h_usd: apiData[key]['24h_volume_usd']
                                                    });

                    // Set the URL of the crypto icon - there are special cases due to inconsistent Symbol usage between Coinmarketcap and Cryptocompare
                    // Only taking care of IOTA, since it's in top ten market cap, rest will get a generic icon if there is no one to one mapping between Coinmarketcap and Cryptocompare
                    if (apiData[key].symbol === 'MIOTA') {
                        crypto.iconPATH = `https://www.cryptocompare.com/${apiApp.cryptocompareData["IOT"].ImageUrl}`;
                    } else {
                        crypto.iconPATH = !!this.cryptocompareData[apiData[key].symbol] ? `https://www.cryptocompare.com${this.cryptocompareData[apiData[key].symbol].ImageUrl}` : 'assets/images/generic-icon.jpg';
                    }
                    // add the CryptoCurrency object to the cryptocurrencyList array
                    this.cryptocurrencyList.push(crypto);
                }
                apiViewCallback();
            },
            'Unable to fetch coin data from coinmarketcap.com API. Please try again later.'
        ));
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
                page: 1 // Track this and increment to 'load more'
            },
            (resultsData) => {
                this.newsArticleList = resultsData.articles;
                callback(this.newsArticleList);
            },
            'cannot load data from newsapi.org'
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

    },
    displayMarketData: function (crypto) {
        // Update market data for the current crypto on the 'info' page
        // Use some regex (sourced online) to format the number as a currency with commas
        // USD price
        $('.js-usd-price').text('$' + Number.parseFloat(crypto.marketData.price_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        // BTC price
        $('.js-btc-price').text(Number.parseFloat(crypto.marketData.price_btc).toFixed(2));
        // Market Cap
        $('.js-market-cap').text('$' + Number.parseFloat(crypto.marketData.market_cap_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
        // Trading volume
        $('.js-volume').text('$' + Number.parseFloat(crypto.marketData.volume_24h_usd).toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","));
    },
    displayNewsArticles: function (crypto) {
        // Should get the apiApp object to query the news headlines
        // Should display these news headlines to the user
        apiApp.fetchNewsHeadlines(crypto, function (newsArticles) {
            let newsArticleContainer = $('.news-article-container');
            let divElement = '';
            let newsArticlesHTML = '';
            newsArticles.forEach((article) => {
                let publishedAtDate = new Date(article.publishedAt);
                divElement = `<div class="news-item">
                                 <div class="news-image">
                                     <img src="${article.urlToImage}" alt="News Article Image">
                                 </div>
                                 <div class="news-content">
                                     <h4 class="news-headline">${article.title}</h4>
                                     <p class="news-description">${article.description}</p>
                                     <a class="news-link" href="${article.url}" aria-label="Read Full Article on ${article.title}" target="_blank">Read Full Article <i class="fa fa-external-link" aria-hidden="true"></i></a>
                                     <p class="news-source"><small>Published by ${article.source.name} on ${publishedAtDate.getDate()}/${publishedAtDate.getMonth() + 1}/${publishedAtDate.getFullYear()}</small></p>
                                 </div>
                             </div>`;
                newsArticlesHTML += divElement;
            });
            newsArticleContainer.append(newsArticlesHTML);

            // Remove loading text and show news articles
            $('.text-loading-articles').prop('hidden', true).attr('aria-hidden', 'true');
            newsArticleContainer.prop('hidden', false).attr('aria-hidden', 'false');

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
        })
    }
};


$(function () {
    // Init the view
    apiView.initMainPage();

    // handle the click events on the main page
    eventHandler.mainPageClickEvents();

    // handle the search submit event - TBC after MVP

});

