//
// Integration tests in a telerivet environment
//

var assert = require('./trassert');

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

  api.dataTableAttach("TestApis");
  assert.ok(state.vars[api.persistVar]);

  assert.ok(false);
}

module.exports = testDataTableAttach;
