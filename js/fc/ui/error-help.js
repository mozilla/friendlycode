"use strict";

// Provides helpful Slowparse-based error suggestions for a
// ParsingCodeMirror.
define(["./mark-tracker"], function(MarkTracker) {
  return function ErrorHelp(options) {
    var self = {};
    var codeMirror = options.codeMirror;
    var template = options.template;
    var errorArea = options.errorArea;

    // Keep track of error highlighting.
    var errorHelpMarks = MarkTracker(codeMirror);
  
    // Report the given Slowparse error.
    function reportError(error) {
      var errorHTML = $("<div></div>").fillError(error)
        .eachErrorHighlight(function(start, end, i) {
          errorHelpMarks.mark(start, end, "highlight-" + (i+1), this);
        });

      // relocated errorArea to where the error is
      
      // show the errorArea
      errorArea.html(template({error: errorHTML.html()})).show();
    }
  
    codeMirror.on("reparse", function(event) {
      errorHelpMarks.clear();
      if (event.error)
        reportError(event.error);
      else
        errorArea.hide();
    });
    return self;
  };
});
