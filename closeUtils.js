var Closeio = require('close.io');
require('dotenv').config();

var closeio = new Closeio(process.env.CLOSE_API_KEY);

function testLead(c){
  closeio.lead.search({email_address: c.email})
  .then(search_results => {
    search_results.data.map(singleLead => {
      console.log("SEARCH RESULTS", singleLead)
    })
  })
}

function createLead(c){
  let leadReturn;
  closeio.lead.search({email_address: c.email})
    .then(function(search_results){
      console.log(search_results.total_results);
      if(search_results.total_results <= 0){  //if there are no leads attached to this email
        console.log(`Creating a new lead for ${c.email}`)
        closeio.lead.create({  //create the lead
          "name": c.name,
          "contacts": [
            {
              "name": c.name,
              "title": "",
              "emails": [
                {"type": "office", "email": c.email}
              ],
              "phones": [
                {"type": "office", "phone": c.addressOthers.telephone}
              ]
            }
          ],
          "custom.customerNotes": c.notes,
          "addresses": [
            {
              "label": "business",
              "address_1": c.address,
              "address_2": "",
              "city": c.addressOthers.city,
              "state": c.addressOthers.region,
              "zipcode": c.addressOthers.postcode,
              "country": c.addressOthers.country_id,
            }
          ]
        })
        .then(function(lead){  //add opportunities within the newly created lead
          leadReturn = lead.id
          c.suggestedItems.map(item => {
            const val = parseInt(Math.max(item.revenuePerMonth))
            // console.log(val)
            closeio.opportunity.create({
              "lead_name": item.productName,
              "note": `Product Name: ${item.productName} \n Times Purchased: ${item.timesPurchased} \n Interval: ${item.suggest} weeks \n Notes: ${item.notes || 'none'} \n SKU: ${item.sku} \n Purchase Instances: ${JSON.stringify(item.purchaseInstances)}`,
              // "confidence": getConfidence(item.timesPurchased, item.suggest),
              "lead_id": lead.id,
              "value": val * 100,
              "value_period": "monthly"
            })
          })
          return closeio.lead.read(lead.id);
        })
      } else { //there are existing leads for this customer  -- add opportunities to the first one available...
        const lead = getMostRecentLead(search_results.data)
        leadReturn = lead.id
        closeio.lead.update(lead.id, {"custom.lcf_ab4eOxIiqYD2hi2xbGTuIp9sNx3iht3uzuKmBUfDKBo": c.notes})
        c.suggestedItems.map(item => {
          console.log(`creating a new opportunity for LEAD ID: ${lead.id}, ${c.email}: ${item.productName}`)
          const val = parseInt(Math.max(item.revenuePerMonth))
          closeio.opportunity.create({
            "lead_name": item.productName,
            "note": `Product Name: ${item.productName} \n Times Purchased: ${item.timesPurchased} \n Interval: ${item.suggest} weeks \n Notes: ${item.notes || 'none'} \n SKU: ${item.sku} \n Purchase Instances: ${JSON.stringify(item.purchaseInstances)}`,
            // "confidence": 90,
            "lead_id": lead.id,
            "value": val * 100,
            "value_period": "monthly"
          })
        })
        return lead.id
      }
    })
  console.log(leadReturn)
  return leadReturn
}

function getConfidence(timesPurchased, suggestion){
  console.log(timesPurchased, suggestion)
}

function getMostRecentLead(data){
  const result = data.reduce((r, a) => {
    return r.date_updated.split('+')[0] > a.date_updated.split('+')[0] ? r : a
  })
  return result
}

function queryLeads(dbData){
  // closeio.lead.search({email_address: dbData.email})
  //   .then(function(search_results){
  //     console.log('DATAAA', search_results.data)
  //     // dbData.lead_URL = 'search_results.data'
  //     dbData.lead_URL = search_results.data
  //   })
  // console.log('SING DOC DATA with URL of lead', dbData)
}

module.exports = {
  createLead: createLead,
  queryLeads: queryLeads,
  testLead: testLead
}