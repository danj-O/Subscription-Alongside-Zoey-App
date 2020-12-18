const utils = require('./utils')
const Oauth1Helper = require('./auth')
const axios = require('axios')

const baseUrl = 'https://2ieb7j62xark0rjf.mojostratus.io'

async function appendNewDataToMongo(m2DataArray, collection){  //compare the two sets of data, append additions to db  ADDING THE DB DATA TO THE NEW DATA
  // console.log(collection)
  m2DataArray.map(customer => {customer.suggestedItems.map(item => {
    item.status = 'new'
  })})
  const dataB = 'ziptie'
  const col = 'customers'
  // m2DataArray = testArray
  try {
    const dbData = await collection.find()

    await dbData.forEach(async dbCustomer => {  //loop through db data
      await m2DataArray.map(async m2Customer => {  //loop through new data and comare to the alreaady existing customer
        if(m2Customer.address == dbCustomer.address){  //find the same customer in both arrays
          delete dbCustomer._id  //delete thid because new items don't have an item until mdb assigns them one  THIS DOESNT MATTER IF BELOW DOESNT WORK
          if (JSON.stringify(m2Customer) == JSON.stringify(dbCustomer)){ //are the new items exactly the same as the db items?  THIS ISNT QUITE RIGHT!!! but maybe doesnt matter
            console.log("customer hasn't made any new purchases")
          } else {
            await dbCustomer.suggestedItems.forEach(async dbItem => {  //loop through db sugg items
              if(await m2Customer.suggestedItems.some(m2Item => m2Item.sku == dbItem.sku)){  //if the m2 customer items contains the current dbitem
                const m2Item = await m2Customer.suggestedItems.find(item => item.sku == dbItem.sku)
                m2Item.status = dbItem.status;  //carry over status and items from old db data if it exists
                m2Item.notes = dbItem.notes;
                console.log(m2Item.notes, m2Item.status)
                await dbItem.purchaseInstances.forEach(async dbInstance => { //loop through db purchase instacnes of given item
                  if (await m2Item.purchaseInstances.some(m2Instance => m2Instance.datesPurchased == dbInstance.datesPurchased)){  //compare the items purchase instances dates
                  } else {  //the purchase date didnt already exist in the new data
                    await m2Item.purchaseInstances.unshift(dbInstance)  //add it to the beginning to hopefully keep dates sorted
                  }
                })
              } else {  //if the customer doesnt ciontain that item
                dbItem.status = 'new'
                await m2Customer.suggestedItems.push(dbItem)
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
    await upsertMany(dataWithSuggestions, collection)
  } catch (err){
    console.log("ERROR", err)
  } finally {
    console.log('new data appended to mongo')
  }
}

// -------REMINDER FROM FRIDAY NEED TO REPAIR THIS FUNCTINO SO IT IS PROPERLY UPDATING THE DB BY REPLACING DUPLICATES WITH NEW DATA AND APPENDING NEW SUBS
// ------- 

async function appendSubscriptionsToCustomers(m2Data, collection){
  m2Data = await organizeM2SubData(m2Data)
  m2Data = await m2Data.sort(compareAddresses)  //now they are in order by address and we can use "prev sub"
  const prevSub = {}
  await m2Data.map(async sub =>{  //loop through new subscriptions data
    //get the corresponding order from m2 because it may not already exist in mongo
    const singleCustData = await getSubDataWithAuth(`${baseUrl}/rest/V1/orders?searchCriteria[filter_groups][2][filters][0][field]=increment_id&searchCriteria[filter_groups][2][filters][0][value]=${sub.orderId}&searchCriteria[filter_groups][2][filters][0][condition_type]=eq`)
    //ADD if the adress doesnt exist, move to next doc
    sub.address = singleCustData.data.items[0].extension_attributes.shipping_assignments[0].shipping.address.street[0]
    sub.addressOthers = singleCustData.data.items[0].extension_attributes.shipping_assignments[0].shipping.address
    const dbCust = await collection.findOne({address: sub.address})  //finding the corresponding customer in mongo now that we have an address
    let update = {}
    if(await dbCust == null){ //if there is no customer in mongo related to current sub
      update = {
        $set : {
          address: sub.address,
          addressOthers: sub.addressOthers,
          email: sub.email,
          name: sub.firstName + ' ' + sub.lastName,
          notes: '',
          subscriptions: [sub]
        }
      }
    } else {  // the customer was found in mongo   ----NEED TO WORK OUT ADDING THE SUBSCRIPTIONS
      let subscriptions = []
      if(dbCust.subscriptions.some(e => e.subNum === sub.subNum)){  //if this current customer already has this sub saved
        console.log('customer already has this subscription')
        subscriptions = [...dbCust.subscriptions]
        const currentSub = subscriptions.find(x => x.subNum == sub.subNum)
        // console.log("current sub", currentSub.subNum, currentSub.notes, currentSub.status, sub.status, sub.notes)
        const index = subscriptions.indexOf(currentSub)
        const currentSubNotes = subscriptions[index].notes
        subscriptions.splice(index, 1, sub)  //replace the old subscription with new so we make sure the dates are all right etc.
        subscriptions[index].notes = currentSubNotes || ''  //adds the old notes to new data
        // console.log("current sub next line", currentSub.subNum, currentSub.status, sub.status)
      } else { // the customer doesn't have a sub with this subnum -- add it
        console.log('customer IN DB doesnt have a sub with this subnum')
        subscriptions = [...dbCust.subscriptions, sub]  //but maybe there havent been subscriptions added yet!!
      }
      update = {
        $set : {
          address: dbCust.address,
          addressOthers: dbCust.addressOthers,
          email: dbCust.email,
          name: dbCust.name,
          suggestedItems: dbCust.suggestedItems, // we should remove any items that have active or paused subs on them
          notes: dbCust.notes,
          subscriptions: subscriptions
        }
      }
    }
    const filter = {address: sub.address}
    const options = {upsert: true}
    const cursor = await collection.updateOne(filter, update, options)
    console.log(
      `${cursor.matchedCount} document(s) matched the filter, updated ${cursor.modifiedCount} document(s)`,
    );
  })
}



async function getSubDataWithAuth(url){
  try{
    const request = { url: url, method: 'GET', };
    const authHeader = Oauth1Helper.getAuthHeaderForRequest(request);
    return await axios.get( request.url, { headers: authHeader });
  } catch (err){
    console.log(err)
  }
}

function organizeM2SubData(m2Data){
  const result = []
  m2Data.map(sub =>{
    const fullTextArr = sub.keyword_fulltext.split(' ')
    const [firstName, lastName, email, inc_id, orderId] =fullTextArr
    const subObj = {
      address: '',
      addressOthers: {},
      productName: sub.description,
      firstName: firstName,
      lastName: lastName,
      email: email,
      orderId: orderId,
      subNum: sub.increment_id,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      next_run: sub.next_run,
      last_run: sub.last_run,
      run_count:sub.run_count,
      subtotal: sub.subtotal,
      status: sub.status,
      interval: [sub.frequency_count, sub.frequency_unit],
    }
    result.push(subObj)
  })
  return result
}

function compareAddresses(a, b) {
  const itemA = a.address;
  const itemB = b.address;
  let comparison = 0;
  if (itemA > itemB) {
    comparison = 1;
  } else if (itemA < itemB) {
    comparison = -1;
  }
  return comparison;
}

module.exports = {
  upsertMany: upsertMany,
  appendNewDataToMongo: appendNewDataToMongo,
  // saveSubscriptionsToMongo: saveSubscriptionsToMongo,
  appendSubscriptionsToCustomers: appendSubscriptionsToCustomers
}


async function upsertMany(dataArr, collection){
  try {
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
    // await console.log('new data updated to db')
  } catch(err){
    console.log(err)
  } finally {
    // await client.close();
  }
}


// async function saveSubscriptionsToMongo(m2Data, collection){
//   m2Data = organizeM2SubData(m2Data)
//   // console.log('m2Data', m2Data)
//   try {
//     await m2Data.map(async m2Sub => {
//       // console.log("M2SUB", m2Sub)
      
//       try{
//         const singleCustData = await getSubDataWithAuth(`${baseUrl}/rest/V1/orders?searchCriteria[filter_groups][2][filters][0][field]=increment_id&searchCriteria[filter_groups][2][filters][0][value]=${m2Sub.orderId}&searchCriteria[filter_groups][2][filters][0][condition_type]=eq`)
//         const address = await singleCustData.data.items[0].extension_attributes.shipping_assignments[0].shipping.address.street[0]
//         const addressOthers = await singleCustData.data.items[0].extension_attributes.shipping_assignments[0].shipping.address
//         // console.log(address, addressOthers)
//         m2Sub.address = await singleCustData.data.items[0].extension_attributes.shipping_assignments[0].shipping.address.street[0]
//         // m2Sub.addressOthers = addressOthers
//         const filter = { subNum : m2Sub.subNum }
//         const update = {
//           $set : {
//             address: address,
//             addressOthers: addressOthers,
//             productName: m2Sub.productName,
//             firstName: m2Sub.firstName,
//             lastName: m2Sub.lastName,
//             email: m2Sub.email,
//             orderId: m2Sub.orderId,
//             subNum: m2Sub.subNum,
//             created_at: m2Sub.created_at,
//             updated_at: m2Sub.updated_at,
//             next_run: m2Sub.next_run,
//             last_run: m2Sub.last_run,
//             run_count: m2Sub.run_count,
//             subtotal: m2Sub.subtotal,
//             status: m2Sub.status,
//             interval: m2Sub.interval
//           }
//         }
//         const options = {upsert: true}
//         const result = await collection.updateOne(filter, update, options)
//         console.log(
//           `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`,
//         );
//       } catch (err){
//         console.log(err)
//       }
//       // m2Sub.address = address
//       // m2Sub.addressOthers = addressOthers
//     })
//     return m2Data
//   } catch(err){
//     console.log(err)
//   }
//   return m2Data
// }