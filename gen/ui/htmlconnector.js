/**
 * A helper class to connect the dispatcher to the HTMLConnector
 * maps botbuilder entities to plain strings /JSON objects
 */
'use strict';

/* nonglobal process:true*/
//var BotBuilder = require('botbuilder');
//var Message = BotBuilder.Message;

var HTMLConnector = function () {
  function HTMLConnector(options) {
    this.replyCnt = 0;
    this.answerHooks = {};
    this.user = options && options.user || 'user1';
    this.bot = options && options.bot || 'fdevstart';
    //this.conversationID = options && options.conversationid || ('' + Date.now());
  }

  HTMLConnector.prototype.setAnswerHook = function (answerHook, id) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
    this.answerHook = answerHook;
  };
  HTMLConnector.prototype.setQuitHook = function (quitHook) {
    this.quitHook = quitHook;
  };
  /*
    this.processMessage(line);
    return this;
  };
  */
  HTMLConnector.prototype.processMessage = function (line, id) {
    if (typeof id === 'string') {
      id = {
        conversationID: id,
        user: id
      };
    }
    console.log('received' + line + ' ' + id);
    if (this.handler) {
      /*var msg = new Message()
        .address({
          channelId: 'console',
          user: { id: id.user, name: id.user },
          bot: { id: this.bot, name: this.bot },
          conversation: { id: id.conversationid }
        })
        .timestamp()
        .text(line);*/
      this.handler({ id: id, text: line });
    }
    return this;
  };
  HTMLConnector.prototype.onEvent = function (handler) {
    this.handler = handler;
  };

  // array of messages  wiht msg.addres.conversation id
  // {msg.text}
  // {msg.conversationID }

  HTMLConnector.prototype.send = function (messages, done) {
    for (var i = 0; i < messages.length; i++) {
      if (this.replyCnt++ > 0) {
        //  console.log(' reply ');
      }
      var msg = messages[i];
      if (msg.text) {
        if (msg.conversationID && this.answerHooks[msg.conversationID]) {
          this.answerHooks[msg.conversationID](msg.text, msg.command, msg.conversationID);
        } else {
          this.answerHook(msg.text, msg.command, this.conversationID);
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
    done(null);
  };
  HTMLConnector.prototype.startConversation = function (address, cb) {
    var adr = Object.assign({}, address); // utils.clone(address)
    adr.conversation = { id: 'Convo1' };
    cb(null, adr);
  };
  return HTMLConnector;
}();

exports.HTMLConnector = HTMLConnector;