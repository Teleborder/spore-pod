var path = require('path');

function settings(app) {
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');
}

module.exports = settings;
