"use strict";

/**
 * CryptoMarketData - Class to hold market data for a Cryptocurrency
 * @param priceUSD - price in USD
 * @param priceBTC - price in BTC
 * @param marketCapitalisation - Market Capitalisation (in USD)
 * @param tradingVolume - trading volume (in USD)
 * @constructor
 */
function CryptoMarketData(priceUSD, priceBTC, marketCapitalisation, tradingVolume) {
    this.priceUSD = priceUSD;
    this.priceBTC = priceBTC;
    this.marketCapitalisation = marketCapitalisation;
    this.tradingVolume = tradingVolume;
}

/**
 * CryptoCurrency - Class for a CryptoCurrency
 * @param name - Full name of the Cryptocurrency
 * @param symbol - Ticker (or stock) symbol of the Cryptocurrency
 * @param iconURL - URL to the Cryptocurrency icon
 * @param marketData - Market Data object
 * @constructor
 */
function CryptoCurrency(name, symbol, iconURL, marketData) {
    this.cryptoName = name;
    this.tickerSymbol = symbol;
    this.iconURL = iconURL;
    this.marketData = marketData;
}

/**
 * Object to perform API requests
 */
const apiRequests = {

};

/**
 * Object to control the view of the app
 */
const apiView = {

};

/**
 * Object to handle form events
 */
const eventHandler = {

};

// Tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip();
});