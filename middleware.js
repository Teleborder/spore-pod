var path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport'),
    flash = require('connect-flash'),
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

  app.use(flash());

  // Display flash messages on render
  app.use(function (req, res, next) {
    res.locals.flash = {};
    res.locals.getFlash = function () {
      var flash = req.flash();
      for(var p in flash) {
        if(flash.hasOwnProperty(p)) {
          // only allow unique flash msgs
          res.locals.flash[p] = (flash[p] || []).filter(function (value, index, self) { 
            return self.indexOf(value) === index;
          });
        }
      }
      return res.locals.flash;
    };
    next();
  });
  }

module.exports = middleware;
