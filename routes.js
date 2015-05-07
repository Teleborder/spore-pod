function routes(app) {
  app.get('/', function (req, res) {
    res.send("hello");
  });
}

module.exports = routes;
