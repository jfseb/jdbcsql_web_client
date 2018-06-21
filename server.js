/**
 * A simple webserver serving the interface
 *
 */

/*global __dirname:true*/
var process = require('process');
if(process.env.DO_RELIC) {
   // only do this is deployed in heroku
  require('newrelic');
}

var argsparse = require('argparse');
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'jdbc_sql_client \n node server '
});
parser.addArgument(
  [ '-P', '--parallel' ],
  {
    help: 'Number of parallel executors, default 4',
    type : 'int',
    nargs : argsparse.Const.OPTIONAL,
    defaultValue : 4,
    metavar : 'PARALLEL_EXEC'
  }
);
parser.addArgument(
  [ '-Q', '--qps_avg' ],
  {
    help: 'Query per second/minute window in ms (e.g. 10000)',
    type : 'int',
    nargs : argsparse.Const.OPTIONAL,
    defaultValue : 10000,
    metavar : 'PARALLEL_EXEC'
  }
);
parser.addArgument(
  [ '--simul' ],
  {
    help: 'bar foo',
    nargs: 0
  }
);
parser.addArgument(
  ['--vora' ],
  {
    help: 'use vora driver and config',
    nargs : 0,
  }
);
parser.addArgument(
  ['-f','--fakemonitor' ],
  {
    help: 'create fake fake monitor table on db',
    nargs : 0,
  }
);
parser.addArgument(
  [ '-D', '--data' ],
  {
    help: 'Number of records to generate in table T2',
    type : 'int',
    nargs : argsparse.Const.OPTIONAL,
    defaultValue : 0,
    metavar : 'NR_DATA'
  }
);
parser.addArgument(
  [ '--INTERNAL' ],
  {
    help: 'internal testing',
    nargs: 0
  }
);

var args = parser.parseArgs();

console.log(JSON.stringify(args));

// read a config file
var fs = require('fs');
var cfgdata = undefined;
try {
  var dataf = fs.readFileSync('jdbcsql_config.json');
  cfgdata = JSON.parse(dataf);
} catch(e)
{
  console.log('could not read ./jdbcsql_config.json, falling back to default config' + e);
}


var http = require('http');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

 // conf = require('./config.json');

var uuid = require('node-uuid');
var debug = require('debug');
var debuglog = debug('server');
//var botdialog = require('./gen/bot/smartdialog.js');
var compression = require('compression');


var app = express();

app.locals.pretty = true;
app.set('port', process.env.PORT || (cfgdata && cfgdata.port) || 42042);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));


app.get('*',function(req,res,next){
  if((req.headers['x-forwarded-proto'] !='https') && process.env.PORT)
    res.redirect(process.env.ABOT_SERVER +req.url);
  else
    next(); /* Continue to other routes if we're not redirecting */
});

var oneDay = 86400000; // in milliseconds
app.use(express.static(__dirname + '/app/public',{
  maxage: oneDay
}));

if (process.env.NODE_ENV === 'development') {
  // only use in development
  //app.use(errorHandler());
}

// build mongo database connection url //

//var dbHost = process.env.DB_HOST || 'localhost';
//var dbPort = process.env.DB_PORT || 27017;
//var dbName = process.env.DB_NAME || 'node-login';


//var dbURL = 'mongodb://'+dbHost+':'+dbPort+'/'+dbName;
//if (app.get('env') == 'live'){
// prepend url with authentication credentials //
//	dbURL = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+dbHost+':'+dbPort+'/'+dbName;
//}

// https://github.com/expressjs/session

//var pglocalurl = process.env.DATABASE_URL || 'postgres://joe:abcdef@localhost:5432/startupdefaults';

var l_session = session({
  secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
  proxy: true,
  resave: true,
  saveUninitialized: true
}
);
  // remember to create sessions table in DB!
  //https://www.npmjs.com/package/connect-pg-simple

//var sharedsession = require('express-socket.io-session');

app.use(l_session);



require('./app/server/routes')(app);

var server = http.createServer(app);

if(process.argv.indexOf('--INTERNAL') == -1) {
  server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });
}


//var server = require('http').createServer(app);
var io = require('socket.io');
io = io.listen(server);


//io.use(ios(l_session));
var sharedsession = require('express-socket.io-session');

io.use(sharedsession(l_session, {
  autoSave:true
}));

//https://github.com/xpepermint/socket.io-express-session


app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/index.html');
});


app.get('/favicon.ico', function (req, res) {
  console.log('serving icon!!!!!!!!!!!!!!!!');
  res.sendfile(__dirname + '/public/css/ui/droplet.ico');
});

//server.listen(process.env.PORT || 42042);

module.exports = {
  server : server,
  app: app
};

var Monitor = require('./gen/monitor.js');
// heroku requires the socket to be taken within 60 seconds,
// so we start the server early even if the intenral initialization blocks
// it

setTimeout(function() {

  var config = undefined;
  var htmlconnector;
  var connector;
  if(args.simul) {
    htmlconnector = require('./gen/connector.js');
    connector = new htmlconnector.Connector();
  } else {
    if(cfgdata) {
      var path = require('path');
      var config_path = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
      console.log('path to jdbc ' + config_path);
      var jinst = require('jdbc/lib/jinst');

      if (!jinst.isJvmCreated()) {
        console.log('adding drivers from ' + cfgdata.classpath);
        jinst.addOption('-Xrs');
        jinst.setupClasspath(cfgdata.classpath);
      }

      var Pool = require('jdbc');

      config = cfgdata.config;
      var testpool = new Pool(config, function(err, ok) {
        console.log('here we try pool' + err);
        console.log('here we try pool' + ok);
      });
      testpool.initialize(function() {});
    }


    if (args.vora) {
      var path = require('path');
      var config_path = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
      console.log('path to jdbc ' + config_path);
      var jinst = require('jdbc/lib/jinst');

      if (!jinst.isJvmCreated()) {
        console.log('adding vora driver');
        jinst.addOption('-Xrs');
        jinst.setupClasspath([  //root + './drivers/hsqldb.jar',
          '/home/D026276/localgit/sjdbcsql_throughput/drivers/acmereports.jar']);
      }

      var Pool = require('jdbc');

      config = require(config_path + '/gen/configs/config_vora.js').config;
      config = {
        //    url: 'jdbc:hsqldb:hsql://localhost/xdb',
        //    user: 'SA',
        libpath : './drivers/hl-jdbc-2.3.90.jar',
        drivername : 'com.sap.vora.jdbc.VoraDriver',
        url : 'jdbc:hanalite://' + '127.0.0.1:2202',
            //url : 'jdbc:hanalite://' + '127.0.0.1:2202' + '/?resultFormat=binary',
        user : '',
        logging : 'info',
        password: '',
        minpoolsize: 2,
        maxpoolsize: 500
        //    properties : {user: '', password : ''}
      };
      var testpool = new Pool(config, function(err, ok) {
        console.log('here we try pool' + err);
        console.log('here we try pool' + ok);
      });
      testpool.initialize(function() {});
    }

    htmlconnector = require('./gen/dbconnector.js');
    console.log('config setup is ' + JSON.stringify(config));
    htmlconnector.Setup(args.parallel,config);
    connector = new htmlconnector.Connector( { qps_avg : args.qps_avg });
    if(args.data > 0) {
      connector.getParallelExecutor().startSequentialSimple('CREATE TABLE IF NOT EXISTS T2 (id  bigint, NAME varchar(200), "VALUE" int, NR int);').catch(err => console.log(err));
      //connector.getParallelExecutor().startSequentialSimple('INSERT INTO SYSTABNOW VALUES( CREATE TABLE SYSTABMON( NAME : string, VALUE: int, NR : int) IF NOT EXIST;').catch(err => console.log(err));
      //connector.getParallelExecutor().startSequentialSimple('DELETE FROM T2;').catch(err => console.log(err));
      for(var k = 0; k < args.data; ++k)
      { var i = (k + Date.now()) % 100000000;
        connector.getParallelExecutor().startSequentialSimple(`INSERT INTO T2( id, NAME, NR, "VALUE") values (${i}, '${'NAME' + i}',${i % 1000}, ${2 * i});`).catch(err => console.log(err));
      }
    }


    if(!args.fakemonitor) {
      //
    } else {
      Monitor.MONITOR_SYSTABLE_NAME = 'SYSTABMON';
      connector.getParallelExecutor().startSequentialSimple('CREATE TABLE IF NOT EXISTS SYSTABMON( NAME varchar(200), "VALUE" int, NR int);').catch(err => console.log(err));
      //connector.getParallelExecutor().startSequentialSimple('INSERT INTO SYSTABNOW VALUES( CREATE TABLE SYSTABMON( NAME : string, VALUE: int, NR : int) IF NOT EXIST;').catch(err => console.log(err));
      connector.getParallelExecutor().startSequentialSimple('DELETE FROM SYSTABMON;').catch(err => console.log(err));
      var values = [
        /*
        MAX_MEM_USAGE_30s : number = 0;
        MEM_USAGE : number = 0;
        AGGR_PLAN_EXEC_DURATION : number = 0;
        QUERY_PER_MIN : number = 0;
        CPU_UTILIZATION : number = 0;
        MEM_UTILIZATION : number = 0;
        MAX_MEM_EVER : number = 0;
        NR_PARALLEL_PLAN : number = 0;
        PLAN_EXEC_DURATION : number = 0;*/
        { NAME : 'MAX_MEM_USAGE_30s' , NR : 3000, VALUE :  2804},
        { NAME : 'MEM_USAGE' , NR : 3000, VALUE : 2384},
        { NAME : 'AGGR_PLAN_EXEC_DURATION' , NR : 3000, VALUE : 70},
        { NAME : 'QUERY_PER_MIN' , NR : 3000, VALUE : 33},
        { NAME : 'CPU_UTILIZATION' , NR : 3000, VALUE : 80},
        { NAME : 'MEM_UTILIZATION' , NR : 3000, VALUE : 40},
        { NAME : 'MAX_MEM_EVER' , NR : 3000, VALUE :  4884},
        { NAME : 'NR_PARALLEL_PLAN' , NR : 3000, VALUE : 17},
        { NAME : 'PLAN_EXEC_DURATION' , NR : 3000, VALUE : 333},
      ];
      values.forEach( rec => {
        connector.getParallelExecutor().startSequentialSimple(`INSERT INTO SYSTABMON( NAME, NR, "VALUE") values ('${rec.NAME}',${rec.NR}, ${rec.VALUE});`).catch(err => console.log(err));
      });
    }
  }

  io.sockets.on('connection', function (socket) {
    var id = uuid.v4().toString(); // '' + Date.now();
    socket.id = id; //uuid.v4();// id;
  //console.log('here session on connect ' + socket.handshake.session);
  //console.log(socket.handshake.session);
  //console.log(JSON.stringify(socket.handshake.session));

    var user = socket.handshake.session &&
    socket.handshake.session.user &&
    socket.handshake.session.user &&
    socket.handshake.session.user.user;
    if (!user) {
      user = 'ano:' + uuid.v4();
    }
    debuglog('Client connected for user ' + user + ' ' + Object.keys(io.clients).join(' '));
       // console.log('Got answer : ' + sAnswer + '\n');
// not now  htmlconnector.startConversation({ id : id } , function() {});
    socket.on('login', function(userdata) {
      console.log('LOGIN!!!!!' + id) + ' ' + userdata;
      debuglog('Got a login event with ' + JSON.stringify(userdata));
      socket.handshake.session.userdata = userdata;
    });
    socket.on('logout', function(userdata) {
      console.log('LOGOUT!!!!!' + id) + ' ' + userdata;
      debuglog('Got a logout event with ' + JSON.stringify(userdata));
      if (socket.handshake.session.userdata) {
        delete socket.handshake.session.userdata;
      }
    });
    socket.on('error', (err) => {
      console.log(err);
    });
    socket.on('reconnect_failed', (err) => {
      console.log(err);
    });
    debuglog('associate answerhook '+ id);
    connector.setAnswerHook(function (sId, msg) {
      debuglog('sending answer for ' + id + ' to ' + sId + ' > ' + JSON.stringify(msg));
      socket.emit('sqlclient',{ time : new Date(),
        sourcedest : msg.sourcedest,
        body : msg.body,
        id : id
      });
    }, id);

  //socket.emit('register', { id : id });
    socket.on('disconnect', () => {
      console.log('DISCONNECT!!!!!' + id);
      connector.disconnect(id);
      debuglog('Client disconnected' + id);  });
    socket.emit('sqlclient', { time : new Date(), sourcedest : 'DIALOG', body: 'Indicate your query or wish:' });
    debuglog('got a message from ' + user + ' ' + id  );
    socket.on('sqlclient', function (data) {
      //var user = getUser(socket.handshake.session)
      debuglog('request has conversationID? '  + (data && data.conversation) );
      var conversationID = data.conversationID || id;
      debuglog('re associate answerhook ' + conversationID);
      connector.setAnswerHook(function (sId, sBody) {
        console.log('sending answer for ' + sId + ' to ' + conversationID + ' > ' +  JSON.stringify(sBody));
        socket.emit('sqlclient',
          { time : new Date(),
            name : 'unknown' ,
            command : 'nocommand',
            sourcedest : sBody.sourcedest,
            body : sBody.body,
            id : conversationID
          });
      }, conversationID);
      console.log('user' + user + ' conv: ' + conversationID + ' asks '  + JSON.stringify(data.body));
      connector.processMessage({ conversationID : conversationID,
        user : user,
        body : data.body });
    });
  });

}, 500);