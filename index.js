require('dotenv').config();
var CronJob = require('cron').CronJob;
var PORT = process.env.PORT || 3000;
// const Oauth1Helper = require('./auth')
const jwt = require('jsonwebtoken')
// const axios = require('axios')
var cors = require('cors')
var express = require('express');
const bodyParser = require("body-parser");
// const ObjectsToCsv = require('objects-to-csv');
// const utils = require('./utils')
// const cronUtil = require('./scheduledJobs')
const userAuth = require('./userAuth')
// const dbUtils = require('./mongo')
const MongoClient = require('mongodb').MongoClient;
var cookieParser = require('cookie-parser');
// const { CronJob } = require('cron');

var app = express();
const url = process.env.MONGO_URL;
let currentDate;
MongoClient.connect(url)
.then(async client =>{
  const db = client.db('ziptie');
  const custCollection = db.collection('customers');
  const subsCollection = db.collection('subscriptions');
  const cronCollection = db.collection('cron');
  app.locals.custCollection = custCollection;
  app.locals.subsCollection = subsCollection;
  app.locals.cronCollection = cronCollection;
  // const custData = getCustData()
  // console.log(custData)
  // currentDate = await cronUtil.getNewData(custCollection, subsCollection, cronCollection)
  // console.log(currentDate)
})

// async function getCustData(url){
//   const data = await getDataWithAuth('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/tokenbase/5')
//   console.log(data)
// }

app.use(cors())
app.set('view engine','ejs');
app.use(express.static(__dirname + '/'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []

  const cursor = await collection.find({
      "suggestedItems.status": 'new'
    })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('tabTemplate.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'New Subscription Suggestions',
        pagePath: 'new'
      })
    })
})
app.get('/contacted', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []
  const cursor = await collection.find({ 
      "suggestedItems.status": 'contacted' 
    })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('tabTemplate.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Contacted Customers',
        pagePath: 'contacted'
      })
    })
})
app.get('/potential', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []

    const cursor = await collection.find({
      "suggestedItems.status": 'potential'
      })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('tabTemplate.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Potential Subscriptions',
        pagePath: 'potential'
      })
    })
})
app.get('/not-interested', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []

    const cursor = await collection.find({
      "suggestedItems.status": 'not-interested'
      })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('tabTemplate.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Not Interested But Suggested',
        pagePath: 'not-interested'
      })
    })
})

app.get('/active', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []
    const cursor = collection.find({
      "subscriptions.status": 'active'
    })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('active.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Active Subscriptions',
        pagePath: 'active'
      })
    })
})
app.get('/paused', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []
    const cursor = collection.find({
      "subscriptions.status": 'paused'
    })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('active.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Paused Subscriptions',
        pagePath: 'paused'
      })
    })
})
app.get('/canceled', userAuth.verifyToken, async function(req, res, next){
  const collection = req.app.locals.custCollection;
  const resultArr = []
    const cursor = collection.find({
      "subscriptions.status": 'canceled'
    })
    await cursor.forEach((doc, err)=> {
      resultArr.push(doc)
    }, function(){
      revenue = 0
      res.render('active.ejs', { 
        customerPurchasesArr: resultArr,
        currentDate: currentDate,
        pageTitle: 'Canceled Subscriptions',
        pagePath: 'canceled'
      })
    })
})

app.get('/login', function(req,res){
  return res.render('login.ejs')
})
app.post('/login', (req, res) => {
  const pw = {
    password: req.body.password
  }
  if (req.body.password === process.env.APP_PASSWORD){
    var token = jwt.sign({pw : pw}, "secretkey", {expiresIn: '30s'} )
    res.cookie('JWT', token, {maxAge: 300000})
    res.redirect('/')
  } else {
    console.log("PASSWORD IS INCORRECT")
    res.redirect('/login')
  }
})


app.post('/changeStatus/:custAddress', userAuth.verifyToken, async (req, res) => { //adds a status to cust object that will decide which tab it goes into
  const collection = req.app.locals.custCollection;
  const addressID = req.params.custAddress.split(' ').join()
  console.log(req.body.status, req.params, req.body.purchaseSku, typeof(req.body.purchaseSku))
  // const filter = {"address": req.params.custAddress}
  const filter = {"address": req.params.custAddress, "suggestedItems.sku": req.body.purchaseSku}
  const update = {
    $set: {
      // status: req.body.status,
      // "suggestedItems.$[item].status": req.body.status,
      "suggestedItems.$.status": req.body.status
    }
  }
  // const options = {arrayFilters: [{"item.sku": req.body.purchaseSku}], 'multi':true}
  const options = {upsert: true}

    const cursor = await collection.findOneAndUpdate(filter, update, options)
    if(req.body.status == 'new'){
      res.redirect(`/#${addressID}`)
    } else {
      res.redirect(`/${req.body.status}#${addressID}`)
    }
})

app.post('/addNote/:custAddress', userAuth.verifyToken, async (req, res) => { // adds notes to customers
  const collection = req.app.locals.custCollection;
  const addressID = req.params.custAddress.split(' ').join()
  let filter = {}
  let update = {}
  if(req.body.purchaseSku == undefined){
    filter = {address: req.params.custAddress}
    update = {
      $set: {
        "notes": req.body.addNote
      }
    }
  } else {
    filter = {address: req.params.custAddress, "suggestedItems.sku": req.body.purchaseSku}
    update = {
      $set: {
        "suggestedItems.$.notes": req.body.addNote
      }
    }
  }
  const options = {upsert:true}
    const cursor = collection.findOneAndUpdate(filter, update, options)
    if(req.body.pagePath == 'new'){
      res.redirect(`/#${addressID}`)
    } else {
      res.redirect(`/${req.body.pagePath}#${addressID}`)
    }
})

// app.post('/addSubNote/:custAddress', userAuth.verifyToken, async (req, res) => { // adds notes to customers
//   const collection = req.app.locals.custCollection;
//   const addressID = req.params.custAddress.split(' ').join()
//   console.log(addressID)
//   let filter = {}
//   let update = {}
//   if(req.body.subNum == undefined){
//     filter = {address: req.params.custAddress}
//     update = {
//       $set: {
//         "notes": req.body.addSubNote
//       }
//     }
//   } else {
//     filter = {address: req.params.custAddress, "subscriptions.subNum": req.body.subNum}
//     update = {
//       $set: {
//         "subscriptions.$.notes": req.body.addSubNote
//       }
//     }
//   }
//   const options = {upsert:true}
//     const cursor = collection.findOneAndUpdate(filter, update, options)
//     if(req.body.pagePath == 'new'){
//       res.redirect(`/#${addressID}`)
//     } else {
//       res.redirect(`/${req.body.pagePath}#${addressID}`)
//     }
// })

app.listen(PORT, function(){
  console.log(`Server is running on ${PORT}`)
})


// -----------------START----------------------------------------------------------------- 

// let revenue = 0;
// const getDataFrom = 6 //months ago
// const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'
// let currentDate

// // var job = new CronJob('* * * * * *', function() {
// //   console.log('You will see this message every second');
// // }, null, true, 'America/Los_Angeles');
// // job.start();

// async function getNewData(custCollection, subsCollection, cronCollection){  //this function gets all data from m2 and removes any items that are repeats  in the db
//   await console.log('Started cron, this will take some time...')
  
//   // const subscriptions = await getDataWithAuth(`${baseUrl}/rest/V1/subscription/search?searchCriteria[pageSize]=0`)
//   // console.log(subscriptions.data)
//   // const subData = await dbUtils.appendSubscriptionsToCustomers(subscriptions.data.items, custCollection)
  
//   const dateFrom = utils.calculateDateFrom(getDataFrom)
  
//   const orders = await getData(`/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=created_at&searchCriteria[filter_groups][0][filters][0][value]=${dateFrom[0]}-${dateFrom[1]}-01 00:00:00&searchCriteria[filter_groups][0][filters][0][condition_type]=gt`) 
//   console.log('Data retrieved. Doing other cool stuff...')
//   const multiPurchaseCustData = await getMultiplePurchaseCustomerData(orders)  //get only customers by address who have made multiple purchases
//   const organizedData = await organizeData(multiPurchaseCustData) //array of customers who have purchased multiple times with all of their purchases sorted
//   const customerPurchasesArr = await comparePurchases(organizedData) //arr containing customers with multiple purchases and which products they have bought more than once
//   const samePurchaseCustomers = await utils.filterSamePurchaseCustomers(customerPurchasesArr)  //filters out the customers who didnt purchase the same thing
//   const filteredData = await compareDates(samePurchaseCustomers)  //check the difference in dates purchsed, THIS GIVES THE ACTUAL SUGGESTION
//   const arrayOfFilteredData = await utils.makeObjectintoArray(filteredData)
//   await dbUtils.appendNewDataToMongo(arrayOfFilteredData, custCollection)
  
//   const subscriptions = await getDataWithAuth(`${baseUrl}/rest/V1/subscription/search?searchCriteria[pageSize]=0`)  //pagesize 0 gets all
//   const subData = await dbUtils.appendSubscriptionsToCustomers(subscriptions.data.items, custCollection)
  
//   currentDate = new Date();  //create a timestamp of last data pull
//   dbUtils.sendCronUpdateToMongo(subscriptions.data.items.length + arrayOfFilteredData.length, cronCollection)
//   console.log('FINISHED WITH CRON', arrayOfFilteredData.length)
//   return filteredData
// }


// async function getData(suffix){
//   let response = await getDataWithAuth(`${baseUrl}${suffix}`)
//   const result = []
//   await response.data.items.map(item => {
//     if (item.state == 'complete' && item.extension_attributes.shipping_assignments[0].shipping.address !== undefined){
//       result.push({
//         name : item.billing_address.firstname,
//         email : item.customer_email,
//         createdAt : item.created_at,
//         items : item.items,
//         orderNumber : item.increment_id,
//         total : item.base_grand_total,
//         status : item.status,
//         address : item.extension_attributes.shipping_assignments[0].shipping.address,
//       })
//     } else {
//       // console.log("hmm", item.state, item.billing_address.firstname, item.increment_id, item.customer_email)  //logs all orders that get removed before processing
//     }
//   })
//   result.map(res => {
//     if (res.address == undefined){
//       console.log('custom_options', res.items[0].product_option.extension_attributes.custom_options)
//       console.log('configurable_item_options', res.items[0].product_option.extension_attributes.configurable_item_options)
//       console.log('parent item', res.items[1].parent_item)
//     }
//   })
//   // console.log(result.address.street)
//   try{
//     return await result.sort(utils.compareStreet) // sort the results by email
//   } catch(err){
//     console.log(err)
//   }
// }


// function organizeData(customersByAddress){  //FUNCTION THAT COMPARES ALL ORDERS MADE BY ONE PERSON FOR SIMILARITIES IN PRODUCTS PURCHASED
//   let result = [];
//   for (customer in customersByAddress){  // loop over cust obj, which is orders made by same email (get a single customer at a  time)
//     // console.log('ordernum', customersByAddress[customer])
//     // console.log('ordernum', customersByAddress[customer][0].orderNumber)

//       const customerPurchasedItems = []
//       customersByAddress[customer].map(purchases =>{  //loop through orders made by cust
//         // console.log(purchases)
//         purchases.items.map(purchase => {  //loop through items purchsed
//           customerPurchasedItems.push({
//             productName : purchase.name,
//             sku : purchase.sku,
//             qtyOrdered : purchase.qty_ordered,
//             createdAt : purchases.createdAt,
//             price : purchase.price,
//             orderNumber: purchases.orderNumber
//           })
//         })
//       })
//       customerPurchasedItems.sort(utils.compareSKU) //group purchases of same item together
//       result.push({
//         address : customersByAddress[customer][0].address.street[0],
//         name : customersByAddress[customer][0].name,
//         email : customersByAddress[customer][0].email,
//         addressOthers : customersByAddress[customer][0].address,
//         purchasedItems : customerPurchasedItems,
//         // orderNumber: customersByAddress[customer][0].orderNumber
//       })

//   }
//   return result
// }


// function comparePurchases(customersArr){
//   customersArr.map(customer => {
//     let prevItem = {}
//     let count = 0
//     customer.multiPurchasedItems = {}
//     customer.purchasedItems.map(item => {
//       if (item.sku === prevItem.sku && count < 1){ ////first time finding a duplicate purchase - if the skus are the same and we havent seen this item yet(count = 0)
//         if(prevItem.createdAt.split(' ')[0] !== item.createdAt.split(' ')[0]){  //if the items weren't bought at the same time
//           // console.log(item.sku, prevItem.createdAt.split(' ')[0], item.createdAt.split(' ')[0])
//           customer.multiPurchasedItems[item.sku] = {
//             productName: item.productName,
//             sku: item.sku,
//             price: item.price,
//             timesPurchased: 2,
//             purchaseInstances: [{qtyOrdered: prevItem.qtyOrdered, datesPurchased: prevItem.createdAt, orderNumber: prevItem.orderNumber}, {qtyOrdered: item.qtyOrdered, datesPurchased: item.createdAt, orderNumber: item.orderNumber}],
//             qtyOrdered: [prevItem.qtyOrdered, item.qtyOrdered],
//             datesPurchased: [prevItem.createdAt, item.createdAt]
//           }
//           count++  //
//         } else {  //otherwise, the items were bought at same time SAME DATE
//           // console.log("SAME DATE", item.sku, prevItem.createdAt, item.createdAt)
//           customer.multiPurchasedItems[item.sku] = {
//             productName: item.productName,
//             sku: item.sku,
//             price: item.price,
//             timesPurchased: 1,
//             purchaseInstances: [{qtyOrdered: prevItem.qtyOrdered + item.qtyOrdered, datesPurchased: item.createdAt, orderNumber: item.orderNumber}],
//             qtyOrdered: [prevItem.qtyOrdered + item.qtyOrdered], //add them together instead of adding separately bc they are same day and should be treated as 1 piurchase
//             datesPurchased: [item.createdAt]  //we dont need prev date bc it was the same
//           }
//           // count++
//         }
//       } else if (item.sku === prevItem.sku && count >= 1){  //after first time finding duplicate
//         if(prevItem.createdAt.split(' ')[0] !== item.createdAt.split(' ')[0]){  //if the items weren't bought at the same time
//           // console.log('NOTE BOUGHT AT SAME TIME AFTER FIRST')
//           customer.multiPurchasedItems[item.sku].timesPurchased++
//           customer.multiPurchasedItems[item.sku].purchaseInstances.push({qtyOrdered: item.qtyOrdered, datesPurchased: item.createdAt, orderNumber: item.orderNumber})
//           customer.multiPurchasedItems[item.sku].qtyOrdered.push(item.qtyOrdered)
//           customer.multiPurchasedItems[item.sku].datesPurchased.push(item.createdAt)
//           count++
//         } else{  //if the times were the same
//           customer.multiPurchasedItems[item.sku].qtyOrdered[customer.multiPurchasedItems[item.sku].qtyOrdered.length - 1] += item.qtyOrdered
//           customer.multiPurchasedItems[item.sku].purchaseInstances[customer.multiPurchasedItems[item.sku].purchaseInstances.length - 1].qtyOrdered += item.qtyOrdered
//         }
//       } else if(item.sku !== prevItem.sku) {
//         count = 0
//       }
//       prevItem = item
//     })
//   })
//   return customersArr
// }

// ////this needs to change to use  purchaseInstances and suggest only the suggested weeks we want available (round to nearest in an array of avail)
// function compareDates(customers){  
//   customers.map(customer => {
//     for (item in customer.multiPurchasedItems) {
//       if(customer.multiPurchasedItems[item].purchaseInstances.length > 1){  //if there are more than one purchase instances of the same item
//         //need to put purchases made on the same day in the same purchase instance
//         customer.multiPurchasedItems[item].suggest = true
//       } else {
//         customer.multiPurchasedItems[item].suggest = false
//       }
//     }
//   })
//   const filtered = filterOutByDate(customers)
//   return filtered
// }

// function filterOutByDate(customers){
//   const result = {}
//   for (customer in customers) { //loop through customers
//     if (Object.keys(customers[customer].multiPurchasedItems).length > 0){  //if the customer has multi purchases
//       const newCustomerObj = {
//         address : customers[customer].address,
//         name : customers[customer].name,
//         email : customers[customer].email,
//         addressOthers : customers[customer].addressOthers,
//         suggestedItems : {}
//       }
//       for(item in customers[customer].multiPurchasedItems){  //loop through multi purchases
//         // console.log('ITEM', customers[customer].multiPurchasedItems[item])
//         if (customers[customer].multiPurchasedItems[item].suggest == false || customers[customer].multiPurchasedItems[item].suggest == undefined || customers[customer].multiPurchasedItems[item].suggest == null || customers[customer].multiPurchasedItems[item].suggest == {}) {  //if there is no suggestion in the object
//         } else {
//           newCustomerObj.suggestedItems[item] = customers[customer].multiPurchasedItems[item]
//           result[customers[customer].address] = newCustomerObj
//         }
//       }
//     } else {
//     }
//   }
//   return result
// }

// function getMultiplePurchaseCustomerData(orders){
//   let prevOrder = {
//     address: {
//       street: []
//     }
//   }
//   const dataByAddress = {}
//   orders = orders.filter(order => order.orderNumber !== undefined ? true : false)
//   orders.map(order => { 
//     // console.log('order', order)
//     if (order.address.street[0] == prevOrder.address.street[0]){  //if there are multiple purchases by saem address
//       if (!dataByAddress.hasOwnProperty(order.address.street[0])){  //if the databyemail obj does already include this order, add the prev as well
//         dataByAddress[order.address.street[0]] = [prevOrder]
//       }
//       dataByAddress[order.address.street[0]].push(order)  //add current order to multipurchases obj under the correct email param
//     }
//     prevOrder = order
//   })
//   return dataByAddress  //return all orders made by same cust email in organized obj
// }


// async function getDataWithAuth(url){
//   try{
//     const request = { url: url, method: 'GET', };
//     const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
//     return await axios.get( request.url, { headers: authHeader });
//   } catch (err){
//     console.log(err)
//   }
// }

// async function deleteSubscription(subId){
//   const url = `${baseUrl}/rest/V1/subscription/${subId}`
//   try{
//     const request = { url: url, method: "DELETE"}
//     const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
//     return await axios.delete( request.url, { header: authHeader })
//   }catch(err){
//     console.log(err)
//   } finally {
//     console.log(`subscription #${subId} was deleted from m2 db`)
//   }
// }