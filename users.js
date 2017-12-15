var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var TestSchema = new Schema({
  first: {type: String},
  last: {type: String},
});

module.exports = mongoose.model("test", TestSchema);