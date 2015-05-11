var mongoose = require('mongoose'),
    validate = require('mongoose-validate'),
    bcrypt = require('bcryptjs'),
    uuid = require('node-uuid').v4,
    App = require('./app'),
    Permission = require('./permission');

var userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validate.email, "Invalid email address."]
  },
  password: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  publicKey: {
    type: String
  }
});

userSchema.statics.forApp = function (permissions, appName, callback) {
  App.byName(permissions, appName, function (err, app) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return callback(err);

    Permission.find({
      app: app._id
    })
    .populate('user')
    .exec(function (err, perms) {
      if(err) return callback(err);

      callback(null, perms.map(function (perm) {
        return perm.user;
      }));
    });
  });
};

userSchema.statics.forEnvironment = function (permissions, appName, envName, callback) {
  Environment.byName(permissions, appName, envName, function (err, env, app) {
    Permission.find({
      app: app._id,
      environment: {
        $in: [env._id]
      }
    })
    .populate('user')
    .exec(function (err, perms) {
      if(err) return callback(err);

      callback(null, perms.map(function (perm) {
        return perm.user;
      }));
    });
  });
};

userSchema.statics.byEmail = function (email, callback) {
  User.findOne({
    email: email
  }).exec(callback);
};

// Password

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

// Generate API Key

userSchema.pre('validate', function (next) {
  if(this.key) return next();
  this.key = uuid();
  next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
