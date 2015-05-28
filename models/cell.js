var mongoose = require('mongoose'),
    isUuid = require('../utils/is_uuid'),
    slug = require('slug'),
    tomb = require('./tomb');

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
      value;

  try {
    value = tomb.encrypt(params.value);
  } catch(e) {
    return callback(e);
  }

  cell = new Cell({
    uid: uid,
    key: params.key,
    value: value,
    app: params.app,
    environment: params.environment,
    creator: params.creator
  });

  cell.save(callback);
};

cellSchema.statics.get = function (appId, envName, cellId, callback) {
  this.findOne({
    uid: cellId,
    app: appId,
    environment: envName
  }).exec(function (err, cell) {
    if(err) return callback(err);

    try {
      cell.value = tomb.decrypt(cell.value);
    } catch(e) {
      return callback(e);
    }

    callback(null, cell);
  });

};

var Cell = mongoose.model('Cell', cellSchema);

module.exports = Cell;
