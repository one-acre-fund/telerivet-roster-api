## Unit-testing the Telerivet Roster API Bindings

The tests here provide some basic coverage of the Roster API
bindings.  They're not comprehensive, but are useful to make
sure our helper code creates the right endpoint URLs, loads
data from vars correctly, etc.

### Setting up tests

Tests are run using Node.js of an older 0.x branch:

```
> npm install
> node test/test.js
```

Telerivet uses a SpiderMonkey v1.6 javascript engine with some custom extensions - this corresponds roughly to the javascript 0.x branches of Node.js with 'underscore' v1.6 support.

It's not possible to directly run a SpiderMonkey engine without embedding it in another executable, and there's no direct Node.js (i.e. V8) equivalent javascript version (yay javascript incompatibility) so this is probably the simplest approach for now.
