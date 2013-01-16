var fs = require('fs');
var sys = require('sys');
var resolve = require('path').resolve;
var buildRequire = require('./build-require');
var rootDir = buildRequire.rootDir;
var requirejs = require('requirejs');
var config = buildRequire.generateConfig();
var bundles = exports.bundles = {};

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
}

function loadModulesInNlsPath(path) {
  fs.readdirSync(rootDir + '/' + path).forEach(function(filename) {
    var match = filename.match(/^(.*)\.js$/);
    if (match) {
      var moduleName = path + '/' + match[1];
      var bundle = requirejs(moduleName);
      
      bundles[moduleName] = bundle;
    }
  });
}

function loadInlineL10nStrings() {
  var InlineL10n = requirejs('inline-l10n');
  var templateCfg = config.config.template;
  var templateDir = requirejs.toUrl(templateCfg.htmlPath).replace(".js", "");
  var root = bundles[templateCfg.i18nPath].root;
  var metadata = bundles[templateCfg.i18nPath].metadata;

  fs.readdirSync(templateDir).forEach(function(filename) {
    var content = fs.readFileSync(templateDir + '/' + filename, 'utf8');
    var defaultValues = InlineL10n.parse(content);
    for (var key in defaultValues) {
      var value = defaultValues[key];
      if (key in root && root[key] != value)
        throw new Error("conflicting definitions for key: " + key);
      root[key] = value;
      metadata[key] = {
        help: 'This string appears in ' +
              '<a href="' + config.githubUrl + '/blob/gh-pages/templates/' +
              filename + '">' + filename + '</a>.'
      };
    }
  });
}

function showBundleModuleList(indent) {
  Object.keys(bundles).forEach(function(name) {
    sys.puts((indent || "") + name);
  });
}

function validateNlsModuleName(moduleName) {
  if (!(moduleName in bundles)) {
    if (!moduleName)
      sys.puts("Unspecified module name. Valid choices are:\n");
    else
      sys.puts("'" + moduleName + "' is not a valid module name. " +
               "Valid choices are:\n");
    showBundleModuleList("  ");
    sys.puts("");
    process.exit(1);
  }
}

function main() {
  var program = require('commander');
  program
    .command('template [module-name]')
    .description('output JS for an i18n bundle module, which can be ' +
                 'used as a template for localization')
    .action(function(moduleName) {
      validateNlsModuleName(moduleName);
      var root = JSON.stringify(bundles[moduleName].root, null, 2);
      sys.puts("define(" + root + ");"); 
    });
  program
    .command('list')
    .description('display a list of i18n bundle modules')
    .action(function() { showBundleModuleList(); });
  program
    .command('json')
    .description('output JSON blob containing strings and metadata for ' +
                 'all i18n bundles')
    .action(function() {
      sys.puts(JSON.stringify(bundles, null, 2));
    });
  program.parse(process.argv);
  if (process.argv.length == 2)
    program.help();
}

config.isBuild = true;
requirejs.config(config);

findNlsPaths(rootDir).forEach(loadModulesInNlsPath);
loadInlineL10nStrings();

if (!module.parent) main();
