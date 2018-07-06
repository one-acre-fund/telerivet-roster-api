//
// Helper functions required by all modules
// Since telerivet uses some weird custom javascript, we need to
// add some helpers here.
//

var trim = function(str) {
    return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};

var joinURL = function(a, b, sep) {
    if (a.charAt(a.length - 1) == '/')
        a = a.substr(0, a.length - 1);
    return a + "/" + b;
};

var nestedGet = function(key, obj) {

    if (key === '.') return obj;
    if (!_.isArray(obj) && !_.isObject(obj))
        return undefined;
    if (key in obj) return obj[key];

    var dotIndex = key.indexOf('.');
    if (dotIndex == -1) dotIndex = key.length;

    var dotKey = key.substring(0, dotIndex);
    var remKey = key.substring(dotIndex + 1);

    var dotValue = undefined;
    try {
        if (_.isArray(obj)) {
            dotKey = parseInt(dotKey);
        }
        var dotValue = obj[dotKey];
    } catch (ex) {
        return undefined;
    }

    if (remKey.length === 0) return dotValue;
    return nestedGet(remKey, dotValue);
};

// printf-style formatting: format("Hi {0}", "There") => "Hi There"
var format = function(str, args) {
    if (!args) args = [];
    if (!_.isArray(args))
        args = [args];

    return str.replace(/{(\d+)}/g, function(match, number) {
        return typeof args[number] != 'undefined' ?
            args[number] :
            match;
    });
};

var isoToOaf = {
    "KE": "Kenya",
    "UG": "Uganda",
    "ZM": "Zambia",
    "RW": "Rwanda",
    "TZ": "Tanzania",
    "BI": "Burundi",
    "ZM": "Zambia",
    "MM": "Myanmar",
    "MW": "Malawi"
};

var isoToOafCountry = function(isoCountry) {
    if (isoCountry in isoToOaf)
        return isoToOaf[isoCountry.toUpperCase()];
    // Passthrough to allow OAF names to just work too
    return isoCountry;
};

var oafToIsoCountry = function(oafCountry) {
    for (var iso in isoToOaf) {
        if (isoToOaf[iso].toUpperCase() == oafCountry.toUpperCase())
            return iso;
    }
    return oafCountry;
};

module.exports = {
    trim: trim,
    joinURL: joinURL,
    nestedGet: nestedGet,
    format: format,
    isoToOafCountry: isoToOafCountry,
    oafToIsoCountry: oafToIsoCountry
};
