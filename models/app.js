var mongoose = require('mongoose');

var appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});


var App = mongoose.model('App', appSchema);

module.exports = App;
