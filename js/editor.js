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

// This helper class keeps track of different kinds of highlighting in
// the editor.
function MarkTracker(editor) {
  var classNames = {};
  var marks = [];

  return {
    // Mark a given start/end interval in the editor, based on character
    // indices (not {line, ch} objects), with the given class name.
    mark: function(start, end, className) {
      if (!(className in classNames))
        classNames[className] = true;
      start = editor.coordsFromIndex(start);
      end = editor.coordsFromIndex(end);
      marks.push(editor.markText(start, end, className));
    },
    // Clear all marks made so far.
    clear: function() {
      marks.forEach(function(mark) {
        // Odd, from the CodeMirror docs you'd think this would remove
        // the class from the highlighted text, too, but it doesn't.
        // I guess we're just garbage collecting here.
        mark.clear();
      });
      for (var className in classNames)
        $("." + className, editor.getWrapperElement()).removeClass(className);

      marks = [];
      classNames = {};
    }
  };
}

function Editor(options) {
  var errorArea = options.errorArea;
  var helpArea = options.helpArea;
  
  // Our CodeMirror instance.
  var editor;
  
  // Provides context-sensitive help based on an index in HTML source code.
  var helpIndex = Help.Index();

  // Keep track of context-sensitive help highlighting.
  var cursorHelpMarks = null;

  // Keep track of error highlighting.
  var errorHelpMarks = null;

  // Report the given Slowparse error.
  function reportError(error) {
    errorArea.fillError(error).eachErrorHighlight(function(start, end, i) {
      errorHelpMarks.mark(start, end, "highlight-" + (i+1));
    });
    helpArea.hide();
  }

  // Update the preview area with the given HTML.
  function updatePreview(html) {
    errorArea.hide();
    var doc = options.previewArea.contents()[0];
    doc.open();
    doc.write(html);
    doc.close();
  }

  // Called whenever content of the editor area changes.
  function onChange() {
    var html = editor.getValue();
    var result = Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
    helpIndex.clear();
    errorHelpMarks.clear();
    if (result.error)
      reportError(result.error);
    else {
      helpIndex.build(result.document, html);
      updatePreview(html);
    }
    // Cursor activity would've been fired before us, so call it again
    // to make sure it displays the right context-sensitive help based
    // on the new state of the document.
    onCursorActivity();
  }

  // Called whenever the user moves their cursor in the editor area.
  function onCursorActivity() {
    cursorHelpMarks.clear();
    var help = helpIndex.get(editor.getCursorIndex());
    if (help) {
      var learn = options.templates.find(".learn-more").clone()
        .attr("href", help.url);
      helpArea.html(help.html).append(learn).show();
      help.highlights.forEach(function(interval) {
        cursorHelpMarks.mark(interval.start, interval.end,
                             "cursor-help-highlight");
      });
    } else
      helpArea.hide();
  }

  (function init() {
    // The number of milliseconds to wait before refreshing the preview
    // content and checking the user's HTML for errors.
    var ON_CHANGE_DELAY = 300;
    var onChangeTimeout;
    var cmOptions = JSON.parse(JSON.stringify(options.codeMirror));

    cmOptions.onChange = function() {
      clearTimeout(onChangeTimeout);
      onChangeTimeout = setTimeout(onChange, ON_CHANGE_DELAY);
    };
    cmOptions.onCursorActivity = onCursorActivity;
    editor = IndexableCodeMirror(options.editorArea[0], cmOptions);
    cursorHelpMarks = MarkTracker(editor);
    errorHelpMarks = MarkTracker(editor);
    editor.focus();
    onChange();
    onCursorActivity();
  })();
  
  return {
    codeMirror: editor
  };
}

$(window).load(function() {  
  jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    // We're only exposing the editor as a global so we can debug via
    // the console. Other parts of our code should never reference this.
    window._editor = Editor({
      errorArea: $(".error"),
      helpArea: $(".help"),
      previewArea: $(".preview"),
      editorArea: $("#html-editor"),
      templates: $("#templates"),
      codeMirror: {
        mode: "text/html",
        theme: "jsbin",
        tabMode: "indent",
        lineWrapping: true,
        lineNumbers: true,
        value: $("#initial-html").text().trim(),
      }
    });
    $(window).trigger("editorloaded");
  });
});
