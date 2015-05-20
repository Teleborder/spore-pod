var express = require('express'),
    settings = require('./settings'),
    middleware = require('./middleware'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
    app = express();

settings(app);
middleware(app);
routes(app);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

app.use(function(err, req, res, next) {
  console.log("ERROR in " + app.get('env'));
  console.log(err);
  console.log(err.stack);

  if(err.status) {
    res.status(err.status);
  } else {
    res.status(500);
  }

  var error = {
    message: err.message
  };

  if(app.get('env') === 'development') {
    error.statck = err.stack;
  }

  res.json({
    error: error
  });
});


mongoose.connect(process.env.MONGO_URI);

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Spore Pod listening at http://%s:%s', host, port);
});
