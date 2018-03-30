// Tests the telerivet working stuff

// Setup underscore environment to match Telerivet
global._ = require('../node_modules/underscore');

// Explicitly hook up telerivet stuff when we need it
global.telerivetContext = {};

var assert = require('assert');

function Cursor(arr) {

    this.i = 0;
    this.arr = arr;

}

Cursor.prototype.hasNext = function() {
    return this.i < this.arr.length;
};

Cursor.prototype.next = function() {
    var value = this.arr[this.i];
    this.i++;
    return value;
};

function MockProject() {

    this.tables = {};
};

MockProject.prototype.queryDataTables = function(opts) {

    if (!('name' in opts)) return null;

    return new Cursor([this.tables[opts.name]]);
};

function MockTable(rows) {
    this.rows = rows;
    if (!rows) this.rows = [];
};

MockTable.prototype.queryRows = function(opts) {
    return new Cursor(this.rows);
};

// Mock telerivet object that gives custom reponses and logs
// requests
function MockRivet() {

    var responses = this.responses = [];

    this.httpClient = {
        request: function() {
            var response = responses.shift();
            return response;
        }
    };

    this.project = new MockProject();
    this.state = {
        vars: {}
    };
    this.phone = {};
}

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
            a: {
                b: 1
            },
            c: {
                d: "ignore"
            },
            "c.d": 2,
            e: [{
                f: 3
            }, {
                f: 4
            }]
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

        var content = "#12345@kenya";

        var parsed = api.parseAccountAndPin(content);
        assert.equal(parsed.accountNumber, "12345");
        assert.equal(parsed.country, "kenya");
        assert(!parsed.accountPin);

        content = "@burundi#abcde P123";
        parsed = api.parseAccountAndPin(content);
        assert.equal(parsed.accountNumber, "abcde");
        assert.equal(parsed.country, "burundi");
        assert.equal(parsed.accountPin, "123");

        content = "P1234 #12346 @zambia and more stuff";
        parsed = api.parseAccountAndPin(content);
        assert.equal(parsed.accountNumber, "12346");
        assert.equal(parsed.country, "zambia");
        assert.equal(parsed.accountPin, "1234");
    },

    function testPhoneContext() {

        // Tests parsing various account information from text messages

        var api = require('../api');

        var context = api.toPhoneContext("kenya");
        assert.equal(context.isoCountry, "KE");
        assert.equal(context.oafCountry, "Kenya");

        context = api.toPhoneContext({
            country: "mw"
        });
        assert(context.phone.country, "mw");
        assert(context.isoCountry, "MW");
        assert(context.oafCountry, "Malawi");
    },

    function testAttachTable() {

        // Tests the API calls required to get client information

        var api = require('../api');

        api.telerivet = new MockRivet();
        var table = new MockTable([{
            vars: {
                name: "Roster",
                url: "www.roster.com",
                key: "foo"
            }
        }]);
        api.telerivet.project.tables["ExternalApis"] = table;

        api.dataTableAttach();
        assert.equal(api.url, "www.roster.com");
        assert.equal(api.key, "foo");
    },

    function testSaveRestore() {

        // Saving the API state between calls

        var api = require('../api');

        api.telerivet = new MockRivet();
        api.attach("URL", "APIKEY");

        var serialized = api.saveState();

        api.attach("URL2", "APIKEY2");

        assert.equal(api.url, "URL2");
        assert.equal(api.key, "APIKEY2");

        api.restoreState(serialized);

        assert.equal(api.url, "URL");
        assert.equal(api.key, "APIKEY");
    },

    function testAuthClient() {

        // Tests the API calls required to get client information

        var api = require('../api');

        api.attach("http://oaf.com", "APIKEY");
        api.telerivet = new MockRivet();

        api.telerivet.responses.push({
            status: 200,
            content: JSON.stringify({
                "Result": "ClientExists"
            })
        });
        var authd = api.authClient("CLIENTID", {
            country: "ke"
        }, "PIN");

        assert(authd);

        var request = api.requestLog[0];
        assert.equal(request[0], "http://oaf.com/sms/Validate");
        assert.equal(request[1].params.account, "CLIENTID");
        assert.equal(request[1].params.country, "Kenya");
        assert.equal(request[1].headers.Pin, "PIN");
        assert.equal(request[1].headers['X-OAF-Account'], "CLIENTID");
        assert.equal(request[1].headers.Authorization, "ApiKey APIKEY");
        assert.equal(api.credentials.accountCountry, "Kenya");
        assert.equal(api.credentials.accountNumber, "CLIENTID");
        assert.equal(api.credentials.accountPin, "PIN");
    },

    function testGetClient() {

        // Tests the API calls required to get client information

        var api = require('../api');

        api.attach("http://oaf.com", "APIKEY");
        api.telerivet = new MockRivet();
        api.telerivet.phone = {
            country: "KE"
        };

        // Auth with client pin
        api.telerivet.responses.push({
            status: 200,
            content: JSON.stringify({
                "Result": "ClientExists"
            })
        });
        assert(api.authClient("7890", null, "PIN"));

        // Check country encoded with accountNumber
        api.telerivet.responses.push({
            status: 200,
            content: JSON.stringify({
                "foo": "bar"
            })
        });
        api.requestLog = [];

        var client = api.getClient("7890");
        assert.equal(client.foo, "bar");

        var request = api.requestLog[0];
        assert.equal(request[0], "http://oaf.com/sms/Client");
        assert.equal(request[1].params.account, "7890");
        assert.equal(request[1].params.country, "Kenya");
        assert.equal(request[1].headers.Pin, "PIN");
        assert.equal(request[1].headers['X-OAF-Pin'], "PIN");
        assert.equal(request[1].headers['X-OAF-Account'], "7890");
        assert.equal(request[1].headers['X-OAF-Country'], "Kenya");
        assert.equal(request[1].headers.Authorization, "ApiKey APIKEY");
    },

    function testGetClientError() {

        // Tests errors thrown by API calls

        var api = require('../api');

        api.attach("http://oaf.com", "12345");
        api.telerivet = new MockRivet();

        // Check country encoded with accountNumber
        api.telerivet.responses.push({
            content: {
                message: "Server Error"
            },
            status: 500
        });

        try {
            var client = api.getClient("7890", "111");
            assert(false);
        } catch (err) {
            assert.equal(err.message, "Server Error");
            assert.equal(err.response.status, 500);
        }

        // Test telerivet wrapping
        api.telerivet.responses.push({
            content: JSON.stringify({
                message: "Server Error"
            }),
            status: 500
        });

        catchAll(function() {
            var client = api.getClient("7890", "111");
        });

        assert.equal($error, "HttpError");
        assert.equal($error_message, "Server Error");
        assert.equal($error_url, "http://oaf.com/sms/Client");
        assert.equal(JSON.parse($error_opts).params.account, "7890");
    },

    function testTrAssert() {

        var trassert = require('./trassert');

        trassert.ok(true);

        var err = null;
        try {
            trassert.ok(false);
        } catch (trErr) {
            err = trErr;
        }
        assert(err !== null);

        trassert.equal("a", "a");
        try {
            trassert.equal("a", "b");
        } catch (trErr) {
            err = trErr;
        }
        assert(err !== null);
    },

]; // END TESTS

for (var i = 0; i < tests.length; ++i) {
    console.log("---\nRunning test '" + tests[i].name + "'\n---");
    tests[i]();
}
