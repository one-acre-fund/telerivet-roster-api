//
// Integration tests in a telerivet environment
// (Second block)
//

var assert = require('./assert');

var api = require('../api');

assert.ok(state.vars[api.persistVar]);
assert.equal(api.url, "URL");
assert.equal(api.key, "APIKEY");

