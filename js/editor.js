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
  var reparseTimeout;

  givenOptions.onChange = function() {
    clearTimeout(reparseTimeout);
    reparseTimeout = setTimeout(reparse, parseDelay);
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
  var templates = options.templates;
  var helpArea = options.helpArea;
  var helpIndex = options.helpIndex;

  // Keep track of context-sensitive help highlighting.
  var cursorHelpMarks = MarkTracker(codeMirror);

  codeMirror.on("reparse", function(event) {
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
      var learn = templates.find(".learn-more").clone()
        .attr("href", help.url);
      helpArea.html(help.html).append(learn).show();
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
    if (!event.error) {
      // Update the preview area with the given HTML.
      var doc = options.previewArea.contents()[0];
      doc.open();
      doc.write(event.sourceCode);
      doc.close();
    }
  });
  
  return self;
}

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return unescape(pair[1]);
    }
  }
}

$(window).load(function() {
  jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    var codeMirror = ParsingCodeMirror($("#source")[0], {
      mode: "text/html",
      theme: "jsbin",
      tabMode: "indent",
      lineWrapping: true,
      lineNumbers: true,
      value: $("#initial-html").text().trim(),
      parse: function(html) {
        return Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
      }
    });
    var cursorHelp = ContextSensitiveHelp({
      codeMirror: codeMirror,
      helpIndex: Help.Index(),
      templates: $("#templates"),
      helpArea: $(".help")
    });
    var errorHelp = ErrorHelp({
      codeMirror: codeMirror,
      errorArea: $(".error")
    });
    var preview = LivePreview({
      codeMirror: codeMirror,
      previewArea: $("#preview")
    });
    var publisher = Publisher({
      codeMirror: codeMirror,
      publishURL: "http://wpm.toolness.org",
      dialog: $("#publish-dialog")
    });
    codeMirror.reparse();
    codeMirror.focus();

    $("#undo").click(function() { codeMirror.undo(); });
    $("#redo").click(function() { codeMirror.redo(); });
    $("#publish").click(function() { publisher.saveCode(); });

    if (getQueryVariable('p'))
      publisher.loadCode(getQueryVariable('p'));

    // We're only exposing the editor as a global so we can debug via
    // the console. Other parts of our code should never reference this.
    window._codeMirror = codeMirror;
  });
});
