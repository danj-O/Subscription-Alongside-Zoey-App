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
  for (customer in data) {
    // console.log(data[customer].suggestedItems)

    // customer[data].suggestedItems.map(item => {
    //   const average = getAverage(item.qtyOrdered)
    // })
  }
  //get average of all qty ordered
  //multiply by price of item
  // return revenueTotal
}

function getAverage(numbers){  //takes an array of numbers and returns the average
  return numbers.reduce((a, b) => (a + b)) / numbers.length;
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