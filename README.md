# telerivet-roster-api

Telerivet-focused bindings for the Roster API

These scripts are meant to be require()'d as a cloud script module in a Telerivet project to enable simple Roster API calls.  The module handles annoying tasks like:

* Transparently loading API endpoint and API key from a shared data table
* Persisting state (for example, client credentials) between different javascript runs in a Telerivet logic flow
* Wrapping HTTP errors into standard javascript errors, wrapping standard javascript errors into Telerivet `$variables`

## Quickstart

1.  First, this repository is added as as a ["Cloud Script Module"](https://telerivet.com/dashboard/a/add_script_module) with a given name, like: `ext/roster`

    Stable releases of the Roster API bindings are tagged with semantic versions, for example `v1.0.0`.  Generally production 
    logic flows should import only stable releases as modules by specifying `vX.Y.Z` as the branch name.
    
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

## Updates to the bindings

Semantic versions indicate breaking changes by bumping the major version number (`v1` to `v2`), and non-breaking feature additions by bumping the minor version number (`v2.2` to `v2.4`).

On Telerivet, the Roster API bindings are updated by changing to a new versioned branch in the Cloud Script Module for the bindings.  Minor-version updates *should* be safe and require no Telerivet logic flow changes... but a healthy level of paranoia is a great idea.  Major version updates generally require logic flow changes.

It's also possible to use multiple versions of the API bindings by registering differently named Cloud Script Modules - for example `ext/roster-v1.1` and `ext/roster-v2.0`.  This way new bindings can be tested and upgraded slowly in different logic flows one-by-one.

## API Bindings

### request(path, opts) => obj

```javascript
$result = rosterAPI.request("Clients", { params: { 'account' : '12345' } });
```

Raw API request functionality which uses the attached endpoint and API key of the `rosterAPI` to do a request at a certain URL path.  Returns the response content when successful, otherwise throws an HttpError containing the full response object and other data.

------

### authClient(accountNumber, [countryOrPhone], [accountPin]) => bool

```javascript
$isValidAndAuthorized = rosterAPI.authClient("12345");
```

Authorizes the client to access Roster, which (for now) simply requires a valid `accountNumber`, and stores the provided credentials for future calls (`accountPin` if provided).  The `countryOrPhone` parameter may be either the telerivet global `phone` object (default if not provided), a Roster country name, or an ISO country name.

`authClient` must be used before making other API calls, even without a PIN, otherwise `403 HttpErrors` will be thrown.  For now you can work around this with `rosterAPI.credentials = { key: rosterAPI.key }; rosterAPI.saveState();`, but this won't work once calls no longer include the account number.

### getClient(accountNumber, [countryOrPhone]) => obj

```javascript
$client = rosterAPI.getClient("12345");
```

Returns a client information object with at least the following:

```javascript
{
  ClientId: (number),
  GlobalClientId: "..."
  AccountNumber: "..."
  FirstName: "..."
  LastName: "..."
  DistrictName: "..."
  RegionName: "..."
  CountryName: "Kenya"
  DateCreated: "2016-04-05T14:30:29.397"
  EnrollmentDate: "2016-04-05T14:30:29.397"
  Ban: false
  Deceased: false
  FirstSeasonId: 180
  LastActiveSeasonId: null|(number)
  BalanceHistory: [
    { "SeasonId": 180,
      "SeasonName": "2016, Long Rain",
      "SeasonStart":"2016-03-01T00:00:00",
      "CurrencyCode":"MMK",
      "TotalCredit":90000,
      "TotalRepayment_IncludingOverpayments":90000,
      "Balance":0 },
   ...
   ]
}
```

The `accountNumber` and `countryOrPhone` parameters are used similarly to the `authClient` call.

### isSerialNumberRegistered(productTypes, serialNum, accountNumber, [countryOrPhone]) => obj

```javascript
$result = rosterAPI.isSerialNumberRegistered("Sun King Home", "67890987", "12345");
```

Returns a result object with at least the following:

```javascript
{
  Result: "SerialNumberNotRegistered",
  SerialNumProduct: "Sun King Home"
}
```

The `productTypes` parameter may be either a single Roster product type (name of a Roster input) or an array of several product types.

The `accountNumber` and `countryOrPhone` parameters are used similarly to the `getClient` call.

The `Result` values are one of:

* `"SerialNumberNotRegistered"`
* `"SerialNumberIsRegisteredToAnotherClient"`
* `"SerialNumberIsAlreadyRegisteredToCurrentClient"`
* `"SerialNumberDoesNotBelongToPassedInputs"` - the serial number can't be found for these inputs in the Roster database
* `"SerialNumberAmbiguous"` - the serial number was found for two or more products of different types, so a result can't be returned.  This shouldn't happen if only one product type is specified (but rarely can due to an ongoing Roster data issue).
                    
The `SerialNumProduct` is provided (if possible) to indicate the product type the serial number was found for - generally this is only useful if multiple product types are specified.

## Other Helpers

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

### parseAccountAndPin()

Helper to infer the account number, country, and PIN a user passes in from the raw content of a text message.

Account numbers are identified with a `#` prefix (`#12345678`), PINs are identified with `P` (`P123`), and country is inferred but may be specified by `@` (`@kenya`).

If `parsed.error != null` the parsing was unsuccessful and `parsed.error.message` may be returned to the user.  Alternately, `parsed.error.code` may be used to provide a custom message instead. 




