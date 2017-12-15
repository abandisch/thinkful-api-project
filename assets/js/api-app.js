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
function CryptoCurrency(name, symbol, rank, iconPATH, marketData) {
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
                    // and add to the cryptocurrencyList array
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
        // That call back function should build the array of CryptoCurrencies and then call apiViewCallback
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
    forEachCryptoCurrency: function (callback) {
        this.cryptocurrencyList.forEach(callback);
    }
};

/**
 * Object to control the view of the app
 */
const apiView = {
    initMainPage: function () {
        apiApp.initCryptoCurrencyList(function () {
            let liElement;
            let topTenList = $('.top-ten-cryptos');

            apiApp.forEachCryptoCurrency(function (cryptocurrency) {
                liElement = `<li>
                                <a href="#">
                                    <figure class="figure">
                                        <img src="${cryptocurrency.iconPATH}" alt="${cryptocurrency.cryptoName}">
                                        <figcaption class="figure-caption text-center">${cryptocurrency.tickerSymbol}</figcaption>
                                    </figure>
                                </a>
                            </li>`;
                topTenList.append(liElement);
            });
            //console.log('appView: coins have finished loading, let the user search');
        });
    },
};

/**
 * Object to handle form events
 */
const eventHandler = {
    // TBC after MVP
};

// Tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});

$(apiView.initMainPage());

