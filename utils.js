function getSuggestions(data){
  data.map(customer => {
    customer.suggestedItems.map(item => {
      item.purchaseInstances.sort(compareDates)  //sort the dates for comparing
      // console.log(item.purchaseInstances)
      let prevDate = null;
      const intervalsArray = [] //will fill with suggested intervals, so if there were more than two purchases, we need to compare them and find the most suitable option

      item.purchaseInstances.map(instance => {
        const currDate = new Date(`${instance.datesPurchased.split(' ')[0]}T${instance.datesPurchased.split(' ')[1]}`)
        if(prevDate !== null){
          const diff = Math.floor(currDate.getTime() - prevDate.getTime());
          const day = 1000 * 60 * 60 * 24;
          const days = Math.floor(diff/day);
          const suggestedInterval = findSuggestedInterval(days)
          // console.log("THIS", currDate, prevDate, days, suggestedInterval)
          intervalsArray.push(suggestedInterval)
        }
        prevDate = currDate
      })
      item.suggest = intervalsArray
      item.revenuePerMonth = getSingleItemRevenue(item)
    })
  })
  return data
}

function findSuggestedInterval(interval) {
  const intervalArray = [7, 14, 21, 28, 42, 56, 84]
  const weekSuggestArray = [1, 2, 3, 4, 6, 8, 12]
  const inDays =  intervalArray.reduce(function(prev, curr) {  //uses the psiArr to find the nearest psi to result from maths
    return (Math.abs(curr - interval) < Math.abs(prev - interval) ? curr : prev);
  });
  return weekSuggestArray[intervalArray.indexOf(inDays)]  // get index of in days and return the same index of weeks
}

function getSingleItemRevenue(item){
  //get interval and see how many intervals are in 1 month ie. if the interval is 2, multiply by 2, if its 8, divide by 2
  const mostCommonQty = getMostCommon(item.qtyOrdered) || Math.round(getAverage(item.qtyOrdered))
  const commonOrderPrice = item.price * mostCommonQty
  const mostCommonInterval = getMostCommon(item.suggest) || Math.round(getAverage(item.suggest))
  const result = commonOrderPrice * (4/mostCommonInterval)  //multiply commonroderprice with the amount of mostcommoninterval that fits in a month
  // console.log('result', result)
  return result
}

function getMostCommon(arr1){ //returns the most common suggestion interval from the suggest array
  var mf = 1;
  var m = 0;
  var item;
  for (var i=0; i<arr1.length; i++){
    for (var j=i; j<arr1.length; j++){
      if (arr1[i] == arr1[j]){
        m++;
      }
      if (mf<m){
        mf=m; 
        item = arr1[i];
      }
    }
    m=0;
  }
  // if(item == undefined){ //if there were no duplicates in the array
  //   // console.log("no doops")
  //   // return getAverage(Math.round(arr1))  //should return the mean or something
  //   return arr1[0]  //should return the mean or something
  // } else {
  //   // console.log(item+" ( " +mf +" times ) ") ;
  //   return item
  // }
  return item
}


function compareDates(a, b) {
  const itemA = a.datesPurchased;
  const itemB = b.datesPurchased;
  let comparison = 0;
  if (itemA > itemB) {
    comparison = 1;
  } else if (itemA < itemB) {
    comparison = -1;
  }
  return comparison;
}

const add = (a,b) => {
  return a+b
}

function makeObjectintoArray(data){
  const result = [];
  for (obj in data){
    const newObj = {
      address: data[obj].address,
      name: data[obj].name,
      email: data[obj].email,
      addressOthers: data[obj].addressOthers,
      suggestedItems: []
    }
    const newItemsArr = []
    for(itemObj in data[obj].suggestedItems){
      newObj.suggestedItems.push(data[obj].suggestedItems[itemObj])
    }
    result.push(newObj)
  }
  return result
}


function filterSamePurchaseCustomers(data){
  const filteredData = data.filter(customer => {
    return Object.keys(customer.multiPurchasedItems).length > 0 ? true : false
  })
  return filteredData
}

function compareStreet(a, b) {
  const itemA = a.address.street[0];
  const itemB = b.address.street[0];
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

function calculateDateFrom(getDataFrom){
  let date_ob = new Date();
  let year = date_ob.getFullYear();
  let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
  for (i = getDataFrom; i > 0; i--){
    if (month < 1){
      month = 12
      year--
    }
    month--
  }
  month = (month < 10 ? '0' : '')+month
  console.log('GETTING ALL DATA FROM: ', year, '-', month)
  return [year, month]
}


function getAverage(numbers){  //takes an array of numbers and returns the average
  const average = numbers.reduce((a, b) => (a + b)) / numbers.length;
  return average
}

module.exports = {
  add : add,
  filterSamePurchaseCustomers : filterSamePurchaseCustomers,
  compareStreet : compareStreet,
  compareSKU : compareSKU,
  convertToCSV : convertToCSV,
  sendNotifications : sendNotifications,
  calculateDateFrom : calculateDateFrom,
  makeObjectintoArray: makeObjectintoArray,
  getSuggestions: getSuggestions
}