var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
  secret: {
    type: String,
    required: true
  }
});

userSchema.methods.getSecretByKey = function (key, callback) {
  this.findOne({ _id: key }).exec(function (err, user) {
    if(err) return callback(err);
    if(!user) return callback(new Error("No such user"));
    callback(null, {
      key: user._id,
      secret: user.secret
    });
  });
};

var User = mongoose.model('User', userSchema);

module.exports = User;
