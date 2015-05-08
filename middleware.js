var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    passportSetup = require('./config/passport'),
    sessionConfig = require('./config/sessions');

function middleware(app) {
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());
  app.use(cookieParser());
  app.use(session({
      secret: sessionConfig.secret,
      cookie: sessionConfig.cookie,
      store: sessionConfig.store
  }));

  passportSetup(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  app.passport = passport;
}

module.exports = middleware;
