require('dotenv').config();
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
app.listen(3000, function(){
  console.log("Server is running on port 3000")
})

let allCustomers = {};
let allProducts = {};
let todaysOrders = {};
let date_ob = new Date();
let year = date_ob.getFullYear();
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
let date = ("0" + date_ob.getDate()).slice(-2);

const fullDate = year + "-" + month + "-" + date

getAllAll()

async function getAllAll(){
  // allCustomers = await getDataWithAuth2('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/customers/1')
  const allOrders = await getDataWithAuth2('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/orders?searchCriteria=all')
  // allProducts = await getDataWithAuth2('https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/products?searchCriteria=all')

  // await console.log(allProducts.data)
  await console.log(allOrders.data.items.length)

  // allProducts = await getAllPages(1, `https://2ieb7j62xark0rjf.mojostratus.io/rest/V1/products/?SearchCriteria[pageSize]=10`)
  // todaysOrders = await getTodaysOrders(`n`, `https://ts967672-container.zoeysite.com/api/rest/orders?`)
}


async function getDataWithAuth2(url){
  const request = { url: url, method: 'GET', };
  const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
  return await axios.get( request.url, { headers: authHeader });
}



async function getAllPages(n, urlPartial) {
  let prevPageData = {}
  const allData = {}
  for (i=1; ; i++){
    const urlCat = `${urlPartial}page=${i}`
    const data = await getDataWithAuth(urlCat)
    if (JSON.stringify(data) === JSON.stringify(prevPageData)){
      break
    }
    prevPageData = {}
    for (key in await data){
      prevPageData[key] = data[key]
      allData[key] = data[key]
    }
  }
  await console.log('GET ALL DATA COMPLETE')
  return await allData
}

async function getTodaysOrders(n, urlPartial){
  // const allData = {}
  const urlCat = `${urlPartial}filter[1][attribute]=created_at&filter[1][gte]=${fullDate}%2000:00:00&filter[2][attribute]=created_at&filter[2][lte]=${fullDate}%2023:59:59&`
  //returns all the pages for the orders
  const data = await getAllPages(n, urlCat)
  return await data
}