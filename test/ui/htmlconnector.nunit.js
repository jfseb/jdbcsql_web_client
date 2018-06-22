/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */

var root =  '../../gen';


var tap = require('tap');

const HtmlConnector = require(root + '/ui/htmlconnector.js');

tap.test('testWithIdHook', function (test) {
  var out = new HtmlConnector.HTMLConnector({ user : "auser", bot : "bbot"});
  var hook1 = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hook1.a = a;
    hook1.b = b,
    hook1.c = c;
    hook1.cnt += 1;
  },"id1");
  var hook2 = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hook2.a = a;
    hook2.b = b;
    hook2.c = c;
    hook2.cnt += 1;
  },"id2");

  var hookNoID = { a : 0, cnt : 0};
  out.setAnswerHook(function (a,b,c) {
    hookNoID.a = a;
    hookNoID.b = b;
    hookNoID.c = c;
    hookNoID.cnt += 1;
  });


  out.setQuitHook(function(o) {
    throw new Error("never called");
  });

  var hook3 = { a : 0, cnt : 0};
  out.onEvent(function(arg) {
    hook3.a = arg;
    hook3.cnt += 1;
  });


  out.processMessage("this is the line", "convid");
  console.log("msg : " + JSON.stringify(hook3.a, undefined, 2));
  test.deepEqual(hook3.cnt, 1);
  test.deepEqual(hook3.a,
  {
    "id" : { "conversationID" : "convid", user : "convid" },
    text: "this is the line"
  });

  test.deepEqual(hook3.a.id.conversationID, "convid");

  // send to id2
  out.processMessage("this is the line2", "id2");

  test.deepEqual(hook1.cnt, 0, "hook1 was not called");
  test.deepEqual(hook2.cnt, 0, "hook2 was not called");

  test.deepEqual(hook3.a,
    {
      "id" : { "conversationID" : "id2", user : "id2" },
      text: "this is the line2"
    }
  );

  var hookDone = { a : undefined, cnt : 0};

  out.send({}, function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;
  });
  test.deepEqual(hookDone.cnt, 1, 'done called');
  test.deepEqual(hookDone.a, null);
  test.deepEqual(hook1.cnt, 0, 'hook 1 called ');
  test.deepEqual(hook2.cnt, 0, 'hook 2 called');


  // sending messages:
  // a) with id and command
  var msg = {
    text : "here text",
    command : "acommand",
    conversationID : "id2",
  }

  hook2 = { a : 0, cnt : 0};
  out.send([msg], function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;
  });
  test.deepEqual(hookDone.cnt, 2, 'done called');
  test.deepEqual(hookDone.a, null);
  test.deepEqual(hook1.cnt, 0, 'hook 1 called ');
  test.deepEqual(hook2.cnt, 1, 'hook 2 called');
  test.deepEqual(hook2.a, "here text", ' here text');
  test.deepEqual(hook2.b, "acommand", 'the command');



 // send unknown id
  msg = {
    text : "here text2",
    command : "doit",
    conversationId : "idx"
  }
  out.send([msg],function(a) {
    hookDone.a = a;
    hookDone.cnt += 1;
  });

  test.deepEqual(hook2.cnt, 1), 'hook 2 called';
  test.deepEqual(hookNoID.cnt, 1);

  test.deepEqual(hookNoID.a, "here text2");
  test.deepEqual(hookNoID.b, "doit");
  test.deepEqual(hookNoID.c);

  test.deepEqual(hookDone.cnt, 3);
  test.deepEqual(hookDone.a, null);

  test.done();
});
