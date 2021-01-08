require('dotenv').config();
var CronJob = require('cron').CronJob;
var PORT = process.env.PORT || 3000;
const jwt = require('jsonwebtoken')
var cors = require('cors')
var express = require('express');
const bodyParser = require("body-parser");
const userAuth = require('./userAuth')
const closeUtils = require('./closeUtils')
const MongoClient = require('mongodb').MongoClient;
var cookieParser = require('cookie-parser');

var app = express();
const url = process.env.MONGO_URL;

let currentDate;

MongoClient.connect(url)
.then(async client =>{
  const db = client.db('ziptie');
  const custCollection = db.collection('customers');
  const subsCollection = db.collection('subscriptions');
  const cronCollection = db.collection('cron');
  app.locals.custCollection = custCollection;  //these allow the routes to see the collection
  app.locals.subsCollection = subsCollection;
  app.locals.cronCollection = cronCollection;
  // const custData = getCustData()
  // console.log(custData)
  // currentDate = await cronUtil.getNewData(custCollection, subsCollection, cronCollection)
  // console.log(currentDate)
  await mostRecentCron(cronCollection)
  // await console.log("make it here?", currentDate)

})
async function mostRecentCron(collection){
  const resultArr = []
  const cursor = await collection.find().sort({'date_run': -1}).limit(1)
  await cursor.forEach((doc, err)=> {
    resultArr.push(doc)
  }, function(){
    // console.log("thisssss", resultArr[0].date_run)
    currentDate = JSON.parse(JSON.stringify(resultArr[0].date_run))
    currentDate = currentDate.split('T')[0]
  })
};
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

app.post('/addLead/:custAddress', userAuth.verifyToken, async(req, res)=>{
  const collection = req.app.locals.custCollection;
  const addressID = req.params.custAddress.split(' ').join()
  
  collection.findOneAndUpdate({ address: req.params.custAddress }, { $set: { addedToClose: true } }, { returnNewDocument: true })
  .then(updatedDocument => {
    closeUtils.createLead(updatedDocument.value)
  })
  if(req.body.pagePath == 'new'){
    res.redirect(`/#${addressID}`)
  } else {
    res.redirect(`/${req.body.pagePath}#${addressID}`)
  }
})

app.post('/removeAddedToCloseStatus/:custAddress', userAuth.verifyToken, async(req, res) => {
  const collection = req.app.locals.custCollection;
  const addressID = req.params.custAddress.split(' ').join()

  collection.updateOne({ address: req.params.custAddress }, { $set: { addedToClose: false } }, { upsert: true })
  if(req.body.pagePath == 'new'){
    res.redirect(`/#${addressID}`)
  } else {
    res.redirect(`/${req.body.pagePath}#${addressID}`)
  }
})



app.listen(PORT, function(){
  console.log(`Server is running on ${PORT}`)
})