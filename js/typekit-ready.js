"use strict";

// This is a simple [RequireJS plugin][] that waits for a few resources
// to load before we execute any of the app's main logic.
//
//  [RequireJS plugin]: http://requirejs.org/docs/plugins.html#apiload
define({
  load: function(name, req, onLoad, config) {
    function tryLoadingTypekit() {
      try {
        Typekit.load({
          active: function() { onLoad("Typekit active"); },
          inactive: function() { onLoad("Typekit inactive"); }
        });
      } catch(e) { onLoad("ERROR: " + e); }
    }

    if (config.isBuild) {
      onLoad(null);
    } else {
      tryLoadingTypekit();
    }
  }
});