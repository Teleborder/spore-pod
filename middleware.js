var path = require('path'),
    express = require('express');

function middleware(app) {
  app.use(express.static(path.join(__dirname, 'public')));
}

module.exports = middleware;
