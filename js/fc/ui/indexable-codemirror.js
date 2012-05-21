"use strict";

// A subclass of CodeMirror which adds a few methods that make it easier
// to work with character indexes rather than {line, ch} objects.
define(["codemirror"], function(CodeMirror) {
  return function IndexableCodeMirror(place, givenOptions) {
    var codeMirror = CodeMirror(place, givenOptions);
  
    // This is the reverse of CodeMirror2's coordsFromIndex() method.
    codeMirror.indexFromCoords = function(pos) {
      var index = pos.ch;
      for (var i = 0; i < pos.line; i++)
        index += codeMirror.getLine(i).length + 1;
      return index;
    };
  
    // Returns the character index of the cursor position.
    codeMirror.getCursorIndex = function() {
      return codeMirror.indexFromCoords(codeMirror.getCursor());
    };
  
    return codeMirror;
  };
});
