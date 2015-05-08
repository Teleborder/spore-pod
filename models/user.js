var mongoose = require('mongoose'),
    uuid = require('node-uuid').v4;

var userSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  }
});

userSchema.pre('validate', function (next) {
  if(this.key) return next();
  this.key = uuid();
  next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
