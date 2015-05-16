var Invite = require('../models/invite'),
    serialize = require('../serialize');

exports.show = function (req, res, next) {
  Invite.findByToken(req.params.token, function (err, invite) {
    if(err) return next(err);

    res.json(serialize('invite', invite));
  });
};
