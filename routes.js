var User = require('./models/user'),
    App = require('./models/app'),
    users = require('./controllers/users'),
    apps = require('./controllers/apps'),
    permissions = require('./controllers/permissions'),
    cells = require('./controllers/cells');

module.exports = routes;

function routes(app) {
  app.get('/', function (req, res) {
    res.redirect('http://spore.sh');
  });

  app.post('/users', users.create);
  app.post('/users/:email/keys', users.createKey);

  app.get('/apps', loginWithKey, apps.list);
  app.post('/apps', loginWithKey, apps.create);
  app.post('/apps/:app_id', loginWithKey, appOwner, apps.update);

  app.get('/apps/:app_id/envs/:env_name/users', loginWithKey, appAccess, envAccess, permissions.list);
  app.post('/apps/:app_id/envs/:env_name/users', loginWithKey, appAccess, envAccess, permissions.create);
  app.delete('/apps/:app_id/envs/:env_name/users/:email', loginWithKey, appAccess, envAccess, permissions.delete);

  app.post('/apps/:app_id/envs/:env_name/cells', loginWithKey, loadApp, cells.create);
  app.get('/apps/:app_id/envs/:env_name/cells/:cell_id', loginWithKey, appAccess, envAccess, cells.show);
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
    req.appPermission = permission;

    next();
  });
}

function appOwner(req, res, next) {
  App.byOwnerAndId(req.user._id, req.params.app_id, function (err, app) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return next(err);

    next();
  });
}

function envAccess(req, res, next) {
  if(req.appPermission.canAccess(req.params.env_name) || req.app.owner.toString() === req.user._id.toString()) {
    return next();
  }
  var err = new Error("You haven't been granted read access on " + req.app.name + "/" + req.params.env_name);
  err.status = 403;
  next(err);
}

function loginWithKey(req, res, next) {
  User.loginWithKey(req.query.email, req.query.key, function (err, user, permissions) {
    if(err) return next(err);

    req.user = user;
    req.permissions = permissions;

    next();
  });
}
