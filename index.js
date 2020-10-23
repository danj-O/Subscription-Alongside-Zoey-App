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

let date_ob = new Date();
let year = date_ob.getFullYear();
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let date = ("0" + date_ob.getDate()).slice(-2);

const fullDate = year + "-" + month + "-" + date

getAll()

async function getAll(){
  const orders = await getData('/rest/V1/orders?searchCriteria=all')
  await orders.sort(compareEmail)
  const multiPurchaseCustEmails = getMultiplePurchaseCustomerEmails(orders)
  console.log(multiPurchaseCustEmails)
  // build an object for each customer containing the 


  // const allCustomerNames = await getData('/rest/V1/customers/search?searchCriteria[sortOrders][0][field]=email&searchCriteria[sortOrders][0][direction]=asc', 'firstname')
}

async function getData(suffix, param){
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
      total : item.base_grand_total
    })
  })
  return result
}

//FUNCTION THAT COMPARES ALL ORDERS MADE BY ONE PERSON FOR SIMILARITIES IN PRODUCTS PURCHASED

//IF THERE ARE SIMILARITIES, CHECK THE FREQUENCY OF THESE ORDERS (HOW FREQUENT IS ENOUGH???)

//IF THERE ARE SIMILARITIES AND FREQUENCY, NOTIFY ADMIN AND CUSTOMER

function getMultiplePurchaseCustomerEmails(orders){
  let prevOrder = {}
  const emails = []
  orders.map(order => {
    if (order.email == prevOrder.email){
      // add a param to order obj?
      // order.purchaseCount++
      emails.push(order.email)
    }
    prevOrder = order
  })
  //uniqueemails are all of the emails of customers who have made multiple purchases
  const uniqueEmails = [...new Set(emails)]
  return uniqueEmails
}

function compareEmail(a, b) {
  const bandA = a.email;
  const bandB = b.email;
  let comparison = 0;
  if (bandA > bandB) {
    comparison = 1;
  } else if (bandA < bandB) {
    comparison = -1;
  }
  return comparison;
}





async function getDataWithAuth(url){
  const request = { url: url, method: 'GET', };
  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  return await axios.get( request.url, { headers: authHeader });
}







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