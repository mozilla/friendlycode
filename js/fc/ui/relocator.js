"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(function() {
  return function Relocator(codeMirror, codeMirrorScrollArea) {
    var lastLine = null;
    var lastElement = null;
    
    var relocator = {
      // clear old markings
      cleanup: function() {
        if (lastLine) {
          codeMirror.setLineClass(lastLine, null, null);
          codeMirror.clearMarker(lastLine);
          lastLine = null;
        }
        if (lastElement) {
          lastElement.hide();
          $(".up-arrow, .down-arrow", lastElement).hide();
          lastElement = null;
        }
      },

      // relocate an element to inside CodeMirror, pointing "at" the line for startMark
      relocate: function(element, startMark) {
        this.cleanup();
        lastElement = $(element);

        // find the line position for the start mark
        lastLine = codeMirror.posFromIndex(startMark).line;
        var coords = codeMirror.charCoords({line: lastLine, ch: 0}, "local");
        codeMirror.setLineClass(lastLine, null, "CodeMirror-line-highlight");
        codeMirror.setMarker(lastLine, null, "CodeMirror-line-highlight");
        lastElement.show();
        $(".up-arrow", lastElement).show();
        codeMirror.addWidget({line: lastLine, ch: 0}, lastElement[0], false);
      }
    };

    return relocator;
  };
});
