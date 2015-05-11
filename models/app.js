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
  }).exec(callback);
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
  }).exec(callback);
};

appSchema.statics.byOwner = function (ownerId, appName, callback) {
  App.findOne({
    name: appName,
    owner: ownerId
  }).exec(callback);
};

var App = mongoose.model('App', appSchema);

module.exports = App;
