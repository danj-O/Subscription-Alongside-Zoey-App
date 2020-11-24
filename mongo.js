const MongoClient = require('mongodb').MongoClient;
const utils = require('./utils')

testArray = [{
  address: "1000 W. Vista Bonita Drive Suite B101",
  email: '123@abc.com',
  name: 'bobby joe',
  addressOthers: 'stuff',
  suggestedItems: [{
    productName: 'new prod',
    sku: '220246',
    price: 4,
    timesPurchased: 2,
    purchaseInstances: [
      {
        qtyOrdered: 2,
        datesPurchased: 'yesterday',
      },
      {
        qtyOrdered: 1,
        datesPurchased: 'today',
      }
    ],
    qtyOrdered: [1, 2],
    datesPurchased: ["today", "yesterday"],
    suggest: [1, 'day']
  },
  {
    productName: 'new prod2',
    sku: '220333',
    price: 7,
    timesPurchased: 2,
    purchaseInstances: [
      {
        qtyOrdered: 1000,
        datesPurchased: 'foreevr',
      },
      {
        qtyOrdered: 2000,
        datesPurchased: 'fdkjuhngdfkjdhndf',
      }
    ],
    qtyOrdered: [1, 2],
    datesPurchased: ["today", "yesterday"],
    suggest: [1, 'day']
  }
]
}]

// Connection URL
const uri = 'mongodb+srv://admin:changeme@123@ziptie.auxwu.mongodb.net/ziptie?retryWrites=true&w=majority';
// Create a new MongoClient
const client = new MongoClient(uri, {poolSize: 50, useUnifiedTopology: true, useNewUrlParser: true});

async function appendNewDataToMongo(m2DataArray){  //compare the two sets of data, append additions to db  ADDING THE DB DATA TO THE NEW DATA
  m2DataArray.map(customer => {customer.suggestedItems.map(item => {
    item.status = 'new'
  })})
  const dataB = 'ziptie'
  const col = 'customers'
  // m2DataArray = testArray
  try {
    await client.connect();
    const database = client.db(dataB);
    const collection = database.collection(col);
    const dbData = await collection.find()

    await dbData.forEach(async dbCustomer => {  //loop through db data
      
      if (m2DataArray.some(m2Cust => m2Cust.address == dbCustomer.address)){  //adds any customers from the database that dont exist in the new data.

        // await console.log("customer exists in new data")
      } else {
        await console.log('added an customer who has already been logged before but wasnt found in the new data', dbCustomer.address)
      }

      await m2DataArray.map(async m2Customer => {  //loop through new data and comare to the alreaady existing customer
        // m2Customer.suggestedItems.map(item => {
        //   item.status = 'new'
        // })
        // console.log(m2Customer.suggestedItems)
        if(m2Customer.address == dbCustomer.address){  //find the same customer in both arrays
          delete dbCustomer._id  //delete thid because new items don't have an item until mdb assigns them one  THIS DOESNT MATTER IF BELOW DOESNT WORK
          // console.log(m2Customer, dbCustomer)
          if (JSON.stringify(m2Customer) == JSON.stringify(dbCustomer)){ //are the new items exactly the same as the db items?  THIS ISNT QUITE RIGHT!!! but maybe doesnt matter
            console.log("customer hasn't made any new purchases")
          } else {
            // console.log('needs appending')

            await dbCustomer.suggestedItems.forEach(async dbItem => {  //loop through db sugg items
              if(await m2Customer.suggestedItems.some(m2Item => m2Item.sku == dbItem.sku)){  //if the m2 customer items contains the current dbitem
                const m2Item = await m2Customer.suggestedItems.find(item => item.sku == dbItem.sku)
                m2Item.status = dbItem.status;  //carry over status and items from old db data if it exists
                m2Item.notes = dbItem.notes;

                await dbItem.purchaseInstances.forEach(async dbInstance => { //loop through db purchase instacnes of given item
                  if (await m2Item.purchaseInstances.some(m2Instance => m2Instance.datesPurchased == dbInstance.datesPurchased)){  //compare the items purchase instances dates
                  } else {  //the purchase date didnt already exist in the new data
                    await m2Item.purchaseInstances.unshift(dbInstance)  //add it to the beginning to hopefully keep dates sorted
                    await console.log('added a new purchase instance to: ', m2Customer.suggestedItems, dbInstance)
                  }
                })
              } else {  //if the customer doesnt ciontain that item
                dbItem.status = 'new'
                await m2Customer.suggestedItems.push(dbItem)
                await console.log('old item appended to new customer data: ', m2Customer.suggestedItems, dbItem)
              }
            })
          }
        } else {
          // console.log('not same address')
        }
      })
    })
    //get the suggested interval for all data before putting back into db
    const dataWithSuggestions = utils.getSuggestions(m2DataArray)


    await upsertMany(dataWithSuggestions, dataB, col)
  } catch (err){
    console.log("ERROR", err)
  } finally {
    await client.close();
    console.log('client is closed')
  }
}

module.exports = {
  upsertMany: upsertMany,
  appendNewDataToMongo: appendNewDataToMongo
}


async function upsertMany(dataArr, dataB, col){
  try {
    // await client.connect();
    const database = client.db(dataB);
    const collection = database.collection(col);

    for(i=0;i<dataArr.length;i++){
      const query = { address:  dataArr[i].address}
      const options = { upsert: true };
      const update = {
        $set: {
          address: dataArr[i].address,
          addressOthers: dataArr[i].addressOthers,
          email: dataArr[i].email,
          name: dataArr[i].name,
          suggestedItems: dataArr[i].suggestedItems
        }
      }
      const result = await collection.updateOne(query, update, options)
      // console.log(`${result} documents were inserted`);
    }
    await console.log('new data updated to db')
  } catch(err){
    console.log(err)
  } finally {
    // await client.close();
  }
}







// function isDeepEqual(object1, object2){
//   const keys1 = Object.keys(object1)
//   const keys2 = Object.keys(object2)

//   if (keys1.length !== keys2.lengh){
//     return false
//   }
//   for (const key of keys1){
//     const val1 = object1[key]
//     const val2 = object2[key]
//     const areObjects = isObject(val1) && isObject(val2)
//     if (
//       areObjects && !deepEqual(val1, val2) ||
//       !areObjects && val1 !== val2
//     ) {
//       return false;
//     }
//   }
//   return true;
// }
// function isObject(object) {
//   return object != null && typeof object === 'object';
// }
