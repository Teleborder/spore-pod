var mongoose = require('mongoose'),
    Membership = require('./membership'),
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
      App = this;

  app = new App({
    uid: uid,
    name: params.name,
    owner: params.owner
  });

  app.save(function (err) {
    if(err) return callback(err);

    Membership.ensureForApp(params.owner, app._id, function (err) {
      if(err) return callback(err);

      callback(null, app);
    });
  });
};

appSchema.statics.byMembershipsAndId = function (memberships, appId, callback) {
  this.findOne({
    uid: appId
  }).exec(function (err, app) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return callback(err);

    for(var i=0; i<memberships.length; i++) {
      if(memberships[i].app.toString() === app._id.toString()) {
        return callback(null, app, memberships[i]);
      }
    }

    callback();
  });
};

appSchema.statics.byId = function (appId, callback) {
  this.findOne({
    uid: appId
  }).exec(callback); 
};

appSchema.statics.byOwner = function (ownerId, callback) {
  this.find({
    owner: ownerId
  }).exec(callback);
};

appSchema.statics.byOwnerAndId = function (ownerId, appId, callback) {
  this.findOne({
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

    Membership.ensureForApp(user._id, app._id, function (err) {
      if(err) return next(err);

      callback(null, app);
    });        
  });
};

var App = mongoose.model('App', appSchema);

module.exports = App;
