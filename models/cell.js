var mongoose = require('mongoose'),
    isUuid = require('../utils/is_uuid'),
    slug = require('slug');

var cellSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    index: { unique: true }
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: String
  },
  app: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App'
  },
  environment: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

cellSchema.path('uid').validate(function (uid) {
  return isUuid(uid);
}, "Invalid ID (UUID v4)");

cellSchema.pre('validate', function (next) {
  this.environment = slug(this.environment);
  next();
});

cellSchema.statics.create = function (uid, params, callback) {
  var cell,
      Cell = this,
      err;

  cell = new Cell({
    uid: uid,
    key: params.key,
    value: params.value,
    app: params.app,
    environment: params.environment,
    creator: params.creator
  });

  cell.save(callback);
};

var Cell = mongoose.model('Cell', cellSchema);

module.exports = Cell;
