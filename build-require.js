/**
 * Basically optimizing with command line is preferable to build script like this.
 * So This script is temporary.
 * r.js command line is little bit tricky
 *
 * to run this script,
 *  1. install npm, https://github.com/isaacs/npm
 *  2. command `npm install` at this directory.
 *  3. command `node build-require.js` or `npm start`
 */
var requirejs = require('requirejs'),
  resolve = require('path').resolve,
  baseUrl = resolve(__dirname, 'js'),
  name = 'main',
  out = resolve(baseUrl, 'main-built.js'),
  mainConfigFile = resolve(baseUrl, 'main.js');

console.log('baseUrl : ' + baseUrl);
console.log('name : ' + name);
console.log('out : ' + out);
console.log('mainConfigFile : ' + mainConfigFile);

optimize(function (err) {
  if (err) {
    console.error(err);
  } else {
    console.log('build success');
  }
  process.exit();
});

function optimize(done) {
  var config = {
    baseUrl: baseUrl,
    name: name,
    out: out,
    optimize: 'uglify',
    uglify: {
      // beautify for debugging
      // beautify: true,
      mangle: true
    },
    // it didn't work since baseUrl is going to override mainConfigFile's baseUrl
    // https://github.com/jrburke/r.js/issues/130
    // mainConfigFile: mainConfigFile
    // TODO use mainConfigFile rather than dirty copy and paste
    shim: {
      underscore: {
        exports: '_',
      },
      jquery: {
        exports: '$'
      },
      'jquery-tipsy': {
        deps: ['jquery'],
        exports: '$'
      },
      'jquery-slowparse': {
        deps: ['jquery'],
        exports: '$'
      },
      backbone: {
        deps: ['underscore', 'jquery'],
        exports: 'Backbone'
      },
      codemirror: {
        exports: "CodeMirror"
      },
      "codemirror/xml": {
        deps: ["codemirror"],
        exports: "CodeMirror"
      },
      "codemirror/javascript": {
        deps: ["codemirror"],
        exports: "CodeMirror"
      },
      "codemirror/css": {
        deps: ["codemirror"],
        exports: "CodeMirror"
      },
      "codemirror/html": {
        deps: [
          "codemirror/xml",
          "codemirror/javascript",
          "codemirror/css"
        ],
        exports: "CodeMirror"
      }
    },
    paths: {
      jquery: 'jquery.min',
      templates: resolve(__dirname, './templates'),
      'jquery-tipsy': 'jquery.tipsy',
      'jquery-slowparse': '../slowparse/spec/errors.jquery',
      underscore: 'underscore.min',
      backbone: 'backbone.min',
      codemirror: "../codemirror2/lib/codemirror",
      "codemirror/xml": "../codemirror2/mode/xml/xml",
      "codemirror/javascript": "../codemirror2/mode/javascript/javascript",
      "codemirror/css": "../codemirror2/mode/css/css",
      "codemirror/html": "../codemirror2/mode/htmlmixed/htmlmixed"
    }
  };

  requirejs.optimize(config, done);
}
