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

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    if(err.status) {
      res.status(err.status);
    } else {
      res.status(500);
    }
    res.json({
      error: {
        message: err.message,
        stack: err.stack
      }
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  console.log("PRODUCTION ERROR ENCOUNTERED");
  console.log(err);
  if(err.status) {
    res.status(err.status);
  } else {
    res.status(500);
  }
  res.json({
    error: {
      message: err.message
    }
  });
});

mongoose.connect(process.env.MONGO_URI);

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Spore Pod listening at http://%s:%s', host, port);
});
