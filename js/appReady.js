"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
define(['jquery-slowparse'], function ($) {
  var errorsLoaded = jQuery.Deferred();
  var typekitFinished = jQuery.Deferred();

  function finishTypekit() { typekitFinished.resolve(); }

  try {
    Typekit.load({
      active: finishTypekit,
      inactive: finishTypekit
    });
  } catch(e) { finishTypekit(); }

  $.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    errorsLoaded.resolve();
  });

  return {
    load: function(name, req, load, config) {
      $.when(errorsLoaded, typekitFinished).then(load);
    }
  };
});