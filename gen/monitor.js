"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require('assert');
const debug = require("debug");
const debuglog = debug('monitor');
var cnt = 0;
//export var MONITOR_SYSTABLE_NAME = "SYS.INTERNAL_REL_NODE_RT_AVG;";
exports.MONITOR_SYSTABLE_NAME = "SYS.INTERNAL_REL_NODE_RUNTIME_AVG;";
;
class IAvgRecord {
    constructor() {
        this.MAX_MEM_USAGE_30s = 0;
        this.MEM_USAGE = 0;
        this.AGGR_PLAN_EXEC_DURATION = 0;
        this.QUERY_PER_MIN = 0;
        this.CPU_UTILIZATION = 0;
        this.MEM_UTILIZATION = 0;
        this.MAX_MEM_EVER = 0;
        this.NR_PARALLEL_PLAN = 0;
        this.PLAN_EXEC_DURATION = 0;
    }
}
exports.IAvgRecord = IAvgRecord;
;
exports.Keys = Array.from(Object.keys(new IAvgRecord()));
function dumpNice(v, len) {
    var s = '' + v;
    while (s.length < len) {
        s = ' ' + s;
    }
    return s;
}
exports.dumpNice = dumpNice;
class Monitor {
    constructor(parexec) {
        this.lastRecord = {
            time: Date.now(),
            QPS: 0,
            PAR: 0,
            CPU: 0,
            DUR: 0,
            MEM: 0,
            MAXMEM: 0,
            FAIL: 0,
            NP: 0
        };
        this.para_exec = parexec;
    }
    stopMonitor() {
        this.para_exec.stopOp('monitor');
    }
    startMonitor() {
        var that = this;
        this.para_exec.startOpRepeat("monitor", 'SELECT * FROM ' + exports.MONITOR_SYSTABLE_NAME + ';', 4, {
            forcename: "monitor",
            continuous: true,
            t_last: 0,
            every_t: 3000,
        }, 
        /*callbacks :*/
        {
            result: function (err, res) {
                if (!err) {
                    var timing = that.updateAverages(res);
                }
            }
        });
    }
    ;
    updateAverages(res) {
        var rec = this.makeTimingRecord(res);
        var avg = this.getBestSingleAvg(rec);
        this.lastRecord = this.toRecord(avg);
        this.lastRecord.time = Date.now();
    }
    getLastRecord() {
        return this.lastRecord;
    }
    makeTimingRecord(res) {
        var result = new Map();
        exports.Keys.forEach(key => {
            res.forEach(rec => {
                if (rec.NAME == key) {
                    debuglog.enabled && debuglog(' found record ' + rec.VALUE + " " + JSON.stringify(rec));
                    if (!result.has(key)) {
                        result.set(key, new Map());
                    }
                    var mp = result.get(key);
                    mp.set(parseInt(rec.NR), parseInt(rec.VALUE));
                }
            });
        });
        return result;
    }
    getBestSingleAvg(record) {
        var values = new IAvgRecord();
        const best_avg = 3001; // 3s
        var actual_best_avg = 0;
        debuglog('got a best record!!');
        exports.Keys.forEach(key => {
            var rec = record.get(key);
            var sortedIntArr = Array.from(rec.keys()).map(k => parseInt(' ' + k)).sort();
            debuglog('sortedIntArr' + sortedIntArr);
            values[key] = sortedIntArr.reduce((prev, time) => {
                if ((time < best_avg)) {
                    actual_best_avg = time;
                    return rec.get(time);
                }
                else {
                    return prev;
                }
            }, 0);
        });
        assert(actual_best_avg == 3000);
        return values;
    }
    toRecord(values) {
        debuglog.enabled && debuglog("******* DONE ");
        var avgx = values;
        debuglog.enabled && debuglog('QPM\t|BAD%\t|PAR'
            + '\t|DUR'
            + '\t|DDP'
            + '\t|MAX_MEM'
            + '\t|CPU%'
            + '\t|MEM%'
            + '\t|MEU'
            + '\t|QPM_N'
            + '\t|PAR_P'
            + '\t|AGGR_PLAN_EXEC_DURATION');
        var result = {
            time: Date.now(),
            QPS: 0,
            FAIL: 0,
            PAR: avgx.NR_PARALLEL_PLAN,
            DUR: avgx.AGGR_PLAN_EXEC_DURATION,
            MAXMEM: avgx.MAX_MEM_EVER,
            CPU: avgx.CPU_UTILIZATION,
            MEM: avgx.MEM_UTILIZATION,
            NP: avgx.NR_PARALLEL_PLAN
        };
        this.dumpAllResults([result]);
        debuglog.enabled && debuglog(result.time +
            +'\t|' + result.QPS
            + '\t|' + result.FAIL
            + '\t|' + result.DUR, +'\t|' + result.NP
            + '\t|' + avgx.MAX_MEM_EVER
            + '   \t|' + avgx.CPU_UTILIZATION
            + '\t|' + result.MEM, +'\t|' + avgx.NR_PARALLEL_PLAN
            + '\t|' + avgx.QUERY_PER_MIN
            + '\t|' + avgx.AGGR_PLAN_EXEC_DURATION);
        return result;
    }
    //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);
    //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |4      |4      |165    |94     |173    |169    |2624
    //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
    //10      |0      |8      |4      |174    |98     |171    |1      |2761
    dumpAllResults(allresult) {
        if (allresult.length == 0) {
            return;
        }
        var s1 = Object.keys(allresult[0]).map(key => dumpNice(key, 10)).join(",");
        debuglog.enabled && debuglog(s1);
        allresult.forEach(entry => {
            var sn = Object.keys(entry).map(key => dumpNice(entry[key], 10)).join(',');
            debuglog.enabled && debuglog(sn);
        });
    }
}
exports.Monitor = Monitor;
; // class
/*
export function registerTiming( time : number, rec : ITimingMap)
{
  handles.forEach(function(op) {
    if(op.status != Status.STOPPED)
    {
      op.timings.push({ time : time, rec : rec});
      //console.log( 'timing length now' + op.timings.length);
    }
  });
}

export function getBestTime(start : number, end : number )
{
  return start + (end - start)*0.8;
}

export function getAvgLength( start : number, end : number )
{
  return (end-start) * 0.2;
}

export class IAvgRecord {
  MAX_MEM_USAGE_30s : number = 0;
  MEM_USAGE : number = 0;
  AGGR_PLAN_EXEC_DURATION : number = 0;
  QUERY_PER_MIN : number = 0;
  CPU_UTILIZATION : number = 0;
  MEM_UTILIZATION : number = 0;
  MAX_MEM_EVER : number = 0;
  NR_PARALLEL_PLAN : number = 0;
  PLAN_EXEC_DURATION : number = 0;
  constructor() {}
};

export class IAvgSet {
  time : number = 0;
  avg : number = 0;
  values : IAvgRecord = new IAvgRecord();
};

export const Keys = Array.from(Object.keys(new IAvgRecord()));
export function getBestAvg(start : number,  recs :  ITimingRec[]) : IAvgSet
{
  // find the maximum of ITimingRec[]
  //recs.forEach(entry => console.log(' time is ' + entry.time ))
  const end_time = recs.reduce( (prev,current) => (current.time > prev)? current.time: prev , 0);
  const best_time = getBestTime(start, end_time);
  debuglog( 'start' + (start - t_total) + ' end' + (end_time - t_total) + ' best' + ( best_time - t_total) );
  if( recs.length < 3)
  {
    console.log("warning, timing length low" + recs.length);
  }
  recs.forEach(rec =>
    debuglog('at ' + (rec.time - t_total)));
  const bestTimingRec = recs.reduce( (prev, current) =>  (!prev || (current.time < best_time)) ? current : prev , undefined);
  var result : IAvgSet =
  {
    time : 0,
    avg : 0,
    values : new IAvgRecord
  };
  const best_avg = getAvgLength(start, end_time);
  debuglog('best avg length ' + best_avg);
  var actual_best_avg = 0;
  if ( bestTimingRec )
  {
    debuglog('got a best record!!');
    Keys.forEach(key => {
    var rec = bestTimingRec.rec.get(key);
    var sortedIntArr = Array.from(rec.keys()).map(k => parseInt(' ' + k)).sort();
    debuglog('sortedIntArr' + sortedIntArr);
    result.values[key] = sortedIntArr.reduce((prev, time) =>
       {
         if((time < best_avg))
         {
           actual_best_avg = time;
           return rec.get(time);
         } else {
           return prev;
          }
        }
       , 0);
      });
    }
  debuglog('best avg' + actual_best_avg);
  result.avg = actual_best_avg;
  result.time = bestTimingRec && bestTimingRec.time;
  return result;
}

export function dumpNice(v : any, len : number) {
  var s = '' + v;
  while(s.length < len) {
    s = ' ' + s;
  }
  return s;
}




export function startSequence(configFileName : string, testpool: Pool, current_index = 0) {

  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  //var tcp001 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'B\' AND T1.L_QUANTITY > 10 AND T2.L_QUANTITY > 100 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  var tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 10 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';
  var parq_1m_zip = 'select max(VCHAR50RNDVL), vchar4dic6, avg(UINT64_RND) from GEN_1M_PAR_ZIP group by VCHAR4DIC6;';

  //ALTERD
  //tcp_001_4 = 'select count(*), AVG(T1.L_QUANTITY), AVG(T1.L_DISCOUNT + T2.L_DISCOUNT), AVG(T2.L_EXTENDEDPRICE), T2.L_SHIPMODE FROM LINEITEM1 AS T1 JOIN LINEITEM1 AS T2 ON T1.L_SHIPMODE = T2.L_SHIPMODE WHERE T1.L_SHIPMODE <= \'FOB\' AND T1.L_PARTKEY > 1000 AND T2.L_PARTKEY > 1000 AND T1.L_QUANTITY > 2 AND T2.L_QUANTITY > 1000 GROUP BY T2.L_SHIPMODE ORDER BY T2.L_SHIPMODE;';

  var arr = [
    { PAR : 1,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 2,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  // { PAR : 3,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 4,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  // { PAR : 6,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR : 8,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
  //  { PAR :10,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :12,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :16,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :20,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'},
    { PAR :32,  MAX_NR : 40, statement : '', TAG : 'TCP_P1'}
  ];
  arr.forEach( entry => entry['TAG'] = 'TCP_P_' + entry.PAR );
  arr.forEach( entry => entry['TAG'] = 'P1Z_P_' + entry.PAR );
  arr.forEach( entry => entry['statement'] = tcp_001_4 );
  arr.forEach( entry => entry['statement'] = parq_1m_zip );
  arr.forEach( entry => entry['MAX_NR'] = 40 );


  if (current_index == 0) {
    // create the forks!
    var max_parallel = arr.reduce(  (prev, entry) => Math.max(prev, entry.PAR), 0 );
    var nrForks = Math.ceil(max_parallel / 4);
    forks = new Forks(nrForks , configFileName);
    ;
  }
  var hndl = startOpMonitor(parexec);

  var executors : ISQLExecutor[];
  executors = SQLExec.getExecutors(testpool,4);
  executors = executors.concat(forks.getExecutors(4));
  parexec = new ParallelExec(executors);
  //var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);
  //QPM     |BAD%   |PAR    |NR_PARALLEL_PLAN       |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |4      |4      |165    |94     |173    |169    |2624
  //QPM     |BAD%   |PAR    |PAR_P  |MAX_MEM        |CPU%   |MEM%   |QUERY_PER_MIN  |AGGR_PLAN_EXEC_DURATION
  //10      |0      |8      |4      |174    |98     |171    |1      |2761

  var showOp = dumpProgress;
  var makeNext = function (op)  {
    var res = dumpDone(op);
    allresults.push(res);
    dumpAllResults(allresults);
    parexec.stopOp('monitor');
    parexec.stopOp(handle);
    parexec.triggerLoop();
    //loopIt(executor);
    ++index;
    if(index < arr.length) {
      console.log("*** INDEX");
      startSequence(configFileName, testpool, index);
    } else {
      forks.stop();
    }
  };

  handle = parexec.startOpRepeat( arr[current_index].TAG, arr[current_index].statement, arr[current_index].PAR, {continuous : true,  terminate_nr : arr[current_index].MAX_NR },
    {
      progress : showOp,
      done : makeNext
    });

  parexec.triggerLoop();
  var handle;
  setTimeout( function() {
  }, 500);

  // beware, this only stops when all queries are completed;
  /*
  setTimeout( function() {
    console.log('stopping now');
    stopOp(handle);
    loopIt(executor);
  }, 200000);
  */

//# sourceMappingURL=monitor.js.map
