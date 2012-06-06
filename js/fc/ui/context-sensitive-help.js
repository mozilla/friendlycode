"use strict";

// Provides context-sensitive help for a ParsingCodeMirror based on
// the current cursor position.
define(["./mark-tracker"], function(MarkTracker) {
  return function ContextSensitiveHelp(options) {
    var self = {};
    var codeMirror = options.codeMirror;
    var template = options.template;
    var helpArea = options.helpArea;
    var relocator = options.relocator;
    var helpIndex = options.helpIndex;
    var lastEvent = null;

    // Keep track of context-sensitive help highlighting.
    var cursorHelpMarks = MarkTracker(codeMirror);

    codeMirror.on("reparse", function(event) {
      lastEvent = event;
      relocator.cleanup();
      helpIndex.clear();
      if (event.error) {
        helpArea.hide();
      } else {
        helpIndex.build(event.document, event.sourceCode);
      }
    });

    codeMirror.on("cursor-activity", function() {
      cursorHelpMarks.clear();

      // people may not want helpful hints
      if ($("#hints-nav-item").hasClass("off")) return;

      var cursorIndex = codeMirror.getCursorIndex();
      var help = helpIndex.get(cursorIndex);

      if (!help) {
        if (helpArea.is(":visible")) {
          helpArea.hide();
          relocator.cleanup();
        }
        return;
      }

      if (help.type == "cssSelector") {
        // TODO: Because we're looking at the generated document fragment and
        // not an actual HTML document, implied elements like <body> may not
        // be captured here.
        var selector = help.highlights[0].value;
        var matches = lastEvent.document.querySelectorAll(selector).length;
        help.matchCount = matches;
      }
      helpArea.html(template(help)).show();
      var startMark = null;
      help.highlights.forEach(function(interval) {
        var start = interval.start,
            end = interval.end;
        // Show the help message closest to the highlight that
        // encloses the current cursor position.
        if (start <= cursorIndex && end >= cursorIndex)
          startMark = start;
        cursorHelpMarks.mark(start, end, "cursor-help-highlight");
      });
      if (startMark !== null)
        relocator.relocate(helpArea, startMark);
    });

    return self;
  };
});