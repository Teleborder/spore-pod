var basicAuth = require('basic-auth'),
    randomStr = require('./utils/random_string'),
    User = require('./models/user'),
    App = require('./models/app'),
    Deployment = require('./models/deployment'),
    users = require('./controllers/users'),
    apps = require('./controllers/apps'),
    memberships = require('./controllers/memberships'),
    cells = require('./controllers/cells'),
    invites = require('./controllers/invites'),
    deployments = require('./controllers/deployments');

module.exports = routes;

function routes(app) {
  app.get('/', function (req, res) {
    res.redirect('http://spore.sh');
  });

  app.post('/users', users.create);
  app.post('/users/:email/keys', users.createKey);
  app.put('/users/:email', users.update);
  app.patch('/users/:email', users.update);

  app.get('/apps', loginAsUser, apps.list);
  app.post('/apps', loginAsUser, apps.create);
  app.get('/apps/:app_id', loginAsUser, appAccess, apps.show);
  app.post('/apps/:app_id', loginAsUser, appOwner, apps.update);

  app.get('/apps/:app_id/envs/:env_name/deployments', loginAsUser, appAccess, envAccess, deployments.list);
  app.post('/apps/:app_id/envs/:env_name/deployments', loginAsUser, appAccess, envAccess, deployments.create);
  app.delete('/apps/:app_id/envs/:env_name/deployments/:deployment_name', loginAsUser, appAccess, envAccess, deployments.destroy);

  app.get('/apps/:app_id/envs/:env_name/memberships', loginAsUser, appAccess, envAccess, memberships.list);
  app.post('/apps/:app_id/envs/:env_name/memberships', loginAsUser, appAccess, envAccess, memberships.create);
  app.post('/apps/:app_id/envs/:env_name/memberships/:email', loginAsUser, memberships.update);
  app.patch('/apps/:app_id/envs/:env_name/memberships/:email', loginAsUser, memberships.update);
  app.delete('/apps/:app_id/envs/:env_name/memberships/:email', loginAsUser, appAccess, envAccess, memberships.destroy);
  
  app.get('/invites/:token', invites.show);

  app.post('/apps/:app_id/envs/:env_name/cells', loginAsUser, loadApp, cells.create);
  app.get('/apps/:app_id/envs/:env_name/cells/:cell_id', loadApp, loginAsUserOrDeployment, appAccessDeployment, envAccessDeployment, cells.show);
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

function appAccessDeployment(req, res, next) {
  if(req.deployment) {
    return next();
  }
  appAccess(req, res, next);
}

function appAccess(req, res, next) {
  App.byMembershipsAndId(req.memberships, req.params.app_id, function (err, app, membership) {
    if(!err && !app) {
      err = new Error("No Such App");
      err.status = 404;
    }
    if(err) return next(err);

    req.app = app;
    req.appMembership = membership;

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

function envAccessDeployment(req, res, next) {
  if(req.deployment) {
    return next();
  }
  envAccess(req, res, next);
}

function envAccess(req, res, next) {
  // owners always have access
  if(req.app.owner.toString() === req.user._id.toString()) {
    return next();
  }
  // check if they've been granted access by another user
  if(req.appMembership.canAccess(req.params.env_name)) {
    // can't access non-owned apps without confirming email
    if(!req.user.verified) {
      return req.user.generateConfirmation("You need to confirm your email address before accessing other users' environments.", next);
    }
    return next();
  }
  // no access
  var err = new Error("You haven't been granted read access on " + req.app.name + "/" + req.params.env_name);
  err.status = 403;
  next(err);
}

function loginAsUserOrDeployment(req, res, next) {
  var auth = basicAuth(req);

  if(!auth || !auth.name) {
    return failAuth(req, res, next);
  }

  if(auth.name.indexOf('@') !== -1) {
    return loginAsUser(req, res, next);
  }

  loginAsDeployment(req, res, next);
}

function loginAsUser(req, res, next) {
  var auth = basicAuth(req);

  if(!auth) {
    return failAuth(req, res, next);
  }

  User.loginWithKey(auth.name, auth.pass, function (err, user, memberships) {
    if(err) return next(err);

    req.user = user;
    req.memberships = memberships;

    next();
  });
}

function loginAsDeployment(req, res, next) {
  var auth = basicAuth(req);

  if(!auth) {
    return failAuth(req, res, next);
  }

  Deployment.loginWithKey(req.app._id, req.params.env_name, auth.name, auth.pass, function (err, deployment) {
    if(err) return next(err);

    req.deployment = deployment;

    next();
  });
}

function failAuth(req, res, next) {
  // use a random string for the realm since we want the
  // user to reauthenticate for every request
  res.set('WWW-Authenticate', 'Basic realm="' + randomStr(10) + '"');
  return res.sendStatus(401);
}
