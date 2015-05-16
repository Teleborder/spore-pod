var mongoose = require('mongoose'),
    bcrypt = require('bcrypt');

var permissionSchema = new mongoose.Schema({
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

permissionSchema.index({ user: 1, app: 1}, { unique: true });

permissionSchema.statics.ensureForApp = function (userId, appId, callback) {
  this.ensureForEnv(userId, appId, null, callback);
};

permissionSchema.statics.ensureForEnv = function (userId, appId, envNames, callback) {
  var Permission = this;

  envNames = envNames || [];

  Permission.findOne({
    app: appId,
    user: userId
  }).exec(function (err, permission) {
    if(err) return next(err);

    if(!permission) {
      permission = new Permission({
        app: appId,
        user: userId,
        environments: []
      });
    }

    envNames.forEach(function (envName) {
      if(envName && permission.environments.indexOf(envName) === -1) {
        permission.environments.push(envName);
      }
    });

    permission.save(callback);
  }); 
};

permissionSchema.statics.removeForEnv = function (userId, appId, envName, callback) {
  var Permission = this;

  Permission.findOne({
    user: userId,
    app: appId
  }).exec(function (err, permission) {
    if(err) return next(err);

    if(!permission) {
      callback();
      return;
    }

    var idx = permission.environments.indexOf(envName);

    if(idx === -1) {
      callback();
      return;
    }

    // remove environment from their permissions
    permission.environments.splice(idx, 1);

    permission.save(callback);
  });
};

permissionSchema.methods.canAccess = function (envName) {
  return this.environments.indexOf(envName) > -1;
};

var Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
