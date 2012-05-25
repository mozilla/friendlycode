"use strict";

// This helper saves the editor's data to local storage just before
// the page unloads, and provides a method to restore it. Useful for
// when a user accidentally refreshes/navigates away from the editor
// and wants to retrieve their old content.
//
// TODO: This could be a privacy concern, since people at shared terminals
// might not want the next user to be able to see what they were just
// working on. We're currently only saving the data for a few minutes, though,
// so hopefully this shouldn't be that big a problem.
define(["lscache"], function(lscache) {
  return function Parachute(window, codeMirror, currentPage) {  
    currentPage.on("load", function() {
      key = prefix + currentPage.path;
    });
    currentPage.on("change", function() {
      key = null;
    });
    currentPage.on("before-change", function() {
      self.save();
    });
    
    // Amount of time, in minutes, to save parachute data.
    var timeLimit = 5;
    var prefix = "FRIENDLYCODE_PARACHUTE_DATA_";
    var key = null;
    var originalData = codeMirror.getValue();
    var self = {
      restore: function() {
        if (!key)
          return false;
        var saved = lscache.get(key);
        if (saved) {
          if (saved == codeMirror.getValue()) {
            // Our saved data is the same as the unmodified data, so there's
            // no need to store it.
            lscache.remove(key);
          } else {
            codeMirror.setValue(saved);
            return true;
          }
        }
        return false;
      },
      save: function() {
        if (key && codeMirror.getValue() != originalData)
          lscache.set(key, codeMirror.getValue(), timeLimit);
      },
      refresh: function() {
        originalData = codeMirror.getValue();
      },
      destroyAll: function() {
        window.removeEventListener("beforeunload", self.save, true);
        lscache.flush();
      }
    };
  
    window.addEventListener("beforeunload", self.save, true);
    return self;
  };
});
