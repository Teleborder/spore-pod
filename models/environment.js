var mongoose = require('mongoose');

var environmentSchema = new mongoose.Schema({
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  },
  name: {
    type: String,
    required: true
  },
  pairs: [{
    key: String,
    value: String
  }],
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});


var Environment = mongoose.model('Environment', environmentSchema);

module.exports = Environment;
