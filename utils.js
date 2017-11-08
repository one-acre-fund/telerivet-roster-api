
//
// Helper functions required by all modules
// Since telerivet uses some weird custom javascript, we need to
// add some helpers here.
//

var trim = function(str) {
  return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
};

var nestedGet = function(key, obj) {

  if (key === '.') return obj;
  if (!_.isArray(obj) && !_.isObject(obj))
    return undefined;
  if (key in obj) return obj[key]

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
  }
  catch(ex) {
    return undefined;
  }

  if (remKey.length == 0) return dotValue;
  return nestedGet(remKey, dotValue);
} 

// printf-style formatting: format("Hi {0}", "There") => "Hi There"
var format = function(str, args) {
  if (!args) args = [];
  return str.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number] 
      : match;
  });
}

module.exports = {
  trim: trim,
  nestedGet: nestedGet,
  format: format
};

