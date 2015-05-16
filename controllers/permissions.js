var User = require('../models/user'),
    Permission = require('../models/permission'),
    Invite = require('../models/invite'),
    serialize = require('../serialize'),
    email = require('../email');

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

// Invite to an environment on this pod
exports.createInvite = function (req, res, next) {

  // users need to be verified before granting permissions to other users
  if(!req.user.verified) {
    return req.user.generateConfirmation("You need to confirm your email address before granting permissions to other users.", next);
  }

  User.byEmail(req.body.email, function (err, user) {
    if(err) return next(err);

    Invite.generateToken(req.app._id, req.params.env_name, function (err, token, invite) {
      if(err) return next(err);

      email.invite(
        {
          to: req.body.email,
          from: req.user,
          app: req.app,
          token: token
        },
        function (err) {
          if(err) return next(err);

          res.json(serialize('invite', invite));
        }
      );
    });
  });
};

// Get read access on an environment
exports.create = function (req, res, next) {
  Invite.redeemToken(req.user, req.body.token, function (err) {
    if(err) return next(err);

    res.json(serialize('user', req.user));
  });
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

      res.json(serialize('user', { email: user.email }));
    });
  });
};
