const add = (a,b) => {
  return a+b
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

function getRevenue(data){
  let total = 0
  for (customer in data) {  //loop thru customers
    for (item in data[customer].suggestedItems){  //loop thru items purchased by customer

      if (data[customer].suggestedItems[item].suggest[1] == 'day' && data[customer].suggestedItems[item].suggest[0] < 5){
        delete data[customer].suggestedItems[item]
        if (Object.keys(data[customer].suggestedItems).length < 1){
          console.log('SHOULD DELTE')
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
      console.log(data[customer])

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

}