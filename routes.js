var User = require('./models/user'),
    App = require('./models/app'),
    Permission = require('./models/permission'),
    Environment = require('./models/environment'),
    async = require('async');

function routes(app) {
  app.get('/', function (req, res) {
    res.redirect('/signup');
  });

  // API

  app.get('/api/apps/:app_name/:env_name', function (req, res, next) {
    User.findOne({
      key: req.query.key
    }, function (err, user) {
      if(err) return next(err);
      if(!user) return next(new Error("No Such User"));

      Permission.find({
        user: user._id
      }, function (err, permissions) {
        if(err) return next(err);

        var appIds = [];
        var envIds = [];

        permissions.forEach(function (perm) {
          appIds.push(perm.app);
          envIds.push.apply(envIds, perm.environments);
        });

        App.findOne({
          name: req.params.app_name,
          _id: {
            $in: appIds
          }
        }).exec(function (err, app) {
          if(err) return next(err);
          if(!app) return next(new Error("No Such App"));

          Environment.findOne({
            app: app._id,
            name: req.params.env_name,
            _id: {
              $in: envIds
            }
          }, function (err, env) {
            if(err) return next(err);
            if(!env) return next(new Error("No Such Environment"));

            var out = env.pairs.map(function (pair) {
              return pair.key + '=' + pair.value;
            }).join("\n");

            res.send(out);
          });
        });
      });
    });
  });

  // USER

  app.get('/signup', function (req, res) {
    if(req.isAuthenticated()) {
      // req.flash('info', 'You are already logged in.');
      return res.redirect('/');
    }
    res.render('signup');
    res.render('signup');
  });

  app.post('/signup', app.passport.authenticate('local-signup', {
    successRedirect : '/',
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : false
  }));

  app.get('/login', function (req, res) {
    if(req.isAuthenticated()) {
      // req.flash('info', 'You are already logged in.');
      return res.redirect('/');
    }
    res.render('login');
  });

  app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/',
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : false
  }));

  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // APP ADMIN
  
  app.get('/apps', isLoggedIn, function (req, res, next) {
    Permission.find({
      user: req.user._id
    }, function (err, permissions) {
      if(err) return next(err);

      var appIds = permissions.map(function (perm) {
        return perm.app;
      });

      App.find({
        _id: {
          $in: appIds
        }
      }).exec(function (err, apps) {
        if(err) return next(err);

        res.json(apps);
      });
    });
  });

  app.post('/apps', isLoggedIn, function (req, res, next) {
    var app = new App({
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
      environments: environments
    });

    async.each([app, permission].concat(environments), function (doc, cb) {
      doc.save(cb);
    }, function (err) {
      if(err) return next(err);

      res.redirect('/apps/' + app.name);
    });
  });

  app.get('/apps/:app_name', isLoggedIn, function (req, res, next) {
    Permission.find({
      user: req.user._id
    }, function (err, permissions) {
      if(err) return next(err);

      var appIds = permissions.map(function (perm) {
        return perm.app;
      });

      App.findOne({
        name: req.params.app_name,
        _id: {
          $in: appIds
        }
      }).exec(function (err, app) {
        if(err) return next(err);
        if(!app) return next(new Error("No Such App"));

        res.json(app);
      });
    });
  });
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on 
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  // req.flash('error', "You're not logged in.");
  res.redirect('/');
}


module.exports = routes;
