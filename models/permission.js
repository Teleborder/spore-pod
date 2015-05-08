var mongoose = require('mongoose');

var permissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  },
  environments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Environment'
  }]
});

permissionSchema.index({ user: 1, app: 1}, { unique: true });

var Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
