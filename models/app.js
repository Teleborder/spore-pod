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

appSchema.statics.byId = function (permissions, appId, callback) {
  var App = this,
      allowedAppId;

  for(var i=0; i<permissions.length; i++) {
    if(permissions[i].app.toString() === appId.toString()) {
      allowedAppId = appId;
      break;
    }
  }

  if(!allowedAppId) {
    return process.nextTick(function () {
      callback();
    });
  }

  App.findOne({
    _id: allowedAppId
  }).exec(callback);
};

appSchema.statics.byOwner = function (ownerId, appId, callback) {
  App.findOne({
    _id: appId,
    owner: ownerId
  }).exec(callback);
};

var App = mongoose.model('App', appSchema);

module.exports = App;
