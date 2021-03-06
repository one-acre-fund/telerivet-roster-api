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

    **CAVEAT**: For now, Telerivet cloud script modules must have GLOBALLY unique names. Thus, if your co-worker's account already added a module called `ext/roster`, you'll have to create your own name, like `ext/my-own-test-roster`. Sorry, we know that's weird.

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
  GlobalClientId: "...",
  AccountNumber: (number),
  ClientName: "...", // full name
  FirstName: "...",
  LastName: "...",

  // active account details
  ClientId: (number),
  DistrictId: (number),
  DistrictName: "...",
  RegionId: (number),
  RegionName: "...",
  CountryId: (number),
  CountryName: "...",
  CreatedDate: (date),
  EnrollmentDate: (date),
  BannedDate: (date) | null,
  DeceasedDate: (date) | null,

  // aggregate account details
  EarliestCreatedDate: (date),
  EarliestEnrollmentDate: (date),
  LatestBannedDate: (date) | null,

  // current enrollment details (null if client has never enrolled with active account)
  GroupId: (number) | null,
  GroupName: "..." | null,
  SiteId: (number) | null,
  SiteName: "..." | null,

  // client accounts in reverse chronological order
  // Each account has a unique AccountGuid
  AccountHistory: [
    {
      AccountGuid: "...",
      ClientId: (number),
      AccountNumber: "...",
      DistrictId: (number),
      DistrictName: "...",
      RegionId: (number),
      RegionName: "...",
      CountryId: (number),
      CountryName: "..."
    },
    ...
  ],

  // balance history in reverse chronological order
  BalanceHistory: [
    {
      // enrollment details
      AccountGuid: "...",
      GroupId: (number),
      GroupName: "...",
      SiteId: (number),
      SiteName: "...",
      SeasonId: (number),
      SeasonName: "...",
      SeasonStart: "...",

      // repayment details
      TotalCredit: (number),
      TotalRepayment_IncludingOverpayments: (number),
      Balance: (number),
      CurrencyCode: "..."},
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

### validatePayment(accountNumber, amountLocalCurrency, [phone], [collectViaProvider]) => obj

```javascript
$result = rosterAPI.validatePayment("67890987", 1000);
```

Returns a result object with at least the following on successful validation:

```javascript
{
  Result: true
}
```

Returns a result object with at least the following on validation failure:

```javascript
{
  Result: false,
  ErrorCode: (number),
  ErrorMessage: (string)
}
```

The `accountNumber` and `phone` parameters are used to identify the client - a `phone` object and not just the country is required for validation and push collection requests.  The `phone` object defaults to the global telerivet `phone` object if not specified.

The `amountLocalCurrency` parameter is a numeric value of the amount of the payment request in the country-standard currency of the `phone`.

The `collectViaProvider` parameter may either be an explicit provider name like 'Beyonic' or `true`, which is a placeholder for the default provider for the `phone` country.  If specified and the payment information is valid, the provider will be asked to collect the payment request asynchronously after validation.  If not specified only validation will occur.  Also see `collectPayment()`.

### collectPayment(accountNumber, amountLocalCurrency, [phone], [collectViaProvider]) => obj

```javascript
$result = rosterAPI.collectPayment("67890987", 1000);
```

A thin wrapper for `validatePayment()` which defaults to collecting the payment request if valid.

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
