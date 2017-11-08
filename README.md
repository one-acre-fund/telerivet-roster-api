## telerivet-roster-api

Telerivet-focused bindings for the Roster API

These scripts are meant to be require()'d as a cloud script module in a Telerivet project to enable simple Roster API calls.  

1.  First, this repository is added as as a ["Cloud Script Module"](https://telerivet.com/dashboard/a/add_script_module) with a given name, like: `ext/roster`
    
1.  To use the Roster API in Telerivet "Logic Flows", add a "Run Custom Javascript" Action to the flow with the following lines:

    ```javascript
    var rosterAPI = require('ext/roster/api');
    $result = rosterAPI.callAPIFunction($parameter);
    ```

    For example, a hypothetical `getClientBalance()` call might look like:

    ```javascript
    var rosterAPI = require('ext/roster/api');
    $balance = rosterAPI.getClientBalance($accountNumber, $pin);
    ```

1.  The Roster API requires a Roster endpoint (URL) and API key be specified - this can be done in the binding itself by:

    ```javascript
    var rosterAPI = require('ext/roster/api').attach("http://www.oaf.org/api/v0", "really-long-key-012345");
    ```
    
    ... but preferably can be done across-the-board in the project settings themselves by creating a new data table called "External" in the project with three columns:
    
    | Name | URL | Key |
    | ------------- |:-------------:| -----:|
    | Roster | http://www.oaf.org/api/v0 | really-long-key-012345 |
    
    This way the Roster endpoint and key can be reconfigured without touching a lot of code inside the logic flows.

## API Bindings

### parseAccountAndPin()

```javascript
var rosterAPI = require('ext/roster/api');
var parsed = rosterAPI.parseAccountAndPIN(content);
```

Helper to infer the account number, country, and PIN a user passes in from the raw content of a text message.

Account numbers are identified with a `#` prefix (`#12345678`), PINs are identified with `P` (`P123`), and country is inferred but may be specified by `@` (`@kenya`).

If `parsed.error != null` the parsing was unsuccessful and `parsed.error.message` may be returned to the user.  Alternately, `parsed.error.code` may be used to provide a custom message instead. 

### getClientInfo()

```javascript
var rosterAPI = require('ext/roster/api');
var parsed = rosterAPI.parseAccountAndPIN(content);
if (parsed.error) { 
  $error = parsed.error.message;
}
else {
  $balance = rosterAPI.getClient(parsed.accountNumber, parsed.accountPIN, [phone]).balance;
}
```

The `accountNumber` and `accountPIN` parameters are both strings, generally the account number is a set of 8 digits with optional `@country` suffix and the pin is a multi-digit identifier.  Optionally the phone can be specified, otherwise it is the current phone.

TODO: Add More/Document more Roster API calls.



