/**
 * A Connector exposes the interface toward the webserver
 * to manage multiple conversations
 */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
;
var MAXMEM = 10;
var CPU = 200;
var MEM = 1;
var FAIL = 0;
var QPS = 0;
var DUR = 0;
var time = 100;
function genRec() {
    time += 2;
    MAXMEM += 10;
    QPS = (MAXMEM % 100 - 50) * Math.sin(time / 1000);
    MEM = 100 * Math.abs(Math.sin(time / 30));
    CPU = 100 * Math.abs(Math.cos(time / 29));
    DUR = 100 * Math.abs(Math.cos(time / 15));
    FAIL = 25 * Math.abs(Math.cos(time / 25));
    var rec = {
        time: time,
        QPS: QPS,
        FAIL: FAIL,
        MEM: MEM,
        CPU: CPU,
        DUR: DUR,
        NP: 0,
        PAR: 0,
        MAXMEM: MAXMEM
    };
    return rec;
}
;
/* nonglobal process:true*/
//var BotBuilder = require('botbuilder');
//var Message = BotBuilder.Message;
class Connector {
    constructor(options) {
        this.answerHook = {};
        this.answerHooks = {};
        this.conversationID = "";
        this.quitHook = undefined;
        /*
          this.processMessage(line);
          return this;
        };
      
        id is a tuple  { conversationId, user }
        */
        this.processMessageX = function (line, id) {
            if (typeof id === 'string') {
                id = {
                    conversationID: id,
                    user: id,
                };
            }
            console.log('received' + line + ' ' + id);
            if (this.handler) {
                this.handler({ id: id, text: line });
            }
            return this;
        };
        this.intervals = {};
        this.onEvent = function (handler) {
            this.handler = handler;
        };
        //this.replyCnt = 0;
        this.answerHooks = {};
        //this.user = options && options.user || 'user1';
        //this.bot = options && options.bot || 'fdevstart';
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
    setQuitHook(quitHook) {
        this.quitHook = quitHook;
    }
    ;
    disconnect(conversationID) {
        var that = this;
        if (that.intervals[conversationID]) {
            clearInterval(that.intervals[conversationID]);
            delete that.intervals[conversationID];
            return; //running!
        }
    }
    startParallel(conversationID, user, statement, settings) {
        var that = this;
        return setInterval(() => {
            var rec = genRec();
            rec.NP = settings.parallel;
            rec.PAR = rec.NP / 2;
            var response2 = {
                conversationID: conversationID,
                user: user,
                sourcedest: "CHART",
                body: { record: rec,
                    rc: true }
            };
            that.send([response2]);
        }, 4000 / settings.parallel);
    }
    processMessage(msg) {
        var that = this;
        var t = Date.now();
        console.log('got message' + JSON.stringify(msg));
        if (msg.body.sourcedest == "EXEC") {
            console.log(' run statement once' + msg.body.statement);
            var response = { conversationID: msg.conversationID,
                user: msg.user,
                sourcedest: msg.sourcedest || "DIALOG",
                body: 'here some answer'
            };
            console.log(JSON.stringify(response, undefined, 2));
            that.send([response]);
            return;
        }
        if (msg && msg.body.sourcedest == "PAR" && msg.body && msg.body.settings) {
            if (msg.body.op == "START") {
                console.log(' Start parallel statement' + msg.body.statement);
                if (that.intervals[msg.conversationID]) {
                    return; //running!
                }
                console.log('registering interval under ' + msg.conversationID);
                that.intervals[msg.conversationID] = this.startParallel(msg.conversationID, msg.user, msg.body.statement, msg.body.settings);
                /*setInterval( () => {
                  var rec = genRec();
                  rec.NP = msg.body.settings.parallel;
                  rec.PAR = rec.NP /2;
                  var response2 : IMessage =
                  {
                    conversationID : msg.conversationID ,
                    user : msg.user,
                    sourcedest : "CHART",
                    body : rec
                  };
                  that.send([response2]);
                }, 4000 / msg.body.settings.parallel); */
            }
            else if (msg.body.op == "STOP") {
                console.log('stop interval under ' + msg.conversationID);
                if (that.intervals[msg.conversationID]) {
                    clearInterval(that.intervals[msg.conversationID]);
                    delete that.intervals[msg.conversationID];
                    return; //running!
                }
            }
            else if (msg.body.op == "CHANGE") {
                if (that.intervals[msg.conversationID]) {
                    clearInterval(that.intervals[msg.conversationID]);
                    delete that.intervals[msg.conversationID];
                    that.intervals[msg.conversationID] = this.startParallel(msg.conversationID, msg.user, msg.body.statement, msg.body.settings);
                    return; //running!
                }
            }
        }
    }
    // array of messages  wiht msg.addres.conversation id
    // {msg.text}
    // {msg.conversationID }
    send(messages, done) {
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
            /*
            if (msg.attachments && msg.attachments.length > 0) {
              for (var k = 0; i < msg.attachments.length; i++) {
                if (k > 0) {
                  //console.log();
                }
                //renderAttachment(msg.attachments[k]);
              }
            }*/
        }
        if (done) {
            done(null);
        }
    }
    ;
}
exports.Connector = Connector;

//# sourceMappingURL=connector.js.map
