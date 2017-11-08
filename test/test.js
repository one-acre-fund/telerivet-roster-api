// Tests the telerivet working stuff

// Setup underscore environment to match Telerivet
global._ = require('./underscore-1.6.0/underscore');

// Explicitly hook up telerivet stuff when we need it
global.telerivetContext = {};

var assert = require('assert');

var tests = [ // BEGIN TESTS

function logNodeVersion() {
  console.log("Running with versions:");
  console.log(process.versions);
},

function testTrim() {

  var utils = require('../utils');
  assert.equal("abcde", utils.trim(" abcde\n "));
  assert.equal("foo bar", utils.trim("foo bar "));
},

function testNestedGet() {

  var utils = require('../utils');
  var ng = utils.nestedGet;


  var obj = {
    a: { b: 1 },
    c: { d: "ignore" },
   "c.d" : 2,
    e: [{ f: 3}, { f: 4 }]
  };

  assert.equal(ng("a.b", obj), 1);
  assert.equal(ng("c.d", obj), 2);
  assert.equal(ng("e.0.f", obj), 3);
  assert.equal(ng("e.1.f", obj), 4);
},

function testFormat() {

  var utils = require('../utils');
  assert.equal("Hello World", utils.format("Hello {0}", ["World"]));   
  assert.equal("Goodbye Moon 2", utils.format("Good{0} {1} {2}", ["bye", "Moon", 2]));
},

function testAccountParse() {
  
  var api = require('../api');

  var content =  "#12345@kenya";
  
  var parsed = api.parseAccountAndPIN(content);
  assert.equal(parsed.accountNumber, "12345@kenya");
  assert(!parsed.accountPIN);

  content = "@burundi#abcde P123";
  var parsed = api.parseAccountAndPIN(content);
  assert.equal(parsed.accountNumber, "abcde@burundi");
  assert.equal(parsed.accountPIN, "123"); 
  
  content = "P1234 #12346 @zambia and more stuff";
  var parsed = api.parseAccountAndPIN(content);
  assert.equal(parsed.accountNumber, "12346@zambia");
  assert.equal(parsed.accountPIN, "1234"); 
}

]; // END TESTS

for (var i = 0; i < tests.length; ++i) {
  console.log("---\nRunning test '" + tests[i].name + "'\n---");  
  tests[i]();
}

