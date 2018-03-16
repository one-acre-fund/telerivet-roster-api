var utils = require('./utils');
var version = require('./version');

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
    this.credentials = null;

    this.requestLog = [];
    this.verbose = false;

    this.persistVar = '__RosterAPI__';
    this.restoreState();
};

RosterAPI.prototype.getVersion = function() {
    return version;
};

RosterAPI.prototype.restoreState = function(serialized) {

    if (!serialized) {
        if (!this.telerivet.state) return;
        if (!this.telerivet.state.vars[this.persistVar]) return;
        serialized = this.telerivet.state.vars[this.persistVar];
    }

    var state = JSON.parse(serialized);
    for (var k in state) {
        this[k] = state[k];
    }
};

RosterAPI.prototype.saveState = function() {

    if (!this.telerivet.state) return;

    var state = {
        url: null,
        key: null,
        credentials: null,
    };
    for (var k in state) {
        state[k] = this[k];
    }
    var serialized = JSON.stringify(state);
    this.telerivet.state.vars[this.persistVar] = serialized;
    return serialized;
};

RosterAPI.prototype.attach = function(url, key) {

    this.url = url;
    this.key = key;
    this.saveState();
    return this;
};

// We can attach to a URL/Key stored in the project "ExternalApis" data table
RosterAPI.prototype.dataTableAttach = function(tableName, project) {

    if (!tableName)
        tableName = "ExternalApis";

    if (!project)
        project = this.telerivet.project;

    var tableCur = project.queryDataTables({
        name: tableName
    });
    if (!tableCur.hasNext()) return false;
    var table = tableCur.next();

    var rowCur = table.queryRows();
    var row = null;
    while (rowCur.hasNext()) {
        var nextRowVars = rowCur.next().vars;
        if ('name' in nextRowVars && 'url' in nextRowVars && 'key' in nextRowVars && nextRowVars.name == "Roster") {
            row = nextRowVars;
            break;
        }
    }
    if (!row) return false;

    this.url = row.url;
    this.key = row.key;
    this.saveState();
    return true;
};

function HttpError(url, opts, response) {

    this.name = "HttpError";

    if (response.content &&
        (response.content.Message || response.content.message)) {
        this.message = response.content.Message || response.content.message;
    } else {
        this.message = JSON.stringify(response);
    }

    this.url = url;
    this.status = response.status;
    this.opts = opts;
    this.response = response;
};

HttpError.prototype = new Error();
HttpError.prototype.constructor = HttpError;
HttpError.prototype.toTelerivet = function() {
    return {
        $error_url: this.url,
        $error_status: this.status,
        $error_opts: JSON.stringify(this.opts),
        $error_response: JSON.stringify(this.response)
    };
};

RosterAPI.HttpError = HttpError;

RosterAPI.prototype.request = function(path, opts) {

    if (!this.url)
        this.dataTableAttach();

    if (!('headers' in opts)) opts.headers = {};

    var credentials = this.credentials;
    if ('credentials' in opts) credentials = opts.credentials;

    if (credentials) {
        opts.headers['Authorization'] = "ApiKey " + credentials.key;
        opts.headers['X-OAF-Account'] = credentials.accountNumber;
        opts.headers['X-OAF-Country'] = credentials.accountCountry;
        var accountPin = credentials.accountPin ? credentials.accountPin : "";
        opts.headers['Pin'] = accountPin;
        opts.headers['X-OAF-Pin'] = accountPin;
    }

    if (!('Accept' in opts.headers))
        opts.headers['Accept'] = 'application/json';

    var fullURL = utils.joinURL(this.url, path);

    this.requestLog.push([fullURL, opts]);
    this.saveState();

    if (this.verbose) {
        console.log("Requesting:\n  " + fullURL + "\n options:\n  " + JSON.stringify(opts));
    }

    var response = this.telerivet.httpClient.request(fullURL, opts);

    // JSONify content if required
    if (response.content) {
        var contentType = response['Content-Type'];
        if (contentType && contentType.indexOf('application/json') == 0) {
            response.content = JSON.parse(response.content);
        } else if (!contentType && opts.headers['Accept'].indexOf('application/json') == 0) {
            try {
                response.content = JSON.parse(response.content);
            } catch (err) {
                // fail to parse
            }
        }
    }

    if (this.verbose) {
        console.log("Response:\n  " + JSON.stringify(response));
    }

    // 200s - ok
    // 300s - redirects
    // 400s/500s - errors
    if (response.status >= 300)
        throw new HttpError(fullURL, opts, response);

    return response.content;
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

var parsePin = function(content) {
    // P1234 other stuff
    var match = content.match(/P([0-9]+)/);
    if (!match) return null;
    return match[1];
};

RosterAPI.prototype.parseAccountAndPin = function(content) {

    var parsed = {};

    parsed.accountNumber = parseAccountNum(content);
    parsed.accountPin = parsePin(content);
    parsed.country = parseCountry(content);

    return parsed;
};

RosterAPI.prototype.toPhoneContext = function(countryOrPhone) {

    if (countryOrPhone == null)
        countryOrPhone = this.telerivet.phone;

    var phoneContext = {};

    if (_.isString(countryOrPhone)) {
        phoneContext.isoCountry = countryOrPhone.toUpperCase();
        phoneContext.phone = null;
    } else {
        phoneContext.phone = countryOrPhone;
        phoneContext.isoCountry = phoneContext.phone.country.toUpperCase();
    }

    phoneContext.isoCountry =
        utils.oafToIsoCountry(phoneContext.isoCountry);
    phoneContext.oafCountry =
        utils.isoToOafCountry(phoneContext.isoCountry);

    return phoneContext;
};

RosterAPI.prototype.authClient = function(accountNumber, countryOrPhone, accountPin) {

    var phoneContext = this.toPhoneContext(countryOrPhone);

    var credentials = {
        key: this.key,
        accountNumber: accountNumber,
        accountCountry: phoneContext.oafCountry,
        accountPin: accountPin
    };

    var path = utils.format('sms/Validate', []);

    var opts = {
        method: 'GET',
        params: {
            account: accountNumber,
            country: phoneContext.oafCountry
        },
        headers: {
            'Accept': 'application/json'
        },
        credentials: credentials
    };

    var content = null;
    try {
        content = this.request(path, opts);
    } catch (err) {

        if (!(err instanceof HttpError))
            throw err;

        if (!(err.status == 403))
            throw err;

        // Authenticating is kind of weird right now, since we don't have
        // a dedicated endpoint for it.  Use Validate as a test for now.
        content = {
            Result: 'ClientDoesNotExist'
        };
    }

    if (content.Result == 'ClientExists') {
        this.credentials = credentials;
        this.saveState();
        return true;
    }

    return false;
};

RosterAPI.prototype.getClient = function(accountNumber, countryOrPhone) {

    var phoneContext = this.toPhoneContext(countryOrPhone);

    var path = utils.format('sms/Client', []);

    var opts = {
        method: 'GET',
        params: {
            account: accountNumber,
            country: phoneContext.oafCountry
        },
        headers: {
            'Accept': 'application/json'
        }
    };

    return this.request(path, opts);
};

RosterAPI.prototype.isSerialNumberRegistered = function(
    productTypes, serialNum, accountNumber, countryOrPhone) {

    var phoneContext = this.toPhoneContext(countryOrPhone);

    if (!_.isArray(productTypes))
        productTypes = [productTypes];

    var path = utils.format('sms/IsSerialNumberRegistered', []);

    var opts = {
        method: 'GET',
        params: {
            account: accountNumber,
            country: phoneContext.oafCountry,
            inputNames: productTypes,
            serialNum: serialNum
        },
        headers: {
            'Accept': 'application/json'
        }
    };

    return this.request(path, opts);
};

global.catchAll = function(todo) {

    try {
        todo();
        global.$error = "";
    } catch (error) {

        global.$error = error.name;
        global.$error_message = error.message;

        if (error.toTelerivet) {
            var trError = error.toTelerivet();
            for (var k in trError) {
                global[k] = trError[k];
            }
        }
    }
};

//
// Exports
//

var rosterAPI = new RosterAPI(telerivetContext);

module.exports = rosterAPI;
