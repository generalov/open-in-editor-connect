var http = require('http');
var supertest = require('supertest');

function createServer (serve, fn) {
  return http.createServer(function (req, res) {
    fn && fn(req, res);
    serve(req, res, function (err) {
      res.statusCode = err ? (err.status || 500) : 404;
      res.end(err ? err.stack : 'next()');
    });
  });
}

function request (serve) {
  return supertest(createServer(serve));
}

module.exports = request;
