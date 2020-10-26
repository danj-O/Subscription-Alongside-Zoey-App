require('dotenv').config();
var PORT = process.env.PORT || 3000;
const Oauth1Helper = require('./auth')
const axios = require('axios')
var cors = require('cors')
var express = require('express');
const bodyParser = require("body-parser");

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
app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})


// -----------------START----------------------------------------------------------------- 

const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'

getAll()

async function getAll(){
  // const subscriptions = await getDataWithAuth(`${baseUrl}/rest/V1/subscription/search?searchCriteria[pageSize]=1`)
  // console.log('subscriptions', subscriptions.data)

  const orders = await getData('/rest/V1/orders?searchCriteria=all')
  const multiPurchaseCustData = await getMultiplePurchaseCustomerData(orders)  //get only customers who have made multiple purchases
  const organizedData = await organizeData(multiPurchaseCustData) //array of customers who have purchased multiple times with all of their purchases sorted
  const customerPurchasesArr = comparePurchases(organizedData) //arr containing customers with multiple purchases and which products they have bought more than once
  console.log('PURCHASES ARRAY', customerPurchasesArr[1])
  //need to check dates of purcheses to suggest
}

async function getData(suffix){
  let response = await getDataWithAuth(`${baseUrl}${suffix}`)
  // console.log(response.data.items)
  const result = []
  response.data.items.map(item => {
    result.push({
      name : item.billing_address.firstname,
      email : item.customer_email,
      date : item.created_at,
      items : item.items,
      orderNumber : item.increment_id,
      total : item.base_grand_total,
      // customerId : item.customer_id
    })
  })
  return result.sort(compareEmail) // sort the results by email
}

//FUNCTION THAT COMPARES ALL ORDERS MADE BY ONE PERSON FOR SIMILARITIES IN PRODUCTS PURCHASED
function organizeData(customersByEmail){
  let result = [];
  // loop over cust obj, which is orders made by same email
  for (customer in customersByEmail){
    const customerPurchasedItems = []
    //loop through orders made by cust
    customersByEmail[customer].map(purchases =>{
      //loop through items purchsed
      purchases.items.map(purchase => {
        customerPurchasedItems.push({
          productName : purchase.name,
          sku : purchase.sku,
          qtyOrdered : purchase.qty_ordered,
          createdAt : purchase.created_at,
        })
      })
    })
    //group purchases of same item together
    customerPurchasedItems.sort(compareSKU)
    result.push({
      name : customersByEmail[customer][0].name,
      email : customersByEmail[customer][0].email,
      purchasedItems : customerPurchasedItems
    })
  }
  return result
}


function comparePurchases(customersArr){
  customersArr.map(customer => {
    let prevItem = {}
    let count = 0
    customer.multiPurchasedItems = []
    customer.purchasedItems.map(item => {
      if (item.sku === prevItem.sku && count < 1){
        customer.multiPurchasedItems.push(item)
        count++
      } else if (item.sku === prevItem.sku && count >= 1){
        count++
      } else {
        count = 0
      }
      prevItem = item
    })
    // console.log('CUSTOMER', customer)
  })
  return customersArr
}

function getMultiplePurchaseCustomerData(orders){
  let prevOrder = {}
  const dataByEmail = {}
  orders.map(order => { 
    //if there are multiple purchases by saem email
    if (order.email == prevOrder.email){
      //if the email obj does already include this order, add the prev as well
      if (!dataByEmail.hasOwnProperty(order.email)){
        dataByEmail[order.email] = [prevOrder]
      }
      //add current order to multipurchases obj under the correct email param
      dataByEmail[order.email].push(order)
    }
    prevOrder = order
  })
  //return all orders made by same cust email in organized obj
  return dataByEmail
}

function compareEmail(a, b) {
  const itemA = a.email;
  const itemB = b.email;
  let comparison = 0;
  if (itemA > itemB) {
    comparison = 1;
  } else if (itemA < itemB) {
    comparison = -1;
  }
  return comparison;
}
function compareSKU(a, b) {
  const itemA = a.sku;
  const itemB = b.sku;
  let comparison = 0;
  if (itemA > itemB) {
    comparison = 1;
  } else if (itemA < itemB) {
    comparison = -1;
  }
  return comparison;
}





async function getDataWithAuth(url){
  const request = { url: url, method: 'GET', };
  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  return await axios.get( request.url, { headers: authHeader });
}









// let date_ob = new Date();
// let year = date_ob.getFullYear();
// let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
// let date = ("0" + date_ob.getDate()).slice(-2);

// const fullDate = year + "-" + month + "-" + date


// async function getAllPages(n, urlPartial) {
//   let prevPageData = {}
//   const allData = {}
//   for (i=1; ; i++){
//     const urlCat = `${urlPartial}page=${i}`
//     const data = await getDataWithAuth(urlCat)
//     if (JSON.stringify(data) === JSON.stringify(prevPageData)){
//       break
//     }
//     prevPageData = {}
//     for (key in await data){
//       prevPageData[key] = data[key]
//       allData[key] = data[key]
//     }
//   }
//   await console.log('GET ALL DATA COMPLETE')
//   return await allData
// }

// async function getTodaysOrders(n, urlPartial){
//   // const allData = {}
//   const urlCat = `${urlPartial}filter[1][attribute]=created_at&filter[1][gte]=${fullDate}%2000:00:00&filter[2][attribute]=created_at&filter[2][lte]=${fullDate}%2023:59:59&`
//   //returns all the pages for the orders
//   const data = await getAllPages(n, urlCat)
//   return await data
// }