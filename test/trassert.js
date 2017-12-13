//
// Very basic assert library for integration tests on Telerivet
//

var ok = function(value) {
    if (!value)
        throw new Error("Assertion Failed!");
};

var equal = function(a, b) {
    if (a != b)
        throw new Error("" + a + " != " + b);
};

module.exports = {
    ok: ok,
    equal: equal
};