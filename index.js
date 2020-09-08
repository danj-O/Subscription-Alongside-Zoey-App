require('dotenv').config();
const https = require('https')
const crypto = require('crypto');
const OAuth = require('oauth-1.0a')
var cors = require('cors')
const fetch = require("node-fetch");
const { Headers } = require('node-fetch');
var express = require('express');
const bodyParser = require("body-parser");
const uuid = require('uuid')
// import { v1 as uuidv1 } from 'uuid';

var app = express();

app.use(cors())
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


app.get('/', function(req, res){
  return res.render('index.ejs')
})

app.listen(3000, function(){
  console.log("Server is running on port 3000")
})
// INSTEAD OF ALL OF THIS I SHOULD TRY NODE-OAUTH????

const oauth_timestamp = Math.floor(Date.now() / 1000);
const oauth_nonce = uuid.v1(); 

const method = 'GET';

const parameters = {
  'oauth_callback' : '/',
  'oauth_nonce': oauth_nonce,
  'Content-Type': 'application/json',
  'oauth_signature_method': 'HMAC-SHA1',
  // 'oauth_signature': ,
  'oauth_timestamp': oauth_timestamp,
  'oauth_version' : '1.0a',
  'oauth_consumer_key' : process.env.OAUTH_KEY,
  'oauth_consumer_secret': process.env.OAUTH_SECRET,
  'oauth_access_token': process.env.OAUTH_ACCESS_TOKEN,
  'oauth_token_secret': process.env.OAUTH_TOKEN_SECRET
}

let ordered = {};
Object.keys(parameters).sort().forEach(function(key) {
    ordered[key] = parameters[key];
});
let encodedParameters = '';
for (k in ordered) {
  const encodedValue = escape(ordered[k]);
  const encodedKey = encodeURIComponent(k);
  if(encodedParameters === ''){
    encodedParameters += encodeURIComponent(`${encodedKey}=${encodedValue}`)
  }
  else{
    encodedParameters += encodeURIComponent(`&${encodedKey}=${encodedValue}`);
  }
}

const base_url = 'https://ts967672-container.zoeysite.com/api/rest/customers';
const encodedUrl = encodeURIComponent(base_url);
encodedParameters = encodeURIComponent(encodedParameters); // encodedParameters which we generated in last step.
const signature_base_string = `${method}&${encodedUrl}&${encodedParameters}`
// console.log(signature_base_string)
const oauth_signature = crypto.createHmac("sha1", process.env.OAUTH_SECRET).update(signature_base_string).digest().toString('base64');
const encoded_oauth_signature = encodeURIComponent(oauth_signature);
// console.log(encoded_oauth_signature);
// console.log(oauth_nonce);
// console.log(oauth_timestamp);

// http://ziptie.com/api/rest/customers
// http://ZipTie.com/oauth/initiate
// ts967672-container.zoeysite.com

const headers = new Headers({
  // "Content-Type": "application/x-www-form-urlencoded",
  'Content-Type': 'application/json',
  'oauth_callback' : '/',
  'oauth_consumer_key' : process.env.OAUTH_KEY,
  'oauth_nonce': oauth_nonce,
  'oauth_signature_method': 'HMAC-SHA1',
  'oauth_signature': encoded_oauth_signature,
  'oauth_timestamp': oauth_timestamp,
  'oauth_version' : '1.0a',
})
const headersObj = {
  // "Content-Type": "application/x-www-form-urlencoded",
  'Content-Type': 'application/json',
  'oauth_callback' : '/',
  'oauth_nonce': oauth_nonce,
  'oauth_signature_method': 'HMAC-SHA1',
  'oauth_signature': encoded_oauth_signature,
  'oauth_timestamp': oauth_timestamp,
  'oauth_version' : '1.0a',
  'oauth_consumer_key' : process.env.OAUTH_KEY,
  'oauth_consumer_secret': process.env.OAUTH_SECRET,
  'oauth_access_token': process.env.OAUTH_ACCESS_TOKEN,
  'oauth_token_secret': process.env.OAUTH_TOKEN_SECRET
}

// const oauth = OAuth({
//   consumer: { key: process.env.process.env.OAUTH_KEY, secret: process.env.OAUTH_SECRET },
//   signature_method: 'HMAC-SHA1',
//   hash_function(base_string, key) {
//       return crypto
//           .createHmac('sha1', key)
//           .update(base_string)
//           .digest('base64')
//   },
// })

const url = "https://ts967672-container.zoeysite.com/api/rest/products"
  const oauth = OAuth({
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
  fetch(url, {
  headers: {
    ...oauth.toHeader(oauth.authorize(request_data, token)),
    // 'Content-Type': 'application/json',
    // 'oauth_callback' : '/',
    // 'oauth_nonce': oauth_nonce,
    // 'oauth_signature_method': 'HMAC-SHA1',
    // 'oauth_signature': encoded_oauth_signature,
    // 'oauth_timestamp': oauth_timestamp,
    // 'oauth_version' : '1.0a',
    // 'oauth_consumer_key' : process.env.OAUTH_KEY,
    // 'oauth_consumer_secret': process.env.OAUTH_SECRET,
    // 'oauth_access_token': process.env.OAUTH_ACCESS_TOKEN,
    // 'oauth_token_secret': process.env.OAUTH_TOKEN_SECRET
  }
    }).then(function(response) {
      console.log(response)
      if (response.status !== 200) {
        console.log('Looks like there was a problem. Status Code: ',   response.status);
        return;
      }
      console.log("RESPONSE YAAYYY", response)
    })


// fetch(base_url, {
//   method: method,
//   withCredentials: true,
//   credentials: 'include',
//   headers: headersObj
// })
// .then(response => console.log(response))

// fetch(base_url, {
//   method: method,
//   withCredentials: true,
//   credentials: 'include',
//   // body: 'grant_type=client_credentials&client_id=' + process.env.OAUTH_KEY + '&client_secret=' + process.env.OAUTH_SECRET,
//   headers: headers,
// })
//   // .then(response => console.log(typeof(response.headers)))
//   // .then(response => console.log(response.headers.raw()))
//   .then(response => console.log(response))
//   // .then(response => response.json)
//   // .then(data => console.log("RESPONSE", data))
