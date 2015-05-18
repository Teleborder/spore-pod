var Server = require('../models/server');

// generate a new api key for a server user
exports.createKey = function (req, res, next) {
  Server.byEnv(req.app.uid, req.params.env_name, function (err, server) {
    if(!server) {
      err = new Error("No Such Server");
      err.status = 404;
    }
    if(err) return next(err);

    var key = server.generateKey();

    server.save(function (err) {
      if(err) return next(err);

      res.json(serialize('key', key));
    });
  });
};
