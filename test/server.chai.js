/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */
//var process = require('process');
var root =  '../../gen';
var debuglog = require('debug')('server.chai');

var tap = require('tap');
var chai = require('chai');
var chai_http = require('chai-http');
chai.use(chai_http);

console.log('args' + process.argv.join(','));
process.argv[2] = '--simul'
process.argv[3] = '--INTERNAL'
console.log('args now' + Array.from(process.argv).join(','));

const server = require('../server.js');

tap.test('testHome', function (test) {
  test.plan(3);
  chai.request(server.app)
  .get('/home')
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,200);
    test.equal(JSON.stringify(res).indexOf("btnPAR") > 0, true, 'btnPAR present');
    server.server.close();
    test.done();
  });
});


tap.test('testRoot', function (test) {
  test.plan(3);
  chai.request(server.app)
  .get('/')
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,200);
    test.equal(JSON.stringify(res).indexOf("btnPAR") > 0, true, 'btnPAR present');
    server.server.close();
    test.done();
  });
});


tap.test('testGetAbout', function (test) {
  test.plan(3);
  chai.request(server.app)
  .get('/about')
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,200);
    test.equal(JSON.stringify(res).indexOf("jfseb") > 0, true, 'jfseb');
    server.server.close();
    test.done();
  });
});


var query = '/query?query=SELECT%20*%20FROM%20T1%3B';

tap.test('testGetQuery', function (test) {
  test.plan(3);
  setTimeout( function() {

  chai.request(server.app)
  .get(query)
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,500);
    console.log(JSON.stringify(res));
    test.equal(JSON.stringify(res).indexOf("startOpSequential") > 0, true, 'btnPAR present');
    server.server.close();
    test.done();
  });
}, 18);
});

tap.test('testSocketIO', function (test) {
  test.plan(3);
  setTimeout( function() {
    var ioOptions = {
      transportOptions : { polling : {}},
    //  forceNew : true,
      reconnection : true
    };
    var srv = server.server.listen(3000);
    io = require('socket.io-client');
    var sender = io('http://localhost:3000/',
    ioOptions
    );

    //var sender = io('http://localhost:3000/socket.io' , ioOptions);
    //var receiver = io('http://localhost:3000/', ioOptions);
    //srv.start()
    var msgExec = { name: "hithere", body :
    { sourcedest : 'EXEC' ,
    statement : query
    }};
    var msgStart = { name: "hithere", body :
      { sourcedest : 'PAR' ,
      statement : query,
      op: 'START',
      settings : {
      continuous : true,
      parallel: 2
      }
    },
      conversationid : "conv1" };
    var msgChange = { name: "hithere", body :
      { sourcedest : 'PAR' ,
      statement : query,
      op: 'CHANGE',
      settings : {
      continuous : true,
      parallel: 4
      }
    },
      conversationid : "conv1" };
    var msgStop = { name: "hithere", body :
      { sourcedest : 'PAR' ,
      statement : query,
      op: 'STOP',
      settings : {
      continuous : false,
      parallel: 4
      }
    },
      conversationid : "conv1" };


    sender.on('reconnect_attempt', () => console.log('reconnedt atteam'));
    sender.on('connect', function(amsg, bmsg) {
      console.log('got connection' + amsg + ' ' + bmsg);
 /*     setTimeout( ()=> {
        sender.emit('message', msg);
        console.log('emit again')
        sender.emit('login', msg);
        console.log('emit again')

        sender.emit('sqlclient', msg);
        console.log('emit again')
      },5000); */

    sender.on('error', (a,b) => {
      console.log('here error' + a + ' ' + b);
    })
    // sender.send('sqlclient', 'abc');
    //  sender.emit('message', 'abc');
      console.log('emitted again');
    })
    sender.emit('sqlclient', msgChange);
    sender.emit('sqlclient', msgExec);
    sender.on('event', msg => {
      console.log('event ' + JSON.stringify(msg));
    });
    sender.on('sqlclient', function(msg) {
      var id = msg && msg.id;
      debuglog(' ' + cnt + 'here conv id ' + id);
      ++cnt;
      if(cnt == 5) {
        debuglog('FIRE CHANGE!!!!');
        test.equal(msg.sourcedest, 'CHART');
        sender.emit('sqlclient',msgChange);
      }
      if(cnt == 8) {
        debuglog('FIRE STOP!!!')
        test.equal(msg.sourcedest, 'CHART');
        sender.emit('sqlclient',msgStop);
        setTimeout( () => {
          sender.emit('sqlclient',msgStart);
        }, 100);
      }
      if(cnt == 15) {
        test.equal(msg.sourcedest, 'CHART');
        sender.disconnect();
        setTimeout( ()=> srv.close(), 100);
        test.done();
      }
    });
    sender.emit('message', msgStart);
    sender.emit('sqlclient', { name: "hithere", body :
      { sourcedest : 'PAR' ,
      statement : query,
      op: 'START',
      settings : {
      continuous : true,
      parallel: 2
      }
    },
      conversationid : "conv1" }
    );
    console.log('emitted');
    var cnt = 0;
  }, 1000);
});




