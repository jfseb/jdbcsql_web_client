/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */
'use strict';

var root =  '../../gen';

var tap = require('tap');
var chai = require('chai');
var chai_http = require('chai-http');
chai.use(chai_http);

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
  data : 0,
  fakemonitor : true
};

var Server = require('../gen/server.js');

var dbconnector = require('../gen/dbconnector.js');

var io = require('socket.io-client');

tap.test('testExecStatement', function (test) {
  test.plan(3);
  var srv = new Server.WCServer( config, args );
  var gotStatements = false;
  var gotExec = false;
//  var connector = srv.GetConnector();
  var cnt = 0;
  setTimeout( function() {
    var ioOptions = {
      transportOptions : { polling : {}},
    //  forceNew : true,
      reconnection : true
    };
    var sender = io('http://localhost:3000/',
      ioOptions
    );
    //var query = 'SELECT * FROM TNOTEXIST;';
    //var conversationID = 'conv1';
    sender.on('reconnect_attempt', () => console.log('reconnedt atteam'));
    sender.on('connect', function(amsg, bmsg) {
      console.log('got connection' + amsg + ' ' + bmsg);
    });
    sender.on('event', msg => {
      console.log('event ' + JSON.stringify(msg));
    });
    sender.on('sqlclient', function(msg) {
      console.log('here msg result' + JSON.stringify(msg));
      var id = msg && msg.conversationID;
      ++cnt;
      console.log('here response  ' + cnt + ' ' +  id + ' ' + JSON.stringify(msg));
      if(cnt == 1) {
        test.deepEqual(msg.sourcedest, 'DIALOG');
        console.log('requesting exec');
              //gotExec = true;
      }
      if(cnt == 2) {
        test.deepEqual(msg.sourcedest, 'DIALOG');
        gotExec = true;
      }
      if(gotStatements && gotExec) {
        sender.disconnect();
        setTimeout(() => {
          srv.GetServer().close();
        }, 100);
        test.done();
      }
    });
    dbconnector.runStatements('CREATE TABLE IF NOT EXISTS T3(k int);DELETE FROM T3;INSERT INTO T3(k) VALUES (100);SELECT * FROM T3;', function(msg) {
      gotStatements = true;
      console.log('here callback results' + msg);
      test.deepEqual(msg.indexOf('| 100 |') > 0, true);

      sender.emit('sqlclient', { name: 'hithere', body :
      { sourcedest : 'EXEC' ,
        statement : 'SELECT * FROM T3;'
      },
        conversationid : 'conv1' }
      );
      if(gotStatements && gotExec) {
        sender.disconnect();
        setTimeout(() => {
          srv.GetServer().close();
        }, 100);
        test.done();
      }
    });
  }, 1000);
});




