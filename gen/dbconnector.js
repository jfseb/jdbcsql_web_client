/**
 * A Connector exposes the interface toward the webserver
 * to manage multiple conversations
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const debug = require("debug");
const debuglog = debug('dbconnector');
const assert = require("assert");
const path = require('path');
const _ = require("lodash");
var jinst = require('jdbc/lib/jinst');
const monitor_1 = require("./monitor");
if (!jinst.isJvmCreated()) {
    console.log('adding stuff in main!now');
    jinst.addOption('-Xrs');
    var root = `${__dirname}/..`; // eslint-disable-line
    //root = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
    console.log('here driver dir: ' + root + '/drivers/hsqldb.jar');
    jinst.setupClasspath([
        root + '/drivers/hsqldb.jar',
        root + '/drivers/derby.jar',
        root + '/drivers/derbyclient.jar',
        root + '/drivers/derbytools.jar'
    ]);
}
var config_path = path.dirname(require.resolve('jdbcsql_throughput/package.json'));
console.log('path to jdbc ' + config_path);
var config = require(config_path + '/gen/configs/config_derby.js').config;
const jdbcsql_throughput_1 = require("jdbcsql_throughput");
console.log('config' + JSON.stringify(config));
var Pool = require('jdbc');
console.log('config' + JSON.stringify(config));
console.log('config' + JSON.stringify(config));
var testpool = undefined;
var executor = undefined;
var parpool = undefined; //= new  ParallelPool(4, testpool, config, undefined );
var parallel_exec = undefined;
function Setup(nrexec, explicitconfig) {
    var cfg = explicitconfig || config;
    testpool = new Pool(cfg);
    executor = new jdbcsql_throughput_1.SQLExec.SQLExec({});
    parpool = new jdbcsql_throughput_1.ParallelPool.ParallelPool(nrexec, testpool, config);
    parallel_exec = new jdbcsql_throughput_1.ParallelExecutor.ParallelExec(parpool.getExecutors());
}
exports.Setup = Setup;
function runStatements(statements, cb) {
    var arr = statements.split(';');
    arr = arr.map(s => s.trim());
    arr = arr.filter(s => s.length);
    arr = arr.map(s => s + ";");
    var cnt = 0;
    var fullResult = "";
    arr.forEach(statement => {
        parallel_exec.startOpSequential("seqstatement", statement, {
            progress: function (op, rc) {
                console.log('end sequential ' + op.lastRC + ' ' + op.lastResult);
                var lr = op.lastResult;
                if (op.lastRC && _.isArray(op.lastResult)) {
                    lr = (new jdbcsql_throughput_1.SQLExec.SQLExec({})).makeAsciiTable(op.lastResult);
                }
                else {
                    lr = "" + op.lastResult;
                }
                fullResult += lr;
                fullResult += "\n";
                ++cnt;
                if (cnt == arr.length) {
                    cb(fullResult);
                }
            }
        });
    });
}
exports.runStatements = runStatements;
;
var MAXMEM = 10;
var CPU = 80;
var MEM = 1;
var FAIL = 0;
var QPS = 0;
var DUR = 0;
var PAR = 0;
;
;
class Connector {
    constructor(options) {
        this.answerHook = {};
        this.answerHooks = {};
        this.conversationID = "";
        this.quitHook = undefined;
        this.intervals = new Map();
        this.qps_avg = 10000; // time to calculate QPS averages
        assert(parallel_exec, "Must invoke Setup before!");
        /*  if(!parallel_exec) {
            console.log('running default setup, you may want to invoke Setup');
            Setup(4);
          }*/
        this.qps_avg = (options && options.qps_avg) || 10000;
        this.answerHooks = {};
        this.monitor = new monitor_1.Monitor(parallel_exec);
        this.conversationID = options && options.conversationID || ('' + Date.now());
    }
    ;
    setAnswerHook(answerHook, id) {
        console.log('register answerhook for ' + id);
        if (id) {
            this.answerHooks[id] = answerHook;
        }
        this.answerHook = answerHook;
    }
    ;
    /**
     * Expose the parallel executor
     */
    getParallelExecutor() {
        return parallel_exec;
    }
    ;
    isActive(conversationID) {
        return this.intervals.has(conversationID);
    }
    disconnect(conversationID) {
        var that = this;
        if (that.intervals.has(conversationID)) {
            var u = that.intervals.get(conversationID);
            if (u) {
                parallel_exec.stopOp(u.handle);
            }
            that.intervals.delete(conversationID);
            this.adjustMonitor();
            return; //running!
        }
    }
    getOneStatement(statement) {
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
    }
    ;
    getConvRecord(conversationID) {
        assert(this.intervals.has(conversationID));
        return this.intervals.get(conversationID);
    }
    ;
    getDefaultConvRecord(conversationID) {
        var that = this;
        if (that.intervals.has(conversationID)) {
            return that.intervals.get(conversationID);
        }
        var res = {
            last_stop_t: Date.now(),
            delta_t: -Date.now(),
            last_switch_t: Date.now(),
            statement: undefined,
            handle: undefined,
            results: [],
            lastFAIL: 0,
            lastQPS: 0
        };
        return res;
    }
    getLastRecords(currentRec) {
        var that = this;
        if (currentRec.results.length > 100) {
            currentRec.results = currentRec.results.slice(currentRec.results.length - 100);
        }
        var last_time = currentRec.results.length ? currentRec.results[currentRec.results.length - 1].time : Date.now();
        var last3sRecords = currentRec.results.filter(r => r.time > (last_time - that.qps_avg));
        if (last3sRecords.length < 10) {
            last3sRecords = currentRec.results.filter((r, index) => (index + 10 > currentRec.results.length));
        }
        console.log('got ' + last3sRecords.length + ' records within last ' + this.qps_avg + ' sec');
        return last3sRecords;
    }
    getQPS(currentRec) {
        var last_time = currentRec.results.length ? currentRec.results[currentRec.results.length - 1].time : Date.now();
        var last3sRecords = this.getLastRecords(currentRec);
        console.log('got ' + last3sRecords.length + ' records within last ' + this.qps_avg + ' sec');
        const MIN = 1000 * 60;
        if (last3sRecords.length > 5) {
            var delta_t = (last3sRecords[last3sRecords.length - 1].time - last3sRecords[0].time);
            currentRec.lastQPS = (delta_t > 0) ? (last3sRecords.length * MIN / delta_t) : currentRec.lastQPS;
        }
        var lastSinceSwitchRecords = currentRec.results.filter(r => r.time > currentRec.last_switch_t);
        var otherQPS = currentRec.lastQPS;
        if (lastSinceSwitchRecords.length > 4) {
            otherQPS = lastSinceSwitchRecords.length * MIN /
                (lastSinceSwitchRecords[lastSinceSwitchRecords.length - 1].time - lastSinceSwitchRecords[0].time);
        }
        console.log('*** here qps avg' + currentRec.lastQPS + ' here total ' + otherQPS);
        currentRec.lastQPS = currentRec.lastQPS;
        return currentRec.lastQPS;
    }
    getFAIL(currentRec) {
        // count records within a window of 3s
        var last3sRecords = this.getLastRecords(currentRec);
        var last3sRecordsFail = last3sRecords.filter(r => !r.rc);
        if (last3sRecords.length > 5) {
            currentRec.lastFAIL = Math.floor((100 * last3sRecordsFail.length) / last3sRecords.length);
        }
        return currentRec.lastFAIL;
    }
    genRec(rc, currentRec) {
        var rec = this.monitor.getLastRecord();
        var clone = Object.assign({}, rec);
        // calculate failed and query averages:
        clone.QPS = this.getQPS(currentRec);
        clone.FAIL = this.getFAIL(currentRec);
        clone.PAR = currentRec.settings.parallel;
        if (currentRec.results.length == 0) {
            clone.time = Date.now();
        }
        else {
            clone.time = currentRec.results[currentRec.results.length - 1].time;
        }
        var tx = Date.now() + currentRec.delta_t;
        console.log('time is' + tx + ' ' + currentRec.delta_t);
        clone.time = tx;
        return clone;
    }
    stopParallel(conversationID) {
        var convRec = this.getConvRecord(conversationID);
        parallel_exec.stopOp(convRec.handle);
        convRec.settings.continuous = false;
        convRec.last_stop_t = Date.now();
        this.adjustMonitor();
    }
    changeParallel(conversationID, statement, settings) {
        var convRec = this.getConvRecord(conversationID);
        if (!convRec || !convRec.settings.continuous) {
            return;
        }
        convRec.statement = this.getOneStatement(statement);
        if (convRec.settings.parallel != settings.parallel) {
            console.log('CHANGING PARALLEL ' + settings.parallel);
            convRec.settings.parallel = settings.parallel;
            parallel_exec.changeParallelOp(convRec.handle, settings.parallel);
        }
    }
    startParallel(conversationID, user, statement, settings) {
        var that = this;
        var statement = this.getOneStatement(statement);
        var currentRec = this.getDefaultConvRecord(conversationID);
        var lastOp_t = Date.now();
        var handle = parallel_exec.startOpRepeat(conversationID, statement, settings.parallel, undefined, {
            progress: function (op /*ParallelOp*/, rc) {
                console.log('progress ');
                if (!that.isActive(conversationID)) {
                    return;
                }
                console.log('sending response' + conversationID);
                var currentRec = that.getConvRecord(conversationID);
                var adjustedTime = Date.now() + currentRec.delta_t;
                currentRec.results.push({ time: adjustedTime, rc: rc });
                if (Date.now() - lastOp_t < 500) {
                    return;
                }
                lastOp_t = Date.now();
                var rec = that.genRec(rc, currentRec);
                rec.PAR = res.settings.parallel;
                var response = {
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
        });
        var delta = Date.now() - currentRec.last_stop_t;
        console.log(' !! last stop is ' + ((Date.now() - currentRec.last_stop_t) / 1000) + 'seconds gone');
        console.log(' !!!!total compensation ' + (Date.now() + currentRec.delta_t - delta) + ' ');
        var res = {
            statement: statement,
            settings: settings,
            last_stop_t: Date.now(),
            last_switch_t: 0,
            handle: handle,
            delta_t: (currentRec.delta_t - delta),
            lastFAIL: currentRec.lastFAIL,
            lastQPS: currentRec.lastQPS,
            results: currentRec.results
        };
        res.last_switch_t = Date.now() + res.delta_t;
        return res;
    }
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
        var active = Array.from(this.intervals.keys()).filter((key) => (that.intervals.get(key).settings.continuous));
        debuglog(' have ' + active.length + ' conversations');
        if (active.length == 0) {
            that.stopMonitor();
        }
        else {
            that.startMonitor();
        }
    }
    processMessage(msg) {
        var that = this;
        var t = Date.now();
        console.log('got message' + JSON.stringify(msg));
        if (msg.body.sourcedest == "EXEC") {
            console.log(' run statement once ' + msg.body.statement);
            var statement = this.getOneStatement(msg.body.statement);
            parallel_exec.startOpSequential("abc", statement, { done: function (op) {
                    console.log('but we are done' + JSON.stringify(op.lastRC));
                },
                progress: function (op, rc) {
                    console.log('end sequential ' + op.lastRC + ' ' + op.lastResult);
                    var lr = op.lastResult;
                    if (op.lastRC && _.isArray(op.lastResult)) {
                        lr = (new jdbcsql_throughput_1.SQLExec.SQLExec({})).makeAsciiTable(op.lastResult);
                    }
                    var response = {
                        conversationID: msg.conversationID,
                        user: msg.user,
                        sourcedest: msg.sourcedest || "DIALOG",
                        body: lr
                    };
                    console.log(JSON.stringify(response, undefined, 2));
                    that.send([response]);
                } });
            return;
        }
        if (msg && msg.body.sourcedest == "PAR" && msg.body && msg.body.settings) {
            if (msg.body.op == "START") {
                console.log(' Start parallel statement' + msg.body.statement);
                console.log('registering interval under ' + msg.conversationID);
                var r = this.startParallel(msg.conversationID, msg.user, msg.body.statement, msg.body.settings);
                if (that.intervals.has(msg.conversationID)) {
                    var stopped = that.intervals.get(msg.conversationID);
                    assert(stopped.settings.continuous == false);
                    parallel_exec.stopOp(stopped.handle);
                    stopped.settings = r.settings;
                    stopped.handle = r.handle;
                    stopped.delta_t = r.delta_t;
                    stopped.last_stop_t = r.last_stop_t;
                    assert(stopped.settings.continuous);
                }
                else {
                    that.intervals.set(msg.conversationID, r);
                }
                that.adjustMonitor();
            }
            else if (msg.body.op == "STOP") {
                console.log('stop interval under ' + msg.conversationID);
                if (that.intervals.has(msg.conversationID)) {
                    console.log(' found conversation, ');
                    this.stopParallel(msg.conversationID);
                    return; //running!
                }
            }
            else if (msg.body.op == "CHANGE") {
                if (that.intervals.has(msg.conversationID)) {
                    this.changeParallel(msg.conversationID, msg.body.statement, msg.body.settings);
                    return; //running!
                }
            }
        }
    }
    send(messages) {
        for (var i = 0; i < messages.length; i++) {
            var msg = messages[i];
            if (msg.body) {
                if (msg.conversationID && this.answerHooks[msg.conversationID]) {
                    this.answerHooks[msg.conversationID](msg.conversationID, msg);
                }
                else {
                    console.log('where is the answerhook for ' + msg.conversationID);
                    this.answerHook(this.conversationID, msg);
                }
                //log(msg.text);
            }
        }
    }
    ;
}
exports.Connector = Connector;

//# sourceMappingURL=dbconnector.js.map
