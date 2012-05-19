"use strict";

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
