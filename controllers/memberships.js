var User = require('../models/user'),
    Membership = require('../models/membership'),
    Invite = require('../models/invite'),
    serialize = require('../serialize'),
    email = require('../email'),
    async = require('async');

// get a list of users with read access for an environment
exports.list = function (req, res, next) {
  async.parallel({
    memberships: function (next) {
      Membership.forEnv(req.app._id, req.params.env_name, next);
    },
    invites: function (next) {
      Invite.forEnv(req.app._id, req.params.env_name, next);
    }
  }, function (err, results) {
    if(err) return next(err);

    res.json(serialize('membership', results.memberships.concat(results.invites)));
  });
};

// Invite to an environment on this pod
exports.create = function (req, res, next) {

  if(!req.user.verified) {
    return req.user.generateConfirmation("You need to confirm your email address before granting memberships to other users.", next);
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

          res.json(serialize('membership', invite));
        }
      );
    });
  });
};

// Get read access on an environment (updates `status` and potentially `email`)
exports.update = function (req, res, next) {
  Invite.redeemToken(req.user, req.body.token, function (err) {
    if(err) return next(err);

    res.json(serialize('membership', req.user));
  });
};

// Revoke read access for an environment
exports.delete = function (req, res, next) {
  User.byEmail(req.params.email, function (err, user) {
    if(err) return next(err);

    if(!user) {
      res.json(serialize('membership', { member: { email: req.params.email }, status: 'deleted' }));
      return;
    }

    Membership.removeForEnv(user._id, req.app._id, req.params.env_name, function (err) {
      if(err) return next(err);

      res.json(serialize('membership', { member: { email: user.email }, status: 'deleted' }));
    });
  });
};
