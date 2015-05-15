var User = require('../models/user'),
    serialize = require('../serialize');

// create a new user account
exports.create = function (req, res, next) {
  User.create(req.body.email, req.body.password, function (err, user) {
    if(err) return next(err);

    res.json(serialize('user', user));
  });
};

// generate a new api key
exports.createKey = function (req, res, next) {
  User.byEmail(req.body.email, function (err, user) {
    if(!err && (!user || !user.validPassword(req.body.password))) {
      err = new Error("Invalid email or password");
      err.status = 401;
    }
    if(err) return next(err);

    var key = user.generateKey();

    user.save(function (err) {
      if(err) return next(err);

      res.json(serialize('key', key));
    });
  });
};
