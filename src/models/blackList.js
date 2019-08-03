const mongoose = require('mongoose');

const BlackListSchema = new mongoose.Schema({
  intecId: String,
  fullName: String,
  domain: String
});

module.exports = mongoose.model("BlackList", BlackListSchema);