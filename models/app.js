var mongoose = require('mongoose');

var appSchema = new mongoose.Schema({
});


var App = mongoose.model('App', appSchema);

module.exports = App;
