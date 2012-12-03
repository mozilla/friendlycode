var NLS_PATHS = [
  'fc/nls',
  'slowparse-errors/nls'
];

var fs = require('fs');
var requirejs = require('requirejs');
var requireConfig = require('./js/require-config');
var bundles = {};

requirejs.config(requireConfig);

NLS_PATHS.forEach(function(path) {
  fs.readdirSync(__dirname + '/js/' + path).forEach(function(filename) {
    var match = filename.match(/^(.*)\.js$/);
    if (match) {
      var moduleName = path + '/' + match[1];
      var bundle = requirejs(moduleName);
      
      bundles[moduleName] = bundle;
    }
  });
});

require('sys').puts(JSON.stringify(bundles, null, 2));
