const MongoClient = require('mongodb').MongoClient;

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
        await console.log("customer exists in new data")
      } else {
        await console.log('added an customer who has already been logged before but wasnt found in the new data', dbCustomer.address)
      }

      await m2DataArray.map(async m2Customer => {  //loop through new data and comare to the alreaady existing customer
        if(m2Customer.address == dbCustomer.address){  //find the same customer in both arrays
          delete dbCustomer._id  //delete thid because new items don't have an item until mdb assigns them one  THIS DOESNT MATTER IF BELOW DOESNT WORK
          // console.log(m2Customer, dbCustomer)
          if (JSON.stringify(m2Customer) == JSON.stringify(dbCustomer)){ //are the new items exactly the same as the db items?  THIS ISNT QUITE RIGHT!!! but maybe doesnt matter
            console.log("customer hasn't made any new purchases")
          } else {
            console.log('needs appending')

            await dbCustomer.suggestedItems.forEach(async dbItem => {  //loop through db sugg items
              if(await m2Customer.suggestedItems.some(m2Item => m2Item.sku == dbItem.sku)){  //if the m2 customer items contains the current dbitem
                console.log('item exists, checking if there were new purchases...')
                const m2Item = await m2Customer.suggestedItems.find(item => item.sku == dbItem.sku)

                await dbItem.purchaseInstances.forEach(async dbInstance => { //loop through db purchase instacnes of given item
                  if (await m2Item.purchaseInstances.some(m2Instance => m2Instance.datesPurchased == dbInstance.datesPurchased)){  //compare the items purchase instances dates
                  } else {  //the purchase date didnt already exist in the new data
                    await m2Item.purchaseInstances.unshift(dbInstance)  //add it to the beginning to hopefully keep dates sorted
                    await console.log('added a new purchase instance to: ', m2Customer.suggestedItems, dbInstance)
                  }
                })
              } else {  //if the customer doesnt ciontain that item
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
    await upsertMany(m2DataArray, dataB, col)
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






// async function insertMany(dataArr){
//   try {
//     await client.connect();
//     const database = client.db('ziptie');
//     const collection = database.collection('customers2');

//     // this option prevents additional documents from being inserted if one fails
//     const options = {};
//     for(i=0;i<dataArr.length;i++){
//       const result = collection.insertOne(dataArr[i])
//       console.log(`${result} documents were inserted`);
//     }
//     // const result = await collection.insertMany(dataArr, options);
//   } finally {
//     // await client.close();
//   }
// }

// async function getAllFromDb(db, col){
//   const response = [];
//   try {
//     await client.connect();
//     const database = client.db(db);
//     const collection = database.collection(col);

//     // this option prevents additional documents from being inserted if one fails
//     // const options = { upsert: true };
//     const cursor = await collection.find({})
//     await cursor.forEach(function(doc){
//       response.push(doc)
//       // console.log(doc)
//     })
//     return response
//   } finally {
//     await client.close();
//   }
//   // console.log(typeof(response))
//   // return response
// }






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
