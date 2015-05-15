var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser');

function middleware(app) {

  // Only allow secure requests in production
  app.use(function (req, res, next) {
    // heroku sets `x-forwarded-proto` when proxying
    if(app.get('env') === 'production' && !req.secure && req.headers['x-forwarded-proto'] !== 'https') {
      res.redirect('https://' + req.hostname + ':' + app.address().port + req.originalUrl);
    }

    next();
  });

  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());
  app.use(cookieParser());
}

module.exports = middleware;
