var test = require("tap").test;
var rootDir = require('path').resolve(__dirname, '..', '..');
var express = require('express');
var path = require('path');
var spawn = require('child_process').spawn;

function loggedSpawn(command, args, options) {
  var process = spawn(command, args, options);
  process.stdout.setEncoding('utf8');
  process.stderr.setEncoding('utf8');
  process.stdout.on('data', function(chunk) { console.log(chunk); });
  process.stderr.on('data', function(chunk) { console.log(chunk); });
  return process;
}

function runQUnitTests(path, t) {
  var app = express.createServer(),
      port = 8051,
      testUrl = 'http://localhost:' + port + path;

  app.use(express.static(rootDir));

  app.listen(port, function() {
    console.log("serving on port " + port + " files in " + rootDir);
    var phantom = loggedSpawn('phantomjs', [
      rootDir + '/bin/phantom-qunit-runner.js',
      testUrl
    ]);
    phantom.on('exit', function(status) {
      console.log('phantomjs exited with code', status);
      t.equal(status, 0, "phantomjs should exit with no errors");
      app.close();
      t.end();
    });
  });
}

test("unoptimized test suite works", function(t) {
  runQUnitTests("/test/index.html", t);
});

test("optimized build and test suite work", function(t) {
  var optimize = loggedSpawn('node', [rootDir + '/bin/build-require.js']);
  optimize.on('exit', function(status) {
    console.log('build-require.js exited with code', status);
    t.equal(status, 0, "build-require.js should exit with no errors");
    runQUnitTests("/test/index-optimized.html", t);
  });
});
