"use strict";

// A subclass of IndexableCodeMirror which continuously re-parses
// the code in its editor. Also adds a Backbone.Events interface
// for extension points to hook into.
define([
  'underscore',
  "fc/ui/indexable-codemirror",
  "slowparse/tree-inspectors",
  "slowparse/slowparse"
], function(_, IndexableCodeMirror, TreeInspectors, Slowparse) {

  function parseSource (html) {
    return Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
  }

  return function ParsingCodeMirror(place, givenOptions) {
    // Called whenever content of the editor area changes.
    function reparse() {
      var sourceCode = codeMirror.getValue();
      var result = parseSource(sourceCode);
      codeMirror.trigger("reparse", {
        error: result.error,
        sourceCode: sourceCode,
        document: result.document
      });
      // Cursor activity would've been fired before us, so call it again
      // to make sure it displays the right context-sensitive help based
      // on the new state of the document.
      onCursorActivity();
    }

    // Called whenever the user moves their cursor in the editor area.
    function onCursorActivity() {
      codeMirror.trigger("cursor-activity");
    }

    // The number of milliseconds to wait before re-parsing the editor
    // content.
    var parseDelay = givenOptions.parseDelay || 300;
    var time = givenOptions.time || window;
    var reparseTimeout;

    givenOptions.onChange = function() {
      codeMirror.trigger("change");
      if (reparseTimeout !== undefined)
        time.clearTimeout(reparseTimeout);
      reparseTimeout = time.setTimeout(reparse, parseDelay);
    };
    givenOptions.onCursorActivity = onCursorActivity;

    var codeMirror = IndexableCodeMirror(place, givenOptions);
    _.extend(codeMirror, Backbone.Events);
    codeMirror.reparse = reparse;
    return codeMirror;
  };
});
