// This is a simple RequireJS plugin that loads an underscore.js template.
define(['underscore'], function (_) {
  return {
    load: function(name, req, load, config) {
      req(["text!../templates/" + name + ".html"], function(text) {
        load(_.template(text));
      });
    }
  };
});