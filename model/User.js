const mongoose = require('mongoose')

const Customer = new mongoose.Schema({
  address: String,
  name: String,
  email: String,
  addressOthers: Object,
  suggestedItems: Array
})

module.exports = mongoose.model("customer", Customer)