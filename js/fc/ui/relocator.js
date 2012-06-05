"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(function() {
  return function Relocator(codeMirror, codeMirrorScrollArea) {

    var relocator = {
      // called any time the codemirror source code area is scrolled
      scrollFunction: function() {},

      // called any time the browser window is resized
      resizeFunction: function() {},

      // clear old markings
      cleanup: function() {
        $(".CodeMirror-line-highlight").removeClass("CodeMirror-line-highlight");
        $(".help .up-arrow, help. .down-arrow, .error .up-arrow, .error .down-arrow").hide();
        this.scrollFunction = function() {};
      },

      // relocate an element to inside CodeMirror, pointing "at" the line for startMark
      relocate: function(element, startMark) {
        this.cleanup();

        // find the line position for the start mark
        var cmLocation = codeMirror.posFromIndex(startMark);
        var linePre = $($('.CodeMirror-gutter-text pre')[cmLocation.line]);
        linePre.addClass("CodeMirror-line-highlight");

        var contentPre = $($('.CodeMirror-lines pre')[cmLocation.line+2]);
        contentPre.addClass("CodeMirror-line-highlight");

        var hintMarker = $(".hintmarker");

        // move the message to this line
        var _tmp = hintMarker.clone();
        hintMarker.replaceWith(_tmp);
        codeMirrorScrollArea.append(hintMarker);
        _tmp.remove();

        // set the correct "top" value, making sure to place the element
        // below the error if it'd otherwise disappear from the top of
        // the content area due to close-to-zero placement.
        var baseValue = linePre.position().top - element.height() - 20,
            topValue = baseValue;

        if (topValue < 0) {
          topValue = linePre.position().top + 50;
          $(".up-arrow",$(element)).show();
        } else {
          $(".down-arrow",$(element)).show();
        }
        var gutterWidth = $(".CodeMirror-gutter").width();

        // Place hintmarker at the right height
        hintMarker.css({
          "top": topValue + "px",
          "left": gutterWidth + "px"
        });

        // Get its parent-indicated top position, and make
        // the hint box match this hintmarker position
        topValue = hintMarker.position().top;
        element.css({
          "top": topValue + "px",
          "left": gutterWidth + "px"
        });

        // Now, whenever the codemirror scroll area is scrolled, set
        // the hint height to match the hint marker's height so that
        // it looks like the hint box scrolls along with the code.
        this.scrollFunction = function() {
          var topval = hintMarker.position().top;
          element.css("top", topval + "px");
        };

        // Whenever the window is resized, we should get rid of the
        // currently active hint, hiding it and cleaning up. 
        this.resizeFunction = function() {
          element.hide();
          this.cleanup();
        };
      }
    };

    // Set up the onscroll and onresize handling. Note that the
    // function(){...} wrappers are needed to prevent early binding.
    codeMirrorScrollArea.on("scroll", function() { relocator.scrollFunction(); });
    $(window).resize( function() { relocator.resizeFunction(); });

    return relocator;
  };
});
