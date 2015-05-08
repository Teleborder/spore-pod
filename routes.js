var User = require('./models/user'),
    App = require('./models/app'),
    Permission = require('./models/permission'),
    Environment = require('./models/environment');

function routes(app) {
  app.get('/', function (req, res) {
    res.send("hello");
  });

  app.get('/apps/:app_name/:env_name', function (req, res, next) {
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

  app.get('/signup', function (req, res) {
    res.render('signup');
  });

  app.get('/login', function (req, res) {
    res.render('login');
  });
}

module.exports = routes;
