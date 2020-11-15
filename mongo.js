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
    qtyOrdered: [1, 2],
    datesPurchased: ["today", "yesterday"],
    suggest: [1, 'day']
  }]
}]

// Connection URL
const uri = 'mongodb+srv://admin:changeme@123@ziptie.auxwu.mongodb.net/ziptie?retryWrites=true&w=majority';
// Create a new MongoClient
const client = new MongoClient(uri, {poolSize: 50, useUnifiedTopology: true, useNewUrlParser: true});

async function appendNewDataToMongo(m2DataArray){  //compare the two sets of data, append additions to db  ADDING THE DB DATA TO THE NEW DATA
  try {
    await client.connect();
    const database = client.db('ziptie');
    const collection = database.collection('customers3');

    const updatedArray = []
    
    const dbData = await collection.find()
    await dbData.forEach(async dbCustomer => {
      await m2DataArray.map(m2Customer => {
        if(m2Customer.address == dbCustomer.address){  //find the same customer in both arrays
          //check the suggested items for changes
          delete dbCustomer._id  //delete thid because new items don't have an item until mdb assigns them one
          if (JSON.stringify(m2Customer) == JSON.stringify(dbCustomer)){ //are thnew items exactly the same as the db items?
            console.log("customer hasn't made any new purchases")
          } else {
            console.log('needs appending')
          }
          // console.log(m2Customer.suggestedItems.length, dbCustomer.suggestedItems.length)
          // for (m2Item in m2Customer.suggestedItems){
          //   for(dbItem in dbCustomer.suggestedItems){
          //     if(m2Item.sku == dbItem.sku){  //if the item does exist
          //       //check qty and dates

          //     } else if (){

          //     }
          //   }
          // }

        }
      })
    })

  } catch (err){
    console.log(err.status)
  } finally {
    // await client.close();
  }
}



function isDeepEqual(object1, object2){
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.lengh){
    return false
  }
  for (const key of keys1){
    const val1 = object1[key]
    const val2 = object2[key]
    const areObjects = isObject(val1) && isObject(val2)
    if (
      areObjects && !deepEqual(val1, val2) ||
      !areObjects && val1 !== val2
    ) {
      return false;
    }
  }
  return true;
}
function isObject(object) {
  return object != null && typeof object === 'object';
}






// async function getAndCompareWithNew(array){  //maybe should call this updateDB() or something
//   console.log('ADDING DATA TO MONGODB DATABASE')
//   try {
//     await client.connect();
//     const database = client.db('ziptie');
//     const collection = database.collection('customers2');
//     const suggested = [1,2,3,4,5]

//     array = [{
//       address: "1000 W. Vista Bonita Drive Suite B101",
//       email: '123@abc.com',
//       name: 'bobby joe',
//       addressOthers: 'stuff',
//       suggestedItems: [{
//         productName: 'new prod',
//         sku: '220246',
//         price: 4,
//         timesPurchased: 2,
//         qtyOrdered: [1, 2],
//         datesPurchased: ["today", "yesterday"],
//         suggest: [1, 'day']
//       }]
//     }]
//     await array.map(async customer =>{  //map thrtough new logs of customers
//       // const suggested = await customer.suggestedItems.map(async item => { // iterate over the new items from m2
//       //   const dbItems = await collection.find({ //find the same item in db with find query
//       //     'address': customer.address,
//       //   })
//       //   await dbItems.forEach(async item => await console.log(item))
//       //   // await dbItems.filter((item) => { //filter versus the existing items for this person
//       //   //   // filter logic here to return updated or same item
//       //   // })
//       //   // return resultArr
//       // })
//       await customer.suggestedItems.map(async item => {
//         const query = { address: customer.address} // query the address of the current customer
//         const update = {
//           $set: {
//             name: customer.name,
//             email: customer.email,
//             addressOthers: customer.addressOthers,
//             suggestedItems: customer.suggestedItems,
//             // suggestedItems: await function(){ suggested }
//           },
//           // $push: {
//           //   'suggestedItems.$[dbItem].qtyOrdered': suggested
//           // }
//         }
//         const options = {
//           upsert: true,
//           // arrayFilters: [{
//           //   'dbItem.sku': item.sku
//           // }]
//         }
  
//         // await collection.updateOne(query, update, options).then(client.close())
//         await collection.updateOne(query, update, options)
//       })
//     })
//     // await client.close();
//     console.log("FINISHED UPDATING")
//   } catch (err){
//     console.log(err.status)
//   } finally {
//     await client.close();
//   }
// }

// async function getAndCompareWithNew(array){
//   try{
//     // Use connect method to connect to the Server
//     await client.connect();
//     await client.db("ziptie").command({ ping: 1 });
//     var col = client.db.collection('customers3')
//     console.log('connection established')
//     const query = {address: customer.address} // query the address of the current customer
//     const update = {
//       $set: {
//         name: customer.name,
//         email: customer.email,
//         addressOthers: customer.addressOthers,
//         // suggestedItems: customer.suggestedItems,
//         suggestedItems: customer.suggestedItems
//       },
//     }
//     const options = {upsert: true}
//     await col.updateOne(query, update, options)
//     // Close the connection
//     await client.close();
//   } catch(err) {
//     console.log(err.stack);
//   };
// }

module.exports = {
  // sendOne: sendOne,
  // sendMany: sendMany,
  upsertMany: upsertMany,
  // getAllFromDb: getAllFromDb,
  // getAndCompareWithNew: getAndCompareWithNew,
  appendNewDataToMongo: appendNewDataToMongo
}







// async function sendOne(db, col, data) {
//   try {
//     // Connect the client to the server
//     await client.connect();
//     const database = client.db("ziptie");
//     const collection = database.collection("customers");
//     // create a document to be inserted
//     const result = await collection.insertOne(pizzaDocument);
//     console.log(
//       `${result.insertedCount} documents were inserted with the _id: ${result.insertedId}`,
//     );
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// // sendOne().catch(console.dir);

// async function sendMany(db, col, dataArr) {
//   try {
//     await client.connect();
//     const database = client.db(db);
//     const collection = database.collection(col);

//     // this option prevents additional documents from being inserted if one fails
//     const options = { ordered: true };
//     const result = await collection.insertMany(dataArr, options);
//     console.log(`${result.insertedCount} documents were inserted`);
//   } finally {
//     await client.close();
//   }
// }
// // sendMany().catch(console.dir)

async function upsertMany(dataArr){
  try {
    await client.connect();
    const database = client.db('ziptie');
    const collection = database.collection('customers2');

    // this option prevents additional documents from being inserted if one fails
    const options = {};
    for(i=0;i<dataArr.length;i++){
      const result = collection.insertOne(dataArr[i])
      console.log(`${result} documents were inserted`);
    }
    // const result = await collection.insertMany(dataArr, options);
  } finally {
    // await client.close();
  }
}

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
