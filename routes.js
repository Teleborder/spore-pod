var User = require('./models/user'),
    App = require('./models/app'),
    Permission = require('./models/permission'),
    Cell = require('./models/cell'),
    serialize = require('./serialize'),
    async = require('async'),
    isUuid = require('./utils/is_uuid');

module.exports = routes;

function routes(app) {
  app.get('/', function (req, res) {
    res.redirect('http://spore.sh');
  });

  // Create new account
  app.post('/users', function (req, res, next) {
    User.create(req.body.email, req.body.password, function (err, user) {
      if(err) return next(err);

      res.json(serialize('user', user));
    });
  });

  // Generate keys for an account
  app.post('/users/:email/keys', function (req, res, next) {
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
  });

  // List apps that you own
  app.get('/apps', loginWithKey, function (req, res, next) {
    App.byOwner(req.user._id, function (err, apps) {
      if(err) return next(err);

      res.json(serialize('app', apps || []));
    });
  });

  // Create a new app
  app.post('/apps', loginWithKey, function (req, res, next) {
    App.create(req.body.id, { name: req.body.name, owner: req.user._id }, function (err, app) {
      if(err) return next(err);

      res.json(serialize('app', app));
    });
  });

  // Transfer ownership or change name
  app.post('/apps/:app_id', loginWithKey, function (req, res, next) {
    App.byOwnerAndId(req.user._id, req.params.app_id, function (err, app) {
      if(!err && !app) {
        err = new Error("No Such App");
        err.status = 404;
      }
      if(err) return next(err);

      if(req.params.email) {
        app.changeOwner(req.params.email, function (err) {
          if(err) return next(err);

          changeAppName(app, req, res, next);
        });

        return;
      }

      changeAppName(app, req, res, next);
    });
  });

  function changeAppName(app, req, res, next) {
    app.name = req.params.name || app.name;

    app.save(function (err) {
      if(err) return next(err);

      res.json(serialize('app', app));
    });
  }

  // get a list of users with read access for an environment
  app.get('/apps/:app_id/envs/:env_name/users', loginWithKey, appAccess, envAccess, function (req, res, next) {
    User.forEnvironment(req.app._id, req.params.env_name, function (err, users) {
      if(err) return next(err);

      res.json(serialize('user', users));
    });

    User.forEnvironment(req.permissions, req.params.app_id, req.params.env_name, function (err, users) {
      if(err) return next(err);

      res.json(serialize('user', users));
    });
  });

  // Grant read access for an environment (and invite to the pod if they aren't a user)
  app.post('/apps/:app_id/envs/:env_name/users', loginWithKey, function (req, res, next) {
    // TODO: Invite user to an environment
  });

  // Revoke read access for an environment
  app.delete('/apps/:app_id/envs/:env_name/users/:email', loginWithKey, appAccess, envAccess, function (req, res, next) {
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
  });

  // Create a cell
  app.post('/apps/:app_id/envs/:env_name/cells', loginWithKey, loadApp, function (req, res, next) {
    Cell.create(
      req.body.id,
      {
        key: req.body.key,
        value: req.body.value,
        app: req.app._id,
        environment: req.params.env_name,
        creator: req.user._id
      },
      function (err, cell) {
        if(err) return next(err);
        res.json(serialize('cell', cell));
      }
    );
  });

  // Get a cell
  app.get('/apps/:app_id/envs/:env_name/cells/:cell_id', loginWithKey, appAccess, envAccess, function (req, res, next) {
    Cell.findOne({
      uid: req.params.cell_id,
      app: req.app._id,
      environment: req.params.env_name
    });
  });
}

function loadApp(req, res, next) {
  App.byId(req.params.app_id, function (err, app) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return next(err);

    req.app = app;

    next();
  }); 
}

function appAccess(req, res, next) {
  App.byPermissionsAndId(req.permissions, req.params.app_id, function (err, app, permission) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return next(err);

    req.app = app;
    req.appPermission = permision;

    next();
  });
}

function envAccess(req, res, next) {
  if(req.appPermission.environments.indexOf(req.params.env_name) === -1) {
    var err = new Error("You haven't been granted read access on " + req.app.name + "/" + req.params.env_name);
    err.status = 403;
    return next(err);
  }

  next();
}

function loginWithKey(req, res, next) {
  User.byEmail(req.query.email, function (err, user) {
    // verify email exists
    if(!err && !user) {
      err = new Error("No Such User");
      err.status = 401;
    }
    // verify email matches api key
    if(!err && user && !user.validKey(req.query.key)) {
      err = new Error("No Such User");
      err.status = 401;
    }
    if(err) return next(err);

    req.user = user;

    Permission.find({
      user: user._id
    }, function (err, permissions) {
      if(err) return next(err);

      req.permissions = permissions;
      next();
    });
  });
}
