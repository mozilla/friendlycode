"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(["jquery"], function($) {
  function makeGutterPointer(codeMirror, highlightClass) {
    function attrs(element, attributes) {
      for (var name in attributes)
        element.setAttribute(name, attributes[name].toString());
    }
    
    var wrapper = $(codeMirror.getWrapperElement());
    var highlight = $(".CodeMirror-gutter-text ." + highlightClass, wrapper);
    var SVG_NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(SVG_NS, "svg");
    var w = $(".CodeMirror-gutter", wrapper).outerWidth() -
            highlight.width();
    var h = highlight.height();
    var pos = highlight.position();
    
    pos.left += highlight.width();
    attrs(svg, {
      'class': "gutter-pointer " + highlightClass,
      viewBox: [0, 0, w, h].join(" ")
    });
    var pointer = document.createElementNS(SVG_NS, "polygon");
    attrs(pointer, {
      points: ["0,0", w + "," + (h/2), "0," + h].join(" ")
    });
    svg.appendChild(pointer);
    $(svg).css({
      width: w + "px",
      height: h + "px",
      top: pos.top + "px",
      left: pos.left + "px"
    });

    $(".CodeMirror-scroll", wrapper).append(svg);
    
    return $(svg);
  }
  
  return function Relocator(codeMirror) {
    var lastPos = null;
    var lastElement = null;
    var lastGutterPointer = null;
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
        if (lastGutterPointer) {
          lastGutterPointer.remove();
          lastGutterPointer = null;
        }
        if (lastToggle.parentNode) {
          $(lastToggle).remove();
        }
      },

      // relocate an element to inside CodeMirror, pointing "at" the line for startMark
      relocate: function(element, startMark, type) {
        var highlightClass = "gutter-highlight-" + type;

        this.cleanup();
        lastElement = $(element);

        // find the line and character position for the start mark. We want
        // both because the line may actually span multiple screen lines due
        // to soft-wrapping, so we want to make sure that we point at
        // the right one.
        lastPos = codeMirror.posFromIndex(startMark);
        codeMirror.setLineClass(lastPos.line, null, "CodeMirror-line-highlight");
        codeMirror.setMarker(lastPos.line, null, highlightClass);
        lastGutterPointer = makeGutterPointer(codeMirror, highlightClass);

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
        var cursorPosition = codeMirror.getCursor();
        lastElement.hide();
        lastToggle.lastElement = lastElement;
        codeMirror.addWidget(lastPos, lastToggle, false);
        lastToggle.onclick = function() {
          lastToggle.lastElement.toggle(); 
          codeMirror.focus();
        };
        $(lastToggle).attr("class", "hint-marker-positioning hint-marker-" + type).show();
      }
    };

    return relocator;
  };
});
