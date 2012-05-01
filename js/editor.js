// The CodeMirror2 editor instance.
var editor;

// Provides context-sensitive help based on an index in HTML source code.
var helpIndex = Help.Index();

// Keep track of CodeMirror2 mark objects corresponding to help
// highlighting.
var cursorHelpMarks = [];

// Select the given {start,end} interval in the editor.
function selectInterval(interval) {
  var start = editor.coordsFromIndex(interval.start);
  var end = editor.coordsFromIndex(interval.end);
  editor.setSelection(start, end);
  editor.focus();
}

// When the user moves over anything with a data-highlight attribute,
// select the text in the editor that corresponds to the highlight.
$(document).on("mouseover", "[data-highlight]", function(event) {
  selectInterval($(this).errorHighlightInterval());
});

// This is the reverse of CodeMirror2's editor.coordsFromIndex().
function getIndexFromPos(editor, pos) {
  var index = pos.ch;
  for (var i = 0; i < pos.line; i++)
    index += editor.getLine(i).length + 1;
  return index;
}

// Report the given Slowparse error.
function reportError(error) {
  $(".error").fillError(error).eachErrorHighlight(setErrorHighlight);
  $(".help").hide();
}

// Assuming "this" is an element with a data-highlight attribute,
// give the highlighted text interval in the editor a numbered error
// highlight class.
function setErrorHighlight(start, end, i) {
  var className = "highlight-" + (i+1);
  var start = editor.coordsFromIndex(start);
  var end = editor.coordsFromIndex(end);
  var mark = editor.markText(start, end, className);
  $(this).addClass(className).data("mark", mark);
}

// Remove all highlights made by setErrorHighlight().
function clearErrorHighlights() {
  $(".error").eachErrorHighlight(function() {
    // Odd, from the CodeMirror docs you'd think this would remove
    // the class from the highlighted text, too, but it doesn't.
    // I guess we're just garbage collecting here.
    $(this).data("mark").clear();
  });
  for (var i = 1; i <= 5; i++)
    $(".CodeMirror .highlight-" + i).removeClass("highlight-" + i);
}

// Update the preview area with the given HTML.
function updatePreview(html) {
  $(".error").hide();
  var doc = $(".preview").contents()[0];
  doc.open();
  doc.write(html);
  doc.close();
}

// Called whenever content of the editor area changes.
function onChange() {
  var html = editor.getValue();
  var result = Slowparse.HTML(document, html, [TreeInspectors.forbidJS]);
  helpIndex.clear();
  clearErrorHighlights();
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
  $(".CodeMirror .highlight").removeClass("cursor-help-highlight");
  cursorHelpMarks.forEach(function(mark) {
    // Odd, from the CodeMirror docs you'd think this would remove
    // the class from the highlighted text, too, but it doesn't.
    // I guess we're just garbage collecting here.
    mark.clear();
  });
  cursorHelpMarks = [];
  var help = helpIndex.get(getIndexFromPos(editor, editor.getCursor()));
  if (help) {
    var learn = $("#templates .learn-more").clone()
      .attr("href", help.url);
    $(".help").html(help.html).append(learn).show();
    help.highlights.forEach(function(interval) {
      var start = editor.coordsFromIndex(interval.start);
      var end = editor.coordsFromIndex(interval.end);
      var mark = editor.markText(start, end, "cursor-help-highlight");
      cursorHelpMarks.push(mark);
    });
  } else
    $(".help").hide();
}

$(window).load(function() {
  // The number of milliseconds to wait before refreshing the preview
  // content and checking the user's HTML for errors.
  var ON_CHANGE_DELAY = 300;
  var onChangeTimeout;
  
  $(".html").val($("#initial-html").text().trim());
  jQuery.loadErrors("slowparse/spec/", ["base", "forbidjs"], function() {
    editor = CodeMirror.fromTextArea($(".html")[0], {
      mode: "text/html",
      theme: "jsbin",
      tabMode: "indent",
      lineWrapping: true,
      lineNumbers: true,
      onChange: function() {
        clearTimeout(onChangeTimeout);
        onChangeTimeout = setTimeout(onChange, ON_CHANGE_DELAY);
      },
      onCursorActivity: onCursorActivity
    });
    editor.focus();
    onChange();
    onCursorActivity();
    $(window).trigger("editorloaded");
  });
});
