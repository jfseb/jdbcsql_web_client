# jdbcsql_web_client
[![Build Status](https://travis-ci.org/jfseb/jdbcsql_web_client.svg?branch=master)](https://travis-ci.org/jfseb/jdbcsql_web_client)[![Coverage Status](https://coveralls.io/repos/github/jfseb/jdbcsql_web_client/badge.svg)](https://coveralls.io/github/jfseb/jdbcsql_web_client)

Web server and client to execute sql queries via node-jdbc

## Built commandline

```
    npm install
    gulp
```

### Run commandline bot

```
    node smartbot.js
```

### Run webserver bot

```
    node serverpug.js
```

## Development

The src folder contains both typescript and js files.

All files are compiled to gen  (using tsc or babel)
Compilation is to ES2015, as the jscoverage parse cannot treat new language
feature correclty

gulp-instrument (one of the jscoverage gulp integration) is used to generate
coverage instrumented sources in gen_cov

Currently the test folder is not compiled, but contains directly es6 modules

gulp, gulp-watch


