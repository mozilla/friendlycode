"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(["jquery"], function($) {
  return function Relocator(codeMirror) {
    var lastPos = null;
    var lastElement = null;
    var lastToggle = document.createElement("div");

    function flipElementIfNeeded() {
      var coords = codeMirror.charCoords(lastPos, "local");
      var bottomChar = {line: codeMirror.lineCount(), ch: 0};
      var bottomCoords = codeMirror.charCoords(bottomChar, "local");
      var height = lastElement.height();
      var bottom = Math.max(bottomCoords.yBot,
                            $(codeMirror.getScrollerElement()).height());
      var isPointingDown = coords.yBot + height > bottom;
      lastElement.toggleClass("flipped", isPointingDown);
    }
    
    var relocator = {
      // clear old markings
      cleanup: function() {
        if (lastPos) {
          codeMirror.setLineClass(lastPos.line, null, null);
          codeMirror.clearMarker(lastPos.line);
          lastPos = null;
        }
        if (lastElement) {
          lastElement.hide();
          lastElement = null;
        }
        if (lastToggle.parentNode) {
          $(lastToggle).hide();
          lastToggle.parentNode.removeChild(lastToggle);
        }
      },

      // relocate an element to inside CodeMirror, pointing "at" the line for startMark
      relocate: function(element, startMark, type) {
        this.cleanup();
        lastElement = $(element);

        // find the line and character position for the start mark. We want
        // both because the line may actually span multiple screen lines due
        // to soft-wrapping, so we want to make sure that we point at
        // the right one.
        lastPos = codeMirror.posFromIndex(startMark);
        codeMirror.setLineClass(lastPos.line, null, "CodeMirror-line-highlight");
        codeMirror.setMarker(lastPos.line, null, "gutter-highlight-" + type);

        codeMirror.addWidget(lastPos, lastElement[0], false);
        $(".up-arrow, .down-arrow", lastElement).css({
          left: codeMirror.charCoords(lastPos, "local").x + "px"
        });
        flipElementIfNeeded();

        // make sure to add the end-of-line marker
        this.setupMarker(type);
      },

      // set up the end-of-line marker for hint/error toggling
      setupMarker: function(type) {
        lastElement.hide();
        var jToggle = $(lastToggle),
            jToggleClass = "";
        if (type === "error") {
          jToggleClass = "hint-marker-error";
        } else {
          jToggleClass = "hint-marker-help";
        }

        codeMirror.addWidget(lastPos, lastToggle, false);
        jToggle.removeClass("hint-marker-error hint-marker-help");
        jToggle.addClass("hint-marker-positioning");
        jToggle.addClass(jToggleClass);

        lastToggle.onclick = (function(element) { return function() { element.toggle(); }; } (lastElement));
        jToggle.show();
      }
    };

    return relocator;
  };
});
