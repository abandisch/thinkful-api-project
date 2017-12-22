"use strict";

/**
 * CryptoCurrency - Class for a CryptoCurrency
 */
function CryptoCurrency({ id, name, symbol, rank, price_usd, price_btc, market_cap_usd, '24h_volume_usd': volume_24h_usd }) {
  this.id = id;
  this.cryptoName = name;
  this.tickerSymbol = symbol;
  this.rank = rank;
  this.iconPATH = '';
  this.marketData = {
    price_usd: price_usd,
    price_btc: price_btc,
    market_cap_usd: market_cap_usd,
    volume_24h_usd: volume_24h_usd
  };
}

CryptoCurrency.prototype.formatCurrency = function(number, currencySymbol) {
  return currencySymbol + number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

CryptoCurrency.prototype.getPriceUSD = function() {
  let price = this.marketData.price_usd;
  if (Number.parseFloat(price) < 1) {
    return this.formatCurrency(Number.parseFloat(price).toFixed(6), '$');
  } else {
    return this.formatCurrency(Number.parseFloat(price).toFixed(2), '$');
  }
};

CryptoCurrency.prototype.getPriceBTC = function() {
  return Number.parseFloat(this.marketData.price_btc).toFixed(8);
};

CryptoCurrency.prototype.getMarketCapUSD = function() {
  return this.formatCurrency(Number.parseFloat(this.marketData.market_cap_usd).toFixed(2), '$');
};

CryptoCurrency.prototype.get24hTradingVolumeUSD = function() {
  return this.formatCurrency(Number.parseFloat(this.marketData.volume_24h_usd).toFixed(2), '$');
};

/**
 * ApiQuery - class to hold the API query details
 * @param apiURL - URL of the API
 * @param queryData - object holding query information
 * @param dataType - JSON or JSONP, defaults to json
 * @param successCallback - function with what to do on success
 * @param failMessage - message to show on fail
 * @param timeout - API connection timeout - defaults to 10 seconds
 */
function ApiQueryParams(apiURL, queryData, successCallback, failMessage, dataType, timeout) {
  this.url = apiURL;
  this.queryData = queryData;
  this.successCallback = successCallback;
  this.failMessage = failMessage;
  this.dataType = dataType;
  this.timeout = timeout;
}

ApiQueryParams.prototype.getDataType = function () {
  if (this.dataType !== undefined) {
    return this.dataType;
  } else {
    return 'json';
  }
};

ApiQueryParams.prototype.getTimeout = function () {
  if (this.timeout !== undefined) {
    return this.timeout;
  } else {
    return 10;
  }
};

// JSON results from each API used for testing/development, so I don't spam the API's when testing/developing
const TEST_CoinmarketcapAPIURL = 'resources/test-json/coinmarketcap.json';
const TEST_NewsorgAPIURL = 'resources/test-json/newsapi.json';
const TEST_RedditAPIURL = 'resources/test-json/reddit.json';

/* Main URLs for APIs */
const MAIN_CRYPTOCOMPARE_URL = 'https://www.cryptocompare.com';
const MAIN_COINMARKETCAP_URL = 'https://coinmarketcap.com';
const MAIN_NEWSAPI_URL = 'https://newsapi.org';
const MAIN_REDDIT_URL = 'https://www.reddit.com';

/**
 * Object to manage API requests and data
 */
const apiApp = {
  cryptocurrencySearchList: [],      // Array of all Cryptocurrencies names and their symbols. Used for filter search function.
  cryptocurrencyList: [],            // Array of CryptoCurrency objects. Used to store top ten cryptos
  newsArticleList: [],
  redditPostList: [],
  cryptocompareData: {},
  //cryptocompareAPIURL: 'https://min-api.cryptocompare.com/data/all/coinlist',
  cryptocompareAPIURL: 'assets/js/cryptocompare.json', // Pre-downloaded this, since I only need image URL's
  coinmarketcapAPIURL: 'https://api.coinmarketcap.com/v1/ticker/',
  // coinmarketcapAPIURL: TEST_CoinmarketcapAPIURL,
  newsapiorgAPIURL: 'https://newsapi.org/v2/everything',
  // newsapiorgAPIURL: TEST_NewsorgAPIURL,
  redditAPIURL: 'https://www.reddit.com/search.json',
  // redditAPIURL: TEST_RedditAPIURL,
  callAPI: function (apiQueryData) {
    // Should execute the Ajax call to the API URL and provide any query data
    // Should execute the success call back if successful
    // Should alert the user if Ajax request was not successful
    $.ajax({
      url: apiQueryData.url,
      data: apiQueryData.queryData,
      dataType: apiQueryData.getDataType(),
      type: 'GET'
    })
      .done(function (apiData) {
        // Call the callback function with the results of teh API query
        apiQueryData.successCallback(apiData);
      })
      .fail(function (jqXHR, textStatus, errorThrown) {
        console.log(jqXHR, textStatus, errorThrown);
        alert(apiQueryData.failMessage);
      });
  },
  getCryptoImageURL: function (tickerSymbol) {
    let symbol = this.cryptocompareData[tickerSymbol];

    if(symbol !== undefined) {
      return `${MAIN_CRYPTOCOMPARE_URL}/${symbol.ImageUrl}`;
    } else {
      return 'assets/images/generic-icon.jpg';
    }
  },
  createCryptoCurrency: function (cryptoObjData) {
    let crypto = new CryptoCurrency(cryptoObjData);

    if(crypto.tickerSymbol !== 'MIOTA') {
      crypto.iconPATH = this.getCryptoImageURL(crypto.tickerSymbol);
    } else {
      crypto.iconPATH = this.getCryptoImageURL("IOT");
    }
    return crypto;
  },
  fetchTopCryptocurrencyData: function (howManyCryptos, apiViewCallback) {
    // Should query coinmarketcap.com API for the top ten cryptos
    // Should create a CryptoCurrency object for each
    // Should populate the cryptocurrencyList array with all ten CryptoCurrency objects
    const apiQueryParams = new ApiQueryParams(
      this.coinmarketcapAPIURL,
      {limit: howManyCryptos}, // Limit of 0 = all cryptos
      (coinmarketcapApiData) => {
        this.cryptocurrencyList = coinmarketcapApiData.map(this.createCryptoCurrency, this);
        apiViewCallback(this.cryptocurrencyList);
      },
      'Unable to fetch coin data from coinmarketcap.com API. Please try again later.'
    );
    this.callAPI(apiQueryParams);
  },
  fetchTopCryptocurrencies: function (howManyCryptos, apiViewCallback) {
    this.callAPI(new ApiQueryParams(
      this.cryptocompareAPIURL,
      {/* no parameters */},
      (cryptocompareApiData) => {
        this.cryptocompareData = cryptocompareApiData.Data;
        this.fetchTopCryptocurrencyData(howManyCryptos, apiViewCallback);
      },
      'Unable to fetch cryptocurrency list from cryptocompare.com API. Please try again later.'
    ));
  },
  fetchCryptocurrency: function (cryptocurrencyID, callback) {
    // check to see if its in the top 10, if so return that one, if not, do an API call
    let crypto = this.cryptocurrencyList.find(function (cryptoObj) {
      return cryptoObj.id === cryptocurrencyID;
    }, this);

    if (crypto !== undefined) {
      callback(crypto);
    } else {
      this.callAPI(new ApiQueryParams(
        `${this.coinmarketcapAPIURL}${cryptocurrencyID}/`,
        { /* no params */ },
        (cryptocurrencyData) => {
          let crypto;
          if (cryptocurrencyData.error) { // invalid cryptocurrencyID provided
            crypto = null;
          } else {
            crypto = this.createCryptoCurrency(cryptocurrencyData[0]);
          }
          callback(crypto);
        },
        'Sorry, could not find the cryptocurrency. Please try another search'
      ));
    }
  },
  searchForCryptocurrencyID: function (search) {
    let result = this.cryptocurrencySearchList.find(function (searchObj) {
      return searchObj.symbol.toLowerCase() === search.toLowerCase() ||
             searchObj.name.toLowerCase() === search.toLowerCase()
    });

    if (result !== undefined) {
      return result.slug; // Slug is the same as the ID over at coinmarketcap.
    } else {
      return null;
    }

  },
  fetchNewsHeadlines: function (cryptoObject, callback) {
    // Should query newsapi.org for news headlines for the given crypto
    // Should execute the callback (which should display the news headlines on the page
    this.callAPI(new ApiQueryParams(
      this.newsapiorgAPIURL,
      {
        q: `(crypto OR cryptocurrency) AND (${cryptoObject.cryptoName} OR ${cryptoObject.tickerSymbol})`,
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
    const {domain, num_comments, permalink, subreddit_name_prefixed, is_self, title, url} = postObjData.data;
    let redditPostObject = {domain, num_comments, permalink, subreddit_name_prefixed, is_self, title, url};
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
  },
  loadCryptocurrencySearchList: function () {
    // Get the coinmarketcap.com 'Quick Search' JSON file and save the details in quickSearchCryptocurrencyList array
    // This data is made up of objects that look like: {"tokens": ["Bitcoin", "BTC"], "symbol": "BTC", "name": "Bitcoin", "rank": 1, "slug": "bitcoin"}
    // This data will be used to filter search query
    if (!this.cryptocurrencySearchList.length) {
      this.callAPI(new ApiQueryParams(
        'https://files.coinmarketcap.com/generated/search/quick_search.json',
        { /* No params */ },
        (quickSearchAPIData) => {
          // Process the results and extract only what is needed from JSON
          this.cryptocurrencySearchList = quickSearchAPIData;
        },
        'cannot load data from files.coinmarketcap.com'
      ));
    }
  }
};

/**
 * Object to control the view of the app
 */
const apiView = {
  createCryptoCurrencyLiElement: function (cryptoCurrencyObj) {
    return `<li>
              <a href="#" data-crypto-id="${cryptoCurrencyObj.id}">
                <figure>
                  <img src="${cryptoCurrencyObj.iconPATH}" alt="${cryptoCurrencyObj.cryptoName}">
                  <figcaption class="text-center">${cryptoCurrencyObj.tickerSymbol} <span class="sr-only">${cryptoCurrencyObj.cryptoName}</span></figcaption>
                </figure>
              </a>
            </li>`;
  },
  showStartPage: function () {
    // Setup top ten list on main page
    // Show 'loading' text and remove it once the load is complete
    // Remove loading text and show top 10 and search form

    // Show the top ten section and intro text
    $('.top-ten-section').prop('hidden', false).attr('aria-hidden', 'false');
    $('.intro').prop('hidden', false).attr('aria-hidden', 'false');

    // Hide the home button and crypto info section and clear it out news articles and reddit posts
    $('.crypto-info-section').prop('hidden', true).attr('aria-hidden', 'true');
    $('nav').prop('hidden', true).attr('aria-hidden', 'true');
    $('.news-article-container').empty();
    $('.reddit-posts-container').empty();

    // Load the search data
    apiApp.loadCryptocurrencySearchList();

    // Fetch and show the top 10 cryptos
    apiApp.fetchTopCryptocurrencies(10, (cryptocurrencyList) => {
      let topTenListHTML = cryptocurrencyList.map(this.createCryptoCurrencyLiElement).join('');
      $('.top-ten-cryptos').html('').append(topTenListHTML);
      $('.text-loading').prop('hidden', true).attr('aria-hidden', 'true');
      $('.top-ten-container').prop('hidden', false).attr('aria-hidden', 'false');
      $('.search-form-container').prop('hidden', false).attr('aria-hidden', 'false');
    });
  },
  searchCryptocurrency: function (searchValue) {
    // Should get the crypto ID from the search value by looking in the apiApp.searchCryptocurrencyList array
    // should call showCryptoDetails with the id
    // if the id === null, show an error message
    let cryptoID = apiApp.searchForCryptocurrencyID(searchValue);
    if (cryptoID !== null) {
      this.showCryptoDetails(cryptoID);
    } else {
      alert('Sorry, cannot find the Cryptocurrency. Please try again.');
    }
  },
  showCryptoDetails: function (cryptocurrencyID) {
    // Should hide the main page
    // Should show the 'info' page
    // Show market data for the given crypto
    // Get apiApp to request news headlines and show them
    // Get apiApp to request reddit posts and show them
    apiApp.fetchCryptocurrency(cryptocurrencyID, (crypto) => {
      if (crypto !== null) {
        // Hide top ten section and show the info section
        $('.top-ten-section').prop('hidden', true).attr('aria-hidden', 'true');
        $('.crypto-info-section').prop('hidden', false).attr('aria-hidden', 'false');

        // Update crypto name in the headings
        $('.js-crypto-name').text(` - ${crypto.cryptoName}`);

        // Display the market data
        this.displayMarketData(crypto);

        // Display the news headlines
        this.displayNewsArticles(crypto);

        // Display the reddit posts
        this.displayRedditPosts(crypto);

        // Hide intro text
        $('.intro').prop('hidden', true).attr('aria-hidden', 'true');

        // Show home button
        $('nav').prop('hidden', false).attr('aria-hidden', 'false');

        // Add history push state
        history.pushState({ id: crypto.id }, null, `?symbol=${crypto.tickerSymbol}`);
      }
    });

  },
  displayMarketData: function (crypto) {
    // Update market data for the current crypto on the 'info' page
    // USD price
    $('.js-usd-price').text(crypto.getPriceUSD());
    // BTC price
    $('.js-btc-price').text(crypto.getPriceBTC());
    // Market Cap
    $('.js-market-cap').text(crypto.getMarketCapUSD());
    // Trading volume
    $('.js-volume').text(crypto.get24hTradingVolumeUSD());
  },
  createNewsArticleDivElement: function (newsArticleObj) {
    let publishedAtDate = new Date(newsArticleObj.publishedAt);

    if (newsArticleObj.urlToImage === null) { // if the API doesn't provide an image, fall back to a generic image
      newsArticleObj.urlToImage = 'assets/images/generic-news.jpg';
    }

    return `<div class="news-item">
              <div class="news-image">
                <img src="${newsArticleObj.urlToImage}" alt="News Article Image">
              </div>
              <div class="news-content">
                <h4 class="news-headline"><a href="${newsArticleObj.url}" target="_blank">${newsArticleObj.title}</a></h4>
                <p class="news-description">${newsArticleObj.description}</p>
                <a class="news-link" href="${newsArticleObj.url}" aria-label="Read Full Article on ${newsArticleObj.title}" target="_blank">Read Full Article <i class="fa fa-external-link" aria-hidden="true"></i></a>
                <p class="news-source"><small>Published by ${newsArticleObj.source.name} on ${publishedAtDate.getDate()}/${publishedAtDate.getMonth() + 1}/${publishedAtDate.getFullYear()}</small></p>
              </div>
           </div>`;
  },
  displayNewsArticles: function (crypto) {
    // Should get the apiApp object to query the news headlines
    // Should display these news headlines to the user
    apiApp.fetchNewsHeadlines(crypto, function (newsArticles) {
      // let newsArticleArrayIndex = 0; // Will incorporate properly this later when creating 'load more' functionality.
      let newsArticlesHTML = newsArticles.slice(0, 5).map(apiView.createNewsArticleDivElement).join('');
      // Remove loading text and show news articles
      $('.text-loading-articles').prop('hidden', true).attr('aria-hidden', 'true');
      $('.news-article-container').html(newsArticlesHTML).prop('hidden', false).attr('aria-hidden', 'false');
    });
  },
  createRedditPostDivElement: function (redditPostObj) {
    let displayArea = '';

    if (redditPostObj.is_self) { // self post - show text
      displayArea = `<div class="reddit-post-display-area" data-type="self-post" data-self-text="${redditPostObj.selfText}" style="display: none;"></div>`;
    } else if (redditPostObj.domain === 'i.redd.it') { // image post - show image
      displayArea = `<div class="reddit-post-display-area" data-type="image" data-media-url="${redditPostObj.url}" data-media-alt="${redditPostObj.title}" style="display: none;"></div>`;
    }

    return `<div class="reddit-post">
              <div class="top-content">
                <div class="reddit-post-image">
                  <img src="${redditPostObj.thumbnailURL}" alt="Reddit Post Image">
                </div>
                <div class="reddit-post-content">
                  <h4 class="reddit-post-headline"><a href="${redditPostObj.url}" target="_blank">${redditPostObj.title}</a> <a class="reddit-post-domain" href="${MAIN_REDDIT_URL}/domain/${redditPostObj.domain}/" target="_blank"><small>(${redditPostObj.domain})</small></a></h4>
                  <a class="reddit-post-show ${redditPostObj.showLocal ? 'js-show-media-locally' : ''}" 
                    href="${redditPostObj.showLocal ? '#' : redditPostObj.url}" 
                    target="_blank" 
                    aria-label="${redditPostObj.showLocal ? 'Show' : 'Open'} the post for ${redditPostObj.title}">
                    ${redditPostObj.showLocal ? 'Show' : 'Open'} Post <i class="fa ${redditPostObj.showLocal ? 'fa-angle-double-down' : 'fa-external-link'}" aria-hidden="true"></i>
                  </a>
                  <p class="reddit-post-source"><a href="${MAIN_REDDIT_URL}${redditPostObj.permalink}" target="_blank">${redditPostObj.num_comments} Comments</a> on <a href="${MAIN_REDDIT_URL}/${redditPostObj.subreddit_name_prefixed}" target="_blank">${redditPostObj.subreddit_name_prefixed}</a></p>
                </div>
              </div>
              ${displayArea}
            </div>`;
  },
  displayRedditPosts: function (crypto) {
    // Should get the apiApp object to query reddit.com for relevant posts
    // Should display these posts to the user
    // if the post is an image, allow the user to load the image within the app
    // if the post is a self.<subreddit> post, allow the user to load the text within the app
    // if the post is an external URL (i.e. not reddit.com), pro
    apiApp.fetchRedditPosts(crypto, function (redditPosts) {

      let redditPostsHTML = redditPosts.map(apiView.createRedditPostDivElement, '').join('');

      $('.text-loading-posts').prop('hidden', true).attr('aria-hidden', 'true');
      $('.reddit-posts-container')
        .html('')
        .append(redditPostsHTML)
        .prop('hidden', false).attr('aria-hidden', 'false');
    });
  }
};

/**
 * Object to handle form events
 */
const eventHandler = {
  topTenClickEvents: function () {
    $('.top-ten-cryptos').on('click', 'a', function (event) {
      event.preventDefault();
      let cryptoID = $(this).data('crypto-id');
      apiView.showCryptoDetails(cryptoID);
    });
  },
  redditShowPostClickEvents: function () {
    $('.reddit-posts-container').on('click', '.js-show-media-locally', function (event) {
      event.preventDefault();
      let displayArea = $(this).closest('.reddit-post').find('.reddit-post-display-area');

      if (displayArea.is(":hidden")) {
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
  },
  homeButtonClickEvents: function () {
    $('.btn-home').on('click', function (event) {
      event.preventDefault();
      history.replaceState(null,null,'index.html');
      apiView.showStartPage();
    });
  },
  historyPopStateEvents: function () {
    window.addEventListener('popstate', function(e) {
      let cryptoObj = e.state;
      if (cryptoObj == null) {
        history.replaceState(null,null,'index.html');
        apiView.showStartPage();
      } else {
        apiView.showCryptoDetails(cryptoObj.id);
      }
    });
  },
  searchForCryptocurrency: function () {
    $('#search-form').on('submit', function (event) {
      event.preventDefault();
      let searchValue = $(this).find('.search-input').val();
      apiView.searchCryptocurrency(searchValue);
    })
  }
};


$(function () {
  // Initialise and show the start page
  apiView.showStartPage();

  // handle the click events on the main page, i.e. the top 10
  eventHandler.topTenClickEvents();

  // handle Reddit post clicks
  eventHandler.redditShowPostClickEvents();

  // handle home button click
  eventHandler.homeButtonClickEvents();

  // Handle popstate events (i.e. back button clicks)
  eventHandler.historyPopStateEvents();

  // handle the search submit event
  eventHandler.searchForCryptocurrency();
});

