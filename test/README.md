# HSL-map-publisher tests

This folder contains the test scripts for generating various edge-case stop posters, to verify functionality of the service.
Mainly meant for developers to test poster generation using local Docker environment without needing to start a local UI service.

## How to use
You can enable/disable different components by commenting them out from the `POSTER_COMPONENTS` enum object.
There are different objects and variables as well for stop lists, line id arrays etc. for different components. It is advisable to modify these to suit your needs.

After configuring the needed test generations, you can run these tests from the project root with:
```bash
yarn test
```

Example output (how it should look like):
```bash
❯ yarn test
yarn run v1.22.22
$ node -r dotenv/config test/testStops
Found old test build list, deleting..

Adding new build list..
Adding test poster generations to build list xxx...
Waiting for posters to generate, this may take a while..
All completed posters downloaded !
Completed posters
    5/5
Cleaning up old results from ./test/results
Downloading poster PDF..
✨  Done in 52.73s.
```

As usual, if some of the posters fail you should check the output of `publisher-worker` services.