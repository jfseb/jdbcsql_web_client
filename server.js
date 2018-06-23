/**
 * A simple webserver serving the interface
 *
 */

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


var Server = require('./gen/server.js');

var srv = new Server.WCServer(cfgdata, args);

module.exports = {
  server : srv.GetServer(),
  app: srv.GetApp()
};
