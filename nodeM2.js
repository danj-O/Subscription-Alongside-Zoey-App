// https://www.npmjs.com/package/node-magento2
//retrieves products but The consumer isn't authorized to access Magento_Customer::customer.
//3yrs old

"use strict";

const Magento2 = require('node-magento2');

//instantiate the client object
const options = {
  url: null,
  store: 'default', //set a store to contextualise in
  authentication: {
    login: {
      type: 'admin', //admin or customer
      username: 'subscriptionSuggest',
      password: 'changeme@123'
    },
    integration: {
      consumer_key: process.env.MAGENTO_CONSUMER_KEY,
      consumer_secret: process.env.MAGENTO_CONSUMER_SECRET,
      access_token: process.env.MAGENTO_ACCESS_TOKEN,
      access_token_secret: process.env.MAGENTO_ACCESS_TOKEN_SECRET
    }
  }
}

const mageClient = new Magento2('http://2ieb7j62xark0rjf.mojostratus.io', options)

mageClient.get('/V1/customers/1', {searchCriteria: { /*...*/ }})
// mageClient.get('/V1/customers/search?searchCriteria[sortOrders][0][field]=email&searchCriteria[sortOrders][0][direction]=asc', {searchCriteria: { /*...*/ }}) //Get a list of all products
  .then(customers => {
    console.log(customers)
  })
  .catch(err => console.log(err))
  
// mageClient.get('/V1/products?searchCriteria', {searchCriteria: { /*...*/ }}) //Get a list of all products
//   .then(products => {
//     console.log(products)
//   })






// mageClient.put('/V1/products/SKU_123', {visibility: 1}) //update product SKU_123
//   .then(product => {
//     //product data that's been modified to be invisible
//   })

// mageClient.post('/V1/products', { /*A product entity*/}) //Create a new product
//   .then(product => {
//     //the created product object
//   })

// mageClient.delete('/V1/procucts/SKU_123') //delete the product SKU_123