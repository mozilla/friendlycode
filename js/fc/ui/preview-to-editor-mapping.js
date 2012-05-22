"use strict";

define(function() {
  // Given a descendant of the given root element, returns a CSS
  // selector that uniquely selects only the descendant from the
  // root element.
  function pathTo(root, descendant) {
    var target = $(descendant).get(0);
    var parts = [];

    for (var node = target; node && node != root; node = node.parentNode) {
      var n = $(node).prevAll(node.nodeName.toLowerCase()).length + 1;
      var selector = node.nodeName.toLowerCase() + ':nth-of-type(' + n + ')';
      parts.push(selector);
    }
    
    parts.reverse();
    return ' > ' + parts.join(' > ');
  }
  
  function nodeToCode(node, docFrag) {
    var root, path;
    if (docFrag.querySelector("html") && docFrag.querySelector("body")) {
      root = node.ownerDocument.documentElement;
      path = "html " + pathTo(root, node);
    } else {
      root = node.ownerDocument.body;
      path = pathTo(root, node).slice(3);
    }
    var parallelNode = docFrag.querySelector(path);
    if (parallelNode)
      return {
        start: parallelNode.parseInfo.openTag.start,
        end: parallelNode.parseInfo.closeTag.end
      };
    return null;
  }

  function PreviewToEditorMapping(livePreview) {
    var codeMirror = livePreview.codeMirror;
    livePreview.on("refresh", function(event) {
      var docFrag = event.documentFragment;
      event.window.addEventListener("mousedown", function(event) {
        var interval = nodeToCode(event.target, docFrag);
        if (interval) {
          var start = codeMirror.coordsFromIndex(interval.start);
          var end = codeMirror.coordsFromIndex(interval.end);
          codeMirror.setSelection(start, end);
          codeMirror.focus();
          event.preventDefault();
          event.stopPropagation();
        }
      }, true);
    });
  }
  
  PreviewToEditorMapping._pathTo = pathTo;
  PreviewToEditorMapping._nodeToCode = nodeToCode;
  
  return PreviewToEditorMapping;
});
