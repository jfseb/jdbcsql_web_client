

var debug = require('debug');
var debuglog = debug('routes');
var uuid = require('node-uuid');

var cookieTime = 32*24*60*60; // 32 days in seconds

module.exports = function(app) {

// main login page
  app.get('/', function(req, res){
		// check if the user's credentials are saved in a cookie //
    if (req.cookies.user == undefined || req.cookies.pass == undefined){
      res.redirect('/home');
    }	else{
			// attempt automatic login //
      AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
        if (o != null){
				    req.session.user = o;
          req.session.altData = { 'ticket' : '1234' };
          res.redirect('/home');
        }	else{
          res.render('login', { title: 'Hello - Please Login To Your Account' });
        }
      });
    }
  });


  app.post('/', function(req, res){
    AM.manualLogin(req.body['Username'], req.body['Password'], function(e, o){
      if (!o){
        res.status(400).send(e);
      }	else{
        req.session.user = o;
        if (req.body['remember-me'] == 'true'){
          res.cookie('user', o.user, {  expires : new Date(Date.now()+cookieTime*1000) });
          res.cookie('pass', o.pass, {  expires : new Date(Date.now()+cookieTime*1000) });
        }
        res.status(200).send(o);
      }
    });
  });

  app.get('/home', function(req, res) {
    if (false && req.session.user == null){
	// if user is not logged-in redirect back to login page //
      res.redirect('/');
    }	else{
      debuglog('at home ' + JSON.stringify(req.session));
      res.render('home', {
        user : (req.session.user && req.session.user.user) || undefined,
        title : 'abot',
        conversationid : uuid.v4(),
        udata : req.session.user,
        altData : req.session.altData
      });
    }
  });

  app.get('/about', function(req, res) {
    res.render('about', {
      pagetitle : 'about',
      user : (req.session.user && req.session.user.user) || undefined,
      title : 'wosap about',
      udata : req.session.user,
      altData : req.session.altData
    });
  });


  app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
