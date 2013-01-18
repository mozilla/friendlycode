var test = require("tap").test;
var rootDir = require('path').resolve(__dirname, '..', '..');
var express = require('express');
var path = require('path');
var fs = require('fs');
var spawn = require('child_process').spawn;

function exists(filename) {
  return fs.existsSync(path.resolve(rootDir, filename));
}

function rm(filename) {
  if (exists(filename))
    fs.unlinkSync(path.resolve(rootDir, filename));
}

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

function ensureCssHasNoImports(t, builtCss) {
  var css = fs.readFileSync(path.resolve(rootDir, builtCss), 'utf-8');
  t.ok(!/@import/.test(css), builtCss + " has no @import rules");
}

test("optimized build and test suite work", function(t) {
  var optimize;
  var builtJs = 'js/friendlycode-built.js';
  var builtCss = 'css/friendlycode-built.css';
  
  rm(builtJs);
  rm(builtCss);
  optimize = loggedSpawn('node', [rootDir + '/bin/build-require.js']);
  optimize.on('exit', function(status) {
    console.log('build-require.js exited with code', status);
    t.equal(status, 0, "build-require.js should exit with no errors");
    t.ok(exists(builtJs), builtJs + " was created");
    t.ok(exists(builtCss), builtCss + " was created");
    ensureCssHasNoImports(t, builtCss);
    runQUnitTests("/test/index-optimized.html", t);
  });
});
