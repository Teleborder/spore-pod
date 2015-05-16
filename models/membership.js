var mongoose = require('mongoose'),
    bcrypt = require('bcrypt');

var membershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  environments: [String]
});

membershipSchema.index({ user: 1, app: 1}, { unique: true });

membershipSchema.statics.ensureForApp = function (userId, appId, callback) {
  this.ensureForEnv(userId, appId, null, callback);
};

membershipSchema.statics.ensureForEnv = function (userId, appId, envNames, callback) {
  var Membership = this;

  envNames = envNames || [];

  Membership.findOne({
    app: appId,
    user: userId
  }).exec(function (err, membership) {
    if(err) return next(err);

    if(!membership) {
      membership = new Membership({
        app: appId,
        user: userId,
        environments: []
      });
    }

    envNames.forEach(function (envName) {
      if(envName && membership.environments.indexOf(envName) === -1) {
        membership.environments.push(envName);
      }
    });

    membership.save(callback);
  }); 
};

membershipSchema.statics.removeForEnv = function (userId, appId, envName, callback) {
  var Membership = this;

  Membership.findOne({
    user: userId,
    app: appId
  }).exec(function (err, membership) {
    if(err) return next(err);

    if(!membership) {
      callback();
      return;
    }

    var idx = membership.environments.indexOf(envName);

    if(idx === -1) {
      callback();
      return;
    }

    // remove environment from their memberships
    membership.environments.splice(idx, 1);

    membership.save(callback);
  });
};

membershipSchema.methods.canAccess = function (envName) {
  return this.environments.indexOf(envName) > -1;
};

var Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
