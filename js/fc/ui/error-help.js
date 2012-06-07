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
    var widget = null;
    
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
      errorArea.hide();
      widget = $('<div class="error-widget"></div>');
      widget.click(function() {
        errorArea.fadeToggle();
        codeMirror.focus();
        return false;
      });
      codeMirror.addWidget(codeMirror.posFromIndex(startMark), widget[0], false);
      window.widget = widget[0];
      relocator.relocate(errorArea, startMark);
    }
  
    codeMirror.on("reparse", function(event) {
      errorHelpMarks.clear();
      if (widget) {
        widget.remove();
        widget = null;
      }
      if (event.error) {
        reportError(event.error);
      } else { 
        errorArea.hide();
      }
    });
    return self;
  };
});
