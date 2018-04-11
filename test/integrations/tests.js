var test1 = require('./trtest1');
var test2 = require('./trtest2');


var testList = [
  test1,
  test2
];

function testAll() {
  testList.forEach(function (test) {
    try {
      test();
      console.log(test.name + " PASSED");
    } catch(e) {
      console.log(JSON.stringify(e));
      console.log(test.name + " FAILED: " + e.name + ": " + e.message);
    }
  });
}

module.exports = testAll;
