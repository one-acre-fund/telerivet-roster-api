# telerivet-roster-api

Telerivet-focused bindings for the Roster API

These scripts are meant to be require()'d as a cloud script module in a Telerivet project to enable simple Roster API calls.  The module handles annoying tasks like:

* Transparently loading API endpoint and API key from a shared data table
* Persisting state (for example, client credentials) between different javascript runs in a Telerivet logic flow
* Wrapping HTTP errors into standard javascript errors, wrapping standard javascript errors into Telerivet `$variables`

## Quickstart

1.  First, this repository is added as as a ["Cloud Script Module"](https://telerivet.com/dashboard/a/add_script_module) with a given name, like: `ext/roster`
    
1.  To use the Roster API in Telerivet "Logic Flows", add a "Run Custom Javascript" Action to the flow with the following lines:

    ```javascript
    var rosterAPI = require('ext/roster/api');
    catchAll(function() {

      // Do stuff with the roster here
      $result = rosterAPI.doStuff();

    }); // $error, $error_message set if errors are thrown
    ```

    For example, a call to get the client balance might look like:

    ```javascript
    var rosterAPI = require('ext/roster/api');
    catchAll(function() {

      $balance = rosterAPI.getClient($accountNumber).balance;

    });
    ```

1.  The Roster API requires a Roster endpoint (URL) and API key be specified - this can be done in the binding itself by:

    ```javascript
    var rosterAPI = require('ext/roster/api').attach("http://www.oaf.org/api/v0", "really-long-key-012345");
    ```
    
    ... but preferably can be done across-the-board in the project settings themselves by creating a new data table called "ExternalApis" in the project with three columns:
    
    | Name | URL | Key |
    | ------------- |:-------------:| -----:|
    | Roster | http://www.oaf.org/api/v0 | really-long-key-012345 |
    
    This way the Roster endpoint and key can be reconfigured without touching a lot of code inside the logic flows.

## API Bindings

### [global].catchAll

```javascript
var rosterAPI = require('ext/roster/api');
catchAll(function() {
	
    $result = rosterAPI.makeBadCall();

}); // $error, $error_message set if errors are thrown

if ($error) {
   // Handle error case in javascript or in logic flow
}

```

The `catchAll` helper function wraps javascript errors in a helpful way so they can be used later in a Telerivet error-handling logic branch.  Because only global `$`-prefixed variables with `string|int` values are usable later in Telerivet logic flows, error handling isn't possible unless errors are reported in this form.

Certain error classes also report extra information (like `HttpError`'s `$error_status` and `$error_url`) by implementing a `toTelerivet()` method.

### request(path, opts)

```javascript
$result = rosterAPI.request("Clients/Get", { params: { 'account' : '12345' } });
```

Raw API request functionality which uses the attached endpoint and API key of the `rosterAPI` to do a request at a certain URL path.  Returns the response content when successful, otherwise throws an HttpError containing the full response object and other data.

TODO: Make these calls accurate

### parseAccountAndPin()

```javascript
var rosterAPI = require('ext/roster/api');
catchAll(function() {

   // Do stuff with the roster here
   $result = rosterAPI.doStuff();

}); // $error, $error_message set if errors are thrown
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



