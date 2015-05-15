var mongoose = require('mongoose');

var permissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  },
  environments: [String]
});

permissionSchema.index({ user: 1, app: 1}, { unique: true });

permissionSchema.statics.ensureForApp = function (appId, userId, callback) {
  var Permission = this;

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

var Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
