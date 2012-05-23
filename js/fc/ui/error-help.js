"use strict";

// Provides helpful Slowparse-based error suggestions for a
// ParsingCodeMirror.
define(["./mark-tracker"], function(MarkTracker) {
  return function ErrorHelp(options) {
    var self = {};
    var codeMirror = options.codeMirror;
    var template = options.template;
    var errorArea = options.errorArea;
    var relocator = options.relocator;

    // Keep track of error highlighting.
    var errorHelpMarks = MarkTracker(codeMirror, relocator);
  
    // Report the given Slowparse error.
    function reportError(error) {
      var startMark = 999999999;
      var errorHTML = $("<div></div>").fillError(error)
        .eachErrorHighlight(function(start, end, i) {
          if (start < startMark) {
            startMark = start;
          }
          errorHelpMarks.mark(start, end, "highlight-" + (i+1), this);
        });
      errorArea.html(template({error: errorHTML.html()})).show();
      relocator.relocate(errorArea, startMark);
    }
  
    codeMirror.on("reparse", function(event) {
      errorHelpMarks.clear();
      relocator.cleanup();
      if (event.error) {
        reportError(event.error);
      } else { 
        errorArea.hide();
      }
    });
    return self;
  };
});
