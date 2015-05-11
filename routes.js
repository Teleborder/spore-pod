var User = require('./models/user'),
    App = require('./models/app'),
    Permission = require('./models/permission'),
    Environment = require('./models/environment'),
    serialize = require('./serialize');
    async = require('async');

function routes(app) {
  app.get('/', function (req, res) {
    res.send("This is Envy.");
  });
  
  app.post('/signup', function (req, res, next) {
    var user = new User({
      email: req.body.email
    });

    user.password = user.generateHash(req.body.password);

    user.save(function(err) {
      if (err) {
        if(err.name === 'ValidationError' && err.errors) {
          return next(err);
        } else if(err.code === 11000) {
          console.log(err);
          if(err.errmsg.indexOf('email_1') > -1) {
            return next(new Error("Account with that email already exists"));
          }
        }
        return next(err);
      }

      res.json(serialize('user', user));
    });
  });

  app.post('/login', function (req, res, next) {
    User.byEmail(req.body.email, function (err, user) {
      if(!err && (!user || !user.validPassword(req.body.password))) {
        err = new Error("Invalid email or password");
        err.status = 401;
      }
      if(err) return next(err);

      res.json(serialize('user', user));
    });
  });
  
  app.get('/apps', loginWithKey, function (req, res, next) {
    App.forPermissions(req.permissions, function (err, apps) {
      if(err) return next(err);

      res.json(serialize('app', apps || []));
    });
  });

  app.post('/apps', loginWithKey, function (req, res, next) {
    App.byName(req.permissions, req.body.name, function (err, app) {
      if(err) return next(err);
      if(app) return next(new Error("App already exists"));

      app = new App({
        name: req.body.name,
        owner: req.user._id
      });

      var permission = new Permission({
        app: app._id,
        user: req.user._id,
        environments: []
      });

      async.each([app, permission], function (doc, cb) {
        doc.save(cb);
      }, function (err) {
        if(err) return next(err);

        res.json(serialize('app', app));
      });
    });
  });

  app.get('/apps/:app_name', loginWithKey, function (req, res, next) {
    App.byName(req.permissions, req.params.app_name, function (err, app) {
      if(!err && !app) {
        err = new Error("No Such App");
        err.status = 404;
      }
      if(err) return next(err);

      res.json(serialize('app', app));
    });
  });

  // Transfer ownership
  app.post('/apps/:app_name', loginWithKey, function (req, res, next) {
    App.byName(req.user._id, req.params.app_name, function (err, app) {
      if(!err && !app) {
        err = new Error("No Such App");
        err.status = 404;
      }
      if(err) return next(err);

      User.byEmail(req.params.email, function (err, user) {
        if(!err && !user) {
          err = new Error("No Such User");
        }
        if(err) return next(err);

        // add a permission for this user to use this app?
        app.owner = user._id;

        res.json(serialize('app', app));
      });
    });
  });

  app.get('/apps/:app_name/users', loginWithKey, function (req, res, next) {
    User.forApp(req.permissions, req.params.app_name, function (err, users) {
      if(err) return next(err);

      res.json(serialize('user', users));
    });
  });

  app.post('/apps/:app_name/users', loginWithKey, function (req, res, next) {
    // TODO: Invite user to an app
  });

  app.get('/apps/:app_name/envs/:env_name', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env) {
      if(err) return next(err);

      if(!env) {
        env = {
          name: req.params.env_name
        };
      }

      env.values = env.values || {};

      res.json(serialize('environment', env)); 
    });
  });

  app.get('/apps/:app_name/envs/:env_name/users', loginWithKey, function (req, res, next) {
    User.forEnvironment(req.permissions, req.params.app_name, req.params.env_name, function (err, users) {
      if(err) return next(err);

      res.json(serialize('user', users));
    });
  });

  app.post('/apps/:app_name/envs/:env_name/users', loginWithKey, function (req, res, next) {
    // TODO: Invite user to an environment
  });

  app.get('/apps/:app_name/envs/:env_name/.envy', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env, app) {
      if(err) return next(err);

      if(!env) {
        env = {
          name: req.params.env_name
        };
      }

      var out = "ENVY_APP_NAME=" + app.name + "\n";
      out += "ENVY_ENV_NAME=" + env.name + "\n";

      out += Object.keys(env.values || {}).map(function (key) {
        return key + '=' + env.values[key];
      }).join("\n");

      res.send(out);
    });
  });

  // Create/Update an environment variable
  // This creates the environment with a permission
  // for the current user if it doesn't already exist
  app.post('/apps/:app_name/envs/:env_name', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env, app) {
      if(err) return next(err);

      var toSave = [],
          permission;

      if(!env) {
        env = new Environment({
          name: req.params.env_name,
          app: app._id
        });

        // find the permission for this app
        req.permissions.forEach(function (perm) {
          if(perm.app.toString() === app._id.toString()) {
            permission = perm;
          }
        });

        // add permission for the new environment
        permission.environments = permission.environments || [];
        permission.environments.push(env._id);

        toSave.push(permission);
      }

      env.values = env.values || {};

      Object.keys(req.body || {}).forEach(function (key) {
        env.values[key] = req.body[key];
      });

      env.markModified('values');

      toSave.push(env);

      async.each(toSave, function (doc, callback) {
        doc.save(callback);
      }, function (err) {
        if(err) return next(err);

        res.json(serialize('environment', env));
      });
    });
  });
}

function loginWithKey(req, res, next) {
  User.findOne({
    key: req.query.key
  }, function (err, user) {
    if(!err && !user) {
      err = new Error("No Such User");
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

module.exports = routes;
