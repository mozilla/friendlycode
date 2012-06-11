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
      var startMark = null;
      var errorHTML = $("<div></div>").fillError(error)
        .eachErrorHighlight(function(start, end, i) {
          // Point the error message's arrow at the first occurrence of
          // the word "here" in the error message.
          if (startMark === null)
            startMark = start;
          errorHelpMarks.mark(start, end, "highlight-" + (i+1), this);
        });
      errorArea.html(template({error: errorHTML.html()})).show();
      relocator.relocate(errorArea, startMark, "error");
    }
  
    codeMirror.on("reparse", function(event) {
      errorHelpMarks.clear();
      if (event.error) {
        reportError(event.error);
      } else { 
        errorArea.hide();
      }
    });
    return self;
  };
});
