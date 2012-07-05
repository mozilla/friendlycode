"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
define({
  load: function(name, req, onLoad, config) {
    req(["jquery-slowparse"], function ($) {
      var errorsLoaded,
          typekitFinished;

      function startLoad() {
        errorsLoaded = $.Deferred();
        typekitFinished = $.Deferred();

        try {
          Typekit.load({
            active: finishTypekit,
            inactive: finishTypekit
          });
        } catch(e) { typekitFinished.resolve(); }

        $.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
          errorsLoaded.resolve();
        });
      }

      if (config.isBuild) {
        onLoad(startLoad.toString());
      } else {
        startLoad();
        $.when(errorsLoaded, typekitFinished).then(onLoad);
      }
    });
  }
});