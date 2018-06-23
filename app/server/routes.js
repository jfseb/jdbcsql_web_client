var debug = require('debug');
var debuglog = debug('routes');
var uuid = require('node-uuid');

//var cookieTime = 32 * 24 * 60 * 60; // 32 days in seconds

var url = require('url');

module.exports = function (app) {

  // main login page
  app.get('/', function (req, res) {
    res.redirect('/home');
  });

  app.get('/home', function (req, res) {
    debuglog('at home ' + JSON.stringify(req.session));
    res.render('home', {
      user: (req.session.user && req.session.user.user) || undefined,
      title: 'jdbcsql_client',
      conversationid: uuid.v4(),
      udata: req.session.user,
      altData: req.session.altData
    });
  });

  app.get('/about', function (req, res) {
    res.render('about', {
      pagetitle: 'about',
      user: (req.session.user && req.session.user.user) || undefined,
      title: 'wosap about',
      udata: req.session.user,
      altData: req.session.altData
    });
  });

  var dbconnector = require('../../gen/dbconnector.js');

  app.get('/query', function (req, res) {
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var o = query.query;
    console.log('fire query ' + query.query);
    if (!o) {
      res.status(400).send('error');
    }	else {
      dbconnector.runStatements(query.query,
        function (result) {
          res.setHeader('Content-Type', 'text/plain');
          res.status(200).send(result.replace(/\n/g, '\r\n'));
        }
      );
    }
  });

  app.get('*', function (req, res) { res.render('404', { title: 'Page Not Found'}); });
};
