var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');

function middleware(app) {

  if(app.get('env') === 'development') {
    app.use(function (req, res, next) {
      console.log(req.method + " " + req.originalUrl);
      console.log(req.headers);
      next();
    });
  }

  // Only allow secure requests in production
  app.use(function (req, res, next) {
    // heroku sets `x-forwarded-proto` when proxying
    if(app.get('env') === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://' + req.hostname + req.originalUrl);
    }

    next();
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());
  app.use(cookieParser());
}

module.exports = middleware;
