
var assert = require('../trassert');
var api = require('../../api');

function firstRequestFetchesApiKey() {
    // reset api
    api.requestLog = [];
    api.url = null;
    api.key = null;

    try {
      var result = api.authClient(11111, "KE");
    } catch (e) {
      // because the URL used might be a fake URL
    }

    var requestOptions = api.requestLog[0][1];
    assert.ok(api.key);
    assert.equal(requestOptions.headers.Authorization, "ApiKey " + api.key);
}

module.exports = firstRequestFetchesApiKey;
