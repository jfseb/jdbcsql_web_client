/**
 * @file inputFilter
 * @copyright (c) 2016-2016 Gerd Forstmann
 */


/* eslint-disable */
//var process = require('process');
var root =  '../../gen';


var tap = require('tap');
var chai = require('chai');
var chai_http = require('chai-http');
chai.use(chai_http);

console.log('args' + process.argv.join(','));
process.argv[2] = '--simul'
process.argv[3] = '--INTERNAL'
console.log('args now' + Array.from(process.argv).join(','));

const server = require('../server.js');

tap.test('testHome', function (test) {
  test.plan(3);
  chai.request(server.app)
  .get('/home')
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,200);
    test.equal(JSON.stringify(res).indexOf("btnPAR") > 0, true, 'btnPAR present');
    server.server.close();
    test.done();
  });
});

var query = '/query?query=SELECT%20*%20FROM%20T1%3B';

tap.test('testGetQuery', function (test) {
  test.plan(3);
  setTimeout( function() {

  chai.request(server.app)
  .get(query)
  .end(function(err, res) {
    console.log('here err' + err);
    test.equal(err, null);
    console.log(res.status);
    test.equal(res.status,500);
    console.log(JSON.stringify(res));
    test.equal(JSON.stringify(res).indexOf("startOpSequential") > 0, true, 'btnPAR present');
    server.server.close();
    test.done();
  });
}, 18);
});
