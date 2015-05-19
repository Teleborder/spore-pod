var Deployment = require('../models/deployment'),
    serialize = require('../serialize');

exports.list = function (req, res, next) {
  Deployment.byEnv(req.app._id, req.params.env_name, function (err, deployments) {
    if(err) return next(err);

    res.json(serialize('deployment', deployments));
  });
};

exports.create = function (req, res, next) {
  Deployment.create(req.app._id, req.params.env_name, req.body.name, function (err, deployment, key) {
    if(err) return next(err);

    var envVar = deployment.environmentVariable(key);
    deployment = deployment.toObject();
    deployment.key = key;
    deployment.exports = envVar;

    res.json(serialize('deployment', deployment));
  });
};

exports.destroy = function (req, res, next) {
  Deployment.remove(req.app._id, req.params.env_name, req.params.deployment_name, function (err, deployment) {
    if(err) return next(err);

    deployment = deployment.toObject();
    deployment.destroyed = true;

    res.json(serialize('deployment', deployment));
  });
};
