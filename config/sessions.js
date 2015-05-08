var session = require('express-session'),
    MongoStore = require('connect-mongo')(session);

exports.secret = "bioAjQjOIJSDFaYIQtKo1gfLuFgtl";
exports.cookie = {
  maxAge: 2592000000
};

exports.store = new MongoStore({
  url: process.env.MONGO_URI
});
