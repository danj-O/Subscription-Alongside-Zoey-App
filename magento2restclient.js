// https://www.npmjs.com/package/magento2-rest-client
//4yrs old
//retrieves products but not sure how to get customers

var Magento2Client = require('magento2-rest-client').Magento2Client;
 
var options = {
  'url': 'http://2ieb7j62xark0rjf.mojostratus.io/rest',
  'consumerKey': process.env.MAGENTO_CONSUMER_KEY,
  'consumerSecret': process.env.MAGENTO_CONSUMER_SECRET,
  'accessToken': process.env.MAGENTO_ACCESS_TOKEN,
  'accessTokenSecret': process.env.MAGENTO_ACCESS_TOKEN_SECRET
};
var client = Magento2Client(options);
client.orders.list()
  .then(function (categories) {
    console.log(categories)
  })
  .catch( err => console.log(err))