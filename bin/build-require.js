var requirejs = require('requirejs'),
  jsdom = require('jsdom').jsdom,
  resolve = require('path').resolve,
  requireConfig = require('../js/require-config'),
  rootDir = resolve(__dirname, '..', 'js'),
  name = 'friendlycode',
  cssIn = resolve(rootDir, "..", "css", "friendlycode.css"),
  cssOut = resolve(rootDir, "..", "css", "friendlycode-built.css"),
  jsOut = resolve(rootDir, 'friendlycode-built.js');

var bailOnError = function(err) {
  process.stderr.write(err.toString());
  process.exit(1);
};

var generateConfig = exports.generateConfig = function() {
  var config = {
    name: name,
    out: jsOut,
    // use none optimize for debugging
    optimize: "none",
    // optimize: 'uglify',
    uglify: {
      // beautify for debugging
      // beautify: true,
      mangle: true
    },
    makeDocument: function() {
      return jsdom('<html></html>', null, {
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          MutationEvents: false,
          QuerySelector: true
        }
      });
    }
    // TODO: Consider using mainConfigFile here. For more info, see:
    // https://github.com/mozilla/friendlycode/pull/112#issuecomment-6625412
  };
  Object.keys(requireConfig).forEach(function(name) {
    config[name] = requireConfig[name];
  });
  config.baseUrl = rootDir;
  return config;
};

exports.rootDir = rootDir;

if (!module.parent) {
  console.log("Generating", jsOut);

  requirejs.optimize(generateConfig(), function (buildResponse) {
    // buildResponse is just a text output of the modules
    // included.
    console.log("Done. About " + buildResponse.split('\n').length +
                " modules are inside the generated JS file.");
    requirejs.optimize({
      cssIn: cssIn,
      out: cssOut
    }, function() {
      console.log("Optimized CSS.");
      process.exit();
    }, bailOnError);
  }, bailOnError);
}
