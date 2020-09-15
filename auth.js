
const OAuth = require('oauth-1.0a')
const fetch = require("node-fetch");
const crypto = require('crypto');


const authorizations = async(url) =>{
  const oauth = await OAuth({
    consumer: {
        key: process.env.OAUTH_KEY,
        secret: process.env.OAUTH_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64')
  },
  });
  const request_data = {
    url: url,
    method: 'GET'
  };
  const token = {
  key: process.env.OAUTH_ACCESS_TOKEN,
  secret: process.env.OAUTH_TOKEN_SECRET
  }
  return fetch(url, {
  headers: {
  ...oauth.toHeader(oauth.authorize(request_data, token)),
  // compress: true,
  }
  }).then(function(response) {
    // console.log(response)
    if (response.status !== 200) {
      console.log('Looks like there was a problem. Status Code: ', response.status);
      return;
    }
    return response.json()
  })
}

module.exports = {
  authorizations : authorizations,
}