var mongoose = require('mongoose'),
    Permission = require('./permission'),
    User = require('./user'),
    isUuid = require('../utils/is_uuid'),
    async = require('async');

var appSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: { unique: true }
  },
  name: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

appSchema.path('uid').validate(function (uid) {
  return isUuid(uid);
}, "Invalid ID (UUID v4)");

appSchema.statics.create = function (uid, params, callback) {
  var app,
      App = this,
      err;

  app = new App({
    uid: uid,
    name: params.name,
    owner: params.owner
  });

  permission = new Permission({
    app: app._id,
    user: params.owner,
    environments: []
  });

  async.eachSeries([app, permission], function (doc, cb) {
    doc.save(cb);
  }, function (err) {
    if(err) return callback(err);

    callback(null, app);
  });
};

appSchema.statics.byPermissionsAndId = function (permissions, appId, callback) {
  App.findOne({
    uid: appId
  }).exec(function (err, app) {
    if(err) return callbacK(err);

    for(var i=0; i<permissions.length; i++) {
      if(permissions[i].app.toString() === app._id.toString()) {
        return callback(null, app, permissions[i]);
      }
    }

    callback();
  });
};

appSchema.statics.byId = function (appId, callback) {
  App.findOne({
    uid: appId
  }).exec(callback); 
};

appSchema.statics.byOwner = function (ownerId, callback) {
  App.find({
    owner: ownerId
  }).exec(callback);
};

appSchema.statics.byOwnerAndId = function (ownerId, appId, callback) {
  App.findOne({
    uid: appId,
    owner: ownerId
  }).exec(callback);
};

appSchema.methods.changeOwner = function (email, callback) {
  var app = this;

  User.byEmail(email, function (err, user) {
    if(!err && !user) {
      err = new Error("You can't transfer an app to a non-existent user.");
      err.status = 400;
    }
    if(err) return next(err);

    app.owner = user._id;

    Permission.ensureForApp(user._id, app._id, function (err) {
      if(err) return next(err);

      callback(null, app);
    });        
  });
};

var App = mongoose.model('App', appSchema);

module.exports = App;
