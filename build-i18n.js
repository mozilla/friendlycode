// If args are specified on the command line, assume they are
// module names, and only export their localizations.
var MODULE_FILTER = process.argv.slice(2);

var NLS_PATHS = [
  'fc/nls',
  'slowparse-errors/nls'
];

var fs = require('fs');
var buildRequire = require('./build-require');
var requirejs = require('requirejs');
var bundles = {};
var config = buildRequire.generateConfig();

config.isBuild = true;
requirejs.config(config);

NLS_PATHS.forEach(function(path) {
  fs.readdirSync(__dirname + '/js/' + path).forEach(function(filename) {
    var match = filename.match(/^(.*)\.js$/);
    if (match) {
      var moduleName = path + '/' + match[1];
      
      if (MODULE_FILTER.length &&
          MODULE_FILTER.indexOf(moduleName) == -1)
        return;
      
      var bundle = requirejs(moduleName);
      
      bundles[moduleName] = bundle;
    }
  });
});

require('sys').puts(JSON.stringify(bundles, null, 2));
