var User = require('./user'),
    App = require('./app'),
    Membership = require('./membership'),
    randomStr = require('../utils/random_string'),
    async = require('async');

exports.create = function (appUid, envName, callback) {
  var user = User.build(this.generateEmail(appUid, envName), randomStr(20));

  user.server = true;
  user.verified = true;

  user.save(User._handleCreate(callback));
};

exports.byEnv = function (appUid, envName, callback) {
  User.findOne({
    email: this.generateEmail(appUid, envName),
    server: true
  });
};

exports.generateEmail = function (appUid, envName) {
  var serverName = [envName, appUid].join('+'), // staging+f47ac10b-58cc-4372-a567-0e02b2c3d479
      serverEmail = [serverName, process.env.HOSTNAME].join('@'); // staging+f47ac10b-58cc-4372-a567-0e02b2c3d479@pod.spore.sh

  return serverEmail;
};

exports.ensureForEnv = function (appId, envName, callback) {
  var Server = this,
      app;

  async.waterfall([
    function (next) {
      App.findOne({
        _id: appId
      }).exec(next);
    },
    function (_app, next) {
      app = _app;
      if(!app) {
        var err = new Error("No Such App");
        err.status = 404;
        return next(err);
      }
      next(null, app);
    },
    function (_app, next) {
      app = _app;

      Server.byEnv(app.uid, envName, function (err, server) {
        if(err) return next(err);
        if(server) return next(null, server);

        Server.create(app.uid, envName, next);
      });
    },
    function (server, next) {
      Membership.ensureForEnv(server._id, app._id, envName, next);
    },
    function (membership, next) {
      next(null, membership.member);
    }
  ], callback);
};
