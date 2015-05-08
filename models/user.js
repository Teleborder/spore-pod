var mongoose = require('mongoose'),
    validate = require('mongoose-validate'),
    bcrypt = require('bcryptjs'),
    uuid = require('node-uuid').v4;

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

// Password/Token

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.pre('validate', function (next) {
  if(this.key) return next();
  this.key = uuid();
  next();
});

var User = mongoose.model('User', userSchema);

module.exports = User;
