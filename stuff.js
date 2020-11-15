async function getAndCompareWithNew(array){
  try {
    await client.connect();
    const database = client.db('ziptie');
    const collection = database.collection('customers');

    array.map((customer)=>{  //map thrtough new logs of customers
      const query = {address: customer.address} // query the address of the current customer
      const update = {
        $set: {  //i want to add a new customer if doesn't exist in db, otherwise make ammendments to existing customer
          name: customer.name, // this will never change
          email: customer.email,  //this will never change
          addressOthers: customer.addressOthers,  //will never change
          suggestedItems: customer.suggestedItems,  //suggestedItems is an array and I will need to push new items OR append existing items' nested data
        },
        // $push: {
        // }
      }
      const options = {upsert: true}

      collection.updateOne(query, update, options)
    })
  } finally {
    await client.close();
  }
}

//the suggested items array contains objects that look like this:
{
  productname: 'name';  //wont change
  sku: 1234556, //wont change
  price: 11.00,  //wont change
  timesPUrchased: 2,  //will need to increment
  qtyordered: [10,20]  //will need to get updated - new data pushed to array
  datepurchased: ["2020-09-22 11:56:12", "2020-10-05 05:33:35"]  //will need to get updated - new data pushed to array
}

