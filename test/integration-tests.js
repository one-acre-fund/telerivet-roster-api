// Collect all integration tests here.
//
// To run, insert the following code into a telerivet service
//   ```
//   var test = require('ext/roster/test/integrations/tests');
//   test();
//   ```
var testList = [
  'trtest1',
  'trtest2',
  'trtest3'
];

function testAll() {
  testList.forEach(function (fileName) {
    try {
      var test = require("./integration-tests/" + fileName);
      test();
      console.log(test.name + " PASSED");
    } catch(e) {
      console.log(test.name + " FAILED: " + e.name + ": " + e.message);
    }
  });
}

module.exports = testAll;
