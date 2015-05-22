var mongoose = require('mongoose'),
    bcrypt = require('bcryptjs'),
    slug = require('slug'),
    uuid = require('node-uuid').v4;

var deploymentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  environment: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

deploymentSchema.index({ member: 1, app: 1, name: 1 }, { unique: true });

deploymentSchema.pre('validate', function (next) {
  this.environment = slug(this.environment);
  next();
});
deploymentSchema.pre('validate', function (next) {
  this.name = slug(this.name);
  next();
});

deploymentSchema.statics.create = function (appId, envName, deploymentName, callback) {
  var Deployment = this;

  var deployment = new Deployment({
    app: appId,
    environment: envName,
    name: deploymentName
  });

  var key = deployment.generateKey();

  deployment.save(function (err) {
    if(err) return callback(err);

    Deployment.populate(deployment, { path: 'app' }, function (err, deployment) {
      if(err) return callback(err);

      callback(null, deployment, key);
    });
  });
};

deploymentSchema.statics.remove = function (appId, envName, deploymentName, callback) {
  var Deployment = this;

  Deployment.byName(appId, envName, deploymentName, function (err, deployment) {
    if(!err && !deployment) {
      err = new Error("No Such Deployment");
      err.status = 404;
    }
    if(err) return callback(err);

    deployment.remove(callback);
  });
};

deploymentSchema.statics.byEnv = function (appId, envName, callback) {
  this.find({
    app: appId,
    environment: slug(envName)
  })
  .populate('app')
  .exec(callback);
};

deploymentSchema.statics.byName = function (appId, envName, deploymentName, callback) {
  var Deployment = this;

  Deployment.findOne({
    environment: slug(envName),
    name: slug(deploymentName),
    app: appId
  })
  .populate('app')
  .exec(callback);
};

deploymentSchema.statics.loginWithKey = function (appId, envName, deploymentName, key, callback) {
  var Deployment = this;

  Deployment.byName(appId, envName, deploymentName, function (err, deployment) {
    if(!err && (!deployment || !deployment.validKey(key))) {
      err = new Error("No Such Deployment");
      err.status = 404;
    }
    if(err) return callback(err);

    callback(null, deployment);
  });
};

deploymentSchema.methods.environmentVariable = function (key) {
  var envVar = "[proto]://[name]+[environment]+[app]:[key]@[hostname]",
      context = {
        proto: process.env.PROTOCOL || 'https',
        name: this.name,
        environment: this.environment,
        app: this.app.uid,
        key: key,
        hostname: process.env.HOSTNAME || 'pod.spore.sh'
      };

  Object.keys(context).forEach(function (p) {
    envVar = envVar.replace('[' + p + ']', context[p]);
  });

  return envVar;
};

deploymentSchema.methods.generateKey = function () {
  var key = uuid();
  this.key = this.generateHash(key);

  return key;
};

deploymentSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, 8);
};

deploymentSchema.methods.validKey = function (key) {
  return bcrypt.compareSync(key, this.key);
};

var Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;
