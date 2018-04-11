//
// Integration tests in a telerivet environment
//

var assert = require('../trassert');

var api = require('../../api');

function testDataTableAttach() {
  var apiTable = project.getOrCreateDataTable("TestApis");
  apiTable.delete();
  apiTable = project.getOrCreateDataTable("TestApis");

  apiTable.createRow({
      vars: {
          name: "Roster",
          url: "URL",
          key: "APIKEY",
      }
  }).save();

  // set api to get url/key from TestApis table
  api.dataTableAttach = api.dataTableAttach.bind(api, "TestApis");
  api.dataTableAttach();
  assert.ok(state.vars[api.persistVar]);
}

module.exports = testDataTableAttach;
