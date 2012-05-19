"use strict";

// This helper class keeps track of different kinds of highlighting in
// a CodeMirror instance.
function MarkTracker(codeMirror) {
  var classNames = {};
  var marks = [];

  return {
    // Mark a given start/end interval in the CodeMirror, based on character
    // indices (not {line, ch} objects), with the given class name. If
    // an element is provided, give it the class name too.
    mark: function(start, end, className, element) {
      if (!(className in classNames))
        classNames[className] = [];
      if (element) {
        classNames[className].push(element);
        $(element).addClass(className);
      }
      start = codeMirror.coordsFromIndex(start);
      end = codeMirror.coordsFromIndex(end);
      marks.push(codeMirror.markText(start, end, className));
    },
    // Clear all marks made so far and remove the class from any elements
    // it was previously given to.
    clear: function() {
      marks.forEach(function(mark) {
        // Odd, from the CodeMirror docs you'd think this would remove
        // the class from the highlighted text, too, but it doesn't.
        // I guess we're just garbage collecting here.
        mark.clear();
      });
      var wrapper = codeMirror.getWrapperElement();
      for (var className in classNames) {
        classNames[className].forEach(function(element) {
          $(element).removeClass(className);
        });
        $("." + className, wrapper).removeClass(className);
      }
      
      marks = [];
      classNames = {};
    }
  };
}

// Provides context-sensitive help for a ParsingCodeMirror based on
// the current cursor position.
function ContextSensitiveHelp(options) {
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
}

// Provides helpful Slowparse-based error suggestions for a
// ParsingCodeMirror.
function ErrorHelp(options) {
  var self = {};
  var codeMirror = options.codeMirror;
  var template = options.template;
  var errorArea = options.errorArea;

  // Keep track of error highlighting.
  var errorHelpMarks = MarkTracker(codeMirror);
  
  // Report the given Slowparse error.
  function reportError(error) {
    var errorHTML = $("<div></div>").fillError(error).eachErrorHighlight(function(start, end, i) {
      errorHelpMarks.mark(start, end, "highlight-" + (i+1), this);
    });
    errorArea.html(template({error: errorHTML.html()})).show();
  }
  
  codeMirror.on("reparse", function(event) {
    errorHelpMarks.clear();
    if (event.error)
      reportError(event.error);
    else
      errorArea.hide();
  });
  return self;
}

// Displays the HTML source of a CodeMirror editor as a rendered preview
// in an iframe.
function LivePreview(options) {
  var self = {};
  
  options.codeMirror.on("reparse", function(event) {
    if (!event.error || options.ignoreErrors) {
      // Update the preview area with the given HTML.
      var doc = options.previewArea.contents()[0];
      var wind = doc.defaultView;
      var x = wind.pageXOffset;
      var y = wind.pageYOffset;

      doc.open();
      doc.write(event.sourceCode);
      doc.close();

      // Insert a BASE TARGET tag so that links don't open in
      // the iframe.
      var baseTag = doc.createElement('base');
      baseTag.setAttribute('target', '_blank');
      doc.querySelector("head").appendChild(baseTag);

      // TODO: If the document has images that take a while to load
      // and the previous scroll position of the document depends on
      // their dimensions being set on load, we may need to refresh
      // this scroll position after the document has loaded.
      wind.scroll(x, y);
    }
  });
  
  return self;
}

// This manages the UI for undo/redo.
function HistoryUI(options) {
  var undo = options.undo;
  var redo = options.redo;
  var codeMirror = options.codeMirror;

  function refreshButtons() {
    var history = codeMirror.historySize();
    undo.toggleClass("enabled", history.undo == 0 ? false : true);
    redo.toggleClass("enabled", history.redo == 0 ? false : true);
  }
  
  undo.click(function() {
    codeMirror.undo();
    codeMirror.reparse();
    refreshButtons();
  });
  redo.click(function() {
    codeMirror.redo();
    codeMirror.reparse();
    refreshButtons();
  });
  codeMirror.on("change", refreshButtons);
  refreshButtons();
  return {refresh: refreshButtons};
}
