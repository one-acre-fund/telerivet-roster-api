// Tests the telerivet working stuff

// Setup underscore environment to match Telerivet
global._ = require('../node_modules/underscore');

// Explicitly hook up telerivet stuff when we need it
global.telerivetContext = {};

var assert = require('assert');

// Mock telerivet object that gives custom reponses and logs
// requests
function MockRivet() {

  var requests = this.requests = [];  
  var responses = this.responses = [];

  this.httpClient = {
    request: function() {
      requests.push(arguments);
      var response = responses.shift();
      return response;
    }
  };
};

var tests = [ // BEGIN TESTS

function logNodeVersion() {
  console.log("Running with versions:");
  console.log(process.versions);
},

function testTrim() {
 
  // String trimming tests

  var utils = require('../utils');
  assert.equal("abcde", utils.trim(" abcde\n "));
  assert.equal("foo bar", utils.trim("foo bar "));
},

function testJoinURL() {

  // Test join logic for url roots and paths  

  var utils = require('../utils');
  var joinURL = utils.joinURL;

  assert.equal(joinURL("http://www.google.com/", "query"),
               "http://www.google.com/query");
  assert.equal(joinURL("foo", "bar"), "foo/bar");
},

function testNestedGet() {

  // Nested path object get tests

  var utils = require('../utils');
  var nestedGet = utils.nestedGet;

  var obj = {
    a: { b: 1 },
    c: { d: "ignore" },
   "c.d" : 2,
    e: [{ f: 3}, { f: 4 }]
  };

  assert.equal(nestedGet("a.b", obj), 1);
  assert.equal(nestedGet("c.d", obj), 2);
  assert.equal(nestedGet("e.0.f", obj), 3);
  assert.equal(nestedGet("e.1.f", obj), 4);
},

function testFormat() {

  // Basic string format tests
 
  var utils = require('../utils');
  assert.equal("Hello World", utils.format("Hello {0}", ["World"]));   
  assert.equal("Goodbye Moon 2", utils.format("Good{0} {1} {2}", ["bye", "Moon", 2]));
},

function testAccountParse() {
  
  // Tests parsing various account information from text messages
 
  var api = require('../api');

  var content =  "#12345@kenya";
  
  var parsed = api.parseAccountAndPin(content);
  assert.equal(parsed.accountNumber, "12345@kenya");
  assert(!parsed.accountPin);

  content = "@burundi#abcde P123";
  var parsed = api.parseAccountAndPin(content);
  assert.equal(parsed.accountNumber, "abcde@burundi");
  assert.equal(parsed.accountPin, "123"); 
  
  content = "P1234 #12346 @zambia and more stuff";
  var parsed = api.parseAccountAndPin(content);
  assert.equal(parsed.accountNumber, "12346@zambia");
  assert.equal(parsed.accountPin, "1234"); 
},

function testGetClient() {

  // Tests the API calls required to get client information

  var api = require('../api');
 
  api.attach("http://oaf.com", "12345");  
  api.telerivet = new MockRivet();

  // Check country encoded with accountNumber
  api.telerivet.responses.push({ content: JSON.stringify({ "foo" : "bar" }) });
  
  var client = api.getClient("7890@KE", "111");
  assert.equal(client.foo, "bar");
  assert.equal(api.telerivet.requests[0][0], "http://oaf.com/sms/get");
  assert.equal(api.telerivet.requests[0][1].data.account, "7890");
  assert.equal(api.telerivet.requests[0][1].data.country, "Kenya");
  assert.equal(api.telerivet.requests[0][1].headers.Pin, "111");
  assert.equal(api.telerivet.requests[0][1].headers.Authorization, "Basic 12345");

  // Check country encoded in phone object
  api.telerivet.requests.shift();
  api.telerivet.responses.push({ content: JSON.stringify({ "biz" : "baz" }) });

  client = api.getClient("5555", "222", { country: "UG" });
  assert.equal(client.biz, "baz");
  assert.equal(api.telerivet.requests[0][0], "http://oaf.com/sms/get");
  assert.equal(api.telerivet.requests[0][1].data.account, "5555");
  assert.equal(api.telerivet.requests[0][1].data.country, "Uganda");
  assert.equal(api.telerivet.requests[0][1].headers.Pin, "222");
  assert.equal(api.telerivet.requests[0][1].headers.Authorization, "Basic 12345");
}

]; // END TESTS

for (var i = 0; i < tests.length; ++i) {
  console.log("---\nRunning test '" + tests[i].name + "'\n---");  
  tests[i]();
}

