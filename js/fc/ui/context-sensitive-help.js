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
    var timeout = null;
    var lastHelp = null;

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
    
    function showHelp(cursorIndex, help) {
      cursorHelpMarks.clear();

      if (help.type == "cssSelector") {
        // TODO: Because we're looking at the generated document fragment and
        // not an actual HTML document, implied elements like <body> may not
        // be captured here.
        var selector = help.highlights[0].value;
        var matches = lastEvent.document.querySelectorAll(selector).length;
        help.matchCount = matches;
      }
      var oldOffset = helpArea.offset();
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
      if (startMark !== null) {
        relocator.relocate(helpArea, startMark, "help");
        var newOffset = helpArea.offset();
        if (newOffset.top != oldOffset.top ||
            newOffset.left != oldOffset.left) {
          helpArea.hide();
          helpArea.fadeIn();
        }
      }
    }

    codeMirror.on("change", function() {
      clearTimeout(timeout);
    });
    
    codeMirror.on("cursor-activity", function() {
      clearTimeout(timeout);

      // people may not want helpful hints
      if ($("#hints-nav-item .checkbox").hasClass("off")) return;

      var cursorIndex = codeMirror.getCursorIndex();
      var help = helpIndex.get(cursorIndex);

      if (JSON.stringify(help) == lastHelp)
        return;

      cursorHelpMarks.clear();
      helpArea.hide();
      relocator.cleanup();
      
      if (help)
        timeout = setTimeout(function() {
          lastHelp = JSON.stringify(help);
          showHelp(cursorIndex, help);
        }, 250);
      else
        lastHelp = null;
    });

    return self;
  };
});