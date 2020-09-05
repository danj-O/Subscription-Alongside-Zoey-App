require('dotenv').config();
const https = require('https')
const crypto = require('crypto');
const fetch = require("node-fetch");
var express = require('express');
const bodyParser = require("body-parser");
const uuid = require('uuid')
// import { v1 as uuidv1 } from 'uuid';


var app = express();

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

const method = 'POST';

const parameters = {
  'oauth_callback' : '/',
  'oauth_consumer_key' : process.env.OAUTH_KEY,
  'oauth_nonce': oauth_nonce,
  'Content-Type': 'application/json',
  'oauth_signature_method': 'HMAC-SHA1',
  // 'oauth_signature': ,
  'oauth_timestamp': oauth_timestamp,
  'oauth_version' : '1.0a'
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
     encodedParameters +=     encodeURIComponent(`${encodedKey}=${encodedValue}`)
  }
  else{
   encodedParameters += encodeURIComponent(`&${encodedKey}=${encodedValue}`);
  }
}
// console.log(encodedParameters);

const base_url = 'http://ZipTie.com/oauth/initiate';
const encodedUrl = encodeURIComponent(base_url);
encodedParameters = encodeURIComponent(encodedParameters); // encodedParameters which we generated in last step.
const signature_base_string = `${method}&${encodedUrl}&${encodedParameters}`
// console.log(signature_base_string)
const oauth_signature = crypto.createHmac("sha1", process.env.OAUTH_SECRET).update(signature_base_string).digest().toString('base64');
const encoded_oauth_signature = encodeURIComponent(oauth_signature);
console.log(encoded_oauth_signature);

// http://ziptie.com/api/rest/customers
// http://ZipTie.com/oauth/initiate

fetch(base_url, {
  method: 'GET',
  headers: {
    // "Content-Type": "application/x-www-form-urlencoded",
    'oauth_callback' : '/',
    'oauth_consumer_key' : process.env.OAUTH_KEY,
    'oauth_nonce': oauth_nonce,
    // 'Content-Type': 'application/json',
    'oauth_signature_method': 'HMAC-SHA1',
    'oauth_signature': encoded_oauth_signature,
    'oauth_timestamp': oauth_timestamp,
    'oauth_version' : '1.0a'
  },
})
  // .then(response => console.log(typeof(response.headers)))
  // .then(response => console.log(response.headers))
  .then(response => console.log(response.status))
  // .then(response => response.json)
  // .then(data => console.log("RESPONSE", data))
