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
  // get index of in days and return the same index of weeks
  return weekSuggestArray[intervalArray.indexOf(inDays)]
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
      // data[obj].suggestedItems[itemObj].status = ''
      newObj.suggestedItems.push(data[obj].suggestedItems[itemObj])
    }
    result.push(newObj)
    // console.log("REASULTT", newObj)
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

function getRevenue(data){
  // console.log(typeof(data))
  let total = 0
  for (customer in data) {  //loop thru customers
    for (item in data[customer].suggestedItems){  //loop thru items purchased by customer

      if (data[customer].suggestedItems[item].suggest[1] == 'day' && data[customer].suggestedItems[item].suggest[0] < 7){
        delete data[customer].suggestedItems[item]
        if (Object.keys(data[customer].suggestedItems).length < 1){
          // console.log('SHOULD DELTE')
          delete data[customer]
        }
        continue
      }
      let suggestedQty;
      const mean = getMean(data[customer].suggestedItems[item].qtyOrdered)  // get the mean of array of qtypurchased
      if (mean[0] === undefined){  //get mean will return undefined if there is no item with more than 1 occurance
        const average = getAverage(data[customer].suggestedItems[item].qtyOrdered)  //if that's the case, get an average of all qtys
        suggestedQty = average
      } else {
        suggestedQty = mean[0]
      }
      const singlePurchaseRevenue = suggestedQty * data[customer].suggestedItems[item].price
      const singlePurchaseRevenuePerMonth = getSinglePurchaseRevenuePerMonth(data[customer].suggestedItems[item].suggest, singlePurchaseRevenue)
      data[customer].suggestedItems[item].singlePurchaseRevenuePerMonth = singlePurchaseRevenuePerMonth
      total += singlePurchaseRevenuePerMonth
      // console.log(data[customer])
    }
  }
  console.log('TOTAL', total)
  return total.toFixed(2)
}

function getSinglePurchaseRevenuePerMonth(suggestArr, rev){
  let result
  if(suggestArr[1] == 'day'){
    // const purchaseTimes = Math.floor(30 / suggestArr[0])  //we don't REALLY need to round down here, maybe we shouldn't even
    const purchaseTimes = 30 / suggestArr[0]  //we don't REALLY need to round down here, maybe we shouldn't even
    result = rev * purchaseTimes
  }else if(suggestArr[1] == 'month'){
    result = rev
  }else if(suggestArr[1] == 'year'){
    //nothing yet as we can't wuery this far back
  }
  return result
}

function getMean(arr1){
  var mf = 1;
var m = 0;
var item;
for (var i=0; i<arr1.length; i++)
{
        for (var j=i; j<arr1.length; j++)
        {
                if (arr1[i] == arr1[j])
                  m++;
                if (mf<m)
                {
                  mf=m; 
                  item = arr1[i];
                }
        }
        m=0;
}
// console.log(item+" ( " +mf +" times ) ") ;
return [item, mf]
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
  getRevenue : getRevenue,
  makeObjectintoArray: makeObjectintoArray,
  getSuggestions: getSuggestions
}