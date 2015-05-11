var mongoose = require('mongoose'),
    Permission = require('./permission');

var appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

appSchema.statics.forPermissions = function (permissions, callback) {
  var App = this;
  var appIds = permissions.map(function (perm) {
    return perm.app;
  });

  App.find({
    _id: {
      $in: appIds
    }
  }).exec(function (err, apps) {
    if(err) return callback(err);
    callback(null, apps);
  });
};

appSchema.statics.byName = function (permissions, appName, callback) {
  var App = this;

  var appIds = permissions.map(function (perm) {
    return perm.app;
  });

  App.findOne({
    name: appName,
    _id: {
      $in: appIds
    }
  }).exec(function (err, app) {
    if(err) return callback(err);
    callback(null, app);
  });
};

var App = mongoose.model('App', appSchema);

module.exports = App;
