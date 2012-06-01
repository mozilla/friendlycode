"use strict";

// code will relocate an error or help message to near where the error actually is in CodeMirror.
define(function() {
  return function Relocator(codeMirror) {
    return {
      // clear old markings
      cleanup: function() {
        $(".CodeMirror-line-highlight").removeClass("CodeMirror-line-highlight");
        $(".help .up-arrow, help. .down-arrow, .error .up-arrow, .error .down-arrow").hide();
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

        // move the message to this line
        var _tmp = element.clone();
        element.replaceWith(_tmp);
        $(".CodeMirror-scroll").append(element);
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
        element.css("top", topValue + "px").css("left", $(".CodeMirror-gutter").width()+"px");
      }
    };
  };
});
  