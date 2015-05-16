var mongoose = require('mongoose'),
    validate = require('mongoose-validate'),
    bcrypt = require('bcryptjs'),
    uuid = require('node-uuid').v4,
    App = require('./app'),
    Membership = require('./membership'),
    randomStr = require('../utils/random_string'),
    email = require('../email');

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
  token: {
    type: String
  },
  verified: {
    type: Boolean,
    required: true,
    default: false
  }
});

userSchema.virtual('keys')
  .get(function () {
    return [this.get('key')];
  });

userSchema.virtual('status')
  .get(function () {
    return 'active';
  });

userSchema.statics.build = function (email, password) {
  var user,
      User = this;

  if(!email) return callback(new Error("Email is required"));
  if(!password) return callback(new Error("Password is required"));

  user = new User({
    email: email
  });

  user.password = user.generateHash(password);

  // we throw this key away right now - they need to
  // hit the /keys endpoint to retrieve it
  user.generateKey();

  return user;
};

userSchema.statics.create = function (email, password, callback) {
  var user,
      User = this;

  user = User.build(email, password);
  user.signedUp = true;

  user.save(_handleCreate(callback));
};

function _handleCreate(callback) {
  return function (err, user) {
    if (err) {
      if(err.name === 'ValidationError' && err.errors) {
        // do something here?
      } else if(err.code === 11000 && err.errmsg && err.errmsg.indexOf('email_1') > -1) {
        err = new Error("Account with that email already exists");
        err.status = 400;
      }
      return callback(err);
    }

    callback(null, user);
  };
}

userSchema.statics.forEnv = function (appId, envName, callback) {
  Membership.find({
    app: appId,
    environment: envName
  })
  .populate('user')
  .exec(function (err, perms) {
    if(err) return callback(err);

    callback(null, perms.map(function (perm) {
      return perm.user;
    }));
  });
};

userSchema.statics.byEmail = function (email, callback) {
  var User = this;

  User.findOne({
    email: email
  }).exec(callback);
};

userSchema.statics.loginWithKey = function (email, key, callback) {
  var User = this;

  User.byEmail(email, function (err, user) {
    // verify email exists
    if(!err && !user) {
      err = new Error("No Such User");
      err.status = 401;
    }
    // verify email matches api key
    if(!err && user && !user.validKey(key)) {
      err = new Error("No Such User");
      err.status = 401;
    }
    if(err) return callback(err);

    Membership.find({
      member: user._id
    }, function (err, memberships) {
      if(err) return callback(err);

      callback(null, user, memberships);
    });
  });
};

userSchema.methods.verify = function (callback) {
  var user = this;

  if(user.verified) {
    process.nextTick(function () {
      callback(null, user);
    });
    return;
  }

  user.verified = true;

  user.save(callback);
};

userSchema.methods.verifyEmail = function (email, callback) {
  var user = this;

  if(email && email === user.email) {
    return user.verify(callback);
  }

  process.nextTick(function () {
    callback(null, user);
  });
};

// This method *always* calls back with an error
userSchema.methods.generateConfirmation = function (message, callback) {
  var user = this;

  message += " A confirmation email has been sent to " + req.user.email;

  var token = user.generateToken();

  user.save(function (err) {
    if(err) return callback(err);

    email.confirm(user, token, function (err) {
      err = err || new Error(message);
      err.status = err.status || 403;
      callback(err);
    });
  });
};

userSchema.methods.generateKey = function () {
  var key = uuid();
  this.key = this.generateHash(key);

  return key;
};

userSchema.methods.generateToken = function () {
  var token = randomStr(7);
  this.token = this.generateHash(token);

  return token;
};

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, 8);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

userSchema.methods.validKey = function (key) {
  return bcrypt.compareSync(key, this.key);
};

userSchema.methods.validToken = function (token) {
  return this.token && bcrypt.compareSync(token, this.token);
};

var User = mongoose.model('User', userSchema);

module.exports = User;
