
// Dump globals into a testable object we can
// use in modules.

if (!('telerivetContext' in global)) {
    
    global.telerivetContext = {
        project: project,
        phone: phone,
        state: state,
        content: content,
        httpClient: httpClient 
    };   
}

//
// Start API we want to expose
//

function RosterAPI(telerivet) {

    this.telerivet = telerivet;
    this.url = null;
    this.key = null;
};

RosterAPI.prototype.attach = function(url, key) {

    this.url = url;
    this.key = key;
    return this; 
};

// We can attach to a URL/Key stored in the project "External" data table
RosterAPI.prototype.dataTableAttach = function(tableName, project) {

    if (!tableName)
        tableName = "External";
    
    if (!project)
        project = this.telerivet.project;

    var tableCur = project.queryDataTables({ name: tableName });
    
    if (!tableCur.hasNext()) return false;
    var table = tableCur.next();
    
    var rowCur = table.queryRows();
    var row = null;
    while (rowCur.hasNext()) {
      var nextRow = row;
      if ('Name' in row && 'URL' in row && 'Key' in row && row.name == "Roster") {
          row = nextRow;
          break;
      }
    }
    if (!row) return false;
    
    this.url = row.URL;
    this.key = row.Key;
    return true; 
};

var parseAccountNum = function(content) {
  // #12345 other stuff, #12345@kenya
  var match = content.match(/\#([^@\s]+)/);
  if (!match) return null;
  return match[1];
};

var parseCountry = function(content) {
  // @kenya other stuff
  var match = content.match(/\@(\w+)/);
  if (!match) return null;
  return match[1];
};                  

var parsePIN = function(content) {
  // P1234 other stuff
  var match = content.match(/P([0-9]+)/);
  if (!match) return null;
  return match[1];
};                  

RosterAPI.prototype.parseAccountAndPIN = function(content) {

    var parsed = {};

    parsed.accountNumber = parseAccountNum(content);
    var country = parseCountry(content);
    if (country)
        parsed.accountNumber = parsed.accountNumber + "@" + country;

    parsed.accountPIN = parsePIN(content);
    
    return parsed;
};

//
// Exports
//

var rosterAPI = new RosterAPI(telerivetContext);

module.exports = rosterAPI;

