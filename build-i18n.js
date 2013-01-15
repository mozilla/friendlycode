// If args are specified on the command line, assume they are
// module names, and only export their localizations.
var MODULE_FILTER = process.argv.slice(2);

var fs = require('fs');
var buildRequire = require('./build-require');
var requirejs = require('requirejs');
var bundles = {};
var config = buildRequire.generateConfig();

function findNlsPaths(root, subdir) {
  var nlsPaths = [];
  subdir = subdir || '';
  fs.readdirSync(root + subdir).forEach(function(filename) {
    var relpath = subdir + '/' + filename;
    var stat = fs.statSync(root + relpath);
    if (stat.isDirectory()) {
      if (filename == 'nls') {
        nlsPaths.push(relpath.slice(1));
      } else
        nlsPaths = nlsPaths.concat(findNlsPaths(root, relpath));
    }
  });
  
  return nlsPaths;
};

config.isBuild = true;
requirejs.config(config);

findNlsPaths(__dirname + '/js').forEach(function(path) {
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

// Parse all inline l10n strings out of all templates and fill them into
// the fc/nls/ui bundle.
fs.readdirSync('templates').forEach(function(filename) {
  var InlineL10n = requirejs('inline-l10n');
  var root = bundles['fc/nls/ui'].root;
  var metadata = bundles['fc/nls/ui'].metadata;
  var content = fs.readFileSync('templates/' + filename, 'utf8');
  var defaultValues = InlineL10n.parse(content);
  for (var key in defaultValues) {
    var value = defaultValues[key];
    if (key in root && root[key] != value)
      throw new Error("conflicting definitions for key: " + key);
    root[key] = value;
    metadata[key] = {
      help: 'This string appears in ' +
            '<a href="https://github.com/mozilla/friendlycode/blob/gh-pages/templates/' + filename + '">' +
            filename + '</a>.'
    };
  }
});

require('sys').puts(JSON.stringify(bundles, null, 2));
