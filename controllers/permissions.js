var User = require('../models/user'),
    Permission = require('../models/permission'),
    serialize = require('../serialize');

// get a list of users with read access for an environment
exports.list = function (req, res, next) {
  User.forEnvironment(req.app._id, req.params.env_name, function (err, users) {
    if(err) return next(err);

    res.json(serialize('user', users));
  });

  User.forEnvironment(req.permissions, req.params.app_id, req.params.env_name, function (err, users) {
    if(err) return next(err);

    res.json(serialize('user', users));
  });
};

// Grant read access for an environment (and invite to the pod if they aren't a user)
exports.create = function (req, res, next) {
  // TODO: Invite user to an environment
};

// Revoke read access for an environment
exports.delete = function (req, res, next) {
  User.byEmail(req.params.email, function (err, user) {
    if(err) return next(err);

    if(!user) {
      res.json(serialize('user', { email: req.params.email }));
      return;
    }

    Permission.removeForEnv(user._id, req.app._id, req.params.env_name, function (err) {
      if(err) return next(err);

      res.json(serialize('user', user));
    });
  });
};
