/**
 * A Connector exposes the interface toward the webserver
 * to manage multiple conversations
 */
'use strict';

import * as debug from 'debug';
const debuglog = debug('dbconnector');
import * as assert from 'assert';
const path = require('path');

import * as _ from 'lodash';

var jinst = require('jdbc/lib/jinst');

import { Monitor } from './monitor';

if (!jinst.isJvmCreated()) {
  console.log('adding stuff in main!now');
  jinst.addOption('-Xrs');
  var root = `${__dirname}/..`; // eslint-disable-line
  //root = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
  console.log('here driver dir: '+   root + '/drivers/hsqldb.jar');
  jinst.setupClasspath([
    root + '/drivers/hsqldb.jar',
    root + '/drivers/derby.jar',
    root + '/drivers/derbyclient.jar',
    root + '/drivers/derbytools.jar']);
}

var config_path = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
console.log('path to jdbc ' + config_path);
var config = require(config_path + '/gen/configs/config_derby.js').config;


import { ParallelPool, SQLExec, ParallelExecutor, Constants } from 'jdbcsql_throughput';
import * as jdbcsql_throughput from 'jdbcsql_throughput';


console.log('config' + JSON.stringify(config));

var Pool = require('jdbc');

console.log('config' + JSON.stringify(config));
console.log('config' + JSON.stringify(config));

var testpool : any = undefined;
var executor : SQLExec.SQLExec = undefined;
var parpool : ParallelPool.ParallelPool = undefined; //= new  ParallelPool(4, testpool, config, undefined );
var parallel_exec : Constants.IParallelExecutor = undefined;

export function Setup(nrexec :number, explicitconfig? : any) {
  var cfg = explicitconfig || config;
  testpool = new Pool(cfg);
  executor = new SQLExec.SQLExec({});
  parpool = new  ParallelPool.ParallelPool(nrexec, testpool, config, undefined );
  parallel_exec = new ParallelExecutor.ParallelExec(parpool.getExecutors());
}

export function runStatements(statements : string, cb : (res : string) => void) {
  var arr = statements.split(';');
  arr = arr.map(s => s.trim());
  arr = arr.filter(s => s.length);
  arr = arr.map( s => s + ";");
  var cnt = 0;
  var fullResult = "";
  arr.forEach( statement =>
  {
    parallel_exec.startOpSequential("seqstatement",
      statement,
      {
        progress : function(op,rc) {
          console.log('end sequential ' + op.lastRC + ' ' + op.lastResult);
          var lr = op.lastResult;
          if(op.lastRC && _.isArray(op.lastResult)) {
            lr = (new SQLExec.SQLExec({})).makeAsciiTable(op.lastResult);
          } else {
            lr = "" + op.lastResult;
          }
          fullResult += lr;
          fullResult += "\n";
          ++cnt;
          if(cnt == arr.length) {
            cb(fullResult);
          }
        }
      }
    )
  });
}

/*
 executor = new SQLExec({});
 parpool = new  ParallelPool(4, testpool, config, undefined );
 parallel_exec = new ParallelExec.ParallelExec(parpool.getExecutors());


 testpool = new Pool(config, function(err, ok) {
  console.log('here we try pool' + err);
  console.log('here we try pool' + ok);
});
*/
/*

var executor = new SQLExec({});
var parpool = new  ParallelPool(4, testpool, config, undefined );
var parallel_exec = new ParallelExec.ParallelExec(parpool.getExecutors());
*/

export interface IRecord {
    time:  number;
    QPS: number;
    FAIL: number;
    MEM: number;
    CPU: number;
    DUR: number,
    NP: number,
    PAR: number,
    MAXMEM: number
};

var MAXMEM = 10;
var CPU = 80;
var MEM = 1;
var FAIL = 0;
var QPS = 0;
var DUR = 0;
var PAR = 0;

export interface ISettings {
  parallel: number,
  continuous: boolean // running or not
}

export interface ResultRec {
  time : number,
  rc : boolean
};

export interface IConvRec {
  statement?: string,
  settings?: ISettings,
  handle? : string,
  last_stop_t : number,
  last_switch_t : number, // time of last parallel alteration
  delta_t : number,
  lastQPS : number,
  lastFAIL : number,
  results : ResultRec[]
}

export interface IMessage {
  conversationID: string,
  sourcedest?: string,  // key for source/destination
  user: string,
  body: any
};

export class Connector {
  answerHook: any = {};
  answerHooks: any = {};
  conversationID: string = "";
  quitHook: any = undefined;
  intervals: Map<string, IConvRec> = new Map<string, IConvRec>();

  qps_avg : number = 10000; // time to calculate QPS averages
  monitor : Monitor;

  constructor(options: any) {
    assert(parallel_exec, "Must invoke Setup before!")
  /*  if(!parallel_exec) {
      console.log('running default setup, you may want to invoke Setup');
      Setup(4);
    }*/
    this.qps_avg = (options && options.qps_avg) || 10000;
    this.answerHooks = {};
    this.monitor = new Monitor(parallel_exec);
    this.conversationID = options && options.conversationID || ('' + Date.now());
  };
  setAnswerHook(answerHook, id): void {
    console.log('register answerhook for ' + id);
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };

  /**
   * Expose the parallel executor
   */
  getParallelExecutor() : Constants.IParallelExecutor {
    return parallel_exec;
  };

  isActive(conversationID: string) : boolean {
    return this.intervals.has(conversationID);
  }

  disconnect(conversationID: string) {
    var that = this;
    if (that.intervals.has(conversationID)) {
      var u = that.intervals.get(conversationID);
      if(u) {
        parallel_exec.stopOp(u.handle);
      }
      that.intervals.delete(conversationID);
      this.adjustMonitor();
      return; //running!
    }
  }

  getOneStatement(statement: string) {
    var arr = statement.split(";");
    var res = arr[arr.length - 1];
    res = res.trim();
    var i = arr.length - 2;
    if (res.length == 0 && i >= 0) {
      res = arr[i];
      --i;
    }
    res = res.trim();
    res = res + ";";
    console.log('rectified statement ' + res);
    return res;
  };

  getConvRecord(conversationID : string) : IConvRec {
    assert(this.intervals.has(conversationID));
    return this.intervals.get(conversationID);
  };

  getDefaultConvRecord(conversationID: string): IConvRec {
    var that = this;
    if (that.intervals.has(conversationID)) {
      return that.intervals.get(conversationID);
    }
    var res: IConvRec = {
      last_stop_t: Date.now(),
      delta_t: -Date.now(),
      last_switch_t : Date.now(),
      statement : undefined,
      handle : undefined,
      results : [],
      lastFAIL : 0,
      lastQPS : 0
    };
    return res;
  }

  getLastRecords(currentRec : IConvRec) : ResultRec[] {
    var that = this;
    if(currentRec.results.length > 100) {
      currentRec.results = currentRec.results.slice(currentRec.results.length - 100);
    }
    var last_time = currentRec.results.length ? currentRec.results[currentRec.results.length-1].time : Date.now();
    var last3sRecords = currentRec.results.filter( r => r.time > (last_time - that.qps_avg));
    if(last3sRecords.length < 10 ) {
      last3sRecords = currentRec.results.filter( (r, index) => (index + 10 > currentRec.results.length));
    }
    console.log('got ' + last3sRecords.length + ' records within last ' + this.qps_avg + ' sec');
    return last3sRecords;
  }

  getQPS(currentRec : IConvRec) : number {
    var last_time = currentRec.results.length ? currentRec.results[currentRec.results.length-1].time : Date.now();
    var last3sRecords = this.getLastRecords(currentRec);
    console.log('got ' + last3sRecords.length + ' records within last ' + this.qps_avg + ' sec');
    const MIN = 1000*60;
    if(last3sRecords.length > 5) {
      var delta_t =  (last3sRecords[last3sRecords.length-1].time - last3sRecords[0].time );
      currentRec.lastQPS = (delta_t > 0) ? (last3sRecords.length * MIN /  delta_t) : currentRec.lastQPS;
    }
    var lastSinceSwitchRecords = currentRec.results.filter( r => r.time > currentRec.last_switch_t);
    var otherQPS = currentRec.lastQPS;
    if(lastSinceSwitchRecords.length > 4) {
      otherQPS = lastSinceSwitchRecords.length * MIN /
      (lastSinceSwitchRecords[lastSinceSwitchRecords.length-1].time - lastSinceSwitchRecords[0].time);
    }
    console.log('*** here qps avg' + currentRec.lastQPS + ' here total ' + otherQPS);
    currentRec.lastQPS = currentRec.lastQPS;
    return currentRec.lastQPS;
  }

  getFAIL(currentRec : IConvRec) : number {
    // count records within a window of 3s
    var last3sRecords = this.getLastRecords(currentRec);
    var last3sRecordsFail = last3sRecords.filter( r => !r.rc);

    if(last3sRecords.length > 5) {
      currentRec.lastFAIL = Math.floor((100*last3sRecordsFail.length )/ last3sRecords.length);
    }
    return currentRec.lastFAIL;
  }


  genRec(rc: boolean, currentRec : IConvRec) : IRecord{

    var rec = this.monitor.getLastRecord();
    var clone : IRecord = Object.assign({}, rec);
    // calculate failed and query averages:
    clone.QPS = this.getQPS(currentRec);
    clone.FAIL = this.getFAIL(currentRec);
    clone.PAR = currentRec.settings.parallel;
    if(currentRec.results.length == 0) {
      clone.time = Date.now();
    } else {
      clone.time = currentRec.results[currentRec.results.length- 1].time;
    }
    var tx =  Date.now() + currentRec.delta_t;
    console.log( 'time is' + tx + ' ' + currentRec.delta_t);
    clone.time = tx;
    return clone;
  }

  stopParallel(conversationID : string) {
    var convRec = this.getConvRecord(conversationID);
    parallel_exec.stopOp(convRec.handle);
    convRec.settings.continuous = false;
    convRec.last_stop_t = Date.now();
    this.adjustMonitor();
  }

  changeParallel(conversationID: string, statement: string, settings: ISettings) {
    var convRec = this.getConvRecord(conversationID);
    if(!convRec || !convRec.settings.continuous) {
      return;
    }
    convRec.statement = this.getOneStatement(statement);
    if(convRec.settings.parallel != settings.parallel) {
      console.log('CHANGING PARALLEL ' + settings.parallel);
      convRec.settings.parallel = settings.parallel;
      parallel_exec.changeParallelOp(convRec.handle, settings.parallel);
    }
  }

  startParallel(conversationID: string, user: string, statement: string, settings: ISettings)  : IConvRec {
    var that = this;
    var statement = this.getOneStatement(statement);
    var currentRec = this.getDefaultConvRecord(conversationID);
    var lastOp_t = Date.now();
    var handle = parallel_exec.startOpRepeat(
      conversationID,
      statement,
      settings.parallel,
      undefined,
      {
        progress: function (op: any /*ParallelOp*/, rc: boolean) {
          console.log('progress ')
          if (!that.isActive(conversationID)) {
            return;
          }


          console.log('sending response' + conversationID);
          var currentRec = that.getConvRecord(conversationID);
          var adjustedTime = Date.now() + currentRec.delta_t;
          currentRec.results.push( { time : adjustedTime, rc: rc});
          if ( Date.now() - lastOp_t < 500) {
            return;
          }
          lastOp_t = Date.now();
          var rec = that.genRec(rc, currentRec);
          rec.PAR = res.settings.parallel;
          var response: IMessage = {
            conversationID: conversationID,
            user: user,
            sourcedest: "CHART",
            body: {
              record: rec,
              rc: rc,
            }
          };
          that.send([response]);
        },
        done: function () { }
      }
    );
    var delta = Date.now() - currentRec.last_stop_t;
    console.log(' !! last stop is ' + (( Date.now() - currentRec.last_stop_t) / 1000) + 'seconds gone');
    console.log(' !!!!total compensation ' + (Date.now() + currentRec.delta_t - delta)+ ' ');
    var res: IConvRec = {
      statement: statement,
      settings: settings,
      last_stop_t: Date.now(),
      last_switch_t : 0, // see below
      handle: handle,
      delta_t: (currentRec.delta_t  - delta),
      lastFAIL : currentRec.lastFAIL,
      lastQPS : currentRec.lastQPS,
      results: currentRec.results
    };
    res.last_switch_t = Date.now() + res.delta_t;
    return res;
  }

  tmonitor : any;

  startMonitor() {
    this.monitor.startMonitor();
    debuglog('start monitor');
  }
  stopMonitor() {
    this.monitor.stopMonitor();
  /*  if( parallel_exec.getOp("monitor")) {
      parallel_exec.stopOp("monitor");
    }
    clearInterval(this.tmonitor); */
  }

  adjustMonitor() {
    var that = this;
    // TODO
    // check all handels, if any running -> assure monitor runs,
    // otherwise stop
    var active = Array.from(this.intervals.keys()).filter(
      (key) => ( that.intervals.get(key).settings.continuous ));
      debuglog(' have ' + active.length + ' conversations');
      if(active.length == 0) {
        that.stopMonitor();
      } else {
          that.startMonitor();
      }
  }

  processMessage(msg: IMessage) {
    var that = this;
    var t = Date.now();
    console.log('got message' + JSON.stringify(msg));
    if (msg.body.sourcedest == "EXEC") {
      console.log(' run statement once ' + msg.body.statement);

      var statement = this.getOneStatement(msg.body.statement);
      parallel_exec.startOpSequential("abc",
      statement,
       { done : function(op) {
         console.log('but we are done' + JSON.stringify(op.lastRC));
          },
         progress : function(op,rc) {
          console.log('end sequential ' + op.lastRC + ' ' + op.lastResult);
          var lr = op.lastResult;
          if(op.lastRC && _.isArray(op.lastResult)) {
            lr = (new SQLExec.SQLExec({})).makeAsciiTable(op.lastResult);
          }
          var response: IMessage =
          {
            conversationID: msg.conversationID,
            user: msg.user,
            sourcedest: msg.sourcedest || "DIALOG",
            body:  lr
          };
          console.log(JSON.stringify(response, undefined, 2));
          that.send([response]);
       }});
      return;
    }
    if (msg && msg.body.sourcedest == "PAR" && msg.body && msg.body.settings) {
      if (msg.body.op == "START") {
        console.log(' Start parallel statement' + msg.body.statement);
        console.log('registering interval under ' + msg.conversationID);
        var r = this.startParallel(
          msg.conversationID,
          msg.user,
          msg.body.statement,
          msg.body.settings);
        if (that.intervals.has(msg.conversationID)) {
            var stopped = that.intervals.get(msg.conversationID);
            assert(stopped.settings.continuous == false);
            parallel_exec.stopOp(stopped.handle);
            stopped.settings = r.settings;
            stopped.handle = r.handle;
            stopped.delta_t = r.delta_t;
            stopped.last_stop_t = r.last_stop_t;
            assert(stopped.settings.continuous);
        } else {
            that.intervals.set(msg.conversationID,r);
        }

        that.adjustMonitor();
      }
      else if (msg.body.op == "STOP") {
        console.log('stop interval under ' + msg.conversationID);
        if (that.intervals.has(msg.conversationID)) {
          console.log(' found conversation, ')
          this.stopParallel(msg.conversationID);
          return; //running!
        }
      }
      else if (msg.body.op == "CHANGE") {
        if (that.intervals.has(msg.conversationID)) {
          this.changeParallel(msg.conversationID, msg.body.statement,
            msg.body.settings);
          return; //running!
        }
      }
    }
  }

  send(messages: IMessage[]) {
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      if (msg.body) {
        if (msg.conversationID && this.answerHooks[msg.conversationID]) {
          this.answerHooks[msg.conversationID](msg.conversationID, msg);
        } else {
          console.log('where is the answerhook for ' + msg.conversationID);
          this.answerHook(this.conversationID, msg);
        }
        //log(msg.text);
      }
    }
  };
}
