// An subclass of CodeMirror which adds a few methods that make it easier
// to work with character indexes rather than {line, ch} objects.
function IndexableCodeMirror(place, givenOptions) {
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
}

// A subclass of IndexableCodeMirror which continuously re-parses
// the code in its editor. Also adds a Backbone.Events interface
// for extension points to hook into.
function ParsingCodeMirror(place, givenOptions) {
  // Called whenever content of the editor area changes.
  function reparse() {
    var sourceCode = codeMirror.getValue();
    var result = givenOptions.parse(sourceCode);
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
}

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
  var errorArea = options.errorArea;

  // Keep track of error highlighting.
  var errorHelpMarks = MarkTracker(codeMirror);
  
  // Report the given Slowparse error.
  function reportError(error) {
    errorArea.fillError(error).eachErrorHighlight(function(start, end, i) {
      errorHelpMarks.mark(start, end, "highlight-" + (i+1), this);
    });
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

// This helper saves the editor's data to local storage just before
// the page unloads, and provides a method to restore it. Useful for
// when a user accidentally refreshes/navigates away from the editor
// and wants to retrieve their old content.
//
// TODO: This could be a privacy concern, since people at shared terminals
// might not want the next user to be able to see what they were just
// working on.
function Parachute(window, codeMirror, page) {
  // We would use window.sessionStorage, but it goes away too quickly,
  // e.g. if the user accidentally closes the current window.
  var prefix = "FRIENDLYCODE_PARACHUTE_DATA_";
  var key = prefix + page;
  var storage = window.localStorage;
  var originalData = codeMirror.getValue();
  var self = {
    restore: function() {
      if (key in storage) {
        if (storage[key] == codeMirror.getValue()) {
          // Our saved data is the same as the unmodified data, so there's
          // no need to store it.
          delete storage[key];
        } else {
          codeMirror.setValue(storage[key]);
          self.refresh();
          return true;
        }
      }
      return false;
    },
    save: function() {
      if (codeMirror.getValue() != originalData)
        storage[key] = codeMirror.getValue();
    },
    refresh: function() {
      originalData = codeMirror.getValue();
    },
    listAll: function() {
      var list = [];
      for (var name in storage)
        if (name.indexOf(prefix) == 0)
          list.push(name);
      return list;
    },
    destroyAll: function() {
      window.removeEventListener("beforeunload", self.save, true);
      self.listAll().forEach(function(name) { delete storage[name]; });
    }
  };
  
  window.addEventListener("beforeunload", self.save, true);
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
