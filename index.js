require('dotenv').config();
var PORT = process.env.PORT || 3000;
const Oauth1Helper = require('./auth')
const axios = require('axios')
var cors = require('cors')
var express = require('express');
const bodyParser = require("body-parser");
const ObjectsToCsv = require('objects-to-csv');


var app = express();

app.use(cors())
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.get('/', function(req, res){
  // const customerPurchasesArr = getAll()
  // const customerPurchasesArr = ["CUSTOMER DATAAAAAA", 'en', 'ga']
  // return res.render('index.ejs', { customerPurchasesArr: samePurchaseCustomers })
  // return res.render('index.ejs')
})
app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})


// -----------------START----------------------------------------------------------------- 
let samePurchaseCustomers = [];
const getDataFrom = 2 //month
const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'
getAll()

async function getAll(){
  // const subscriptions = await getDataWithAuth(`${baseUrl}/rest/V1/subscription/search?searchCriteria[pageSize]=1`)
  // console.log('subscriptions', subscriptions.data)

  await console.log('Started getting data, this will take some time...')
  const dateFrom = calculateDateFrom()

  const orders = await getData(`/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=${dateFrom[0]}-${dateFrom[1]}-01 00:00:00&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`) 
  // const orders = await getData('/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=2020-01-01 00:00:00&searchCriteria[filter_groups][0][filters][0][condition_type]=gt') 
  // const orders = await getData('/rest/V1/orders?searchCriteria=all')  //get the data and sort it all by email
  // await console.log(orders)
  const multiPurchaseCustData = await getMultiplePurchaseCustomerData(orders)  //get only customers who have made multiple purchases
  // console.log(multiPurchaseCustData)
  const organizedData = await organizeData(multiPurchaseCustData) //array of customers who have purchased multiple times with all of their purchases sorted
  // await console.log("organized", organizedData[10].purchasedItems)
  const customerPurchasesArr = await comparePurchases(organizedData) //arr containing customers with multiple purchases and which products they have bought more than once
  // await console.log('Getting the customers who purchased the same thing...')
  samePurchaseCustomers = await filterSamePurchaseCustomers(customerPurchasesArr)  //filters out the customers who didnt purchase the same thing
  console.log('SAME PURCHASE CUSTOMERS ARRAY', samePurchaseCustomers[5], samePurchaseCustomers.length)

  //need to check dates of purcheses to suggest
  // compareDates(samePurchaseCustomers)

  // convertToCSV(samePurchaseCustomers)
  // sendNotifications(samePurchaseCustomers)

  return samePurchaseCustomers
}

async function getData(suffix){
  let response = await getDataWithAuth(`${baseUrl}${suffix}`)
  // console.log('created_at ', response.data.items[1000].created_at)
  const result = []
  // console.log(response.data.items[0])
  await response.data.items.map(item => {
    // console.log(item.state, item.status)
    if (item.state == 'complete'){
      result.push({
        name : item.billing_address.firstname,
        email : item.customer_email,
        createdAt : item.created_at,
        items : item.items,
        orderNumber : item.increment_id,
        total : item.base_grand_total,
        status : item.status
        // customerId : item.customer_id
      })
    }
  })
  return await result.sort(compareEmail) // sort the results by email
}

//FUNCTION THAT COMPARES ALL ORDERS MADE BY ONE PERSON FOR SIMILARITIES IN PRODUCTS PURCHASED
function organizeData(customersByEmail){
  let result = [];
  // loop over cust obj, which is orders made by same email (get a single customer at a  time)
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
          createdAt : purchases.createdAt,
        })
      })
    })
    //group purchases of same item together
    customerPurchasedItems.sort(compareSKU)
    result.push({
      name : customersByEmail[customer][0].name,
      email : customersByEmail[customer][0].email,
      // createdAt : customersByEmail[customer][0].createdAt,
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
        customer.multiPurchasedItems.push(prevItem)
        customer.multiPurchasedItems.push(item)
        count++
      } else if (item.sku === prevItem.sku && count >= 1){
        customer.multiPurchasedItems.push(item)
        // count++
      } else {
        count = 0
      }
      prevItem = item
    })
    // console.log('CUSTOMER', customer)
  })
  return customersArr
}

function compareDates(customers){
  customers.map(customer => {
    console.log(customer.name)
    let prevItem = {};
    customer.multiPurchasedItems.map(item => {
      const date = item.createdAt.split(' ')[0]
      // console.log(date)
      if(item.sku == prevItem.sku){
        const prevDate = prevItem.createdAt.split(' ')[0]
        console.log(prevDate, date, item.sku)
        const dateDiff = getDateDiff(prevDate, date)
        // console.log(dateDiff)
        //compare prev to item dates and return a true or false?
      }
      prevItem = item
    })
  })
}

function getDateDiff(prevDate, date){
  const prevDateArr = prevDate.split('-')
  const prevYear = prevDateArr[0]
  const prevMonth = prevDateArr[1]

  const dateArr = date.split('-')
  const year = dateArr[0]
  const month = dateArr[1]

  // const difference = 

  return [prevYear, prevMonth, year, month]
}

function filterSamePurchaseCustomers(data){
  const filteredData = data.filter(customer => {
    return customer.multiPurchasedItems.length > 0 ? true : false
  })
  return filteredData
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


async function convertToCSV(data){
  data.map(customer =>{
    customer.purchasedItems = []
  })
  const csv = new ObjectsToCsv(data);
  // Save to file:
  await csv.toDisk(`./customerList.csv`);
  console.log('CSV CREATED')
  // Return the CSV file as string:
  // console.log(await csv.toString());
}

function calculateDateFrom(){
  let date_ob = new Date();
  let year = date_ob.getFullYear();
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  // month = 4
  // console.log(year, month)
  for (i = getDataFrom; i > 0; i--){
    if (month < 1){
      month = 12
      year--
    }
    month--
  }
  month = (month < 10 ? '0' : '')+month
  console.log('GETTING ALL DATA FROM: ', year, '-', month)
  // let date = ("0" + date_ob.getDate()).slice(-2);
  return [year, month]
}

async function getDataWithAuth(url){
  try{
    const request = { url: url, method: 'GET', };
    const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
    return await axios.get( request.url, { headers: authHeader });
  } catch (err){
    console.log(err)
  }
}


async function sendNotifications(data){
  const msg = {
    to: 'dan@danjomedia.com',
    from: 'admin@sgy.co',
    subject: `Recommended Customers for Subscriptions`,
    html: createHTML(data),
    // attachments: [
    //   {
    //     content: attachment2,
    //     fileName: `${origData.batchName}.csv`,
    //     type: 'text/csv',
    //     dispostion: 'attachment'
    //   }
    // ]
  };
  await sgMail
    .send(msg)
    .then(() => {}, error => {
      console.error(error);
  
      if (error.response) {
        console.error(error.response.body)
      }
    });
  await console.log(`Email Sent to ${origData.sendZipEmail}`)
}

//takes all data and returns a string of html code
//containing all customers and their data who should get subscription
function createHTML(data){
  data.map(customer => {

    `<h1>${customer.name}</h1>
    <h3>purchased</h3>
    <p> ${origData.message} </p>
    <h4>ASID/URL List:</h4>
    <p> ${origData.batchUrls} </p>`
  })
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