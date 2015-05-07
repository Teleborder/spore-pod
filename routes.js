var hmac = require('./config/hmac'),
    Environment = requier('./models/environment');

function routes(app) {
  app.get('/', function (req, res) {
    res.send("hello");
  });

  app.get('/apps/:app_id/:env_name', function (req, res, next) {
    hmac.validate(req, function (valid) {
      if(valid !== true) {
        return res.status(401).send("Authorization Failed");
      }

      var userId = hmac.getKey(req);

      Environment.findOne({
        app: req.params.app_id,
        name: req.params.env_name,
        users: { $in: [userId] }
      }).exec(function (err, env) {
        if(err) return next(err);

        var out = env.pairs.map(function (pair) {
          return pair.key + '=' + pair.value;
        }).join("\n");

        res.send(out);
      });
    });
  });
}

module.exports = routes;
