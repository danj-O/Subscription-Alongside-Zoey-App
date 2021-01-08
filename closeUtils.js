var Closeio = require('close.io');
 
var closeio = new Closeio("api_6i7KvjjFs5daJvs7tvWDZ8.1JyyTFtFCXIqYhVg8huLej");

function createLead(c){
  // const currItem = c.suggestedItems.find(item => item.productName == productName)
  // console.log(currItem)
  closeio.lead.create({
      "name": c.name,
      // "url": "No URL",
      // "description": productName,
      // "status_id": "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
      "contacts": [
          {
              "name": c.name,
              "title": "",
              "emails": [
                  {
                      "type": "office",
                      "email": c.email
                  }
              ],
              "phones": [
                  {
                      "type": "office",
                      "phone": c.addressOthers.telephone
                  }
              ]
          }
      ],
      "custom.customerNotes": c.notes,
      // "custom.instanceNotes": currItem.notes,
      // "custom.sku": currItem.sku,
      // "custom.suggestion": currItem.suggest,
      // "custom.revenuePerMonth": currItem.revenuePerMonth.toFixed(2),
      // "custom.status": currItem.status,
      // "custom.lcf_ORxgoOQ5YH1p7lDQzFJ88b4z0j7PLLTRaG66m8bmcKv": "Website contact form",
      // "custom.lcf_nenE344jkwrjyRRezwsf8b4V1MCoXWIDHIStmFavZks": ["Choice 1", "Choice 2"],
      // "custom.lcf_FSYEbxYJFsnY9tN1OTAPIF33j7Sw5Lb7Eawll7JzoNh": "Segway",
      // "custom.lcf_bA7SU4vqaefQLuK5UjZMVpbfHK4SVujTJ9unKCIlTvI": "Real Estate",
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
  .then(function(lead){
    c.suggestedItems.map(item => {
      const val = parseInt(Math.max(item.revenuePerMonth))
      // console.log(val)
      closeio.opportunity.create({
        "lead_name": item.productName,
        "note": `Times Purchased: ${item.timesPurchased} --- Interval: ${item.suggest} weeks --- Notes: ${item.notes || 'none'} --- SKU: ${item.sku} --------- Purchase Instances: ${JSON.stringify(item.purchaseInstances)}`,
        // "confidence": 90,
        "lead_id": lead.id,
        "value": val * 100,
        "value_period": "monthly"
      })
    })
    return closeio.lead.read(lead.id);
  })
  // .then(function(lead){
  //   return closeio.lead.update(lead.id, {name: "Peter Parker"});
  // }).then(function(lead){
  //   return closeio.lead.delete(lead.id);
  // }).then(function(){
  //   return closeio.lead.search({name:"Bruce Wayne"});
  // }).then(function(search_results){}, function(err){
  //   console.log("There has been an error.");
  //   console.log(err);
  // });
}
module.exports = {
  createLead: createLead
}