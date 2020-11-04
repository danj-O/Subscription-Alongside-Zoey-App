require('dotenv').config();
var PORT = process.env.PORT || 3000;
const Oauth1Helper = require('./auth')
const axios = require('axios')
var cors = require('cors')
var express = require('express');
const bodyParser = require("body-parser");
const ObjectsToCsv = require('objects-to-csv');
const utils = require('./utils')

var app = express();

app.use(cors())
app.use(express.static(__dirname + '/'));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res){
  return res.render('index.ejs', { customerPurchasesArr: filteredData, revenue: revenue, getDataFrom: getDataFrom })
})

app.listen(PORT, function(){
  console.log("Server is running on port 3000")
})


// -----------------START----------------------------------------------------------------- 


let filteredData = [];
let revenue;
const getDataFrom = 1 //month
const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'
getAll()

async function getAll(){
  // const subscriptions = await getDataWithAuth(`${baseUrl}/rest/V1/subscription/search?searchCriteria[pageSize]=1`)
  // console.log('subscriptions', subscriptions.data)

  await console.log('Started getting data, this will take some time...')
  const dateFrom = utils.calculateDateFrom(getDataFrom)

  const orders = await getData(`/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=${dateFrom[0]}-${dateFrom[1]}-01 00:00:00&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`) 
  // await console.log('ORDER', orders[0])
  const multiPurchaseCustData = await getMultiplePurchaseCustomerData(orders)  //get only customers by address who have made multiple purchases
  // console.log(multiPurchaseCustData['930 Steward Street'][0].items)
  const organizedData = await organizeData(multiPurchaseCustData) //array of customers who have purchased multiple times with all of their purchases sorted
  // await console.log("organized", organizedData[0].purchasedItems)
  const customerPurchasesArr = await comparePurchases(organizedData) //arr containing customers with multiple purchases and which products they have bought more than once
  // await console.log('Getting the customers who purchased the same thing...')
  samePurchaseCustomers = await utils.filterSamePurchaseCustomers(customerPurchasesArr)  //filters out the customers who didnt purchase the same thing
  // console.log('SAME PURCHASE CUSTOMERS ARRAY', samePurchaseCustomers[0], samePurchaseCustomers.length)
  // console.log('all multi custs', customerPurchasesArr.length)
  filteredData = compareDates(samePurchaseCustomers)  //check the difference in dates purchsed
  // console.log('filtered ', filteredData)
  revenue = utils.getRevenue(filteredData)
  // utils.convertToCSV(samePurchaseCustomers)
  // utils.sendNotifications(samePurchaseCustomers)
  return filteredData
}


async function getData(suffix){
  let response = await getDataWithAuth(`${baseUrl}${suffix}`)
  const result = []
  // console.log(response.data.items[1].extension_attributes.shipping_assignments[0].shipping.address)
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
        status : item.status,
        address : item.extension_attributes.shipping_assignments[0].shipping.address,
      })
    }
  })
  return await result.sort(utils.compareStreet) // sort the results by email
}


function organizeData(customersByAddress){  //FUNCTION THAT COMPARES ALL ORDERS MADE BY ONE PERSON FOR SIMILARITIES IN PRODUCTS PURCHASED
  let result = [];
  for (customer in customersByAddress){  // loop over cust obj, which is orders made by same email (get a single customer at a  time)
    // console.log('CUSTOMER', customer, customersByAddress[customer])
    const customerPurchasedItems = []
    customersByAddress[customer].map(purchases =>{  //loop through orders made by cust
      purchases.items.map(purchase => {  //loop through items purchsed
        // console.log('PURCHASE', purchase)
        customerPurchasedItems.push({
          productName : purchase.name,
          sku : purchase.sku,
          qtyOrdered : purchase.qty_ordered,
          createdAt : purchases.createdAt,
          price : purchase.price
        })
      })
    })
    customerPurchasedItems.sort(utils.compareSKU) //group purchases of same item together
    result.push({
      address : customersByAddress[customer][0].address.street[0],
      name : customersByAddress[customer][0].name,
      email : customersByAddress[customer][0].email,
      addressOthers : customersByAddress[customer][0].address,
      purchasedItems : customerPurchasedItems
    })
  }
  return result
}


function comparePurchases(customersArr){
  customersArr.map(customer => {
    let prevItem = {}
    let count = 0
    customer.multiPurchasedItems = {}
    customer.purchasedItems.map(item => {
      if (item.sku === prevItem.sku && count < 1){ ////first time finding a duplicate purchase - if the skus are the same and we havent seen this item yet(count = 0)
        if(prevItem.createdAt !== item.createdAt){  //if the items weren't bought at the same time
          customer.multiPurchasedItems[item.sku] = {
            productName: item.productName,
            sku: item.sku,
            price: item.price,
            timesPurchased: 2,
            qtyOrdered: [prevItem.qtyOrdered, item.qtyOrdered],
            datesPurchased: [prevItem.createdAt, item.createdAt]
          }
          count++  //
        } else {  //otherwise, the items were bought at same time SAME DATE
          customer.multiPurchasedItems[item.sku] = {
            productName: item.productName,
            sku: item.sku,
            price: item.price,
            timesPurchased: 1,
            qtyOrdered: [prevItem.qtyOrdered + item.qtyOrdered], //add them together instead of adding separately bc they are same day and should be treated as 1 piurchase
            datesPurchased: [item.createdAt]  //we dont need prev date bc it was the same
          }
          // count++
        }
      } else if (item.sku === prevItem.sku && count >= 1){  //after first time finding duplicate
        if(prevItem.createdAt !== item.createdAt){  //if the items weren't bought at the same time
          customer.multiPurchasedItems[item.sku].timesPurchased++
          customer.multiPurchasedItems[item.sku].qtyOrdered.push(item.qtyOrdered)
          customer.multiPurchasedItems[item.sku].datesPurchased.push(item.createdAt)
          count++
        } else{  //if the times were the same
          customer.multiPurchasedItems[item.sku].qtyOrdered[customer.multiPurchasedItems[item.sku].qtyOrdered.length - 1] += item.qtyOrdered
        }
      } else if(item.sku !== prevItem.sku) {
        // console.log('new item')
        count = 0
      }
      prevItem = item
      console.log(customer.name, count, customer.multiPurchasedItems[item.sku])
    })
  })
  return customersArr
}


function compareDates(customers){
  customers.map(customer => {
    // console.log(customer.name)
    for (item in customer.multiPurchasedItems) {
      let prevDate = [];
      for (date in customer.multiPurchasedItems[item].datesPurchased){
        const dateArr = customer.multiPurchasedItems[item].datesPurchased[date].split(' ')
        const dateNoTimeArr = dateArr[0].split('-')
        // const year = dateNoTimeArr[0]
        // const month = dateNoTimeArr[1]
        // const day = dateNoTimeArr[2]
        if(dateNoTimeArr[0] == prevDate[0] && dateNoTimeArr[1] == prevDate[1] && prevDate.length > 0){  //if the purchase was on the same day
          if(dateNoTimeArr[2] == prevDate[2]){
            // console.log('SAMEDAY SAME PURCHASE')
            const dateIndex = customer.multiPurchasedItems[item].datesPurchased.indexOf(date)
            if (dateIndex > -1) {
              customer.multiPurchasedItems[item].datesPurchased.splice(dateIndex, 1);
            }

          } else {
            const daysApart = dateNoTimeArr[2] - prevDate[2]
            // console.log('SAME MONTH PURCHASE ', dateNoTimeArr, prevDate, daysApart, 'days apart')
            customer.multiPurchasedItems[item].suggest = [daysApart, 'day']
          }
        } else if (dateNoTimeArr[0] == prevDate[0] && dateNoTimeArr[1] !== prevDate[1] && prevDate.length > 0){  //if the year is the same and the month is different
          const monthsApart = dateNoTimeArr[1] - prevDate[1]
          // console.log('PURCHASED AT A LATER DATE', prevDate, dateNoTimeArr, monthsApart, 'months apart')
          customer.multiPurchasedItems[item].suggest = [monthsApart, 'month']
        } else if (dateNoTimeArr[0] !== prevDate[0] && prevDate.length > 0){  //if the year is different
          const yearsApart = dateNoTimeArr[0] - prevDate[0]
          // console.log('YEARS AOPART', dateNoTimeArr[0], prevDate[0])
          // console.log('PURCHASED IN A DIFF YEAR', prevDate, dateNoTimeArr, yearsApart, 'years')
          customer.multiPurchasedItems[item].suggest = [yearsApart, 'year']
        } else {
          // console.log(prevDate, dateNoTimeArr)
        }
        prevDate = dateNoTimeArr
      }
    }
    // console.log(customer.multiPurchasedItems)
  })
  const filtered = filterOutByDate(customers)
  // console.log('finish + length:', filtered.length)
  return filtered
}

function filterOutByDate(customers){
  const result = {}
  for (customer in customers) { //loop through customers
    // delete customers[customer].purchasedItems
    if (Object.keys(customers[customer].multiPurchasedItems).length > 0){  //if the customer has multi purchases
      const newCustomerObj = {
        address : customers[customer].address,
        name : customers[customer].name,
        email : customers[customer].email,
        addressOthers : customers[customer].addressOthers,
        suggestedItems : {}
      }
      for(item in customers[customer].multiPurchasedItems){  //loop through multi purchases
        if (customers[customer].multiPurchasedItems[item].suggest == undefined || customers[customer].multiPurchasedItems[item].suggest == null || customers[customer].multiPurchasedItems[item].suggest == {}) {  //if there is no suggestion in the object
        } else {
          newCustomerObj.suggestedItems[item] = customers[customer].multiPurchasedItems[item]
          result[customers[customer].address] = newCustomerObj
        }
      }
    } else {
    }
  }
  return result
}

function getMultiplePurchaseCustomerData(orders){
  let prevOrder = {
    address: {
      street: []
    }
  }
  const dataByAddress = {}
  orders.map(order => { 
    if (order.address.street[0] == prevOrder.address.street[0]){  //if there are multiple purchases by saem address
      if (!dataByAddress.hasOwnProperty(order.address.street[0])){  //if the databyemail obj does already include this order, add the prev as well
        dataByAddress[order.address.street[0]] = [prevOrder]
      }
      dataByAddress[order.address.street[0]].push(order)  //add current order to multipurchases obj under the correct email param
    }
    prevOrder = order
  })
  return dataByAddress  //return all orders made by same cust email in organized obj
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