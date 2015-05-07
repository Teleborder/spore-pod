var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  secret: {
    type: String,
    required: true
  }
});

userSchema.methods.getSecretByKey = function (key, callback) {
  this.findOne({ key: key }).exec(function (err, user) {
    if(err) return callback(err);
    if(!user) return callback(new Error("No such user"));
    callback(null, {
      key: user.key,
      secret: user.secret
    });
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;
