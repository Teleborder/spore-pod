var App = require('../models/app'),
    serialize = require('../serialize');

// List apps that you own
exports.list = function (req, res, next) {
  App.byOwner(req.user._id, function (err, apps) {
    if(err) return next(err);

    res.json(serialize('app', apps || []));
  }); 
};

// Create a new app
exports.create = function (req, res, next) {
  App.create(req.body.id, { name: req.body.name, owner: req.user._id }, function (err, app) {
    if(err) return next(err);

    res.json(serialize('app', app));
  });
};

// Transfer ownership or change name
exports.update = function (req, res, next) {
  var app = req.app;

  if(req.params.email) {
    app.changeOwner(req.params.email, function (err) {
      if(err) return next(err);

      changeAppName(app, req, res, next);
    });

    return;
  }

  changeAppName(app, req, res, next);
};

function changeAppName(app, req, res, next) {
  app.name = req.params.name || app.name;

  app.save(function (err) {
    if(err) return next(err);

    res.json(serialize('app', app));
  });
}
