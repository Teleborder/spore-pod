var mongoose = require('mongoose'),
    App = require('./app');

var environmentSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  },
  name: {
    type: String,
    required: true
  },
  values: {}
});

environmentSchema.statics.forApp = function(permissions, appId, callback) {
  var Environment = this;

  var envIds = permissions.reduce(function (prev, perm) {
    return prev.concat(perm.environments);
  }, []);

  App.byId(permissions, appId, function (err, app) {
    if(err) return callback(err);
    if(!app) return callback(new Error("No Such App"));

    Environment.find({
      app: app._id,
      _id: {
        $in: envIds
      }
    }, function (err, envs) {
      if(err) return callback(err);
      callback(null, envs);
    });
  });
};

environmentSchema.statics.byName = function (permissions, appId, envName, callback) {
  var Environment = this;

  var envIds = permissions.reduce(function (prev, perm) {
    return prev.concat(perm.environments);
  }, []);

  App.byId(permissions, appId, function (err, app) {
    if(err) return callback(err);
    if(!app) return callback(new Error("No Such App"));

    Environment.findOne({
      name: envName,
      app: app._id,
      _id: {
        $in: envIds
      }
    }, function (err, env) {
      if(err) return callback(err);
      callback(null, env, app);
    });
  });
};

environmentSchema.index({ name: 1, app: 1}, { unique: true });

var Environment = mongoose.model('Environment', environmentSchema);

module.exports = Environment;
