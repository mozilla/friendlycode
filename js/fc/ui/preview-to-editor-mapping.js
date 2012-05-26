"use strict";

define([
  "./mark-tracker"
], function(MarkTracker) {
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
    var root, i;
    var htmlNode = docFrag.querySelector("html");
    var origDocFrag = docFrag;
    if (htmlNode && docFrag.querySelector("body")) {
      root = node.ownerDocument.documentElement;
    } else {
      if (!htmlNode) {
        docFrag = document.createDocumentFragment();
        htmlNode = document.createElement("html");
        docFrag.appendChild(htmlNode);
        for (i = 0; i < origDocFrag.childNodes.length; i++)
          htmlNode.appendChild(origDocFrag.childNodes[i]);
      }
      root = node.ownerDocument.body;
    }
    var path = "html " + pathTo(root, node);
    var parallelNode = docFrag.querySelector(path);
    var result = null;
    if (parallelNode)
      result = {
        start: parallelNode.parseInfo.openTag.start,
        end: parallelNode.parseInfo.closeTag.end
      };
    if (origDocFrag != docFrag) {
      for (i = 0; i < htmlNode.childNodes.length; i++)
        origDocFrag.appendChild(htmlNode.childNodes[i]);
    }
    return result;
  }

  function PreviewToEditorMapping(livePreview) {
    var codeMirror = livePreview.codeMirror;
    var marks = MarkTracker(codeMirror);
    livePreview.on("refresh", function(event) {
      var docFrag = event.documentFragment;
      marks.clear();
      event.window.addEventListener("mousedown", function(event) {
        var interval = nodeToCode(event.target, docFrag);
        if (interval) {
          var start = codeMirror.posFromIndex(interval.start);
          var end = codeMirror.posFromIndex(interval.end);
          var startCoords = codeMirror.charCoords(start, "local");
          codeMirror.scrollTo(startCoords.x, startCoords.y);
          marks.clear();
          marks.mark(interval.start, interval.end,
                     "preview-to-editor-highlight");
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
