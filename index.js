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

const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'

let date_ob = new Date();
let year = date_ob.getFullYear();
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let date = ("0" + date_ob.getDate()).slice(-2);

const fullDate = year + "-" + month + "-" + date

getAllAll()

async function getAllAll(){
  // allCustomers = await getDataWithAuth('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/customers/29')
  // allCustomers = await getDataWithAuth('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/customers/search?searchCriteria[sortOrders][0][field]=email&searchCriteria[sortOrders][0][direction]=asc')
  // const allOrders = await getDataWithAuth('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/orders?searchCriteria=all')
  // allProducts = await getDataWithAuth('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/products?searchCriteria=all')

  // await console.log("PRODUCTS", allProducts.data.items[0].extension_attributes.website_ids)
  const allProductIds = await getAllProductIds()
  console.log("all product ids", allProductIds)
  // const allCustomerNames = await getAllCustomerNames()
  // console.log("allCustomerNames", allCustomerNames)
  
  // await console.log("ORDERS",allOrders.data.items.length)
  // await console.log("CUSTOMERS", typeof( allCustomers.data))

  // allProducts = await getAllPages(1, `https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/products/?SearchCriteria[pageSize]=10`)
  // todaysOrders = await getTodaysOrders(`n`, `https://ts967672-container.zoeysite.com/api/rest/orders?`)
}

async function getDataWithAuth(url){
  const request = { url: url, method: 'GET', };
  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  return await axios.get( request.url, { headers: authHeader });
}

async function getAllProductIds(){
  const allProducts = await getDataWithAuth(`${baseUrl}/rest/V1/products?searchCriteria=all`)
  const result = []
  allProducts.data.items.map(product => result.push(product.id))
  return result
}
async function getAllCustomerNames(){
  const allCustomers = await getDataWithAuth(`${baseUrl}/rest/V1/customers/search?searchCriteria[sortOrders][0][field]=email&searchCriteria[sortOrders][0][direction]=asc`)
  const result = []
  allCustomers.data.items.map(product => result.push(product.firstname))
  return result
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