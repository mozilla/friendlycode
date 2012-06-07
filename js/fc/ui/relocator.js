"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(function() {
  return function Relocator(codeMirror, codeMirrorScrollArea) {
    var lastLine = null;
    
    var relocator = {
      // clear old markings
      cleanup: function() {
        if (lastLine) {
          codeMirror.setLineClass(lastLine, null, null);
          codeMirror.clearMarker(lastLine);
          lastLine = null;
        }
        $(".help .up-arrow, help. .down-arrow, .error .up-arrow, .error .down-arrow").hide();
      },

      // relocate an element to inside CodeMirror, pointing "at" the line for startMark
      relocate: function(element, startMark) {
        this.cleanup();

        // find the line position for the start mark
        lastLine = codeMirror.posFromIndex(startMark).line;
        var coords = codeMirror.charCoords({line: lastLine, ch: 0}, "local");
        var linePre = $($('.CodeMirror-gutter-text pre')[lastLine]);
        codeMirror.setLineClass(lastLine, null, "CodeMirror-line-highlight");
        codeMirror.setMarker(lastLine, null, "CodeMirror-line-highlight");

        $(".up-arrow", element).show();
        codeMirror.addWidget({line: lastLine, ch: 0}, $(element)[0], false);
      }
    };

    return relocator;
  };
});
