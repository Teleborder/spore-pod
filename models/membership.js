var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    slug = require('slug');

var membershipSchema = new mongoose.Schema({
  member: {
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

membershipSchema.index({ member: 1, app: 1 }, { unique: true });

membershipSchema.pre('validate', function (next) {
  this.environments = this.environments.map(function (envName) {
    return slug(envName);
  });
  next();
});

membershipSchema.statics.forEnv = function (appId, envName, callback) {
  this.find({
    app: appId,
    environment: envName ? slug(envName) : envName
  })
  .populate('member')
  .exec(callback);
};

membershipSchema.statics.ensureForApp = function (memberId, appId, callback) {
  this.ensureForEnv(memberId, appId, null, callback);
};

membershipSchema.statics.ensureForEnv = function (memberId, appId, envNames, callback) {
  var Membership = this;

  envNames = envNames || [];

  Membership.findOne({
    app: appId,
    member: memberId
  }).exec(function (err, membership) {
    if(err) return next(err);

    if(!membership) {
      membership = new Membership({
        app: appId,
        member: memberId,
        environments: []
      });
    }

    envNames.forEach(function (envName) {
      if(envName && membership.environments.indexOf(slug(envName)) === -1) {
        membership.environments.push(envName);
      }
    });

    membership.save(callback);
  }); 
};

membershipSchema.statics.removeForEnv = function (memberId, appId, envName, callback) {
  var Membership = this;

  Membership.findOne({
    member: memberId,
    app: appId
  }).exec(function (err, membership) {
    if(err) return next(err);

    if(!membership) {
      callback();
      return;
    }

    var idx = membership.environments.indexOf(slug(envName));

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
  return this.environments.indexOf(slug(envName)) > -1;
};

var Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
