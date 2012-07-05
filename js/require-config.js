var require = {
  baseUrl: "js",
  shim: {
    underscore: {
      exports: function() {
        return _.noConflict();
      }
    },
    jquery: {
      exports: function() {
        jQuery.noConflict();
        return jQuery;
      }
    },
    "jquery-tipsy": {
      deps: ["jquery"],
      exports: 'jQuery'
    },
    "jquery-slowparse": {
      deps: ["jquery"],
      exports: "jQuery"
    },
    backbone: {
      deps: ["underscore", "jquery"],
      exports: "Backbone"
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
    jquery: "jquery.min",
    "jquery-tipsy": "jquery.tipsy",
    "jquery-slowparse": "../slowparse/spec/errors.jquery",
    underscore: "underscore.min",
    backbone: "backbone.min",
    slowparse: "../slowparse",
    codemirror: "../codemirror2/lib/codemirror",
    "codemirror/xml": "../codemirror2/mode/xml/xml",
    "codemirror/javascript": "../codemirror2/mode/javascript/javascript",
    "codemirror/css": "../codemirror2/mode/css/css",
    "codemirror/html": "../codemirror2/mode/htmlmixed/htmlmixed",
    test: "../test"
  }
};

if (typeof(module) == 'object' && module.exports)
  module.exports = require;
