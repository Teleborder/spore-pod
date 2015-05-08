var User = require('./models/user'),
    App = require('./models/app'),
    Permission = require('./models/permission'),
    Environment = require('./models/environment'),
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
          if(err.index.slice(-1 * 'email_1') === 'email_1') {
            return next(new Error("Account with that email already exists"));
          }
        }
        return next(err);
      }

      res.json(render('user', user));
    });
  });

  app.post('/login', function (req, res, next) {
    User.findOne({
      email: req.body.email
    }).exec(function (err, user) {
      if(!err && !user) {
        err = new Error("No Such User");
      }
      if(err) return next(err);

      res.json(render('user', user));
    });
  });
  
  app.get('/apps', loginWithKey, function (req, res, next) {
    App.forPermissions(req.permissions, function (err, apps) {
      if(err) return next(err);

      res.json(render('app', apps || []));
    });
  });

  app.post('/apps', loginWithKey, function (req, res, next) {
    App.byName(req.permissions, req.body.name, function (err, app) {
      if(err) return next(err);
      if(app) return next(new Error("App already exists"));

      app = new App({
        name: req.body.name
      });

      var environments = ['production', 'staging', 'development'].map(function (envName) {
        return new Environment({
          app: app._id,
          name: envName
        });
      });

      var permission = new Permission({
        app: app._id,
        user: req.user._id,
        environments: environments.map(function (env) {
          return env._id;
        })
      });

      async.each([app, permission].concat(environments), function (doc, cb) {
        doc.save(cb);
      }, function (err) {
        if(err) return next(err);

        res.json(render('app', app));
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

      res.json(render('app', app));
    });
  });

  app.get('/apps/:app_name/envs', loginWithKey, function (req, res, next) {
    Environment.forApp(req.permissions, req.params.app_name, function (err, envs) {
      if(err) return next(err);

      res.json(render('environment', envs || []));
    });
  });

  // create a new environment for an app
  app.post('/apps/:app_name/envs', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.body.name, function (err, env) {
      if(err) return next(err);
      if(env) return next(new Error("Environment already exists"));

      // TODO 
    });

  });

  app.get('/apps/:app_name/envs/:env_name', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env) {
      if(!err && !env) {
        err = new Error("No Such Environment");
        err.status = 404;
      }
      if(err) return next(err);

      res.json(render('environment', env)); 
    });
  });

  app.get('/apps/:app_name/envs/:env_name/.envy', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env) {
      if(!err && !env) {
        err = new Error("No Such Environment");
        err.status = 404;
      }
      if(err) return next(err);

      var out = Object.keys(env.values || {}).map(function (key) {
        return key + '=' + env.values[key];
      }).join("\n");

      res.send(out);
    });
  });

  // Create/Update an environment variable
  app.post('/apps/:app_name/envs/:env_name', loginWithKey, function (req, res, next) {
    Environment.byName(req.permissions, req.params.app_name, req.params.env_name, function (err, env) {
      if(!err && !env) {
        err = new Error("No Such Environment");
        err.status = 404;
      }
      if(err) return next(err);

      env.values = env.values || {};

      Object.keys(req.body || {}).forEach(function (key) {
        env.values[key] = req.body[key];
      });

      env.save(function (err) {
        if(err) return next(err);

        res.json(render('environment', env));
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

function render(type, data) {
  var out = {},
      types = {
        user: {
          list: 'email',
          item: ['email', 'key']
        },
        app: {
          list: 'name',
          item: ['name']
        },
        environment: {
          list: 'name',
          item: ['name', 'values']
        }
      };

  if(Array.isArray(data)) {
    out[type + 's'] = data.map(function (datum) {
      return datum[types[type].list];
    });
  } else {
    out[type] = {};
    types[type].item.forEach(function (prop) {
      out[type][prop] = data[prop];
    });
  }
  
  return out;
}


module.exports = routes;
