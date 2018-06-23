/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */
'use strict';


/* eslint-disable */
//var process = require('process');
var root =  '../../gen';


var tap = require('tap');
var chai = require('chai');
var chai_http = require('chai-http');
chai.use(chai_http);

console.log('args' + process.argv.join(','));
//process.argv[2] = '--simul'
//process.argv[] = '--INTERNAL'
//console.log('args now' + Array.from(process.argv).join(','));


var root = __dirname + '/../'; // eslint-disable-line

var config = {
  port : 3000,
  classpath : [root + './drivers/hsqldb.jar', root + './drivers/derby.jar', root + './drivers/derbyclient.jar', root + './drivers/derbytools.jar'],
  config : {
    url: 'jdbc:hsqldb:hsql://localhost/xdb',
    user: 'SA',
    logging: 'info',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 50
  }
};

var args = {
  parallel : 4,
  data : 2,
  fakemonitor : true
};
/*
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
  console.log('adding stuff now');
  jinst.addOption('-Xrs');
  jinst.setupClasspath(
}

var config = function () {
  return {
    url: 'jdbc:hsqldb:hsql://localhost/xdb',
    user: 'SA',
    logging: 'info',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 50
    //  properties : {user: '', password : ''}
  };
}();
*/

var Server = require('../gen/server.js');

var query = '/query?query=SELECT%20*%20FROM%20T1%3B';

/*
tap.test('testGetQuery', function (test) {
  test.plan(3);
  setTimeout( function() {
  var srv = new Server.WCServer(config, args);
  chai.request(srv.GetApp())
  .get(query)
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,500);
    console.log(JSON.stringify(res));
    test.equal(JSON.stringify(res).indexOf("startOpSequential") > 0, true, 'btnPAR present');
    srv.GetApp().close();
    test.done();
  });
}, 18);
});
*/
var io = require('socket.io-client');

tap.test('testSocketIO', function (test) {
  test.plan(3);
  var srv = new Server.WCServer(config, {
    data : 3,
    fakemonitor : true
  });

  setTimeout( function() {
    var ioOptions = {
      transportOptions : { polling : {}},
    //  forceNew : true,
      reconnection : true
    };
    //var srv = srv; //.listen(3000);

    var sender = io('http://localhost:3000/',
    ioOptions
    );
    var query = 'SELECT * FROM T2;';
    //var sender = io('http://localhost:3000/socket.io' , ioOptions);
    //var receiver = io('http://localhost:3000/', ioOptions);
    //srv.start()

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
    sender.send('sqlclient', 'abc');
    sender.emit('message', 'abc');
      console.log('emitted again');
    })
    sender.on('event', msg => {
      console.log('event ' + JSON.stringify(msg));
    });
    sender.on('sqlclient', function(msg) {
      console.log('here msg result' + JSON.stringify(msg));
      var id = msg && msg.id;
      console.log(' ' + cnt + 'here conv id ' + id);
      ++cnt;
      if(cnt == 5) {
        console.log('FIRE CHANGE!!!!');
        test.equal(msg.sourcedest, 'CHART');
        sender.emit('sqlclient',msgChange);
      }
      if(cnt == 8) {
        console.log('FIRE STOP!!!')
        test.equal(msg.sourcedest, 'CHART');
        sender.emit('sqlclient',msgStop);
        setTimeout( () => {
          sender.emit('sqlclient',msgStart);
        }, 100);
      }
      if(cnt == 15) {
        test.equal(msg.sourcedest, 'CHART');
        sender.disconnect();
        setTimeout( ()=>
        {
           srv.GetServer().close()
        }, 100);
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
    /*
    sender.on('sqlclient', function(msg) {
      var id = msg.id;
      console.log('here result' + JSON.stringify(msg));


      test.true(msg.sourcedest == 'CHART');

      ++cnt;
      if(cnt > 10) {
        sender.disconnect();
        test.done();
      }
    });
    */
}, 1000);
});




