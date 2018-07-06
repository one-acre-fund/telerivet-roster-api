//
// Integration tests in a telerivet environment
// (Second block)
//

var assert = require('../trassert');

var api = require('../../api');

function testApiTable() {
  assert.ok(api.telerivet.state.vars[api.persistVar]);
  assert.equal(api.url, "URL");
  assert.equal(api.key, "APIKEY");
}

module.exports = testApiTable;
