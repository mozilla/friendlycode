"use strict";

// Provides context-sensitive help for a ParsingCodeMirror based on
// the current cursor position.
define(["./mark-tracker"], function(MarkTracker) {
  return function ContextSensitiveHelp(options) {
    var self = {};
    var codeMirror = options.codeMirror;
    var template = options.template;
    var helpArea = options.helpArea;
    var helpIndex = options.helpIndex;
    var lastEvent = null;
  
    // Keep track of context-sensitive help highlighting.
    var cursorHelpMarks = MarkTracker(codeMirror);
  
    codeMirror.on("reparse", function(event) {
      lastEvent = event;
      helpIndex.clear();
      if (event.error)
        helpArea.hide();
      else
        helpIndex.build(event.document, event.sourceCode);
    });
  
    codeMirror.on("cursor-activity", function() {
      cursorHelpMarks.clear();
      var help = helpIndex.get(codeMirror.getCursorIndex());
      if (help) {
        if (help.type == "cssSelector") {
          // TODO: Because we're looking at the generated document fragment and
          // not an actual HTML document, implied elements like <body> may not
          // be captured here.
          var selector = help.highlights[0].value;
          var matches = lastEvent.document.querySelectorAll(selector).length;
          help.matchCount = matches;
        }
        helpArea.html(template(help)).show();
        help.highlights.forEach(function(interval) {
          cursorHelpMarks.mark(interval.start, interval.end,
                               "cursor-help-highlight");
        });
      } else
        helpArea.hide();
    });
  
    return self;
  };
});