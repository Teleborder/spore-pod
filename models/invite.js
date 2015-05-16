var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    Permission = require('./permission');

var inviteSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  environments: [String],
  email: {
    type: String
  },
  token: {
    type: String,
    required: true
  },
  tokenId: {
    type: String,
    required: true,
    unique: true
  }
});

inviteSchema.statics.create = function (email, appId, envNames, callback) {
  var Invite = this,
      invite,
      token;

  invite = new Invite({
    app: appId,
    environments: envNames
  });

  token = invite.generateToken();

  invite.save(function (err) {
    if(err) return callback(err);

    callback(null, token, invite);
  });
};

inviteSchema.statics.redeemToken = function (user, token, callback) {
  var Invite = this,
      tokenId = token.substr(0, 5),
      tokenKey = token.slice(5);

  if(token.length !== 10) {
    return callback(new Error("Invalid token"));
  }

  Invite.findOne({
    tokenId: tokenId
  }).exec(function (err, invite) {
    if(err) return callback(err);
    if(!invite || !invite.validToken(tokenKey)) return callback(new Error("Invalid token"));

    user.verifyEmail(email, function (err, user) {
      Permission.ensureForEnv(user._id, invite.app, invite.environments, function (err) {
        if(err) return callback(err);

        invite.remove(callback);
      });
    });
  });
};

inviteSchema.methods.generateToken = function () {
  var token = randomStr(10),
      tokenId = token.substr(0, 5),
      tokenKey = token.slice(5);

  this.token = this.generateHash(tokenKey);
  this.tokenId = tokenId;

  return token;
};

inviteSchema.methods.generateHash = function(str) {
  return bcrypt.hashSync(str, 8);
};

inviteSchema.methods.validToken = function (token) {
  return this.token && bcrypt.compareSync(token, this.token);
};

var Invite = mongoose.model('Invite', inviteSchema);

module.exports = Invite;
