var requirejs = require('requirejs'),
  jsdom = require('jsdom').jsdom,
  resolve = require('path').resolve,
  requireConfig = require('../js/require-config'),
  rootDir = resolve(__dirname, '..', 'js'),
  name = 'friendlycode',
  out = resolve(rootDir, 'friendlycode-built.js');

function optimize(done) {
  requirejs.optimize(generateConfig(), done, function(err) {
    process.stderr.write(err.toString());
    process.exit(1);
  });
}

exports.rootDir = rootDir;

var generateConfig = exports.generateConfig = function() {
  var config = {
    name: name,
    out: out,
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
    },
    // TODO  above config setting is temporary, it shuould use mainConfigFile
    // https://github.com/toolness/friendlycode/pull/112#issuecomment-6625412
    // mainConfigFile: "./js/main.js",
  };
  Object.keys(requireConfig).forEach(function(name) {
    config[name] = requireConfig[name];
  });
  config.baseUrl = rootDir;
  return config;
}

if (!module.parent) {
  console.log("Generating", out);

  optimize(function (buildResponse) {
    // buildResponse is just a text output of the modules
    // included.
    console.log("Done. About " + buildResponse.split('\n').length +
                " modules are inside the generated JS file.");
    requirejs.optimize({
      cssIn: "css/friendlycode.css",
      out: "css/friendlycode-built.css"
    }, function() {
      console.log("Optimized CSS.");
      process.exit();
    });
  });
}
